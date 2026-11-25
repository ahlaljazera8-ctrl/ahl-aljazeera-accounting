# Settle

The owner saves `تسوية سلفة` against one live advance. The id is `stl_` plus the measurement id plus `_1`. A later generation waits until that row is reversed.

## Sub-features

- `settle`

## How to get to it (user POV)

Open the agreement on «مقاول», save an advance, choose that advance, type the settle amount, and save `حفظ التسوية`.

## Driving it with verify-aj

`node scripts/verify-aj.js drive settle`

Sign in, set the exported `Accounts.CONTRACTOR_COST_START` to a `YYYY-MM-DD` fixture on or before `today()` so «مقاول» opens, save the brick agreement, the measurement, the approval, and one advance. Settle `٤٠٬٠٠٠`. The stored id is `stl_` plus the measurement id plus `_1`, and `settlesId` is that advance. Restore the export to `null`. The source binding stays `const CONTRACTOR_COST_START = null;`.

## Gotchas

The drive picks the advance by its id, never by the amount. On `cap` or `cumulative` the card shows `المُرجَع والتسوية أكبر من السلفة`. Do not leave the fixture in place.
