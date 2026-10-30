// Incremental pull reads only ledger rows changed since the last watermark.
// Counts documents returned by each sync against the Firestore emulator.
// Never calls production.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const {
  doc, setDoc, serverTimestamp, collection, query, where, getDocsFromServer, getDocFromServer, Timestamp,
} = require('firebase/firestore');
const Sync = require('../../public/sync.js');
const Ledger = require('../../public/ledger.js');

const PROJECT = 'ahl-aljazeera-accounting';
const OWNER = 'owner-inc';
const SITE = 'site-inc';
const OTHER = 'other-inc';
const N = 20;
const BASE = Date.parse('2026-01-01T00:00:00.000Z');

function localHost(name) {
  const raw = process.env[name];
  if (!raw || !/^(127\.0\.0\.1|localhost):\d+$/.test(raw)) {
    throw new Error(name + ' must be a local emulator (refusing production). Got: ' + raw);
  }
  const [host, port] = raw.split(':');
  return { host, port: Number(port) };
}

function at(i) { return new Date(BASE + i * 1000); }

function copies(rows, id) { return rows.filter(r => r && r.id === id).length; }
function hits(ids, id) { return ids.filter(x => x === id).length; }

function assertUnique(rows) {
  assert.equal(new Set(rows.map(r => r.id)).size, rows.length);
}

let testEnv;
const openDbs = [];
let chain = Promise.resolve();

function testSeq(name, fn) {
  test(name, { timeout: 40000 }, async () => {
    const prev = chain;
    let release;
    chain = new Promise(r => { release = r; });
    await prev;
    try { await fn(); }
    finally { release(); }
  });
}

function userDoc(uid, over) {
  return Object.assign({
    displayName: 'مستخدم', email: uid + '@example.invalid', role: 'site', active: true,
    assignedProjectIds: [], createdAtServer: at(1), createdBy: OWNER,
  }, over);
}

function projectDoc(id, name, when) {
  return {
    id, name, clientName: 'زبون', location: 'السماوة', currency: 'IQD', status: 'active',
    createdAtDevice: 1, createdAtServer: when, createdBy: OWNER, deviceId: 'admin',
  };
}

function entryDoc(id, over) {
  return Object.assign({
    id, projectId: 'p-a', direction: 'expense', entryType: 'materials', amount: 1000,
    currency: 'IQD', entryDate: '2026-10-30', description: id, isReversal: false,
    createdAtDevice: 1, createdBy: OWNER, deviceId: 'dev-' + (over && over.createdBy || OWNER),
  }, over);
}

function liveEntry(uid, id, over) {
  const row = entryDoc(id, Object.assign({ createdBy: uid }, over));
  row.createdAtServer = serverTimestamp();
  return row;
}

async function readSpec(db, spec) {
  if (spec.id) {
    const snap = await getDocFromServer(doc(db, spec.collection, spec.id));
    return snap.exists() ? [snap.data()] : [];
  }
  const col = collection(db, spec.collection);
  const clauses = (spec.where || []).map(([field, op, value]) => where(
    field, op, field === 'createdAtServer' ? Timestamp.fromMillis(value) : value));
  const src = clauses.length ? query(col, ...clauses) : col;
  const snap = await getDocsFromServer(src);
  return snap.docs.map(d => d.data());
}

async function pull(db, user, store) {
  const counts = { entries: 0, projects: 0 };
  const seen = { entries: [], projects: [] };
  const result = await Sync.pullChanges({
    user,
    watermark: store.watermark,
    pendingIds: store.pendingIds,
    localEntries: store.entries,
    localProjects: store.projects,
    read: async spec => {
      const rows = await readSpec(db, spec);
      const key = spec.collection === 'projects' ? 'projects' : 'entries';
      counts[key] += rows.length;
      rows.forEach(row => seen[key].push(row.id));
      return rows;
    },
  });
  store.entries = result.entries;
  store.projects = result.projects;
  store.watermark = result.watermark;
  return { counts, seen };
}

function freshStore(pending) {
  return { entries: pending ? [pending] : [], projects: [], pendingIds: pending ? [pending.id] : [], watermark: null };
}

