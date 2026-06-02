# CLAUDE.md — Zaadi Kitchen Ops Portal

Read this fully at session start. It is the source of truth for conventions. The
phased execution plan and full backend endpoint map live in
@docs/RESTRUCTURE_PLAN.md — read it before starting any phase of the restructure.

## Project
Multi-role **operations portal** for a Saudi meal-subscription kitchen.
- Roles: **Admin + Ops only.** No Rider/Driver — remove any such code on sight.
- Auth: **Admin email + password** (`POST /auth/admin/login`). No OTP / role-selection.
- Bilingual product (en + ar), SAR currency → i18n/RTL is a real requirement.

## Prime directive
**Do not change the look and feel.** This is a working UI prototype; we are
restructuring it, not redesigning it. Rendered output must stay pixel-identical.
If a change would alter the visuals, stop and ask.

## Stack
- React 19 + TypeScript (`strict: true`) + Vite. Function components only.
- Routing: React Router v7.
- Server state: **TanStack Query** (all API data). Never fetch in `useEffect`.
- Client state: **Zustand** (session, ephemeral UI only).
- Forms: **React Hook Form + Zod**. Validation lives in the schema.
- Validation/types: **Zod** at every API boundary; infer TS types from schemas.
- HTTP: single **Axios** instance with token + 401-refresh interceptors.
- Styling: **keep the existing inline-style + CSS-variable system. Do NOT add
  Tailwind/CSS-in-JS.** Use tokens from `shared/styles/tokens.css` — no raw hex/px.
- Charts: Recharts. Tables: TanStack Table. Icons: lucide-react. Dates: date-fns.
- i18n: react-i18next (en/ar). Tests: Vitest + RTL + MSW.
- Do not add any dependency outside this list without proposing it first.

## Golden rules
1. Feature-modular, not type-based. Code lives in `features/<domain>/`, not in
   global `components/`/`utils/` dumps. Only truly shared things go in `shared/`.
2. Server data → TanStack Query, always. Never copy it into Zustand/Context.
3. **One API interface, two sources.** Every feature calls the backend through its
   own `*.api.ts`. Live endpoints hit the API; not-yet-built ones return mock data
   from the same function (mark `// TODO[api]: <endpoint>`). Turning a screen live
   = edit one file, nothing else.
4. Validate API responses with Zod at the edge; the app trusts inferred types.
5. Tokens only — no hardcoded brand hex or px. Values must match current visuals.
6. RBAC at route AND render. `ops → [daily-ops, labels]`, `admin → all`. Ops never
   reaches Dashboard Home; the **issues queue is admin-only and not rendered for Ops**.
7. No business logic in components — it lives in hooks and `api`/`model`.
8. No `any` (strict is on), no `console.log`, no dead/commented code, no cross-feature
   deep imports (go through the feature's `index.ts`).
9. RTL-safe: use logical CSS properties (`ms-/me-/ps-/pe-`, `start/end`), never
   `left/right` for layout. All strings via i18n. Currency via `formatSAR()`.

## Backend (base `/api/v1`, JWT Bearer)
LIVE now → wire to real API: **auth** (`/auth/admin/login`, `/auth/refresh`,
`/auth/admin/logout`), **areas** (`/admin/areas`, `/admin/areas/:id/buildings`),
**menu** (`/admin/menu/weeks?count=2`, slot assign/clear, `/publish`; `/admin/meals`
CRUD + `/status` + `/import`).
MOCK for now (no endpoints yet): **daily-ops, revenue, customers, comms, labels**.
Data facts: meals are `name_en`/`name_ar` + `macros{protein_g,carbs_g,fat_g}`,
`meal_type ∈ {executive, salad}`; areas `status ∈ {active, coming_soon, paused}`;
week ids `w2025-23`, slot ids `slot_w2025-23_sun_exec`.

## Structure
```
src/
  app/        App.tsx, providers/, router/(routes, ProtectedRoute, RoleRoute), layouts/
  features/   auth dashboard daily-ops labels revenue menu customers comms areas
  shared/     ui/  lib/(api/{client,queryKeys}, format/{sar,date})  hooks/  config/(env, roles, permissions)  types/  styles/tokens.css
  store/      useSessionStore.ts  useUiStore.ts
  i18n/       index.ts  locales/{en,ar}
```
Feature anatomy (every `features/<x>/` is the same shape):
`api/(*.api.ts, *.queries.ts) · model/(*.schema.ts) · hooks/ · components/ · pages/ · index.ts`.
Layering (outer imports inner only): `pages → components → hooks → api/queries → model`.

## Conventions
- Files/components PascalCase; hooks `useX.ts`; types PascalCase (no `I` prefix).
- Absolute imports via `@/`. Order: external → `@/shared` → `@/features` → relative.
- Booleans as predicates (`isOpen`, `canEdit`); handlers `handleX`, props `onX`.
- One default export per component; types/consts as named exports.

## Definition of Done (verify before finishing any task)
- [ ] Feature-modular placement; nothing in a global dump.
- [ ] Server data via TanStack Query; no `useEffect` fetching.
- [ ] API responses Zod-parsed; types inferred. Mock features use the same interface.
- [ ] No raw hex/px — tokens only; UI looks unchanged (verify the screen).
- [ ] RBAC enforced at route + render; Ops cannot see the issues queue.
- [ ] Strings via i18n; SAR via `formatSAR`; RTL-safe.
- [ ] No `any`, no `console.log`, no dead code. Lint/typecheck pass.
- [ ] No new dependency added without proposing it first.

<!-- maintainer note: do phases in order from RESTRUCTURE_PLAN.md; one PR per phase; prove the live path on `areas` before `menu`. -->
```
