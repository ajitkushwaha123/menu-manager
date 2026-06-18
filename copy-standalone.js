const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const standaloneStaticDir = path.join(__dirname, '.next', 'standalone', '.next', 'static');
const standalonePublicDir = path.join(__dirname, '.next', 'standalone', 'public');

copyDir(path.join(__dirname, '.next', 'static'), standaloneStaticDir);
copyDir(path.join(__dirname, 'public'), standalonePublicDir);

console.log('Copied .next/static and public to .next/standalone');
