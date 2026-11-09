'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { localHost, assertNoProductionUrl } = require('./verify-aj.js');

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
