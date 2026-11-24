# Supersede

The owner saves `نسخة جديدة` of one unit measurement that is not approved yet. The new row is `sup_` plus that measurement id, with the new quantity. Its `txnDate` is `YYYY-MM-DD`.

## Sub-features

- `supersede`

## How to get to it (user POV)

Open the agreement on «مقاول», type the new quantity, then save `نسخة جديدة`.

## Driving it with verify-aj

`node scripts/verify-aj.js drive supersede`

Sign in, set the exported `Accounts.CONTRACTOR_COST_START` to a `YYYY-MM-DD` fixture on or before `today()` so «مقاول» opens, save the brick agreement and one measurement, type a new quantity, and save `نسخة جديدة`. One `sup_` row is stored. Restore the export to `null`. The source binding stays `const CONTRACTOR_COST_START = null;`.

## Gotchas

A slot id has no `نسخة جديدة`. A fifth copy is not built. An approved measurement is not copied. Do not leave the fixture in place.
