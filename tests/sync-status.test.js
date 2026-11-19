const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Sync = require('../public/sync.js');
const Status = require('../public/sync-status.js');

function local(over) {
  return Object.assign({
    id: 'e1', projectId: 'p1', direction: 'expense', entryType: 'materials', amount: 1000,
    currency: 'IQD', entryDate: '2026-10-30', description: 'إسمنت', partyName: '', isReversal: false,
    createdBy: 'site', deviceId: 'phone',
  }, over);
}
function deny(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

test('a rejected write with no server document shows an Arabic error and is not synced', async () => {
  const row = local();
  const result = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw deny('permission-denied', 'Missing or insufficient permissions.'); },
    readServer: async () => null,
  });
  assert.deepEqual(result.synced, []);
  assert.deepEqual(result.kept, []);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].id, row.id);
  assert.equal(result.failed[0].message, Status.REJECTED);
  const applied = Status.applyFlush([row.id], {}, result);
  assert.deepEqual(applied.outbox, [], 'a definitive refusal leaves the pending count');
  assert.equal(applied.errors[row.id], Status.REJECTED);
  const html = Status.badgeHtml(row.id, applied.outbox, applied.errors);
  assert.match(html, /رُفض الإرسال/);
  assert.equal(html.includes('لم يُرسل'), false);
  assert.match(html, /data-sync="error"/);
});

test('document already exists is synced only when the server content matches', async () => {
  const row = local({ amount: 1000 });
  const mismatch = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw deny('already-exists', 'Document already exists'); },
    exists: async () => true,
    readServer: async () => Object.assign({}, row, { amount: 50 }),
  });
  assert.deepEqual(mismatch.synced, []);
  assert.equal(mismatch.failed[0].message, Status.CONFLICT);
  const mismatchApplied = Status.applyFlush([row.id], {}, mismatch);
  assert.deepEqual(mismatchApplied.outbox, [], 'already-exists with different content leaves the pending count');
  assert.equal(mismatchApplied.errors[row.id], Status.CONFLICT);
  assert.match(Status.badgeHtml(row.id, mismatchApplied.outbox, mismatchApplied.errors), /محتوى مختلف/);
  assert.equal(Status.badgeHtml(row.id, mismatchApplied.outbox, mismatchApplied.errors).includes('لم يُرسل'), false);

  const match = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw deny('already-exists', 'Document already exists'); },
    exists: async () => true,
    readServer: async () => Object.assign({}, row),
  });
  assert.deepEqual(match.synced, [row.id]);
  assert.deepEqual(match.failed, []);
  const cleared = Status.applyFlush([row.id], { [row.id]: Status.CONFLICT }, match);
  assert.deepEqual(cleared.outbox, []);
  assert.deepEqual(cleared.errors, {});
});

test('exists() true without the server document is not assumed synced', async () => {
  const row = local();
  const result = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw deny('already-exists', 'Document already exists'); },
    exists: async () => true,
  });
  assert.deepEqual(result.synced, []);
  assert.equal(result.failed[0].message, Status.UNVERIFIED);
  assert.match(result.failed[0].message, /[\u0600-\u06FF]/);
});

test('an offline write stays pending and keeps the لم يُرسل label', async () => {
  const row = local();
  const result = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw deny('unavailable', 'offline'); },
    readServer: async () => { throw deny('unavailable', 'offline'); },
  });
  assert.deepEqual(result.synced, []);
  assert.deepEqual(result.failed, []);
  assert.deepEqual(result.kept, [row.id]);
  const html = Status.badgeHtml(row.id, result.kept, {});
  assert.match(html, /لم يُرسل/);
  assert.match(html, /data-sync="pending"/);
});

test('a lost reversal race resolves onto the server row and leaves the pending list', async () => {
  const row = local({
    id: 'rev_e1', isReversal: true, reversesEntryId: 'e1', reversalReason: 'سبب الجهاز',
    description: 'تصحيح: محلي', createdBy: 'site-loser', createdByName: 'الخاسر',
  });
  const remote = Object.assign({}, row, {
    reversalReason: 'سبب الخادم', description: 'تصحيح: خادم', createdBy: 'site-winner', createdByName: 'الفائز',
  });
  const result = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw deny('permission-denied', 'Missing or insufficient permissions.'); },
    readServer: async () => remote,
  });
  assert.deepEqual(result.kept, []);
  assert.deepEqual(result.failed, []);
  assert.deepEqual(result.synced, [row.id]);
  assert.equal(result.adopted && result.adopted[0] && result.adopted[0].remote.reversalReason, 'سبب الخادم');
  assert.equal(result.adopted[0].remote.createdByName, 'الفائز');
  const applied = Status.applyFlush([row.id], { [row.id]: Status.CONFLICT }, result);
  assert.deepEqual(applied.outbox, []);
  assert.deepEqual(applied.errors, {});
});
test('a dead session keeps the entry queued instead of marking it rejected', async () => {
  const row = local();
  const result = await Sync.flushOutbox({
    ids: [row.id],
    load: () => row,
    write: async () => { throw deny('auth/user-token-expired', 'INVALID_REFRESH_TOKEN'); },
    readServer: async () => { throw new Error('should not read after the session died'); },
  });
  assert.equal(result.authDead, true);
  assert.deepEqual(result.failed, []);
  assert.deepEqual(result.synced, []);
  assert.deepEqual(result.kept, [row.id]);
  const applied = Status.applyFlush([row.id, 'still'], {}, result);
  assert.deepEqual(applied.outbox, [row.id, 'still']);
  assert.deepEqual(applied.errors, {});
  assert.match(Status.badgeHtml(row.id, applied.outbox, applied.errors), /لم يُرسل/);
});

test('assignment changes the read set and a renamed person does not', () => {
  const site = { uid: 's', role: 'site', active: true, assignedProjectIds: ['p1', 'p2'], displayName: 'أحمد' };
  assert.equal(Sync.readSetChanged(site, Object.assign({}, site, { displayName: 'اسم أطول' })), false);
  assert.equal(Sync.readSetChanged(site, Object.assign({}, site, { assignedProjectIds: ['p2', 'p1'] })), false);
  assert.equal(Sync.readSetChanged(site, Object.assign({}, site, { assignedProjectIds: ['p1'] })), true);
  assert.equal(Sync.readSetChanged(site, Object.assign({}, site, { assignedProjectIds: ['p1', 'p2', 'p3'] })), true);
  assert.equal(Sync.readSetChanged(site, Object.assign({}, site, { active: false })), true);
  assert.equal(Sync.readSetChanged(site, Object.assign({}, site, { role: 'owner' })), true);
});

