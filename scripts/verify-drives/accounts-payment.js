'use strict';

const fs = require('fs');
const path = require('path');

const RATE = '300000';
const PER = '4000';
const QTY = '8000';
const UNIT_NAME = 'طوبة';
const DESCRIPTION = 'طابوق';
const PAY_TEXT = '600,000';
const ADVANCE_TEXT = '100,000';
const RETURN_TEXT = '30,000';
const REFUND_TEXT = '50,000';
const PARTIES = {
  'pay-labor': 'مقاول الدفعة',
  'advance-labor': 'مقاول السلفة',
  'return-advance': 'مقاول الإرجاع',
  'refund-labor': 'مقاول الاسترداد',
  'review-cash': 'مقاول التدقيق',
};

/**
 * @typedef {Object} DriveTools
 * @property {(port: number) => Promise<any>} connectCdp
 * @property {(session: any, expression: string) => Promise<unknown>} evaluate
 * @property {(session: any, expression: string, ms: number) => Promise<void>} waitUntil
 * @property {(session: any, file: string) => Promise<void>} shoot
 * @property {(evidenceDir: string, session: any, failure: unknown, ports: readonly number[]) => void} finishSession
 * @property {(authPort: number, firestorePort: number, name: string) => Promise<Array<Record<string, unknown> & { id: string }>>} readCollection
 * @property {(session: any, label: string) => Promise<string>} kvText
 * @property {(message: string) => never} fail
 * @property {string} EMAIL
 * @property {string} PASSWORD
 * @property {string} DISPLAY
 * @property {string} PROJECT_ID
 * @property {string} PROJECT_NAME
 * @property {string} PROJECT
 */

/**
 * @param {any} run
 * @param {DriveTools} tools
 * @param {any} session
 */
async function signIn(run, tools, session) {
  await session.send('Page.enable');
  await session.send('Runtime.enable');
  await session.send('Network.enable');
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  const shellOpen = await tools.evaluate(
    session,
    `document.querySelector('#shell') && document.querySelector('#shell').hidden === false`,
  );
  if (shellOpen !== true) {
    const filled = await tools.evaluate(
      session,
      `(() => { const email = document.querySelector('#login-email'); const password = document.querySelector('#login-password'); const button = document.querySelector('#login-btn'); if (!email || !password || !button) return false; email.value = ${JSON.stringify(tools.EMAIL)}; password.value = ${JSON.stringify(tools.PASSWORD)}; button.click(); return true; })()`,
    );
    if (filled !== true) tools.fail('STOP: login form is missing');
    await tools.waitUntil(
      session,
      `document.querySelector('#shell') && document.querySelector('#shell').hidden === false && (document.querySelector('#who') || {}).textContent && document.querySelector('#who').textContent.includes(${JSON.stringify(tools.DISPLAY)})`,
      25000,
    );
  }
}

/**
 * @param {any} session
 * @param {DriveTools} tools
 * @param {string} expression
 * @param {string} label
 */
