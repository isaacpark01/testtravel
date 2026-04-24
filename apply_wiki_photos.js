// apply_wiki_photos.js — applies wiki_photos.json to data.js
const fs = require('fs');

const photos = JSON.parse(fs.readFileSync('./wiki_photos.json', 'utf8'));

function applyPhoto(src, name, url) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(
    `(["']?name["']?\\s*:\\s*["']${esc}["'][\\s\\S]{0,700}?["']?photo["']?\\s*:\\s*["'])([^"']+)(["'])`,
    'g'
  );
  const after = src.replace(re, `$1${url}$3`);
  return { src: after, changed: after !== src };
}

let src = fs.readFileSync('./data.js', 'utf8');
let patched = 0, skipped = 0;

for (const [name, url] of Object.entries(photos)) {
  const { src: newSrc, changed } = applyPhoto(src, name, url);
  if (changed) { src = newSrc; patched++; }
  else skipped++;
}

fs.writeFileSync('./data.js', src);
console.log(`Wiki photos applied: ${patched} patched, ${skipped} not matched in data.js`);
