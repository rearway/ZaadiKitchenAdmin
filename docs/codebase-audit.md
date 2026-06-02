# Zaadi Kitchen Ops Portal — Frontend Code Audit

**Date:** 2026-06-02 · **Auditor:** read-only, no changes made

---

## 1. TECH STACK

| Library | Version | Role | Notes |
|---|---|---|---|
| react | 19.2.5 | UI framework | Current |
| react-dom | 19.2.5 | DOM renderer | Current |
| react-router-dom | 7.14.2 | Client routing | v7; using classic `BrowserRouter` API, not the new Data Router API |
| lucide-react | ^1.11.0 | Icon set | Used in Sidebar only |
| vite | ^8.0.10 | Build/dev server | Current; **no path aliases configured** |
| typescript | ~6.0.2 | Type checking | Current for 2026; no `strict: true` set |
| eslint | ^10.2.1 | Linting | Configured; no Prettier |
| eslint-plugin-react-hooks | ^7.1.1 | Hook rules | Active |
| @vitejs/plugin-react | ^6.0.1 | Vite React transform | Current |

**NOT FOUND:** Tailwind, CSS Modules, styled-components, React Query / SWR, Zustand / Redux, React Hook Form / Formik, Zod, Vitest / Jest, i18n library, Axios, Husky, Prettier.

**Notable:** `App.css` is the unmodified Vite template scaffold CSS (`.counter`, `.hero`, `#next-steps`, etc.) — entirely unused by application code but never deleted.

---

## 2. ARCHITECTURE / FOLDER STRUCTURE

**Organising principle:** type-based (pages / components / layouts / assets). Flat. No feature folders.

```
src/
├── App.css               ← Vite boilerplate, unused
├── App.tsx               ← Router root
├── index.css             ← Global tokens + utility classes
├── main.tsx              ← Entry point
├── assets/
│   ├── hero.png
│   ├── react.svg
│   └── vite.svg          ← Vite defaults, unused
├── components/
│   ├── Sidebar.tsx
│   └── TopNav.tsx
├── layouts/
│   └── DashboardLayout.tsx
└── pages/
    ├── AddArea.tsx
    ├── AddDish.tsx
    ├── AreaManagement.tsx
    ├── BuildingManagement.tsx
    ├── Comms.tsx
    ├── CustomerManagement.tsx
    ├── DailyOps.tsx
    ├── DashboardHome.tsx
    ├── Login.tsx
    ├── MenuManager.tsx
    ├── PrintLabels.tsx
    └── RevenueDashboard.tsx
```

**Inconsistencies:**
- `components/` has only two files; every other reusable sub-component (modals, stat boxes, tab buttons, toggle switches) lives at the bottom of the page file that uses it.
- No `hooks/`, `services/`, `types/`, or `utils/` directories exist. No API layer directory at all.
- `src/assets/` still contains `react.svg` and `vite.svg` from Vite scaffold.

---

## 3. STATE MANAGEMENT

**Server/remote data:** NOT FOUND. There are no HTTP calls anywhere. All data is hardcoded as `MOCK_*` constants at the top of each page file:

```ts
// src/pages/CustomerManagement.tsx:17
const MOCK_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Ahmad Alsaud', ... },
  ...
];
```

**UI/local state:** `useState` only, scoped per component. No global store.

**Auth state:** Written to and read from `localStorage` directly:

```ts
// src/layouts/DashboardLayout.tsx:11
useEffect(() => {
  const savedRole = localStorage.getItem('userRole');
  if (!savedRole) { navigate('/login'); }
  else { setRole(savedRole); ... }
}, [navigate, location.pathname]);
```

Role is then threaded to child routes via React Router's `useOutletContext`:

```ts
// src/pages/DailyOps.tsx:18
const { role } = useOutletContext<{ role: string }>();
```

There is no Context API provider, no global state library, and no query/cache layer.

---

## 4. DATA / API LAYER

**NOT FOUND.** Zero HTTP calls in the entire `src/` tree. No `fetch`, `axios`, or query library present or configured. Every page works off hardcoded `MOCK_*` arrays.

There are no API service files, no query keys, no caching pattern, no response type validation (no Zod), and no error/loading states anywhere. The project is entirely a static UI prototype at this point.

---

## 5. STYLING

**Approach:** Inline `style={...}` props for ~95% of styling. A small set of utility classes is defined in `index.css` (`.btn-primary`, `.btn-ghost`, `.btn-disabled`) and consumed via `className`. There are no CSS Modules, no Tailwind, and no styled-components.

