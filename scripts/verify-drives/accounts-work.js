'use strict';

const fs = require('fs');
const path = require('path');

const RATE = '300000';
const PER = '4000';
const QTY = '8000';
const UNIT_NAME = 'طوبة';
const DESCRIPTION = 'طابوق';
const PARTY = 'مقاول الطابوق';
const AMOUNT_TEXT = '600,000';

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
 */
async function clickOk(session, tools, expression, label) {
  const ok = await tools.evaluate(session, expression);
  if (ok !== true) tools.fail('STOP: ' + label);
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 */
async function readRows(run, tools, name) {
  return tools.readCollection(run.authPort, run.firestorePort, name);
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 * @param {any} session
 */
async function ensureParty(run, tools, session) {
  const existing = await readRows(run, tools, 'parties');
  if (existing.some(row => row.name === PARTY)) return;
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
    `(() => { const name = document.querySelector('#party-name'); const save = document.querySelector('#save-party'); if (!name || !save) return false; name.value = ${JSON.stringify(PARTY)}; save.click(); return true; })()`,
    'person save is missing',
  );
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const rows = await readRows(run, tools, 'parties');
    if (rows.filter(row => row.name === PARTY).length === 1) return;
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  tools.fail('STOP: party was not stored');
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 * @param {any} session
 * @param {string} dir
 */
async function saveAgreement(run, tools, session, dir) {
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
    `!!document.querySelector('[data-cparty]') && !!document.querySelector(${JSON.stringify('button[data-cproj="' + tools.PROJECT_ID + '"]')})`,
    10000,
  );
  await clickOk(
    session,
    tools,
    `(() => { const party = document.querySelector('[data-cparty]'); if (!party) return false; party.click(); return true; })()`,
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
  if (typeof form !== 'string' || !form.includes('بسعر الوحدة'))
    tools.fail('STOP: agreement form did not say بسعر الوحدة');
  if (typeof form === 'string' && form.includes('حسب الإنجاز (الكمية × سعر الوحدة)')) {
    tools.fail('STOP: the waiting unit label was painted');
  }
  await tools.shoot(session, path.join(dir, 'form.png'));
  await clickOk(
    session,
    tools,
    `(() => { const rate = document.querySelector('#cw-rate'); const per = document.querySelector('#cw-per'); const unit = document.querySelector('#cw-unit'); const desc = document.querySelector('#cw-desc'); const save = document.querySelector('#act-new-agreement'); if (!rate || !per || !unit || !desc || !save) return false; rate.value = ${JSON.stringify(RATE)}; per.value = ${JSON.stringify(PER)}; unit.value = ${JSON.stringify(UNIT_NAME)}; desc.value = ${JSON.stringify(DESCRIPTION)}; save.click(); return true; })()`,
    'agreement fields are missing',
  );
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const rows = (await readRows(run, tools, 'agreements')).filter(row => row.description === DESCRIPTION);
    if (rows.length === 1) return rows[0];
    if (rows.length > 1) tools.fail('STOP: Firestore has ' + rows.length + ' agreements');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  tools.fail('STOP: agreement was not stored');
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 * @param {any} session
 */
async function saveMeasurement(run, tools, session) {
  await tools.waitUntil(session, `!!document.querySelector('#cw-qty')`, 10000);
  await clickOk(
    session,
    tools,
    `(() => { const qty = document.querySelector('#cw-qty'); const save = document.querySelector('#act-labor-qty'); if (!qty || !save) return false; qty.value = ${JSON.stringify(QTY)}; save.click(); return true; })()`,
    'measurement save is missing',
  );
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const rows = (await readRows(run, tools, 'accountTxns')).filter(row => row.purpose === 'laborQty');
    if (rows.length === 1) return rows[0];
    if (rows.length > 1) tools.fail('STOP: Firestore has ' + rows.length + ' measurements');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  tools.fail('STOP: measurement was not stored');
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 * @param {any} session
 */
async function approveMeasurement(run, tools, session) {
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
    const rows = (await readRows(run, tools, 'accountTxns')).filter(row => row.purpose === 'approveLabor');
    if (rows.length === 1) {
      const txnDate = rows[0].txnDate;
      if (typeof txnDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(txnDate)) {
        tools.fail('STOP: txnDate was ' + String(txnDate));
      }
      if (txnDate !== expected) tools.fail('STOP: txnDate ' + txnDate + ' was not today() ' + String(expected));
      return rows[0];
    }
    if (rows.length > 1) tools.fail('STOP: Firestore has ' + rows.length + ' approvals');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  tools.fail('STOP: approval was not stored');
}

/**
 * @param {any} run
 * @param {DriveTools} tools
 */
async function closeProject(run, tools) {
  const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
  const { doc, updateDoc } = require('firebase/firestore');
  const env = await initializeTestEnvironment({
    projectId: tools.PROJECT,
    firestore: { host: '127.0.0.1', port: run.firestorePort },
  });
  try {
    await env.withSecurityRulesDisabled(async ctx => {
      await updateDoc(doc(ctx.firestore(), 'projects', tools.PROJECT_ID), { status: 'closed' });
    });
  } finally {
    await env.cleanup();
  }
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
}

/**
 * @param {string} featureId
 * @param {any} run
 * @param {DriveTools} tools
 */
async function drive(featureId, run, tools) {
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
    await ensureParty(run, tools, session);
    const agreement = await saveAgreement(run, tools, session, dir);
    if (!agreement) tools.fail('STOP: agreement missing');
    if (featureId === 'new-agreement') {
      const rows = await readRows(run, tools, 'agreements');
      if (rows.length !== 1) tools.fail('STOP: agreements ' + rows.length);
      await restoreNull(session, tools);
      console.log('new-agreement proved');
      return;
    }
    if (featureId === 'cancel-agreement') {
      await closeProject(run, tools);
      await tools.waitUntil(session, `!!document.querySelector('#cw-reason')`, 10000);
      await clickOk(
        session,
        tools,
        `(() => { const reason = document.querySelector('#cw-reason'); const save = document.querySelector('#act-cancel-agreement'); if (!reason || !save) return false; reason.value = 'تصحيح المبلغ'; save.click(); return true; })()`,
        'cancel is missing',
      );
      await tools.waitUntil(
        session,
        `(document.querySelector('#main') || {}).innerText && document.querySelector('#main').innerText.includes('رُفض الإرسال')`,
        20000,
      );
      const rows = await readRows(run, tools, 'agreements');
      const live = rows.filter(row => String(row.id).indexOf('rev_') !== 0);
      const rev = rows.filter(row => String(row.id).indexOf('rev_') === 0);
      if (live.length !== 1 || rev.length !== 0) tools.fail('STOP: agreements after cancel ' + rows.length);
      await restoreNull(session, tools);
      console.log('cancel-agreement proved');
      return;
    }
    await saveMeasurement(run, tools, session);
    if (featureId === 'labor-qty') {
      const qty = (await readRows(run, tools, 'accountTxns')).filter(row => row.purpose === 'laborQty');
      if (qty.length !== 1) tools.fail('STOP: measurements ' + qty.length);
      await restoreNull(session, tools);
      console.log('labor-qty proved');
      return;
    }
    const approval = await approveMeasurement(run, tools, session);
    fs.writeFileSync(path.join(dir, 'firestore.json'), JSON.stringify({ agreement, approval }, null, 2));
    await tools.shoot(session, path.join(dir, 'saved.png'));
    await restoreNull(session, tools);
    const partyId = agreement.partyId;
    await clickOk(
      session,
      tools,
      `(() => { location.hash = ${JSON.stringify('#account/' + partyId)}; return true; })()`,
      'person page did not open',
    );
    await tools.waitUntil(
      session,
      `(document.querySelector('#main') || {}).innerText && document.querySelector('#main').innerText.includes('عمل معتمد') && document.querySelector('#main').innerText.includes(${JSON.stringify(AMOUNT_TEXT)})`,
      10000,
    );
    await tools.shoot(session, path.join(dir, 'person.png'));
    await clickOk(
      session,
      tools,
      `(() => { const tab = document.querySelector('a[data-tab="home"]'); if (!tab) return false; tab.click(); return true; })()`,
      'home tab is missing after approval',
    );
    await tools.waitUntil(
      session,
      `(document.querySelector('#main') || {}).innerText && document.querySelector('#main').innerText.includes('إجمالي المصروف')`,
      10000,
    );
    const homeAfter = await tools.kvText(session, 'إجمالي المصروف');
    if (homeAfter !== homeBefore) tools.fail('STOP: home المصروف changed from ' + homeBefore + ' to ' + homeAfter);
    if (homeAfter.includes(AMOUNT_TEXT))
      tools.fail('STOP: home المصروف included the approval while the export is null');
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
