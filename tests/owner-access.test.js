const test = require('node:test');
const assert = require('node:assert/strict');
const Sync = require('../public/sync.js');

function project(over) {
  return Object.assign({
    id: 'p-school', name: 'مشروع المدرسة', clientName: 'زبون', location: 'مثال', currency: 'IQD',
    status: 'active', contractAmount: 60000000, createdAtDevice: 1, createdBy: 'u-ameer', deviceId: 'seed',
  }, over);
}

test('saving a project copies contractAmount to finance and stops writing it', () => {
  const legacy = project();
  const saved = Sync.splitProjectSave(legacy);
  assert.equal(saved.finance.contractAmount, 60000000);
  assert.equal(Object.prototype.hasOwnProperty.call(saved.project, 'contractAmount'), false);
  assert.equal(saved.project.name, 'مشروع المدرسة');
  assert.equal(saved.project.id, 'p-school');

  const remote = Sync.toRemote(legacy);
  assert.equal(Object.prototype.hasOwnProperty.call(remote, 'contractAmount'), false);
  assert.equal(remote.name, 'مشروع المدرسة');
  const stamped = Sync.withServerTime(saved.project, 'server');
  assert.equal(Object.prototype.hasOwnProperty.call(stamped, 'contractAmount'), false);
  assert.equal(stamped.createdAtServer, 'server');

  const again = Sync.splitProjectSave(saved.project, saved.finance.contractAmount);
  assert.equal(again.finance.contractAmount, 60000000);
  assert.equal(Object.prototype.hasOwnProperty.call(again.project, 'contractAmount'), false);

  const replaced = Sync.splitProjectSave(legacy, 10);
  assert.equal(replaced.finance.contractAmount, 10);
  assert.equal(Object.prototype.hasOwnProperty.call(replaced.project, 'contractAmount'), false);
});

test('a site client keeps the project and drops its money; an owner keeps the field until save', () => {
  const legacy = project();
  const site = Sync.projectsForClient({ uid: 'u-ahmed', role: 'site', active: true }, [legacy]);
  assert.equal(site[0].name, 'مشروع المدرسة');
  assert.equal(Object.prototype.hasOwnProperty.call(site[0], 'contractAmount'), false);
  const owner = Sync.projectsForClient({ uid: 'u-ameer', role: 'owner', active: true }, [legacy]);
  assert.equal(owner[0].contractAmount, 60000000);
  assert.equal(owner[0].name, 'مشروع المدرسة');
});

test('a site client is given no projectFinance read', async () => {
  const site = { uid: 'u-ahmed', role: 'site', active: true, assignedProjectIds: ['p-school'] };
  assert.deepEqual(Sync.financeReads(site, ['p-school']), []);
  assert.deepEqual(Sync.financeReads({ uid: 'u-ameer', role: 'owner', active: false }, ['p-school']), []);
  assert.deepEqual(Sync.financeReads({ uid: 'u-ameer', role: 'owner', active: true }, ['p-school', 'bad id']), [{ collection: 'projectFinance', id: 'p-school' }]);
  const seen = [];
  await Sync.pullChanges({
    user: site,
    watermark: null,
    pendingIds: [],
    localEntries: [],
    localProjects: [],
    read: async spec => { seen.push(spec.collection); return []; },
  });
  assert.equal(seen.includes('projectFinance'), false);
  assert.deepEqual(seen.filter(name => name === 'projects').length, 1);
});

test('a person is assigned exactly the listed projects', () => {
  const input = {
    uid: 'u-ahmed', displayName: 'أحمد', email: 'ahmed@example.invalid', role: 'site', active: true,
    assignedProjectIds: ['p-school', 'p-road'],
  };
  const ok = Sync.personInput(input);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.value.assignedProjectIds, ['p-school', 'p-road']);
  assert.equal(ok.value.role, 'site');
  assert.equal(ok.value.active, true);

  const edited = Sync.personInput(Object.assign({}, input, {
    displayName: 'أحمد الموقع', active: false, role: 'owner', assignedProjectIds: ['p-market'],
  }));
  assert.equal(edited.ok, true);
  assert.deepEqual(edited.value.assignedProjectIds, ['p-market']);
  assert.equal(edited.value.displayName, 'أحمد الموقع');
  assert.equal(edited.value.active, false);
  assert.equal(edited.value.role, 'owner');

  assert.equal(Sync.personInput(Object.assign({}, input, { assignedProjectIds: ['bad id'] })).ok, false);
  assert.equal(Sync.personInput(Object.assign({}, input, { assignedProjectIds: ['p.1'] })).ok, false);
  assert.equal(Sync.personInput(Object.assign({}, input, { uid: 'user id' })).ok, false);
  const many = Array.from({ length: 21 }, (_, i) => 'p' + i);
  assert.equal(Sync.personInput(Object.assign({}, input, { assignedProjectIds: many })).ok, false);
  const twenty = Array.from({ length: 20 }, (_, i) => 'p' + i);
  const capped = Sync.personInput(Object.assign({}, input, { assignedProjectIds: twenty }));
  assert.equal(capped.ok, true);
  assert.equal(capped.value.assignedProjectIds.length, 20);
});
