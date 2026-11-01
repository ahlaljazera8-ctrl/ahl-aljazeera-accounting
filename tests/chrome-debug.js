'use strict';
const http = require('http');

// Run 41287927052 gave up while the first headless Chrome was still down
// (13.7s, then 10.1s). The next launch in that job connected. 30s covers
// that startup. A process that has already exited fails on the first look.
const ATTEMPTS = 150;
const GAP_MS = 200;

function debuggerText(port, pathname) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path: pathname, timeout: 2000 }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve(body.replace(/^\)\]\}'\s*/, '')));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('debugger timeout')); });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForPage(port, child, attempts) {
  const n = attempts == null ? ATTEMPTS : attempts;
  let last = 'no reply';
  for (let i = 0; i < n; i++) {
    if (child && child.exitCode != null) {
      throw new Error('Chrome exited before opening a page (code ' + child.exitCode + ', ' + last + ')');
    }
    try {
      const list = JSON.parse(await debuggerText(port, '/json/list'));
      const tgt = Array.isArray(list) && list.find(t => t && t.type === 'page' && t.webSocketDebuggerUrl);
      if (tgt) return tgt;
      last = 'no page';
    } catch (err) {
      last = String((err && err.code) || (err && err.message) || err);
    }
    await sleep(GAP_MS);
  }
  const gone = child && child.exitCode != null ? ', exit ' + child.exitCode : '';
  throw new Error('Chrome did not open a page (' + last + gone + ')');
}

module.exports = { waitForPage, ATTEMPTS, GAP_MS };
