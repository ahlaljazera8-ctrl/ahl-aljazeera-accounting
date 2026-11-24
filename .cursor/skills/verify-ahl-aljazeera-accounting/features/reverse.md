# Reverse

The owner ends one counting approval with `عكس`. The first rows are `rev_` of the approval and `rev_` of its measurement. The reason is mandatory. With no payment, one tap stores both.

## Sub-features

- `reverse`

## How to get to it (user POV)

Open the agreement on «مقاول», type `سبب التصحيح`, then save `عكس` on the counting approval.

## Driving it with verify-aj

`node scripts/verify-aj.js drive reverse`

Sign in, set the exported `Accounts.CONTRACTOR_COST_START` to a `YYYY-MM-DD` fixture on or before `today()` so «مقاول» opens, save the brick agreement, the measurement, and the approval. Type a reason and save `عكس`. `rev_` of the approval and `rev_` of the measurement are stored. Restore the export to `null`. The source binding stays `const CONTRACTOR_COST_START = null;`.

## Gotchas

A negative net warns once and stores nothing until the second tap. Cash and deduct reversals are one tap. Do not leave the fixture in place.