test('recorder name and payee are part of the synced entry', () => {
  const named = local({ partyName: 'مورد', createdByName: 'أحمد' });
  const remote = Sync.toRemote(named);
  assert.equal(remote.partyName, 'مورد');
  assert.equal(remote.createdByName, 'أحمد');
  const plain = Sync.toRemote(local());
  assert.equal(Object.prototype.hasOwnProperty.call(plain, 'createdByName'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(plain, 'partyName'), false);
  assert.equal(Status.sameContent(named, Object.assign({}, named)), true);
  assert.equal(Status.sameContent(named, Object.assign({}, named, { createdByName: 'سامي' })), false);
  assert.equal(Status.sameContent(named, Object.assign({}, named, { partyName: 'جهة أخرى' })), false);
});
function move(over) {
  return Object.assign({
    id: 'mv1', docType: 'foremanMove', foremanId: 'fm1', kind: 'advance', amount: 1000,
    date: '2026-11-03', note: '', isReversal: false, createdBy: 'u-ameer', deviceId: 'd',
  }, over);
}
function foreman(over) {
  return Object.assign({ id: 'fm1', docType: 'foreman', name: 'حسن', note: '', createdBy: 'u-ameer' }, over);
}

test('SS1 sameContent matches a move and rejects a different amount, kind, or foreman', () => {
  const row = move();
  const server = Object.assign({}, row);
  delete server.docType;
  assert.equal(Status.sameContent(row, server), true);
  assert.equal(Status.sameContent(row, Object.assign({}, server, { amount: 2 })), false);
  assert.equal(Status.sameContent(row, Object.assign({}, server, { kind: 'settle' })), false);
  assert.equal(Status.sameContent(row, Object.assign({}, server, { foremanId: 'fm2' })), false);
});

test('SS2 sameContent matches a foreman document', () => {
  const row = foreman({ projectId: 'p1' });
  const server = Object.assign({}, row);
  delete server.docType;
  assert.equal(Status.sameContent(row, server), true);
  assert.equal(Status.sameContent(row, Object.assign({}, server, { name: 'علي' })), false);
  assert.equal(Status.sameContent(row, Object.assign({}, server, { projectId: 'p2' })), false);
});

test('SS3 entries that differ only in foremanId are not the same', () => {
  const row = local({ foremanId: 'fm1' });
  assert.equal(Status.sameContent(row, Object.assign({}, row)), true);
  assert.equal(Status.sameContent(row, Object.assign({}, row, { foremanId: 'fm2' })), false);
  assert.equal(Status.sameContent(row, Object.assign({}, row, { foremanId: '' })), false);
});

test('SS4 a move reversal uses reversesMoveId and never matches an entry reversal', () => {
  const localMove = move({ isReversal: true, reversesMoveId: 'mv1', id: 'rev_mv1' });
  const remoteMove = Object.assign({}, localMove);
  delete remoteMove.docType;
  assert.equal(Status.sameReversal(localMove, remoteMove), true);
  assert.equal(Status.sameReversal(localMove, Object.assign({}, remoteMove, { reversesMoveId: 'other' })), false);
  const entryRev = local({ isReversal: true, reversesEntryId: 'mv1', id: 'rev_mv1' });
  assert.equal(Status.sameReversal(localMove, entryRev), false);
  assert.equal(Status.sameReversal(entryRev, remoteMove), false);
});

test('SS6 an untagged server copy still matches, and an untagged entry stays on the entry path', () => {
  const row = move();
  const server = Object.assign({}, row);
  delete server.docType;
  assert.equal(server.docType, undefined);
  assert.equal(Status.sameContent(row, server), true);
  const entry = local({ amount: 1000 });
  const mixed = Object.assign({}, entry, { kind: 'advance', date: '2026-11-03', reversesMoveId: 'mv1' });
  assert.equal(entry.docType, undefined);
  assert.equal(Status.sameContent(entry, mixed), true);
});

test('an empty note survives toRemote and collectionFor uses the shared move constant', () => {
  const row = move({ note: '' });
  const remote = Sync.toRemote(row);
  assert.equal(remote.note, '');
  assert.equal(Object.prototype.hasOwnProperty.call(remote, 'docType'), false);
  assert.equal(Sync.collectionFor(row), Sync.FOREMAN_MOVES);
  assert.equal(Sync.collectionFor(foreman()), Sync.FOREMEN);
  assert.equal(Sync.collectionFor(Object.assign({}, foreman(), { name: 'حسن', currency: 'IQD' })), Sync.FOREMEN);
  const site = { uid: 's', role: 'site', active: true, assignedProjectIds: ['p1'] };
  assert.deepEqual(Sync.foremanReads(site, null), []);
  const owner = { uid: 'o', role: 'owner', active: true };
  assert.deepEqual(Sync.foremanReads(owner, null).map(spec => spec.collection), [Sync.FOREMEN, Sync.FOREMAN_MOVES]);
});

test('an undefined note is an empty string before upload', () => {
  const row = move();
  delete row.note;
  const remote = Sync.toRemote(row);
  assert.equal(remote.note, '');
  assert.equal(Sync.withServerTime(row, 1).note, '');
  const person = foreman();
  delete person.note;
  assert.equal(Sync.toRemote(person).note, '');
  const blank = foreman({ note: null });
  assert.equal(Sync.toRemote(blank).note, '');
});

test('S3 a numeric since adds createdAtServer to both foreman reads', () => {
  const owner = { uid: 'o', role: 'owner', active: true };
  const since = 1700000000000;
  const specs = Sync.foremanReads(owner, since);
  assert.deepEqual(specs.map(spec => spec.collection), [Sync.FOREMEN, Sync.FOREMAN_MOVES]);
  specs.forEach(spec => {
    assert.deepEqual(spec.where, [['createdAtServer', '>=', since]]);
  });
  assert.equal(Sync.foremanReads(owner, null)[0].where.length, 0);
});

test('S4 pullForemen tags rows, keeps a pending id, and advances the watermark', async () => {
  const owner = { uid: 'o', role: 'owner', active: true };
  const result = await Sync.pullForemen({
    user: owner,
    since: 1000,
    read: async spec => {
      if (spec.collection === Sync.FOREMEN) {
        return [
          { id: 'fm1', name: 'حسن', createdAtServer: 2000 },
          { id: 'fm-pending', name: 'من الخادم', createdAtServer: 1500 },
        ];
      }
      return [{ id: 'mv1', foremanId: 'fm1', kind: 'advance', amount: 10, createdAtServer: 1800 }];
    },
  });
  assert.equal(result.foremen.length, 2);
  assert.equal(result.foremen.every(row => row.docType === 'foreman'), true);
  assert.equal(result.moves.length, 1);
  assert.equal(result.moves[0].docType, 'foremanMove');
  assert.equal(result.watermark, 2000);
  const merged = Sync.mergeById([{ id: 'fm-pending', name: 'محلي' }], result.foremen, ['fm-pending']);
  const pending = merged.find(row => row.id === 'fm-pending');
  assert.equal(pending && pending.name, 'محلي');
  assert.equal(merged.some(row => row.id === 'fm1' && row.docType === 'foreman'), true);
});

test('T-FC1 writeLocal uses putIfMissing for foremen and moves', () => {
  assert.equal(Sync.usesPutIfMissing(Sync.FOREMEN), true);
  assert.equal(Sync.usesPutIfMissing(Sync.FOREMAN_MOVES), true);
  assert.equal(Sync.usesPutIfMissing('subcontracts'), true);
  assert.equal(Sync.usesPutIfMissing('subcontractAmendments'), true);
  assert.equal(Sync.usesPutIfMissing('ledgerEntries'), false);
  assert.equal(Sync.usesPutIfMissing('projects'), false);
  const src = fs.readFileSync(path.join(__dirname, '../public/firebase-client.js'), 'utf8');
  const start = src.indexOf('async writeLocal');
  const body = src.slice(start, src.indexOf('async updateProjectStatus', start));
  assert.match(body, /usesPutIfMissing\(col\)/);
  assert.match(body, /this\.putIfMissing\(col,/);
});

test('staleness follows lastSyncAt, not a pull watermark', () => {
  const Ledger = require('../public/ledger.js');
  const now = 1700000000000;
  const minute = 60 * 1000;
  const fresh = Ledger.settleGuard('fm1', {
    outbox: [], moves: [], entries: [],
    lastSyncMs: now - 5 * minute,
    nowMs: now,
    watermark: now - 24 * 60 * minute,
  });
  assert.equal(fresh.stale, false);
  assert.equal(fresh.lastSync, now - 5 * minute);
  const stale = Ledger.settleGuard('fm1', {
    outbox: [], moves: [], entries: [],
    lastSyncMs: now - 11 * minute,
    nowMs: now,
    watermark: now,
  });
  assert.equal(stale.stale, true);
  assert.equal(stale.lastSync, now - 11 * minute);
  const dayOld = Ledger.settleGuard('fm1', {
    outbox: [], moves: [], entries: [],
    lastSyncMs: now,
    nowMs: now,
    watermark: now - 24 * 60 * minute,
  });
  assert.equal(dayOld.stale, false);
  assert.equal(dayOld.lastSync, now);
});

test('readRemote loads the 13.1.0 gstatic Firestore build', async () => {
  let seen = '';
  const remote = { amount: 5, projectId: 'p1', description: '' };
  const got = await Status.readRemote({ marker: 1 }, 'ledgerEntries', 'e1', async url => {
    seen = url;
    return {
      doc: (db, col, id) => ({ db, col, id }),
      getDocFromServer: async ref => ({
        exists: () => ref.db.marker === 1 && ref.col === 'ledgerEntries' && ref.id === 'e1',
        data: () => remote,
      }),
    };
  });
  assert.equal(seen, 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js');
  assert.equal(got, remote);
});

const AGR = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
function slotId(agreementId, gen) {
  return '000' + agreementId.replaceAll('-', '') + gen;
}
const SLOT = slotId(AGR, '1');
const SLOT2 = slotId(AGR, '2');

function txn(over) {
  return Object.assign({
    id: SLOT, docType: 'accountTxn', kind: 'body', projectId: 'p1', partyId: 'party-1',
    purpose: 'laborQty', ledger: 'labor', agreementId: AGR, currency: 'IQD', fxRate: 1,
    txnDate: '2026-11-01', description: 'جدار', createdBy: 'owner-a', createdByName: 'أ',
    deviceId: 'phone-a', createdAtServer: 1,
  }, over);
}
function codeErr(code, message) {
  const err = new Error(message || code || 'boom');
  if (code) err.code = code;
  return err;
}
async function runFlush(docs, opts) {
  const byId = {};
  docs.forEach(doc => { byId[doc.id] = doc; });
  const calls = { write: [], reads: [], probe: 0 };
  const result = await Sync.flushOutbox({
    ids: (opts.ids || docs.map(doc => doc.id)).slice(),
    load: id => (opts.load ? opts.load(id) : byId[id]) || null,
    write: async local => {
      calls.write.push(local.id);
      if (opts.write) return opts.write(local);
      throw codeErr('permission-denied', 'Missing or insufficient permissions.');
    },
    readDependency: async id => {
      calls.reads.push(id);
      if (opts.read) return opts.read(id);
      return { status: 'missing' };
    },
    projectProbe: async () => {
      calls.probe += 1;
      return opts.probe ? opts.probe() : { exists: true };
    },
    mintId: opts.mint || (() => 'mint-1'),
  });
  return { result, calls, byId };
}
function listed(docs, result) {
  const drop = new Set(result.parked);
  const adopted = new Map(result.adopted.map(row => [row.id, row.remote]));
  return docs.filter(doc => !drop.has(doc.id)).map(doc => adopted.get(doc.id) || doc);
}

test('E1 two owners, one appr_', async () => {
  const id = 'appr_' + SLOT;
  const local = txn({ id, kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000, createdBy: 'owner-b', createdByName: 'ب' });
  const server = txn({ id, kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000, createdBy: 'owner-a' });
  const { result, calls } = await runFlush([local], { read: () => ({ status: 'found', doc: server }) });
  assert.deepEqual(calls.reads, [id]);
  assert.equal(result.failed.length, 0);
  assert.equal(result.adopted.length, 1);
  assert.equal(result.adopted[0].remote.amount, 600000);
  assert.equal(result.synced.includes(id), true);
});

test('E2 two owners, one rej_', async () => {
  const id = 'rej_' + SLOT;
  const local = txn({ id, kind: 'rej', targetId: SLOT, purpose: undefined, amount: undefined, createdBy: 'owner-b' });
  const server = txn({ id, kind: 'rej', targetId: SLOT, purpose: undefined, amount: undefined, createdBy: 'owner-a' });
  const { result } = await runFlush([local], { read: () => ({ status: 'found', doc: server }) });
  assert.equal(result.failed.length, 0);
  assert.equal(result.adopted[0].id, id);
});

test('E3 two owners, one rev_', async () => {
  const id = 'rev_' + SLOT;
  const local = txn({ id, kind: 'rev', reversesId: SLOT, reversalReason: 'سبب ب', createdBy: 'owner-b' });
  const server = txn({ id, kind: 'rev', reversesId: SLOT, reversalReason: 'سبب أ', createdBy: 'owner-a' });
  assert.equal(Status.sameContent(local, server), false);
  const { result, calls } = await runFlush([local], { read: () => ({ status: 'found', doc: server }) });
  assert.deepEqual(calls.reads, [id]);
  assert.equal(result.failed.length, 0);
  assert.equal(result.adopted[0].remote.reversesId, SLOT);
  assert.equal(result.synced.includes(id), true);
});

test('E4 two owners, one revw_ of one payLabor', async () => {
  const payId = 'paylabor00000001';
  const pay = txn({ id: payId, kind: 'body', purpose: 'payLabor', amount: 400000, agreementId: undefined });
  const id = 'revw_' + payId;
  const local = txn({ id, kind: 'revw', purpose: 'payLabor', targetId: payId, amount: undefined, agreementId: undefined, createdBy: 'owner-b' });
  const server = Object.assign({}, local, { createdBy: 'owner-a', createdByName: 'أ' });
  const { result } = await runFlush([pay, local], { read: readId => ({ status: 'found', doc: readId === id ? server : pay }) });
  const accounts = listed([pay, local], result);
  assert.equal(accounts.filter(row => row.id === payId).length, 1);
  assert.equal(result.failed.some(row => row.id === id), false);
  assert.equal(result.adopted.some(row => row.id === id), true);
});

test('E5 two owners, one sup_', async () => {
  const body = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const id = 'sup_' + body;
  const local = txn({ id, kind: 'sup', supersedesId: body, amount: 10, createdBy: 'owner-b' });
  const server = Object.assign({}, local, { createdBy: 'owner-a' });
  const { result } = await runFlush([local], { read: () => ({ status: 'found', doc: server }) });
  assert.equal(result.failed.length, 0);
  assert.equal(result.adopted[0].id, id);
});

test('E6 two owners, one labor stl_', async () => {
  const id = 'stl_meas_1';
  const local = txn({ id, kind: 'stl', purpose: 'settle', targetId: 'meas', settlesId: 'adv-b', amount: 1000, agreementId: undefined, createdBy: 'owner-b' });
  const server = Object.assign({}, local, { settlesId: 'adv-a', createdBy: 'owner-a' });
  const { result, calls } = await runFlush([local], {
    read: () => ({ status: 'found', doc: server }),
    mint: () => 'uuid-loser',
  });
  assert.equal(calls.reads.length, 1);
  assert.equal(result.failed.some(row => row.id === id || row.id === 'adv-b'), false);
  assert.equal(result.linkRefusals[0].localId, 'uuid-loser');
  assert.equal(result.linkRefusals[0].doc.settlesId, 'adv-b');
  const views = Sync.linkRefusalViews({ 'uuid-loser': result.linkRefusals[0].doc });
  assert.equal(views[0].readOnly, true);
  assert.equal(views[0].key, 'uuid-loser');
  const html = Status.badgeHtml('uuid-loser', [], { 'uuid-loser': Status.CONFLICT });
  assert.equal(html.includes(Status.CONFLICT), true);
});

test('E7 same-bytes retry', async () => {
  const local = txn({ kind: 'appr', id: 'appr_' + SLOT, purpose: 'approveLabor', targetId: SLOT, amount: 600000 });
  const server = Object.assign({}, local);
  assert.equal(Status.sameContent(local, server), true);
  const { result, calls } = await runFlush([local], { read: () => ({ status: 'found', doc: server }) });
  assert.deepEqual(calls.reads, [local.id]);
  assert.deepEqual(result.synced, [local.id]);
  assert.equal(result.adopted.length, 0);
  assert.equal(result.failed.length, 0);
});

test('E8 usesPutIfMissing is false and a differing slot is adopted', async () => {
  assert.equal(Sync.usesPutIfMissing('accountTxns'), false);
  const local = txn({ amount: 1 });
  const server = txn({ amount: 2, createdBy: 'owner-b' });
  delete server.docType;
  const { result, calls } = await runFlush([local], { read: () => ({ status: 'found', doc: server }) });
  assert.deepEqual(calls.write, [SLOT]);
  assert.equal(calls.reads[0], SLOT);
  assert.equal(calls.write.indexOf(SLOT) < calls.reads.indexOf(SLOT) || calls.reads[0] === SLOT, true);
  assert.equal(result.adopted[0].remote.amount, 2);
  assert.equal(result.adopted[0].remote.docType, undefined);
  assert.equal(result.synced.includes(SLOT), true);
});

test('E9 two phones, same lump slot, different amount, winner unapproved', async () => {
  const body = txn({ amount: 1, createdBy: 'owner-b' });
  const appr = txn({ id: 'appr_' + SLOT, kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000, createdBy: 'owner-b' });
  const rev = txn({ id: 'rev_' + SLOT, kind: 'rev', reversesId: SLOT, reversalReason: 'لا', createdBy: 'owner-b' });
  const server = txn({ amount: 2, createdBy: 'owner-a' });
  const docs = [body, appr, rev];
  const { result } = await runFlush(docs, { read: id => (id === SLOT ? { status: 'found', doc: server } : { status: 'missing' }) });
  const accounts = listed(docs, result);
  assert.equal(accounts.some(row => row.id === appr.id || row.id === rev.id), false);
  assert.equal(result.parked.includes(appr.id), true);
  assert.equal(result.parked.includes(rev.id), true);
  assert.equal(result.failed.length, 0);
  assert.equal(result.slotLosers.some(row => row.doc.id === appr.id), true);
  assert.equal(result.slotLosers.some(row => row.doc.id === rev.id), true);
});

test('E10 winner already approved', async () => {
  const body = txn({ createdBy: 'owner-b' });
  const appr = txn({ id: 'appr_' + SLOT, kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000, createdBy: 'owner-b' });
  const serverBody = txn({ createdBy: 'owner-a' });
  const serverAppr = Object.assign({}, appr, { createdBy: 'owner-a', createdByName: 'أ' });
  const { result } = await runFlush([body, appr], {
    read: id => ({ status: 'found', doc: id === SLOT ? serverBody : serverAppr }),
  });
  assert.equal(result.failed.some(row => row.id === appr.id), false);
  assert.equal(result.adopted.some(row => row.id === appr.id && row.remote.createdBy === 'owner-a'), true);
});

test('E11 slot 2 queued before adoption', async () => {
  const slot1 = txn({ amount: 1, createdBy: 'owner-b' });
  const slot2 = txn({ id: SLOT2, amount: 2, createdBy: 'owner-b' });
  const server = txn({ amount: 9, createdBy: 'owner-a' });
  const { result, calls } = await runFlush([slot1, slot2], { read: () => ({ status: 'found', doc: server }) });
  assert.equal(calls.write.includes(SLOT2), false);
  assert.equal(result.parked.includes(SLOT2), true);
  assert.equal(result.failed.some(row => row.id === SLOT2), false);
  assert.equal(listed([slot1, slot2], result).some(row => row.id === SLOT2), false);
  assert.equal(result.slotLosers.some(row => row.doc.id === SLOT2), true);
});

test('E12 slot 2 queued after the result', async () => {
  const slot2 = txn({ id: SLOT2, amount: 2 });
  const { calls } = await runFlush([slot2], { write: async () => {} });
  assert.deepEqual(calls.write, [SLOT2]);
});

test('E13 loser rows', async () => {
  const body = txn({ amount: 1, createdBy: 'owner-b' });
  const appr = txn({ id: 'appr_' + SLOT, kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000, createdBy: 'owner-b' });
  const rej = txn({ id: 'rej_' + SLOT, kind: 'rej', targetId: SLOT, createdBy: 'owner-b' });
  const stl = txn({ id: 'stl_' + SLOT + '_1', kind: 'stl', purpose: 'settle', targetId: SLOT, settlesId: 'adv', amount: 5, createdBy: 'owner-b' });
  const deduct = txn({ id: 'deduct-1', kind: 'body', purpose: 'deduct', targetId: appr.id, amount: 50, createdBy: 'owner-b' });
  const server = txn({ amount: 2, createdBy: 'owner-a' });
  const docs = [body, appr, rej, stl, deduct];
  const { result } = await runFlush(docs, { read: () => ({ status: 'found', doc: server }) });
  const views = Sync.slotLoserViews(Object.fromEntries(result.slotLosers.map(row => [row.key, row.doc])));
  ['body', appr.id, rej.id, stl.id, deduct.id].forEach(id => {
    const key = id === 'body' ? Sync.slotLoserKey(SLOT) : Sync.slotLoserKey(id);
    const view = views.find(row => row.key === key);
    assert.ok(view, key);
    assert.equal(view.readOnly, true);
    assert.equal(view.key === SLOT, false);
  });
  assert.equal(Status.badgeHtml(SLOT, [], {}), '');
});

test('E14 hand-built guard', async () => {
  const body = txn({ amount: 1, createdBy: 'owner-b' });
  const appr = txn({ id: 'appr_' + SLOT, kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000, createdBy: 'owner-b' });
  const pay = txn({ id: 'pay-guard', kind: 'body', purpose: 'payLabor', targetId: appr.id, amount: 100, agreementId: undefined, createdBy: 'owner-b' });
  const server = txn({ amount: 2, createdBy: 'owner-a' });
  const first = await runFlush([body, appr, pay], { read: () => ({ status: 'found', doc: server }) });
  assert.equal(first.calls.write.includes(pay.id), false);
  assert.equal(first.result.slotLosers.some(row => row.doc.id === pay.id), false);
  assert.equal(listed([body, appr, pay], first.result).some(row => row.id === pay.id), true);
  assert.equal(first.result.parked.includes(pay.id), false);
  const second = await runFlush([pay], {
    read: id => (id === pay.id ? { status: 'missing' } : { status: 'found', doc: appr }),
  });
  assert.deepEqual(second.calls.write, [pay.id]);
  assert.equal(second.result.synced.includes(pay.id), false);
  assert.equal(second.result.failed[0].message, Status.REJECTED);
  assert.equal(second.result.parked.includes(pay.id), false);
  const applied = Status.applyFlush([pay.id], {}, second.result);
  assert.equal(applied.errors[pay.id], Status.REJECTED);
  const screen = loadScreen({
    accountTxns: [pay],
    syncErrors: applied.errors,
    slotLosers: {},
    linkRefusals: {},
    agreements: [],
    rejectedExportedIds: [],
    entries: [],
    projects: [],
  });
  assert.equal(screen.rejectedLogoutBlock(), true);
  screen.set(screen.K.rejectedExportedIds, [pay.id]);
  assert.equal(screen.rejectedLogoutBlock(), false);
});

test('E15 rev_ of the slot id and rev_ of the approval are parked', async () => {
  const body = txn({ amount: 1, createdBy: 'owner-b' });
  const appr = txn({ id: 'appr_' + SLOT, kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000, createdBy: 'owner-b' });
  const revSlot = txn({ id: 'rev_' + SLOT, kind: 'rev', reversesId: SLOT, reversalReason: 'س', createdBy: 'owner-b' });
  const revAppr = txn({ id: 'rev_' + appr.id, kind: 'rev', reversesId: appr.id, reversalReason: 'ص', createdBy: 'owner-b' });
  const server = txn({ amount: 2, createdBy: 'owner-a' });
  const { result, calls } = await runFlush([body, appr, revSlot, revAppr], { read: () => ({ status: 'found', doc: server }) });
  assert.equal(calls.write.includes(revSlot.id), false);
  assert.equal(calls.write.includes(revAppr.id), false);
  assert.equal(result.parked.includes(revSlot.id), true);
  assert.equal(result.parked.includes(revAppr.id), true);
});

test('E16 missing dependency', async () => {
  const row = txn({ id: 'appr_late', kind: 'appr', purpose: 'approveLabor', targetId: 'missing-body', amount: 1 });
  let writes = 0;
  const { result, calls } = await runFlush([row], {
    write: async () => { writes += 1; throw codeErr('permission-denied'); },
    read: () => ({ status: 'missing' }),
  });
  assert.equal(writes, 1);
  assert.equal(calls.reads[0], row.id);
  assert.ok(calls.reads.length >= 1);
  assert.equal(result.failed[0].message, Status.REJECTED);
  const applied = Status.applyFlush([row.id], {}, result);
  const again = await runFlush([], { ids: applied.outbox, write: async () => { throw new Error('seen'); } });
  assert.equal(again.calls.write.includes(row.id), false);
});

test('E17 denied dependency', async () => {
  const row = txn({ id: 'appr_denied', kind: 'appr', purpose: 'approveLabor', targetId: 'hidden', amount: 1 });
  const { result } = await runFlush([row], {
    read: id => (id === row.id ? { status: 'missing' } : { status: 'denied' }),
  });
  assert.equal(result.failed[0].message, Status.REJECTED);
  const applied = Status.applyFlush([row.id], {}, result);
  assert.equal(applied.outbox.includes(row.id), false);
});

test('E18 queued server error', async () => {
  const row = txn({ id: 'dep-1', kind: 'appr', purpose: 'approveLabor', targetId: 'body-1', amount: 1 });
  const held = await runFlush([row], {
    read: id => (id === row.id ? { status: 'missing' } : { status: 'transient' }),
  });
  assert.deepEqual(held.result.kept, [row.id]);
  assert.equal(held.result.failed.length, 0);
  let writes = 0;
  let reads = 0;
  for (let i = 0; i < 3; i += 1) {
    const round = await runFlush([row], {
      write: async () => { writes += 1; throw codeErr('internal'); },
      read: id => { reads += 1; return id === row.id ? { status: 'missing' } : { status: 'transient' }; },
    });
    assert.deepEqual(round.result.kept, [row.id]);
    const applied = Status.applyFlush([row.id], {}, round.result);
    assert.equal(applied.errors[row.id], undefined);
    assert.equal(round.calls.write.length, 1);
    assert.ok(round.calls.reads.length <= 2);
  }
  assert.equal(writes, 3);
  assert.ok(reads <= 6);
  const bare = await runFlush([row], { write: async () => { throw new Error('no code'); } });
  assert.equal(bare.result.failed[0].message, Status.REJECTED);
  assert.equal(bare.calls.reads.length, 0);
});

test('E19 body synced on an earlier flush', async () => {
  const appr = txn({ id: 'appr_' + SLOT, kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000 });
  const { calls } = await runFlush([appr], { write: async () => {} });
  assert.deepEqual(calls.write, [appr.id]);
});

test('E20 body then approval, body first', async () => {
  const body = txn();
  const appr = txn({ id: 'appr_' + SLOT, kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000 });
  const { result } = await runFlush([body, appr], { write: async () => {} });
  assert.deepEqual(result.synced, [body.id, appr.id]);
});

test('E21 transient body', async () => {
  const body = txn();
  const appr = txn({ id: 'appr_' + SLOT, kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000 });
  const rev = txn({ id: 'rev_' + SLOT, kind: 'rev', reversesId: SLOT, reversalReason: 'س' });
  const first = await runFlush([body, appr, rev], { write: async local => { if (local.id === body.id) throw codeErr('unavailable'); } });
  assert.equal(first.result.kept.includes(body.id), true);
  assert.equal(first.result.kept.includes(appr.id), true);
  assert.equal(first.result.kept.includes(rev.id), true);
  assert.equal(first.result.failed.length, 0);
  const second = await runFlush([body, appr, rev], { write: async () => {} });
  assert.deepEqual(second.result.synced, [body.id, appr.id, rev.id]);
});

test('E22 queueRefusal', () => {
  assert.equal(Sync.queueRefusal(/** @type {SyncDoc} */ ({ docType: /** @type {SyncDoc['docType']} */ ('nope') })), 'docType');
  assert.equal(Sync.queueRefusal({ docType: 'accountTxn', kind: 'inv' }), 'kind');
  assert.equal(Sync.queueRefusal({ docType: 'foreman', id: 'f' }), null);
  assert.equal(Sync.queueRefusal({ id: 'e', entryType: 'materials' }), null);
  assert.equal(Sync.queueRefusal({ docType: 'party', id: 'p' }), null);
  assert.equal(Sync.queueRefusal({ docType: 'agreement', id: 'a' }), null);
  assert.equal(Sync.queueRefusal(txn()), null);
  assert.equal(Sync.queueRefusal({ docType: 'statementApproval', id: 's' }), null);
  assert.equal(Sync.queueRefusal(null), null);
  assert.equal(Sync.collectionFor(txn()), 'accountTxns');
  assert.equal(Sync.collectionFor(/** @type {SyncDoc} */ ({ docType: /** @type {SyncDoc['docType']} */ ('nope'), id: 'x' })), null);
});

test('E23 accountReads and toRemote', () => {
  assert.deepEqual(Sync.accountReads({ role: 'site', active: true, uid: 'site-1' }, null), []);
  const reads = Sync.accountReads({ role: 'owner', active: true, uid: 'owner-a' }, null);
  assert.deepEqual(reads.map(spec => spec.collection), ['parties', 'agreements', 'accountTxns', 'statementApprovals']);
  const remote = Sync.toRemote(Object.assign(txn(), { attachmentIds: ['a'], unitName: 'brick', unitPrice: 5, qty: 3 }));
  assert.equal(remote.docType, undefined);
  assert.equal(remote.attachmentIds, undefined);
  assert.equal(remote.unitName, undefined);
  assert.equal(remote.unitPrice, undefined);
  const untagged = Object.assign({}, remote);
  assert.equal(Status.sameContent(Object.assign(txn(), { qty: 3 }), untagged), true);
});

test('E24 payload', () => {
  const base = txn({ amount: 10, qty: 2 });
  assert.equal(Status.payloadDiffers(base, Object.assign({}, base, { amount: 11 })), true);
  assert.equal(Status.payloadDiffers(base, Object.assign({}, base, { qty: 3 })), true);
  assert.equal(Status.sameContent(base, Object.assign({}, base, { createdBy: 'owner-b' })), false);
  assert.equal(Status.payloadDiffers(base, Object.assign({}, base, { createdBy: 'owner-b' })), false);
  assert.equal(Status.sameContent(base, Object.assign({}, base, { createdAtServer: 99 })), true);
  assert.equal(Status.payloadDiffers(base, Object.assign({}, base, { createdAtServer: 99 })), false);
  assert.equal(Status.payloadDiffers(base, Object.assign({}, base, { deviceId: 'other' })), false);
  assert.equal(Status.payloadDiffers(base, Object.assign({}, base, { partyId: 'other' })), true);
});

test('E25 watermark', () => {
  assert.equal(Sync.ACCOUNTS_MARK, 'accounts');
  const open = Sync.accountReads({ role: 'owner', active: true }, null);
  assert.equal(JSON.stringify(open).includes('createdAtServer'), false);
  const later = Sync.accountReads({ role: 'owner', active: true }, 50);
  assert.equal(later.every(spec => spec.where.some(clause => clause[0] === 'createdAtServer')), true);
  assert.equal(Sync.readSetChanged(
    { role: 'owner', active: true, assignedProjectIds: [] },
    { role: 'site', active: true, assignedProjectIds: ['p1'] },
  ), true);
});

function loadScreen(store) {
  const Ledger = require('../public/ledger.js');
  const context = {
    console, URL, URLSearchParams, Promise, setTimeout, clearTimeout, queueMicrotask, Intl, Date, Map, Set, Object, Array, String, Number, JSON,
    Ledger, Sync, SyncStatus: Status,
    K: {
      projects: 'projects', entries: 'entries', outbox: 'outbox', syncErrors: 'syncErrors', parties: 'parties',
      agreements: 'agreements', accountTxns: 'accountTxns', statementApprovals: 'statementApprovals',
      slotLosers: 'slotLosers', linkRefusals: 'linkRefusals', rejectedExportedIds: 'rejectedExportedIds',
      goneProjectNames: 'goneProjectNames', subcontracts: 'subcontracts', amendments: 'amendments',
      foremen: 'foremen', foremanMoves: 'foremanMoves', terms: 'terms', users: 'users',
    },
    store,
    me: () => ({ uid: 'owner-a', role: 'owner', active: true, displayName: 'أ' }),
    uuid: () => 'id',
    today: () => '2026-11-19',
    demoRole: () => '',
    navigator: { onLine: true },
    location: { hash: '#rejected', search: '' },
    document: { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, getElementById() { return { hidden: true }; }, createElement() { return {}; }, createElementNS() { return { setAttribute() {}, append() {} }; }, body: { dataset: {} } },
    localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    DomSafe: { isSafeId() { return true; }, projectAttr(id) { return id; }, projectHref() { return '#projects'; }, entryHref() { return '#home'; } },
    PeopleDir: { RENDER_ERROR: 'x', TIMEOUT_MS: 1, createLoader() { return { run() { return Promise.resolve(); }, failed() { return false; }, reset() {} }; } },
    flushRemote() {},
    addEventListener() {},
    get(key, fallback) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback; },
    set(key, value) { store[key] = value; return Promise.resolve(); },
    $: () => ({ hidden: true, textContent: '', innerHTML: '', addEventListener() {}, classList: { toggle() {} } }),
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/render.js'), 'utf8'), context);
  return context;
}

test('E26 logout export', () => {
  const accountId = 'acct-refused';
  const slotKey = Sync.slotLoserKey(SLOT);
  const linkKey = 'link-uuid';
  const revId = 'rev_' + AGR;
  const store = {
    entries: [], projects: [{ id: 'p1', name: 'مدرسة' }], agreements: [{ id: revId, docType: 'agreement', projectId: 'p1', amount: 600000, description: 'عكس', reversalReason: 'سبب' }],
    accountTxns: [{ id: accountId, docType: 'accountTxn', projectId: 'p1', partyId: 'person-kareem', amount: 600000, description: 'دفعة', purpose: 'payLabor', currency: 'IQD' }],
    statementApprovals: [], parties: [{ id: 'person-kareem', name: 'كريم البناء' }],
    syncErrors: { [accountId]: Status.REJECTED, [revId]: Status.REJECTED },
    slotLosers: { [slotKey]: { id: SLOT, projectId: 'p1', amount: 1, description: 'قياس' } },
    linkRefusals: { [linkKey]: { id: 'stl_1', projectId: 'p1', amount: 5, description: 'تسوية' } },
    rejectedExportedIds: [],
    goneProjectNames: {},
  };
  const screen = loadScreen(store);
  assert.equal(screen.rejectedLogoutBlock(), true);
  const csv = screen.rejectedExportText(screen.me());
  assert.equal(csv.includes(accountId), true);
  assert.equal(csv.includes(slotKey), true);
  assert.equal(csv.includes(linkKey), true);
  assert.equal(csv.includes(revId), true);
  assert.equal(csv.includes('600000'), true);
  assert.equal(csv.includes('كريم البناء'), true);
  assert.equal(csv.includes('person-kareem'), false);
  assert.equal(csv.includes(Status.CONFLICT), true);
  screen.set(screen.K.rejectedExportedIds, [accountId, slotKey, linkKey, revId]);
  assert.equal(screen.rejectedLogoutBlock(), false);
  const sessionSrc = fs.readFileSync(path.join(__dirname, '../public/session.js'), 'utf8');
  assert.equal(sessionSrc.includes('يوجد قيود مرفوضة على هذا الهاتف. صدّرها قبل الخروج.'), true);
});

test('E28 plain denial', async () => {
  const row = txn({ id: 'appr_plain', kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000 });
  const { result } = await runFlush([row], {
    read: id => (id === row.id ? { status: 'missing' } : { status: 'found', doc: txn() }),
  });
  assert.equal(result.failed[0].message, Status.REJECTED);
  assert.equal(result.synced.includes(row.id), false);
  assert.equal(result.parked.includes(row.id), false);
  assert.equal(row.amount, 600000);
});

test('a parked id leaves the outbox and loses its previous sync error', () => {
  const applied = Status.applyFlush(['parked-id', 'kept-id'], {
    'parked-id': Status.REJECTED,
    'kept-id': Status.CONFLICT,
  }, { parked: ['parked-id'], synced: [], failed: [], kept: [] });
  assert.equal(applied.outbox.includes('parked-id'), false);
  assert.equal(applied.errors['parked-id'], undefined);
  assert.equal(applied.errors['kept-id'], Status.CONFLICT);
  assert.equal(applied.outbox.includes('kept-id'), true);
});

test('a statement approval clash uses the existing conflict sentence', async () => {
  const local = {
    id: 'stmt-1', docType: 'statementApproval', partyId: 'party-1', projectId: 'p1',
    periodKind: 'week', periodStart: '2026-11-01', periodEnd: '2026-11-07', createdBy: 'owner-b',
  };
  const server = Object.assign({}, local, { createdBy: 'owner-a', periodEnd: '2026-11-14' });
  const { result } = await runFlush([local], { read: () => ({ status: 'found', doc: server }) });
  assert.equal(result.synced.includes(local.id), false);
  assert.equal(result.adopted.length, 0);
  assert.equal(result.failed[0].message, Status.CONFLICT);
});

test('E29 project cleanup', async () => {
  const src = {
    projects: [{ id: 'p1', name: 'مدرسة', currency: 'IQD', createdAtServer: 1 }],
    entries: [], subcontracts: [], amendments: [],     outbox: ['ag-wait', 'txn-wait', 'st-1'],
    syncErrors: { 'txn-no': Status.REJECTED, 'st-1': Status.REJECTED },
    agreements: [
      { id: 'ag-wait', projectId: 'p1', docType: 'agreement' },
      { id: 'ag-live', projectId: 'p1', docType: 'agreement' },
      { id: 'ag-other', projectId: 'p2', docType: 'agreement' },
    ],
    accountTxns: [
      { id: 'txn-wait', projectId: 'p1' },
      { id: 'txn-no', projectId: 'p1', amount: 600000 },
      { id: 'txn-live', projectId: 'p1' },
    ],
    statementApprovals: [{ id: 'st-1', projectId: 'p1' }, { id: 'st-2', projectId: 'p2' }],
    parties: [{ id: 'party-1', name: 'كريم', docType: 'party' }],
    slotLosers: { [Sync.slotLoserKey('txn-live')]: { id: 'txn-live', projectId: 'p1' } },
    linkRefusals: { 'uuid-1': { id: 'stl', projectId: 'p1' } },
  };
  const kept = Sync.dropProjectLocal(/** @type {LocalStore} */ (src), 'p1', { dropPending: false });
  assert.equal(kept.agreements.some(row => row.id === 'ag-wait'), true);
  assert.equal(kept.agreements.some(row => row.id === 'ag-live'), false);
  assert.equal(kept.accountTxns.some(row => row.id === 'txn-wait'), true);
  assert.equal(kept.accountTxns.some(row => row.id === 'txn-no'), true);
  assert.equal(kept.accountTxns.some(row => row.id === 'txn-live'), false);
  assert.equal(kept.slotLosers[Sync.slotLoserKey('txn-live')].id, 'txn-live');
  assert.equal(kept.linkRefusals['uuid-1'].id, 'stl');
  assert.equal(kept.parties[0].id, 'party-1');
  assert.equal(kept.outbox.includes('ag-wait'), true);
  assert.equal(kept.outbox.includes('txn-wait'), true);
  assert.equal(kept.outbox.includes('st-1'), true);
  assert.equal(kept.syncErrors['txn-no'], Status.REJECTED);
  assert.equal(kept.syncErrors['st-1'], Status.REJECTED);
  const gone = Sync.dropProjectLocal(/** @type {LocalStore} */ (src), 'p1', { dropPending: true });
  assert.equal(gone.agreements.some(row => row.projectId === 'p1'), false);
  assert.equal(gone.accountTxns.some(row => row.projectId === 'p1'), false);
  assert.equal(gone.statementApprovals.some(row => row.projectId === 'p1'), false);
  assert.equal(gone.slotLosers[Sync.slotLoserKey('txn-live')], undefined);
  assert.equal(gone.linkRefusals['uuid-1'], undefined);
  assert.equal(gone.parties.length, 1);
  assert.equal(gone.agreements.some(row => row.id === 'ag-other'), true);
  assert.equal(gone.outbox.includes('ag-wait'), false);
  assert.equal(gone.outbox.includes('txn-wait'), false);
  assert.equal(gone.outbox.includes('st-1'), false);
  assert.equal(gone.syncErrors['txn-no'], undefined);
  assert.equal(gone.syncErrors['st-1'], undefined);
  const pulled = await Sync.pullAccounts({
    user: { role: 'owner', active: true, uid: 'owner-a' },
    since: null,
    read: async spec => (spec.collection === 'accountTxns' ? [{ id: 'back', projectId: 'p1', amount: 600000 }] : []),
  });
  assert.equal(pulled.accountTxns[0].id, 'back');
  assert.equal(pulled.accountTxns[0].projectId, 'p1');
});

test('E30 own-id read outcomes', async () => {
  const row = txn({ id: 'row-30', kind: 'body', purpose: 'payLabor', amount: 70, agreementId: undefined });
  const transient = await runFlush([row], { read: () => ({ status: 'transient' }) });
  assert.deepEqual(transient.result.kept, [row.id]);
  assert.deepEqual(transient.calls.reads, [row.id]);
  assert.equal(transient.calls.probe, 0);
  const auth = await runFlush([row], { read: async () => { throw codeErr('auth/user-token-expired'); } });
  assert.equal(auth.result.authDead, true);
  assert.deepEqual(auth.calls.reads, [row.id]);
  assert.equal(auth.calls.probe, 0);
  const denied = await runFlush([row], {
    read: () => ({ status: 'denied' }),
    probe: () => ({ exists: false }),
  });
  assert.deepEqual(denied.calls.reads, [row.id]);
  assert.equal(denied.calls.probe, 1);
  assert.equal(denied.result.failed[0].message, Status.PROJECT_DELETED);
  assert.equal(denied.result.synced.includes(row.id), false);
  assert.equal(row.amount, 70);
});

test('E34 kind match', async () => {
  const local = txn({ id: 'appr_' + SLOT, kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000 });
  const server = txn({ id: local.id, kind: 'rev', reversesId: SLOT, reversalReason: 'س' });
  const mismatch = await runFlush([local], { read: () => ({ status: 'found', doc: server }) });
  assert.equal(mismatch.result.adopted.length, 0);
  assert.equal(mismatch.result.synced.includes(local.id), false);
  const child = txn({ id: 'after-rev', kind: 'body', purpose: 'deduct', targetId: 'rev_' + SLOT, amount: 5 });
  const parkedRev = txn({ id: 'rev_' + SLOT, kind: 'rev', reversesId: SLOT, reversalReason: 'س' });
  const { calls, result } = await runFlush([txn({ amount: 1, createdBy: 'owner-b' }), parkedRev, child], {
    read: () => ({ status: 'found', doc: txn({ amount: 9, createdBy: 'owner-a' }) }),
  });
  assert.equal(calls.write.includes(child.id), true);
  assert.equal(result.parked.includes(child.id), false);
});

function loadFlushVm() {
  const context = {
    console, setTimeout, clearTimeout, Map, Object, Array, String, Number, Promise, Error, TypeError, Set, JSON, Date,
    navigator: { onLine: true },
    sessionEpoch: 1,
    syncNotice: '',
    demoRole() { return ''; },
    $(sel) { return { hidden: sel === '#shell', textContent: '' }; },
    render() {},
    paintBell() {},
    holdSession() { return Promise.resolve(); },
    signOutPending() { return ''; },
    clearSignOutPending() {},
    withTimeout(p) { return Promise.resolve(p); },
    cache: {},
    K: {
      projects: 'projects', entries: 'entries', outbox: 'outbox', finance: 'projectFinance',
      terms: 'subcontractTerms', subcontracts: 'subcontracts', amendments: 'subcontractAmendments',
      foremen: 'foremen', foremanMoves: 'foremanMoves', parties: 'parties', agreements: 'agreements',
      accountTxns: 'accountTxns', statementApprovals: 'statementApprovals', slotLosers: 'slotLosers',
      linkRefusals: 'linkRefusals', syncErrors: 'syncErrors', sessionUser: 'sessionUser',
      statusPending: 'statusPending', pullWatermark: 'pullWatermark', rejectedExportedIds: 'rejectedExportedIds',
    },
  };
  context.window = context;
  context.globalThis = context;
  context.get = (k, d) => (context.cache[k] === undefined ? d : JSON.parse(JSON.stringify(context.cache[k])));
  context.set = (k, v) => { context.cache[k] = JSON.parse(JSON.stringify(v)); };
  vm.createContext(context);
  for (const file of ['ledger.js', 'sync.js', 'sync-status.js', 'accounts.js', 'firebase-client.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../public', file), 'utf8'), context, { filename: file });
  }
  return context;
}

test('E31 inactive profile', async () => {
  const context = loadFlushVm();
  const user = { uid: 'owner-a', role: 'owner', active: true, displayName: 'أ' };
  const body = txn({ amount: 1, createdBy: 'owner-b' });
  const appr = txn({ id: 'appr_' + SLOT, kind: 'appr', purpose: 'approveLabor', targetId: SLOT, amount: 600000, createdBy: 'owner-b' });
  const stray = txn({ id: 'stray-31', kind: 'appr', purpose: 'approveLabor', targetId: 'gone-body', amount: 1 });
  context.set(context.K.sessionUser, user);
  context.set(context.K.accountTxns, [body, appr, stray]);
  context.set(context.K.outbox, [body.id, appr.id, stray.id]);
  context.set(context.K.slotLosers, {});
  context.set(context.K.syncErrors, {});
  let profiles = 0;
  context.ensureFirebase = () => Promise.resolve({
    idToken: async () => 'tok',
    refreshProfile: async () => {
      profiles += 1;
      return profiles === 1 ? user : Object.assign({}, user, { active: false });
    },
    writeLocal: async () => { throw codeErr('permission-denied'); },
    readDependency: async id => {
      if (id === body.id) return { status: 'found', doc: txn({ amount: 2, createdBy: 'owner-a' }) };
      if (id === stray.id) return { status: 'missing' };
      return { status: 'missing' };
    },
    readProjectDoc: async () => ({ exists: () => true }),
    pull: async () => {},
    updateProjectStatus: async () => {},
  });
  await context.flushRemote({ fromOutside: true });
  const losers = context.get(context.K.slotLosers, {});
  assert.equal(losers[Sync.slotLoserKey(appr.id)].id, appr.id);
  const screen = loadScreen({
    entries: [], projects: [], accountTxns: context.get(context.K.accountTxns, []),
    agreements: [], parties: [], statementApprovals: [],
    syncErrors: context.get(context.K.syncErrors, {}),
    slotLosers: losers, linkRefusals: {}, rejectedExportedIds: [], goneProjectNames: {},
  });
  assert.equal(screen.rejectedLogoutBlock(), true);
});

test('E32 kept id does not arm the tail', async () => {
  const { mock } = require('node:test');
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const context = loadFlushVm();
    const row = txn({ id: 'kept-32', kind: 'appr', purpose: 'approveLabor', targetId: 'body-32', amount: 1 });
    context.set(context.K.sessionUser, { uid: 'owner-a', role: 'owner', active: true });
    context.set(context.K.accountTxns, [row]);
    context.set(context.K.outbox, [row.id]);
    context.set(context.K.syncErrors, {});
    let flushes = 0;
    const real = context.Sync.flushOutbox;
    context.Sync.flushOutbox = async opts => { flushes += 1; return real(opts); };
    context.ensureFirebase = () => Promise.resolve({
      idToken: async () => 'tok',
      refreshProfile: async () => context.get(context.K.sessionUser),
      writeLocal: async () => { throw codeErr('internal'); },
      readDependency: async () => ({ status: 'transient' }),
      pull: async () => {},
      updateProjectStatus: async () => {},
      readProjectDoc: async () => ({ exists: () => true }),
    });
    await context.flushRemote({ fromOutside: true });
    for (let i = 0; i < 4; i += 1) {
      mock.timers.tick(0);
      await new Promise(resolve => setImmediate(resolve));
    }
    assert.equal(flushes, 1);
    assert.deepEqual(context.get(context.K.outbox, []), [row.id]);
    assert.equal(context.get(context.K.syncErrors, {})[row.id], undefined);
  } finally {
    mock.timers.reset();
  }
});