**Design tokens defined** in `src/index.css`:

```css
:root {
  --red:   #E4281D;   --redd:  #B52016;
  --redm:  rgba(228,40,29,.15);  --redl:  rgba(228,40,29,.07);
  --blk:   #000000;   --blk2:  #111111;   --blk3:  #1A1A1A;
  --mid:   #6B7280;   --soft:  #9CA3AF;
  --border:#E5E7EB;   --bg:    #F9FAFB;   --white: #ffffff;
  --ops:   #374151;   --opsl:  rgba(55,65,81,.08);
  --grn:   #16A34A;   --grnl:  #DCFCE7;
  --err:   #DC2626;   --errl:  #FEF2F2;
}
```

**Token usage is inconsistent.** The same surface is addressed by both tokens and raw hex literals in the same codebase:

| Surface | Token | Raw literals found inline |
|---|---|---|
| Dark background | `--blk3` | `#1A1A1A`, `#222`, `#222222`, `#111` |
| Red brand accent | `--err` / `--red` | `rgba(228,40,29,.10)`, `#E4281D`, `rgba(239,68,68,...)` |
| Muted text | `--soft` | `#9CA3AF`, `#D1D5DB`, `#6B7280`, `#E5E7EB` |
| Border | `--border` | `#333`, `#333333`, `#444`, `#374151` |

