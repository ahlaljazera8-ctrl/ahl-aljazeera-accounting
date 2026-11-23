# Return advance

The owner returns 30,000 of the 100,000 `advanceLabor` from the pay-labor fixture. The amount is on screen before the Firestore write. The saved `returnAdvance` names that advance.

## Sub-features

- `return-advance`

## How to get to it (user POV)

Open `إرجاع سلفة لم تُصرف` on the same agreement, choose the advance, type 30,000, and save.

## Driving it with verify-aj

`node scripts/verify-aj.js drive return-advance`

Start from the pay-labor fixture, which already holds the 100,000 `advanceLabor`. Open the return form on that agreement. Type 30,000. The preview is on screen before the Firestore write. After save, one `returnAdvance` of 30,000 names that advance. Restore the export to `null`. The source binding stays `null`. Home `إجمالي المصروف` is unchanged.

## Gotchas

The return names the advance from this drive. Do not assert a new home total while the export is null. Do not leave the fixture in place. The source binding stays null. An unknown id still exits 3.