test.after(async () => {
  // The emulator fails one clearData while a getDocsFromServer listen target is
  // closing. Absorb that once so the next file's clear is not the victim.
  for (const db of openDbs) {
    try { await db.disableNetwork(); } catch (e) {}
  }
  if (testEnv) {
    try { await testEnv.clearFirestore(); } catch (e) {}
    await testEnv.clearFirestore();
    await testEnv.cleanup();
  }
});

test.before(async () => {
  const host = localHost('FIRESTORE_EMULATOR_HOST');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT,
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, '../../firestore.rules'), 'utf8'),
      host: host.host,
      port: host.port,
    },
  });
});

function authed(uid) {
  const db = testEnv.authenticatedContext(uid).firestore();
  openDbs.push(db);
  return db;
}

testSeq('owner sync re-reads only the watermark boundary, then a new device entry once', async () => {
  await testEnv.clearFirestore();
  const pending = entryDoc('pend-1', { createdAtServer: null, description: 'لم يُرسل', amount: 50 });
  const store = freshStore(pending);
  const owner = { uid: OWNER, role: 'owner', active: true, assignedProjectIds: [] };
  let ownerDb;

  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'users', OWNER), userDoc(OWNER, {
      role: 'owner', displayName: 'أمير', email: 'owner.inc@example.invalid', assignedProjectIds: [],
    }));
    await setDoc(doc(d, 'projects', 'p-a'), projectDoc('p-a', 'مشروع أ', at(1)));
    await setDoc(doc(d, 'projects', 'p-b'), projectDoc('p-b', 'مشروع ب', at(2)));
    await setDoc(doc(d, 'projects', 'p-c'), projectDoc('p-c', 'مشروع ج', at(3)));
    for (let i = 1; i <= N; i++) {
      const id = 'n-' + String(i).padStart(2, '0');
      await setDoc(doc(d, 'ledgerEntries', id), entryDoc(id, { createdAtServer: at(100 + i), amount: 1000 + i }));
    }
  });
  ownerDb = authed(OWNER);

  const first = await pull(ownerDb, owner, store);
  assert.equal(first.counts.entries, N);
  assert.equal(first.counts.projects, 3);
  assert.equal(store.entries.length, N + 1);
  assert.equal(copies(store.entries, 'pend-1'), 1);
  assert.equal(store.entries.find(e => e.id === 'pend-1').createdAtServer, null);
  assert.equal(copies(store.entries, 'n-01'), 1);
  assert.equal(copies(store.projects, 'p-a'), 1);
  assertUnique(store.entries);

  const second = await pull(ownerDb, owner, store);
  assert.equal(second.counts.entries, 1);
  assert.equal(second.counts.projects, 1);
  assert.deepEqual(second.seen.entries, ['n-20']);
  assert.equal(store.entries.length, N + 1);
  assert.equal(copies(store.entries, 'pend-1'), 1);
  assert.equal(store.entries.find(e => e.id === 'pend-1').createdAtServer, null);
  assertUnique(store.entries);

  const mark = store.watermark.entries;
  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'ledgerEntries', 'bound-1'), entryDoc('bound-1', {
      createdAtServer: new Date(mark), amount: 2222, description: 'نفس الوقت',
    }));
  });
  const boundary = await pull(ownerDb, owner, store);
  assert.equal(boundary.counts.entries, 2);
  assert.equal(hits(boundary.seen.entries, 'bound-1'), 1);
  assert.equal(copies(store.entries, 'bound-1'), 1);
  assert.equal(copies(store.entries, 'n-20'), 1);
  assert.equal(store.entries.length, N + 2);
  assertUnique(store.entries);

  await setDoc(doc(ownerDb, 'ledgerEntries', 'phone-2'), liveEntry(OWNER, 'phone-2', {
    projectId: 'p-a', amount: 3300, description: 'جهاز آخر',
  }));
  const discovered = await pull(ownerDb, owner, store);
  assert.equal(hits(discovered.seen.entries, 'phone-2'), 1);
  assert.equal(discovered.seen.entries.includes('n-01'), false);
  assert.equal(copies(store.entries, 'phone-2'), 1);
  assert.equal(store.entries.length, N + 3);
  assertUnique(store.entries);

  const settled = await pull(ownerDb, owner, store);
  assert.equal(copies(store.entries, 'phone-2'), 1);
  assert.equal(store.entries.length, N + 3);
  assert.equal(copies(store.entries, 'pend-1'), 1);
  assert.equal(store.entries.find(e => e.id === 'pend-1').createdAtServer, null);
  assert.ok(settled.counts.entries < N);
  assertUnique(store.entries);

  const csv = Ledger.toCSV(store.entries, store.projects);
  const lines = csv.replace(/^\uFEFF/, '').trim().split('\r\n');
  assert.equal(lines.length, store.entries.length + 1);
  for (const row of store.entries) assert.ok(csv.includes(row.id), row.id);
  assert.ok(csv.includes('n-01'));
  assert.ok(csv.includes('pend-1'));
  assert.ok(csv.includes('phone-2'));
  assert.equal(Ledger.canExportCSV(owner), true);

  console.log('owner incremental reads ' + JSON.stringify({
    first: first.counts,
    second: second.counts,
    boundary: boundary.counts,
    newDevice: discovered.counts,
    settled: settled.counts,
    ledger: store.entries.length,
  }));
});

