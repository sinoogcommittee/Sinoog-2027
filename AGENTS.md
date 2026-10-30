# AGENTS.md — Guidance & Rules for AI Agents

> **Audience**: AI pair programmers & coding agents working on the **Sinoog 2027** repository.  
> **Goal**: Maximize precision, eliminate token-wasting repetitive codebase scans, and enforce project conventions.

---

## 1. Absolute Golden Rules (Zero Exceptions)

1. **NEVER Run `git commit` or `git push`**:
   - The user strictly commits and pushes manually to GitHub.
   - You may run `git status` or `git diff` for verification, but never stage or commit files.

2. **Run All Quality Gates Before Marking Work Done**:
   - TypeScript build: `npx tsc -b` (must be 0 errors).
   - Linter: `npm run lint` (`oxlint`) (must be 0 errors, 0 warnings).
   - Unit tests: `npx vitest run --pool=threads` (all test suites must pass).
   - Production bundle: `npm run build` (Vite build must succeed).

3. **PostgREST Querying Ambiguity Rule**:
   - In Supabase Postgres, `profiles` is referenced multiple times by tables like `user_roles` (`user_id` & `assigned_by`) and `delegation_memberships` (`user_id` & `assigned_by`).
   - **NEVER** use PostgREST embedding syntax like `.select('..., profiles(...)')` on these tables. It triggers:
     `"Could not embed because more than one relationship was found for 'profiles' and '...'"`
   - **ALWAYS** query `profiles` and child tables separately in parallel via `Promise.all` and join in memory:
     ```ts
     const [{ data: items }, { data: profiles }] = await Promise.all([
       supabase.from('child_table').select('*'),
       supabase.from('profiles').select('id, full_name').in('id', userIds),
     ]);
     ```

4. **Preserve Documentation & Comments**:
   - Update [`docs/MASTER_BUILD_ROADMAP.md`](file:///e:/Programs/Sinoog%202027/docs/MASTER_BUILD_ROADMAP.md) and [`docs/SUPABASE_VERIFICATION.md`](file:///e:/Programs/Sinoog%202027/docs/SUPABASE_VERIFICATION.md) when finishing features.
   - Maintain all existing docstrings and explanatory code comments.

---

## 2. Fast Project Cheat Sheet

| Key Fact | Value |
|---|---|
| **Event Name** | Sinoog 2027 / Sinoog Run 2027 |
| **Parish** | Sto. Niño Parish — Guinacot, Guindulman, Bohol |
| **Novena Masses Start** | January 6, 2027 |
| **Sinoog Run Event** | January 9, 2027 |
| **Fiesta & Festival** | January 15, 2027 |
| **Timezone** | `Asia/Manila` (UTC+8) — always format dates/times in Philippine time |
| **Currency** | Philippine Peso (`PHP`), stored in integer **centavos** in DB (`fee_centavos`) |
| **Primary Framework** | React 19, TypeScript, Vite, React Router 7 |
| **Backend & Auth** | Supabase Postgres, Supabase Auth, Supabase Storage (RLS on all tables) |
| **Hosting** | Render Static Site (production), GitHub `main` branch |

---

## 3. Roles & Route Permissions

Use `useAuth()` hook (`src/features/auth/useAuth.ts`):
* `isAdmin`: Committee administrators. Full access to `/admin/*`.
* `isNewsInCharge`: Parish news editors. Restricted strictly to `/admin/posts`.
* `isDelegationHead`: Contingent leaders. Restricted strictly to `/admin/delegations` (scoped to assigned contingent).
* `public_user`: Runners and parishioners. Access to public routes, `/signin`, and `/account`.

### Route Mapping
* **Public**: `/`, `/festival`, `/festival/participants`, `/festival/guidelines`, `/run`, `/run/routes`, `/run/register`, `/activities`, `/activities/masses`, `/activities/nightly`, `/news`, `/news/:slug`, `/gallery`, `/sponsors`, `/about`, `/privacy`, `/terms`.
* **Runner Self-Service**: `/signin`, `/signup`, `/account`.
* **Committee Portal (`/admin`)**:
  * `/admin` (Overview Dashboard)
  * `/admin/activities` (Liturgical & festival schedule reordering & CRUD)
  * `/admin/posts` (Parish news editor)
  * `/admin/registrations` (Run review, walk-in registration, bib/QR assignment, click-to-call/SMS/email)
  * `/admin/kit-claims` (Camera QR scanner, roster check-in, offline caching & sync queue)
  * `/admin/run-timing` (Race gun official start, QR finish scanner, live leaderboard)
  * `/admin/delegations` (Dual-role contingent workspace: music upload, roster bulk paste, committee review)
  * `/admin/users` (Staff account management, role assignment, suspensions)
  * `/admin/finance` (Cashbook ledger, Overall/Festival/Run/General allocations, void history, CSV export)
  * `/admin/sponsors` (Sponsor management, tiering, logo uploads)
  * `/admin/gallery` (Photo/video album management, YouTube embeds)
  * `/admin/audit` (Immutable security audit log viewer, JSON detail inspector, RFC-4180 CSV export)
  * `/admin/settings` (Edition parameters, registration toggle, GCash number, banner)

---

## 4. Architectural Decisions to Remember

1. **Transactional Email (Phase 14 Decision)**:
   - Automated email sending (Resend/Postmark) was **intentionally omitted** in favor of personal committee communication for this local community run.
   - Runners get instant self-service digital passes with 4-digit bib numbers on `/account`.
   - Admin desks use one-tap `tel:` (Call/SMS) and pre-filled `mailto:` links for any clarifications.
   - `notification_outbox` schema remains in database for future expansion.

2. **Offline Resilience (Phase 22 Event-Day Ops)**:
   - `/admin/kit-claims` uses browser `localStorage`:
     - `sinoog_offline_kit_claims_cache`: snapshot of all approved runners and shirt sizes.
     - `sinoog_offline_kit_claims_queue`: offline kit claims waiting to sync.
   - Automatically falls back to cache if venue mobile data drops; allows offline claims; prompts with one-tap sync banner when reconnected.

3. **Storage Buckets**:
   - `public-media` (Public, 10MB): news photos, sponsor logos, gallery pictures.
   - `payment-evidence` (Private, 8MB): GCash payment screenshots (scoped to runner's folder).
   - `delegation-files` (Private, 25MB): festival audio tracks & documents (scoped to delegation folder).

---

## 5. UI & Styling Guidelines

* **Design System**: Material Design 3 (M3) components in `src/components/m3/` (`Card`, `Dialog`, `TextField`, `SelectField`, `SearchBar`).
* **Desktop Tables**:
  - Keep rows strictly single-line where possible (`white-space: nowrap`), clean typography, subtle borders.
* **Mobile Cards**:
  - Always provide a clean mobile card alternative (`.mobile-only` / `.desktop-only`) with no horizontal scroll or clipping at 320px–375px widths.
* **Icons**:
  - Use `lucide-react` for standard UI icons.
  - Use bespoke handcrafted SVG components in `src/components/AdminNavIcons.tsx` for admin navigation items.

---

## 6. How to Start Any Task

1. Read [`PROJECT_MEMORY.md`](file:///e:/Programs/Sinoog%202027/PROJECT_MEMORY.md) for quick schema and file lookups instead of scanning the whole repository.
2. Check existing tests (`npm test` / `vitest`) before editing queries or shared utilities.
3. Make contiguous, surgical edits.
4. Run `npx tsc -b && npm run lint && npx vitest run --pool=threads && npm run build` to verify before reporting completion.
