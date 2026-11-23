# Pay labor

The owner types 700,000 on «مقاول» after a 600,000 approval. The preview shows `عن عمل معتمد` 600,000 and `سلفة` 100,000 before the cash write. The save appends one `payLabor` of 600,000 and one `advanceLabor` of 100,000. Each `txnDate` is `YYYY-MM-DD`.

## Sub-features

- `pay-labor`

## How to get to it (user POV)

Open the agreement on «مقاول», type the amount under `تسجيل دفعة`, read `قبل هذه الدفعة`, then save.

## Driving it with verify-aj

`node scripts/verify-aj.js drive pay-labor`

Sign in, set the exported `Accounts.CONTRACTOR_COST_START` to a `YYYY-MM-DD` fixture on or before `today()` so «مقاول» opens, save the brick agreement, the measurement, and the 600,000 approval, then open the payment form on that agreement. Type 700,000. The preview is on screen before the cash Firestore write. After save, one `payLabor` of 600,000 and one `advanceLabor` of 100,000 match the preview, and each `txnDate` is `YYYY-MM-DD`. Restore the export to `null`, then read home. The source binding stays `null`. Home `إجمالي المصروف` is unchanged.

## Gotchas

The preview is the split, not a balance line. Do not assert a new home total while the export is null. Do not leave the fixture in place. The source binding stays null. An unknown id still exits 3.
