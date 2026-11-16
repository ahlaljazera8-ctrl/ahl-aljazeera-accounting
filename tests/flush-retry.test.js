// The flush tail must stop. These tests load the real firebase-client.js.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { mock } = require('node:test');

const ROOT = path.join(__dirname, '..');
const CLIENT = path.join(ROOT, 'public/firebase-client.js');

function project(id, extra) {
  return Object.assign({
    id, name: 'مشروع', clientName: 'زبون', currency: 'IQD', status: 'active',
    createdAtDevice: 1, createdBy: 'u-owner', deviceId: 'phone-1',
  }, extra || {});
}

function load(src) {
  const context = {
    console,
    setTimeout,
    clearTimeout,
    Map,
    Object,
    Array,
    String,
    Number,
    Promise,
    Error,
    TypeError,
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
    MISSING_PROFILE_MSG: 'missing',
    SUSPENDED_MSG: 'suspended',
    SESSION_DEAD_MSG: 'dead',
    cache: {},
    K: {
      projects: 'projects', entries: 'entries', outbox: 'outbox', finance: 'projectFinance',
      terms: 'subcontractTerms', subcontracts: 'subcontracts', amendments: 'subcontractAmendments',
      foremen: 'foremen', foremanMoves: 'foremanMoves', syncErrors: 'syncErrors',
      sessionUser: 'sessionUser', statusPending: 'statusPending', pullWatermark: 'pullWatermark',
    },
  };
  context.window = context;
  context.globalThis = context;
  context.get = (k, d) => {
    const box = context.cache;
    return box[k] === undefined ? d : JSON.parse(JSON.stringify(box[k]));
  };
  context.set = (k, v) => { context.cache[k] = JSON.parse(JSON.stringify(v)); };
  vm.createContext(context);
  for (const file of ['ledger.js', 'sync.js', 'sync-status.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'public', file), 'utf8'), context, { filename: file });
  }
  vm.runInContext(src, context, { filename: 'firebase-client.js' });
  return context;
}

function harness(src, opts) {
  const context = load(src);
  const counts = { rounds: 0, project: 0, finance: 0, writes: 0 };
  const user = opts.user || { uid: 'u-owner', role: 'owner', active: true, displayName: 'مالك' };
  context.set(context.K.sessionUser, user);
  context.set(context.K.projects, opts.projects || []);
  context.set(context.K.entries, opts.entries || []);
  context.set(context.K.subcontracts, opts.subs || []);
  context.set(context.K.finance, opts.finance || {});
  context.set(context.K.terms, opts.terms || {});
  context.set(context.K.outbox, (opts.outbox || []).slice());
  context.set(context.K.syncErrors, opts.errors || {});
  context.set(context.K.statusPending, opts.status || []);
  context.navigator.onLine = opts.offline ? false : true;
  const fb = {
    async writeLocal(local) {
      counts.writes += 1;
      if (opts.fail) {
        const err = new Error('denied');
        err.code = 'permission-denied';
        throw err;
      }
      if (opts.unavailable) {
        const err = new Error('offline');
        err.code = 'unavailable';
        throw err;
      }
      if (opts.missingWrite) {
        throw new TypeError('fb.writeLocal is not a function');
      }
      const id = local.id;
      const col = context.Sync.collectionFor(local);
      if (col === 'projects') counts.project += 1;
      if (col === 'subcontracts') {
        const terms = context.get(context.K.terms, {})[id];
        const payload = context.Sync.termsPayload(terms && terms.originalAmount);
        if (!payload) throw new Error('مبلغ العقد غير صالح');
        const current = context.get(context.K.terms, {})[id];
        if (!current || current.originalAmount === payload.originalAmount) {
          const next = context.get(context.K.terms, {});
          next[id] = { originalAmount: payload.originalAmount };
          context.set(context.K.terms, next);
        }
        return;
      }
      const fin = context.get(context.K.finance, {})[id];
      const explicit = fin && Number.isInteger(fin.contractAmount) ? fin.contractAmount : undefined;
      const saved = context.Sync.splitProjectSave(local, explicit);
      if (opts.duringWrite) opts.duringWrite(context, local, saved);
      if (!saved.finance || !context.Ledger.can(user, 'owner')) return;
      counts.finance += 1;
      const current = context.get(context.K.finance, {})[id];
      if (!current || current.contractAmount === saved.finance.contractAmount) {
        const next = context.get(context.K.finance, {});
        next[id] = { contractAmount: saved.finance.contractAmount };
        context.set(context.K.finance, next);
      }
    },
    exists() { return Promise.resolve(false); },
    readServer() { return Promise.resolve(null); },
    pull() {
      counts.rounds += 1;
      if (counts.rounds > 6) context.navigator.onLine = false;
      if (opts.duringPull) opts.duringPull(context);
      return Promise.resolve();
    },
  };
  context.ensureFirebase = () => Promise.resolve(fb);
  return { context, counts, fb };
}

async function run(src, opts) {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const box = harness(src, opts || {});
    await box.context.flushRemote(opts && opts.inside ? undefined : { fromOutside: true });
    for (let i = 0; i < 8; i += 1) {
      mock.timers.tick(0);
      await new Promise(resolve => setImmediate(resolve));
    }
    const k = box.context.K;
    return {
      counts: box.counts,
      outbox: box.context.get(k.outbox, []),
      errors: box.context.get(k.syncErrors, {}),
      finance: box.context.get(k.finance, {}),
      terms: box.context.get(k.terms, {}),
      projects: box.context.get(k.projects, []),
      subs: box.context.get(k.subcontracts, []),
      entries: box.context.get(k.entries, []),
    };
  } finally {
    mock.timers.reset();
  }
}

