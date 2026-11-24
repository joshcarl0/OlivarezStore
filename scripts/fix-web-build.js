// Vercel strips any "node_modules" folder on deploy, which removes the icon fonts.
// Rename dist/assets/node_modules -> dist/assets/vendor and fix all references.
const fs = require('fs');
const path = require('path');

const dist = path.join(__dirname, '..', 'dist');
const from = path.join(dist, 'assets', 'node_modules');
const to = path.join(dist, 'assets', 'vendor');

if (fs.existsSync(from)) {
  fs.renameSync(from, to);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|html|json|css)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      if (text.includes('assets/node_modules')) {
        fs.writeFileSync(full, text.split('assets/node_modules').join('assets/vendor'));
      }
    }
  }
}

walk(dist);
console.log('Web build fixed: assets/node_modules -> assets/vendor');
