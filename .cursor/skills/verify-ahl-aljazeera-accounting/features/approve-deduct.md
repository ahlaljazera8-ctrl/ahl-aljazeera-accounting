# Approve deduct

The owner saves `اعتماد الخصم` on one pending deduct. The new row is `appr_` plus the deduct id. It has no amount and no `txnDate`.

## Sub-features

- `approve-deduct`

## How to get to it (user POV)

Open the agreement on «مقاول» and save `اعتماد الخصم` on the deduct that says `بانتظار الاعتماد`.

## Driving it with verify-aj

`node scripts/verify-aj.js drive approve-deduct`

Sign in, set the exported `Accounts.CONTRACTOR_COST_START` to a `YYYY-MM-DD` fixture on or before `today()` so «مقاول» opens, save the brick agreement, the measurement, the approval, and one deduct. Save `اعتماد الخصم`. One `appr_` row is stored and it has no amount. Restore the export to `null`. The source binding stays `const CONTRACTOR_COST_START = null;`.

## Gotchas

A reversed deduct is not approved. `اعتماد الخصم` is not itself reversible. Do not leave the fixture in place.
