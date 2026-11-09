# Login

Login lets a person open the ledger with an email and password. There is no sign-up on this screen. A successful owner login lands on «الرئيسية» and shows the person's name.

## Sub-features

- `login-empty` keeps an empty submit on the login form and shows a message.
- `login-ok` opens the shell for the seeded owner.
- `login-who` shows `المالك · مالك التحقق` in `#who`.

## How to get to it (user POV)

- Open the site with no `role` query. The form `#login-form` is the first screen.
- Type the email and password, then press «دخول» (`#login-btn`).

## Driving it with verify-aj

Preconditions:

- `node scripts/verify-aj.js doctor` passed.
- The Auth emulator lists `verify.entry@example.invalid`.
- `#shell` is hidden.

- **Submit.** Set `#login-email` and `#login-password`, then click `#login-btn`. This is step 1 of `node scripts/verify-aj.js drive ledger-entry`. `#shell` is shown and `#who` includes `مالك التحقق`.
- **Landing.** `#title` is `الرئيسية`. `#logout` is shown. The demo role control stays hidden because `demoRole` is empty.
- **Proof.** `evidenceDir/ledger-entry/after-login.png` shows the shell, not the login form.

`drive login` is not a separate command. It exits 3. The login steps run inside `drive ledger-entry`.

## Gotchas

- An empty submit stays on the form. The message asks for the email and password.
- A wrong password shows `البريد أو كلمة المرور غير صحيحة` (`loginError` in `public/session.js`).
- A missing `users/{uid}` document does not open the shell.
- `?role=owner` never reaches this form. `seed()` runs instead. That is not a login.
