# PROJECT_MEMORY.md — Sinoog 2027 Knowledge Base

> **Purpose**: High-density reference document containing complete architecture, data models, database migrations, and operational workflows for the **Sinoog 2027** project. Read this first to eliminate repetitive repository scans.

---

## 1. Project & Event Overview

* **Event Title**: Sinoog 2027 (Fiesta, Festival & Sinoog Run)
* **Parish**: Sto. Niño Parish — Guinacot, Guindulman, Bohol, Philippines
* **Organizer**: Sinoog Committee / Parish Pastoral Council
* **Official Timezone**: `Asia/Manila` (UTC+8) — all timestamps and UI dates must render in Manila time.
* **Currency**: Philippine Peso (`PHP`). All database financial amounts use integer **centavos** (e.g. `50000` = `₱500.00`).
* **Critical Dates**:
  * **Novena Masses Start**: January 6, 2027
  * **Sinoog Run 2027**: January 9, 2027 (Race gun start ~ 5:30 AM)
  * **Sinoog Festival & Fiesta**: January 15, 2027
* **Tech Stack**:
  * Frontend: React 19, TypeScript 5.8, Vite 6, React Router 7
  * UI: Material Design 3 (M3) components (`src/components/m3/`)
  * Backend: Supabase (Postgres, GoTrue Auth, Storage, Edge Functions)
  * Hosting: Render Static Site (auto-deploy from GitHub `main`)

---

## 2. Directory & Architecture Map

```text
e:\Programs\Sinoog 2027\
├── src/
│   ├── app/
│   │   └── App.tsx               # Primary route declarations and navigation tree
│   ├── components/
│   │   ├── AdminFloatingNav.tsx  # Mobile bottom floating action bar with paginated items
│   │   ├── AdminNavIcons.tsx     # Handcrafted colored SVG icons for admin features
│   │   ├── Button.tsx            # M3 button (filled, outlined, text)
│   │   ├── LogoMark.tsx          # Parish & committee official branding SVG
│   │   ├── RequireAdmin.tsx      # Admin gatekeeper component
│   │   └── m3/                   # Material Design 3 UI library (Card, Dialog, TextField, SearchBar, SelectField)
│   ├── features/                 # Data queries, mutations, and domain logic
│   │   ├── activities/           # activitiesQueries.ts (schedule, reorder, liturgical dates)
│   │   ├── audit/                # auditQueries.ts (security audit log, CSV exporter, stats)
│   │   ├── auth/                 # AuthContext.tsx, useAuth.ts, RequireRole.tsx
│   │   ├── content/              # postsQueries.ts (news management, rich text sanitization)
│   │   ├── delegations/          # delegationQueries.ts (contingents, dancer roster, music uploads)
│   │   ├── editions/             # editionQueries.ts (site settings, registration switch, GCash)
│   │   ├── finance/              # financeQueries.ts (cashbook ledger, voids, allocations, exports)
│   │   ├── media/                # galleryQueries.ts (photo/video albums, YouTube embeds)
│   │   ├── run/                  # runQueries.ts (registrations, kit claims, bibs, race timing)
│   │   ├── sponsors/             # sponsorQueries.ts (partners, logos, tiers, ordering)
│   │   ├── ui/                   # useToast.ts, FeedbackStates.tsx (Loading, Empty, Error)
│   │   └── users/                # userQueries.ts (managed staff accounts, profile updates, suspensions)
│   ├── layouts/
│   │   ├── PortalLayout.tsx      # Committee workspace layout (sidebar + topbar + mobile floating nav)
│   │   └── PublicLayout.tsx      # Public website layout (navbar + footer + mobile nav)
│   ├── pages/
│   │   ├── admin/                # Committee workspace views (Overview, Registrations, KitClaims, Delegations, etc.)
│   │   ├── auth/                 # Auth views (LoginPage, RunnerAuthPage, ResetPasswordPage, etc.)
│   │   └── public/               # Public site views (HomePage, FestivalPage, RunPage, ActivitiesPage, etc.)
│   ├── types/
│   │   ├── database.ts           # Complete database table row, insert, and update interfaces
│   │   └── index.ts              # Domain model exports and re-exports
│   └── lib/
│       └── supabase.ts           # Supabase client initialization (safe browser keys only)
├── supabase/
│   └── migrations/               # Applied Postgres migrations (001_schema.sql to 021_...)
└── docs/                         # Specifications, roadmap, verification logs
    ├── MASTER_BUILD_ROADMAP.md   # Primary implementation status and progress checklist
    └── SUPABASE_VERIFICATION.md  # Migration audit table and live database verification logs
```

