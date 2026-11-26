'use strict';

const fs = require('fs');
const path = require('path');

const RATE = '300000';
const PER = '4000';
const QTY = '8000';
const ADVANCE = '100000';
const SETTLE = '٤٠٠٠٠';

/**
 * @param {any} session
 * @param {any} tools
 */
async function signIn(session, tools) {
  await session.send('Page.enable');
  await session.send('Runtime.enable');
  await session.send('Network.enable');
  const host = await tools.evaluate(session, 'location.hostname');
  if (host !== '127.0.0.1' && host !== 'localhost') tools.fail('STOP: refusing production host ' + String(host));
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
    `document.querySelector('#shell') && document.querySelector('#shell').hidden === false`,
    25000,
  );
}

/**
 * @param {any} session
 * @param {any} tools
 * @param {string} expression
 * @param {string} label
 */
async function clickOk(session, tools, expression, label) {
  const ok = await tools.evaluate(session, expression);
  if (ok !== true) tools.fail('STOP: ' + label);
}

/**
 * @param {any} run
 * @param {any} tools
 * @param {string} name
 */
async function readRows(run, tools, name) {
  return tools.readCollection(run.authPort, run.firestorePort, name);
}

/**
 * @param {any} session
 * @param {any} tools
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
 * @param {any} tools
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
 * @param {any} tools
 * @param {any} session
 * @param {string} party
 */
async function openCost(run, tools, session, party) {
  const day = await tools.evaluate(session, 'today()');
  if (typeof day !== 'string') tools.fail('STOP: today() was ' + String(day));
  await tools.evaluate(
    session,
    `Accounts.CONTRACTOR_COST_START = ${JSON.stringify(day)}; dispatchEvent(new HashChangeEvent('hashchange')); true`,
  );
  const existing = await readRows(run, tools, 'parties');
  if (!existing.some(row => row.name === party)) {
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
  }
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
  await tools.waitUntil(session, `!!document.querySelector('[data-cparty]')`, 10000);
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
    `(() => { const rate = document.querySelector('#cw-rate'); const per = document.querySelector('#cw-per'); const unit = document.querySelector('#cw-unit'); const desc = document.querySelector('#cw-desc'); const save = document.querySelector('#act-new-agreement'); if (!rate || !per || !unit || !desc || !save) return false; rate.value = ${JSON.stringify(RATE)}; per.value = ${JSON.stringify(PER)}; unit.value = 'طوبة'; desc.value = 'طابوق'; save.click(); return true; })()`,
    'agreement fields are missing',
  );
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const rows = (await readRows(run, tools, 'agreements')).filter(row => !before.has(row.id));
    if (rows.length === 1) return rows[0];
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  tools.fail('STOP: agreement was not stored');
}

/**
 * @param {any} run
 * @param {any} tools
 * @param {any} session
 * @param {Set<string>} known
 */
