# Zaadi Kitchen Ops Portal — Restructuring Plan

> Goal: turn the working **UI prototype** into a structured, API-backed app —
> **without changing the look and feel.** Every phase below leaves the app running
> and visually identical. We refactor structure, not pixels.

**Scope (confirmed):**
- Roles: **Admin + Ops only.** Remove all Rider/Driver code and references.
- Auth: **Admin email + password** (`/auth/admin/login`). Remove OTP / role-selection login.
- Backend exists for *some* features; the rest stay on mocks behind a real interface.

---

## 0. Guiding principles

1. **No visual redesign.** Keep the inline-style + CSS-variable system. We *organize*
   and *tokenize* it; rendered output must match the current screens.
2. **Incremental & always-green.** Each phase is independently shippable. Never a
   "big bang" rewrite.
3. **One interface, two data sources.** Every feature talks to the API through its
   own `*.api.ts`. Live endpoints call the backend; not-yet-built ones return mock
   data from the same function. Turning a screen "live" later = edit one file.
4. **Type the boundary.** Validate API responses with Zod; the app trusts inferred types.

---

## 1. Backend reality → feature data source

From the Postman collection (`base_url = /api/v1`). This decides which screens go
live now vs stay mocked.

| Feature module | Screens (current pages) | Backend status | Endpoints |
|---|---|---|---|
| `auth` | Login | **LIVE** | `POST /auth/admin/login`, `POST /auth/refresh`, `POST /auth/admin/logout` |
| `areas` | AreaManagement, AddArea, BuildingManagement | **LIVE** | `GET/POST /admin/areas`, `POST /admin/areas/:id/buildings`, `GET /delivery/areas/:id/buildings` |
| `menu` | MenuManager, AddDish (Meal Library) | **LIVE** | `GET /admin/menu/weeks?count=2`, `GET/POST/DELETE …/slots/:id`, `POST …/publish`, `GET/POST/PATCH /admin/meals`, `PATCH /admin/meals/:id/status`, `POST /admin/meals/import` |
| `dashboard` | DashboardHome (6-tile) | Derived/static | Sub-labels can derive from other queries; no dedicated endpoint needed yet |
| `daily-ops` | DailyOps (pipeline, breakdown, **issues/credit/reject**) | **MOCK** | none yet → mock adapter |
| `revenue` | RevenueDashboard | **MOCK** | none yet → mock adapter |
| `customers` | CustomerManagement | **MOCK** | none yet → mock adapter |
| `comms` | Comms (automations, broadcast) | **MOCK** | none yet → mock adapter |
| `labels` | PrintLabels (list, sticker) | **MOCK** | none yet → mock adapter |

**Reference facts from the API:** meals are bilingual (`name_en` / `name_ar`) with
`macros {protein_g, carbs_g, fat_g}`, `meal_type ∈ {executive, salad}`, `status` filter;
areas use `status ∈ {active, coming_soon, paused}`; week ids like `w2025-23`, slot ids
like `slot_w2025-23_sun_exec`. Tokens are JWT Bearer; expect a refresh flow.

---

## 2. Target structure (Admin + Ops)

```
src/
├── app/
│   ├── App.tsx
│   ├── providers/AppProviders.tsx       # QueryClient + Router + i18n + ErrorBoundary
│   ├── router/
│   │   ├── routes.tsx                    # route tree, lazy feature imports
│   │   ├── ProtectedRoute.tsx            # auth gate (replaces the useEffect guard)
│   │   └── RoleRoute.tsx                 # admin | ops gate
│   └── layouts/
│       └── DashboardLayout.tsx           # existing layout, role-filtered nav
│
├── features/
│   ├── auth/        # LIVE  — email/password login, token handling
│   ├── dashboard/   # 6-tile home
│   ├── daily-ops/   # MOCK  — pipeline, breakdown, issues/credit/reject (admin-only)
│   ├── labels/      # MOCK
│   ├── revenue/     # MOCK
│   ├── menu/        # LIVE  — week planner + meals/library + XLSX import
│   ├── customers/   # MOCK
│   ├── comms/       # MOCK
│   └── areas/       # LIVE  — areas + buildings
│
├── shared/
│   ├── ui/          # Button, Card, Pill, Modal, TabButton, StatTile, DataTable,
│   │                # Toggle, PipelineStages, RoleBadge — pixel-identical extractions
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts                 # axios instance + interceptors + refresh
│   │   │   └── queryKeys.ts              # query-key factory
│   │   └── format/
│   │       ├── sar.ts                    # Intl SAR formatter
│   │       └── date.ts                   # locale-aware date formatter
│   ├── hooks/                            # useDisclosure, useDebounce…
│   ├── config/
│   │   ├── env.ts                        # VITE_API_BASE_URL etc.
│   │   ├── roles.ts                      # Role = 'admin' | 'ops'
│   │   └── permissions.ts                # role → allowed feature keys
│   ├── types/                            # ApiError, Paginated<T>
│   └── styles/tokens.css                 # the ONE token file (from index.css)
│
├── store/
│   ├── useSessionStore.ts                # role, user, tokens (Zustand)
│   └── useUiStore.ts                     # sidebar/modal ephemeral UI
├── i18n/{index.ts, locales/{en,ar}}
└── main.tsx
```

