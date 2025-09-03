# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Node.js + Express (TypeScript). Source in `backend/src/`, compiled to `backend/dist/`. Persistent assets (e.g., uploads) in `backend/uploads/`.
- `frontend/`: React (CRA, TypeScript, Tailwind). App code in `frontend/src/`, static files in `frontend/public/`, E2E specs in `frontend/tests/`. Production build to `frontend/build/`.
- `functions/`: Firebase Functions (Node 18). Source in `functions/src/`, compiled to `functions/lib/`.
- Root: deployment/validation helpers such as `deploy.sh`, `pre-deploy-check.sh`, `test-*.js`.

## Build, Test, and Development Commands
- Backend: `cd backend && npm i`; `npm run dev` (API with hot reload); `npm run build && npm start` (compile and run from `dist/`); `npm run create-indexes` (MongoDB indexes).
- Frontend: `cd frontend && npm i`; `npm start` (CRA dev server); `npm test` (Jest + RTL watcher); `npm run build` (production to `frontend/build/`).
- Functions: `cd functions && npm i`; `npm run build` | `npm run serve` | `npm run deploy`.
- E2E: `cd frontend && npx playwright test` (uses `playwright.config.ts`).

## Coding Style & Naming Conventions
- Language: TypeScript across backend, frontend, and functions.
- Formatting: 2-space indent; prefer single quotes; trailing semicolons allowed. Keep code Prettier-compatible.
- Naming: React components `PascalCase.tsx`; hooks `useX.ts`; backend files lowercase (e.g., `server.ts`, `app.ts`); tests `*.spec.ts`.
- Linting: CRA’s ESLint is enabled in `frontend/`.

## Testing Guidelines
- Frontend unit/UI: `npm test` (watch) or `CI=true npm test -- --coverage` for CI coverage.
- E2E: Playwright specs in `frontend/tests/*.spec.ts` via `npx playwright test`.
- Backend: no formal runner; use root smoke tests (e.g., `node test-api-endpoints.js`). Add new tests near the feature module.

## Commit & Pull Request Guidelines
- Commits: imperative, concise subject; emoji prefixes welcome; English or Chinese; add scope when helpful (e.g., `backend:`, `frontend:`, `functions:`).
- Pull Requests: include purpose, linked issues, and UI screenshots when relevant; add rollout notes. Ensure builds pass, tests are green, and `.env.example` is updated when config changes.

## Security & Configuration Tips
- Never commit secrets. Copy `backend/.env.example` → `backend/.env`. Use `frontend/.env.production` for production overrides; set Firebase keys via environment.
- Before deploy, verify `firebase.json`, security rules, and index creation; run `./pre-deploy-check.sh` when applicable.

## Agent Instructions (.claude)
- Read `CLAUDE.md` (project context) and `./.claude/README.md` before large changes.
- Follow workflows in `./.claude/workflows/` (e.g., `spec-workflow.md`, `bugfix-workflow.md`). Link the chosen workflow and templates in PRs.
- Use templates in `./.claude/templates/` (requirements, design, tasks, test plan) for non-trivial work. Attach the filled docs to the PR.
- Check DoD via `./.claude/checklists/` (frontend, backend, functions, security, performance, accessibility). Include a checked list in the PR description.
- Respect change guards in `./.claude/guards/` (file allowlists). Avoid edits outside the allowed scope unless approved.
- Reference `./.claude/commands/deploy.md` and `./.claude/agents/aliyun-devops-deployer.md` for deployment notes alongside `deploy.sh`.
- Do not commit `./.claude/settings.local.json`. Modify `./.claude/config.json` only with team agreement.
- From `CLAUDE.md`: follow the Pre-flight Checklist and dual-push (GitHub+Gitee) before any deploy; keep the 4-step flow: Modify → Commit → Push → Deploy.
- E2E Playwright MCP rules: prefer `getByTestId`/`getByRole`, avoid `page.evaluate`, and keep outputs short ("OK"/"FAIL").
- Maintain development records in `.logs/dev-notes.md` as described in `CLAUDE.md`.