---

## 3. Database Migrations Index (All Applied in Production)

| Migration | File | Core Content / Purpose |
|---|---|---|
| `001` | `001_schema.sql` | Base schema: editions, profiles, user_roles, activities, posts, albums, delegations, run_events, run_categories, run_registrations, payments, kit_claims, audit_logs, notification_outbox |
| `002` | `002_security_and_storage.sql` | RLS enablement across all tables; storage buckets `public-media`, `payment-evidence`, `delegation-files` |
| `004` | `004_promote_first_admin.sql` | Seeds initial administrator role for site owner |
| `005` | `005_correct_novena_start_date.sql` | Fixes novena start date to Jan 6, 2027 and run date to Jan 9, 2027 |
| `006` | `006_seed_2027_mass_and_fiesta_schedule.sql` | Seeds initial liturgical masses and fiesta schedule entries |
| `007` | `007_run_registration_workflow.sql` | Core run functions: `submit_run_registration`, `approve_run_registration`, `record_run_payment`, bib assignment, QR generation |
| `008` | `008_run_registration_and_timing_controls.sql` | Official race gun start, finish recording via QR tokens (`record_run_finish`), leaderboard view |
| `009` | `009_atomic_activity_reordering.sql` | `reorder_activities` RPC for drag/atomic sequence swapping |
| `010` | `010_admin_account_deletion.sql` | Admin safety guards; cascade fixes on deletion of users; sets `actor_id` to null on profile deletion |
| `011` | `011_cash_payments_and_finance.sql` | Walk-in registration support (`admin_register_cash_runner`); financial records table and audited voids |
| `012` | `012_sponsor_facebook_url.sql` | Added `facebook_url` to `sponsors` table |
| `013` | `013_gallery_photo_video_collections.sql` | Albums support photos and YouTube video embeds |
| `014` | `014_registration_documents_and_timeline.sql` | Added `registration_email`, `submitted_at`, `approved_at`, terms/privacy policy versions |
| `015` | `015_registration_lifecycle_backfill_fix.sql` | One-time backfill trigger for legacy registrations |
| `016` | `016_security_hardening.sql` | Hardened RLS policies for runners and administrators |
| `017` | `017_registration_integrity_and_admin_safety.sql` | Integrity triggers on registrations and audit log writes on administrative overrides |
| `018` | `018_suspended_accounts_cannot_register.sql` | Suspension checks preventing suspended users from submitting run registrations |
| `019` | `019_gallery_collection_order.sql` | Added `sort_order` to albums and `reorder_gallery_album` RPC |
| `020` | `020_financial_reporting_dimensions.sql` | Cashbook allocation scopes (`overall`, `festival`, `run`, `general`), counterparties, recorder enforcement |
| `021` | `021_delegation_workspace_and_public_policy.sql` | Added `theme` & `description` to `delegation_entries`; public RLS for approved contingents; storage deletion policies |

---

## 4. Key Workflows & Architectural Decisions

### A. Sinoog Run & Registration Operations
* **Runner Flow**:
  1. Runner creates account via `/signin?mode=signup` or Google OAuth.
  2. Submits registration form at `/run/register` with emergency contacts, shirt size, category (3K/5K/10K).
  3. Uploads GCash payment receipt or chooses on-site cash payment with committee admin.
  4. While status is `submitted`, runner can edit their own details.
* **Admin Review Flow** (`/admin/registrations`):
  * Committee reviews payment screenshot. One-click approval assigns an official 4-digit Bib number and QR token.
  * Direct contact options: One-tap Click-to-Call (`tel:`) and pre-filled Click-to-Email (`mailto:`).
  * Walk-in cash registration: Admins can manually register runners at the parish office via `admin_register_cash_runner`.

### B. Race Kit Claiming Desk (`/admin/kit-claims`)
* **Live Camera QR Scanner**: ZXing browser scanner decodes runner pass QR codes (`SINOOG-2027|<token>`) instantly.
* **Single-Claim Guarantee**: `public.kit_claims` uses `registration_id` as primary key — double handovers are physically impossible.
* **Offline Readiness**:
  * Approved roster snapshot saved in `localStorage.sinoog_offline_kit_claims_cache`.
  * If venue mobile data drops, offline claims are recorded in `localStorage.sinoog_offline_kit_claims_queue`.
  * When internet returns, one-tap **[Sync Claims Now]** flushes queued claims to the database.
* **Paper Backup**: `Ctrl+P` generates an official paper roster with volunteer signature columns.

