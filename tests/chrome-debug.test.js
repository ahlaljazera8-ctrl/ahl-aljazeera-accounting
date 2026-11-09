const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const { spawn } = require('child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const { waitForPage, debugPort, openChrome, stopAndWait } = require('./chrome-debug.js');

function closedPort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const address = s.address();
      const port = address && typeof address === 'object' ? address.port : 0;
      s.close(() => resolve(port));
    });
  });
}

test('a closed debugger port names the socket failure', async () => {
  const port = await closedPort();
  await assert.rejects(waitForPage(port, null, 2), /Chrome did not open a page \(ECONNREFUSED/);
});

test('the debug port is the one Chrome wrote into the profile', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-dt-'));
  fs.writeFileSync(path.join(dir, 'DevToolsActivePort'), '41234\n/devtools/browser/abc\n');
  assert.equal(debugPort(dir, 'DevTools listening on ws://127.0.0.1:1/devtools/browser/x\n'), 41234);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('stderr supplies the port when Chrome has not written the profile file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-dt-'));
  assert.equal(debugPort(dir, 'noise\nDevTools listening on ws://127.0.0.1:51234/devtools/browser/x\n'), 51234);
  assert.equal(debugPort(dir, 'DevTools listening on ws://127.0.0.1:0/devtools/browser/x\n'), null);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('a failed wait prints the Chrome log the child kept', async () => {
  const port = await closedPort();
  const child = { devtoolsLog: () => 'DevTools listening on ws://127.0.0.1:9/devtools/browser/z' };
  await assert.rejects(waitForPage(port, child, 1), /ECONNREFUSED[\s\S]*DevTools listening on ws:\/\/127\.0\.0\.1:9/);
});

test('a Chrome that already exited is not polled for the full startup budget', async () => {
  const port = await closedPort();
  const started = Date.now();
  await assert.rejects(waitForPage(port, { exitCode: 1 }, 50), /Chrome exited before opening a page \(code 1/);
  assert.ok(Date.now() - started < 1000);
});

const FAKE_CHROME = `#!/usr/bin/env node
'use strict';
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const dirArg = process.argv.find(arg => arg.startsWith('--user-data-dir='));
if (!dirArg) process.exit(2);
const dir = dirArg.slice('--user-data-dir='.length);
const mode = fs.readFileSync(dir + '/fake-mode', 'utf8').trim();
const countPath = dir + '/fake-count';
const n = (fs.existsSync(countPath) ? Number(fs.readFileSync(countPath, 'utf8')) : 0) + 1;
fs.writeFileSync(countPath, String(n));
process.stderr.write('fake-log-' + n + '\\n');
if (mode === 'exit') process.exit(7);
if (fs.existsSync(dir + '/SingletonLock')) {
  process.stderr.write('fake-lock-still-present\\n');
  process.exit(8);
}
if (n === 1) {
  fs.writeFileSync(dir + '/SingletonLock', String(process.pid));
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  fs.writeFileSync(dir + '/fake-pid', String(child.pid));
  setInterval(() => {}, 1000);
} else if (mode === 'serve') {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify([{ type: 'page', id: 'p1', webSocketDebuggerUrl: 'ws://127.0.0.1/devtools/page/p1' }]));
  });
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    fs.writeFileSync(dir + '/DevToolsActivePort', String(port) + '\\n/devtools/browser/fake\\n');
  });
  setInterval(() => {}, 1000);
} else {
  setInterval(() => {}, 1000);
}
`;

function writeFake(dir, mode) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'fake-mode'), mode);
  const command = path.join(dir, 'fake-chrome');
  fs.writeFileSync(command, FAKE_CHROME);
  fs.chmodSync(command, 0o755);
  return command;
}

function stopOpened(dir, opened) {
  const pidFile = path.join(dir, 'fake-pid');
  if (fs.existsSync(pidFile)) {
    const pid = Number(fs.readFileSync(pidFile, 'utf8'));
    try {
      process.kill(pid, 'SIGKILL');
    } catch (e) {}
  }
  const api = require('./chrome-debug.js');
  if (opened && opened.chrome && typeof api.stopChrome === 'function') api.stopChrome(opened.chrome, false);
  let names;
  try {
    names = fs.readdirSync('/proc');
  } catch (e) {
    return;
  }
  for (const name of names) {
    if (!/^[0-9]+$/.test(name)) continue;
    let cmd;
    try {
      cmd = fs.readFileSync('/proc/' + name + '/cmdline', 'utf8');
    } catch (e) {
      continue;
    }
    if (cmd.includes(dir)) {
      try {
        process.kill(Number(name), 'SIGKILL');
      } catch (e) {}
    }
  }
}

