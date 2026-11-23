# Approve labor

The owner approves one measurement. The stored amount for the brick agreement is 600,000. `txnDate` is the Baghdad date `today()` returns.

## Sub-features

- `approve-labor`

## How to get to it (user POV)

Open the measurement on «مقاول» and save «اعتماد قياس العمل».

## Driving it with verify-aj

`node scripts/verify-aj.js drive approve-labor`

Sign in, set the exported `Accounts.CONTRACTOR_COST_START` to a `YYYY-MM-DD` fixture on or before `today()`, open «مقاول», save the brick agreement, save the measurement, approve it, then restore null. Firestore has one `agreements` row, one `laborQty`, and one `appr_`. That `appr_` has a `YYYY-MM-DD` `txnDate`. The person page shows `عمل معتمد` 600,000. After the export is null, home `إجمالي المصروف` is unchanged. The agreement form says `بسعر الوحدة`.

## Gotchas

The quantity tile is not this drive. Do not assert a new home total while the export is null. Do not leave the fixture in place. The source binding stays null. An unknown id still exits 3.
