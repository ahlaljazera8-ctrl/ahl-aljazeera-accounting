# Offline reopen

After a real login, the ledger stays on the phone. Closing the tab and opening the same origin again shows the shell from `aj-u-<uid>` without the login form, including when the network is down.

## Sub-features

- `offline-stay` keeps the shell up with no network.
- `offline-row-still-there` still shows the saved materials row after that reopen.

## How to get to it (user POV)

- Sign in, save a row, then lose the network.
- Close the tab and open the same address again.
- The shell is already there. The row is still on the project.

## Driving it with verify-aj

Preconditions:

- A previous online login has created the phone database `aj-u-<uid>` in this Chrome profile.
- The helper can force `navigator.onLine` to false. It cannot.

- **Command.** `node scripts/verify-aj.js drive offline-reopen` exits 3.
- **Why it fails.** This helper does not toggle the network. The emulator test that does uses python on port `8765`, which skips the hosting Content-Security-Policy. This skill refuses that server.
- **Report.** Unmet precondition: no offline switch. Route attempted: the same `{origin}/index.html?emulator=1` after login. Do not substitute `?role=` and call the reopen verified.

## Gotchas

- A reload while the emulator is still up is what `drive ledger-entry` already does. That is an online reload, not this feature.
- `localSession` in `public/session.js` is what brings the shell back. The journey is not proved until the network is actually off.