async function clickOk(session, tools, expression, label) {
  const ok = await tools.evaluate(session, expression);
  if (ok !== true) tools.fail('STOP: ' + label);
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 * @param {string} name
 */
async function readRows(run, tools, name) {
  return tools.readCollection(run.authPort, run.firestorePort, name);
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 * @param {any} session
 * @param {string} party
 */
async function ensureParty(run, tools, session, party) {
  const existing = await readRows(run, tools, 'parties');
  if (existing.some(row => row.name === party)) return;
  await clickOk(
    session,
    tools,
    `(() => { const tab = document.querySelector('a[data-tab="accounts"]'); if (!tab) return false; tab.click(); return true; })()`,
    'حسابات tab is missing',
  );
  await tools.waitUntil(session, `!!document.querySelector('#party-new')`, 10000);
  await clickOk(
    session,
    tools,
    `(() => { const button = document.querySelector('#party-new'); if (!button) return false; button.click(); return true; })()`,
    'person create is missing',
  );
  await tools.waitUntil(session, `!!document.querySelector('#party-name')`, 10000);
  await clickOk(
    session,
    tools,
    `(() => { const name = document.querySelector('#party-name'); const save = document.querySelector('#save-party'); if (!name || !save) return false; name.value = ${JSON.stringify(party)}; save.click(); return true; })()`,
    'person save is missing',
  );
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const rows = await readRows(run, tools, 'parties');
    if (rows.filter(row => row.name === party).length === 1) return;
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  tools.fail('STOP: party was not stored');
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 * @param {any} session
 * @param {string} dir
 * @param {string} party
 */
async function saveAgreement(run, tools, session, dir, party) {
  const day = await tools.evaluate(session, 'today()');
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) tools.fail('STOP: today() was ' + String(day));
  await tools.evaluate(
    session,
    `Accounts.CONTRACTOR_COST_START = ${JSON.stringify(day)}; dispatchEvent(new HashChangeEvent('hashchange')); true`,
  );
  await tools.waitUntil(session, `!!document.querySelector('a[data-tab="contractor"]')`, 10000);
  await clickOk(
    session,
    tools,
    `(() => { const tab = document.querySelector('a[data-tab="contractor"]'); if (!tab) return false; tab.click(); return true; })()`,
    'مقاول tab is missing',
  );
  await tools.waitUntil(session, `!!document.querySelector('#act-new-agreement')`, 10000);
  await clickOk(
    session,
    tools,
    `(() => { const button = document.querySelector('#act-new-agreement'); if (!button) return false; button.click(); return true; })()`,
    'new agreement button is missing',
  );
  await tools.waitUntil(
    session,
    `!!document.querySelector(${JSON.stringify('button[data-cparty]')}) && !!document.querySelector(${JSON.stringify('button[data-cproj="' + tools.PROJECT_ID + '"]')})`,
    10000,
  );
  await clickOk(
    session,
    tools,
    `(() => { const party = [...document.querySelectorAll('[data-cparty]')].find(el => (el.textContent || '').includes(${JSON.stringify(party)})); if (!party) return false; party.click(); return true; })()`,
    'party pill is missing',
  );
  await tools.waitUntil(
    session,
    `!!document.querySelector(${JSON.stringify('button[data-cproj="' + tools.PROJECT_ID + '"]')})`,
    10000,
  );
  await clickOk(
    session,
    tools,
    `(() => { const project = document.querySelector(${JSON.stringify('button[data-cproj="' + tools.PROJECT_ID + '"]')}); if (!project) return false; project.click(); return true; })()`,
    'project pill is missing',
  );
  await tools.waitUntil(session, `!!document.querySelector('#cw-rate')`, 10000);
  const form = await tools.evaluate(session, `(document.querySelector('#main') || {}).innerText || ''`);
  if (typeof form !== 'string' || !form.includes('حسب الإنجاز (الكمية × سعر الوحدة)'))
    tools.fail('STOP: agreement form did not say حسب الإنجاز (الكمية × سعر الوحدة)');
  await tools.shoot(session, path.join(dir, 'form.png'));
  const before = new Set((await readRows(run, tools, 'agreements')).map(row => row.id));
  await clickOk(
    session,
    tools,
    `(() => { const rate = document.querySelector('#cw-rate'); const per = document.querySelector('#cw-per'); const unit = document.querySelector('#cw-unit'); const desc = document.querySelector('#cw-desc'); const save = document.querySelector('#act-new-agreement'); if (!rate || !per || !unit || !desc || !save) return false; rate.value = ${JSON.stringify(RATE)}; per.value = ${JSON.stringify(PER)}; unit.value = ${JSON.stringify(UNIT_NAME)}; desc.value = ${JSON.stringify(DESCRIPTION)}; save.click(); return true; })()`,
    'agreement fields are missing',
  );
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const rows = (await readRows(run, tools, 'agreements')).filter(
      row => !before.has(row.id) && row.description === DESCRIPTION,
    );
    if (rows.length === 1) return rows[0];
    if (rows.length > 1) tools.fail('STOP: Firestore has ' + rows.length + ' new agreements');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  tools.fail('STOP: agreement was not stored');
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 * @param {any} session
 * @param {Set<string>} before
 */
async function saveMeasurement(run, tools, session, before) {
  await tools.waitUntil(session, `!!document.querySelector('#cw-qty')`, 10000);
  await clickOk(
    session,
    tools,
    `(() => { const qty = document.querySelector('#cw-qty'); const save = document.querySelector('#act-labor-qty'); if (!qty || !save) return false; qty.value = ${JSON.stringify(QTY)}; save.click(); return true; })()`,
    'measurement save is missing',
  );
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const rows = (await readRows(run, tools, 'accountTxns')).filter(
      row => !before.has(row.id) && row.purpose === 'laborQty',
    );
    if (rows.length === 1) return rows[0];
    if (rows.length > 1) tools.fail('STOP: Firestore has ' + rows.length + ' new measurements');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  tools.fail('STOP: measurement was not stored');
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 * @param {any} session
 * @param {Set<string>} before
 */
async function approveMeasurement(run, tools, session, before) {
  await tools.waitUntil(session, `!!document.querySelector('#act-approve-labor')`, 10000);
  const expected = await tools.evaluate(session, 'today()');
  await clickOk(
    session,
    tools,
    `(() => { const save = document.querySelector('#act-approve-labor'); if (!save) return false; save.click(); return true; })()`,
    'approval save is missing',
  );
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const rows = (await readRows(run, tools, 'accountTxns')).filter(
      row => !before.has(row.id) && row.purpose === 'approveLabor',
    );
    if (rows.length === 1) {
      const txnDate = rows[0].txnDate;
      if (typeof txnDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(txnDate))
        tools.fail('STOP: txnDate was ' + String(txnDate));
      if (txnDate !== expected) tools.fail('STOP: txnDate ' + txnDate + ' was not today() ' + String(expected));
      return rows[0];
    }
    if (rows.length > 1) tools.fail('STOP: Firestore has ' + rows.length + ' new approvals');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  tools.fail('STOP: approval was not stored');
}

/**
 * @param {any} session
 * @param {DriveTools} tools
 */
async function restoreNull(session, tools) {
  await tools.evaluate(
    session,
    `Accounts.CONTRACTOR_COST_START = null; dispatchEvent(new HashChangeEvent('hashchange')); true`,
  );
  const value = await tools.evaluate(session, 'Accounts.CONTRACTOR_COST_START');
  if (value !== null) tools.fail('STOP: export was left as ' + String(value));
  const src = fs.readFileSync(path.join(__dirname, '../../public/accounts.js'), 'utf8');
  if (!src.includes('const CONTRACTOR_COST_START = null;')) tools.fail('STOP: source binding is not null');
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 * @param {Set<string>} before
 * @param {string} purpose
 * @param {number} amount
 */
async function waitTxn(run, tools, before, purpose, amount) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const rows = (await readRows(run, tools, 'accountTxns')).filter(
      row => !before.has(row.id) && row.purpose === purpose && row.amount === amount,
    );
    if (rows.length === 1) {
      if (!rowDate(rows[0])) tools.fail('STOP: ' + purpose + ' txnDate was ' + String(rows[0].txnDate));
      return rows[0];
    }
    if (rows.length > 1) tools.fail('STOP: Firestore has ' + rows.length + ' new ' + purpose + ' rows');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  tools.fail('STOP: ' + purpose + ' was not stored');
}

/**
 * @param {Record<string, unknown>} row
 */
function rowDate(row) {
  const txnDate = row.txnDate;
  if (typeof txnDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(txnDate)) return '';
  return txnDate;
}

/**
 * @param {any} session
 * @param {DriveTools} tools
 * @param {string} selector
 * @param {string} text
 */
async function typeKeys(session, tools, selector, text) {
  const focused = await tools.evaluate(
    session,
    `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.focus(); return document.activeElement === el; })()`,
  );
  if (focused !== true) tools.fail('STOP: cannot focus ' + selector);
  for (const ch of text) {
    await session.send('Input.insertText', { text: ch });
  }
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 * @param {any} session
 * @param {string} dir
 * @param {Set<string>} before
 */
async function saveSplit(run, tools, session, dir, before) {
  await tools.waitUntil(session, `!!document.querySelector('#cp-amount')`, 10000);
  await typeKeys(session, tools, '#cp-amount', '100000');
  await tools.waitUntil(
    session,
    `(() => { const input = document.querySelector('#cp-amount'); return !!input && input.value === '100,000' && document.activeElement === input; })()`,
    10000,
  );
  const cleared = await tools.evaluate(
    session,
    `(() => { const input = document.querySelector('#cp-amount'); if (!input) return false; input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); return input.value === ''; })()`,
  );
  if (cleared !== true) tools.fail('STOP: amount field did not clear before the split');
  await typeKeys(session, tools, '#cp-amount', '700000');
  await tools.waitUntil(
    session,
    `(() => { const input = document.querySelector('#cp-amount'); const preview = document.querySelector('#cp-preview'); const text = preview ? preview.innerText || '' : ''; return !!input && input.value === '700,000' && document.activeElement === input && text.includes('عن عمل معتمد') && text.includes('سلفة') && text.includes(${JSON.stringify(PAY_TEXT)}) && text.includes(${JSON.stringify(ADVANCE_TEXT)}) && text.includes('سلفة، ليست مصروفاً.') && !text.includes('السلفة ليست مصروفاً'); })()`,
    10000,
  );
  const mid = (await readRows(run, tools, 'accountTxns')).filter(
    row => !before.has(row.id) && (row.purpose === 'payLabor' || row.purpose === 'advanceLabor'),
  );
  if (mid.length !== 0) tools.fail('STOP: cash was written before the preview');
  await tools.shoot(session, path.join(dir, 'preview.png'));
  await clickOk(
    session,
    tools,
    `(() => { const save = document.querySelector('#act-pay-labor'); if (!save) return false; save.click(); return true; })()`,
    'payment save is missing',
  );
  const pay = await waitTxn(run, tools, before, 'payLabor', 600000);
  const advance = await waitTxn(run, tools, before, 'advanceLabor', 100000);
  return { pay, advance };
}

/**
 * @param {string} featureId
 * @param {any} run
 * @param {DriveTools} tools
 */
async function drive(featureId, run, tools) {
  const party = PARTIES[featureId];
  if (!party) tools.fail('STOP: unknown payment drive ' + featureId);
  const dir = path.join(run.evidenceDir, featureId);
  fs.mkdirSync(dir, { recursive: true });
  const session = await tools.connectCdp(run.debugPort);
  let failure = null;
  try {
    await signIn(run, tools, session);
    await tools.shoot(session, path.join(dir, 'after-login.png'));
    await clickOk(
      session,
      tools,
      `(() => { const tab = document.querySelector('a[data-tab="home"]'); if (!tab) return false; tab.click(); return true; })()`,
      'home tab is missing',
    );
    await tools.waitUntil(
      session,
      `!!document.querySelector('#main') && (document.querySelector('#main').innerText || '').includes('إجمالي المصروف')`,
      10000,
    );
    const homeBefore = await tools.kvText(session, 'إجمالي المصروف');
    await ensureParty(run, tools, session, party);
    const known = new Set((await readRows(run, tools, 'accountTxns')).map(row => row.id));
    const agreement = await saveAgreement(run, tools, session, dir, party);
    if (!agreement) tools.fail('STOP: agreement missing');
    await saveMeasurement(run, tools, session, known);
    const approval = await approveMeasurement(run, tools, session, known);
    const split = await saveSplit(run, tools, session, dir, known);
    if (featureId === 'return-advance') {
      await tools.waitUntil(
        session,
        `!!document.querySelector(${JSON.stringify('button[data-ctarget="' + split.advance.id + '"]')})`,
        10000,
      );
      await clickOk(
        session,
        tools,
        `(() => { const pill = document.querySelector(${JSON.stringify('button[data-ctarget="' + split.advance.id + '"]')}); if (!pill) return false; pill.click(); return true; })()`,
        'advance pill is missing',
      );
      const advanceAmount = split.advance && split.advance.amount;
      const overAmount = typeof advanceAmount === 'number' ? advanceAmount + 1 : NaN;
      if (!Number.isSafeInteger(overAmount)) tools.fail('STOP: advance amount is not a number');
      const overText = String(overAmount);
      const overShown = overText.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      await typeKeys(session, tools, '#cp-return', overText);
      await tools.waitUntil(
        session,
        `(() => { const input = document.querySelector('#cp-return'); return !!input && input.value === ${JSON.stringify(overShown)} && document.activeElement === input; })()`,
        10000,
      );
      await clickOk(
        session,
        tools,
        `(() => { const save = document.querySelector('#act-return-advance'); if (!save || save.disabled) return false; save.click(); return true; })()`,
        'return over-advance save is missing',
      );
      await tools.waitUntil(
        session,
        `(document.querySelector('#main') || {}).innerText && document.querySelector('#main').innerText.includes('المُرجَع والتسوية أكبر من السلفة')`,
        10000,
      );
      const overRows = (await readRows(run, tools, 'accountTxns')).filter(
        row => !known.has(row.id) && row.purpose === 'returnAdvance',
      );
      if (overRows.length !== 0) tools.fail('STOP: over-advance return was written');
      const cleared = await tools.evaluate(
        session,
        `(() => { const input = document.querySelector('#cp-return'); if (!input) return false; input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); return input.value === ''; })()`,
      );
      if (cleared !== true) tools.fail('STOP: return field did not clear');
      await typeKeys(session, tools, '#cp-return', '30000');
      await tools.waitUntil(
        session,
        `(() => { const input = document.querySelector('#cp-return'); return !!input && input.value === '30,000' && document.activeElement === input && ((document.querySelector('#cp-return-preview') || {}).innerText || '').includes(${JSON.stringify(RETURN_TEXT)}); })()`,
        10000,
      );
      const mid = (await readRows(run, tools, 'accountTxns')).filter(
        row => !known.has(row.id) && row.purpose === 'returnAdvance',
      );
      if (mid.length !== 0) tools.fail('STOP: return was written before the preview');
      await clickOk(
        session,
        tools,
        `(() => { const save = document.querySelector('#act-return-advance'); if (!save || save.disabled) return false; save.click(); return true; })()`,
        'return save is missing',
      );
      const returned = await waitTxn(run, tools, known, 'returnAdvance', 30000);
      if (returned.targetId !== split.advance.id) tools.fail('STOP: return names ' + String(returned.targetId));
    }
    if (featureId === 'refund-labor') {
      await tools.waitUntil(
        session,
        `!!document.querySelector(${JSON.stringify('button[data-ctarget="' + split.pay.id + '"]')})`,
        10000,
      );
      await clickOk(
        session,
        tools,
        `(() => { const pill = document.querySelector(${JSON.stringify('button[data-ctarget="' + split.pay.id + '"]')}); if (!pill) return false; pill.click(); return true; })()`,
        'payment pill is missing',
      );
      await typeKeys(session, tools, '#cp-refund', '50000');
      await tools.waitUntil(
        session,
        `(() => { const input = document.querySelector('#cp-refund'); return !!input && input.value === '50,000' && document.activeElement === input && ((document.querySelector('#cp-refund-preview') || {}).innerText || '').includes(${JSON.stringify(REFUND_TEXT)}); })()`,
        10000,
      );
      const mid = (await readRows(run, tools, 'accountTxns')).filter(
        row => !known.has(row.id) && row.purpose === 'refundLabor',
      );
      if (mid.length !== 0) tools.fail('STOP: refund was written before the preview');
      await clickOk(
        session,
        tools,
        `(() => { const save = document.querySelector('#act-refund-labor'); if (!save || save.disabled) return false; save.click(); return true; })()`,
        'refund save is missing',
      );
      const refund = await waitTxn(run, tools, known, 'refundLabor', 50000);
      if (refund.targetId !== split.pay.id) tools.fail('STOP: refund names ' + String(refund.targetId));
    }
    if (featureId === 'review-cash') {
      await tools.waitUntil(
        session,
        `(document.querySelector('#main') || {}).innerText && document.querySelector('#main').innerText.includes('غير مدقّق')`,
        10000,
      );
      await clickOk(
        session,
        tools,
        `(() => { const button = document.querySelector(${JSON.stringify('button[data-creview="' + split.pay.id + '"]')}); if (!button) return false; button.click(); return true; })()`,
        'تدقيق is missing',
      );
      const deadline = Date.now() + 20000;
      let review = null;
      while (Date.now() < deadline) {
        const rows = (await readRows(run, tools, 'accountTxns')).filter(
          row => !known.has(row.id) && row.kind === 'revw' && row.targetId === split.pay.id,
        );
        if (rows.length === 1) {
          review = rows[0];
          break;
        }
        if (rows.length > 1) tools.fail('STOP: Firestore has ' + rows.length + ' new reviews');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      if (!review) tools.fail('STOP: review was not stored');
      if (review.id !== 'revw_' + split.pay.id) tools.fail('STOP: review id was ' + review.id);
      if (Object.prototype.hasOwnProperty.call(review, 'amount')) tools.fail('STOP: review has an amount');
      if (Object.prototype.hasOwnProperty.call(review, 'txnDate')) tools.fail('STOP: review has a txnDate');
    }
    const fresh = (await readRows(run, tools, 'accountTxns')).filter(row => !known.has(row.id));
    const advances = fresh.filter(row => row.purpose === 'advanceLabor');
    if (advances.length !== 1) tools.fail('STOP: this drive wrote ' + advances.length + ' advances');
    fs.writeFileSync(
      path.join(dir, 'firestore.json'),
      JSON.stringify({ agreement, approval, pay: split.pay, advance: split.advance }, null, 2),
    );
    await tools.shoot(session, path.join(dir, 'saved.png'));
    await restoreNull(session, tools);
    await clickOk(
      session,
      tools,
      `(() => { const tab = document.querySelector('a[data-tab="home"]'); if (!tab) return false; tab.click(); return true; })()`,
      'home tab is missing after the payment',
    );
    await tools.waitUntil(
      session,
      `(document.querySelector('#main') || {}).innerText && document.querySelector('#main').innerText.includes('إجمالي المصروف')`,
      10000,
    );
    const homeAfter = await tools.kvText(session, 'إجمالي المصروف');
    if (homeAfter !== homeBefore) tools.fail('STOP: home المصروف changed from ' + homeBefore + ' to ' + homeAfter);
    await tools.shoot(session, path.join(dir, 'home.png'));
    const left = await tools.evaluate(session, 'Accounts.CONTRACTOR_COST_START');
    if (left !== null) tools.fail('STOP: fixture was left in place');
    console.log(featureId + ' proved');
  } catch (err) {
    failure = err;
    throw err;
  } finally {
    try {
      await tools.evaluate(session, 'Accounts.CONTRACTOR_COST_START = null; true');
    } catch (err) {
      if (!failure) failure = err;
    }
    tools.finishSession(run.evidenceDir, session, failure, [run.authPort, run.firestorePort, run.hostingPort]);
  }
}

module.exports = { drive };
