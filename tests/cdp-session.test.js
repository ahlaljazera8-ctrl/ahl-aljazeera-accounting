'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createCdpSession,
  openCdpSocket,
  CdpTimeoutError,
  CdpSocketError,
  isCdpTimeout,
  isCdpSocketError,
  DEFAULT_CDP_TIMEOUT_MS,
} = require('./cdp-session.js');

const TIMEOUT_MS = 50;

function fakeSocket() {
  return {
    sent: [],
    /**
     * @param {string} data
     */
    send(data) {
      this.sent.push(data);
    },
    /** @type {((event: { data: string }) => void) | null} */
    onmessage: null,
    /** @type {((event?: object) => void) | null} */
    onerror: null,
    /** @type {((event?: object) => void) | null} */
    onclose: null,
    /** @type {((event?: object) => void) | null} */
    onopen: null,
  };
}

class FakeWebSocket {
  /**
   * @param {string} url
   */
  constructor(url) {
    this.url = url;
    this.sent = [];
    /** @type {((event?: object) => void) | null} */
    this.onopen = null;
    /** @type {((event?: object) => void) | null} */
    this.onerror = null;
    /** @type {((event?: object) => void) | null} */
    this.onclose = null;
    /** @type {((event: { data: string }) => void) | null} */
    this.onmessage = null;
    FakeWebSocket.latest = this;
  }

  /**
   * @param {string} data
   */
  send(data) {
    this.sent.push(data);
  }
}

/** @type {FakeWebSocket | undefined} */
FakeWebSocket.latest = undefined;

/**
 * @param {import('node:test').TestContext} t
 */
function arm(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  /** @type {unknown[]} */
  const leaks = [];
  const onRejection = (/** @type {unknown} */ err) => {
    leaks.push(err);
  };
  process.on('unhandledRejection', onRejection);
  t.after(() => {
    process.off('unhandledRejection', onRejection);
    t.mock.timers.reset();
  });
  return leaks;
}

/**
 * @param {Promise<unknown>} promise
 */
function watch(promise) {
  const state = { settled: false, value: /** @type {any} */ (undefined), error: /** @type {any} */ (undefined) };
  promise.then(
    value => {
      state.settled = 'resolved';
      state.value = value;
    },
    error => {
      state.settled = 'rejected';
      state.error = error;
    },
  );
  return state;
}

function flush() {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}

/**
 * @param {{ onmessage: ((event: { data: string }) => void) | null }} ws
 * @param {object} message
 */
function deliver(ws, message) {
  if (!ws.onmessage) throw new Error('socket has no onmessage');
  ws.onmessage({ data: JSON.stringify(message) });
}

/**
 * @param {{ sent: string[] }} ws
 * @param {number} index
 */
function sent(ws, index) {
  return JSON.parse(ws.sent[index]);
}

test('1 a silent socket rejects with the CDP method', async t => {
  const leaks = arm(t);
  const ws = fakeSocket();
  const { send } = createCdpSession(ws, { timeoutMs: TIMEOUT_MS });
  const pending = send('Page.enable');
  const state = watch(pending);
  t.mock.timers.tick(49);
  await flush();
  assert.equal(state.settled, false);
  t.mock.timers.tick(1);
  await flush();
  assert.equal(state.settled, 'rejected');
  assert.equal(state.error.name, 'CdpTimeoutError');
  assert.equal(state.error.message, 'browser-check: CDP Page.enable timed out after 50ms');
  t.mock.timers.tick(100);
  await flush();
  assert.equal(state.settled, 'rejected');
  assert.equal(state.error.message, 'browser-check: CDP Page.enable timed out after 50ms');
  assert.equal(leaks.length, 0);
});

test('2 ev names Runtime.evaluate and not the expression', async t => {
  const leaks = arm(t);
  const ws = fakeSocket();
  const { ev } = createCdpSession(ws, { timeoutMs: TIMEOUT_MS });
  const pending = ev('1+1');
  const state = watch(pending);
  const payload = sent(ws, 0);
  assert.equal(payload.method, 'Runtime.evaluate');
  assert.equal(payload.params.expression, '1+1');
  assert.equal(payload.params.awaitPromise, true);
  assert.equal(payload.params.returnByValue, true);
  t.mock.timers.tick(49);
  await flush();
  assert.equal(state.settled, false);
  t.mock.timers.tick(1);
  await flush();
  assert.equal(state.settled, 'rejected');
  assert.equal(state.error.message, 'browser-check: CDP Runtime.evaluate timed out after 50ms');
  assert.equal(state.error.message.includes('1+1'), false);
  t.mock.timers.tick(100);
  await flush();
  assert.equal(leaks.length, 0);
});

