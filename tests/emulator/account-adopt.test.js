// Two-phone adopt path. Emulator only. Never production, never u-ameer.
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, getDoc, setDoc, deleteDoc, serverTimestamp } = require('firebase/firestore');
const Sync = require('../../public/sync.js');
const Status = require('../../public/sync-status.js');
const Ledger = require('../../public/ledger.js');

const PROJECT_ID = 'ahl-aljazeera-accounting';
const OWNER_A = 'owner-a';
const OWNER_B = 'owner-b';
const SITE = 'site-1';
const PARTY = 'party-1';
const P1 = 'p1';
const RULES = fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8');

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
const contexts = new Map();

function testSeq(name, fn, timeout) {
  test(name, { timeout: timeout || 60000 }, async () => {
    const prev = chain;
    let release;
    chain = new Promise(resolve => { release = resolve; });
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
  const closing = [];
  for (const firestore of contexts.values()) {
    const app = /** @type {{ delete?: () => Promise<void> }} */ (/** @type {any} */ (firestore).app);
    if (app && typeof app.delete === 'function') closing.push(Promise.resolve(app.delete()).catch(() => {}));
  }
  contexts.clear();
  await Promise.all(closing);
  if (testEnv) await testEnv.clearFirestore();
});

function db(uid) {
  const cached = contexts.get(uid);
  if (cached) return cached;
  const ctx = testEnv.authenticatedContext(uid);
  const firestore = ctx.firestore();
  contexts.set(uid, firestore);
  return firestore;
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
    displayName: uid, email: uid + '@example.invalid', role: 'owner', active: true,
    assignedProjectIds: [], createdAtServer: new Date(), createdBy: OWNER_A,
  }, over);
}
function projectDoc(id, status) {
  return {
    id, name: 'School', clientName: 'Client', location: 'Here', currency: 'IQD', status: status || 'active',
    createdAtDevice: 1, createdAtServer: new Date(), createdBy: OWNER_A, deviceId: 'admin',
  };
}
function partyDoc(id) {
  return { id, name: 'Kareem', createdBy: OWNER_A, createdAtServer: new Date(), deviceId: 'admin' };
}
async function seed() {
  await testEnv.clearFirestore();
  contexts.clear();
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'users', OWNER_A), userDoc(OWNER_A, { displayName: 'Owner A' }));
    await setDoc(doc(d, 'users', OWNER_B), userDoc(OWNER_B, { displayName: 'Owner B' }));
    await setDoc(doc(d, 'users', SITE), userDoc(SITE, { displayName: 'Site', role: 'site', assignedProjectIds: [P1] }));
    await setDoc(doc(d, 'projects', P1), projectDoc(P1, 'active'));
    await setDoc(doc(d, 'projects', 'p-closed'), projectDoc('p-closed', 'closed'));
    await setDoc(doc(d, 'projects', 'p-arch'), projectDoc('p-arch', 'archived'));
    await setDoc(doc(d, 'parties', PARTY), partyDoc(PARTY));
  });
}
function lump(id, over) {
  return Object.assign({
    id, partyId: PARTY, projectId: P1, method: 'lump', description: 'wall', currency: 'IQD', lumpAmount: 600000,
  }, over);
}
function unitAgreement(id) {
  return {
    id, partyId: PARTY, projectId: P1, method: 'unit', description: 'bricks', currency: 'IQD',
    unitRate: 300000, unitQty: 4000, unitName: 'brick',
  };
}
function slotBody(agreementId, gen) {
  const id = slotOf(agreementId, gen);
  return {
    id, kind: 'body', purpose: 'laborQty', projectId: P1, partyId: PARTY, agreementId,
    ledger: 'labor', currency: 'IQD', fxRate: 1,
  };
}
function measurement(id, agreementId, qtyValue) {
  return {
    id, kind: 'body', purpose: 'laborQty', projectId: P1, partyId: PARTY, agreementId,
    ledger: 'labor', currency: 'IQD', fxRate: 1, qty: qtyValue,
  };
}
function approval(targetId, agreementId, amount, qtyValue) {
  const base = {
    id: 'appr_' + targetId, kind: 'appr', purpose: 'approveLabor', projectId: P1, partyId: PARTY, agreementId,
    ledger: 'labor', currency: 'IQD', fxRate: 1, targetId, amount,
  };
  if (qtyValue != null) base.qty = qtyValue;
  return base;
}
function cash(id, purpose, amount, over) {
  return Object.assign({
    id, kind: 'body', purpose, projectId: P1, partyId: PARTY, ledger: 'labor',
    currency: 'IQD', fxRate: 1, amount,
  }, over);
}
function supOf(old) {
  const out = {
    id: 'sup_' + old.id, kind: 'sup', purpose: old.purpose, ledger: old.ledger,
    projectId: old.projectId, partyId: old.partyId, currency: old.currency, fxRate: old.fxRate,
    supersedesId: old.id, qty: old.qty,
  };
  if (old.agreementId) out.agreementId = old.agreementId;
  return out;
}
function rejOf(targetId) {
  return { id: 'rej_' + targetId, kind: 'rej', targetId };
}
function txnRev(original, reason) {
  return {
    id: 'rev_' + original.id, kind: 'rev', purpose: original.purpose, ledger: original.ledger,
    projectId: original.projectId, partyId: original.partyId, currency: original.currency,
    fxRate: original.fxRate, reversesId: original.id, reversalReason: reason, amount: original.amount,
  };
}
function revwOf(cashRow) {
  return {
    id: 'revw_' + cashRow.id, kind: 'revw', purpose: cashRow.purpose, ledger: 'labor',
    projectId: cashRow.projectId, partyId: cashRow.partyId, currency: cashRow.currency,
    fxRate: cashRow.fxRate, targetId: cashRow.id,
  };
}
function settle(measurementId, advanceId, amount) {
  return {
    id: 'stl_' + measurementId + '_1', kind: 'stl', purpose: 'settle', projectId: P1, partyId: PARTY,
    ledger: 'labor', currency: 'IQD', fxRate: 1, amount, targetId: measurementId, settlesId: advanceId,
  };
}
function agRev(agreement, reason) {
  return Object.assign({}, agreement, { id: 'rev_' + agreement.id, reversesId: agreement.id, reversalReason: reason });
}