testSeq('site sync stays on assigned projects and does not re-read the ledger', async () => {
  await testEnv.clearFirestore();
  const pending = entryDoc('pend-site', {
    projectId: 'p-ok', createdBy: SITE, createdAtServer: null, description: 'محلي', amount: 70,
  });
  const store = freshStore(pending);
  const site = { uid: SITE, role: 'site', active: true, assignedProjectIds: ['p-ok'] };
  const hidden = ['hid-inc', 'hid-pno', 'hid-new-inc', 'hid-new-pno'];

  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'users', SITE), userDoc(SITE, {
      displayName: 'أحمد', email: 'site.inc@example.invalid', assignedProjectIds: ['p-ok'],
    }));
    await setDoc(doc(d, 'users', OTHER), userDoc(OTHER, {
      displayName: 'سامي', email: 'other.inc@example.invalid', assignedProjectIds: ['p-ok'],
    }));
    await setDoc(doc(d, 'projects', 'p-ok'), projectDoc('p-ok', 'المشروع المعيّن', at(1)));
    await setDoc(doc(d, 'projects', 'p-no'), projectDoc('p-no', 'مشروع آخر', at(2)));
    const rows = [
      ['vis-exp-other', { projectId: 'p-ok', createdBy: OTHER, direction: 'expense', entryType: 'materials', createdAtServer: at(3) }],
      ['vis-exp-site', { projectId: 'p-ok', createdBy: SITE, direction: 'expense', entryType: 'labour', amount: 400, createdAtServer: at(4) }],
      ['vis-inc-site', { projectId: 'p-ok', createdBy: SITE, direction: 'income', entryType: 'clientPayment', amount: 2500, createdAtServer: at(5) }],
      ['hid-inc', { projectId: 'p-ok', createdBy: OTHER, direction: 'income', entryType: 'clientPayment', amount: 9000, createdAtServer: at(6) }],
      ['hid-pno', { projectId: 'p-no', createdBy: SITE, direction: 'expense', entryType: 'materials', amount: 40, createdAtServer: at(7) }],
    ];
    for (let i = 0; i < 12; i++) {
      rows.push(['fill-' + i, {
        projectId: 'p-no', createdBy: OTHER, direction: 'expense', entryType: 'materials',
        amount: 10 + i, createdAtServer: at(20 + i),
      }]);
    }
    for (const [id, over] of rows) await setDoc(doc(d, 'ledgerEntries', id), entryDoc(id, over));
  });

  const siteDb = authed(SITE);
  const otherDb = authed(OTHER);
  const first = await pull(siteDb, site, store);
  assert.equal(first.counts.entries, 4);
  assert.equal(first.counts.projects, 1);
  assert.deepEqual(first.seen.projects, ['p-ok']);
  for (const id of ['vis-exp-other', 'vis-exp-site', 'vis-inc-site', 'pend-site']) {
    assert.equal(copies(store.entries, id), 1, id);
  }
  for (const id of hidden) assert.equal(copies(store.entries, id), 0, id);
  assert.equal(copies(store.entries, 'vis-exp-site'), 1);
  assert.equal(store.entries.find(e => e.id === 'pend-site').createdAtServer, null);
  assert.equal(copies(store.projects, 'p-no'), 0);
  assertUnique(store.entries);

  const second = await pull(siteDb, site, store);
  assert.equal(second.counts.entries, 1);
  assert.equal(second.counts.projects, 1);
  assert.deepEqual(second.seen.projects, ['p-ok']);
  assert.equal(store.entries.length, 4);
  assert.equal(copies(store.entries, 'pend-site'), 1);

  await testEnv.withSecurityRulesDisabled(async ctx => {
    await setDoc(doc(ctx.firestore(), 'ledgerEntries', 'bound-site'), entryDoc('bound-site', {
      projectId: 'p-ok', createdBy: OTHER, direction: 'expense', entryType: 'materials',
      createdAtServer: new Date(store.watermark.entries), amount: 515,
    }));
  });
  const boundary = await pull(siteDb, site, store);
  assert.equal(hits(boundary.seen.entries, 'bound-site'), 1);
  assert.equal(copies(store.entries, 'bound-site'), 1);
  assert.equal(copies(store.entries, 'hid-inc'), 0);
  assertUnique(store.entries);

  await setDoc(doc(otherDb, 'ledgerEntries', 'phone-site'), liveEntry(OTHER, 'phone-site', {
    projectId: 'p-ok', amount: 640, description: 'مصروف جديد',
  }));
  const discovered = await pull(siteDb, site, store);
  assert.equal(hits(discovered.seen.entries, 'phone-site'), 1);
  assert.equal(copies(store.entries, 'phone-site'), 1);
  assert.equal(discovered.seen.entries.includes('fill-0'), false);
  assert.equal(discovered.seen.entries.includes('hid-pno'), false);

  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'ledgerEntries', 'hid-new-inc'), entryDoc('hid-new-inc', {
      projectId: 'p-ok', createdBy: OTHER, direction: 'income', entryType: 'clientPayment',
      amount: 8000, createdAtServer: new Date(),
    }));
    await setDoc(doc(d, 'ledgerEntries', 'hid-new-pno'), entryDoc('hid-new-pno', {
      projectId: 'p-no', createdBy: SITE, direction: 'expense', entryType: 'materials',
      amount: 90, createdAtServer: new Date(),
    }));
  });
  const afterHidden = await pull(siteDb, site, store);
  assert.equal(copies(store.entries, 'hid-new-inc'), 0);
  assert.equal(copies(store.entries, 'hid-new-pno'), 0);
  assert.equal(copies(store.entries, 'phone-site'), 1);
  assert.equal(copies(store.projects, 'p-ok'), 1);
  assert.equal(copies(store.projects, 'p-no'), 0);
  assert.equal(copies(store.entries, 'pend-site'), 1);
  assert.equal(store.entries.find(e => e.id === 'pend-site').createdAtServer, null);
  assert.ok(afterHidden.counts.entries < 12);
  assertUnique(store.entries);

  console.log('site incremental reads ' + JSON.stringify({
    first: first.counts,
    second: second.counts,
    boundary: boundary.counts,
    newDevice: discovered.counts,
    afterHidden: afterHidden.counts,
    ledger: store.entries.length,
    projects: store.projects.map(p => p.id),
  }));
});

