'use strict';
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

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

function logged(message, child) {
  const extra = child && typeof child.devtoolsLog === 'function' ? String(child.devtoolsLog() || '').trim() : '';
  return extra ? message + '\n' + extra : message;
}

function debugPort(dir, log) {
  const file = path.join(dir, 'DevToolsActivePort');
  let text = '';
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { text = ''; }
  const fromFile = Number(String(text).split('\n')[0].trim());
  if (Number.isInteger(fromFile) && fromFile > 0 && fromFile <= 65535) return fromFile;
  const heard = String(log || '').match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
  if (!heard) return null;
  const fromLog = Number(heard[1]);
  return Number.isInteger(fromLog) && fromLog > 0 ? fromLog : null;
}

function stopChrome(chrome, detached) {
  if (!chrome || !chrome.pid) return;
  if (detached) {
    try { process.kill(-chrome.pid, 'SIGKILL'); return; } catch (e) {}
  }
  try { chrome.kill('SIGKILL'); } catch (e) {}
}

async function waitForPage(port, child, attempts) {
  const n = attempts == null ? ATTEMPTS : attempts;
  let last = 'no reply';
  for (let i = 0; i < n; i++) {
    if (child && child.exitCode != null) {
      throw new Error(logged('Chrome exited before opening a page (code ' + child.exitCode + ', ' + last + ')', child));
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
  throw new Error(logged('Chrome did not open a page (' + last + gone + ')', child));
}

async function openChrome(opts) {
  const dir = opts && opts.userDataDir;
  if (!dir) throw new Error('openChrome needs a userDataDir');
  const detached = !!(opts && opts.detached);
  fs.mkdirSync(dir, { recursive: true });
  for (const name of ['SingletonLock', 'SingletonSocket', 'SingletonCookie', 'DevToolsActivePort']) {
    fs.rmSync(path.join(dir, name), { force: true });
  }
  const chrome = spawn('google-chrome', [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-address=127.0.0.1', '--remote-allow-origins=*',
    '--remote-debugging-port=0', '--user-data-dir=' + dir, 'about:blank',
  ], { detached, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  const keep = chunk => { log = (log + chunk).slice(-8000); };
  chrome.stdout.on('data', keep);
  chrome.stderr.on('data', keep);
  chrome.devtoolsLog = () => log;
  const attempts = opts.attempts == null ? ATTEMPTS : opts.attempts;
  let port = null;
  let last = 'no DevToolsActivePort';
  for (let i = 0; i < attempts; i++) {
    if (chrome.exitCode != null) {
      stopChrome(chrome, detached);
      throw new Error(logged('Chrome exited before opening a debug port (code ' + chrome.exitCode + ')', chrome));
    }
    port = debugPort(dir, log);
    if (port) break;
    await sleep(GAP_MS);
  }
  if (!port) {
    stopChrome(chrome, detached);
    throw new Error(logged('Chrome did not open a debug port (' + last + ')', chrome));
  }
  try {
    const page = await waitForPage(port, chrome, attempts);
    return { chrome, port, page };
  } catch (err) {
    stopChrome(chrome, detached);
    throw err;
  }
}

module.exports = { waitForPage, openChrome, debugPort, ATTEMPTS, GAP_MS };
