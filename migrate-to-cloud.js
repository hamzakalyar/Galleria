const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

// Grab the token from the environment
const token = process.env.BLOB_READ_WRITE_TOKEN;

if (!token) {
  console.error("=========================================================");
  console.error("ERROR: BLOB_READ_WRITE_TOKEN is missing!");
  console.error("Please run the script with your token like this (in PowerShell):");
  console.error("$env:BLOB_READ_WRITE_TOKEN=\"your_token_here\"; node migrate-to-cloud.js");
  console.error("=========================================================");
  process.exit(1);
}

const SECTIONS = ['kitchen', 'washroom', 'floor', 'stairs', 'roof'];
const BASE_DIR = path.join(__dirname, 'uploads');

async function migrate() {
  console.log("Starting cloud migration...");
  
  for (const section of SECTIONS) {
    const dir = path.join(BASE_DIR, section);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
    
    if (files.length > 0) {
      console.log(`\nFound ${files.length} images in ${section}...`);
    }

    for (const file of files) {
      const filePath = path.join(dir, file);
      const buffer = fs.readFileSync(filePath);
      
      // We will keep the exact same filename in the cloud
      const blobPath = `${section}/${file}`; 

      console.log(`Uploading: ${blobPath}`);
      try {
        // Upload to Vercel Blob
        await put(blobPath, buffer, {
          access: 'public',
          token: token // Explicitly pass the token to the SDK
        });
        console.log(`  -> Success`);
      } catch (err) {
        console.error(`  -> Failed:`, err.message);
      }
    }
  }
  
  console.log("\nMigration completely finished! Refresh your live website!");
}

migrate();
