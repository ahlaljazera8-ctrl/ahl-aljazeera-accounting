# Advance labor

The same 700,000 tap as pay labor. The preview shows `سلفة` 100,000 before the write. The save appends one `advanceLabor` of 100,000. That document's `txnDate` is `YYYY-MM-DD`. The tap does not write a second advance.

## Sub-features

- `advance-labor`

## How to get to it (user POV)

Open the agreement on «مقاول» and save the same payment. The rest above approved work is `سلفة`.

## Driving it with verify-aj

`node scripts/verify-aj.js drive advance-labor`

Sign in, set the same fixture, and use the same 700,000 tap as `pay-labor`. Assert the `advanceLabor` of 100,000, the preview `سلفة` 100,000 before the write, and that document's `txnDate`. It does not write a second advance. Restore the export to `null`. The source binding stays `null`. Home `إجمالي المصروف` is unchanged.

## Gotchas

This drive does not type a second amount. Do not assert a new home total while the export is null. Do not leave the fixture in place. The source binding stays null. An unknown id still exits 3.