test('3 a reply resolves and a later tick does not reject', async t => {
  const leaks = arm(t);
  const ws = fakeSocket();
  const { send } = createCdpSession(ws, { timeoutMs: TIMEOUT_MS });
  const pending = send('Page.enable');
  const state = watch(pending);
  const payload = sent(ws, 0);
  assert.equal(payload.id, 1);
  assert.equal(payload.method, 'Page.enable');
  deliver(ws, { id: payload.id, result: { ok: true } });
  await flush();
  assert.equal(state.settled, 'resolved');
  assert.deepEqual(state.value, { id: 1, result: { ok: true } });
  t.mock.timers.tick(TIMEOUT_MS * 2);
  await flush();
  assert.equal(state.settled, 'resolved');
  assert.equal(leaks.length, 0);
});

test('4 a late reply is ignored and the next id still resolves', async t => {
  const leaks = arm(t);
  const ws = fakeSocket();
  const { send } = createCdpSession(ws, { timeoutMs: TIMEOUT_MS });
  const pending = send('Page.enable');
  const state = watch(pending);
  const id = sent(ws, 0).id;
  t.mock.timers.tick(TIMEOUT_MS);
  await flush();
  assert.equal(state.settled, 'rejected');
  assert.doesNotThrow(() => deliver(ws, { id, result: { late: true } }));
  await flush();
  assert.equal(leaks.length, 0);
  assert.equal(state.error.message, 'browser-check: CDP Page.enable timed out after 50ms');
  const next = send('Runtime.enable');
  const nextState = watch(next);
  const nextId = sent(ws, 1).id;
  assert.notEqual(nextId, id);
  deliver(ws, { id: nextId, result: { ok: true } });
  await flush();
  assert.equal(nextState.settled, 'resolved');
  assert.deepEqual(nextState.value, { id: nextId, result: { ok: true } });
  t.mock.timers.tick(TIMEOUT_MS * 2);
  await flush();
  assert.equal(leaks.length, 0);
});

test('5 events reach onEvent before a waiting send resolves', async t => {
  const leaks = arm(t);
  /** @type {unknown[]} */
  const seen = [];
  const ws = fakeSocket();
  const { send } = createCdpSession(ws, {
    timeoutMs: TIMEOUT_MS,
    onEvent(message) {
      seen.push('event');
      seen.push(message.method || message.id);
      queueMicrotask(() => seen.push('after-event'));
    },
  });
  const pending = send('Page.enable');
  const state = watch(pending);
  pending.then(() => {
    seen.push('resolved');
  });
  deliver(ws, { method: 'Page.frameStartedNavigating', params: { loaderId: 'L1' } });
  await flush();
  assert.deepEqual(seen, ['event', 'Page.frameStartedNavigating', 'after-event']);
  assert.equal(state.settled, false);
  deliver(ws, { id: 1, result: { ok: true } });
  await flush();
  assert.equal(state.settled, 'resolved');
  assert.deepEqual(state.value, { id: 1, result: { ok: true } });
  assert.deepEqual(seen, [
    'event',
    'Page.frameStartedNavigating',
    'after-event',
    'event',
    1,
    'after-event',
    'resolved',
  ]);
  t.mock.timers.tick(TIMEOUT_MS * 2);
  await flush();
  assert.equal(leaks.length, 0);
  assert.equal(state.settled, 'resolved');
});

test('6 a throw from ws.send rejects and the next send still works', async t => {
  const leaks = arm(t);
  const ws = fakeSocket();
  ws.send = () => {
    throw new Error('socket write failed');
  };
  const { send } = createCdpSession(ws, { timeoutMs: TIMEOUT_MS });
  const pending = send('Page.enable');
  const state = watch(pending);
  await flush();
  assert.equal(state.settled, 'rejected');
  assert.equal(state.error.message, 'socket write failed');
  t.mock.timers.tick(TIMEOUT_MS * 2);
  await flush();
  assert.equal(state.error.message, 'socket write failed');
  assert.equal(leaks.length, 0);
  assert.doesNotThrow(() => deliver(ws, { id: 1, result: { late: true } }));
  ws.send = function send(data) {
    this.sent.push(data);
  };
  const next = send('Page.enable');
  const nextState = watch(next);
  const nextId = sent(ws, 0).id;
  assert.equal(nextId, 2);
  deliver(ws, { id: 1, result: { late: true } });
  await flush();
  assert.equal(nextState.settled, false);
  deliver(ws, { id: nextId, result: { ok: 1 } });
  await flush();
  assert.equal(nextState.settled, 'resolved');
  assert.deepEqual(nextState.value, { id: 2, result: { ok: 1 } });
  t.mock.timers.tick(TIMEOUT_MS * 2);
  await flush();
  assert.equal(leaks.length, 0);
});

