const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
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
