# Review cash

The owner marks the 600,000 `payLabor` from the pay-labor fixture. The row shows `غير مدقّق` before the tap. The saved `revw_` has no amount and no `txnDate`.

## Sub-features

- `review-cash`

## How to get to it (user POV)

On the agreement, the unreviewed payment shows `غير مدقّق`. Tap `تدقيق`.

## Driving it with verify-aj

`node scripts/verify-aj.js drive review-cash`

Start from the pay-labor fixture. The `payLabor` shows `غير مدقّق` before the tap. Tap `تدقيق`. After save, one `revw_` of that cash id has no amount and no `txnDate`. Restore the export to `null`. The source binding stays `null`. Home `إجمالي المصروف` is unchanged.

## Gotchas

The review is the payment, not the advance. Do not assert a new home total while the export is null. Do not leave the fixture in place. The source binding stays null. An unknown id still exits 3.
