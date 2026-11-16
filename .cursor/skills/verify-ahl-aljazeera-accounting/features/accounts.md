# Accounts

The owner list of people. It can be empty. Create-person stays hidden until a party route exists, and the demo never shows that button.

## Sub-features

- `accounts-tab`
- `accounts-empty`
- `accounts-create`

## How to get to it (user POV)

Sign in as the owner and open حسابات.

## Driving it with verify-aj

`node scripts/verify-aj.js drive accounts` is recorded here. The demo proof that CI runs is `tests/browser-check.js`. This helper does not launch a second emulator.

## Gotchas

An unknown id still exits 3. Do not claim this drive passed unless the evidence files exist.