test('7 timeout and socket errors are distinct', () => {
  const timeout = new CdpTimeoutError('Page.enable', TIMEOUT_MS);
  const socket = new CdpSocketError('browser-check: CDP socket closed', { reason: 'close' });
  const plain = new Error('plain');
  assert.equal(DEFAULT_CDP_TIMEOUT_MS, 30000);
  assert.equal(isCdpTimeout(timeout), true);
  assert.equal(isCdpTimeout(plain), false);
  assert.equal(isCdpTimeout(socket), false);
  assert.equal(isCdpTimeout(null), false);
  assert.equal(isCdpSocketError(socket), true);
  assert.equal(isCdpSocketError(plain), false);
  assert.equal(isCdpSocketError(timeout), false);
  assert.equal(isCdpSocketError(undefined), false);
});

test('8 a socket that never opens times out', async t => {
  const leaks = arm(t);
  const pending = openCdpSocket('ws://127.0.0.1/devtools/page/p', {
    timeoutMs: TIMEOUT_MS,
    WebSocket: FakeWebSocket,
  });
  const state = watch(pending);
  t.mock.timers.tick(49);
  await flush();
  assert.equal(state.settled, false);
  t.mock.timers.tick(1);
  await flush();
  assert.equal(state.settled, 'rejected');
  assert.equal(state.error.name, 'CdpTimeoutError');
  assert.equal(state.error.message, 'browser-check: CDP WebSocket.open timed out after 50ms');
  t.mock.timers.tick(100);
  await flush();
  assert.equal(state.error.message, 'browser-check: CDP WebSocket.open timed out after 50ms');
  assert.equal(leaks.length, 0);
});

test('9 socket open rejects on error and on close before open', async t => {
  const leaks = arm(t);
  const errored = openCdpSocket('ws://127.0.0.1/devtools/page/e', {
    timeoutMs: TIMEOUT_MS,
    WebSocket: FakeWebSocket,
  });
  const errorState = watch(errored);
  const onerror = FakeWebSocket.latest && FakeWebSocket.latest.onerror;
  const oncloseAfterError = FakeWebSocket.latest && FakeWebSocket.latest.onclose;
  assert.equal(typeof onerror, 'function');
  onerror();
  await flush();
  assert.equal(errorState.settled, 'rejected');
  assert.equal(isCdpSocketError(errorState.error), true);
  assert.equal(isCdpTimeout(errorState.error), false);
  assert.equal(errorState.error.reason, 'error');
  onerror();
  if (oncloseAfterError) oncloseAfterError();
  await flush();
  assert.equal(errorState.error.reason, 'error');
  t.mock.timers.tick(TIMEOUT_MS * 2);
  await flush();
  assert.equal(isCdpSocketError(errorState.error), true);
  assert.equal(leaks.length, 0);

  const closed = openCdpSocket('ws://127.0.0.1/devtools/page/c', {
    timeoutMs: TIMEOUT_MS,
    WebSocket: FakeWebSocket,
  });
  const closeState = watch(closed);
  const onclose = FakeWebSocket.latest && FakeWebSocket.latest.onclose;
  assert.equal(typeof onclose, 'function');
  onclose();
  await flush();
  assert.equal(closeState.settled, 'rejected');
  assert.equal(closeState.error.reason, 'close');
  assert.equal(isCdpTimeout(closeState.error), false);
  t.mock.timers.tick(TIMEOUT_MS * 2);
  await flush();
  assert.equal(closeState.error.reason, 'close');
  assert.equal(leaks.length, 0);
});