testSeq('a missing index falls back to a full site pull and keeps the watermark', async () => {
  await testEnv.clearFirestore();
  const pending = entryDoc('pend-idx', {
    projectId: 'p-ok', createdBy: SITE, createdAtServer: null, description: 'محلي', amount: 70,
  });
  const store = freshStore(pending);
  const site = { uid: SITE, role: 'site', active: true, assignedProjectIds: ['p-ok'] };

  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'users', SITE), userDoc(SITE, {
      displayName: 'أحمد', email: 'site.idx@example.invalid', assignedProjectIds: ['p-ok'],
    }));
    await setDoc(doc(d, 'users', OTHER), userDoc(OTHER, {
      displayName: 'سامي', email: 'other.idx@example.invalid', assignedProjectIds: ['p-ok'],
    }));
    await setDoc(doc(d, 'projects', 'p-ok'), projectDoc('p-ok', 'المشروع المعيّن', at(1)));
    await setDoc(doc(d, 'projects', 'p-no'), projectDoc('p-no', 'مشروع آخر', at(2)));
    const rows = [
      ['idx-exp', { projectId: 'p-ok', createdBy: OTHER, direction: 'expense', entryType: 'materials', createdAtServer: at(3), amount: 300 }],
      ['idx-own', { projectId: 'p-ok', createdBy: SITE, direction: 'income', entryType: 'clientPayment', createdAtServer: at(5), amount: 2500 }],
      ['idx-hid-inc', { projectId: 'p-ok', createdBy: OTHER, direction: 'income', entryType: 'clientPayment', createdAtServer: at(6), amount: 9000 }],
      ['idx-hid-pno', { projectId: 'p-no', createdBy: SITE, direction: 'expense', entryType: 'materials', createdAtServer: at(7), amount: 40 }],
    ];
    for (const [id, over] of rows) await setDoc(doc(d, 'ledgerEntries', id), entryDoc(id, over));
  });

  const siteDb = authed(SITE);
  const first = await pull(siteDb, site, store);
  assert.equal(copies(store.entries, 'idx-exp'), 1);
  assert.equal(copies(store.entries, 'idx-own'), 1);
  assert.equal(copies(store.entries, 'idx-hid-inc'), 0);
  assert.equal(copies(store.entries, 'idx-hid-pno'), 0);
  assert.equal(copies(store.entries, 'pend-idx'), 1);
  const markEntries = store.watermark.entries;
  const markProjects = store.watermark.projects;
  assert.equal(typeof markEntries, 'number');

  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d, 'ledgerEntries', 'idx-new'), entryDoc('idx-new', {
      projectId: 'p-ok', createdBy: OTHER, direction: 'expense', entryType: 'labour',
      createdAtServer: at(30), amount: 880,
    }));
    await setDoc(doc(d, 'ledgerEntries', 'idx-new-hid'), entryDoc('idx-new-hid', {
      projectId: 'p-no', createdBy: OTHER, direction: 'expense', entryType: 'materials',
      createdAtServer: at(31), amount: 50,
    }));
  });

  let rangeAttempts = 0;
  let fullEntryReads = 0;
  const result = await Sync.pullChanges({
    user: site,
    watermark: store.watermark,
    pendingIds: store.pendingIds,
    localEntries: store.entries,
    localProjects: store.projects,
    read: async spec => {
      const ranged = (spec.where || []).some(part => part[0] === 'createdAtServer');
      if (ranged) {
        rangeAttempts += 1;
        const err = new Error('The query requires an index.');
        err.code = 'failed-precondition';
        throw err;
      }
      const rows = await readSpec(siteDb, spec);
      if (spec.collection === 'ledgerEntries') fullEntryReads += rows.length;
      return rows;
    },
  });
  assert.ok(rangeAttempts >= 1);
  assert.ok(fullEntryReads >= 3);
  assert.equal(result.watermark.entries, markEntries);
  assert.equal(result.watermark.projects, markProjects);
  assert.equal(copies(result.entries, 'idx-new'), 1);
  assert.equal(copies(result.entries, 'idx-exp'), 1);
  assert.equal(copies(result.entries, 'idx-own'), 1);
  assert.equal(copies(result.entries, 'idx-hid-inc'), 0);
  assert.equal(copies(result.entries, 'idx-hid-pno'), 0);
  assert.equal(copies(result.entries, 'idx-new-hid'), 0);
  assert.equal(copies(result.entries, 'pend-idx'), 1);
  assert.equal(result.entries.find(e => e.id === 'pend-idx').createdAtServer, null);
  assert.equal(copies(result.projects, 'p-ok'), 1);
  assert.equal(copies(result.projects, 'p-no'), 0);
  assertUnique(result.entries);

  store.entries = result.entries;
  store.projects = result.projects;
  await assert.rejects(() => Sync.pullChanges({
    user: site,
    watermark: store.watermark,
    pendingIds: store.pendingIds,
    localEntries: store.entries,
    localProjects: store.projects,
    read: async () => {
      const err = new Error('The query requires an index.');
      err.code = 'failed-precondition';
      throw err;
    },
  }));
  assert.equal(store.watermark.entries, markEntries);
  assert.equal(copies(store.entries, 'idx-new'), 1);

  console.log('missing-index fallback ' + JSON.stringify({
    rangeAttempts,
    fullEntryReads,
    watermarkEntries: result.watermark.entries,
    ledger: result.entries.length,
  }));
});
