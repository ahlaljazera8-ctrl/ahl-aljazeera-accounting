# Labor quantity

The owner records one measurement against a labor agreement. Unit and daily bodies use a uuid. Lump and milestone bodies use a slot id.

## Sub-features

- `labor-qty`

## How to get to it (user POV)

Open the agreement on «مقاول» and save «تسجيل عمل منجز».

## Driving it with verify-aj

`node scripts/verify-aj.js drive labor-qty`

The drive saves the brick agreement, then one quantity of 8,000, then restores the export to null.

## Gotchas

The quantity tile on the person page is not this drive. An unknown id still exits 3.