async function withStderr(fn) {
  const chunks = [];
  const orig = process.stderr.write;
  process.stderr.write = (chunk, ...rest) => {
    chunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    return orig.call(process.stderr, chunk, ...rest);
  };
  try {
    const value = await fn();
    return { value, stderr: chunks.join(''), error: null };
  } catch (error) {
    return { value: null, stderr: chunks.join(''), error };
  } finally {
    process.stderr.write = orig;
  }
}

test('a hung chrome start retries once in the same profile', { timeout: 10000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-chrome-retry-'));
  const command = writeFake(dir, 'serve');
  let opened = null;
  try {
    const run = await withStderr(() => openChrome({ userDataDir: dir, command, attempts: 2 }));
    if (run.error) throw run.error;
    opened = run.value;
    assert.equal(opened.page.type, 'page');
    assert.ok(opened.page.webSocketDebuggerUrl);
    assert.match(run.stderr, /chrome-debug: retry 1\/1/);
    assert.equal(fs.readFileSync(path.join(dir, 'fake-count'), 'utf8'), '2');
    const pid = Number(fs.readFileSync(path.join(dir, 'fake-pid'), 'utf8'));
    assert.ok(pid > 1);
    assert.equal(fs.existsSync('/proc/' + pid), false);
  } finally {
    stopOpened(dir, opened);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('two hung chrome starts throw both logs and both last states', { timeout: 10000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-chrome-miss-'));
  const command = writeFake(dir, 'hang');
  try {
    const run = await withStderr(() => openChrome({ userDataDir: dir, command, attempts: 2 }));
    assert.ok(run.error, 'a double miss should throw');
    assert.match(run.error.message, /attempt 1: no DevToolsActivePort/);
    assert.match(run.error.message, /attempt 2: no DevToolsActivePort/);
    assert.match(run.error.message, /fake-log-1/);
    assert.match(run.error.message, /fake-log-2/);
    assert.match(run.stderr, /chrome-debug: retry 1\/1/);
    assert.equal(fs.readFileSync(path.join(dir, 'fake-count'), 'utf8'), '2');
  } finally {
    stopOpened(dir, null);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

function assertHashLanded() {
  const src = fs.readFileSync(path.join(__dirname, 'browser-check.js'), 'utf8');
  const start = src.indexOf('function assertHashLanded');
  const end = src.indexOf('let chrome;', start);
  if (start < 0 || end < 0) throw new Error('assertHashLanded missing from browser-check.js');
  return new Function(src.slice(start, end) + '\nreturn assertHashLanded;')();
}

test('a hash navigation that misses its url throws both hrefs', () => {
  const landed = assertHashLanded();
  const expected = 'http://127.0.0.1:8765/index.html?role=owner#entry';
  const actual = 'http://127.0.0.1:8765/index.html?role=owner#home';
  assert.throws(
    () => landed(expected, actual),
    err => {
      if (!(err instanceof Error)) {
        assert.fail('expected an Error');
      }
      assert.equal(err.message, 'browser-check: location.href is ' + actual + ', expected ' + expected);
      return true;
    },
  );
  assert.doesNotThrow(() => landed(expected, expected));
  const src = fs.readFileSync(path.join(__dirname, 'browser-check.js'), 'utf8');
  const go = src.slice(src.indexOf('const go = async url'), src.indexOf('const reload = async'));
  assert.match(go, /if \(!\(await sameDocument\(url\)\)\)[\s\S]*assertHashLanded\(/);
});

test('stopAndWait throws when the process ignores the kill', { timeout: 10000 }, async () => {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 500)'], { stdio: 'ignore' });
  child.kill = () => true;
  const orig = process.kill;
  process.kill = (pid, sig) => {
    if (pid === child.pid && sig) return true;
    return orig.call(process, pid, sig);
  };
  try {
    await assert.rejects(stopAndWait(child, false), err => {
      if (!(err instanceof Error)) {
        assert.fail('expected an Error');
      }
      assert.match(err.message, new RegExp('chrome-debug: process ' + child.pid + ' did not exit before relaunch'));
      return true;
    });
  } finally {
    process.kill = orig;
    try {
      orig.call(process, child.pid, 'SIGKILL');
    } catch (e) {}
  }
});

test('an early chrome exit is not retried', { timeout: 10000 }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'aj-chrome-exit-'));
  const command = writeFake(dir, 'exit');
  try {
    const run = await withStderr(() => openChrome({ userDataDir: dir, command, attempts: 2 }));
    assert.ok(run.error, 'an early exit should throw');
    assert.match(run.error.message, /Chrome exited before opening a debug port \(code 7/);
    assert.doesNotMatch(run.stderr, /chrome-debug: retry/);
    assert.equal(fs.readFileSync(path.join(dir, 'fake-count'), 'utf8'), '1');
  } finally {
    stopOpened(dir, null);
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
