# ZaadiKitchen Ops Portal — Handoff Context

Paste this at the start of a new chat to resume work without re-exploring.

---

## What This Is

Multi-role **operations portal** for a Saudi meal-subscription kitchen.
- Roles: **Admin** (full access) and **Ops** (daily-ops + labels only).
- Auth: email + password against a real backend (`POST /auth/admin/login`).
- Bilingual (EN + AR), SAR currency — i18n/RTL is a real requirement (Phase 5).
- **Do not change the look and feel.** Working UI prototype — we restructure, not redesign.

---

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 + TypeScript (`strict: true`) + Vite |
| Routing | React Router v7 |
| Server state | **TanStack Query** (`@tanstack/react-query`) |
| Client state | **Zustand** (session + ephemeral UI) |
| Forms | **React Hook Form + Zod** (Phase 4 — not done yet) |
| HTTP | **Axios** single instance with interceptors |
| Validation | **Zod** at every API boundary |
| Styling | CSS variables + inline styles — **no Tailwind** |
| Icons | lucide-react |

---

## API

- **Base URL:** `https://devapi.zaadikitchen.com/api/v1` (from `.env`)
- **Auth:** JWT Bearer — access token in memory, refresh token in localStorage
- **Response shape:** `{ message: string, data: <payload> }` — unwrapped by `src/shared/types/api.ts#unwrap()`

---

## Folder Structure (current)

```
src/
  app/
    providers/AppProviders.tsx       ← QueryClientProvider
    router/ProtectedRoute.tsx        ← redirects to /login if no session
    router/RoleRoute.tsx             ← redirects wrong role to /ops
  features/
    auth/
      api/auth.api.ts                ← loginApi, logoutApi
      model/auth.schema.ts           ← Zod schemas
    areas/
      api/areas.api.ts + areas.queries.ts
      model/areas.schema.ts
    menu/
      api/menu.api.ts + menu.queries.ts
      model/menu.schema.ts
  shared/
    config/env.ts                    ← VITE_API_BASE_URL
    config/roles.ts                  ← Role = 'admin' | 'ops'
    config/permissions.ts            ← canAccess(role, feature)
    lib/api/client.ts                ← Axios instance + 401-refresh interceptor
    lib/api/queryKeys.ts             ← TanStack Query key factory
    styles/tokens.css                ← single CSS variable file (--brand, --danger, etc.)
    types/api.ts                     ← User schema, ApiError class, unwrap()
  store/
    useSessionStore.ts               ← Zustand: user + refreshToken persisted, accessToken memory-only
  pages/                             ← still flat (Phase 2 restructure not done)
    Login.tsx                        ← LIVE: real auth
    AreaManagement.tsx               ← LIVE: useAreas()
    BuildingManagement.tsx           ← LIVE: useBuildings()
    AddArea.tsx                      ← LIVE: useCreateArea()
    MenuManager.tsx                  ← LIVE: useWeeks(), useMeals(), assign/clear/publish
    AddDish.tsx                      ← LIVE: useCreateMeal()
    DashboardHome.tsx                ← MOCK (static)
    DailyOps.tsx                     ← MOCK (hardcoded data, RBAC render is live)
    RevenueDashboard.tsx             ← MOCK
    CustomerManagement.tsx           ← MOCK
    Comms.tsx                        ← MOCK
    PrintLabels.tsx                  ← MOCK
  layouts/DashboardLayout.tsx        ← reads role from Zustand, no more localStorage
  components/
    Sidebar.tsx                      ← admin-only (rendered by DashboardLayout)
    TopNav.tsx                       ← shows real user initial, click to logout
```

---

## Phase Status

| Phase | Status | What it covers |
|---|---|---|
| 0 — Foundations | ✅ Done | strict TS, @/ alias, token CSS, env config, OTP/Rider removed |
| 1 — Shared UI primitives | ❌ Not started | Extract Button, Modal, TabButton, StatTile, etc. into `shared/ui/` |
| 2 — Feature module restructure | ❌ Not started | Move `pages/*.tsx` → `features/<x>/pages/` |
| 3 — API client + real auth + TanStack Query | ✅ Done | Axios client, Zustand session, ProtectedRoute, RoleRoute, auth/areas/menu live |
| 4 — Forms & validation | ❌ Not started | React Hook Form + Zod on: Login, AddDish, AddArea/Building, Credit Wallet, Broadcast |
| 5 — i18n / RTL + formatters | ❌ Not started | react-i18next, AR strings, formatSAR(), locale-aware date |
| 6 — Quality gates | ❌ Not started | Vitest + RTL + MSW, ESLint token rule, CI |

---

## Key Conventions (enforce these)

1. **Feature-modular:** code in `features/<domain>/` — only truly shared things in `shared/`.
2. **Server data via TanStack Query only** — never `useEffect` fetching.
3. **Zod-parse at API edge** — app trusts inferred TS types inside.
4. **Tokens only** — no raw hex or px in new code. Use `var(--brand)`, `var(--danger)`, spacing/radius tokens from `shared/styles/tokens.css`.
5. **RTL-safe** — logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`), never `left/right` for layout.
6. **RBAC:** Ops → `[/ops, /labels]` only. `RoleRoute allow="admin"` gates everything else. Issues queue is admin-only even within DailyOps.
7. **No `any`**, no `console.log`, no dead code, no cross-feature deep imports (use `index.ts`).
8. **Strings via i18n** (Phase 5), currency via `formatSAR()` (Phase 5).

---

## RBAC Route Layout (App.tsx)

```
/login                     → public
ProtectedRoute
  DashboardLayout
    RoleRoute allow="admin"
      /dashboard, /revenue, /menu, /menu/add
      /customers, /comms
      /areas, /areas/new, /areas/:id/buildings
    /ops                   → admin + ops
    /labels                → admin + ops
```

---

## Session Store Shape

```typescript
// useSessionStore (Zustand + persist)
{
  user: User | null,           // persisted to localStorage
  accessToken: string | null,  // in-memory only (NOT persisted)
  refreshToken: string | null, // persisted to localStorage
  setSession(user, accessToken, refreshToken): void,
  setAccessToken(token): void,
  clearSession(): void,
}
```

---

## What's Next (Phase 4)

Add **React Hook Form + Zod** to these forms (mutations already exist from Phase 3):

| Form | File | Zod rule to enforce |
|---|---|---|
| Login | `pages/Login.tsx` | email + password min(1) |
| Add Dish | `pages/AddDish.tsx` | name_en required, macros numeric |
| Add Area | `pages/AddArea.tsx` | name required |
| Add Building | inline in `BuildingManagement.tsx` | name required |
| Credit Wallet | modal in `DailyOps.tsx` | amount ≤ SAR 30, required |
| Broadcast | `pages/Comms.tsx` | length rule + live count |

Install needed: `npm install react-hook-form`  
(zod is already installed)

---

## Restructuring Plan Reference

Full phased plan lives at `docs/RESTRUCTURE_PLAN.md`.
Backend endpoint map is in the same file under "Backend reality → feature data source".