Each `features/<x>/` follows the same anatomy:
`api/ (*.api.ts, *.queries.ts) · model/ (*.schema.ts) · hooks/ · components/ · pages/ · index.ts`.

---

## 3. Phased execution

Each phase lists **exit criteria**. Do not start the next phase until the current
one is green and the UI is unchanged.

### Phase 0 — Foundations & cleanup *(UI impact: none)*
- Enable `tsconfig` **`strict: true`** (fix fallout incrementally — see Phase notes).
- Add Vite **`@/` path alias**; add **Prettier** + format-on-commit.
- Delete dead scaffold: `App.css`, `assets/react.svg`, `assets/vite.svg`; fix the
  `index.html` title (`"frontentvibe"` → "Zaadi Kitchen Ops").
- **Remove Rider** and **OTP/role-selection** code paths entirely.
- Add `shared/config/env.ts` reading `VITE_API_BASE_URL`.
- **Token cleanup in `tokens.css`** (the highest-leverage non-visual fix):
  - Introduce `--brand:#E4281D` / `--brand-dark:#B52016`; reserve `--danger:#DC2626`
    for errors only. Resolve the `--err`-used-as-brand conflict — every inline red
    becomes `--brand` *unless* it's a true error state.
  - Add the **missing scale tokens** (spacing, radius, type scale) using the values
    already in use, so nothing shifts visually but future code stops hardcoding px.
- **Exit:** app builds with `strict: true`, no Rider/OTP code, one token file, no dead assets, identical UI.

### Phase 1 — Shared UI primitives *(UI impact: pixel-identical)*
- Extract the repeated inline-styled sub-components into `shared/ui`, copying the
  **exact** styles: `Button` (red/black/ghost/danger/success/sm), `Pill`, `Card`,
  `Modal`/`Sheet` (from `DailyOps`'s `ModalOverlay`), `TabButton` (dedupe the two
  copies in `MenuManager` + `Comms`), `StatTile`, `DataTable`, `Toggle`,
  `PipelineStages`, `RoleBadge`.
- Replace the duplicated `@keyframes pulse` `<style>` injections with one shared place.
- **Exit:** the two 300-line pages shrink, zero duplicated sub-components, screens render the same.

### Phase 2 — Feature module restructure *(UI impact: none)*
- Move each `pages/*.tsx` into `features/<domain>/pages/`, splitting out page-local
  components into the feature's `components/`. Convert imports to `@/`.
- Group: AreaManagement+AddArea+BuildingManagement → `areas`; MenuManager+AddDish →
  `menu`; DailyOps → `daily-ops`; etc.
- Each feature gets `routes.tsx`; `app/router/routes.tsx` lazy-imports them.
- Keep `MOCK_*` data for now — just relocate it into each feature's `api/*.api.ts`
  as the temporary return value (this is the seam for Phase 3).
- **Exit:** feature-modular tree, lazy routes, app behaves identically.

### Phase 3 — API client + real auth + React Query *(the core value)*
- Add **axios** client (`shared/lib/api/client.ts`): base URL from env, attach
  `Authorization: Bearer <accessToken>`, **401 → refresh → retry once**, normalize
  errors to typed `ApiError`.
- **Session store** (`useSessionStore`): holds `user`, `role` (`admin`|`ops`),
  `accessToken` (in memory) + `refreshToken` (persisted so reload keeps session;
  switch to httpOnly cookie if backend later supports it).
- Replace the `localStorage('userRole')` `useEffect` guard with **`<ProtectedRoute>`**
  (redirects to `/login` when unauthenticated, no flicker) and **`<RoleRoute allow>`**.
  `permissions.ts`: `ops → ['daily-ops','labels']`, `admin → all`. Sidebar reads the
  same map. Ops still never reaches Dashboard Home; **issues queue stays admin-only**.
