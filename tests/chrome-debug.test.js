const net = require('net');
const test = require('node:test');
const assert = require('node:assert/strict');
const { waitForPage } = require('./chrome-debug.js');

function closedPort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

test('a closed debugger port names the socket failure', async () => {
  const port = await closedPort();
  await assert.rejects(waitForPage(port, null, 2), /Chrome did not open a page \(ECONNREFUSED/);
});

test('a Chrome that already exited is not polled for the full startup budget', async () => {
  const port = await closedPort();
  const started = Date.now();
  await assert.rejects(waitForPage(port, { exitCode: 1 }, 50), /Chrome exited before opening a page \(code 1/);
  assert.ok(Date.now() - started < 1000);
});
