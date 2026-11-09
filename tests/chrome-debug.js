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

const devtoolsLogs = new WeakMap();

function chromeLog(chrome) {
  const held = chrome && devtoolsLogs.get(chrome);
  if (held) return String(held.text || '');
  if (chrome && typeof chrome.devtoolsLog === 'function') return String(chrome.devtoolsLog() || '');
  return '';
}

function logged(message, child) {
  const extra = chromeLog(child).trim();
  return extra ? message + '\n' + extra : message;
}

function debugPort(dir, log) {
  const file = path.join(dir, 'DevToolsActivePort');
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch (e) { text = ''; }
  const fromFile = Number(String(text).split('\n')[0].trim());
  if (Number.isInteger(fromFile) && fromFile > 0 && fromFile <= 65535) return fromFile;
  const heard = String(log || '').match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//);
  if (!heard) return null;
  const fromLog = Number(heard[1]);
  return Number.isInteger(fromLog) && fromLog > 0 ? fromLog : null;
}

function descendantPids(root) {
  const children = new Map();
  let names;
  try {
    names = fs.readdirSync('/proc');
  } catch (e) {
    return [];
  }
  for (const name of names) {
    if (!/^[0-9]+$/.test(name)) continue;
    let stat;
    try {
      stat = fs.readFileSync('/proc/' + name + '/stat', 'utf8');
    } catch (e) {
      continue;
    }
    const close = stat.lastIndexOf(')');
    if (close < 0) continue;
    const ppid = Number(stat.slice(close + 2).split(' ')[1]);
    if (!Number.isInteger(ppid)) continue;
    const pid = Number(name);
    if (!children.has(ppid)) children.set(ppid, []);
    children.get(ppid).push(pid);
  }
  const out = [];
  const stack = (children.get(root) || []).slice();
  const seen = new Set();
  while (stack.length) {
    const pid = stack.pop();
    if (pid == null || seen.has(pid)) continue;
    seen.add(pid);
    out.push(pid);
    for (const kid of children.get(pid) || []) stack.push(kid);
  }
  return out;
}

function stopChrome(chrome, detached) {
  if (!chrome || !chrome.pid) return;
  const pid = chrome.pid;
  const descendants = descendantPids(pid);
  if (detached) {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch (e) {}
  }
  for (const child of descendants) {
    try {
      process.kill(child, 'SIGKILL');
    } catch (e) {}
  }
  try {
    chrome.kill('SIGKILL');
  } catch (e) {}
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

function clearProfileLocks(dir) {
  for (const name of ['SingletonLock', 'SingletonSocket', 'SingletonCookie', 'DevToolsActivePort']) {
    fs.rmSync(path.join(dir, name), { force: true });
  }
}

function missError(misses) {
  const states = misses.map((miss, i) => 'attempt ' + (i + 1) + ': ' + miss.last).join('; ');
  let message = 'Chrome did not open a debug port (' + states + ')';
  for (let i = 0; i < misses.length; i++) {
    const extra = String(misses[i].log || '').trim();
    if (extra) message += '\nattempt ' + (i + 1) + ' log:\n' + extra;
  }
  return new Error(message);
}

const CHROME_ARGS = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-debugging-address=127.0.0.1',
  '--remote-allow-origins=*',
  '--remote-debugging-port=0',
];

function launchChrome(command, dir, detached) {
  const chrome = spawn(command, CHROME_ARGS.concat(['--user-data-dir=' + dir, 'about:blank']), {
    detached,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const held = { text: '' };
  devtoolsLogs.set(chrome, held);
  const keep = chunk => {
    held.text = (held.text + chunk).slice(-8000);
  };
  if (chrome.stdout) chrome.stdout.on('data', keep);
  if (chrome.stderr) chrome.stderr.on('data', keep);
  return chrome;
}

async function waitForDebugPort(chrome, dir, attempts) {
  let last = '';
  for (let i = 0; i < attempts; i++) {
    if (chrome.exitCode != null) return { early: true };
    const port = debugPort(dir, chromeLog(chrome));
    if (port) return { early: false, port };
    last = 'no DevToolsActivePort';
    await sleep(GAP_MS);
    if (chrome.exitCode != null) return { early: true };
  }
  if (chrome.exitCode != null) return { early: true };
  return { early: false, port: null, last: last || 'no DevToolsActivePort' };
}

async function openChrome(opts) {
  const dir = opts && opts.userDataDir;
  if (!dir) throw new Error('openChrome needs a userDataDir');
  const detached = !!(opts && opts.detached);
  const command = (opts && opts.command) || 'google-chrome';
  const attempts = opts.attempts == null ? ATTEMPTS : opts.attempts;
  fs.mkdirSync(dir, { recursive: true });
  const misses = [];
  for (let attempt = 1; attempt <= 2; attempt++) {
    clearProfileLocks(dir);
    const chrome = launchChrome(command, dir, detached);
    const waited = await waitForDebugPort(chrome, dir, attempts);
    if (waited.early) {
      const code = chrome.exitCode;
      const message = logged('Chrome exited before opening a debug port (code ' + code + ')', chrome);
      stopChrome(chrome, detached);
      throw new Error(message);
    }
    if (!waited.port) {
      misses.push({ last: waited.last || 'no DevToolsActivePort', log: chromeLog(chrome) });
      stopChrome(chrome, detached);
      if (attempt === 1) {
        process.stderr.write('chrome-debug: retry 1/1 ' + misses[0].last + '\n');
        continue;
      }
      throw missError(misses);
    }
    try {
      const page = await waitForPage(waited.port, chrome, attempts);
      return { chrome, port: waited.port, page };
    } catch (err) {
      stopChrome(chrome, detached);
      throw err;
    }
  }
  throw missError(misses);
}

module.exports = { waitForPage, openChrome, stopChrome, debugPort, ATTEMPTS, GAP_MS };
