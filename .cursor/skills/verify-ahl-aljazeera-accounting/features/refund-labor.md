# Refund labor

The owner refunds 50,000 of the 600,000 `payLabor` from the pay-labor fixture. The amount is on screen before the Firestore write. The saved `refundLabor` names that payment.

## Sub-features

- `refund-labor`

## How to get to it (user POV)

Open `استرداد نقدي من العامل` on the same agreement, choose the payment, type 50,000, and save.

## Driving it with verify-aj

`node scripts/verify-aj.js drive refund-labor`

Start from the pay-labor fixture, which already holds the 600,000 `payLabor`. Open the refund form. Type 50,000. The preview is on screen before the write. After save, one `refundLabor` of 50,000 names that payment. Restore the export to `null`. The source binding stays `null`. Home `إجمالي المصروف` is unchanged.

## Gotchas

The refund names the payment from this drive. Do not assert a new home total while the export is null. Do not leave the fixture in place. The source binding stays null. An unknown id still exits 3.
