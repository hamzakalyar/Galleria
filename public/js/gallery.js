"use strict";

const SECTIONS = [
  { id: "floor",    label: "Floor"    },
  { id: "stairs",   label: "Stairs"   },
  { id: "roof",     label: "Roof"     },
  { id: "washroom", label: "Washroom" },
  { id: "kitchen",  label: "Kitchen"  },
];

let manifest     = {};
let allImages    = [];
let filtered     = [];
let activeFilter = "all";

const FEATURED_PAGE = 3;
const ARCHIVE_PAGE  = 12;
let featuredVisible = FEATURED_PAGE;
let archiveVisible  = ARCHIVE_PAGE;
let slideshowIntervals = [];

const heroBgImg       = document.getElementById("heroBgImg");
const navbar          = document.getElementById("navbar");
const featuredGrid    = document.getElementById("featuredGrid");
const featuredLoadWrap= document.getElementById("featuredLoadMore");
const featuredLoadBtn = document.getElementById("featuredLoadBtn");
const masonryGrid     = document.getElementById("masonryGrid");
const galleryLoadWrap = document.getElementById("galleryLoadMore");
const galleryLoadBtn  = document.getElementById("galleryLoadBtn");
const galleryFilters  = document.getElementById("galleryFilters");
const lightbox        = document.getElementById("lightbox");
const lbImg           = document.getElementById("lbImg");
const lbClose         = document.getElementById("lbClose");
const lbPrev          = document.getElementById("lbPrev");
const lbNext          = document.getElementById("lbNext");
const footerYear      = document.getElementById("footerYear");

let lbIndex = 0;

function enc(name) { return name.split("/").map(encodeURIComponent).join("/"); }

function initReveal() {
  const obs = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("active"); }),
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );
  document.querySelectorAll(".reveal:not(.active)").forEach(el => obs.observe(el));
}

function setHeroImage() {
  const specificImage = "kitchen/" + enc("WhatsApp Image 2026-07-10 at 17.32.31.jpeg");
  heroBgImg.src = specificImage;
  heroBgImg.addEventListener("load", () => heroBgImg.classList.add("loaded"), { once: true });
}

function renderFeatured() {
  const sections = ["kitchen", "washroom", "ceiling", "floor", "stairs"];
  let categoriesData = [];
  
  sections.forEach(sec => {
    const sectionImages = allImages.filter(im => im.section.toLowerCase() === sec);
    if (sectionImages.length > 0) {
      categoriesData.push({
        section: sectionImages[0].section,
        images: sectionImages
      });
    }
  });

  slideshowIntervals.forEach(clearInterval);
  slideshowIntervals = [];

  featuredGrid.innerHTML = "";
  const visibleCategories = categoriesData.slice(0, featuredVisible);
  
  visibleCategories.forEach((catData) => {
    const displayName = catData.section + " Collection";

    const div = document.createElement("div");
    div.className = "featured-item reveal";
    
    let imgTags = "";
    catData.images.forEach((img, idx) => {
      const activeClass = idx === 0 ? "active" : "";
      imgTags += `<img src="${img.src}" alt="${img.filename}" class="slideshow-img ${activeClass}" loading="lazy" />`;
    });

    div.innerHTML = `
      <div class="featured-img-wrapper">
        ${imgTags}
      </div>
      <div class="featured-meta">
        <h3 class="featured-title">${displayName}</h3>
        <span class="featured-cat">${catData.section}</span>
      </div>`;
      
    div.addEventListener("click", () => {
      activeFilter = catData.section.toLowerCase();
      archiveVisible = ARCHIVE_PAGE;
      renderArchive();
      setActiveFilter(activeFilter);
      document.getElementById("gallery").scrollIntoView({ behavior:"smooth" });
    });
    featuredGrid.appendChild(div);

    if (catData.images.length > 1) {
      const imgs = div.querySelectorAll('.slideshow-img');
      let currentIdx = 0;
      const interval = setInterval(() => {
        imgs[currentIdx].classList.remove('active');
        currentIdx = (currentIdx + 1) % imgs.length;
        imgs[currentIdx].classList.add('active');
      }, 3000 + Math.random() * 1000);
      slideshowIntervals.push(interval);
    }
  });

  if (categoriesData.length > FEATURED_PAGE) {
    featuredLoadWrap.style.display = "block";
    featuredLoadBtn.textContent = featuredVisible >= categoriesData.length ? "Show Less" : "Load More";
  } else {
    featuredLoadWrap.style.display = "none";
  }
  initReveal();
}

