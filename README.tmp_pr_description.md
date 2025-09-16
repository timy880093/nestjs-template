This PR consolidates code into libs and removes legacy root `src` application scaffold.

Changes summary:
- Move item model/repository into `libs/postgres/src/ticket` and update references.
- Update `libs/auth` and `libs/payment` modules (controller/module/service and payment config).
- Remove legacy root `src` application files to centralize code under `libs`.
- Update project configs (`package.json`, `tsconfig.json`, `nest-cli.json`, `.gitignore`, `README.md`).

Testing notes:
- Ensure library builds (tsc) and unit tests (if any) pass in CI before deploying.
