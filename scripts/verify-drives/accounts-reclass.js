'use strict';

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
 * @param {any} run
 * @param {any} tools
 * @param {string} name
 * @param {(rows: any[]) => boolean} ready
 * @param {string} label
 */
async function waitRows(run, tools, name, ready, label) {
  const start = Date.now();
  let last = [];
  while (Date.now() - start < 25000) {
    last = await readRows(run, tools, name);
    if (ready(last)) return last;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  tools.fail('STOP: ' + label + ' (' + last.length + ' rows)');
}

/**
 * @param {any} session
 * @param {any} tools
 * @param {string} description
 */
async function saveLabour(session, tools, description) {
  await clickOk(
    session,
    tools,
    `(() => { const tab = document.querySelector('a[data-tab="entry"]'); if (!tab) return false; tab.click(); return true; })()`,
    'entry tab is missing',
  );
  await tools.waitUntil(session, `!!document.querySelector('[data-type="labour"]')`, 10000);
  await clickOk(
    session,
    tools,
    `(() => { const type = document.querySelector('[data-type="labour"]'); const project = document.querySelector(${JSON.stringify('button[data-proj="' + tools.PROJECT_ID + '"]')}); if (!type || !project) return false; type.click(); project.click(); return true; })()`,
    'labour type or project is missing',
  );
  await tools.waitUntil(session, `!!document.querySelector('#amt')`, 10000);
  const before = await tools.evaluate(session, `(AJ.get('entries') || []).length`);
  await clickOk(
    session,
    tools,
    `(() => { const amt = document.querySelector('#amt'); const desc = document.querySelector('#desc'); const save = document.querySelector('#save'); if (!amt || !desc || !save) return false; amt.value = '80000'; desc.value = ${JSON.stringify(description)}; save.click(); return true; })()`,
    'labour save is missing',
  );
  await tools.waitUntil(session, `(AJ.get('entries') || []).length > ${before}`, 10000);
  const id = await tools.evaluate(
    session,
    `(() => { const row = (AJ.get('entries') || []).find(item => item && item.entryType === 'labour' && item.description === ${JSON.stringify(description)}); return row ? row.id : ''; })()`,
  );
  if (typeof id !== 'string' || !id) tools.fail('STOP: labour id was not stored for ' + description);
  return id;
}

/**
 * @param {string} featureId
 * @param {any} run
 * @param {any} tools
 */
async function drive(featureId, run, tools) {
  if (featureId !== 'reclass') tools.fail('STOP: ' + featureId);
  const session = await tools.connectCdp(run.port, run.page);
  await signIn(session, tools);
  const constant = await tools.evaluate(session, 'Accounts.CONTRACTOR_COST_START');
  if (constant !== '2026-11-27') tools.fail('STOP: CONTRACTOR_COST_START is ' + String(constant));
  const parties = await readRows(run, tools, 'parties');
  if (!parties.some(row => row && row.name === 'حسن التحقق')) {
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
      `(() => { const name = document.querySelector('#party-name'); const save = document.querySelector('#save-party'); if (!name || !save) return false; name.value = 'حسن التحقق'; save.click(); return true; })()`,
      'person save is missing',
    );
    await waitRows(
      run,
      tools,
      'parties',
      rows => rows.some(row => row && row.name === 'حسن التحقق'),
      'party did not reach the server',
    );
  }
  const kept = await saveLabour(session, tools, 'أجر انخصم');
  const owed = await saveLabour(session, tools, 'أجر ملغى');
  await waitRows(
    run,
    tools,
    'ledgerEntries',
    rows => rows.some(row => row.id === kept) && rows.some(row => row.id === owed),
    'labour rows did not reach the server',
  );
  await clickOk(
    session,
    tools,
    `(() => { location.hash = '#accounts'; return true; })()`,
    'accounts hash did not open',
  );
  await tools.waitUntil(
    session,
    `!!document.querySelector(${JSON.stringify('[data-rc-review="' + kept + '"]')})`,
    10000,
  );
  await clickOk(
    session,
    tools,
    `(() => { const button = document.querySelector(${JSON.stringify('[data-rc-review="' + kept + '"]')}); if (!button) return false; button.click(); return true; })()`,
    'انخصم is missing',
  );
  await waitRows(
    run,
    tools,
    'laborReviews',
    rows => rows.some(row => row.id === 'lrv_' + kept),
    'انخصم did not reach the server',
  );
  await clickOk(
    session,
    tools,
    `(() => { const button = document.querySelector(${JSON.stringify('[data-rc-cancel="' + owed + '"]')}); if (!button) return false; button.click(); return true; })()`,
    'ملغى is missing',
  );
  await tools.waitUntil(session, `!!document.querySelector('#rc-reason')`, 10000);
  await clickOk(
    session,
    tools,
    `(() => { const reason = document.querySelector('#rc-reason'); const save = document.querySelector(${JSON.stringify('[data-rc-save-rev="' + owed + '"]')}); if (!reason || !save) return false; reason.value = 'تصحيح'; reason.dispatchEvent(new Event('input', { bubbles: true })); save.click(); return true; })()`,
    'reversal save is missing',
  );
  await tools.waitUntil(
    session,
    `(() => { const row = (AJ.get('entries') || []).find(item => item && item.id === ${JSON.stringify('rev_' + owed)}); return !!(row && typeof row.createdAtServer === 'number'); })()`,
    25000,
  );
  await clickOk(
    session,
    tools,
    `(() => { const button = document.querySelector(${JSON.stringify('[data-rc-advance="' + owed + '"]')}); if (!button || button.disabled) return false; button.click(); return true; })()`,
    'سلفة is missing',
  );
  await tools.waitUntil(session, `!!document.querySelector('[data-rc-party]')`, 10000);
  await clickOk(
    session,
    tools,
    `(() => { const pill = document.querySelector('[data-rc-party]'); const save = document.querySelector(${JSON.stringify('[data-rc-save-adv="' + owed + '"]')}); if (!pill || !save) return false; pill.click(); save.click(); return true; })()`,
    'advance save is missing',
  );
  await waitRows(
    run,
    tools,
    'accountTxns',
    rows =>
      rows.some(
        row =>
          row &&
          row.purpose === 'advanceLabor' &&
          typeof row.description === 'string' &&
          row.description.indexOf('L:' + owed + ';') === 0,
      ),
    'advance did not reach the server',
  );
  await clickOk(
    session,
    tools,
    `(() => { const button = document.querySelector('#logout'); if (!button) return false; button.click(); return true; })()`,
    'logout is missing',
  );
  await tools.waitUntil(session, `!!document.querySelector('#login-email')`, 25000);
  await signIn(session, tools);
  await clickOk(
    session,
    tools,
    `(() => { location.hash = '#accounts'; return true; })()`,
    'accounts hash did not reopen',
  );
  await tools.waitUntil(
    session,
    `(() => { const row = document.querySelector(${JSON.stringify('[data-rc-row="' + kept + '"]')}); return !!(row && row.textContent && row.textContent.includes('انخصم') && !row.querySelector('[data-rc-review]')); })()`,
    25000,
  );
  await tools.finishSession(session);
}

module.exports = { drive };
