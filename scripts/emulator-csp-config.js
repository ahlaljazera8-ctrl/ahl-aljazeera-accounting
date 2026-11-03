// Write a copy of firebase.json whose CSP also allows the local emulators.
// firebase.json itself stays production-only: no http://127.0.0.1 origins.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const CONNECT = ['http://127.0.0.1:9099', 'http://127.0.0.1:8080'];
const FRAME = ['http://127.0.0.1:9099'];

function inject(csp) {
  if (/127\.0\.0\.1/.test(csp)) throw new Error('firebase.json CSP must not include emulator origins');
  let connect = false;
  let frame = false;
  const out = csp
    .split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .map(part => {
      const bits = part.split(/\s+/);
      if (bits[0] === 'connect-src') {
        connect = true;
        return bits.concat(CONNECT).join(' ');
      }
      if (bits[0] === 'frame-src') {
        frame = true;
        return bits.concat(FRAME).join(' ');
      }
      return part;
    });
  if (!connect || !frame) throw new Error('CSP is missing connect-src or frame-src');
  return out.join('; ');
}

function fromFile(src) {
  const cfg = JSON.parse(fs.readFileSync(src || path.join(ROOT, 'firebase.json'), 'utf8'));
  const block = (cfg.hosting.headers || []).find(h => h.source === '**');
  const header = block && (block.headers || []).find(h => h.key === 'Content-Security-Policy');
  if (!header) throw new Error('firebase.json has no Content-Security-Policy for **');
  header.value = inject(header.value);
  return JSON.stringify(cfg, null, 2) + '\n';
}

if (require.main === module) {
  const dest = process.argv[2];
  if (!dest) {
    console.error('usage: node scripts/emulator-csp-config.js <dest.json>');
    process.exit(1);
  }
  fs.writeFileSync(dest, fromFile(path.join(ROOT, 'firebase.json')));
}

module.exports = { inject, fromFile };
