# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Node.js + Express (TypeScript). Source in `backend/src/`, build to `backend/dist/`. Assets like uploads in `backend/uploads/`.
- `frontend/`: React (CRA, TypeScript, Tailwind). App code in `frontend/src/`, static files in `frontend/public/`, E2E specs in `frontend/tests/`.
- `functions/`: Firebase Functions (Node 18). Source in `functions/src/`, compiled to `functions/lib/`.
- Root scripts: deployment and validation helpers (e.g., `deploy.sh`, `pre-deploy-check.sh`, `test-*.js`).

## Build, Test, and Development Commands
- Backend:
  - `cd backend && npm i`
  - `npm run dev` — start API with hot reload.
  - `npm run build && npm start` — compile TypeScript and run from `dist/`.
  - `npm run create-indexes` — create/optimize MongoDB indexes.
- Frontend:
  - `cd frontend && npm i`
  - `npm start` — run CRA dev server.
  - `npm test` — Jest + React Testing Library watcher.
  - `npm run build` — production build to `frontend/build/`.
- Functions:
  - `cd functions && npm i`
  - `npm run build` | `npm run serve` | `npm run deploy`.
- E2E (optional): `cd frontend && npx playwright test` (see `playwright.config.ts`).

## Coding Style & Naming Conventions
- Language: TypeScript across backend, frontend, and functions.
- Indentation: 2 spaces; prefer single quotes; trailing semicolons allowed.
- Naming: React components `PascalCase.tsx`; hooks `useX.ts`; backend files lowercase (`server.ts`, `app.ts`); test specs `*.spec.ts`.
- Linting/formatting: CRA’s ESLint is enabled in `frontend`. Keep code Prettier-compatible even if not enforced.

## Testing Guidelines
- Frontend unit/UI: `npm test` (watch) or `CI=true npm test -- --coverage`.
- E2E: Playwright specs in `frontend/tests/*.spec.ts` via `npx playwright test`.
- Backend: no formal test runner; smoke tests available at repo root (e.g., `node test-api-endpoints.js`). Add new tests near the feature module when possible.

## Commit & Pull Request Guidelines
- Commits: imperative, concise subject; emoji prefixes are common; English or Chinese acceptable; add scope when helpful (e.g., `backend:`/`frontend:`).
- PRs: include purpose, linked issues, screenshots for UI, and rollout notes. Ensure: builds pass, tests green, `.env.example` updated when config changes.

## Security & Configuration Tips
- Do not commit secrets. Copy `backend/.env.example` to `backend/.env`; `frontend/.env.production` for production overrides; set Firebase keys via environment.
- Verify `firebase.json`, rules, and index creation before deploy; run `./pre-deploy-check.sh` when applicable.

