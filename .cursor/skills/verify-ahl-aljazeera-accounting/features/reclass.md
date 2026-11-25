# Reclass

The owner answers one legacy labour row with `انخصم` and another with `ملغى`, then records the advance. `CONTRACTOR_COST_START` stays null. The card is at the end of «حسابات».

## Sub-features

- `reclass`

## How to get to it (user POV)

On «حسابات», the list `قيود مصروف قد تكون سلفاً` sits after the people. `انخصم` writes no money document. `ملغى` asks for `سبب التصحيح`, and `سلفة` asks for the person.

## Driving it with verify-aj

`node scripts/verify-aj.js drive reclass`

Sign in on the local emulator. Save two labour rows on the verify project. Press `انخصم` on the first and `ملغى` plus `حفظ` on the second. Wait until the reversal is accepted, open `سلفة`, pick the person, and save. Read `ledgerEntries`, `accountTxns`, and `laborReviews`. Log out, log in, and check that the `انخصم` row is still marked. The drive picks the rows by id. The source binding stays `const CONTRACTOR_COST_START = null;`.

## Gotchas

The advance stays off until the reversal has a server time. An archived project has no `ملغى` button. Do not deploy.
