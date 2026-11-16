// Behaviour of the contractor account rules against the Firestore emulator.
// Run only under `firebase emulators:exec` (FIRESTORE_EMULATOR_HOST must be local).
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  initializeTestEnvironment, assertFails, assertSucceeds,
} = require('@firebase/rules-unit-testing');
const {
  doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch,
} = require('firebase/firestore');
const Sync = require('../../public/sync.js');
const Accounts = require('../../public/accounts.js');

const PROJECT_ID = 'ahl-aljazeera-accounting';
const OWNER_A = 'owner-a';
const OWNER_B = 'owner-b';
const SITE = 'site-1';
const OFF = 'owner-off';
const PARTY = 'party-1';
const P1 = 'p1';
const RULES = fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8');
const ID_OK = /^[A-Za-z0-9_-]{1,64}$/;

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) {
    throw new Error(name + ' must be a local emulator (refusing production). Got: ' + raw);
  }
  const [host, port] = raw.split(':');
  return { host, port: Number(port) };
}

let testEnv;
let chain = Promise.resolve();
/** @type {Map<string, import('firebase/firestore').Firestore>} */
const contexts = new Map();

function testSeq(name, fn, timeout) {
  test(name, { timeout: timeout || 30000 }, async () => {
    const prev = chain;
    let release;
    chain = new Promise(r => { release = r; });
    await prev;
    try { await fn(); }
    finally { release(); }
  });
}

test.before(async () => {
  const host = localHost('FIRESTORE_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES, host: host.host, port: host.port },
  });
});

test.after(async () => {
  // cleanup() drops each Firebase app without awaiting delete(). Those
  // cancellations then make the next file's clearFirestore return CANCELLED.
  const closing = [];
  for (const fs of contexts.values()) {
    const app = /** @type {{ delete?: () => Promise<void> }} */ (/** @type {any} */ (fs).app);
    if (app && typeof app.delete === 'function') closing.push(Promise.resolve(app.delete()).catch(() => {}));
  }
  contexts.clear();
  await Promise.all(closing);
  if (testEnv) await testEnv.clearFirestore();
});

function db(uid) {
  const key = uid || '';
  const cached = contexts.get(key);
  if (cached) return cached;
  const ctx = uid ? testEnv.authenticatedContext(uid) : testEnv.unauthenticatedContext();
  const fs = ctx.firestore();
  contexts.set(key, fs);
  return fs;
}

function uuid(n) {
  return 'aaaaaaaa-bbbb-cccc-dddd-' + n.toString(16).padStart(12, '0');
}
function slotOf(agreementId, gen) {
  return '000' + agreementId.replaceAll('-', '') + String(gen);
}
function row(uid, fields) {
  const src = fields || {};
  const out = Object.assign({ createdBy: uid, deviceId: 'device-' + uid }, src);
  if (!Object.prototype.hasOwnProperty.call(src, 'createdAtServer')) out.createdAtServer = serverTimestamp();
  return out;
}
function send(uid, col, id, fields) {
  return setDoc(doc(db(uid), col, id), row(uid, Object.assign({ id }, fields)));
}
const allow = p => assertSucceeds(p);
const deny = p => assertFails(p);

function userDoc(uid, over) {
  return Object.assign({
    displayName: 'Owner A', email: uid + '@example.invalid', role: 'owner', active: true,
    assignedProjectIds: [], createdAtServer: new Date(), createdBy: OWNER_A,
  }, over);
}
function projectDoc(id, status) {
  return {
    id, name: 'School', clientName: 'Client', location: 'Here', currency: 'IQD', status: status || 'active',
    createdAtDevice: 1, createdAtServer: new Date(), createdBy: OWNER_A, deviceId: 'admin',
  };
}
function partyDoc(id, name) {
  return { id, name: name || 'Kareem', createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin' };
}

async function seed() {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'users', OWNER_A), userDoc(OWNER_A, { displayName: 'Owner A', email: 'owner-a@example.invalid' }));
    await setDoc(doc(d, 'users', OWNER_B), userDoc(OWNER_B, { displayName: 'Owner B', email: 'owner-b@example.invalid' }));
    await setDoc(doc(d, 'users', SITE), userDoc(SITE, { displayName: 'Site', email: 'site@example.invalid', role: 'site', assignedProjectIds: [P1] }));
    await setDoc(doc(d, 'users', OFF), userDoc(OFF, { displayName: 'Off', email: 'off@example.invalid', active: false }));
    await setDoc(doc(d, 'projects', P1), projectDoc(P1, 'active'));
    await setDoc(doc(d, 'projects', 'p2'), projectDoc('p2', 'active'));
    await setDoc(doc(d, 'projects', 'p-closed'), projectDoc('p-closed', 'closed'));
    await setDoc(doc(d, 'projects', 'p-arch'), projectDoc('p-arch', 'archived'));
    await setDoc(doc(d, 'parties', PARTY), partyDoc(PARTY));
  });
}

async function adminSet(col, id, data) {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), col, id), data);
  });
}

const ISO = 'p-iso';

async function openIso() {
  await adminSet('projects', ISO, projectDoc(ISO, 'active'));
}

async function dropIso() {
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await deleteDoc(doc(ctx.firestore(), 'projects', ISO));
  });
}

function lump(id, over) {
  return Object.assign({
    id, partyId: PARTY, projectId: P1, method: 'lump', description: 'wall', currency: 'IQD', lumpAmount: 5000,
  }, over);
}
function unitAgreement(id, over) {
  return Object.assign({
    id, partyId: PARTY, projectId: P1, method: 'unit', description: 'bricks', currency: 'IQD',
    unitRate: 300000, unitQty: 4000, unitName: 'brick',
  }, over);
}
function dailyAgreement(id, over) {
  return Object.assign({
    id, partyId: PARTY, projectId: P1, method: 'daily', description: 'days', currency: 'IQD', dayRate: 500,
  }, over);
}
function mileAgreement(id, over) {
  return Object.assign({
    id, partyId: PARTY, projectId: P1, method: 'milestone', description: 'gate', currency: 'IQD',
    milestoneAmount: 8000, milestoneMode: 'amount',
  }, over);
}
function measurement(id, agreementId, qtyValue, over) {
  return Object.assign({
    id, kind: 'body', purpose: 'laborQty', projectId: P1, partyId: PARTY, agreementId,
    ledger: 'labor', currency: 'IQD', fxRate: 1, qty: qtyValue,
  }, over);
}
function slotBody(agreementId, gen, over) {
  const id = slotOf(agreementId, gen);
  return Object.assign({
    id, kind: 'body', purpose: 'laborQty', projectId: P1, partyId: PARTY, agreementId,
    ledger: 'labor', currency: 'IQD', fxRate: 1,
  }, over);
}
function cash(id, purpose, amount, over) {
  return Object.assign({
    id, kind: 'body', purpose, projectId: P1, partyId: PARTY, ledger: 'labor',
    currency: 'IQD', fxRate: 1, amount,
  }, over);
}
function approval(targetId, agreementId, amount, qtyValue, over) {
  const id = 'appr_' + targetId;
  const base = {
    id, kind: 'appr', purpose: 'approveLabor', projectId: P1, partyId: PARTY, agreementId,
    ledger: 'labor', currency: 'IQD', fxRate: 1, targetId, amount,
  };
  if (qtyValue != null) base.qty = qtyValue;
  return Object.assign(base, over);
}
function supOf(old, over) {
  const out = {
    id: 'sup_' + old.id, kind: 'sup', purpose: old.purpose, ledger: old.ledger,
    projectId: old.projectId, partyId: old.partyId, currency: old.currency, fxRate: old.fxRate,
    supersedesId: old.id,
  };
  if (Object.prototype.hasOwnProperty.call(old, 'agreementId')) out.agreementId = old.agreementId;
  if (Object.prototype.hasOwnProperty.call(old, 'qty')) out.qty = old.qty;
  if (Object.prototype.hasOwnProperty.call(old, 'amount')) out.amount = old.amount;
  if (Object.prototype.hasOwnProperty.call(old, 'targetId')) out.targetId = old.targetId;
  return Object.assign(out, over);
}
function rejOf(targetId) {
  return { id: 'rej_' + targetId, kind: 'rej', targetId };
}
function txnRev(original, over) {
  const out = {
    id: 'rev_' + original.id, kind: 'rev', purpose: original.purpose, ledger: original.ledger,
    projectId: original.projectId, partyId: original.partyId, currency: original.currency,
    fxRate: original.fxRate, reversesId: original.id, reversalReason: 'fix',
  };
  if (Object.prototype.hasOwnProperty.call(original, 'amount')) out.amount = original.amount;
  if (Object.prototype.hasOwnProperty.call(original, 'agreementId')) out.agreementId = original.agreementId;
  return Object.assign(out, over);
}
function revwOf(cashRow, gen) {
  const id = gen ? 'revw_' + cashRow.id + '_' + gen : 'revw_' + cashRow.id;
  return {
    id, kind: 'revw', purpose: cashRow.purpose, ledger: cashRow.ledger || 'labor',
    projectId: cashRow.projectId, partyId: cashRow.partyId, currency: cashRow.currency,
    fxRate: cashRow.fxRate, targetId: cashRow.id,
  };
}
function settle(measurementId, advanceId, gen, amount, over) {
  return Object.assign({
    id: 'stl_' + measurementId + '_' + gen, kind: 'stl', purpose: 'settle', projectId: P1, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount, targetId: measurementId, settlesId: advanceId,
  }, over);
}
function deductOf(id, approvalId, amount, over) {
  return Object.assign({
    id, kind: 'body', purpose: 'deduct', projectId: P1, partyId: PARTY, ledger: 'labor',
    currency: 'IQD', fxRate: 1, amount, targetId: approvalId,
  }, over);
}
function approveDeductOf(body) {
  return {
    id: 'appr_' + body.id, kind: 'appr', purpose: 'approveDeduct', projectId: body.projectId,
    partyId: body.partyId, ledger: 'labor', currency: body.currency, fxRate: body.fxRate, targetId: body.id,
  };
}
function agRev(agreement, reason) {
  return Object.assign({}, agreement, {
    id: 'rev_' + agreement.id, reversesId: agreement.id,
    reversalReason: reason === undefined ? 'x' : reason,
  });
}
function statement(uid, fields) {
  const src = fields || {};
  const out = Object.assign({ createdBy: uid }, src);
  if (!Object.prototype.hasOwnProperty.call(src, 'createdAtServer')) out.createdAtServer = serverTimestamp();
  return out;
}
function sendStatement(uid, id, fields) {
  return setDoc(doc(db(uid), 'statementApprovals', id), statement(uid, Object.assign({ id }, fields)));
}

/**
 * @param {string} uid
 * @param {Array<[string, Record<string, unknown>]>} pairs
 */
async function commitBatch(uid, pairs) {
  const fs = db(uid);
  const batch = writeBatch(fs);
  for (const [id, fields] of pairs) {
    batch.set(doc(fs, 'accountTxns', id), row(uid, Object.assign({ id }, fields)));
  }
  let commit = 'ok';
  try { await batch.commit(); }
  catch (err) { commit = String((err && (err.code || err.message)) || err); }
  /** @type {Record<string, boolean>} */
  const exists = {};
  for (const [id] of pairs) exists[id] = (await getDoc(doc(db(uid), 'accountTxns', id))).exists();
  return { commit, exists };
}

/**
 * @param {{ commit: string, exists: Record<string, boolean> }} result
 * @param {string[]} ids
 */
function assertBatchDenied(result, ids) {
  assert.equal(result.commit, 'permission-denied');
  for (const id of ids) assert.equal(result.exists[id], false, id);
}

async function putUnit(agreementId, qtyId, qtyValue) {
  await allow(send(OWNER_A, 'agreements', agreementId, unitAgreement(agreementId)));
  const body = measurement(qtyId, agreementId, qtyValue);
  await allow(send(OWNER_A, 'accountTxns', qtyId, body));
  return body;
}
async function putApprovedUnit(agreementId, qtyId, qtyValue, amount) {
  const body = await putUnit(agreementId, qtyId, qtyValue);
  const mark = approval(qtyId, agreementId, amount, qtyValue);
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  return { body, mark };
}

