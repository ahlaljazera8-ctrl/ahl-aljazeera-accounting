'use strict';

const fs = require('fs');
const path = require('path');

const RATE = '300000';
const PER = '4000';
const QTY = '8000';
const UNIT_NAME = 'طوبة';
const DESCRIPTION = 'طابوق';
const PARTIES = {
  supersede: 'مقاول النسخة',
  reject: 'مقاول الرفض',
  deduct: 'مقاول الخصم',
  'approve-deduct': 'مقاول اعتماد الخصم',
  reverse: 'مقاول العكس',
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
 * @param {any} session
 * @param {DriveTools} tools
 */
async function signIn(session, tools) {
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
  if (shellOpen === true) return;
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
  for (const ch of text) await session.send('Input.insertText', { text: ch });
}

/**
 * @param {any} session
 * @param {DriveTools} tools
 */
async function restoreNull(session, tools) {
  const src = fs.readFileSync(path.join(__dirname, '../../public/accounts.js'), 'utf8');
  const marker = "const CONTRACTOR_COST_START = '2026-11-27';";
  if (!src.includes(marker)) tools.fail('STOP: source binding is not 2026-11-27');
  await tools.evaluate(
    session,
    `Accounts.CONTRACTOR_COST_START = '2026-11-27'; dispatchEvent(new HashChangeEvent('hashchange')); true`,
  );
  const value = await tools.evaluate(session, 'Accounts.CONTRACTOR_COST_START');
  if (value !== '2026-11-27') tools.fail('STOP: export was left as ' + String(value));
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
  await clickOk(
    session,
    tools,
    `(() => { const project = document.querySelector(${JSON.stringify('button[data-cproj="' + tools.PROJECT_ID + '"]')}); if (!project) return false; project.click(); return true; })()`,
    'project pill is missing',
  );
  await tools.waitUntil(session, `!!document.querySelector('#cw-rate')`, 10000);
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
    if (rows.length === 1) {
      await tools.shoot(session, path.join(dir, 'form.png'));
      return rows[0];
    }
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
      row => !before.has(row.id) && row.purpose === 'laborQty' && row.kind === 'body',
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
    if (rows.length === 1) return rows[0];
    if (rows.length > 1) tools.fail('STOP: Firestore has ' + rows.length + ' new approvals');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  tools.fail('STOP: approval was not stored');
}

/**
 * @param {string} featureId
 * @param {any} run
 * @param {DriveTools} tools
 */
async function drive(featureId, run, tools) {
  const party = PARTIES[featureId];
  if (!party) tools.fail('STOP: unknown correction drive ' + featureId);
  const dir = path.join(run.evidenceDir, featureId);
  fs.mkdirSync(dir, { recursive: true });
  const session = await tools.connectCdp(run.debugPort);
  let failure = null;
  try {
    await signIn(session, tools);
    await tools.shoot(session, path.join(dir, 'after-login.png'));
    await ensureParty(run, tools, session, party);
    const known = new Set((await readRows(run, tools, 'accountTxns')).map(row => row.id));
    await saveAgreement(run, tools, session, dir, party);
    const measurement = await saveMeasurement(run, tools, session, known);
    if (!measurement) tools.fail('STOP: measurement missing');
    if (featureId === 'supersede') {
      await typeKeys(session, tools, '#cc-sup-qty', '9000');
      await clickOk(
        session,
        tools,
        `(() => { const save = document.querySelector(${JSON.stringify('button[data-cc-sup="' + measurement.id + '"]')}); if (!save || save.disabled) return false; save.click(); return true; })()`,
        'نسخة جديدة is missing',
      );
      const deadline = Date.now() + 20000;
      let copy = null;
      while (Date.now() < deadline) {
        const rows = (await readRows(run, tools, 'accountTxns')).filter(row => row.id === 'sup_' + measurement.id);
        if (rows.length === 1) {
          copy = rows[0];
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      if (!copy) tools.fail('STOP: supersede was not stored');
      if (copy.qty !== 9000) tools.fail('STOP: supersede qty was ' + String(copy.qty));
    }
    if (featureId === 'reject') {
      await clickOk(
        session,
        tools,
        `(() => { const save = document.querySelector(${JSON.stringify('button[data-cc-rej="' + measurement.id + '"]')}); if (!save || save.disabled) return false; save.click(); return true; })()`,
        'رفض السطر is missing',
      );
      const deadline = Date.now() + 20000;
      let rejected = null;
      while (Date.now() < deadline) {
        const rows = (await readRows(run, tools, 'accountTxns')).filter(row => row.id === 'rej_' + measurement.id);
        if (rows.length === 1) {
          rejected = rows[0];
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      if (!rejected) tools.fail('STOP: reject was not stored');
      if (Object.prototype.hasOwnProperty.call(rejected, 'amount')) tools.fail('STOP: reject has an amount');
    }
    if (featureId === 'deduct' || featureId === 'approve-deduct' || featureId === 'reverse') {
      const approval = await approveMeasurement(run, tools, session, known);
      if (!approval) tools.fail('STOP: approval missing');
      if (featureId === 'deduct' || featureId === 'approve-deduct') {
        await typeKeys(session, tools, '#cc-deduct', '50000');
        await tools.waitUntil(
          session,
          `(() => { const input = document.querySelector('#cc-deduct'); return !!input && input.value === '50,000'; })()`,
          10000,
        );
        await typeKeys(session, tools, '#cc-ded-reason', 'سبب');
        await clickOk(
          session,
          tools,
          `(() => { const save = document.querySelector('#act-deduct'); if (!save || save.disabled) return false; save.click(); return true; })()`,
          'حفظ is missing',
        );
        const deadline = Date.now() + 20000;
        let deduct = null;
        while (Date.now() < deadline) {
          const rows = (await readRows(run, tools, 'accountTxns')).filter(
            row => row.purpose === 'deduct' && row.amount === 50000,
          );
          if (rows.length === 1) {
            deduct = rows[0];
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        if (!deduct) tools.fail('STOP: deduct was not stored');
        if (deduct.cumAmount !== 50000) tools.fail('STOP: cumAmount was ' + String(deduct.cumAmount));
        if (deduct.id !== 'd1' + approval.id) tools.fail('STOP: deduct id was ' + String(deduct.id));
        if (featureId === 'approve-deduct') {
          await clickOk(
            session,
            tools,
            `(() => { const save = document.querySelector(${JSON.stringify('#act-approve-deduct-' + deduct.id)}); if (!save || save.disabled) return false; save.click(); return true; })()`,
            'اعتماد الخصم is missing',
          );
          const end = Date.now() + 20000;
          let mark = null;
          while (Date.now() < end) {
            const rows = (await readRows(run, tools, 'accountTxns')).filter(row => row.id === 'appr_' + deduct.id);
            if (rows.length === 1) {
              mark = rows[0];
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          if (!mark) tools.fail('STOP: approve deduct was not stored');
          if (Object.prototype.hasOwnProperty.call(mark, 'amount')) tools.fail('STOP: approve deduct has an amount');
        }
      }
      if (featureId === 'reverse') {
        await typeKeys(session, tools, '#cc-reason', 'سبب');
        await clickOk(
          session,
          tools,
          `(() => { const save = document.querySelector(${JSON.stringify('button[data-cc-rev="' + approval.id + '"]')}); if (!save || save.disabled) return false; save.click(); return true; })()`,
          'عكس is missing',
        );
        const deadline = Date.now() + 20000;
        let approvalRev = null;
        let bodyRev = null;
        while (Date.now() < deadline) {
          const rows = await readRows(run, tools, 'accountTxns');
          approvalRev = rows.find(row => row.id === 'rev_' + approval.id) || null;
          bodyRev = rows.find(row => row.id === 'rev_' + measurement.id) || null;
          if (approvalRev && bodyRev) break;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        if (!approvalRev || !bodyRev) tools.fail('STOP: reversal pair was not stored');
      }
    }
    await tools.shoot(session, path.join(dir, 'saved.png'));
    await restoreNull(session, tools);
    console.log(featureId + ' proved');
  } catch (err) {
    failure = err;
    throw err;
  } finally {
    try {
      await tools.evaluate(session, `Accounts.CONTRACTOR_COST_START = '2026-11-27'; true`);
    } catch (err) {
      if (!failure) failure = err;
    }
    tools.finishSession(run.evidenceDir, session, failure, [run.authPort, run.firestorePort, run.hostingPort]);
  }
}

module.exports = { drive };
