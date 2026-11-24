# Deduct

The owner saves one deduct under a counting approval. The id is `d1` plus the approval id. `cumAmount` equals the amount. The reason is stored as `description`. `txnDate` is `YYYY-MM-DD`.

## Sub-features

- `deduct`

## How to get to it (user POV)

Open the agreement on «مقاول», type the amount and `سبب التصحيح`, then save `حفظ`.

## Driving it with verify-aj

`node scripts/verify-aj.js drive deduct`

Sign in, set the exported `Accounts.CONTRACTOR_COST_START` to a `YYYY-MM-DD` fixture on or before `today()` so «مقاول» opens, save the brick agreement, the measurement, and the approval. Type 50,000 and a reason, then save `حفظ`. One deduct of 50,000 is stored, with `cumAmount` 50,000. Restore the export to `null`. The source binding stays `const CONTRACTOR_COST_START = null;`.

## Gotchas

The amount is an integer. `2,5` is not saved. The reason is mandatory. Do not leave the fixture in place.
