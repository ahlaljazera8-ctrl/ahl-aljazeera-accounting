const fs = require('fs');
const os = require('os');
const path = require('path');
const net = require('net');
const test = require('node:test');
const assert = require('node:assert/strict');
const { waitForPage, debugPort } = require('./chrome-debug.js');

function closedPort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = /** @type {import('net').AddressInfo} */ (s.address());
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
