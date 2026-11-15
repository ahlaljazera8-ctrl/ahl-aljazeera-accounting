'use strict';

// Pre-deadline helper. send only resolves, the socket open only waits for
// onopen, and a mid-run close does not reject pending calls. The unit tests
// are supposed to fail against this file. The implementation replaces it.

const DEFAULT_CDP_TIMEOUT_MS = 30000;

class CdpTimeoutError extends Error {
  /**
   * @param {string} method
   * @param {number} timeoutMs
   */
  constructor(method, timeoutMs) {
    super('browser-check: CDP ' + method + ' timed out after ' + timeoutMs + 'ms');
    this.name = 'CdpTimeoutError';
    this.method = method;
    this.timeoutMs = timeoutMs;
  }
}

class CdpSocketError extends Error {
  /**
   * @param {string} message
   * @param {{ reason: 'error' | 'close', methods?: string[] }} info
   */
  constructor(message, info) {
    super(message);
    this.name = 'CdpSocketError';
    this.reason = info.reason;
    this.methods = info.methods || [];
  }
}

/** @param {unknown} err */
function isCdpTimeout(err) {
  return !!(err && /** @type {{ name?: string }} */ (err).name === 'CdpTimeoutError');
}

/** @param {unknown} err */
function isCdpSocketError(err) {
  return !!(err && /** @type {{ name?: string }} */ (err).name === 'CdpSocketError');
}

/**
 * @param {string} url
 * @param {{ WebSocket?: new (url: string) => any }} [opts]
 */
function openCdpSocket(url, opts) {
  const WS = (opts && opts.WebSocket) || globalThis.WebSocket;
  const ws = new WS(url);
  return new Promise(resolve => {
    ws.onopen = () => resolve(ws);
  });
}

/**
 * @param {{ send: (data: string) => void, onmessage: ((event: { data: string }) => void) | null }} ws
 * @param {{ onEvent?: (message: object) => void }} [opts]
 */
function createCdpSession(ws, opts) {
  let id = 0;
  /** @type {Record<number, (message: object) => void>} */
  const pend = {};
  const onEvent = opts && opts.onEvent;
  ws.onmessage = event => {
    const message = JSON.parse(event.data);
    if (onEvent) onEvent(message);
    if (message.id && pend[message.id]) {
      pend[message.id](message);
      delete pend[message.id];
    }
  };
  const send = (method, params = {}) =>
    new Promise(resolve => {
      const mid = ++id;
      pend[mid] = resolve;
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  const ev = async expression =>
    (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.result.value;
  return { send, ev };
}

module.exports = {
  createCdpSession,
  openCdpSocket,
  CdpTimeoutError,
  CdpSocketError,
  isCdpTimeout,
  isCdpSocketError,
  DEFAULT_CDP_TIMEOUT_MS,
};
