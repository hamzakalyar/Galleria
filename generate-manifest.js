/**
 * generate-manifest.js
 * ─────────────────────
 * Scans the five image folders and writes manifest.json.
 *
 * Usage:
 *   node generate-manifest.js
 *
 * Run this once, and again any time you add or remove images.
 */

"use strict";

const fs   = require("fs");
const path = require("path");

const SECTIONS   = ["floor", "stairs", "roof", "washroom", "kitchen"];
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".bmp", ".tiff"]);

const manifest = {};

for (const section of SECTIONS) {
  const dir = path.join(__dirname, section);

  if (!fs.existsSync(dir)) {
    console.warn(`  Warning: folder not found – ${dir}`);
    manifest[section] = [];
    continue;
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
    .sort();

  manifest[section] = files;
  console.log(`  OK  ${section.padEnd(12)} ${files.length} image(s)`);
}

fs.writeFileSync(
  path.join(__dirname, "manifest.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);

console.log("\nmanifest.json written successfully.");