const LIVE = () => fs.readFileSync(CLIENT, 'utf8');

function owner() { return { uid: 'u-owner', role: 'owner', active: true, displayName: 'مالك' }; }

test('a seed with a pending contract is refused and not written', async () => {
  const got = await run(LIVE(), {
    projects: [project('p-school', { isExample: true, deviceId: 'seed' })],
    finance: { 'p-school': { contractAmount: 60000000, pending: true } },
    outbox: ['p-school'],
  });
  assert.ok(got.counts.rounds <= 2);
  assert.equal(got.counts.project, 0);
  assert.equal(got.finance['p-school'].contractAmount, 60000000);
  assert.equal(got.finance['p-school'].pending, true);
  assert.equal(got.errors['p-school'], 'رُفض الإرسال');
  assert.deepEqual(got.outbox, []);
});

test('an out-of-range integer is one project write, then refused', async () => {
  const max = require(path.join(ROOT, 'public/ledger.js')).MAX_AMOUNT_IQD;
  const got = await run(LIVE(), {
    projects: [project('p2')],
    finance: { p2: { contractAmount: max + 1, pending: true } },
    outbox: ['p2'],
  });
  assert.ok(got.counts.rounds <= 2);
  assert.equal(got.counts.project, 1);
  assert.equal(got.counts.finance, 0);
  assert.equal(got.finance.p2.contractAmount, max + 1);
  assert.equal(got.finance.p2.pending, true);
  assert.equal(got.errors.p2, 'رُفض الإرسال');
});

test('a pending flag with no integer is one project write and is not deleted', async () => {
  const got = await run(LIVE(), {
    projects: [project('p1')],
    finance: { p1: { pending: true } },
    outbox: ['p1'],
  });
  assert.ok(got.counts.rounds <= 2);
  assert.equal(got.counts.project, 1);
  assert.equal(got.finance.p1.pending, true);
  assert.equal(got.errors.p1, 'رُفض الإرسال');
});

