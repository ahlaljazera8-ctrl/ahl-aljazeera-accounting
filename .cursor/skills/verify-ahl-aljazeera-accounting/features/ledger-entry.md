# New ledger entry

قيد جديد lets the owner record one expense. The amount is an integer number of IQD. After «حفظ» the row is on the phone immediately, then it is sent to the emulator. The project card and the home summary both show that one amount, and a reload still shows it.

## Sub-features

- `entry-open` shows the form from the «قيد جديد» tab.
- `entry-save-materials` stores one «مواد» row of `1500000`.
- `entry-on-project` shows المصروف `1,500,000`, الربح `−1,500,000`, and المقبوض `0`.
- `entry-on-server` is one `ledgerEntries` document, still one after a reload.

## How to get to it (user POV)

- Choose the «قيد جديد» tab (`a[data-tab="entry"]`).
- Or choose «+ قيد جديد» on «الرئيسية».
- Or choose «+ قيد لهذا المشروع» on a project card.

## Driving it with verify-aj

Preconditions:

- `node scripts/verify-aj.js doctor` passed.
- No `ledgerEntries` document already has description `قيد تحقق مواد`.
- The signed-in user is `مالك التحقق`, and `p-verify` exists.

- **Open the form.** Click `a[data-tab="entry"]`. `#title` is `قيد جديد` and `#amt` is present.
- **Choose type and project.** Click `button[data-type="materials"]`. Wait until `button[data-proj="p-verify"]` exists, then click it. The project arrives from the pull, not from `seed()`.
- **Enter the amount.** Set `#amt` to `1500000` and `#desc` to `قيد تحقق مواد`. Leave `#party` empty and `#foreman` on its blank option. Screenshot `form.png`.
- **Save.** Click `#save` once. `#msg` includes `حُفظ على الهاتف`. Screenshot `saved.png`.
- **Server row.** Exactly one `ledgerEntries` document matches that description. `amount` is `1500000`, `entryType` is `materials`, `direction` is `expense`, `createdByName` is `مالك التحقق`. `firestore.json` is that document.
- **Project card.** Click `a[data-tab="projects"]`, then `a[href="#project/p-verify"]`. `#title` is `مشروع التحقق`. المصروف is `1,500,000 د.ع` and not `3,000,000`. الربح is `−1,500,000 د.ع` (U+2212). المقبوض is `0 د.ع`. The description appears once, with `مواد` and the stored date. Screenshot `project.png`.
- **Home.** Click `a[data-tab="home"]`. إجمالي المقبوض is `0 د.ع`. إجمالي المصروف is `1,500,000 د.ع`. صافي الربح includes `−1,500,000`. `#main` does not contain `قيد تحقق مواد`.
- **Reload.** Reload the page. The shell stays up, `emulator=1` is still the only mode, and home still does not list `قيد تحقق مواد`. Open the project card again. The same amount, `مواد`, and date are still there, still once. Firestore still has one row. Screenshot `project-reload.png`.
- **Command.** `node scripts/verify-aj.js drive ledger-entry` runs the steps above. It writes `network.txt` and exits 1 if a request hostname is a production Auth or Firestore host.

## Gotchas

- The project pill is absent until the pull finishes. Waiting on `#amt` alone is not enough.
- `حُفظ على الهاتف · لم يُرسل بعد` is the local commit. The Firestore document is the send. Both are required.
- Click `#save` once. The button disables for that tap so a double-tap cannot duplicate.
- `1500000` is the typed amount. `1,500,000` is `Ledger.fmt`. The assertion is the formatted text, and the JSON amount is the integer.
- The minus on الربح is U+2212. A hyphen-minus fails the journey.
- This journey does not record «مقاول», a reversal, a contract value, or a CSV.
- If the screen disagrees, stop. Do not change the app to force a pass.