async function loseAndAdopt(col, id, winner, loser, docType) {
  await allow(send(OWNER_A, col, id, winner));
  await deny(send(OWNER_B, col, id, loser));
  const local = Object.assign({ docType, id, createdBy: OWNER_B, createdByName: 'Owner B', deviceId: 'device-' + OWNER_B, createdAtServer: 1 }, loser);
  const snap = await getDoc(doc(db(OWNER_B), col, id));
  assert.equal(snap.exists(), true);
  const server = Object.assign({ docType }, snap.data());
  assert.equal(Status.sameContent(local, server), false);
  const reads = [];
  const result = await Sync.flushOutbox({
    ids: [id],
    load: () => local,
    write: async () => { await send(OWNER_B, col, id, loser); },
    readDependency: async readId => {
      reads.push(readId);
      const got = await getDoc(doc(db(OWNER_B), col, readId));
      return got.exists() ? { status: 'found', doc: got.data() } : { status: 'missing' };
    },
  });
  const applied = Status.applyFlush([id], { [id]: Status.REJECTED }, result);
  assert.equal(applied.errors[id], undefined);
  assert.equal(result.failed.some(row => row.id === id), false);
  assert.equal(result.adopted[0].id, id);
  assert.equal(result.adopted[0].remote.reversesId, local.reversesId);
  assert.deepEqual(reads, [id]);
  return result;
}