test('an amount that changes every round without a save stays at two rounds', async () => {
  let n = 0;
  const got = await run(LIVE(), {
    projects: [project('p3')],
    finance: { p3: { contractAmount: 100, pending: true } },
    outbox: ['p3'],
    duringWrite(context, local, saved) {
      n += 1;
      const fin = context.get(context.K.finance, {});
      fin[local.id] = { contractAmount: 100 + n, pending: true };
      context.set(context.K.finance, fin);
      void saved;
    },
  });
  assert.ok(got.counts.rounds <= 2);
  assert.ok(got.counts.project <= 2);
  assert.ok(got.counts.finance <= 2);
});

test('a valid contract is one round and clears pending', async () => {
  const got = await run(LIVE(), {
    projects: [project('p-ok')],
    finance: { 'p-ok': { contractAmount: 123456, pending: true } },
    outbox: ['p-ok'],
  });
  assert.equal(got.counts.rounds, 1);
  assert.equal(got.counts.project, 1);
  assert.equal(got.counts.finance, 1);
  assert.deepEqual(got.finance['p-ok'], { contractAmount: 123456 });
  assert.deepEqual(got.outbox, []);
});

test('a legacy project amount with a bare pending row is sent', async () => {
  const got = await run(LIVE(), {
    projects: [project('p-old', { contractAmount: 5000 })],
    finance: { 'p-old': { pending: true } },
    outbox: ['p-old'],
  });
  assert.equal(got.counts.rounds, 1);
  assert.equal(got.counts.finance, 1);
  assert.equal(got.errors['p-old'], undefined);
  assert.equal(got.finance['p-old'].pending, true);
});

test('an amount that changes once during the write is sent on the extra round', async () => {
  let changed = false;
  const got = await run(LIVE(), {
    projects: [project('p3')],
    finance: { p3: { contractAmount: 100, pending: true } },
    outbox: ['p3'],
    duringWrite(context, local) {
      if (changed) return;
      changed = true;
      const fin = context.get(context.K.finance, {});
      fin[local.id] = { contractAmount: 200, pending: true };
      context.set(context.K.finance, fin);
    },
  });
  assert.ok(got.counts.rounds <= 2);
  assert.ok(got.counts.project <= 2);
  assert.ok(got.counts.finance <= 2);
  assert.equal(got.finance.p3.contractAmount, 200);
  assert.equal(got.finance.p3.pending, undefined);
});

test('an entry saved during the pull is sent', async () => {
  const got = await run(LIVE(), {
    projects: [project('p-ok')],
    finance: { 'p-ok': { contractAmount: 10, pending: true } },
    outbox: ['p-ok'],
    duringPull(context) {
      const entries = context.get(context.K.entries, []);
      entries.push({
        id: 'e1', projectId: 'p-ok', direction: 'expense', entryType: 'materials', amount: 5,
        currency: 'IQD', entryDate: '2026-10-30', isReversal: false, createdAtDevice: 1,
        createdBy: 'u-owner', deviceId: 'phone-1',
      });
      context.set(context.K.entries, entries);
      const out = context.get(context.K.outbox, []);
      if (!out.includes('e1')) out.push('e1');
      context.set(context.K.outbox, out);
    },
  });
  assert.ok(got.counts.rounds >= 2);
  assert.ok(got.counts.writes >= 2);
});

test('a contract saved on a second project during the flush is not refused', async () => {
  const got = await run(LIVE(), {
    projects: [project('p-ok'), project('p-new')],
    finance: { 'p-ok': { contractAmount: 10, pending: true } },
    outbox: ['p-ok'],
    duringPull(context) {
      if (context.addedNew) return;
      context.addedNew = true;
      const fin = context.get(context.K.finance, {});
      fin['p-new'] = { contractAmount: 777, pending: true };
      context.set(context.K.finance, fin);
      const out = context.get(context.K.outbox, []);
      if (!out.includes('p-new')) out.push('p-new');
      context.set(context.K.outbox, out);
    },
  });
  assert.equal(got.errors['p-new'], undefined);
  assert.equal(got.finance['p-new'].contractAmount, 777);
  assert.equal(got.finance['p-new'].pending, undefined);
});

