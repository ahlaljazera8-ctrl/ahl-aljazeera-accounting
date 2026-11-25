# Statement approval

The owner issues `إصدار كشف حساب` for one closed week. The button is absent while the week is still open. The card shows the figures that will be issued.

## Sub-features

- `statement-approval`

## How to get to it (user POV)

On «حسابات», type a date in a week that has already ended, then open the agreement on «مقاول» and save `إصدار كشف حساب`.

## Driving it with verify-aj

`node scripts/verify-aj.js drive statement-approval`

Sign in, set the exported `Accounts.CONTRACTOR_COST_START` so «مقاول» opens, and save the brick agreement with one approval. The current week has no `إصدار كشف حساب` button. A closed week shows the figures, including `رصيد أول المدة`, and one tap stores one `statementApprovals` row. Restore the export to `null`. The source binding stays `const CONTRACTOR_COST_START = null;`.

## Gotchas

Issuing an open week is refused. The drive does not build an orphan settle: one device cannot reverse an advance that still has a live settle. Do not leave the fixture in place.
