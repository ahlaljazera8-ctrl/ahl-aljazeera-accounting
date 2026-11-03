# حسابات أهل الجزيرة

Offline-first ledger. Example data stays on this device. Login uses Firebase Email/Password; the outbox is a local queue of ids (no `syncState`) and flushes to Firestore when the connection returns. The ledger is append-only.

```bash
npm test                 # ledger unit tests
npm run test:browser     # headless Chrome; serve public/ on 127.0.0.1:8765 first
npm run test:emulator    # Firestore + Auth emulators, rules and sync (does not deploy)
npm run lint             # ESLint (eslint:recommended)
npm run format:check     # Prettier. public/ and tests/ are excluded; see .prettierignore
npm run typecheck        # tsc --noEmit, allowJs and checkJs
```

`index.html?role=owner` or `?role=site` opens the local demo (no Firebase). A normal visit shows the login screen. `?emulator=1` points that login at the local emulators.

The first `users/{uid}` document is created by an admin (the rules cannot bootstrap the owner). After that, only an owner can write `users/`. The app does not create Auth accounts: an admin adds the email and password in the Firebase console, and the owner pastes that User UID on the الأشخاص screen. Do not commit service-account keys or passwords.

`contractAmount` is not a field of `projects/{id}`. It lives in `projectFinance/{projectId}`, which only an owner can read or write. The owner screen copies a leftover `contractAmount` off the project into that finance document on save, and later project writes omit the field. Rules cannot delete a field while a document is only being read, so a project saved before this split keeps `contractAmount` on `projects/{id}` until the owner opens that project and saves the contract value. Until that save, a site user who can read the project still receives the old field inside the project document. The site screen does not show it and does not query `projectFinance`.

A subcontract is the same kind of split. `subcontracts/{id}` is the name, the work, and the day it was agreed. Anyone assigned to that project can read it. The agreed amount is `subcontractTerms/{id}` (the same id), and a later change is a new `subcontractAmendments/{id}` row. Only the owner can read or create those. A single subcontract, terms row, or amendment cannot be edited or deleted on its own. The owner can permanently delete a whole project from «إدارة المشروع». That delete removes the project, its ledger rows (payments and «مقاول» included), `projectFinance/{projectId}`, and that project's subcontracts, terms, and amendments. It is not a backup, and the app does not keep a copy. «مسدّد بالكامل» is the agreed amount minus the linked «مقاول» payments, including reversals. It is not a stored field. An old «مقاول» row with no `subcontractId` stays unlinked. There is no control that attaches it later. In v1 only the owner records a «مقاول» payment, and the rules reject that type from a site user. The phone database stays `aj-u-<uid>` at version 1. The service worker cache is `aj-p0-v34`.

Security rules: `firestore.rules`. `firebase.json` and `.firebaserc` target project `ahl-aljazeera-accounting`. Rules and Hosting are live there, deployed manually by the maintainer.