function localAccount(uid, fields) {
  return Object.assign({
    docType: 'accountTxn', createdBy: uid, createdByName: uid === OWNER_A ? 'Owner A' : 'Owner B',
    deviceId: 'device-' + uid, createdAtServer: null,
  }, fields);
}

async function flushRefusedAccount(uid, local, write, rival) {
  const before = { id: local.id, kind: local.kind, amount: local.amount, targetId: local.targetId };
  const result = await Sync.flushOutbox({
    ids: [local.id],
    load: id => (id === local.id ? local : null),
    write,
    readDependency: async readId => {
      const got = await getDoc(doc(db(uid), 'accountTxns', readId));
      return got.exists() ? { status: 'found', doc: got.data() } : { status: 'missing' };
    },
    projectProbe: async () => ({ exists: (await getDoc(doc(db(uid), 'projects', P1))).exists() }),
  });
  assert.equal(result.synced.includes(local.id), false);
  assert.equal(result.parked.includes(local.id), false);
  assert.equal(result.kept.includes(local.id), false);
  assert.equal(result.adopted.length, 0);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].id, local.id);
  assert.equal(result.failed[0].message, Status.REJECTED);
  assert.equal(local.id, before.id);
  assert.equal(local.kind, before.kind);
  assert.equal(local.amount, before.amount);
  assert.equal(local.targetId, before.targetId);
  if (rival) {
    assert.equal(result.adopted.some(row => row.remote && (row.remote.id === rival.id || row.remote.kind === rival.kind)), false);
    const winner = await getDoc(doc(db(uid), 'accountTxns', rival.id));
    assert.equal(winner.exists(), true);
    assert.equal(winner.data().kind, rival.kind);
  }
  assert.equal((await getDoc(doc(db(uid), 'accountTxns', local.id))).exists(), false);
  const applied = Status.applyFlush([local.id], {}, result);
  assert.equal(applied.outbox.includes(local.id), false);
  assert.equal(applied.errors[local.id], Status.REJECTED);
  const csv = Ledger.rejectedEntriesToCSV(
    [{ id: local.id, projectId: local.projectId || P1, amount: local.amount, description: local.kind, currency: local.currency || 'IQD', createdBy: uid }],
    [{ id: P1, name: 'School' }],
    {},
    applied.errors,
  );
  assert.equal(csv.includes(local.id), true);
  assert.equal(csv.includes(Status.REJECTED), true);
  assert.equal(Ledger.rejectedLogoutBlocked([{ id: local.id }], []), true);
  assert.equal(Ledger.rejectedLogoutBlocked([{ id: local.id }], [local.id]), false);
  return { errors: applied.errors, kept: local };
}

async function racedApprovalAndRejection(body, bothAppr, bothRej) {
  const attempt = (uid, id, fields) => send(uid, 'accountTxns', id, fields).then(
    () => ({ ok: true, err: null }),
    err => ({ ok: false, err }),
  );
  const [apprTry, rejTry] = await Promise.all([
    attempt(OWNER_A, bothAppr.id, bothAppr),
    attempt(OWNER_B, bothRej.id, bothRej),
  ]);
  const apprExists = (await getDoc(doc(db(OWNER_A), 'accountTxns', bothAppr.id))).exists();
  const rejExists = (await getDoc(doc(db(OWNER_A), 'accountTxns', bothRej.id))).exists();
  assert.equal(apprExists && rejExists, false);
  assert.equal(apprTry.ok, apprExists);
  assert.equal(rejTry.ok, rejExists);
  const refused = async (uid, fields, err, rival) => {
    const local = localAccount(uid, fields);
    // A second create after both were denied can land once the overlap is gone.
    // Replay the denial this create already returned. A stored rival is denied again by the rules.
    const write = rival
      ? async () => { await send(uid, 'accountTxns', fields.id, fields); }
      : async () => { throw err && err.code ? err : Object.assign(new Error('permission-denied'), { code: 'permission-denied' }); };
    const phone = await flushRefusedAccount(uid, local, write, rival);
    assert.equal(phone.errors[fields.id], Status.REJECTED);
    assert.equal(phone.kept.id, fields.id);
    assert.equal(phone.kept.kind, fields.kind);
    assert.equal(phone.kept.targetId, body.id);
  };
  if (!apprExists) await refused(OWNER_A, bothAppr, apprTry.err, rejExists ? bothRej : null);
  if (!rejExists) await refused(OWNER_B, bothRej, rejTry.err, apprExists ? bothAppr : null);
  return { apprExists, rejExists };
}