### C. Festival Contingents & Delegations (`/admin/delegations`)
* **Dual-Role Portal**:
  * **Administrators**: Can add contingents, assign delegation heads, set review status (`approved`, `needs_changes`, `rejected`), and write feedback notes.
  * **Delegation Heads**: Can only see and manage their own assigned contingent. Can edit performance theme/synopsis, bulk paste performer rosters, and upload private rehearsal audio into `delegation-files`.
* **In-Browser Audio Preview**: Committee and heads can listen to uploaded music tracks directly in the browser via signed URLs.
* **Public Showcase**: Approved contingents automatically appear on `/festival` and `/festival/participants`.

### D. Financial Accounting & Cashbook (`/admin/finance`)
* **Allocations**: Overall, Sinoog Festival, Sinoog Run, General Parish.
* **Ledger Types**: Inflows (Sponsorships, PFC Budget, Donations) vs Expenses (Prizes, Subsidy, Shirts, Sound, Tarpaulins, etc.).
* **Audited Voids**: Financial rows are never hard-deleted; voiding requires a documented reason and records the acting administrator.
* **Exports**: Real-time CSV exports for full ledger, summary reports, and registration fee collections.

### E. Security & Audit History (`/admin/audit`)
* **Log Table**: `public.audit_logs`.
* **Tracked Operations**: Role grants/revocations, user suspensions, registration approvals, admin cash entries, bib reassignments, activity reordering, and finance voids.
* **Interface**:
  * Metric summary cards (Total Events, Security & Roles, Run Actions, Finance).
  * Fast search and filter by action or table.
  * Formatted metadata view with syntax-highlighted JSON viewer and one-click copy button.
  * RFC-4180 CSV export for parish record retention.

---

## 5. Critical Technical Rules (Gotchas & Fixes)

1. **Foreign Key Ambiguity in PostgREST**:
   * Tables `user_roles` and `delegation_memberships` each have TWO foreign keys to `profiles` (`user_id` and `assigned_by`).
   * Never do: `supabase.from('user_roles').select('*, profiles(*)')`.
   * Always do: Query `profiles` separately and join in JavaScript:
     ```ts
     const [rolesRes, profilesRes] = await Promise.all([
       supabase.from('user_roles').select('*'),
       supabase.from('profiles').select('id, full_name'),
     ]);
     ```

2. **Oxlint / React 19 State Cascading Render**:
   * Avoid calling asynchronous `setState` directly inside a raw `useEffect` without scheduling.
   * Pattern:
     ```ts
     useEffect(() => {
       const timer = window.setTimeout(() => void loadData(), 0);
       return () => window.clearTimeout(timer);
     }, [loadData]);
     ```

3. **Storage Folder Isolation**:
   * Payment evidence: `${userId}/${filename}` in bucket `payment-evidence`.
   * Delegation music: `${delegationId}/music/${filename}` in bucket `delegation-files`.
   * Public media: `${folder}/${filename}` in bucket `public-media`.

4. **Service-Role Key Security**:
   * The Supabase service-role key is **NEVER** exposed to client bundles or in `VITE_` variables. Privileged operations are performed via Postgres `security definer` RPCs or Supabase Edge Functions.

5. **Vitest Execution on Windows**:
   * Always pass `--pool=threads` when running vitest: `npx vitest run --pool=threads`.

6. **Hero Video & Mobile Layout Conventions**:
   * Desktop hero background video: `public/video/parishcover_video.webm` / `.mp4` at `opacity: 0.10 !important`.
   * Mobile hero background video: `public/video/parishcover_video_portrait.webm` / `.mp4` (H.264/VP9 portrait, audio stripped, faststart) at `opacity: 0.10 !important`.
   * Mobile View 1 vertical sequence: Identity details (`Sto. Niño Parish` / `SINOOG 2027` / `Viva Pit Señor!`) above -> Artwork emblem in center -> Countdown timer flush at bottom above the floating bar.
   * Header branding: Committee logo `.pub-topbar .logo-mark--committee` is enlarged to `48px` (mobile) / `52px` (desktop) to visually balance with the circular parish seal.
   * Mobile ambient bamboos are temporarily commented out / hidden (`display: none !important`).

---

## 6. Verification Commands Checklist

Before finalizing any task, run in terminal:
```powershell
# 1. Typecheck
npx tsc -b

# 2. Linter (must be 0 errors, 0 warnings)
npm run lint

# 3. Unit tests
npx vitest run --pool=threads

# 4. Production build
npm run build
```
*(Remember: Do not run `git commit` or `git push`.)*
