// Runs the accounts.js mutants named in the Architect review of PR #81.
// Usage: node scripts/accounts-mutants.js
const fs = require('fs');
const { spawnSync } = require('child_process');

const path = 'public/accounts.js';
const original = fs.readFileSync(path, 'utf8');

/** @type {ReadonlyArray<{ name: string, from: string, to: string }>} */
const mutants = [
  {
    name: 'M2-1 onLine ignores a settle sibling',
    from: "if (doc.purpose === 'settle' && doc.settlesId === lineId) return true;",
    to: "if (false && doc.purpose === 'settle' && doc.settlesId === lineId) return true;",
  },
  {
    name: 'M2-2 approvedDeductSum counts a pending deduct',
    from: 'if (!approved.has(doc.id)) continue;',
    to: 'if (false && !approved.has(doc.id)) continue;',
  },
  {
    name: 'M2-3 a reversed approveDeduct still counts',
    from: 'if (markerId(doc.id) || ctx.reversed.has(doc.id)) continue;\n      approved.add(doc.targetId);',
    to: 'if (markerId(doc.id)) continue;\n      approved.add(doc.targetId);',
  },
  {
    name: 'M2-4 a reversed approveLabor is still found',
    from: "if (!doc || doc.purpose !== 'approveLabor' || doc.id !== deduct.targetId) continue;\n      if (markerId(doc.id) || ctx.reversed.has(doc.id)) continue;",
    to: "if (!doc || doc.purpose !== 'approveLabor' || doc.id !== deduct.targetId) continue;",
  },
  {
    name: 'M2-5 targetError ignores a different target id',
    from: '!named || !target || target.id !== named || target.purpose !== pointedPurpose(action, field)',
    to: '!named || !target || target.purpose !== pointedPurpose(action, field)',
  },
  {
    name: 'M2-6 markerSets ignores rev_',
    from: "if (doc.id.startsWith('rev_')) reversed.add(doc.id.slice(4));",
    to: "if (false && doc.id.startsWith('rev_')) reversed.add(doc.id.slice(4));",
  },
  {
    name: 'M2-7 milestoneMode is not a method field',
    from: "if (hasField(agreement, 'milestoneAmount') || hasField(agreement, 'milestoneMode')) count += 1;",
    to: "if (hasField(agreement, 'milestoneAmount')) count += 1;",
  },
  {
    name: 'M2-8 a capped post accepts amount 0',
    from: "const target = /** @type {AccountDoc} */ (ctx.target);\n    const amount = body.amount;\n    if (typeof amount !== 'number' || !intIn(amount, MAX_AMOUNT) || amount < 1) return { doc: null, errors: ['range'] };",
    to: "const target = /** @type {AccountDoc} */ (ctx.target);\n    const amount = body.amount;\n    if (typeof amount !== 'number' || !intIn(amount, MAX_AMOUNT) || amount < 0) return { doc: null, errors: ['range'] };",
  },
  {
    name: 'M2-9 settle writes targetId',
    from: "if (field === 'settlesId') doc.settlesId = body.settlesId;\n    else doc.targetId = body.targetId;",
    to: 'doc.targetId = body.targetId || body.settlesId;',
  },
  {
    name: 'M2-10 ledger lookup uses targetId only',
    from: 'const key = body.settlesId || body.targetId;',
    to: 'const key = body.targetId;',
  },
  {
    name: 'M2-11 approveDeduct counts the current deduct twice',
    from: "doc.purpose !== 'deduct' || doc.targetId !== lineId || doc.id === currentId",
    to: "doc.purpose !== 'deduct' || doc.targetId !== lineId",
  },
];

/** @type {string[]} */
const lines = [];
let killed = 0;
for (const mutant of mutants) {
  const hits = original.split(mutant.from).length - 1;
  if (hits !== 1) {
    lines.push(mutant.name + '\tskipped\thits=' + hits);
    continue;
  }
  fs.writeFileSync(path, original.replace(mutant.from, mutant.to));
  const run = spawnSync(process.execPath, ['--test', 'tests/accounts.test.js'], { encoding: 'utf8' });
  const status = run.status === 0 ? 'survived' : 'killed';
  if (status === 'killed') killed += 1;
  lines.push(mutant.name + '\t' + status);
}
fs.writeFileSync(path, original);
const summary = killed + ' killed, ' + (mutants.length - killed) + ' survived, ' + mutants.length + ' total';
lines.push(summary);
const out = lines.join('\n') + '\n';
fs.writeFileSync('scripts/accounts-mutants-result.txt', out);
process.stdout.write(out);
if (killed !== mutants.length) process.exitCode = 1;