testSeq('E27 two phones, emulator', async () => {
  await seed();
  const agreementId = uuid(1);
  await allow(send(OWNER_A, 'agreements', agreementId, lump(agreementId)));
  const slot = slotBody(agreementId, 1);
  await loseAndAdopt('accountTxns', slot.id, slot, Object.assign({}, slot), 'accountTxn');

  const unitId = uuid(11);
  await allow(send(OWNER_A, 'agreements', unitId, unitAgreement(unitId)));
  const body = measurement(uuid(12), unitId, 8000);
  await allow(send(OWNER_A, 'accountTxns', body.id, body));
  const mark = approval(body.id, unitId, 600000, 8000);
  await loseAndAdopt('accountTxns', mark.id, mark, Object.assign({}, mark), 'accountTxn');
  const rejBody = measurement(uuid(13), unitId, 4000);
  await allow(send(OWNER_A, 'accountTxns', rejBody.id, rejBody));
  const rej = rejOf(rejBody.id);
  await loseAndAdopt('accountTxns', rej.id, rej, Object.assign({}, rej), 'accountTxn');

  const supBody = measurement(uuid(14), unitId, 4000);
  await allow(send(OWNER_A, 'accountTxns', supBody.id, supBody));
  const sup = supOf(supBody);
  await loseAndAdopt('accountTxns', sup.id, sup, Object.assign({}, sup), 'accountTxn');

  const advance = cash(uuid(21), 'advanceLabor', 600000);
  await allow(send(OWNER_A, 'accountTxns', advance.id, advance));
  const stl = settle(body.id, advance.id, 600000);
  const stlLoser = Object.assign({}, stl, { amount: 500000, settlesId: uuid(22) });
  await allow(send(OWNER_A, 'accountTxns', stl.id, stl));
  await deny(send(OWNER_B, 'accountTxns', stl.id, stlLoser));
  const stlLocal = Object.assign({ docType: 'accountTxn', createdBy: OWNER_B, deviceId: 'device-' + OWNER_B, createdAtServer: 1 }, stlLoser);
  let minted = '';
  const stlResult = await Sync.flushOutbox({
    ids: [stl.id],
    load: () => /** @type {SyncDoc} */ (stlLocal),
    write: async () => { await send(OWNER_B, 'accountTxns', stl.id, stlLoser); },
    readDependency: async () => ({ status: 'found', doc: (await getDoc(doc(db(OWNER_B), 'accountTxns', stl.id))).data() }),
    mintId: () => { minted = 'minted-stl'; return minted; },
  });
  assert.equal(stlResult.failed.length, 0);
  assert.equal(stlResult.linkRefusals[0].localId, 'minted-stl');
  assert.equal(Status.applyFlush([stl.id], {}, stlResult).errors[stl.id], undefined);
  assert.equal(stlResult.linkRefusals[0].doc.settlesId !== advance.id, true);

  const pay = cash(uuid(31), 'payLabor', 1000);
  const revw = revwOf(pay);
  await allow(send(OWNER_A, 'accountTxns', pay.id, pay));
  await loseAndAdopt('accountTxns', revw.id, revw, Object.assign({}, revw), 'accountTxn');

  const payA = cash(uuid(32), 'payLabor', 400000);
  const payB = cash(uuid(33), 'payLabor', 200000);
  await allow(send(OWNER_A, 'accountTxns', payA.id, payA));
  await allow(send(OWNER_B, 'accountTxns', payB.id, payB));

  const revTarget = cash(uuid(34), 'payLabor', 1000);
  await allow(send(OWNER_A, 'accountTxns', revTarget.id, revTarget));
  const revA = txnRev(revTarget, 'سبب المالك الأول');
  const revB = txnRev(revTarget, 'سبب المالك الثاني');
  const revResult = await loseAndAdopt('accountTxns', revA.id, revA, revB, 'accountTxn');
  assert.equal(revResult.adopted[0].remote.kind, 'rev');

  const cancelId = uuid(40);
  const agreement = lump(cancelId);
  await allow(send(OWNER_A, 'agreements', cancelId, agreement));
  const cancelA = agRev(agreement, 'سبب الإلغاء الأول');
  const cancelB = agRev(agreement, 'سبب الإلغاء الثاني');
  await loseAndAdopt('agreements', cancelA.id, cancelA, cancelB, 'agreement');

  const bothBody = measurement(uuid(50), uuid(51), 8000);
  await allow(send(OWNER_A, 'agreements', uuid(51), unitAgreement(uuid(51))));
  await allow(send(OWNER_A, 'accountTxns', bothBody.id, bothBody));
  const bothAppr = approval(bothBody.id, uuid(51), 600000, 8000);
  const bothRej = rejOf(bothBody.id);
  await racedApprovalAndRejection(bothBody, bothAppr, bothRej);

  const otherParty = await getDoc(doc(db(OWNER_B), 'parties', PARTY));
  assert.equal(otherParty.exists(), true);
  await deny(getDoc(doc(db(SITE), 'parties', PARTY)));
  await deny(send(SITE, 'parties', 'party-site', { id: 'party-site', name: 'Site' }));
  await deny(getDoc(doc(db(SITE), 'agreements', agreementId)));
  await deny(send(SITE, 'agreements', uuid(90), lump(uuid(90))));
  await deny(getDoc(doc(db(SITE), 'accountTxns', slot.id)));
  await deny(send(SITE, 'accountTxns', uuid(91), cash(uuid(91), 'payLabor', 1000)));
  await deny(getDoc(doc(db(SITE), 'statementApprovals', uuid(1))));
  await deny(setDoc(doc(db(SITE), 'statementApprovals', uuid(92)), {
    id: uuid(92), partyId: PARTY, periodKind: 'week', periodStart: '2026-11-07', periodEnd: '2026-11-13',
    createdBy: SITE, createdAtServer: serverTimestamp(),
  }));
});

