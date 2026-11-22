# New agreement

The owner saves one labor agreement from «مقاول». The screen is closed until `Accounts.CONTRACTOR_COST_START` is a date on or before today.

## Sub-features

- `contractor-tab`
- `new-agreement`

## How to get to it (user POV)

Sign in as the owner. After the exported start date is open, choose «مقاول», then «عقد عمل جديد».

## Driving it with verify-aj

`node scripts/verify-aj.js drive new-agreement`

The drive sets the exported start to `today()`, creates the person through the existing حسابات button, saves the brick agreement, then restores the export to null.

## Gotchas

The source binding in `public/accounts.js` stays null. Do not leave the fixture in place. An unknown id still exits 3.