function renderArchive() {
  filtered = activeFilter === "all"
    ? allImages
    : allImages.filter(im => im.section.toLowerCase() === activeFilter);

  const items = filtered.slice(0, archiveVisible);
  masonryGrid.innerHTML = "";
  items.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "masonry-item reveal";
    div.innerHTML = `
      <div class="masonry-img-wrapper">
        <img src="${item.src}" alt="${item.filename}" loading="lazy" />
      </div>
      <div class="masonry-item-overlay"><span>${item.section}</span></div>`;
    div.addEventListener("click", () => openLightbox(idx));
    masonryGrid.appendChild(div);
  });

  if (filtered.length > ARCHIVE_PAGE) {
    galleryLoadWrap.style.display = "block";
    galleryLoadBtn.textContent = archiveVisible >= filtered.length ? "Show Less" : "Load More";
  } else {
    galleryLoadWrap.style.display = "none";
  }
  initReveal();
}

function setActiveFilter(cat) {
  document.querySelectorAll(".filter-btn").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.cat === cat));
}

galleryFilters.addEventListener("click", e => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  activeFilter = btn.dataset.cat;
  archiveVisible = ARCHIVE_PAGE;
  setActiveFilter(activeFilter);
  renderArchive();
});

featuredLoadBtn.addEventListener("click", () => {
  if (featuredLoadBtn.textContent === "Show Less") {
    featuredVisible = FEATURED_PAGE;
    document.getElementById("selected-works").scrollIntoView({ behavior: "smooth" });
  } else {
    featuredVisible += FEATURED_PAGE;
  }
  renderFeatured();
});

galleryLoadBtn.addEventListener("click", () => {
  if (galleryLoadBtn.textContent === "Show Less") {
    archiveVisible = ARCHIVE_PAGE;
    document.getElementById("gallery").scrollIntoView({ behavior: "smooth" });
  } else {
    archiveVisible += ARCHIVE_PAGE;
  }
  renderArchive();
});

function openLightbox(idx) {
  lbIndex = idx;
  renderLb();
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
}
function renderLb() {
  const item = filtered[lbIndex];
  if (!item) return;
  lbImg.src = item.src;
  lbImg.alt = item.filename;
}
function lbGo(dir) {
  lbIndex = (lbIndex + dir + filtered.length) % filtered.length;
  lbImg.style.opacity = "0";
  setTimeout(() => { renderLb(); lbImg.style.opacity = "1"; }, 200);
}

lbClose.addEventListener("click", closeLightbox);
lbPrev.addEventListener("click",  () => lbGo(-1));
lbNext.addEventListener("click",  () => lbGo(1));
lightbox.addEventListener("click", e => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", e => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape")     closeLightbox();
  if (e.key === "ArrowLeft")  lbGo(-1);
  if (e.key === "ArrowRight") lbGo(1);
});
let tx = 0;
lightbox.addEventListener("touchstart", e => { tx = e.changedTouches[0].clientX; }, { passive:true });
lightbox.addEventListener("touchend",   e => {
  const d = e.changedTouches[0].clientX - tx;
  if (Math.abs(d) > 50) lbGo(d < 0 ? 1 : -1);
}, { passive:true });

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 10);
}, { passive:true });

document.querySelectorAll(".nav-link[data-cat]").forEach(link => {
  link.addEventListener("click", () => {
    activeFilter = link.dataset.cat;
    archiveVisible = ARCHIVE_PAGE;
    renderArchive();
    setActiveFilter(activeFilter);
  });
});

footerYear.textContent = new Date().getFullYear();

async function init() {
  try {
    const res = await fetch("/api/manifest");
    if (!res.ok) throw new Error("HTTP " + res.status);
    manifest = await res.json();
  } catch(err) {
    featuredGrid.innerHTML = `<p style="color:#999;padding:2rem 0;grid-column:1/-1">
      Could not load manifest from server — please start the backend with <code>node server.js</code> and visit http://localhost:3000
    </p>`;
    return;
  }

  const ORDER = ["kitchen","washroom","floor","stairs","roof"];
  allImages = [];
  for (const id of ORDER) {
    (manifest[id] || []).forEach(fileObj => {
      allImages.push({
        src: fileObj.url,
        filename: fileObj.filename,
        section: id === "roof" ? "Ceiling" : id.charAt(0).toUpperCase() + id.slice(1),
      });
    });
  }

  setHeroImage();
  renderFeatured();
  renderArchive();
  initReveal();
}

init();