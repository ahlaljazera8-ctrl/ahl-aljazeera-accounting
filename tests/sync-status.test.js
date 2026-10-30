const test = require('node:test');
const assert = require('node:assert/strict');
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
  assert.deepEqual(applied.outbox, [row.id]);
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
  assert.match(Status.badgeHtml(row.id, [row.id], { [row.id]: mismatch.failed[0].message }), /محتوى مختلف/);
  assert.equal(Status.badgeHtml(row.id, [row.id], { [row.id]: mismatch.failed[0].message }).includes('لم يُرسل'), false);

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