testSeq('E33 deleted project, emulator', async () => {
  await seed();
  const goneId = 'p-gone-e33';
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'projects', goneId), projectDoc(goneId, 'active'));
  });
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await deleteDoc(doc(ctx.firestore(), 'projects', goneId));
  });
  const row = cash(uuid(70), 'payLabor', 600000, { projectId: goneId, description: 'أجر اليوم', txnDate: '2026-11-02' });
  await deny(send(OWNER_A, 'accountTxns', row.id, row));
  const local = Object.assign({ docType: 'accountTxn', createdBy: OWNER_A, deviceId: 'device-' + OWNER_A, createdAtServer: null }, row);
  const gone = await Sync.flushOutbox({
    ids: [row.id],
    load: id => (id === row.id ? local : null),
    write: async () => { await send(OWNER_A, 'accountTxns', row.id, row); },
    readDependency: async () => ({ status: 'missing' }),
    projectProbe: async () => {
      const snap = await getDoc(doc(db(OWNER_A), 'projects', goneId));
      return { exists: snap.exists() };
    },
  });
  assert.equal(gone.failed[0].message, Status.PROJECT_DELETED);
  assert.equal(local.amount, 600000);
  assert.equal(local.description, 'أجر اليوم');
  assert.equal(gone.synced.includes(row.id), false);
  assert.equal(gone.parked.includes(row.id), false);
  const pulled = await Sync.pullAccounts({
    user: { role: 'owner', active: true, uid: OWNER_A },
    since: null,
    read: async spec => {
      if (spec.id) {
        const snap = await getDoc(doc(db(OWNER_A), spec.collection, spec.id));
        return snap.exists() ? [snap.data()] : [];
      }
      return [];
    },
  });
  const merged = Sync.mergeById([local], pulled.accountTxns, []);
  assert.equal(merged.some(item => item.id === row.id && item.amount === 600000), true);
  const csv = Ledger.rejectedEntriesToCSV(
    [{ id: row.id, projectId: goneId, amount: 600000, description: 'أجر اليوم', currency: 'IQD', createdBy: OWNER_A, txnDate: '2026-11-02' }],
    [],
    { [goneId]: 'School' },
    { [row.id]: gone.failed[0].message },
  );
  assert.equal(csv.includes('600000'), true);
  assert.equal(csv.includes('أجر اليوم'), true);
  assert.equal(csv.includes(Status.PROJECT_DELETED), true);

  const closed = cash(uuid(71), 'payLabor', 1500, { projectId: 'p-closed', description: 'مغلق' });
  await deny(send(OWNER_A, 'accountTxns', closed.id, closed));
  const closedLocal = Object.assign({ docType: 'accountTxn', createdBy: OWNER_A, deviceId: 'device-' + OWNER_A }, closed);
  const held = await Sync.flushOutbox({
    ids: [closed.id],
    load: () => closedLocal,
    write: async () => { await send(OWNER_A, 'accountTxns', closed.id, closed); },
    readDependency: async () => ({ status: 'missing' }),
    projectProbe: async () => ({ exists: (await getDoc(doc(db(OWNER_A), 'projects', 'p-closed'))).exists() }),
  });
  assert.equal(held.failed[0].message, Status.REJECTED);
  const archived = cash(uuid(72), 'payLabor', 1600, { projectId: 'p-arch' });
  await deny(send(OWNER_A, 'accountTxns', archived.id, archived));
  const archivedResult = await Sync.flushOutbox({
    ids: [archived.id],
    load: () => Object.assign({ docType: 'accountTxn', createdBy: OWNER_A, deviceId: 'device-' + OWNER_A }, archived),
    write: async () => { await send(OWNER_A, 'accountTxns', archived.id, archived); },
    readDependency: async () => ({ status: 'missing' }),
    projectProbe: async () => ({ exists: true }),
  });
  assert.equal(archivedResult.failed[0].message, Status.REJECTED);
});

