'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  localHost,
  assertNoProductionUrl,
  hostPortOk,
  urlModeOk,
  cspOk,
  networkVerdict,
  writeNetwork,
  launchBlock,
} = require('./verify-aj.js');

const FIRESTORE =
  'https://firestore.googleapis.com/v1/projects/ahl-aljazeera-accounting/databases/(default)/documents/ledgerEntries';
const AUTH = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';
const TOKEN = 'https://securetoken.googleapis.com/v1/token';
const EMULATOR_AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword';

test('refuses a production Firestore host', () => {
  assert.throws(() => assertNoProductionUrl(FIRESTORE), /production Firebase host/);
});

test('refuses production Auth and token hosts', () => {
  assert.throws(() => assertNoProductionUrl(AUTH), /production Firebase host/);
  assert.throws(() => assertNoProductionUrl(TOKEN), /production Firebase host/);
});

test('accepts the Auth emulator when the path names identitytoolkit', () => {
  assert.doesNotThrow(() => assertNoProductionUrl(EMULATOR_AUTH));
});

test('refuses a non-loopback emulator host', () => {
  assert.throws(() => localHost('firestore.googleapis.com:443'), /loopback/);
  assert.throws(() => localHost(''), /loopback/);
  assert.throws(() => localHost('10.0.0.8:8080'), /loopback/);
});

test('accepts a loopback emulator host', () => {
  assert.deepEqual(localHost('127.0.0.1:8080'), { host: '127.0.0.1', port: 8080 });
  assert.deepEqual(localHost('localhost:9099'), { host: 'localhost', port: 9099 });
});

test('hostPortOk rejects a prefixed host, 0.0.0.0, and port 8765', () => {
  assert.equal(hostPortOk('127.0.0.1:5000'), true);
  assert.equal(hostPortOk('localhost:9099'), true);
  assert.equal(hostPortOk('evil127.0.0.1:8080'), false);
  assert.equal(hostPortOk('0.0.0.0:5000'), false);
  assert.equal(hostPortOk('127.0.0.1:8765'), false);
  assert.equal(hostPortOk('127.0.0.1:0'), false);
});

test('urlModeOk requires emulator=1 and rejects a role param', () => {
  assert.equal(urlModeOk('http://127.0.0.1:5000/index.html?emulator=1'), true);
  assert.equal(urlModeOk('http://127.0.0.1:5000/index.html?emulator=1&sw=cache'), true);
  assert.equal(urlModeOk('http://127.0.0.1:5000/index.html'), false);
  assert.equal(urlModeOk('http://127.0.0.1:5000/index.html?emulator=1&role=owner'), false);
  assert.equal(urlModeOk('http://127.0.0.1:5000/index.html?role=site'), false);
});

test('cspOk requires both emulator origins', () => {
  assert.equal(cspOk("connect-src 'self' http://127.0.0.1:9099 http://127.0.0.1:8080"), true);
  assert.equal(cspOk("connect-src 'self' http://127.0.0.1:9099"), false);
  assert.equal(cspOk(''), false);
});

test('networkVerdict flags a subdomain and a trailing dot', () => {
  assert.deepEqual(networkVerdict(['http://127.0.0.1:8080/v1']), []);
  assert.equal(networkVerdict(['https://evil.firestore.googleapis.com/v1']).length, 1);
  assert.equal(networkVerdict(['https://firestore.googleapis.com./v1']).length, 1);
  assert.throws(() => assertNoProductionUrl('https://firestore.googleapis.com./v1'), /production Firebase host/);
});

test('networkVerdict allows only loopback emulator ports and the Firebase JS SDK', () => {
  const ports = [9099, 8080, 5000];
  const allowed = [
    'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js',
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword',
    'http://127.0.0.1:8080/google.firestore.v1.Firestore/Listen/channel',
    'http://127.0.0.1:5000/index.html?emulator=1',
    'http://localhost:5000/sw.js',
  ];
  assert.deepEqual(networkVerdict(allowed, ports), []);
  const blocked = [
    'https://firebaseinstallations.googleapis.com/v1/projects/ahl-aljazeera-accounting/installations',
    'https://content-firebaseappcheck.googleapis.com/v1/projects/ahl-aljazeera-accounting:exchangeDebugToken',
    'https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig',
    'https://www.gstatic.com/firebasejs-compat/13.1.0/firebase-app.js',
    'http://127.0.0.1:8765/index.html',
    'http://127.0.0.1:443/v1',
    'http://10.0.0.8:8080/',
  ];
  assert.deepEqual(networkVerdict(blocked, ports), blocked);
});

test('writeNetwork records a production URL and then throws', () => {
  const file = path.join(os.tmpdir(), 'aj-verify-network-' + process.pid + '.txt');
  assert.throws(() => writeNetwork([FIRESTORE], file), /BLOCKED/);
  assert.match(fs.readFileSync(file, 'utf8'), /BLOCKED https:\/\/firestore\.googleapis\.com/);
  fs.rmSync(file, { force: true });
});

test('a second launch is exit 2, and hosting port 8765 is exit 1', () => {
  assert.equal(
    launchBlock({ alreadyRunning: true, browserPortOpen: false, emulatorPortOpen: false, hostingPort: 5000 }),
    2,
  );
  assert.equal(
    launchBlock({ alreadyRunning: false, browserPortOpen: true, emulatorPortOpen: false, hostingPort: 5000 }),
    2,
  );
  assert.equal(
    launchBlock({ alreadyRunning: false, browserPortOpen: false, emulatorPortOpen: false, hostingPort: 8765 }),
    1,
  );
  assert.equal(
    launchBlock({ alreadyRunning: false, browserPortOpen: false, emulatorPortOpen: false, hostingPort: 5000 }),
    0,
  );
});
