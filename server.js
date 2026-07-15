const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { put, del, list } = require('@vercel/blob');

const app = express();
const PORT = process.env.PORT || 3000;

const SECTIONS = ['kitchen', 'washroom', 'floor', 'stairs', 'roof'];
const BASE_DIR = __dirname;
const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Auth Middleware
const basicAuth = (req, res, next) => {
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  if (login === 'hamza' && password === '01hamza@') {
    return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="401"');
  res.status(401).send('Authentication required.');
};

app.use('/admin.html', basicAuth);

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(BASE_DIR, 'views', 'admin.html'));
});

app.use('/api/upload', basicAuth);
app.use('/api/delete', basicAuth);

// Serve frontend files
app.use(express.static(path.join(BASE_DIR, 'public')));
// Serve local images
app.use(express.static(path.join(BASE_DIR, 'uploads')));

// Multer setup for local fallback
const upload = multer({
  storage: USE_BLOB ? multer.memoryStorage() : multer.diskStorage({
    destination: (req, file, cb) => {
      const category = req.body.category;
      if (!SECTIONS.includes(category)) return cb(new Error('Invalid category'), false);
      const dir = path.join(BASE_DIR, 'uploads', category);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path.basename(file.originalname, ext);
      cb(null, `${name}-${Date.now()}${ext}`);
    }
  })
});

// 1. Get Manifest
app.get('/api/manifest', async (req, res) => {
  const manifest = {};
  
  if (USE_BLOB) {
    try {
      const { blobs } = await list();
      SECTIONS.forEach(section => manifest[section] = []);
      blobs.forEach(blob => {
        const parts = blob.pathname.split('/');
        if (parts.length === 2 && SECTIONS.includes(parts[0])) {
          manifest[parts[0]].push({ filename: parts[1], url: blob.url });
        }
      });
      res.json(manifest);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch from Vercel Blob' });
    }
  } else {
    // Local File System
    SECTIONS.forEach(section => {
      const dir = path.join(BASE_DIR, 'uploads', section);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
        manifest[section] = files.map(f => ({ filename: f, url: `/${section}/${encodeURIComponent(f)}` }));
      } else {
        manifest[section] = [];
      }
    });
    res.json(manifest);
  }
});

// 2. Upload Image
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const category = req.body.category;

  if (USE_BLOB) {
    try {
      const ext = path.extname(req.file.originalname);
      const name = path.basename(req.file.originalname, ext);
      const blobPath = `${category}/${name}-${Date.now()}${ext}`;
      
      const blob = await put(blobPath, req.file.buffer, {
        access: 'public',
        contentType: req.file.mimetype
      });
      res.json({ success: true, file: blobPath, url: blob.url });
    } catch (err) {
      res.status(500).json({ error: 'Vercel Blob upload failed: ' + err.message });
    }
  } else {
    res.json({ success: true, file: req.file.filename, url: `/${category}/${encodeURIComponent(req.file.filename)}` });
  }
});

// 3. Delete Image
app.delete('/api/delete', async (req, res) => {
  const { category, filename, url } = req.body;
  if (!SECTIONS.includes(category) || !filename) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  if (USE_BLOB && url) {
    try {
      await del(url);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete from Vercel Blob' });
    }
  } else {
    const filePath = path.join(BASE_DIR, 'uploads', category, filename);
    if (!filePath.startsWith(path.join(BASE_DIR, 'uploads', category))) return res.status(403).json({ error: 'Forbidden' });
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'File not found locally' });
    }
  }
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Blob Storage: ${USE_BLOB ? 'ENABLED' : 'DISABLED (Using local storage)'}`);
  });
}

// Export for Vercel Serverless
module.exports = app;
