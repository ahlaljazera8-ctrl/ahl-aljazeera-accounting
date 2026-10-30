# حسابات أهل الجزيرة

Offline-first ledger. Example data stays on this device. Login uses Firebase Email/Password; the outbox is a local queue of ids (no `syncState`) and flushes to Firestore when the connection returns. The ledger is append-only.

```bash
npm test                 # ledger unit tests
npm run test:browser     # headless Chrome; serve public/ on 127.0.0.1:8765 first
npm run test:emulator    # Firestore + Auth emulators, rules and sync (does not deploy)
```

`index.html?role=owner` or `?role=site` opens the local demo (no Firebase). A normal visit shows the login screen. `?emulator=1` points that login at the local emulators.

The first `users/{uid}` document is created by an admin (the rules cannot bootstrap the owner). After that, only an owner can write `users/`. The app does not create Auth accounts: an admin adds the email and password in the Firebase console, and the owner pastes that User UID on the الأشخاص screen. Do not commit service-account keys or passwords.

`contractAmount` is not a field of `projects/{id}`. It lives in `projectFinance/{projectId}`, which only an owner can read or write. The owner screen copies a leftover `contractAmount` off the project into that finance document on save, and later project writes omit the field. Rules cannot delete a field while a document is only being read, so a project saved before this split keeps `contractAmount` on `projects/{id}` until the owner opens that project and saves the contract value. Until that save, a site user who can read the project still receives the old field inside the project document. The site screen does not show it and does not query `projectFinance`.

Security rules: `firestore.rules`. `firebase.json` and `.firebaserc` target project `ahl-aljazeera-accounting`. Rules and Hosting are live there, deployed manually by the maintainer.