- Wire **TanStack Query**; add `queryKeys` factory.
- Turn the **LIVE** features on (`auth`, `areas`, `menu`): real login (email+password),
  areas/buildings CRUD, week planner (assign/clear/publish), meals CRUD + status +
  XLSX import. Add **Zod schemas** for these responses (meals incl. `name_en/name_ar`,
  `macros`, `meal_type`; areas incl. `status`; weeks/slots).
- **MOCK** features keep the same query hooks but their `*.api.ts` returns mock data —
  add a `// TODO[api]: swap to <endpoint> when backend ships` marker on each.
- Add loading/empty/error states (the prototype has none) using shared UI.
- **Exit:** login works against the backend; areas + menu are live & cached; mocked
  features run through the identical Query interface; refresh-on-401 verified.

### Phase 4 — Forms & validation *(UI impact: none — same fields)*
- Add **React Hook Form + Zod** to: **Login** (email/password), **AddDish** (currently
  fully uncontrolled — captures nothing; this is a real bug to fix), **AddArea/Building**,
  **Credit Wallet** (enforce **≤ SAR 30** in the schema; disable Confirm until valid),
  **Broadcast** (length rule + live count). Wire submits to the Phase-3 mutations.
- **Exit:** every form is controlled, schema-validated, and persists/sends real data.

### Phase 5 — i18n / RTL + formatters *(UI impact: none in EN)*
- Add **react-i18next** (`en` + `ar`); move hardcoded strings to namespaces per feature.
- Drive `dir`/font from locale (Montserrat for EN, Tajawal for AR) at the layout root,
  using logical CSS properties where layout flips.
- **`formatSAR()`** (replace string-concatenated `'SAR ' + x`) and a locale-aware date
  formatter (replace hardcoded `en-US`). Render `name_en`/`name_ar` by active locale.
- **Exit:** EN renders identically; switching to AR flips direction and shows Arabic
  copy/numerals; currency + dates go through the formatters everywhere.

### Phase 6 — Quality gates
- **Vitest + RTL + MSW**: smoke test per feature page (renders from mocked API) + the
  RBAC difference (Ops cannot see issues queue) + Credit ≤30 validation.
- ESLint rule to flag raw hex / off-token colors; remaining `any` removed (strict was
  on since Phase 0, but sub-component prop `any`s get proper types here).
- Optional: husky + lint-staged, CI running typecheck + lint + test + build.
- **Exit:** `typecheck`, `lint`, `test`, `build` all green in CI.

---

## 4. Direct fixes folded into the phases (from the audit)

| Audit finding | Where it's fixed |
|---|---|
| No API layer; `MOCK_*` everywhere | Phase 2 (relocate) → Phase 3 (real client + Query) |
| Fake auth (`localStorage` role), bypassable guard | Phase 3 (`ProtectedRoute` + session store + real login) |
| `strict:false`, 12+ `any` | Phase 0 (strict on) + Phase 6 (prop types) |
| Styling chaos: inline hex vs tokens, dual reds | Phase 0 (token cleanup) + Phase 1 (primitives) |
| 300-line files (`DailyOps`, `MenuManager`) | Phase 1 + Phase 2 (extract + relocate) |
| No custom hooks | Phase 2/3 (`useAuth`, feature hooks) |
| Duplicated `TabButton`/`ModalOverlay`/keyframes | Phase 1 |
| `AddDish` uncontrolled (no data captured) | Phase 4 |
| No i18n/RTL, `'SAR '+x`, hardcoded `en-US` | Phase 5 |
| No tests/CI/Prettier | Phase 0 (Prettier) + Phase 6 |
| Stale Vite scaffold, `"frontentvibe"` title | Phase 0 |
| Rider role half-present | Phase 0 (removed) |
| `getStatusColor` returns same color for all area statuses | Phase 1 (use status→token map in shared Pill) |

---

## 5. What does NOT change
- The visual design: colors, spacing, typography, layout, dark chrome, animations.
- The screen inventory and flows (minus Rider).
- The styling *technology* (CSS variables + inline/utility styles) — we discipline it,
  we don't replace it with Tailwind/CSS-in-JS.

---

## 6. Suggested order for the agent
Do phases strictly in order. Within a phase, do one feature at a time, verify the
screen looks unchanged, commit, move on. Start with **Phase 0**, then prove the live
path end-to-end on **one** feature in Phase 3 (`areas` is the smallest) before
converting `menu`. Mocked features are converted to live later, individually, with no
structural change — just swapping the body of their `*.api.ts`.