test('a non-owner finance row is refused and the amount stays', async () => {
  const got = await run(LIVE(), {
    user: { uid: 'u-site', role: 'site', active: true, displayName: 'موقع' },
    projects: [project('p-site', { createdBy: 'u-site' })],
    finance: { 'p-site': { contractAmount: 10, pending: true } },
    outbox: ['p-site'],
  });
  assert.equal(got.counts.project, 1);
  assert.equal(got.counts.finance, 0);
  assert.equal(got.finance['p-site'].contractAmount, 10);
  assert.equal(got.finance['p-site'].pending, true);
  assert.equal(got.errors['p-site'], 'رُفض الإرسال');
});

test('unavailable keeps the id and does not re-arm by itself', async () => {
  const got = await run(LIVE(), {
    entries: [{
      id: 'e-off', projectId: 'p-ok', direction: 'expense', entryType: 'materials', amount: 5,
      currency: 'IQD', entryDate: '2026-10-30', isReversal: false, createdAtDevice: 1,
      createdBy: 'u-owner', deviceId: 'phone-1',
    }],
    projects: [project('p-ok')],
    outbox: ['e-off'],
    unavailable: true,
  });
  assert.equal(got.counts.rounds, 1);
  assert.deepEqual(got.outbox, ['e-off']);
  assert.equal(got.errors['e-off'], undefined);
});

test('offline does not write', async () => {
  const got = await run(LIVE(), {
    projects: [project('p-school', { isExample: true, deviceId: 'seed' })],
    finance: { 'p-school': { contractAmount: 60000000, pending: true } },
    outbox: ['p-school'],
    offline: true,
  });
  assert.equal(got.counts.writes, 0);
  assert.equal(got.counts.rounds, 0);
  assert.equal(got.finance['p-school'].contractAmount, 60000000);
});

test('20a an amount that changes every round with no save is at most two rounds and four document writes', async () => {
  let n = 0;
  const got = await run(LIVE(), {
    projects: [project('p3')],
    finance: { p3: { contractAmount: 100, pending: true } },
    outbox: ['p3'],
    duringWrite(context, local) {
      n += 1;
      const fin = context.get(context.K.finance, {});
      fin[local.id] = { contractAmount: 100 + n, pending: true };
      context.set(context.K.finance, fin);
    },
  });
  assert.ok(got.counts.rounds <= 2, 'rounds ' + got.counts.rounds);
  assert.ok(got.counts.project <= 2, 'project ' + got.counts.project);
  assert.ok(got.counts.finance <= 2, 'finance ' + got.counts.finance);
});

test('20b a write that keeps failing is at most two rounds and two writes', async () => {
  const got = await run(LIVE(), {
    projects: [project('p2')],
    finance: { p2: { contractAmount: 10, pending: true } },
    outbox: ['p2'],
    fail: true,
  });
  assert.ok(got.counts.rounds <= 2);
  assert.ok(got.counts.writes <= 2);
  assert.equal(got.finance.p2.contractAmount, 10);
  assert.equal(got.finance.p2.pending, true);
});

test('a terms amount the payload rejects stays one round and keeps the subcontract', async () => {
  const sub = { id: 's1', projectId: 'p1', name: 'مقاول', work: '', agreedOn: '2026-01-01', createdBy: 'u-owner' };
  const got = await run(LIVE(), {
    subs: [sub],
    terms: { s1: { originalAmount: 0, pending: true } },
    outbox: ['s1'],
  });
  assert.equal(got.counts.rounds, 1);
  assert.equal(got.subs.length, 1);
  assert.equal(got.subs[0].id, 's1');
  assert.equal(got.terms.s1.originalAmount, 0);
  assert.equal(got.terms.s1.pending, true);
});