**Naming conflict:** `--err` (#DC2626) is the primary red brand accent *and* named "error". This conflates brand identity with error semantics. `--red` (#E4281D) is a slightly different red that is rarely used. In practice `rgba(228,40,29,...)` (= `--red`) appears in inline styles alongside `var(--err)` (= #DC2626), creating two similar-but-different reds on the same screen with no semantic distinction (`DashboardHome.tsx:128`, `DailyOps.tsx:151`).

**Typography:** Single font (Montserrat via Google Fonts) set on `body`. All sizes are hardcoded inline (`fontSize: '32px'`, `fontSize: '14px'`, etc.) — no type scale tokens.

**Responsive design:** NOT FOUND. `App.css` contains a single `@media (max-width: 1024px)` block, but that is dead Vite template code. No media queries exist in any application file. No breakpoint tokens.

---

## 6. ROUTING & RBAC

**Routing library:** React Router v7, classic `BrowserRouter` + `Routes` + `Route`. Defined entirely in `src/App.tsx`:

```tsx
// src/App.tsx:21
<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<DashboardLayout />}>
      <Route path="/dashboard" element={<DashboardHome />} />
      <Route path="/ops"       element={<DailyOps />} />
      <Route path="/labels"    element={<PrintLabels />} />
      <Route path="/revenue"   element={<RevenueDashboard />} />
      <Route path="/menu"      element={<MenuManager />} />
      <Route path="/menu/add"  element={<AddDish />} />
      <Route path="/customers" element={<CustomerManagement />} />
      <Route path="/comms"     element={<Comms />} />
      <Route path="/areas"     element={<AreaManagement />} />
      <Route path="/areas/new" element={<AddArea />} />
      <Route path="/areas/:areaId/buildings" element={<BuildingManagement />} />
    </Route>
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
</BrowserRouter>
```

**RBAC — how it actually works:**

Auth guard is a `useEffect` in `DashboardLayout`, not a route wrapper:

```ts
// src/layouts/DashboardLayout.tsx:11–22
useEffect(() => {
  const savedRole = localStorage.getItem('userRole');
  if (!savedRole) {
    navigate('/login');
  } else {
    setRole(savedRole);
    if (savedRole === 'Ops' && location.pathname !== '/ops' && location.pathname !== '/labels') {
      navigate('/ops');
    }
  }
}, [navigate, location.pathname]);
```

Then rendering is conditionally gated at the layout level (`Sidebar` only for Admin) and inside individual pages with `role === 'Admin'` checks on buttons:

```tsx
// src/pages/DailyOps.tsx:131
{role === 'Admin' ? (
  <>
    <button>💳 Credit Wallet</button>
    <button>↑ Escalate</button>
    <button>✕ Reject</button>
  </>
) : (
  <button>↑ Escalate</button>
)}
```

**Gaps:** No actual authentication — login calls `localStorage.setItem('userRole', selectedRole)` and any email+password is accepted. Role is not validated server-side. No session token. No protected route component abstraction; RBAC logic is distributed across `DashboardLayout`, `Sidebar`, and individual pages. The third role mentioned in context (Rider) does **NOT** exist anywhere in the codebase.

---

## 7. FORMS & VALIDATION

**Form library:** NOT FOUND.

Forms use uncontrolled or partially-controlled `useState` patterns:

- **Login** (`src/pages/Login.tsx:12`): `useState` for email/password, native HTML `required` attribute only. Any non-empty string passes.
- **AddDish** (`src/pages/AddDish.tsx`): All `<input>` and `<textarea>` elements are **fully uncontrolled** — no `value` prop, no `useState`, no `onChange`. The "Add to Library" button calls `navigate('/menu')` — no data is collected.
- **CreditModal** (`src/pages/DailyOps.tsx:234`): Single manual validation: `numAmount > 30` triggers a red message. No schema.
- **Broadcast textarea** (`src/pages/Comms.tsx:108`): Character count check only.

There is no Zod schema, no React Hook Form, no Formik, and no field-level error message infrastructure.

---

## 8. I18N / RTL

**I18n library:** NOT FOUND.

All UI strings are hardcoded English. The app is a Saudi operations portal (Riyadh-specific mock data: "Ahmad Alsaud", "KAFD Area 4", "SAR"), but there is no Arabic language support and no RTL handling:

- `index.html` declares `lang="en"` with no `dir` attribute.
- No `dir="rtl"` anywhere in JSX.
- No logical CSS properties (`margin-inline-start`, etc.).

Currency is string-concatenated directly: `'SAR 54,200'` (hardcoded in `RevenueDashboard.tsx:24`), `'SAR ' + amount` in `DailyOps.tsx:247`. No `Intl.NumberFormat` or central formatter.

Date formatting uses `toLocaleDateString('en-US', ...)` — locale is hardcoded to `en-US`.

---

## 9. TYPESCRIPT

**Strictness:** `"strict": true` is **NOT** set. Active compiler checks are:

```json
"noUnusedLocals": true,
"noUnusedParameters": true,
"noFallthroughCasesInSwitch": true,
"erasableSyntaxOnly": true
```

`strictNullChecks`, `strictFunctionTypes`, `noImplicitAny`, etc. are all **off**.

**`any` usage — exhaustive list:**

| File | Line | Use |
|---|---|---|
| `src/pages/DailyOps.tsx` | 234, 281, 324 | CreditModal, RejectModal, ModalOverlay props |
| `src/pages/MenuManager.tsx` | 192, 205, 210 | TabButton, AssignDishModal props, reduce accumulator |
| `src/pages/CustomerManagement.tsx` | 160 | InfoCard props |
| `src/pages/RevenueDashboard.tsx` | 103, 118, 139 | StatTile, BarChartCol, HorizontalBar props |
| `src/pages/PrintLabels.tsx` | 13, 107 | `useState<any>`, LabelPreviewModal props |

**Typed correctly:** top-level page props and page-scoped domain types (`Dish`, `Customer`, `Area`, `Issue`) are properly typed. `TopNav` props are typed as `{ role: string }`.

---

## 10. NAMING & FILE CONVENTIONS

| Aspect | Convention observed |
|---|---|
| Component files | PascalCase (`DashboardHome.tsx`, `AddDish.tsx`) — consistent |
| Component functions | PascalCase default exports — consistent |
| Sub-components | PascalCase named functions at bottom of owning file — never shared |
| Import style | Relative paths only (`../components/Sidebar`) — no `@/` alias configured |
| Export style | `export default function` — consistent |
| Hooks | NOT FOUND — no `use*.ts` files |
| Types | Inline `type X = { ... }` inside each file — not centralized |

No `@` path alias is configured in `vite.config.ts`. No barrel `index.ts` files.

---

## 11. COMPONENT PATTERNS

All components are functional. No class components.

**Logic vs presentation split:** None. Business logic, mock data, form state, navigation, and modal state all live inside the same component function that also renders the view.

**No custom hooks.** The `useEffect` auth check in `DashboardLayout` and the `useOutletContext` role read in `DailyOps` are the only non-trivial stateful patterns — neither is extracted.

**Sub-component duplication:** `TabButton` is defined independently in both `MenuManager.tsx` (L192) and `Comms.tsx` (L141) with identical code. `ModalOverlay` lives only in `DailyOps.tsx` despite multiple pages using bottom-sheet modals.

**Inline `<style>` injection:** `DashboardHome.tsx` and `DailyOps.tsx` each inject a `<style>` tag with a `@keyframes pulse` animation directly into JSX — the same keyframe definition, duplicated.

**File sizes** (CLAUDE.md mandates ~150 lines):

| File | Lines |
|---|---|
| `src/pages/DailyOps.tsx` | 334 |
| `src/pages/MenuManager.tsx` | 279 |
| `src/pages/PrintLabels.tsx` | 171 |
| `src/pages/CustomerManagement.tsx` | 169 |
| `src/pages/RevenueDashboard.tsx` | 153 |

**Logic bug observed (not fixed):** `getStatusColor` in `AreaManagement.tsx` (L29–34) returns `'var(--err)'` for all three cases (`Active`, `Coming Soon`, `Paused`) — color differentiation is not implemented.

---

## 12. TESTING & TOOLING

| Tool | Status |
|---|---|
| Test framework | NOT FOUND — no Vitest, Jest, or Testing Library |
| Test files in `src/` | NOT FOUND |
| Test coverage | NOT FOUND |
| Prettier | NOT FOUND — no config file |
| ESLint | Configured (`eslint.config.js`, flat config v10) — `@eslint/js`, `typescript-eslint`, react-hooks, react-refresh |
| CI (GitHub Actions / etc.) | NOT FOUND |
| Husky / lint-staged | NOT FOUND |
| Build script | `tsc -b && vite build` |
| Package lock | `package-lock.json` present (npm) |

---

## 13. TOP INCONSISTENCIES & GAPS (ranked by impact)

1. **No API layer** — every page uses hardcoded `MOCK_*` arrays. Before real data can flow, a complete service/fetch layer must be introduced from scratch.
2. **No auth** — login is `localStorage.setItem('userRole', selectedRole)` with no credential validation. The RBAC guard is a `useEffect`, not a protected route wrapper, and can be bypassed by direct URL navigation before the effect fires (the `if (!role) return null` flicker window).
3. **`strict: true` off + pervasive `any`** — 12+ `any` usages in sub-component props. Enabling strict mode will surface null-safety issues at integration time.
4. **Styling chaos** — inline styles with hardcoded hex strings coexist with CSS variables. The same color appears as `var(--err)`, `#E4281D`, `rgba(228,40,29,.10)`, and `rgba(239,68,68,...)` across different files. No single source of truth for spacing, radius, or type scale.
5. **Files exceeding size limit** — `DailyOps.tsx` (334 lines) and `MenuManager.tsx` (279 lines) already violate the CLAUDE.md 150-line guideline; adding real data logic will make this significantly worse.
6. **No custom hooks** — all state and side-effects embedded in components. Auth logic, role checks, and any future data-fetching should each be a hook.
7. **Sub-component duplication** — `TabButton` copy-pasted across two files. `ModalOverlay` not promoted to shared component despite multiple pages using the same pattern.
8. **No validation on forms** — `AddDish` is entirely uncontrolled; no data is ever captured. Login accepts any non-empty string.
9. **No I18n / RTL foundation** — Saudi-market product with no `dir`, no `Intl`, no Arabic strings, dates/currency not formatted centrally.
10. **No tests, no CI, no Prettier** — zero enforcement of code quality beyond ESLint at editor time.
11. **Stale scaffold files** — `App.css`, `assets/react.svg`, `assets/vite.svg`, and the `index.html` title (`"frontentvibe"`) are all unmodified Vite template artefacts.
12. **Rider role missing** — context mentions three roles (Admin / Ops / Rider) but only Admin and Ops exist anywhere in the codebase.

---

## 14. ONE-PARAGRAPH SUMMARY

The codebase is a well-designed, visually cohesive **UI prototype** — all screens render correctly from mock data and the dark-mode aesthetic is consistent. It is not yet an application: there is no backend integration, no real auth, and no data persistence of any kind. The three areas most worth standardising before building out are **(1) the data layer** — introduce a single API client + React Query so every page draws from the same typed, cached, loading-aware source instead of scatter-shot `MOCK_*` constants; **(2) styling discipline** — migrate all inline hex values to the existing CSS custom-property tokens (and add missing scale tokens for spacing and type), then enforce through ESLint, since the current dual-system compounds with every new page; and **(3) component size and hook extraction** — split the two 300-line pages, move the auth check into a `useAuth` hook and a `<ProtectedRoute>` wrapper, and promote the repeated modal/tab/stat sub-components into `src/components/` so they can be shared rather than copy-pasted.
