# Reject

The owner saves `رفض السطر` on one measurement that is not approved yet. The new row is `rej_` plus that measurement id. It has no amount and no `txnDate`.

## Sub-features

- `reject`

## How to get to it (user POV)

Open the agreement on «مقاول» and save `رفض السطر` on the measurement that is still open.

## Driving it with verify-aj

`node scripts/verify-aj.js drive reject`

Sign in, set the exported `Accounts.CONTRACTOR_COST_START` to a `YYYY-MM-DD` fixture on or before `today()` so «مقاول» opens, save the brick agreement and one measurement, then save `رفض السطر`. One `rej_` row is stored. Restore the export to `null`. The source binding stays `const CONTRACTOR_COST_START = null;`.

## Gotchas

An approved measurement is not rejected. A row already in `syncErrors` stays off. Do not leave the fixture in place.
