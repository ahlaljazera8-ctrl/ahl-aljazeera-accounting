'use strict';

const DEFAULT_CDP_TIMEOUT_MS = 30000;

/**
 * @typedef {{
 *   send: (data: string) => void,
 *   close: (code?: number, reason?: string) => void,
 *   onmessage: ((event: { data: string }) => void) | null,
 *   onopen: ((event?: object) => void) | null,
 *   onerror: ((event?: object) => void) | null,
 *   onclose: ((event?: object) => void) | null
 * }} CdpSocket
 */

/**
 * @typedef {new (url: string) => CdpSocket} CdpSocketConstructor
 */

/**
 * @typedef {{
 *   timeoutMs?: number,
 *   WebSocket?: CdpSocketConstructor
 * }} CdpOpenOptions
 */

/**
 * @typedef {{
 *   id?: number,
 *   method?: string,
 *   params?: { loaderId?: string, [key: string]: any },
 *   result?: any,
 *   error?: object
 * }} CdpMessage
 */

/**
 * @typedef {{
 *   timeoutMs?: number,
 *   onEvent?: (message: CdpMessage) => void
 * }} CdpSessionOptions
 */

/**
 * @typedef {{
 *   send: (method: string, params?: object) => Promise<CdpMessage>,
 *   ev: (expression: string) => Promise<any>
 * }} CdpSession
 */

/**
 * @typedef {{
 *   id: number,
 *   method: string,
 *   timer: ReturnType<typeof setTimeout>,
 *   resolve: (message: CdpMessage) => void,
 *   reject: (err: Error) => void
 * }} PendingCall
 */

class CdpTimeoutError extends Error {
  /**
   * @param {string} method
   * @param {number} timeoutMs
   */
  constructor(method, timeoutMs) {
    super('browser-check: CDP ' + method + ' timed out after ' + timeoutMs + 'ms');
    this.name = 'CdpTimeoutError';
    /** @type {string} */
    this.method = method;
    /** @type {number} */
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
    /** @type {'error' | 'close'} */
    this.reason = info.reason;
    /** @type {string[]} */
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
 * @param {number | undefined} value
 */
function timeoutFrom(value) {
  return value != null ? value : DEFAULT_CDP_TIMEOUT_MS;
}

/**
 * @param {'error' | 'close'} reason
 * @param {string[]} methods
 */
function socketMessage(reason, methods) {
  const how = reason === 'error' ? 'error' : 'closed';
  if (methods.length === 1) {
    return 'browser-check: CDP socket ' + how + ' while ' + methods[0] + ' was in flight';
  }
  if (methods.length > 1) {
    return 'browser-check: CDP socket ' + how + ' while ' + methods.join(', ') + ' were in flight';
  }
  return 'browser-check: CDP socket ' + how;
}

/**
 * Open a page debugger WebSocket and wait until it is open.
 * Rejects on error, on close before open, or on timeout.
 * @param {string} url
 * @param {CdpOpenOptions} [opts]
 * @returns {Promise<CdpSocket>}
 */
function openCdpSocket(url, opts) {
  const options = opts || {};
  const timeoutMs = timeoutFrom(options.timeoutMs);
  const WS = options.WebSocket || globalThis.WebSocket;
  if (typeof WS !== 'function') throw new Error('browser-check: WebSocket is missing');
  const ws = new WS(url);
  return new Promise((resolve, reject) => {
    let settled = false;
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timer;
    /**
     * @param {() => void} settle
     */
    const finish = settle => {
      if (settled) return;
      settled = true;
      if (timer != null) clearTimeout(timer);
      ws.onopen = null;
      ws.onerror = null;
      ws.onclose = null;
      settle();
    };
    timer = setTimeout(() => {
      finish(() => reject(new CdpTimeoutError('WebSocket.open', timeoutMs)));
    }, timeoutMs);
    ws.onopen = () => {
      finish(() => resolve(ws));
    };
    ws.onerror = () => {
      finish(() => reject(new CdpSocketError('browser-check: CDP socket error before open', { reason: 'error' })));
    };
    ws.onclose = () => {
      finish(() => reject(new CdpSocketError('browser-check: CDP socket closed before open', { reason: 'close' })));
    };
  });
}

/**
 * @param {CdpSocket} ws
 * @param {CdpSessionOptions} [opts]
 * @returns {CdpSession}
 */
function createCdpSession(ws, opts) {
  const options = opts || {};
  const timeoutMs = timeoutFrom(options.timeoutMs);
  const onEvent = options.onEvent;
  let id = 0;
  let closed = false;
  /** @type {'error' | 'close'} */
  let closedReason = 'close';
  /** @type {Record<number, PendingCall>} */
  const pend = {};

  /**
   * @param {'error' | 'close'} reason
   */
  function failAll(reason) {
    if (closed) return;
    closed = true;
    closedReason = reason;
    const entries = Object.keys(pend).map(key => pend[Number(key)]);
    const methods = entries.map(entry => entry.method);
    for (const entry of entries) {
      clearTimeout(entry.timer);
      delete pend[entry.id];
    }
    const message = socketMessage(reason, methods);
    for (const entry of entries) {
      entry.reject(new CdpSocketError(message, { reason, methods: methods.slice() }));
    }
  }

  ws.onmessage = event => {
    const message = /** @type {CdpMessage} */ (JSON.parse(event.data));
    if (onEvent) onEvent(message);
    const pending = message.id && pend[message.id];
    if (!pending) return;
    clearTimeout(pending.timer);
    delete pend[pending.id];
    pending.resolve(message);
  };
  ws.onerror = () => {
    failAll('error');
  };
  ws.onclose = () => {
    failAll('close');
  };

  /**
   * @param {string} method
   * @param {object} [params]
   * @returns {Promise<CdpMessage>}
   */
  function send(method, params = {}) {
    if (closed) {
      return Promise.reject(new CdpSocketError(socketMessage(closedReason, []), { reason: closedReason }));
    }
    const mid = ++id;
    return new Promise((resolve, reject) => {
      /** @type {ReturnType<typeof setTimeout>} */
      const timer = setTimeout(() => {
        if (!pend[mid]) return;
        delete pend[mid];
        reject(new CdpTimeoutError(method, timeoutMs));
      }, timeoutMs);
      pend[mid] = { id: mid, method, timer, resolve, reject };
      try {
        ws.send(JSON.stringify({ id: mid, method, params }));
      } catch (err) {
        clearTimeout(timer);
        delete pend[mid];
        reject(/** @type {Error} */ (err));
      }
    });
  }

  /**
   * @param {string} expression
   * @returns {Promise<any>}
   */
  async function ev(expression) {
    const message = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    return message.result.result.value;
  }

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
