# Projects

المشاريع lists the owner's projects and opens one project. From «إدارة المشروع» the owner can archive a project or delete it permanently. Delete is described here and is not driven by this helper.

## Sub-features

- `projects-list` shows the open projects, including `مشروع التحقق`.
- `project-open` shows that project's المصروف, المقبوض, and الربح.
- `project-manage` opens «إدارة المشروع» (`#manage-project`).
- `project-delete` asks for the project name, then deletes the project and its rows. Not driven.

## How to get to it (user POV)

- Choose the «المشاريع» tab (`a[data-tab="projects"]`).
- Open the project card.
- Choose «إدارة المشروع», then «حذف» (`#choose-delete`), then «نعم» (`#confirm-yes`).
- Type the project name into `#delete-name` and press «حذف نهائياً» (`#confirm-delete`).

## Driving it with verify-aj

Preconditions:

- `node scripts/verify-aj.js doctor` passed.
- `p-verify` exists. Deleting it removes the fixture the entry journey uses, so delete needs a fresh `launch` after that journey.

- **List and open.** `drive ledger-entry` already opens `#project/p-verify` after the save. That is the proved part of this screen.
- **Delete.** `node scripts/verify-aj.js drive project-delete` exits 3. The route that would be driven is `#project/p-verify`, then `#manage-project`, `#choose-delete`, `#confirm-yes`, `#delete-name`, `#confirm-delete`. Report that the command is not implemented. Do not click delete by hand and call it verified.

## Gotchas

- Delete needs a connection. Offline, the screen says the project was not deleted.
- The confirm requires the project name typed exactly.
- The app does not keep a backup. A proved delete must be a separate run.
- The site role has no «إدارة المشروع» control.
