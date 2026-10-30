# حسابات أهل الجزيرة

Offline-first ledger. Example data stays on this device. Login uses Firebase Email/Password; the outbox is a local queue of ids (no `syncState`) and flushes to Firestore when the connection returns. The ledger is append-only.

```bash
npm test                 # ledger unit tests
npm run test:browser     # headless Chrome; serve public/ on 127.0.0.1:8765 first
npm run test:emulator    # Firestore + Auth emulators, rules and sync (does not deploy)
```

`index.html?role=owner` or `?role=site` opens the local demo (no Firebase). A normal visit shows the login screen. `?emulator=1` points that login at the local emulators.

The first `users/{uid}` document is created by an admin (the rules cannot bootstrap the owner). After that, only an owner can write `users/`. Do not commit service-account keys or passwords.

Security rules: `firestore.rules`. `firebase.json` and `.firebaserc` target project `ahl-aljazeera-accounting`. Rules and Hosting are live there, deployed manually by the maintainer.
