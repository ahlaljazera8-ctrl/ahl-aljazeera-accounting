# Foreman balances

العُهد is the owner's list of foremen. From a person the owner can record a new advance, an expense from that advance, a settlement, or a return of what is left. This helper does not drive those buttons.

## Sub-features

- `foremen-tab` shows the «العُهد» tab for an owner.
- `foreman-new` saves a name from `#fm-name`.
- `foreman-advance` records «+ سلفة جديدة».
- `foreman-settle` records «تسديد المستحق». Not driven.

## How to get to it (user POV)

- Sign in as the owner.
- Choose the «العُهد» tab (`a[data-tab="foremen"]`). The tab is added by `syncForemenTab` in `public/render.js`. It is not in the HTML.
- Open a person, then choose «+ سلفة جديدة», «+ مصروف من العهدة», «تسديد المستحق», or «استلام المتبقي».

## Driving it with verify-aj

Preconditions:

- `node scripts/verify-aj.js doctor` passed.
- The signed-in user is an owner. A site user does not get the tab.

- **Command.** `node scripts/verify-aj.js drive foremen` exits 3.
- **Report.** The tab is reachable for an owner. This helper has no drive for it. Do not claim the balances. Do not invent a formula for «المتبقي معه».

## Gotchas

- A site user never sees `a[data-tab="foremen"]`.
- Settlement copy depends on a fresh sync. The sheet can show a warning and «تحديث الآن».
- The on-screen over-settle sentence is «المبلغ أكبر من المستحق. الفرق يظهر كمتبقي معه.» (`public/foremen.js`). It stays a description of the button, not a second rule.
- Ameer declined a product change from that sentence. Do not change the app from this map.