test('10 an open socket resolves and drops the open handlers', async t => {
  const leaks = arm(t);
  const pending = openCdpSocket('ws://127.0.0.1/devtools/page/ok', {
    timeoutMs: TIMEOUT_MS,
    WebSocket: FakeWebSocket,
  });
  const ws = FakeWebSocket.latest;
  assert.ok(ws);
  const state = watch(pending);
  assert.equal(typeof ws.onopen, 'function');
  ws.onopen();
  await flush();
  assert.equal(state.settled, 'resolved');
  assert.equal(state.value, ws);
  assert.equal(ws.onopen, null);
  assert.equal(ws.onerror, null);
  assert.equal(ws.onclose, null);
  t.mock.timers.tick(TIMEOUT_MS * 2);
  await flush();
  assert.equal(state.settled, 'resolved');
  assert.equal(leaks.length, 0);
  const { send } = createCdpSession(ws, { timeoutMs: TIMEOUT_MS });
  const command = send('Page.enable');
  const commandState = watch(command);
  deliver(ws, { id: 1, result: { enabled: true } });
  await flush();
  assert.equal(commandState.settled, 'resolved');
  assert.deepEqual(commandState.value, { id: 1, result: { enabled: true } });
});

test('11 a mid-run close rejects every pending call once', async t => {
  const leaks = arm(t);
  const ws = fakeSocket();
  const { send } = createCdpSession(ws, { timeoutMs: TIMEOUT_MS });
  const first = send('Page.enable');
  const second = send('Runtime.enable');
  const firstState = watch(first);
  const secondState = watch(second);
  assert.equal(typeof ws.onclose, 'function');
  ws.onclose();
  await flush();
  assert.equal(firstState.settled, 'rejected');
  assert.equal(secondState.settled, 'rejected');
  assert.equal(isCdpSocketError(firstState.error), true);
  assert.equal(isCdpTimeout(firstState.error), false);
  assert.equal(firstState.error.reason, 'close');
  assert.equal(firstState.error.message, 'browser-check: CDP socket closed while Page.enable, Runtime.enable were in flight');
  assert.equal(secondState.error.message, firstState.error.message);
  const firstId = sent(ws, 0).id;
  assert.doesNotThrow(() => deliver(ws, { id: firstId, result: { late: true } }));
  await flush();
  assert.equal(firstState.error.message, 'browser-check: CDP socket closed while Page.enable, Runtime.enable were in flight');
  const again = send('Page.enable');
  const againState = watch(again);
  await flush();
  assert.equal(againState.settled, 'rejected');
  assert.equal(isCdpSocketError(againState.error), true);
  assert.equal(againState.error.reason, 'close');
  t.mock.timers.tick(TIMEOUT_MS * 2);
  await flush();
  assert.equal(againState.settled, 'rejected');
  assert.equal(isCdpSocketError(againState.error), true);
  assert.equal(leaks.length, 0);

  const ws2 = fakeSocket();
  const session2 = createCdpSession(ws2, { timeoutMs: TIMEOUT_MS });
  const pending = session2.send('Page.enable');
  const pendingState = watch(pending);
  let rejections = 0;
  pending.then(
    () => {},
    () => {
      rejections += 1;
    },
  );
  assert.equal(typeof ws2.onerror, 'function');
  assert.equal(typeof ws2.onclose, 'function');
  ws2.onerror();
  ws2.onclose();
  await flush();
  assert.equal(rejections, 1);
  assert.equal(pendingState.settled, 'rejected');
  assert.equal(pendingState.error.reason, 'error');
  assert.equal(pendingState.error.message, 'browser-check: CDP socket error while Page.enable was in flight');
  const later = session2.send('Runtime.evaluate');
  const laterState = watch(later);
  await flush();
  assert.equal(laterState.settled, 'rejected');
  assert.equal(laterState.error.reason, 'error');
  t.mock.timers.tick(TIMEOUT_MS * 2);
  await flush();
  assert.equal(leaks.length, 0);
});

test('the omitted timeout is the 30000 ms default', async t => {
  const leaks = arm(t);
  const ws = fakeSocket();
  const { send } = createCdpSession(ws);
  const pending = send('Page.enable');
  const state = watch(pending);
  t.mock.timers.tick(DEFAULT_CDP_TIMEOUT_MS - 1);
  await flush();
  assert.equal(state.settled, false);
  t.mock.timers.tick(1);
  await flush();
  assert.equal(state.settled, 'rejected');
  assert.equal(state.error.message, 'browser-check: CDP Page.enable timed out after 30000ms');
  t.mock.timers.tick(DEFAULT_CDP_TIMEOUT_MS);
  await flush();
  assert.equal(leaks.length, 0);
});