test('a missing writeLocal on a non-seed entry is one round and the existing refusal', async () => {
  const entry = {
    id: 'e1', projectId: 'p1', direction: 'expense', entryType: 'materials', amount: 10,
    currency: 'IQD', entryDate: '2026-01-01', description: 'قيد', createdBy: 'u-owner', deviceId: 'phone-1',
  };
  const got = await run(LIVE(), { entries: [entry], outbox: ['e1'], missingWrite: true });
  assert.equal(got.counts.rounds, 1);
  assert.equal(got.entries.length, 1);
  assert.equal(got.errors.e1, 'رُفض الإرسال');
});

test('a save during the re-flush resets the count and sends the new amount', async () => {
  let n = 0;
  const got = await run(LIVE(), {
    projects: [project('p3')],
    finance: { p3: { contractAmount: 100, pending: true } },
    outbox: ['p3'],
    duringWrite(context, local) {
      n += 1;
      const fin = context.get(context.K.finance, {});
      if (n === 1) fin[local.id] = { contractAmount: 200, pending: true };
      if (n === 2) {
        fin[local.id] = { contractAmount: 300, pending: true };
        context.flushRemote({ fromOutside: true });
      }
      context.set(context.K.finance, fin);
    },
  });
  assert.equal(got.finance.p3.contractAmount, 300);
  assert.equal(got.finance.p3.pending, undefined);
  assert.ok(got.counts.rounds >= 3);
  assert.ok(got.counts.rounds <= 4);
});

test('two tabs share the integer and each stays inside the cap', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const opts = {
      projects: [project('p-c', { contractAmount: 10000000001 })],
      finance: { 'p-c': { contractAmount: 10000000001, pending: true } },
      outbox: ['p-c'],
    };
    const a = harness(LIVE(), opts);
    const b = harness(LIVE(), {});
    b.context.cache = a.context.cache;
    await a.context.flushRemote({ fromOutside: true });
    await b.context.flushRemote({ fromOutside: true });
    for (let i = 0; i < 8; i += 1) {
      mock.timers.tick(0);
      await new Promise(resolve => setImmediate(resolve));
    }
    assert.ok(a.counts.project <= 2);
    assert.ok(b.counts.project <= 2);
    assert.equal(a.context.get(a.context.K.finance, {})['p-c'].contractAmount, 10000000001);
    assert.equal(b.context.get(b.context.K.finance, {})['p-c'].contractAmount, 10000000001);
  } finally {
    mock.timers.reset();
  }
});

test('the foremen refresh starts a flush and does not reset the count', () => {
  const src = fs.readFileSync(path.join(ROOT, 'public/foremen.js'), 'utf8');
  const call = src.slice(src.indexOf("action === 'refresh'"), src.indexOf("action === 'refresh'") + 180);
  assert.match(call, /flushRemote\(\)/);
  assert.equal(call.includes('fromOutside'), false);
});

function mutated(kind) {
  let src = LIVE();
  if (kind === 'cap') src = src.replace('if (flushRearm >= 1 || flushTimer) return;', 'if (flushTimer) return;');
  if (kind === 'refusal') src = src.replace('refused.push(id);', 'void id;');
  return src;
}

test('removing only the cap lets a changing amount exceed two rounds', async () => {
  let n = 0;
  const got = await run(mutated('cap'), {
    projects: [project('p3')],
    finance: { p3: { contractAmount: 100, pending: true } },
    outbox: ['p3'],
    duringWrite(context, local) {
      n += 1;
      const fin = context.get(context.K.finance, {});
      fin[local.id] = { contractAmount: 100 + n, pending: true };
      context.set(context.K.finance, fin);
    },
  });
  assert.ok(got.counts.rounds > 2, 'rounds ' + got.counts.rounds);
});

test('removing only the refusal leaves a seed pending without the refusal', async () => {
  const got = await run(mutated('refusal'), {
    projects: [project('p-school', { isExample: true, deviceId: 'seed' })],
    finance: { 'p-school': { contractAmount: 60000000, pending: true } },
    outbox: ['p-school'],
  });
  assert.equal(got.errors['p-school'], undefined);
  assert.equal(got.finance['p-school'].pending, true);
});