const RACE_RUNS = Number(process.env.E27_RACE_RUNS || 0);
if (RACE_RUNS > 0) {
  testSeq('E27 approval and rejection race, repeated', async () => {
    await seed();
    const counts = { onlyAppr: 0, onlyRej: 0, bothDenied: 0, bothLanded: 0 };
    for (let i = 1; i <= RACE_RUNS; i++) {
      const agreementId = uuid(1000 + i);
      const body = measurement(uuid(5000 + i), agreementId, 8000);
      await allow(send(OWNER_A, 'agreements', agreementId, unitAgreement(agreementId)));
      await allow(send(OWNER_A, 'accountTxns', body.id, body));
      const outcome = await racedApprovalAndRejection(body, approval(body.id, agreementId, 600000, 8000), rejOf(body.id));
      if (outcome.apprExists && outcome.rejExists) counts.bothLanded += 1;
      else if (outcome.apprExists) counts.onlyAppr += 1;
      else if (outcome.rejExists) counts.onlyRej += 1;
      else counts.bothDenied += 1;
    }
    console.log('E27_RACE_COUNTS ' + JSON.stringify(counts));
    assert.equal(counts.bothLanded, 0);
    assert.equal(counts.onlyAppr + counts.onlyRej + counts.bothDenied, RACE_RUNS);
  }, 600000);
}