function eachFunction(src) {
  const out = [];
  const re = /function ([A-Za-z0-9_]+)\(/g;
  let m;
  while ((m = re.exec(src))) {
    const brace = src.indexOf('{', m.index);
    let depth = 0;
    let end = -1;
    for (let i = brace; i < src.length; i++) {
      if (src[i] === '{') depth += 1;
      else if (src[i] === '}') {
        depth -= 1;
        if (depth === 0) { end = i; break; }
      }
    }
    out.push({ name: m[1], body: src.slice(brace + 1, end) });
  }
  return out;
}
function fnBody(src, name) {
  const found = eachFunction(src).filter(item => item.name === name);
  assert.equal(found.length, 1, name);
  return found[0].body;
}

testSeq('header: partyCreate denies a spoofed header and an extra key', async () => {
  await seed();
  await allow(send(OWNER_A, 'parties', 'party-ok', { id: 'party-ok', name: 'Kareem' }));
  await deny(send(OWNER_A, 'parties', 'party-by', { id: 'party-by', name: 'Kareem', createdBy: OWNER_B }));
  await deny(send(OWNER_A, 'parties', 'party-time', { id: 'party-time', name: 'Kareem', createdAtServer: new Date() }));
  await deny(send(OWNER_A, 'parties', 'party-name', { id: 'party-name', name: 'Kareem', createdByName: 'Not Owner' }));
  await deny(send(OWNER_A, 'parties', 'party-dev0', { id: 'party-dev0', name: 'Kareem', deviceId: '' }));
  await deny(send(OWNER_A, 'parties', 'party-dev129', { id: 'party-dev129', name: 'Kareem', deviceId: 'x'.repeat(129) }));
  await deny(send(OWNER_A, 'parties', 'party-extra', { id: 'party-extra', name: 'Kareem', extra: 1 }));
});

testSeq('header: agreementCreate denies a spoofed header and an extra key', async () => {
  await seed();
  await allow(send(OWNER_A, 'agreements', uuid(1), lump(uuid(1))));
  await deny(send(OWNER_A, 'agreements', uuid(2), lump(uuid(2), { createdBy: OWNER_B })));
  await deny(send(OWNER_A, 'agreements', uuid(3), lump(uuid(3), { createdAtServer: new Date() })));
  await deny(send(OWNER_A, 'agreements', uuid(4), lump(uuid(4), { createdByName: 'Not Owner' })));
  await deny(send(OWNER_A, 'agreements', uuid(5), lump(uuid(5), { deviceId: '' })));
  await deny(send(OWNER_A, 'agreements', uuid(6), lump(uuid(6), { deviceId: 'x'.repeat(129) })));
  await deny(send(OWNER_A, 'agreements', uuid(7), lump(uuid(7), { extra: 1 })));
});

testSeq('header: cashBodyCreate denies a spoofed header and an extra key', async () => {
  await seed();
  await allow(send(OWNER_A, 'accountTxns', uuid(1), cash(uuid(1), 'payLabor', 1000)));
  await deny(send(OWNER_A, 'accountTxns', uuid(2), cash(uuid(2), 'payLabor', 1000, { createdBy: OWNER_B })));
  await deny(send(OWNER_A, 'accountTxns', uuid(3), cash(uuid(3), 'payLabor', 1000, { createdAtServer: new Date() })));
  await deny(send(OWNER_A, 'accountTxns', uuid(4), cash(uuid(4), 'payLabor', 1000, { createdByName: 'Not Owner' })));
  await deny(send(OWNER_A, 'accountTxns', uuid(5), cash(uuid(5), 'payLabor', 1000, { deviceId: '' })));
  await deny(send(OWNER_A, 'accountTxns', uuid(6), cash(uuid(6), 'payLabor', 1000, { deviceId: 'x'.repeat(129) })));
  await deny(send(OWNER_A, 'accountTxns', uuid(7), cash(uuid(7), 'payLabor', 1000, { extra: 1 })));
});

testSeq('header: statementWithProjectCreate denies a spoofed createdBy, createdAtServer, and createdByName, and denies deviceId as an extra key', async () => {
  await seed();
  const ok = { partyId: PARTY, projectId: P1, periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13' };
  await allow(sendStatement(OWNER_A, uuid(1), ok));
  await deny(sendStatement(OWNER_A, uuid(2), Object.assign({ createdBy: OWNER_B }, ok)));
  await deny(sendStatement(OWNER_A, uuid(3), Object.assign({ createdAtServer: new Date() }, ok)));
  await deny(sendStatement(OWNER_A, uuid(4), Object.assign({ createdByName: 'Not Owner' }, ok)));
  await deny(sendStatement(OWNER_A, uuid(5), Object.assign({ deviceId: '' }, ok)));
  await deny(sendStatement(OWNER_A, uuid(6), Object.assign({ deviceId: 'x'.repeat(129) }, ok)));
});

testSeq('header: agreementReversalCreate denies a spoofed header and an extra key', async () => {
  await seed();
  const agreement = lump(uuid(1));
  await allow(send(OWNER_A, 'agreements', agreement.id, agreement));
  const rev = agRev(agreement, 'fix');
  await deny(send(OWNER_A, 'agreements', rev.id, Object.assign({}, rev, { createdBy: OWNER_B })));
  await deny(send(OWNER_A, 'agreements', rev.id, Object.assign({}, rev, { createdAtServer: new Date() })));
  await deny(send(OWNER_A, 'agreements', rev.id, Object.assign({}, rev, { createdByName: 'Not Owner' })));
  await deny(send(OWNER_A, 'agreements', rev.id, Object.assign({}, rev, { deviceId: '' })));
  await deny(send(OWNER_A, 'agreements', rev.id, Object.assign({}, rev, { deviceId: 'x'.repeat(129) })));
  await deny(send(OWNER_A, 'agreements', rev.id, Object.assign({}, rev, { extra: 1 })));
  await allow(send(OWNER_A, 'agreements', rev.id, rev));
});

testSeq('project: agreementCreate denies a closed project, an archived project, and a missing project', async () => {
  await seed();
  await allow(send(OWNER_A, 'agreements', uuid(1), lump(uuid(1))));
  await deny(send(OWNER_A, 'agreements', uuid(2), lump(uuid(2), { projectId: 'p-closed' })));
  await deny(send(OWNER_A, 'agreements', uuid(3), lump(uuid(3), { projectId: 'p-arch' })));
  await deny(send(OWNER_A, 'agreements', uuid(4), lump(uuid(4), { projectId: 'missing-project' })));
});

testSeq('project: cashBodyCreate denies a closed project, an archived project, and a missing project', async () => {
  await seed();
  await allow(send(OWNER_A, 'accountTxns', uuid(1), cash(uuid(1), 'advanceLabor', 1000)));
  await deny(send(OWNER_A, 'accountTxns', uuid(2), cash(uuid(2), 'payLabor', 1000, { projectId: 'p-closed' })));
  await deny(send(OWNER_A, 'accountTxns', uuid(3), cash(uuid(3), 'payLabor', 1000, { projectId: 'p-arch' })));
  await deny(send(OWNER_A, 'accountTxns', uuid(4), cash(uuid(4), 'payLabor', 1000, { projectId: 'missing-project' })));
});

testSeq('project: statementWithProjectCreate denies a closed project, an archived project, and a missing project', async () => {
  await seed();
  const base = { partyId: PARTY, periodKind: 'month', periodStart: '2026-11-01', periodEnd: '2026-11-30' };
  await allow(sendStatement(OWNER_A, uuid(1), Object.assign({ projectId: P1 }, base)));
  await deny(sendStatement(OWNER_A, uuid(2), Object.assign({ projectId: 'p-closed' }, base)));
  await deny(sendStatement(OWNER_A, uuid(3), Object.assign({ projectId: 'p-arch' }, base)));
  await deny(sendStatement(OWNER_A, uuid(4), Object.assign({ projectId: 'missing-project' }, base)));
});

testSeq('project: slotBodyCreate denies a missing project', async () => {
  await seed();
  await openIso();
  const kept = uuid(1);
  const later = uuid(2);
  await allow(send(OWNER_A, 'agreements', kept, lump(kept, { projectId: ISO })));
  await allow(send(OWNER_A, 'agreements', later, lump(later, { projectId: ISO })));
  const first = slotBody(kept, 1, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  await dropIso();
  const second = slotBody(later, 1, { projectId: ISO });
  await deny(send(OWNER_A, 'accountTxns', second.id, second));
});

testSeq('project: laborQtyCreate denies a missing project', async () => {
  await seed();
  await openIso();
  const agreement = uuid(1);
  await allow(send(OWNER_A, 'agreements', agreement, unitAgreement(agreement, { projectId: ISO })));
  const first = measurement(uuid(11), agreement, 8, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  await dropIso();
  const second = measurement(uuid(12), agreement, 8, { projectId: ISO });
  await deny(send(OWNER_A, 'accountTxns', second.id, second));
});

testSeq('project: supCreate denies a missing project', async () => {
  await seed();
  await openIso();
  const agreement = uuid(1);
  await allow(send(OWNER_A, 'agreements', agreement, unitAgreement(agreement, { projectId: ISO })));
  const firstBody = measurement(uuid(11), agreement, 8, { projectId: ISO });
  const secondBody = measurement(uuid(12), agreement, 8, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', firstBody.id, firstBody));
  await allow(send(OWNER_A, 'accountTxns', secondBody.id, secondBody));
  const first = supOf(firstBody, { qty: 4 });
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  await dropIso();
  const second = supOf(secondBody, { qty: 4 });
  await deny(send(OWNER_A, 'accountTxns', second.id, second));
});

testSeq('project: approveLaborCreate denies a missing project', async () => {
  await seed();
  await openIso();
  const agreement = uuid(1);
  await allow(send(OWNER_A, 'agreements', agreement, unitAgreement(agreement, { projectId: ISO })));
  const firstBody = measurement(uuid(11), agreement, 8000, { projectId: ISO });
  const secondBody = measurement(uuid(12), agreement, 8000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', firstBody.id, firstBody));
  await allow(send(OWNER_A, 'accountTxns', secondBody.id, secondBody));
  const first = approval(firstBody.id, agreement, 600000, 8000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  await dropIso();
  const second = approval(secondBody.id, agreement, 600000, 8000, { projectId: ISO });
  await deny(send(OWNER_A, 'accountTxns', second.id, second));
});

testSeq('project: laborStlCreate denies a missing project', async () => {
  await seed();
  await openIso();
  const agreement = uuid(1);
  await allow(send(OWNER_A, 'agreements', agreement, unitAgreement(agreement, { projectId: ISO })));
  const firstBody = measurement(uuid(11), agreement, 8000, { projectId: ISO });
  const secondBody = measurement(uuid(12), agreement, 8000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', firstBody.id, firstBody));
  await allow(send(OWNER_A, 'accountTxns', secondBody.id, secondBody));
  const firstMark = approval(firstBody.id, agreement, 600000, 8000, { projectId: ISO });
  const secondMark = approval(secondBody.id, agreement, 600000, 8000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', firstMark.id, firstMark));
  await allow(send(OWNER_A, 'accountTxns', secondMark.id, secondMark));
  const firstAdvance = cash(uuid(21), 'advanceLabor', 1000, { projectId: ISO });
  const secondAdvance = cash(uuid(22), 'advanceLabor', 1000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', firstAdvance.id, firstAdvance));
  await allow(send(OWNER_A, 'accountTxns', secondAdvance.id, secondAdvance));
  const first = settle(firstBody.id, firstAdvance.id, 1, 500, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  await dropIso();
  const second = settle(secondBody.id, secondAdvance.id, 1, 500, { projectId: ISO });
  await deny(send(OWNER_A, 'accountTxns', second.id, second));
});

testSeq('project: returnAdvanceCreate denies a missing project', async () => {
  await seed();
  await openIso();
  const advance = cash(uuid(1), 'advanceLabor', 1000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const first = cash(uuid(2), 'returnAdvance', 100, { targetId: advance.id, projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  await dropIso();
  const second = cash(uuid(3), 'returnAdvance', 100, { targetId: advance.id, projectId: ISO });
  await deny(send(OWNER_A, 'accountTxns', second.id, second));
});

testSeq('project: refundLaborCreate denies a missing project', async () => {
  await seed();
  await openIso();
  const pay = cash(uuid(1), 'payLabor', 1000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  const first = cash(uuid(2), 'refundLabor', 100, { targetId: pay.id, projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  await dropIso();
  const second = cash(uuid(3), 'refundLabor', 100, { targetId: pay.id, projectId: ISO });
  await deny(send(OWNER_A, 'accountTxns', second.id, second));
});

testSeq('project: deductCreate denies a missing project', async () => {
  await seed();
  await openIso();
  const agreement = uuid(1);
  await allow(send(OWNER_A, 'agreements', agreement, unitAgreement(agreement, { projectId: ISO })));
  const body = measurement(uuid(11), agreement, 8000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', body.id, body));
  const mark = approval(body.id, agreement, 600000, 8000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  const first = deductOf(uuid(21), mark.id, 10, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  await dropIso();
  const second = deductOf(uuid(22), mark.id, 10, { projectId: ISO });
  await deny(send(OWNER_A, 'accountTxns', second.id, second));
});

testSeq('project: approveDeductCreate denies a missing project', async () => {
  await seed();
  await openIso();
  const agreement = uuid(1);
  await allow(send(OWNER_A, 'agreements', agreement, unitAgreement(agreement, { projectId: ISO })));
  const body = measurement(uuid(11), agreement, 8000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', body.id, body));
  const mark = approval(body.id, agreement, 600000, 8000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  const firstBody = deductOf(uuid(21), mark.id, 100, { projectId: ISO });
  const secondBody = deductOf(uuid(22), mark.id, 100, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', firstBody.id, firstBody));
  await allow(send(OWNER_A, 'accountTxns', secondBody.id, secondBody));
  const first = approveDeductOf(firstBody);
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  await dropIso();
  const second = approveDeductOf(secondBody);
  await deny(send(OWNER_A, 'accountTxns', second.id, second));
});

testSeq('project: rejCreate denies a missing project', async () => {
  await seed();
  const id = uuid(11);
  await adminSet('accountTxns', id, Object.assign(measurement(id, uuid(1), 8, { projectId: 'missing-project' }), {
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  const rej = rejOf(id);
  await deny(send(OWNER_A, 'accountTxns', rej.id, rej));
});

testSeq('project: revCreate denies a missing project', async () => {
  await seed();
  await openIso();
  const firstPay = cash(uuid(1), 'payLabor', 1000, { projectId: ISO });
  const secondPay = cash(uuid(2), 'payLabor', 1000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', firstPay.id, firstPay));
  await allow(send(OWNER_A, 'accountTxns', secondPay.id, secondPay));
  const first = txnRev(firstPay);
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  await dropIso();
  const second = txnRev(secondPay);
  await deny(send(OWNER_A, 'accountTxns', second.id, second));
});

testSeq('project: revwCreate denies a missing project', async () => {
  await seed();
  await openIso();
  const firstPay = cash(uuid(1), 'payLabor', 1000, { projectId: ISO });
  const secondPay = cash(uuid(2), 'payLabor', 1000, { projectId: ISO });
  await allow(send(OWNER_A, 'accountTxns', firstPay.id, firstPay));
  await allow(send(OWNER_A, 'accountTxns', secondPay.id, secondPay));
  const first = revwOf(firstPay);
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  await dropIso();
  const second = revwOf(secondPay);
  await deny(send(OWNER_A, 'accountTxns', second.id, second));
});

testSeq('cancel: slot generation 1 denies agreements/rev_<agreementId>', async () => {
  await seed();
  const openId = uuid(1);
  const shutId = uuid(2);
  await allow(send(OWNER_A, 'agreements', openId, lump(openId)));
  await allow(send(OWNER_A, 'accountTxns', slotOf(openId, 1), slotBody(openId, 1)));
  await allow(send(OWNER_A, 'agreements', shutId, lump(shutId)));
  await allow(send(OWNER_A, 'agreements', 'rev_' + shutId, agRev(lump(shutId), 'stop')));
  await deny(send(OWNER_A, 'accountTxns', slotOf(shutId, 1), slotBody(shutId, 1)));
});

testSeq('cancel: slot generation past 1 denies agreements/rev_<agreementId>', async () => {
  await seed();
  const openId = uuid(1);
  await allow(send(OWNER_A, 'agreements', openId, lump(openId)));
  await allow(send(OWNER_A, 'accountTxns', slotOf(openId, 1), slotBody(openId, 1)));
  await allow(send(OWNER_A, 'accountTxns', 'rej_' + slotOf(openId, 1), rejOf(slotOf(openId, 1))));
  await allow(send(OWNER_A, 'accountTxns', slotOf(openId, 2), slotBody(openId, 2)));
  const shutId = uuid(2);
  await allow(send(OWNER_A, 'agreements', shutId, lump(shutId)));
  await allow(send(OWNER_A, 'accountTxns', slotOf(shutId, 1), slotBody(shutId, 1)));
  await allow(send(OWNER_A, 'accountTxns', 'rej_' + slotOf(shutId, 1), rejOf(slotOf(shutId, 1))));
  await allow(send(OWNER_A, 'agreements', 'rev_' + shutId, agRev(lump(shutId), 'stop')));
  await deny(send(OWNER_A, 'accountTxns', slotOf(shutId, 2), slotBody(shutId, 2)));
});

testSeq('cancel: laborQty denies agreements/rev_<agreementId>', async () => {
  await seed();
  const openId = uuid(1);
  await allow(send(OWNER_A, 'agreements', openId, unitAgreement(openId)));
  await allow(send(OWNER_A, 'accountTxns', uuid(11), measurement(uuid(11), openId, 8)));
  const shutId = uuid(2);
  await allow(send(OWNER_A, 'agreements', shutId, unitAgreement(shutId)));
  await allow(send(OWNER_A, 'agreements', 'rev_' + shutId, agRev(unitAgreement(shutId), 'stop')));
  await deny(send(OWNER_A, 'accountTxns', uuid(12), measurement(uuid(12), shutId, 8)));
});

testSeq('cancel: approveLabor denies agreements/rev_<agreementId>', async () => {
  await seed();
  const open = await putUnit(uuid(1), uuid(11), 8000);
  const mark = approval(open.id, uuid(1), 600000, 8000);
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  const shutId = uuid(2);
  const qtyId = uuid(12);
  await allow(send(OWNER_A, 'agreements', shutId, unitAgreement(shutId)));
  await allow(send(OWNER_A, 'accountTxns', qtyId, measurement(qtyId, shutId, 8000)));
  await allow(send(OWNER_A, 'agreements', 'rev_' + shutId, agRev(unitAgreement(shutId), 'stop')));
  const blocked = approval(qtyId, shutId, 600000, 8000);
  await deny(send(OWNER_A, 'accountTxns', blocked.id, blocked));
});

testSeq('cancel: sup_ of a laborQty denies agreements/rev_<agreementId>', async () => {
  await seed();
  const open = await putUnit(uuid(1), uuid(11), 8);
  await allow(send(OWNER_A, 'accountTxns', 'sup_' + open.id, supOf(open, { qty: 9 })));
  const shutId = uuid(2);
  const qtyId = uuid(12);
  await allow(send(OWNER_A, 'agreements', shutId, unitAgreement(shutId)));
  const body = measurement(qtyId, shutId, 8);
  await allow(send(OWNER_A, 'accountTxns', qtyId, body));
  await allow(send(OWNER_A, 'agreements', 'rev_' + shutId, agRev(unitAgreement(shutId), 'stop')));
  await deny(send(OWNER_A, 'accountTxns', 'sup_' + qtyId, supOf(body, { qty: 9 })));
});

testSeq('cancel: an agreementId of rev_<uuid> is denied on slot, laborQty, and approveLabor', async () => {
  await seed();
  const bad = 'rev_' + uuid(9);
  const slot = slotBody(uuid(1), 1, { agreementId: bad });
  await deny(send(OWNER_A, 'accountTxns', slot.id, slot));
  const body = measurement(uuid(2), bad, 8);
  await deny(send(OWNER_A, 'accountTxns', body.id, body));
  const mark = approval(uuid(2), bad, 1000, 8);
  await deny(send(OWNER_A, 'accountTxns', mark.id, mark));
});

testSeq('s7.1 signed-out client cannot read or write the four collections', async () => {
  await seed();
  await adminSet('parties', 'party-x', partyDoc('party-x'));
  await adminSet('agreements', uuid(1), Object.assign(lump(uuid(1)), { createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin' }));
  await adminSet('accountTxns', uuid(2), Object.assign(cash(uuid(2), 'payLabor', 10), { createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin' }));
  await adminSet('statementApprovals', uuid(3), {
    id: uuid(3), partyId: PARTY, projectId: P1, periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13',
    createdBy: OWNER_A, createdAtServer: new Date(),
  });
  for (const [col, id] of [['parties', 'party-x'], ['agreements', uuid(1)], ['accountTxns', uuid(2)], ['statementApprovals', uuid(3)]]) {
    await allow(getDoc(doc(db(OWNER_A), col, id)));
    await deny(getDoc(doc(db(null), col, id)));
  }
  await deny(send(null, 'parties', 'party-out', { id: 'party-out', name: 'Nope', createdBy: null }));
  await deny(send(null, 'agreements', uuid(4), lump(uuid(4))));
  await deny(send(null, 'accountTxns', uuid(5), cash(uuid(5), 'payLabor', 10)));
  await deny(sendStatement(null, uuid(6), { partyId: PARTY, projectId: P1, periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13' }));
});

testSeq('s7.1 inactive owner cannot read or write the four collections', async () => {
  await seed();
  await deny(getDoc(doc(db(OFF), 'parties', PARTY)));
  await deny(getDoc(doc(db(OFF), 'agreements', uuid(1))));
  await deny(getDoc(doc(db(OFF), 'accountTxns', uuid(2))));
  await deny(getDoc(doc(db(OFF), 'statementApprovals', uuid(3))));
  await deny(send(OFF, 'parties', 'party-off', { id: 'party-off', name: 'Nope' }));
  await deny(send(OFF, 'agreements', uuid(4), lump(uuid(4))));
  await deny(send(OFF, 'accountTxns', uuid(5), cash(uuid(5), 'payLabor', 10)));
  await deny(sendStatement(OFF, uuid(6), { partyId: PARTY, projectId: P1, periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13' }));
});

testSeq('s7.2 party create once; second setDoc, update, and delete fail', async () => {
  await seed();
  const fields = { id: 'party-once', name: 'Once' };
  await allow(send(OWNER_A, 'parties', 'party-once', fields));
  await deny(send(OWNER_A, 'parties', 'party-once', fields));
  await deny(updateDoc(doc(db(OWNER_A), 'parties', 'party-once'), { name: 'Twice' }));
  await deny(deleteDoc(doc(db(OWNER_A), 'parties', 'party-once')));
});

testSeq('s7.2 agreement create once; second setDoc, update, and delete fail', async () => {
  await seed();
  const fields = lump(uuid(1));
  await allow(send(OWNER_A, 'agreements', fields.id, fields));
  await deny(send(OWNER_A, 'agreements', fields.id, fields));
  await deny(updateDoc(doc(db(OWNER_A), 'agreements', fields.id), { description: 'other' }));
  await deny(deleteDoc(doc(db(OWNER_A), 'agreements', fields.id)));
});

testSeq('s7.2 agreementReversalCreate allows rev_<agreementId> when partyId, projectId, method, currency, description, and the method group equal the original, with reversalReason 1–500; a second setDoc, an update, and a delete fail', async () => {
  await seed();
  const one = lump(uuid(1));
  await allow(send(OWNER_A, 'agreements', one.id, one));
  const rev = agRev(one, 'x');
  await allow(send(OWNER_B, 'agreements', rev.id, rev));
  const stored = await getDoc(doc(db(OWNER_A), 'agreements', rev.id));
  assert.equal(stored.data().createdBy, OWNER_B);
  assert.equal(stored.data().lumpAmount, 5000);
  assert.equal(stored.data().reversesId, one.id);
  await deny(send(OWNER_A, 'agreements', rev.id, rev));
  await deny(updateDoc(doc(db(OWNER_A), 'agreements', rev.id), { description: 'other' }));
  await deny(deleteDoc(doc(db(OWNER_A), 'agreements', rev.id)));
  const two = lump(uuid(2));
  await allow(send(OWNER_A, 'agreements', two.id, two));
  await allow(send(OWNER_A, 'agreements', 'rev_' + two.id, agRev(two, 'y'.repeat(500))));
});

testSeq('reversal: an extra key, or a method group other than the original\'s, or a partyId, projectId, method, currency, or description that differs from the original, is denied', async () => {
  await seed();
  await allow(send(OWNER_A, 'parties', 'party-2', { id: 'party-2', name: 'Other' }));
  const agreement = lump(uuid(1));
  await allow(send(OWNER_A, 'agreements', agreement.id, agreement));
  const revId = 'rev_' + agreement.id;
  await deny(send(OWNER_A, 'agreements', revId, Object.assign(agRev(agreement), { extra: 1 })));
  const otherGroup = Object.assign({}, agRev(agreement));
  delete otherGroup.lumpAmount;
  otherGroup.unitRate = 10;
  otherGroup.unitQty = 2;
  otherGroup.unitName = 'brick';
  await deny(send(OWNER_A, 'agreements', revId, otherGroup));
  const missing = Object.assign({}, agRev(agreement));
  delete missing.lumpAmount;
  await deny(send(OWNER_A, 'agreements', revId, missing));
  await deny(send(OWNER_A, 'agreements', revId, Object.assign(agRev(agreement), { lumpAmount: 1 })));
  await deny(send(OWNER_A, 'agreements', revId, Object.assign(agRev(agreement), { partyId: 'party-2' })));
  await deny(send(OWNER_A, 'agreements', revId, Object.assign(agRev(agreement), { projectId: 'p2' })));
  await deny(send(OWNER_A, 'agreements', revId, Object.assign(agRev(agreement), { method: 'unit' })));
  await deny(send(OWNER_A, 'agreements', revId, Object.assign(agRev(agreement), { currency: 'USD' })));
  await deny(send(OWNER_A, 'agreements', revId, Object.assign(agRev(agreement), { description: 'other' })));
});

testSeq('reversal: a missing original is denied', async () => {
  await seed();
  const missing = lump(uuid(8));
  await deny(send(OWNER_A, 'agreements', 'rev_' + missing.id, agRev(missing)));
});

testSeq('reversal: a doc id that is not rev_ plus reversesId is denied', async () => {
  await seed();
  const agreement = lump(uuid(1));
  await allow(send(OWNER_A, 'agreements', agreement.id, agreement));
  const rev = agRev(agreement);
  await deny(send(OWNER_A, 'agreements', 'rev_' + uuid(2), Object.assign({}, rev, { id: 'rev_' + uuid(2) })));
});

testSeq('reversal: reversesId that itself starts with rev_ is denied', async () => {
  await seed();
  const nested = 'rev_' + uuid(5);
  await adminSet('agreements', nested, Object.assign(lump(uuid(5)), {
    id: nested, createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  const id = 'rev_' + nested;
  await deny(send(OWNER_A, 'agreements', id, Object.assign(agRev(lump(uuid(5))), {
    id, reversesId: nested,
  })));
});

testSeq('reversal: agreementCreate at id rev_<uuid> is denied', async () => {
  await seed();
  const id = 'rev_' + uuid(1);
  await deny(send(OWNER_A, 'agreements', id, lump(uuid(1), { id })));
});

testSeq('reversal: a closed or archived project is denied', async () => {
  await seed();
  for (const projectId of ['p-closed', 'p-arch']) {
    const agreement = lump(uuid(projectId === 'p-closed' ? 1 : 2), { projectId });
    await adminSet('agreements', agreement.id, Object.assign({}, agreement, {
      createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
    }));
    await deny(send(OWNER_A, 'agreements', 'rev_' + agreement.id, agRev(agreement)));
  }
});

testSeq('reversal: reversalReason missing, empty, or longer than 500 is denied', async () => {
  await seed();
  const agreement = lump(uuid(1));
  await allow(send(OWNER_A, 'agreements', agreement.id, agreement));
  const revId = 'rev_' + agreement.id;
  const missing = agRev(agreement);
  delete missing.reversalReason;
  await deny(send(OWNER_A, 'agreements', revId, missing));
  await deny(send(OWNER_A, 'agreements', revId, agRev(agreement, '')));
  await deny(send(OWNER_A, 'agreements', revId, agRev(agreement, 'z'.repeat(501))));
});

testSeq('s7.2 an accountTxn update and delete fail', async () => {
  await seed();
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  await deny(updateDoc(doc(db(OWNER_A), 'accountTxns', pay.id), { amount: 2 }));
  await deny(deleteDoc(doc(db(OWNER_A), 'accountTxns', pay.id)));
  await deny(send(OWNER_A, 'accountTxns', pay.id, pay));
});

testSeq('s7.3 lump, unit, daily, and amount milestone each succeed with only their fields', async () => {
  await seed();
  await allow(send(OWNER_A, 'agreements', uuid(1), lump(uuid(1))));
  await allow(send(OWNER_A, 'agreements', uuid(2), unitAgreement(uuid(2))));
  await allow(send(OWNER_A, 'agreements', uuid(3), dailyAgreement(uuid(3))));
  await allow(send(OWNER_A, 'agreements', uuid(4), mileAgreement(uuid(4))));
  const lumpStored = (await getDoc(doc(db(OWNER_A), 'agreements', uuid(1)))).data();
  assert.equal(lumpStored.lumpAmount, 5000);
  assert.equal(lumpStored.unitRate, undefined);
  assert.equal(lumpStored.dayRate, undefined);
  assert.equal(lumpStored.milestoneAmount, undefined);
});

testSeq('s7.3 a mixed method fails; amount 0, a fraction, and 10000000001 fail', async () => {
  await seed();
  await deny(send(OWNER_A, 'agreements', uuid(1), lump(uuid(1), { dayRate: 10 })));
  for (const bad of [0, 1.5, 10000000001]) {
    await deny(send(OWNER_A, 'agreements', uuid(2), lump(uuid(2), { lumpAmount: bad })));
    await deny(send(OWNER_A, 'accountTxns', uuid(3), cash(uuid(3), 'payLabor', bad)));
  }
});

testSeq('s7.3 milestoneMode percent fails; a missing milestoneMode fails; on the agreement and on approveLabor', async () => {
  await seed();
  await deny(send(OWNER_A, 'agreements', uuid(1), mileAgreement(uuid(1), { milestoneMode: 'percent' })));
  const missing = mileAgreement(uuid(2));
  delete missing.milestoneMode;
  await deny(send(OWNER_A, 'agreements', uuid(2), missing));
  for (const [id, mode] of [[uuid(3), 'percent'], [uuid(4), undefined]]) {
    const agreement = {
      id, partyId: PARTY, projectId: P1, method: 'milestone', description: 'gate', currency: 'IQD',
      milestoneAmount: 8000, createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
    };
    if (mode) agreement.milestoneMode = mode;
    await adminSet('agreements', id, agreement);
    const slot = slotOf(id, 1);
    await adminSet('accountTxns', slot, Object.assign(slotBody(id, 1), {
      createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
    }));
    const mark = approval(slot, id, 8000, null);
    await deny(send(OWNER_A, 'accountTxns', mark.id, mark));
  }
});

testSeq('s7.4 IQD with fxRate 1450, a fraction, or no fxRate fails; currency USD fails; fxRate 1 succeeds', async () => {
  await seed();
  await deny(send(OWNER_A, 'accountTxns', uuid(1), cash(uuid(1), 'payLabor', 1000, { fxRate: 1450 })));
  await deny(send(OWNER_A, 'accountTxns', uuid(2), cash(uuid(2), 'payLabor', 1000, { fxRate: 1.5 })));
  const noRate = cash(uuid(3), 'payLabor', 1000);
  delete noRate.fxRate;
  await deny(send(OWNER_A, 'accountTxns', uuid(3), noRate));
  await deny(send(OWNER_A, 'accountTxns', uuid(4), cash(uuid(4), 'payLabor', 1000, { currency: 'USD' })));
  await allow(send(OWNER_A, 'accountTxns', uuid(5), cash(uuid(5), 'payLabor', 1000, { fxRate: 1, currency: 'IQD' })));
});

testSeq('s7.5 approveLabor whose partyId, projectId, agreementId, currency, or fxRate differs from the measurement fails', async () => {
  await seed();
  await allow(send(OWNER_A, 'parties', 'party-2', { id: 'party-2', name: 'Other' }));
  const body = await putUnit(uuid(1), uuid(11), 8000);
  await allow(send(OWNER_A, 'agreements', uuid(2), unitAgreement(uuid(2))));
  const base = () => approval(body.id, uuid(1), 600000, 8000);
  await deny(send(OWNER_A, 'accountTxns', base().id, Object.assign(base(), { partyId: 'party-2' })));
  await deny(send(OWNER_A, 'accountTxns', base().id, Object.assign(base(), { projectId: 'p2' })));
  await deny(send(OWNER_A, 'accountTxns', base().id, Object.assign(base(), { agreementId: uuid(2) })));
  await deny(send(OWNER_A, 'accountTxns', base().id, Object.assign(base(), { currency: 'USD' })));
  await deny(send(OWNER_A, 'accountTxns', base().id, Object.assign(base(), { fxRate: 2 })));
});

testSeq('s7.5 approveLabor denies when rej_ of the target exists, and denies when sup_ of the target exists', async () => {
  await seed();
  const rejected = await putUnit(uuid(1), uuid(11), 8);
  await allow(send(OWNER_A, 'accountTxns', 'rej_' + rejected.id, rejOf(rejected.id)));
  const rejMark = approval(rejected.id, uuid(1), 600, 8);
  await deny(send(OWNER_A, 'accountTxns', rejMark.id, rejMark));
  const replaced = await putUnit(uuid(2), uuid(12), 8);
  await allow(send(OWNER_A, 'accountTxns', 'sup_' + replaced.id, supOf(replaced, { qty: 9 })));
  const supMark = approval(replaced.id, uuid(2), 600, 8);
  await deny(send(OWNER_A, 'accountTxns', supMark.id, supMark));
});

testSeq('s7.5 unit denies an inexact split; daily, lump, and amount milestone deny a different amount', async () => {
  await seed();
  const unitId = uuid(1);
  await allow(send(OWNER_A, 'agreements', unitId, unitAgreement(unitId, { unitRate: 10, unitQty: 4, unitName: 'brick' })));
  const unitQty = uuid(11);
  await allow(send(OWNER_A, 'accountTxns', unitQty, measurement(unitQty, unitId, 2)));
  const inexact = approval(unitQty, unitId, 6, 2);
  await deny(send(OWNER_A, 'accountTxns', inexact.id, inexact));
  const exact = approval(unitQty, unitId, 5, 2);
  await allow(send(OWNER_A, 'accountTxns', exact.id, exact));

  const dayId = uuid(2);
  await allow(send(OWNER_A, 'agreements', dayId, dailyAgreement(dayId)));
  const dayQty = uuid(12);
  await allow(send(OWNER_A, 'accountTxns', dayQty, measurement(dayQty, dayId, 2)));
  const dayBad = approval(dayQty, dayId, 999, 2);
  await deny(send(OWNER_A, 'accountTxns', dayBad.id, dayBad));

  const lumpId = uuid(3);
  await allow(send(OWNER_A, 'agreements', lumpId, lump(lumpId)));
  await allow(send(OWNER_A, 'accountTxns', slotOf(lumpId, 1), slotBody(lumpId, 1)));
  const lumpBad = approval(slotOf(lumpId, 1), lumpId, 5001, null);
  await deny(send(OWNER_A, 'accountTxns', lumpBad.id, lumpBad));

  const mileId = uuid(4);
  await allow(send(OWNER_A, 'agreements', mileId, mileAgreement(mileId)));
  await allow(send(OWNER_A, 'accountTxns', slotOf(mileId, 1), slotBody(mileId, 1)));
  const mileBad = approval(slotOf(mileId, 1), mileId, 8001, null);
  await deny(send(OWNER_A, 'accountTxns', mileBad.id, mileBad));
});

testSeq('s7.5 unitQty 1000001 is denied; unitQty 1000000 with amount 10000000000 is allowed', async () => {
  await seed();
  await deny(send(OWNER_A, 'agreements', uuid(1), unitAgreement(uuid(1), { unitQty: 1000001, unitRate: 1 })));
  const id = uuid(2);
  const qtyId = uuid(12);
  await allow(send(OWNER_A, 'agreements', id, unitAgreement(id, { unitRate: 100000000, unitQty: 1000000 })));
  await allow(send(OWNER_A, 'accountTxns', qtyId, measurement(qtyId, id, 100000000)));
  const mark = approval(qtyId, id, 10000000000, 100000000);
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
});

testSeq('s7.5 a second body with the same slot id fails; a uuid body on a lump agreement fails', async () => {
  await seed();
  const id = uuid(1);
  await allow(send(OWNER_A, 'agreements', id, lump(id)));
  await allow(send(OWNER_A, 'accountTxns', slotOf(id, 1), slotBody(id, 1)));
  await deny(send(OWNER_A, 'accountTxns', slotOf(id, 1), slotBody(id, 1)));
  await deny(send(OWNER_A, 'accountTxns', uuid(11), measurement(uuid(11), id, 1)));
});

testSeq('s7.5 generation n succeeds when rev_ of appr_ of slot n-1 exists', async () => {
  await seed();
  const id = uuid(1);
  await allow(send(OWNER_A, 'agreements', id, lump(id)));
  const slot1 = slotOf(id, 1);
  await allow(send(OWNER_A, 'accountTxns', slot1, slotBody(id, 1)));
  const mark = approval(slot1, id, 5000, null);
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  const rev = txnRev(mark);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  await allow(send(OWNER_A, 'accountTxns', slotOf(id, 2), slotBody(id, 2)));
});

testSeq('s7.5 generation n succeeds when rej_ of slot n-1 exists', async () => {
  await seed();
  const id = uuid(1);
  await allow(send(OWNER_A, 'agreements', id, lump(id)));
  const slot1 = slotOf(id, 1);
  await allow(send(OWNER_A, 'accountTxns', slot1, slotBody(id, 1)));
  await allow(send(OWNER_A, 'accountTxns', 'rej_' + slot1, rejOf(slot1)));
  await allow(send(OWNER_A, 'accountTxns', slotOf(id, 2), slotBody(id, 2)));
});

testSeq('s7.5 generation n is denied while slot n-1 is approved and not reversed, and while it is pending', async () => {
  await seed();
  const pending = uuid(1);
  await allow(send(OWNER_A, 'agreements', pending, lump(pending)));
  await allow(send(OWNER_A, 'accountTxns', slotOf(pending, 1), slotBody(pending, 1)));
  await deny(send(OWNER_A, 'accountTxns', slotOf(pending, 2), slotBody(pending, 2)));
  const held = uuid(2);
  await allow(send(OWNER_A, 'agreements', held, lump(held)));
  const slot1 = slotOf(held, 1);
  await allow(send(OWNER_A, 'accountTxns', slot1, slotBody(held, 1)));
  const mark = approval(slot1, held, 5000, null);
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  await deny(send(OWNER_A, 'accountTxns', slotOf(held, 2), slotBody(held, 2)));
});

testSeq('s7.5 sup_ of a slot body fails', async () => {
  await seed();
  const id = uuid(1);
  await allow(send(OWNER_A, 'agreements', id, lump(id)));
  const slot = slotBody(id, 1);
  await allow(send(OWNER_A, 'accountTxns', slot.id, slot));
  await deny(send(OWNER_A, 'accountTxns', 'sup_' + slot.id, supOf(slot)));
});

testSeq('s7.5 sup_ denies when appr_ of the old body exists', async () => {
  await seed();
  const open = await putUnit(uuid(1), uuid(11), 8);
  await allow(send(OWNER_A, 'accountTxns', 'sup_' + open.id, supOf(open, { qty: 4 })));
  const { body } = await putApprovedUnit(uuid(2), uuid(12), 8000, 600000);
  await deny(send(OWNER_A, 'accountTxns', 'sup_' + body.id, supOf(body, { qty: 4 })));
});

testSeq('sup: a sup_ whose purpose, ledger, partyId, projectId, agreementId, currency, or fxRate differs from the old body is denied', async () => {
  await seed();
  await allow(send(OWNER_A, 'parties', 'party-2', { id: 'party-2', name: 'Other' }));
  const body = await putUnit(uuid(1), uuid(11), 8);
  await allow(send(OWNER_A, 'agreements', uuid(2), unitAgreement(uuid(2))));
  const id = 'sup_' + body.id;
  await deny(send(OWNER_A, 'accountTxns', id, supOf(body, { purpose: 'payLabor' })));
  await deny(send(OWNER_A, 'accountTxns', id, supOf(body, { ledger: 'cash' })));
  await deny(send(OWNER_A, 'accountTxns', id, supOf(body, { partyId: 'party-2' })));
  await deny(send(OWNER_A, 'accountTxns', id, supOf(body, { projectId: 'p2' })));
  await deny(send(OWNER_A, 'accountTxns', id, supOf(body, { agreementId: uuid(2) })));
  const dropped = supOf(body);
  delete dropped.agreementId;
  await deny(send(OWNER_A, 'accountTxns', id, dropped));
  await deny(send(OWNER_A, 'accountTxns', id, supOf(body, { currency: 'USD' })));
  await deny(send(OWNER_A, 'accountTxns', id, supOf(body, { fxRate: 2 })));
  const { mark } = await putApprovedUnit(uuid(3), uuid(13), 8000, 600000);
  const deduct = deductOf(uuid(21), mark.id, 100);
  await allow(send(OWNER_A, 'accountTxns', deduct.id, deduct));
  await deny(send(OWNER_A, 'accountTxns', 'sup_' + deduct.id, supOf(deduct, { agreementId: uuid(3) })));
});

testSeq('s7.5 approveLabor of a non-slot target on a lump or milestone agreement is denied', async () => {
  await seed();
  const lumpId = uuid(1);
  await allow(send(OWNER_A, 'agreements', lumpId, lump(lumpId)));
  const stray = measurement(uuid(11), lumpId, 1);
  await adminSet('accountTxns', stray.id, Object.assign({}, stray, { createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin' }));
  const lumpMark = approval(stray.id, lumpId, 5000, null);
  await deny(send(OWNER_A, 'accountTxns', lumpMark.id, lumpMark));
  const mileId = uuid(2);
  await allow(send(OWNER_A, 'agreements', mileId, mileAgreement(mileId)));
  const strayMile = measurement(uuid(12), mileId, 1);
  await adminSet('accountTxns', strayMile.id, Object.assign({}, strayMile, { createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin' }));
  const mileMark = approval(strayMile.id, mileId, 8000, null);
  await deny(send(OWNER_A, 'accountTxns', mileMark.id, mileMark));
});

testSeq('s7.5 approveLabor of a slot target on a unit or daily agreement is denied', async () => {
  await seed();
  const unitId = uuid(1);
  await allow(send(OWNER_A, 'agreements', unitId, unitAgreement(unitId)));
  const unitSlot = slotOf(unitId, 1);
  await adminSet('accountTxns', unitSlot, Object.assign(slotBody(unitId, 1), {
    qty: 8000, createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  const unitMark = approval(unitSlot, unitId, 600000, 8000);
  await deny(send(OWNER_A, 'accountTxns', unitMark.id, unitMark));
  const dayId = uuid(2);
  await allow(send(OWNER_A, 'agreements', dayId, dailyAgreement(dayId)));
  const daySlot = slotOf(dayId, 1);
  await adminSet('accountTxns', daySlot, Object.assign(slotBody(dayId, 1), {
    qty: 2, createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  const dayMark = approval(daySlot, dayId, 1000, 2);
  await deny(send(OWNER_A, 'accountTxns', dayMark.id, dayMark));
});

testSeq('s7.5 depth 5 sup_ is denied as a create, not only as a length', async () => {
  await seed();
  let current = await putUnit(uuid(1), uuid(11), 8);
  for (let depth = 1; depth <= 4; depth++) {
    const next = supOf(current, { qty: 8 });
    await allow(send(OWNER_A, 'accountTxns', next.id, next));
    current = next;
  }
  const fifth = supOf(current, { qty: 8 });
  assert.equal(fifth.id.length, 56);
  assert.equal(ID_OK.test(fifth.id), true);
  await deny(send(OWNER_A, 'accountTxns', fifth.id, fifth));
});

testSeq('s7.5 update and delete of a labor stl_ fail', async () => {
  await seed();
  const { body } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const advance = cash(uuid(21), 'advanceLabor', 600000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const row1 = settle(body.id, advance.id, 1, 600000);
  await allow(send(OWNER_A, 'accountTxns', row1.id, row1));
  await deny(updateDoc(doc(db(OWNER_A), 'accountTxns', row1.id), { amount: 1 }));
  await deny(deleteDoc(doc(db(OWNER_A), 'accountTxns', row1.id)));
  await deny(send(OWNER_A, 'accountTxns', row1.id, row1));
});

testSeq('s7.6 generation-1 labor stl_ is allowed when its 8 documents are in the allowing state', async () => {
  await seed();
  const { body } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const advance = cash(uuid(21), 'advanceLabor', 600000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const row1 = settle(body.id, advance.id, 1, 600000);
  await allow(send(OWNER_A, 'accountTxns', row1.id, row1));
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', 'rev_appr_' + body.id))).exists(), false);
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', 'rev_' + advance.id))).exists(), false);
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', 'rej_' + body.id))).exists(), false);
});

testSeq('s7.6 generation-1 labor stl_ denies an amount above the advance', async () => {
  await seed();
  const { body } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const advance = cash(uuid(21), 'advanceLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const over = settle(body.id, advance.id, 1, 1001);
  await deny(send(OWNER_A, 'accountTxns', over.id, over));
});

testSeq('s7.6 generation-1 labor stl_ denies a party, project, or currency mismatch', async () => {
  await seed();
  await allow(send(OWNER_A, 'parties', 'party-2', { id: 'party-2', name: 'Other' }));
  const { body } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const advance = cash(uuid(21), 'advanceLabor', 600000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const id = settle(body.id, advance.id, 1, 1000).id;
  await deny(send(OWNER_A, 'accountTxns', id, settle(body.id, advance.id, 1, 1000, { partyId: 'party-2' })));
  await deny(send(OWNER_A, 'accountTxns', id, settle(body.id, advance.id, 1, 1000, { projectId: 'p2' })));
  await deny(send(OWNER_A, 'accountTxns', id, settle(body.id, advance.id, 1, 1000, { currency: 'USD' })));
});

testSeq('s7.6 generation-2 labor stl_ succeeds only when all 9 documents are in the allowing state', async () => {
  await seed();
  const { body } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const advance = cash(uuid(21), 'advanceLabor', 600000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const first = settle(body.id, advance.id, 1, 1000);
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  await deny(send(OWNER_A, 'accountTxns', settle(body.id, advance.id, 2, 1000).id, settle(body.id, advance.id, 2, 1000)));
  const rev = txnRev(first);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  const second = settle(body.id, advance.id, 2, 1000);
  await allow(send(OWNER_A, 'accountTxns', second.id, second));
});

testSeq('s7.6 dropping the measurement, the appr_, the advance, or the previous stl_ reversal denies', async () => {
  await seed();
  const { body, mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const advance = cash(uuid(21), 'advanceLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const missingMeasure = settle(uuid(99), advance.id, 1, 1000);
  await deny(send(OWNER_A, 'accountTxns', missingMeasure.id, missingMeasure));
  const noApprBody = await putUnit(uuid(2), uuid(12), 8);
  const noAppr = settle(noApprBody.id, advance.id, 1, 1000);
  await deny(send(OWNER_A, 'accountTxns', noAppr.id, noAppr));
  const noAdvance = settle(body.id, uuid(98), 1, 1000);
  await deny(send(OWNER_A, 'accountTxns', noAdvance.id, noAdvance));
  const first = settle(body.id, advance.id, 1, 1000);
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  const second = settle(body.id, advance.id, 2, 1000);
  await deny(send(OWNER_A, 'accountTxns', second.id, second));
  assert.equal(mark.purpose, 'approveLabor');
});

testSeq('s7.6 a rev_ of the approval, a rev_ of the advance, or a rej_ of the measurement denies', async () => {
  await seed();
  const { body, mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const advance = cash(uuid(21), 'advanceLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const revAppr = txnRev(mark);
  await allow(send(OWNER_A, 'accountTxns', revAppr.id, revAppr));
  await deny(send(OWNER_A, 'accountTxns', settle(body.id, advance.id, 1, 500).id, settle(body.id, advance.id, 1, 500)));

  const second = await putApprovedUnit(uuid(2), uuid(12), 8000, 600000);
  const advance2 = cash(uuid(22), 'advanceLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', advance2.id, advance2));
  const revAdv = txnRev(advance2);
  await allow(send(OWNER_A, 'accountTxns', revAdv.id, revAdv));
  await deny(send(OWNER_A, 'accountTxns', settle(second.body.id, advance2.id, 1, 500).id, settle(second.body.id, advance2.id, 1, 500)));

  const third = await putApprovedUnit(uuid(3), uuid(13), 8000, 600000);
  const advance3 = cash(uuid(23), 'advanceLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', advance3.id, advance3));
  await adminSet('accountTxns', 'rej_' + third.body.id, { id: 'rej_' + third.body.id, kind: 'rej', targetId: third.body.id });
  await deny(send(OWNER_A, 'accountTxns', settle(third.body.id, advance3.id, 1, 500).id, settle(third.body.id, advance3.id, 1, 500)));
});

testSeq('s7.7 a ledger row with partyId still fails', async () => {
  await seed();
  await deny(setDoc(doc(db(OWNER_A), 'ledgerEntries', 'led-party'), {
    id: 'led-party', projectId: P1, direction: 'expense', entryType: 'labour', amount: 1000,
    currency: 'IQD', entryDate: '2026-11-01', isReversal: false, createdAtDevice: 1,
    createdBy: OWNER_A, deviceId: 'device-owner-a', createdAtServer: serverTimestamp(), partyId: PARTY,
  }));
});

async function seedDeleteProject() {
  await adminSet('projects', 'p-del', projectDoc('p-del', 'archived'));
  await adminSet('users', OWNER_A, userDoc(OWNER_A));
  await adminSet('ledgerEntries', 'e1', {
    id: 'e1', projectId: 'p-del', direction: 'expense', entryType: 'materials', amount: 100,
    currency: 'IQD', entryDate: '2026-11-01', isReversal: false, createdAtDevice: 1,
    createdBy: OWNER_A, deviceId: 'admin', createdAtServer: new Date(),
  });
  await adminSet('projectFinance', 'p-del', { contractAmount: 1000 });
  await adminSet('subcontracts', 'sc1', {
    id: 'sc1', projectId: 'p-del', name: 'Wire', work: 'lights', agreedOn: '2026-11-01',
    createdAtServer: new Date(), createdBy: OWNER_A,
  });
  await adminSet('subcontractTerms', 'sc1', { originalAmount: 1000 });
  await adminSet('subcontractAmendments', 'am1', {
    id: 'am1', subcontractId: 'sc1', projectId: 'p-del', amount: 100, date: '2026-11-02',
    note: 'extra', createdAtServer: new Date(), createdBy: OWNER_A,
  });
}

testSeq('s7.8 a project-delete batch that also deletes a parties id fails', async () => {
  await seed();
  await seedDeleteProject();
  const fs = db(OWNER_A);
  const batch = writeBatch(fs);
  batch.delete(doc(fs, 'projects', 'p-del'));
  batch.delete(doc(fs, 'parties', PARTY));
  await deny(batch.commit());
  assert.equal((await getDoc(doc(db(OWNER_A), 'projects', 'p-del'))).exists(), true);
  assert.equal((await getDoc(doc(db(OWNER_A), 'parties', PARTY))).exists(), true);
});

testSeq('s7.8 a project-delete batch that deletes an accountTxns row of that project fails', async () => {
  await seed();
  await seedDeleteProject();
  await adminSet('accountTxns', uuid(1), Object.assign(cash(uuid(1), 'payLabor', 10, { projectId: 'p-del' }), {
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  const fs = db(OWNER_A);
  const batch = writeBatch(fs);
  batch.delete(doc(fs, 'projects', 'p-del'));
  batch.delete(doc(fs, 'accountTxns', uuid(1)));
  await deny(batch.commit());
  assert.equal((await getDoc(doc(db(OWNER_A), 'projects', 'p-del'))).exists(), true);
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', uuid(1)))).exists(), true);
});

testSeq('s7.8 a project-delete batch that deletes an agreements row of that project fails', async () => {
  await seed();
  await seedDeleteProject();
  await adminSet('agreements', uuid(1), Object.assign(lump(uuid(1), { projectId: 'p-del' }), {
    createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin',
  }));
  const fs = db(OWNER_A);
  const batch = writeBatch(fs);
  batch.delete(doc(fs, 'projects', 'p-del'));
  batch.delete(doc(fs, 'agreements', uuid(1)));
  await deny(batch.commit());
  assert.equal((await getDoc(doc(db(OWNER_A), 'projects', 'p-del'))).exists(), true);
  assert.equal((await getDoc(doc(db(OWNER_A), 'agreements', uuid(1)))).exists(), true);
});

testSeq('s7.8 the existing project-delete cascade still succeeds when no account row exists', async () => {
  await seed();
  await seedDeleteProject();
  const docs = Sync.projectDeleteDocs('p-del', {
    entryIds: ['e1'], subcontractIds: ['sc1'], amendmentIds: ['am1'], termIds: ['sc1'], finance: true,
  });
  for (const group of Sync.projectDeleteBatches(docs)) {
    const fs = db(OWNER_A);
    const batch = writeBatch(fs);
    group.forEach(item => batch.delete(doc(fs, item.collection, item.id)));
    await allow(batch.commit());
  }
  assert.equal((await getDoc(doc(db(OWNER_A), 'projects', 'p-del'))).exists(), false);
  assert.equal((await getDoc(doc(db(OWNER_A), 'ledgerEntries', 'e1'))).exists(), false);
  assert.equal((await getDoc(doc(db(OWNER_A), 'parties', PARTY))).exists(), true);
  assert.equal((await getDoc(doc(db(OWNER_A), 'projects', P1))).exists(), true);
});

testSeq('s7.9 sup_ of payLabor fails; sup_ of advanceLabor fails', async () => {
  await seed();
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  await deny(send(OWNER_A, 'accountTxns', 'sup_' + pay.id, supOf(pay)));
  const advance = cash(uuid(2), 'advanceLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  await deny(send(OWNER_A, 'accountTxns', 'sup_' + advance.id, supOf(advance)));
});

testSeq('s7.9 a deduct body with no appr_ succeeds', async () => {
  await seed();
  const { mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const deduct = deductOf(uuid(21), mark.id, 1000);
  await allow(send(OWNER_A, 'accountTxns', deduct.id, deduct));
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', 'appr_' + deduct.id))).exists(), false);
});

testSeq('s7.9 an appr_ of that deduct whose purpose is approveLabor fails', async () => {
  await seed();
  const { mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const deduct = deductOf(uuid(21), mark.id, 1000);
  await allow(send(OWNER_A, 'accountTxns', deduct.id, deduct));
  const wrong = approval(deduct.id, uuid(1), 1000, null, { purpose: 'approveLabor' });
  await deny(send(OWNER_A, 'accountTxns', wrong.id, wrong));
});

testSeq('s7.9 approveDeduct with no amount succeeds; a second one fails', async () => {
  await seed();
  const { mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const deduct = deductOf(uuid(21), mark.id, 1000);
  await allow(send(OWNER_A, 'accountTxns', deduct.id, deduct));
  const mark2 = approveDeductOf(deduct);
  await allow(send(OWNER_A, 'accountTxns', mark2.id, mark2));
  const stored = (await getDoc(doc(db(OWNER_A), 'accountTxns', mark2.id))).data();
  assert.equal(stored.amount, undefined);
  await deny(send(OWNER_A, 'accountTxns', mark2.id, mark2));
});

testSeq('s7.9 approveDeduct denies when rej_ of the deduct exists, and when sup_ of the deduct exists', async () => {
  await seed();
  const { mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const rejected = deductOf(uuid(21), mark.id, 100);
  await allow(send(OWNER_A, 'accountTxns', rejected.id, rejected));
  await allow(send(OWNER_A, 'accountTxns', 'rej_' + rejected.id, rejOf(rejected.id)));
  await deny(send(OWNER_A, 'accountTxns', 'appr_' + rejected.id, approveDeductOf(rejected)));
  const replaced = deductOf(uuid(22), mark.id, 100);
  await allow(send(OWNER_A, 'accountTxns', replaced.id, replaced));
  await allow(send(OWNER_A, 'accountTxns', 'sup_' + replaced.id, supOf(replaced, { amount: 80 })));
  await deny(send(OWNER_A, 'accountTxns', 'appr_' + replaced.id, approveDeductOf(replaced)));
});

testSeq('s7.10 a labor deduct whose target is not a live approveLabor fails', async () => {
  await seed();
  const { body, mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  await deny(send(OWNER_A, 'accountTxns', uuid(21), deductOf(uuid(21), uuid(99), 10)));
  await deny(send(OWNER_A, 'accountTxns', uuid(22), deductOf(uuid(22), body.id, 10)));
  const rev = txnRev(mark);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  await deny(send(OWNER_A, 'accountTxns', uuid(23), deductOf(uuid(23), mark.id, 10)));
});

testSeq('s7.10 a labor deduct larger than that approval fails', async () => {
  await seed();
  const { mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  await deny(send(OWNER_A, 'accountTxns', uuid(21), deductOf(uuid(21), mark.id, 600001)));
});

testSeq('s7.10 a deduct whose partyId, projectId, or currency differs from the approval fails', async () => {
  await seed();
  await allow(send(OWNER_A, 'parties', 'party-2', { id: 'party-2', name: 'Other' }));
  const { mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  await deny(send(OWNER_A, 'accountTxns', uuid(21), deductOf(uuid(21), mark.id, 10, { partyId: 'party-2' })));
  await deny(send(OWNER_A, 'accountTxns', uuid(22), deductOf(uuid(22), mark.id, 10, { projectId: 'p2' })));
  await deny(send(OWNER_A, 'accountTxns', uuid(23), deductOf(uuid(23), mark.id, 10, { currency: 'USD' })));
});

testSeq('s7.11 returnAdvance against a live advanceLabor succeeds', async () => {
  await seed();
  const advance = cash(uuid(1), 'advanceLabor', 5000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const back = cash(uuid(2), 'returnAdvance', 5000, { targetId: advance.id });
  await allow(send(OWNER_A, 'accountTxns', back.id, back));
});

testSeq('s7.11 returnAdvance above that advance fails; a party, project, or currency mismatch fails; a rev_ of the advance fails', async () => {
  await seed();
  await allow(send(OWNER_A, 'parties', 'party-2', { id: 'party-2', name: 'Other' }));
  const advance = cash(uuid(1), 'advanceLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  await deny(send(OWNER_A, 'accountTxns', uuid(2), cash(uuid(2), 'returnAdvance', 1001, { targetId: advance.id })));
  await deny(send(OWNER_A, 'accountTxns', uuid(3), cash(uuid(3), 'returnAdvance', 10, { targetId: advance.id, partyId: 'party-2' })));
  await deny(send(OWNER_A, 'accountTxns', uuid(4), cash(uuid(4), 'returnAdvance', 10, { targetId: advance.id, projectId: 'p2' })));
  await deny(send(OWNER_A, 'accountTxns', uuid(5), cash(uuid(5), 'returnAdvance', 10, { targetId: advance.id, currency: 'USD' })));
  const rev = txnRev(advance);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  await deny(send(OWNER_A, 'accountTxns', uuid(6), cash(uuid(6), 'returnAdvance', 10, { targetId: advance.id })));
});

testSeq('s7.11 refundLabor against a live payLabor succeeds and has no entryType', async () => {
  await seed();
  const pay = cash(uuid(1), 'payLabor', 5000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  const refund = cash(uuid(2), 'refundLabor', 5000, { targetId: pay.id });
  await allow(send(OWNER_A, 'accountTxns', refund.id, refund));
  const stored = (await getDoc(doc(db(OWNER_A), 'accountTxns', refund.id))).data();
  assert.equal(stored.entryType, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(stored, 'entryType'), false);
});

testSeq('s7.11 refundLabor with no payLabor target fails', async () => {
  await seed();
  const refund = cash(uuid(2), 'refundLabor', 10);
  await deny(send(OWNER_A, 'accountTxns', refund.id, refund));
  await deny(send(OWNER_A, 'accountTxns', uuid(3), cash(uuid(3), 'refundLabor', 10, { targetId: uuid(99) })));
});

testSeq('s7.11 refundLabor denies when rev_ of the named payLabor exists', async () => {
  await seed();
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  const rev = txnRev(pay);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  await deny(send(OWNER_A, 'accountTxns', uuid(2), cash(uuid(2), 'refundLabor', 10, { targetId: pay.id })));
});

testSeq('s7.12 one deduct above the approval fails; a second deduct that itself fits the approval succeeds', async () => {
  await seed();
  const { mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  await deny(send(OWNER_A, 'accountTxns', uuid(21), deductOf(uuid(21), mark.id, 600001)));
  await allow(send(OWNER_A, 'accountTxns', uuid(22), deductOf(uuid(22), mark.id, 600000)));
  await allow(send(OWNER_A, 'accountTxns', uuid(23), deductOf(uuid(23), mark.id, 600000)));
});

testSeq('s7.13 payLabor succeeds while no revw_ exists', async () => {
  await seed();
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', 'revw_' + pay.id))).exists(), false);
});

testSeq('s7.13 revw_ of that payLabor succeeds with no amount; rev_ of that revw_ succeeds', async () => {
  await seed();
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  const mark = revwOf(pay);
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  const stored = (await getDoc(doc(db(OWNER_A), 'accountTxns', mark.id))).data();
  assert.equal(stored.amount, undefined);
  const rev = txnRev(mark);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
});

testSeq('s7.13 a second revw_ of the same id fails while the first exists; after the reversal, revw_ plus _1 succeeds', async () => {
  await seed();
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  const mark = revwOf(pay);
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  await deny(send(OWNER_B, 'accountTxns', mark.id, mark));
  const rev = txnRev(mark);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  const next = revwOf(pay, '1');
  await allow(send(OWNER_A, 'accountTxns', next.id, next));
});

testSeq('s7.13 revw_ of refundLabor, advanceLabor, and returnAdvance succeed; revw_ of deduct fails', async () => {
  await seed();
  const advance = cash(uuid(1), 'advanceLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const back = cash(uuid(2), 'returnAdvance', 100, { targetId: advance.id });
  await allow(send(OWNER_A, 'accountTxns', back.id, back));
  const pay = cash(uuid(3), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  const refund = cash(uuid(4), 'refundLabor', 100, { targetId: pay.id });
  await allow(send(OWNER_A, 'accountTxns', refund.id, refund));
  for (const cashRow of [advance, back, refund]) {
    const mark = revwOf(cashRow);
    await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  }
  const { mark } = await putApprovedUnit(uuid(5), uuid(15), 8000, 600000);
  const deduct = deductOf(uuid(21), mark.id, 10);
  await allow(send(OWNER_A, 'accountTxns', deduct.id, deduct));
  const bad = revwOf(Object.assign({}, deduct, { purpose: 'deduct', fxRate: 1, currency: 'IQD' }));
  await deny(send(OWNER_A, 'accountTxns', bad.id, bad));
});

testSeq('s7.15 refundLabor above the payment fails; a party, project, or currency mismatch fails', async () => {
  await seed();
  await allow(send(OWNER_A, 'parties', 'party-2', { id: 'party-2', name: 'Other' }));
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  await deny(send(OWNER_A, 'accountTxns', uuid(2), cash(uuid(2), 'refundLabor', 1001, { targetId: pay.id })));
  await deny(send(OWNER_A, 'accountTxns', uuid(3), cash(uuid(3), 'refundLabor', 10, { targetId: pay.id, partyId: 'party-2' })));
  await deny(send(OWNER_A, 'accountTxns', uuid(4), cash(uuid(4), 'refundLabor', 10, { targetId: pay.id, projectId: 'p2' })));
  await deny(send(OWNER_A, 'accountTxns', uuid(5), cash(uuid(5), 'refundLabor', 10, { targetId: pay.id, currency: 'USD' })));
});

testSeq('s7.15 two refunds that each fit the payment both succeed', async () => {
  await seed();
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  await allow(send(OWNER_A, 'accountTxns', uuid(2), cash(uuid(2), 'refundLabor', 600, { targetId: pay.id })));
  await allow(send(OWNER_A, 'accountTxns', uuid(3), cash(uuid(3), 'refundLabor', 600, { targetId: pay.id })));
});

testSeq('rej: a rej_ of a laborQty is allowed before appr_; it is denied once that appr_ exists', async () => {
  await seed();
  const open = await putUnit(uuid(1), uuid(11), 8);
  await allow(send(OWNER_A, 'accountTxns', 'rej_' + open.id, rejOf(open.id)));
  const { body } = await putApprovedUnit(uuid(2), uuid(12), 8000, 600000);
  await deny(send(OWNER_A, 'accountTxns', 'rej_' + body.id, rejOf(body.id)));
});

testSeq('rej: a rej_ of a cash row is denied', async () => {
  await seed();
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  await deny(send(OWNER_A, 'accountTxns', 'rej_' + pay.id, rejOf(pay.id)));
});

testSeq('rev: owner-b may rev_ owner-a\'s payLabor', async () => {
  await seed();
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  const rev = txnRev(pay);
  await allow(send(OWNER_B, 'accountTxns', rev.id, rev));
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', rev.id))).data().createdBy, OWNER_B);
});

testSeq('rev: a rev_ of a rev_ is denied', async () => {
  await seed();
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  const rev = txnRev(pay);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  const again = txnRev(rev, { purpose: 'payLabor', amount: 1000 });
  await deny(send(OWNER_A, 'accountTxns', again.id, again));
});

testSeq('rev: a rev_ whose purpose, ledger, amount, partyId, projectId, agreementId, currency, or fxRate differs from the original is denied', async () => {
  await seed();
  await allow(send(OWNER_A, 'parties', 'party-2', { id: 'party-2', name: 'Other' }));
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  const id = 'rev_' + pay.id;
  await deny(send(OWNER_A, 'accountTxns', id, txnRev(pay, { purpose: 'advanceLabor' })));
  await deny(send(OWNER_A, 'accountTxns', id, txnRev(pay, { ledger: 'cash' })));
  await deny(send(OWNER_A, 'accountTxns', id, txnRev(pay, { amount: 2 })));
  const noAmount = txnRev(pay);
  delete noAmount.amount;
  await deny(send(OWNER_A, 'accountTxns', id, noAmount));
  await deny(send(OWNER_A, 'accountTxns', id, txnRev(pay, { partyId: 'party-2' })));
  await deny(send(OWNER_A, 'accountTxns', id, txnRev(pay, { projectId: 'p2' })));
  await deny(send(OWNER_A, 'accountTxns', id, txnRev(pay, { agreementId: uuid(9) })));
  await deny(send(OWNER_A, 'accountTxns', id, txnRev(pay, { currency: 'USD' })));
  await deny(send(OWNER_A, 'accountTxns', id, txnRev(pay, { fxRate: 2 })));
  const body = await putUnit(uuid(2), uuid(12), 8);
  const dropped = txnRev(body);
  delete dropped.agreementId;
  await deny(send(OWNER_A, 'accountTxns', dropped.id, dropped));
  await allow(send(OWNER_A, 'accountTxns', id, txnRev(pay)));
});

testSeq('statement: week with projectId is allowed; month with projectId is allowed; week without projectId is allowed', async () => {
  await seed();
  await allow(sendStatement(OWNER_A, uuid(1), { partyId: PARTY, projectId: P1, periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13' }));
  await allow(sendStatement(OWNER_A, uuid(2), { partyId: PARTY, projectId: P1, periodKind: 'month', periodStart: '2026-11-01', periodEnd: '2026-11-30' }));
  await allow(sendStatement(OWNER_A, uuid(3), { partyId: PARTY, periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13' }));
});

testSeq('statement: a periodKind other than week or month is denied', async () => {
  await seed();
  await deny(sendStatement(OWNER_A, uuid(1), { partyId: PARTY, projectId: P1, periodKind: 'day', periodStart: '2026-11-07', periodEnd: '2026-11-13' }));
});

testSeq('statement: periodStart after periodEnd is denied', async () => {
  await seed();
  await deny(sendStatement(OWNER_A, uuid(1), { partyId: PARTY, projectId: P1, periodKind: 'week', periodStart: '2026-11-13', periodEnd: '2026-11-07' }));
});

testSeq('statement: a date entryDateOk rejects is denied', async () => {
  await seed();
  await deny(sendStatement(OWNER_A, uuid(1), { partyId: PARTY, projectId: P1, periodKind: 'week', periodStart: '2026-02-31', periodEnd: '2026-03-01' }));
  await deny(sendStatement(OWNER_A, uuid(2), { partyId: PARTY, periodKind: 'month', periodStart: '2026-11-01', periodEnd: '2026-11-31' }));
});

testSeq('statement: includedIds, or a figure key, is denied', async () => {
  await seed();
  const base = { partyId: PARTY, projectId: P1, periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13' };
  await deny(sendStatement(OWNER_A, uuid(1), Object.assign({ includedIds: [uuid(9)] }, base)));
  await deny(sendStatement(OWNER_A, uuid(2), Object.assign({ total: 1000 }, base)));
});

testSeq('statement: a missing party is denied', async () => {
  await seed();
  await deny(sendStatement(OWNER_A, uuid(1), { partyId: 'missing-party', projectId: P1, periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13' }));
  await deny(sendStatement(OWNER_A, uuid(2), { partyId: 'missing-party', periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13' }));
});

testSeq('two owners: the same slot id, appr_, rej_, sup_, rev_, labor stl_, and revw_ — the first create is allowed and the second is denied', async () => {
  await seed();
  const lumpId = uuid(1);
  await allow(send(OWNER_A, 'agreements', lumpId, lump(lumpId)));
  const slot = slotBody(lumpId, 1);
  await allow(send(OWNER_A, 'accountTxns', slot.id, slot));
  await deny(send(OWNER_B, 'accountTxns', slot.id, slot));

  const { body } = await putApprovedUnit(uuid(2), uuid(11), 8000, 600000);
  await deny(send(OWNER_B, 'accountTxns', 'appr_' + body.id, approval(body.id, uuid(2), 600000, 8000)));

  const open = await putUnit(uuid(3), uuid(12), 8);
  await allow(send(OWNER_A, 'accountTxns', 'rej_' + open.id, rejOf(open.id)));
  await deny(send(OWNER_B, 'accountTxns', 'rej_' + open.id, rejOf(open.id)));

  const replaced = await putUnit(uuid(4), uuid(13), 8);
  const sup = supOf(replaced, { qty: 4 });
  await allow(send(OWNER_A, 'accountTxns', sup.id, sup));
  await deny(send(OWNER_B, 'accountTxns', sup.id, sup));

  const pay = cash(uuid(21), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  const rev = txnRev(pay);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  await deny(send(OWNER_B, 'accountTxns', rev.id, rev));

  const advance = cash(uuid(22), 'advanceLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const stl = settle(body.id, advance.id, 1, 1000);
  await allow(send(OWNER_A, 'accountTxns', stl.id, stl));
  await deny(send(OWNER_B, 'accountTxns', stl.id, stl));

  const mark = revwOf(pay);
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  await deny(send(OWNER_B, 'accountTxns', mark.id, mark));
}, 60000);

testSeq('two owners: two payLabor rows with fresh uuids both land', async () => {
  await seed();
  await allow(send(OWNER_A, 'accountTxns', uuid(1), cash(uuid(1), 'payLabor', 1000)));
  await allow(send(OWNER_B, 'accountTxns', uuid(2), cash(uuid(2), 'payLabor', 2000)));
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', uuid(1)))).data().createdBy, OWNER_A);
  assert.equal((await getDoc(doc(db(OWNER_B), 'accountTxns', uuid(2)))).data().createdBy, OWNER_B);
});

testSeq('batch: appr_ then rej_ of one laborQty in one writeBatch is denied; neither document exists after', async () => {
  await seed();
  const body = await putUnit(uuid(1), uuid(11), 8000);
  const mark = approval(body.id, uuid(1), 600000, 8000);
  const rej = rejOf(body.id);
  const result = await commitBatch(OWNER_A, [[mark.id, mark], [rej.id, rej]]);
  assertBatchDenied(result, [mark.id, rej.id]);
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', body.id))).exists(), true);
});

testSeq('batch: rej_ then appr_ of one laborQty in one writeBatch is denied; neither document exists after', async () => {
  await seed();
  const body = await putUnit(uuid(1), uuid(11), 8000);
  const mark = approval(body.id, uuid(1), 600000, 8000);
  const rej = rejOf(body.id);
  const result = await commitBatch(OWNER_A, [[rej.id, rej], [mark.id, mark]]);
  assertBatchDenied(result, [mark.id, rej.id]);
});

testSeq('batch: approveDeduct and rej_ of one deduct in one writeBatch is denied in both orders; neither document exists after', async () => {
  await seed();
  const { mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const first = deductOf(uuid(21), mark.id, 100);
  await allow(send(OWNER_A, 'accountTxns', first.id, first));
  const appr = approveDeductOf(first);
  const rej = rejOf(first.id);
  assertBatchDenied(await commitBatch(OWNER_A, [[appr.id, appr], [rej.id, rej]]), [appr.id, rej.id]);
  const second = deductOf(uuid(22), mark.id, 100);
  await allow(send(OWNER_A, 'accountTxns', second.id, second));
  const appr2 = approveDeductOf(second);
  const rej2 = rejOf(second.id);
  assertBatchDenied(await commitBatch(OWNER_A, [[rej2.id, rej2], [appr2.id, appr2]]), [appr2.id, rej2.id]);
});

testSeq('batch: appr_ and sup_ of one body in one writeBatch is denied in both orders; neither document exists after', async () => {
  await seed();
  const labor = await putUnit(uuid(1), uuid(11), 8000);
  const laborAppr = approval(labor.id, uuid(1), 600000, 8000);
  const laborSup = supOf(labor, { qty: 4 });
  assertBatchDenied(await commitBatch(OWNER_A, [[laborAppr.id, laborAppr], [laborSup.id, laborSup]]), [laborAppr.id, laborSup.id]);
  const labor2 = await putUnit(uuid(2), uuid(12), 8000);
  const laborAppr2 = approval(labor2.id, uuid(2), 600000, 8000);
  const laborSup2 = supOf(labor2, { qty: 4 });
  assertBatchDenied(await commitBatch(OWNER_A, [[laborSup2.id, laborSup2], [laborAppr2.id, laborAppr2]]), [laborAppr2.id, laborSup2.id]);

  const { mark } = await putApprovedUnit(uuid(3), uuid(13), 8000, 600000);
  const deduct = deductOf(uuid(21), mark.id, 100);
  await allow(send(OWNER_A, 'accountTxns', deduct.id, deduct));
  const deductAppr = approveDeductOf(deduct);
  const deductSup = supOf(deduct, { amount: 80 });
  assertBatchDenied(await commitBatch(OWNER_A, [[deductAppr.id, deductAppr], [deductSup.id, deductSup]]), [deductAppr.id, deductSup.id]);
  const deduct2 = deductOf(uuid(22), mark.id, 100);
  await allow(send(OWNER_A, 'accountTxns', deduct2.id, deduct2));
  const deductAppr2 = approveDeductOf(deduct2);
  const deductSup2 = supOf(deduct2, { amount: 80 });
  assertBatchDenied(await commitBatch(OWNER_A, [[deductSup2.id, deductSup2], [deductAppr2.id, deductAppr2]]), [deductAppr2.id, deductSup2.id]);
});

testSeq('single approveLabor, approveDeduct, rej_, and sup_ are still allowed', async () => {
  await seed();
  const measured = await putUnit(uuid(1), uuid(11), 8000);
  const mark = approval(measured.id, uuid(1), 600000, 8000);
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  const open = await putUnit(uuid(2), uuid(12), 8);
  await allow(send(OWNER_A, 'accountTxns', 'rej_' + open.id, rejOf(open.id)));
  const replaced = await putUnit(uuid(3), uuid(13), 8);
  await allow(send(OWNER_A, 'accountTxns', 'sup_' + replaced.id, supOf(replaced, { qty: 4 })));
  const deduct = deductOf(uuid(21), mark.id, 100);
  await allow(send(OWNER_A, 'accountTxns', deduct.id, deduct));
  const deductAppr = approveDeductOf(deduct);
  await allow(send(OWNER_A, 'accountTxns', deductAppr.id, deductAppr));
});

testSeq('a settlement whose settlesId is a rev_ of an advanceLabor is denied', async () => {
  await seed();
  const { body } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const advance = cash(uuid(21), 'advanceLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const rev = txnRev(advance);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  const bad = settle(body.id, rev.id, 1, 500);
  await deny(send(OWNER_A, 'accountTxns', bad.id, bad));
});

testSeq('a deduct whose targetId is a rev_ of an approveLabor is denied', async () => {
  await seed();
  const { mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const rev = txnRev(mark);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  const bad = deductOf(uuid(21), rev.id, 10);
  await deny(send(OWNER_A, 'accountTxns', bad.id, bad));
});

testSeq('an approveDeduct whose target is a rev_ of a deduct is denied', async () => {
  await seed();
  const { mark } = await putApprovedUnit(uuid(1), uuid(11), 8000, 600000);
  const deduct = deductOf(uuid(21), mark.id, 100);
  await allow(send(OWNER_A, 'accountTxns', deduct.id, deduct));
  const rev = txnRev(deduct);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  const bad = approveDeductOf(rev);
  await deny(send(OWNER_A, 'accountTxns', bad.id, bad));
});

testSeq('a rej_ whose target is a rev_ of a laborQty is denied', async () => {
  await seed();
  const body = await putUnit(uuid(1), uuid(11), 8);
  const rev = txnRev(body);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  const bad = rejOf(rev.id);
  await deny(send(OWNER_A, 'accountTxns', bad.id, bad));
});

testSeq('a revw_ whose target is a rev_ of a payLabor is denied', async () => {
  await seed();
  const pay = cash(uuid(1), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  const rev = txnRev(pay);
  await allow(send(OWNER_A, 'accountTxns', rev.id, rev));
  const bad = revwOf(rev);
  await deny(send(OWNER_A, 'accountTxns', bad.id, bad));
});

testSeq('probe: two writes to the same appr_ id in one batch', async () => {
  await seed();
  const body = await putUnit(uuid(1), uuid(11), 8000);
  const mark = approval(body.id, uuid(1), 600000, 8000);
  const other = Object.assign({}, mark, { amount: 1 });
  const fs = db(OWNER_A);
  const batch = writeBatch(fs);
  let client = 'accepted';
  try {
    batch.set(doc(fs, 'accountTxns', mark.id), row(OWNER_A, mark));
    batch.set(doc(fs, 'accountTxns', mark.id), row(OWNER_A, other));
  } catch (err) {
    client = String((err && (err.code || err.message)) || err);
  }
  let commit = 'not-run';
  if (client === 'accepted') {
    try { await batch.commit(); commit = 'ok'; }
    catch (err) { commit = String((err && (err.code || err.message)) || err); }
  }
  const snap = await getDoc(doc(db(OWNER_A), 'accountTxns', mark.id));
  const probe = { client, commit, exists: snap.exists(), amount: snap.exists() ? snap.data().amount : null };
  console.log('BATCH_SAME_ID ' + JSON.stringify(probe));
  assert.deepEqual(probe, { client: 'accepted', commit: 'permission-denied', exists: false, amount: null });
});

testSeq('two owners, distinct uids, each create a party as themselves, and each can read the other\'s party', async () => {
  await seed();
  await allow(send(OWNER_A, 'parties', 'party-a', { id: 'party-a', name: 'Alpha' }));
  await allow(send(OWNER_B, 'parties', 'party-b', { id: 'party-b', name: 'Beta' }));
  assert.equal((await getDoc(doc(db(OWNER_B), 'parties', 'party-a'))).data().createdBy, OWNER_A);
  assert.equal((await getDoc(doc(db(OWNER_A), 'parties', 'party-b'))).data().createdBy, OWNER_B);
});

testSeq('a site user cannot read or create any of the four collections', async () => {
  await seed();
  await allow(send(OWNER_A, 'parties', 'party-a', { id: 'party-a', name: 'Alpha' }));
  await allow(send(OWNER_A, 'agreements', uuid(1), lump(uuid(1))));
  await allow(send(OWNER_A, 'accountTxns', uuid(2), cash(uuid(2), 'payLabor', 10)));
  await allow(sendStatement(OWNER_A, uuid(3), { partyId: PARTY, projectId: P1, periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13' }));
  for (const [col, id] of [['parties', 'party-a'], ['agreements', uuid(1)], ['accountTxns', uuid(2)], ['statementApprovals', uuid(3)]]) {
    await deny(getDoc(doc(db(SITE), col, id)));
  }
  await deny(send(SITE, 'parties', 'party-site', { id: 'party-site', name: 'Nope' }));
  await deny(send(SITE, 'agreements', uuid(4), lump(uuid(4))));
  await deny(send(SITE, 'accountTxns', uuid(5), cash(uuid(5), 'payLabor', 10)));
  await deny(sendStatement(SITE, uuid(6), { partyId: PARTY, projectId: P1, periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13' }));
});

testSeq('payLabor with a targetId is denied', async () => {
  await seed();
  await deny(send(OWNER_A, 'accountTxns', uuid(1), cash(uuid(1), 'payLabor', 1000, { targetId: uuid(2) })));
});

testSeq('the brick ids: unit agreement, laborQty 8000, approveLabor 600000, and payLabor 600000 are allowed', async () => {
  await seed();
  const agreementId = uuid(1);
  const qtyId = uuid(11);
  await allow(send(OWNER_A, 'agreements', agreementId, unitAgreement(agreementId)));
  await allow(send(OWNER_A, 'accountTxns', qtyId, measurement(qtyId, agreementId, 8000)));
  const mark = approval(qtyId, agreementId, 600000, 8000);
  await allow(send(OWNER_A, 'accountTxns', mark.id, mark));
  await allow(send(OWNER_A, 'accountTxns', uuid(21), cash(uuid(21), 'payLabor', 600000)));
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', qtyId))).data().qty, 8000);
  assert.equal((await getDoc(doc(db(OWNER_A), 'accountTxns', mark.id))).data().amount, 600000);
});

testSeq('slot vector 000aaaaaaaabbbbccccddddeeeeeeeeeeee1', async () => {
  await seed();
  const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const slot = '000aaaaaaaabbbbccccddddeeeeeeeeeeee1';
  assert.equal(slotOf(id, 1), slot);
  assert.equal(slot.length, 36);
  await allow(send(OWNER_A, 'agreements', id, lump(id)));
  await allow(send(OWNER_A, 'accountTxns', slot, slotBody(id, 1)));
  const stored = await getDoc(doc(db(OWNER_A), 'accountTxns', slot));
  assert.equal(stored.id, slot);
  assert.equal(stored.data().id, slot);
});

testSeq('length table', () => {
  const uuidRow = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  assert.equal(uuidRow.length, 36);
  const body52 = 'sup_'.repeat(4) + uuidRow;
  const depth5 = 'sup_'.repeat(5) + uuidRow;
  /** @type {Array<[string, number, boolean]>} */
  const checks = [
    [uuidRow, 36, true],
    ['rev_' + uuidRow, 40, true],
    ['appr_' + uuidRow, 41, true],
    ['rev_' + 'appr_' + uuidRow, 45, true],
    ['rej_' + uuidRow, 40, true],
    ['rev_' + 'rej_' + uuidRow, 44, true],
    ['sup_' + uuidRow, 40, true],
    ['rev_' + 'sup_' + uuidRow, 44, true],
    [body52, 52, true],
    ['rev_' + body52, 56, true],
    ['appr_' + body52, 57, true],
    ['rev_' + 'appr_' + body52, 61, true],
    ['rej_' + body52, 56, true],
    ['rev_' + 'rej_' + body52, 60, true],
    ['inv_' + 'a'.repeat(54) + '_1', 60, true],
    ['rev_' + 'inv_' + 'a'.repeat(54) + '_1', 64, true],
    ['rev_' + 'inv_' + 'a'.repeat(55) + '_1', 65, false],
    ['stl_' + uuidRow + '_1', 42, true],
    ['rev_' + 'stl_' + uuidRow + '_1', 46, true],
    ['stl_' + body52 + '_1', 58, true],
    ['rev_' + 'stl_' + body52 + '_1', 62, true],
    ['stl_' + 'appr_' + body52 + '_1', 63, true],
    ['rev_' + 'stl_' + 'appr_' + body52 + '_1', 67, false],
    ['revw_' + uuidRow, 41, true],
    ['rev_' + 'revw_' + uuidRow, 45, true],
    ['revw_' + body52, 57, true],
    ['rev_' + 'revw_' + body52, 61, true],
    ['revw_' + body52 + '_1', 59, true],
    ['rev_' + 'revw_' + body52 + '_1', 63, true],
    [depth5, 56, true],
    ['rev_' + 'appr_' + depth5, 65, false],
    ['inv_' + 'b'.repeat(58) + '_1', 64, true],
    ['rev_' + 'inv_' + 'b'.repeat(58) + '_1', 68, false],
  ];
  for (const [id, len, ok] of checks) {
    assert.equal(id.length, len, id);
    assert.equal(ID_OK.test(id), ok, id);
  }
  assert.equal(RULES.includes('hashing.sha256'), false);
});

testSeq('source: laborStlCreate contains one user get, one project get, and the nine access call sites. No function has more than 10 let bindings. accountTxnCreate contains no get and no exists. Every create leaf contains one user get', () => {
  const body = fnBody(RULES, 'laborStlCreate');
  const gets = body.match(/get\(\/databases\//g) || [];
  const exists = body.match(/exists\(\/databases\//g) || [];
  assert.equal(gets.length + exists.length, 9);
  assert.equal((body.match(/documents\/users\//g) || []).length, 1);
  assert.equal((body.match(/documents\/projects\//g) || []).length, 1);
  for (const item of eachFunction(RULES)) {
    const lets = (item.body.match(/\blet\b/g) || []).length;
    assert.ok(lets <= 10, item.name + ' has ' + lets + ' let bindings');
  }
  const txn = fnBody(RULES, 'accountTxnCreate');
  assert.equal(/get\s*\(/.test(txn), false);
  assert.equal(/exists\s*\(/.test(txn), false);
  const leaves = [
    'partyCreate', 'agreementCreate', 'agreementReversalCreate', 'slotBodyCreate', 'laborQtyCreate',
    'supCreate', 'approveLaborCreate', 'laborStlCreate', 'cashBodyCreate', 'returnAdvanceCreate',
    'refundLaborCreate', 'deductCreate', 'approveDeductCreate', 'rejCreate', 'revCreate', 'revwCreate',
    'statementWithProjectCreate', 'statementConsolidatedCreate',
  ];
  for (const name of leaves) {
    const leaf = fnBody(RULES, name);
    const users = leaf.match(/get\(\/databases\/\$\(database\)\/documents\/users\//g) || [];
    assert.equal(users.length, 1, name);
    assert.equal(leaf.includes('isOwner('), false, name);
    assert.equal(leaf.includes('projectOpen('), false, name);
    assert.equal(leaf.includes('allowlisted('), false, name);
    assert.equal(leaf.includes('me()'), false, name);
  }
});

testSeq('source: purposeOk and needsApproval match Accounts.PURPOSES for ledger and needsApproval. Every purpose name in that table appears in accountTxnCreate', () => {
  const purposeBody = fnBody(RULES, 'purposeOk');
  const needsBody = fnBody(RULES, 'needsApproval');
  const txnBody = fnBody(RULES, 'accountTxnCreate');
  const names = Object.keys(Accounts.PURPOSES);
  assert.deepEqual(names.slice().sort(), [
    'advanceLabor', 'approveDeduct', 'approveLabor', 'deduct', 'laborQty', 'payLabor', 'refundLabor', 'returnAdvance', 'settle',
  ]);
  for (const name of names) {
    const purpose = Accounts.PURPOSES[name];
    assert.equal(purpose.ledger, 'labor', name);
    assert.equal(purpose.needsApproval, name === 'laborQty' || name === 'deduct', name);
    assert.equal(purposeBody.includes("'" + name + "'"), true, name);
    assert.equal(txnBody.includes("'" + name + "'"), true, name);
    assert.equal(needsBody.includes("'" + name + "'"), purpose.needsApproval, name);
  }
});

testSeq('source: firestore.rules contains no hashing.sha256, no lockId, and no inv_. The parties key list contains no roles. The new functions contain no uid literal', () => {
  assert.equal(RULES.includes('hashing.sha256'), false);
  assert.equal(RULES.includes('lockId'), false);
  assert.equal(RULES.includes('inv_'), false);
  const party = fnBody(RULES, 'partyCreate');
  assert.equal(party.includes('roles'), false);
  assert.match(party, /hasOnly\(\['id', 'name', 'note', 'createdBy', 'createdAtServer', 'deviceId'\]\)/);
  const added = RULES.slice(RULES.indexOf('function ownerOk'));
  for (const literal of ["'u-ameer'", '"u-ameer"', "'owner-a'", "'owner-b'", "'site-1'", "'owner-off'"]) {
    assert.equal(added.includes(literal), false, literal);
  }
});

testSeq('source: exactly six existsAfter calls, on approveLabor rej_ and sup_, approveDeduct rej_ and sup_, rejCreate appr_, and supCreate appr_', () => {
  const added = RULES.slice(RULES.indexOf('function ownerOk'));
  assert.equal((added.match(/existsAfter\(/g) || []).length, 6);
  assert.equal(added.includes('getAfter('), false);
  assert.equal((RULES.match(/existsAfter\(/g) || []).length, 7);
  assert.equal((fnBody(RULES, 'projectGone').match(/existsAfter\(/g) || []).length, 1);
  const counts = {
    approveLaborCreate: 2,
    approveDeductCreate: 2,
    rejCreate: 1,
    supCreate: 1,
  };
  for (const [name, count] of Object.entries(counts)) {
    const body = fnBody(RULES, name);
    assert.equal((body.match(/existsAfter\(/g) || []).length, count, name);
    assert.equal(body.includes("existsAfter(/databases/$(database)/documents/accountTxns/$(id)"), false, name);
    assert.equal(body.includes("existsAfter(/databases/$(database)/documents/accountTxns/$(request.resource.data.id)"), false, name);
  }
  assert.match(fnBody(RULES, 'approveLaborCreate'), /existsAfter\(\/databases\/\$\(database\)\/documents\/accountTxns\/\$\('rej_' \+/);
  assert.match(fnBody(RULES, 'approveLaborCreate'), /existsAfter\(\/databases\/\$\(database\)\/documents\/accountTxns\/\$\('sup_' \+/);
  assert.match(fnBody(RULES, 'approveLaborCreate'), /!exists\(\/databases\/\$\(database\)\/documents\/agreements\/\$\('rev_' \+/);
  assert.match(fnBody(RULES, 'approveDeductCreate'), /existsAfter\(\/databases\/\$\(database\)\/documents\/accountTxns\/\$\('rej_' \+/);
  assert.match(fnBody(RULES, 'approveDeductCreate'), /existsAfter\(\/databases\/\$\(database\)\/documents\/accountTxns\/\$\('sup_' \+/);
  assert.match(fnBody(RULES, 'rejCreate'), /existsAfter\(\/databases\/\$\(database\)\/documents\/accountTxns\/\$\('appr_' \+/);
  assert.match(fnBody(RULES, 'supCreate'), /existsAfter\(\/databases\/\$\(database\)\/documents\/accountTxns\/\$\('appr_' \+/);
  for (const name of [
    'slotBodyCreate', 'laborQtyCreate', 'laborStlCreate', 'cashBodyCreate', 'returnAdvanceCreate',
    'refundLaborCreate', 'deductCreate', 'revCreate', 'revwCreate', 'agreementCreate', 'agreementReversalCreate',
    'partyCreate', 'statementWithProjectCreate', 'statementConsolidatedCreate',
  ]) {
    assert.equal(fnBody(RULES, name).includes('existsAfter('), false, name);
  }
});

testSeq("source: slotBodyCreate, laborQtyCreate, and approveLaborCreate each contain agreements and 'rev_' +", () => {
  for (const name of ['slotBodyCreate', 'laborQtyCreate', 'approveLaborCreate']) {
    const body = fnBody(RULES, name);
    assert.equal(body.includes('agreements'), true, name);
    assert.match(body, /'rev_' \+/);
  }
});