async function measureAndApprove(run, tools, session, known) {
  await tools.waitUntil(session, `!!document.querySelector('#cw-qty')`, 10000);
  await clickOk(
    session,
    tools,
    `(() => { const qty = document.querySelector('#cw-qty'); const save = document.querySelector('#act-labor-qty'); if (!qty || !save) return false; qty.value = ${JSON.stringify(QTY)}; save.click(); return true; })()`,
    'measurement save is missing',
  );
  let measurement = null;
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    const rows = (await readRows(run, tools, 'accountTxns')).filter(
      row => !known.has(row.id) && row.purpose === 'laborQty',
    );
    if (rows.length === 1) {
      measurement = rows[0];
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  if (!measurement) tools.fail('STOP: measurement was not stored');
  await tools.waitUntil(session, `!!document.querySelector('#act-approve-labor')`, 10000);
  await clickOk(
    session,
    tools,
    `(() => { const save = document.querySelector('#act-approve-labor'); if (!save) return false; save.click(); return true; })()`,
    'approval save is missing',
  );
  while (Date.now() < deadline + 20000) {
    const rows = (await readRows(run, tools, 'accountTxns')).filter(row => row.id === 'appr_' + measurement.id);
    if (rows.length === 1) return { measurement, approval: rows[0] };
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  tools.fail('STOP: approval was not stored');
}

/**
 * @param {string} featureId
 * @param {any} run
 * @param {any} tools
 */
async function drive(featureId, run, tools) {
  const party = featureId === 'settle' ? 'مقاول التسوية' : 'مقاول الكشف';
  const dir = path.join(run.evidenceDir, featureId);
  fs.mkdirSync(dir, { recursive: true });
  const session = await tools.connectCdp(run.debugPort);
  let failure = null;
  try {
    await signIn(session, tools);
    const known = new Set((await readRows(run, tools, 'accountTxns')).map(row => row.id));
    const agreement = await openCost(run, tools, session, party);
    if (!agreement) tools.fail('STOP: agreement missing');
    const saved = await measureAndApprove(run, tools, session, known);
    if (!saved) tools.fail('STOP: measurement missing');
    if (featureId === 'settle') {
      await tools.waitUntil(session, `!!document.querySelector('#cp-amount')`, 10000);
      await typeKeys(session, tools, '#cp-amount', ADVANCE);
      await clickOk(
        session,
        tools,
        `(() => { const save = document.querySelector('#act-advance-labor'); if (!save || save.disabled) return false; save.click(); return true; })()`,
        'advance save is missing',
      );
      let advance = null;
      const end = Date.now() + 20000;
      while (Date.now() < end) {
        const rows = (await readRows(run, tools, 'accountTxns')).filter(
          row => row.purpose === 'advanceLabor' && row.partyId === agreement.partyId && !known.has(row.id),
        );
        if (rows.length === 1) {
          advance = rows[0];
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      if (!advance) tools.fail('STOP: advance was not stored');
      await tools.waitUntil(session, `!!document.querySelector('#cs-amount')`, 10000);
      await clickOk(
        session,
        tools,
        `(() => { const row = document.querySelector(${JSON.stringify('[data-cs-adv="' + advance.id + '"]')}); if (!row) return false; row.click(); return true; })()`,
        'advance row is missing',
      );
      await typeKeys(session, tools, '#cs-amount', SETTLE);
      await clickOk(
        session,
        tools,
        `(() => { const save = document.querySelector('#act-settle'); if (!save || save.disabled) return false; save.click(); return true; })()`,
        'حفظ التسوية is missing',
      );
      const settleId = 'stl_' + saved.measurement.id + '_1';
      let settle = null;
      const stop = Date.now() + 20000;
      while (Date.now() < stop) {
        const rows = (await readRows(run, tools, 'accountTxns')).filter(row => row.id === settleId);
        if (rows.length === 1) {
          settle = rows[0];
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      if (!settle) tools.fail('STOP: settle was not stored');
      if (settle.settlesId !== advance.id) tools.fail('STOP: settlesId was ' + String(settle.settlesId));
      await typeKeys(session, tools, '#cc-reason', 'سبب');
      await clickOk(
        session,
        tools,
        `(() => { const save = document.querySelector(${JSON.stringify('[data-cs-rev="' + settleId + '"]')}); if (!save || save.disabled) return false; save.click(); return true; })()`,
        'settle reversal is missing',
      );
    }
    if (featureId === 'statement-approval') {
      const closed = await tools.evaluate(
        session,
        `(() => { const day = today(); const previous = Accounts.periodBounds('week', day); const start = previous.periodStart; AccountsView.writeAccountScope({ scope: 'project', projectId: ${JSON.stringify(tools.PROJECT_ID)}, periodKind: 'week', anchorDate: start }); dispatchEvent(new HashChangeEvent('hashchange')); const current = Accounts.periodBounds('week', day); return { start, currentEnd: current.periodEnd, today: day }; })()`,
      );
      await tools.waitUntil(session, `!!document.querySelector('[data-st-issue-card]')`, 10000);
      const absent = await tools.evaluate(session, `!document.querySelector('#act-issue')`);
      if (absent !== true && closed && closed.currentEnd >= closed.today)
        tools.fail('STOP: the open week still offers إصدار');
      await tools.evaluate(
        session,
        `(() => { const bounds = Accounts.periodBounds('week', ${JSON.stringify(closed && closed.start)}); const anchor = bounds.periodStart; AccountsView.writeAccountScope({ scope: 'project', projectId: ${JSON.stringify(tools.PROJECT_ID)}, periodKind: 'week', anchorDate: anchor }); dispatchEvent(new HashChangeEvent('hashchange')); return true; })()`,
      );
      await tools.waitUntil(session, `!!document.querySelector('#act-issue')`, 10000);
      const figures = await tools.evaluate(
        session,
        `(document.querySelector('[data-st-issue-card]') || {}).innerText || ''`,
      );
      if (typeof figures !== 'string' || !figures.includes('رصيد أول المدة'))
        tools.fail('STOP: the issue card does not show the figures');
      await clickOk(
        session,
        tools,
        `(() => { const save = document.querySelector('#act-issue'); if (!save) return false; save.click(); return true; })()`,
        'إصدار كشف حساب is missing',
      );
      const stop = Date.now() + 20000;
      let issued = null;
      while (Date.now() < stop) {
        const rows = await readRows(run, tools, 'statementApprovals');
        issued = rows.find(row => row.partyId === agreement.partyId && row.periodEnd < closed.today) || null;
        if (issued) break;
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      if (!issued) tools.fail('STOP: statement approval was not stored');
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
