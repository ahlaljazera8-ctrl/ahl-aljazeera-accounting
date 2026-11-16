# Account

The read-only person page: four tabs, three movement filters, and the live statement. There is no currency control.

## Sub-features

- `account-tabs`
- `account-filters`
- `account-statement`

## How to get to it (user POV)

From حسابات, open a person's name.

## Driving it with verify-aj

`node scripts/verify-aj.js drive account` continues after `drive accounts` once a party exists. CI does not run that drive. The brick numbers stay in the unit fixtures.

## Gotchas

Agreements and movements are later lanes. An empty person page is the v1 proof.
