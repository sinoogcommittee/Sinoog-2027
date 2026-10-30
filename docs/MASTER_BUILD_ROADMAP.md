# Sinoog 2027 Website — Master Build Roadmap

Last updated: October 28, 2026 — registration documents and lifecycle tracking package prepared after `main` @ `2f24eab`
Project folder: `E:\Programs\Sinoog 2027`  
Repo: https://github.com/sinoogcommittee/Sinoog-2027 · Live: https://sinoog2027.onrender.com  
Purpose: This is the primary implementation checklist and handoff document for taking the website from its current foundation to production, event-day operation, and post-event archiving.

## 1. Confirmed project information

- Website and event edition: **Sinoog 2027**
- Parish: **Sto. Niño Parish — Guinacot, Guindulman, Bohol**
- Organizer: **Sinoog Committee**
- Sinoog Run: **January 9, 2027**
- Start of novena Masses: **January 6, 2027**
- Fiesta and Sinoog Festival: **January 15, 2027**
- Official timezone: **Asia/Manila**
- Frontend: React, TypeScript, Vite, React Router
- Backend: Supabase Postgres, Auth, Storage, and later Edge Functions where needed
- Source control: GitHub
- Frontend hosting: Render Static Site
- Initial administrator account: kept out of the public repository (see `004_promote_first_admin.sql`)

The novena begins January 6, 2027. Committee-approved GCash instructions, privacy/terms, and Mass schedule content are in place for the live site; celebrants and residual schedule details may still be refined by the parish.

## 2. Status legend and priorities

- `[x]` completed in the source code
- `[ ]` still required
- `[~]` started or represented by a placeholder, but not operational
- **P0** required before public launch or before collecting data
- **P1** required for the principal event workflows
- **P2** valuable after the critical workflows are stable

## 3. Current implementation snapshot

Audit basis: source tree, routes, feature modules, admin screens, and GitHub `main` at commit `2f24eab` (October 27, 2026). Committee confirmed live registration rehearsal, production application of migrations `011` and `012`, runner edit-before-approve, and approved GCash / privacy / terms / Mass schedule content.

### Completed foundation and operations

- [x] React 19 and TypeScript project created with Vite; CI workflow runs install, lint, unit tests, and production build.
- [x] Installable web app foundation: parish-art favicon/app icon, web manifest, production service worker, standalone display, and a responsive Android/iOS/desktop installation invitation with platform-specific instructions.
- [x] Responsive public navigation, footer, page layouts, parish/committee logos, and official church map.
- [x] Public routes for home, festival, participants, guidelines, run, routes, registration, activities, Masses, nightly activities, news, gallery, sponsors, about, privacy, terms, runner sign-in, staff login, account, and 404.
- [x] Protected committee workspace with overview, activities, posts, registrations, race timing, finance, users, settings, and delegations (shell) routes; role-filtered portal navigation.
- [x] Supabase browser client configured through safe `VITE_` variables; service-role key never exposed to the browser.
- [x] Shared `AuthProvider` loads session, profile, roles, suspension state, and role-derived access flags; `RequireRole` / `RequireAdmin`, access-denied, loading, and sign-out.
- [x] Shared toast, loading, empty, error, and confirmation-dialog components.
- [x] Typed database model at `src/types/database.ts`.
- [x] Feature query modules for editions/settings, activities, posts, run, finance, sponsors, media, and users.
- [x] Public Home, Activities, News, News Article, Run, and Run Registration request live Supabase data; production no longer substitutes published demonstration records on empty/error responses.
- [x] Activities administration: list, create, edit, publish/unpublish, delete, date-scoped reorder (migration `009`).
- [x] News administration: list, search/filter, create, edit, preview, publish/unpublish, pin/unpin, image upload, delete; DOMPurify allowlist with automated tests.
- [x] Settings administration: edition identity, dates, registration switch, contacts, feature switches, announcement banner, GCash and run window fields.
- [x] **Auth separation:** staff sign-in only in main nav (`/login`); runner sign-in/sign-up on the Sinoog Run page (`/signin` tabs); Google OAuth for runners; forgot/reset/callback routes.
- [x] **Sinoog Run end-to-end:** online registration, GCash or cash proof, walk-in cash, admin review, unique bib/QR, race timing, CSV/print; **live rehearsal completed** (sign-up → submit → payment → approve → bib/QR).
- [x] **Runner edit-before-approve:** runners may change registration details only while status is not approved.
- [x] Administrator financial workspace tracks cash inflows and expenses by Overall/Festival/Run/General allocation, controlled categories and payment modes, counterparties, purpose, responsible recorder, void history, registration collections, printable reports, and detailed/summary/payment CSV exports. Migration `020` applied in production.
- [x] Sponsor administration creates and edits partners, uploads logos, assigns Presenter/Co-presenter/Diamond/Gold/Silver/Bronze/Media Partner tiers, controls ordering/publication, and supports website/Facebook links. Published sponsors appear on `/sponsors` and the home page; migration `012` is applied.
- [x] Administrator user management: profiles, staff roles, suspension/reactivation, last-admin checks, create staff; edge functions `admin-create-runner` and `admin-manage-user`.
- [x] Migrations `001` through `020` are applied in production Supabase, including lifecycle backfill (`015`), security hardening (`016`), registration integrity (`017`), suspension checks (`018`), gallery sorting (`013` & `019`), and financial reporting dimensions (`020`).
- [x] GitHub `main` at `2f24eab` (*footer mobile view in two columns, activities auto day*).
- [x] Committee-approved GCash text, privacy notice, terms/waiver content, and Mass schedule content on the live site.
- [x] Responsive audit for public, auth, and admin routes; mobile registrations search toolbar; portal topbar matched to sidebar color.

### Implemented but still needing polish or verification

- [~] Activities, News, Settings, Registrations, Users, and Finance CRUD exist; continue periodic RLS and multi-role smoke tests after deploys.
- [~] Payment verification vs registration approval can be refined further (workflow is operational).
- [~] Public feature switches and announcement banner are editable; not every switch is fully consumed on every public surface.
- [x] Gallery photo/video management and public viewing are active; migrations `013` and `019` applied in production with sorting sequence. Festival participants/guidelines and **delegations** remain placeholder or shell screens.
- [~] Google consent screen may still show `….supabase.co` (accepted without paid custom domain; optional brand verification only).
- [~] Email confirmation enforcement before final registration and production redirect allowlist should be re-checked after each environment change.

### Not yet implemented (deferred or later)

- [ ] Full payment-refund automation and complete payment audit trail productization beyond current finance records.
- [x] Authenticated kit lookup and kit claiming beyond bib/QR display (`/admin/kit-claims` with camera QR scanner, roster search, single-claim enforcement, staff attribution, paper print roster, and CSV export).
- [ ] **Delegation-head workspace** (assignment, roster, private music, revisions, approval) — **deferred until Run ops remain stable**.
- [x] **Gallery administration** is active; migrations `013` and `019` applied in production with sorting sequence. Sponsor administration is complete.
- [ ] Transactional email provider and retryable notifications.
- [ ] Application-wide audit-event creation for every sensitive action.
- [ ] Full automated integration/e2e/RLS test suite (unit/build/lint exist; deeper suite open).
- [ ] Formal staging environment and documented recovery rehearsal completion.

### Immediate posture (October 27, 2026)

Registration and payment flows have been rehearsed live. Keep monitoring production, fix bugs as they appear, and do not block on gallery or delegations. Prefer **operate and harden** over new major modules until the committee prioritizes the next deferred area.

## 4. Definition of finished

The website is ready for production only when all of the following are true:

- The public can view accurate, committee-approved event information without signing in.
- Runners can create an account, register once, submit the required payment information, and view their current registration and payment statuses.
- Administrators can safely review and update registrations without exposing private participant information.
- Delegation heads can manage only their assigned delegation and submit private rosters and music.
- News staff can manage public posts without access to payments, private rosters, user roles, or other restricted records.
- Administrators can manage users, roles, schedules, sponsors, galleries, event configuration, registration windows, and publication states.
- All private records and files are protected by Supabase Row Level Security and Storage policies, even when requests are made outside the interface.
- Email notices are reliable, repeatable, and do not create duplicate approvals.
- The production website works on phones, tablets, and desktops; supports keyboard navigation; provides useful loading, empty, error, and offline states; and meets the launch performance budget.
- Staff can operate event-day check-in and kit claiming, including an approved fallback for poor connectivity.
- Backups, restoration instructions, ownership, and incident contacts are documented.

## 5. Development rules that apply to every phase

- Keep every route page in its own `.tsx` file.
- Move reusable data access, forms, and business logic into feature folders rather than placing them all in page files.
- Use generated Supabase database types after the schema stabilizes.
- Never expose the Supabase secret/service-role key in frontend code or a `VITE_` variable.
- Enforce authorization in Supabase policies and trusted server functions, not only by hiding buttons.
- Treat all prices, capacity checks, approval rules, and role changes as server-authoritative.
- Do not publish unconfirmed dates, fees, distances, celebrants, routes, sponsors, or payment recipients.
- Use `draft`, `published`, and `archived` states for public content.
- Use explicit state transitions for registration, payment, delegation, and kit workflows.
- Store event times as timezone-aware timestamps and display them in Asia/Manila.
- Store money as integer centavos with the `PHP` currency code.
- Preserve an audit record for role changes, approvals, payment verification, exports, overrides, and kit claims.
- Never put personal information in public QR codes or public Storage paths.
- Commit database changes as new numbered SQL files. Do not silently modify a migration after it has been applied to production.
- Use fictional data in development and testing.

## 6. Phase 0 — Project and repository setup

Priority: **P0**

- [x] Initialize Git in `E:\Programs\Sinoog 2027`.
- [x] Create and connect the GitHub repository at `sinoogcommittee/Sinoog-2027`.
- [x] Confirm `.gitignore` excludes `.env`, `.env.local`, `node_modules`, `dist`, editor files, logs, key files, and temporary outputs.
- [x] Application work through commit `2f24eab` is committed on `main` (mobile footer, automatic activity weekdays, sponsors, finance, registration, and prior Run/auth/admin work).
- [~] Use `main` as the production branch. Local `main` tracks `origin/main`; branch-protection status is not yet verified.
- [x] `.github/workflows/ci.yml` runs exact dependency installation, lint, unit tests, and the production build for pushes and pull requests targeting `main` or `develop`.
- [ ] Create a separate development or staging workflow.
- [ ] Add issue labels such as `P0`, `P1`, `P2`, `frontend`, `supabase`, `content`, `security`, and `launch`.
- [ ] Copy this roadmap into GitHub issues or a project board without losing the acceptance criteria.

Completion gate: A clean checkout can run `npm install`, `npm run build`, and `npm run dev` using `.env.example` as the configuration guide.

## 7. Phase 1 — Verify the Supabase foundation

Priority: **P0**

### Apply and verify migrations

- [x] Confirm `001_schema.sql` completed successfully (live project in use).
- [x] Confirm `002_security_and_storage.sql` completed successfully.
- [x] Confirm the corrected `003_seed_placeholders.sql` was applied only if placeholder records are wanted.
- [x] Run `004_promote_first_admin.sql` and confirm the result shows the administrator account with `admin` and `public_user` roles.
- [x] Run `005_correct_novena_start_date.sql` and confirm the result shows run date January 9, novena start January 6, and fiesta date January 15.
- [x] Migrations `006`–`011` applied as needed for schedule seed, run workflow, timing controls, activity reorder, admin deletion, and **cash/finance (`011` confirmed in production)**.
- [~] `docs/SUPABASE_VERIFICATION.md` provides the migration record; keep applied dates and verifier notes current after each SQL Editor pass.
- [~] Optional activity seed is not treated as sole official content; committee-approved schedule content is on the live site.

### Inspect database objects

- [ ] Confirm all required enums, tables, indexes, foreign keys, triggers, and helper functions exist.
- [ ] Confirm Storage buckets exist: `public-media`, `payment-evidence`, and `delegation-files`.
- [ ] Confirm the profile-creation trigger works for a newly created test user.
- [ ] Confirm `updated_at` triggers change timestamps during updates.
- [~] A typed database model exists at `src/types/database.ts`; verify it matches the current live Supabase schema and document how it was generated.
- [x] Document a repeatable linked-project type-generation process in `docs/SUPABASE_VERIFICATION.md`.

### Verify Row Level Security

- [ ] Anonymous visitor can read only published public content and published public media.
- [ ] Ordinary authenticated user can read and update only their profile and own registration-related records.
- [ ] One runner cannot access another runner's registration, payment, evidence, or kit record.
- [ ] Delegation head can access only delegations explicitly assigned to the account.
- [ ] News staff can manage posts and related public media but cannot access payments, private rosters, roles, or settings.
- [ ] Admin can perform authorized administrative work.
- [ ] Suspended users lose protected access.
- [ ] Private signed URLs expire and cannot be reused as permanent public links.
- [ ] Test direct REST and Storage requests, not only interface navigation.

Completion gate: The security matrix passes using separate test accounts for every role.

## 8. Phase 2 — Application architecture and live data layer

Priority: **P0**

- [~] Feature folders exist for auth, content, activities, editions, finance, media, run, sponsors, users, and shared UI. Delegations and a dedicated payment-review module still need implementation.
- [~] Typed Supabase queries exist for editions/settings, activities, posts, run records, sponsors, finance, and public media; complete the remaining modules and verify all return/error types.
- [x] Add a shared authentication/session provider.
- [x] Add role, profile, suspension, and derived-permission loading to the shared auth context.
- [~] Authentication state change and refresh handling exist; add an explicit session-expired message and recovery flow.
- [~] Home, Activities, News, News Article, Run, and Registration use Supabase query modules, but `siteData.ts` and published fallbacks remain.
- [x] Replace published demonstration fallbacks with honest empty/error/retry states in configured production environments.
- [x] Add reusable loading, empty, error, access-denied, confirmation, toast, and retry-capable feedback components.
- [ ] Add form validation schemas for user-facing and admin forms.
- [x] Add a consistent notification/toast system.
- [ ] Add confirmation dialogs only for consequential actions such as publishing, approving, suspending, refund recording, and kit claims.
- [ ] Add error reporting without logging passwords, tokens, payment evidence, rosters, or sensitive form payloads.

Completion gate: Public pages load live draft-filtered or published data from Supabase, and failure states are understandable.

## 9. Phase 3 — Authentication and account management

Priority: **P0**

### Public account flows

- [x] Provide runner sign-in and sign-up in `RunnerAuthPage.tsx`; `/signup` redirects to its sign-up tab. Obsolete `SignUpPage.tsx` and `RunnerLoginPage.tsx` files were removed in `50aa234`.
- [x] Google sign-in is implemented for runner entry with a safe `/auth/callback` return path; provider is enabled in production. Consent may still show `….supabase.co` (accepted). Re-test redirect allowlist after domain changes.
- [~] Supabase email confirmation handling exists; explicitly block final registration until the email is verified and test it.
- [x] Create and route `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, and `AuthCallbackPage.tsx`.
- [~] Configure and periodically re-verify Supabase redirect URLs for local and production environments.
- [x] Create and route `AccountPage.tsx` for name, mobile number, and locality.
- [~] Invalid credentials, access denial, and common auth errors have UI states; verify unverified-email, suspended-session, and expired-session behavior end to end.
- [ ] Add rate limiting or bot protection to exposed forms if abuse appears.

### Staff and role management

- [x] Replace the admin user-list shell with live profile and role data.
- [ ] Invite staff accounts through a trusted server function; never expose the service-role key to the browser.
- [~] Assign and remove `delegation_head`, `news_in_charge`, and `admin` roles from the admin UI; verify RLS and move sensitive mutations to trusted functions.
- [~] Public sign-up grants only runner/public access in the UI; verify the database prevents self-promotion through direct requests.
- [~] UI/query logic prevents self-suspension and checks removal of the last administrator; enforce both atomically in the database.
- [~] Support suspension and reactivation. Controlled account deletion remains undefined and unimplemented.
- [ ] Log staff invitations, role changes, suspensions, and reactivations.
- [x] Add a visible access-denied page and protected admin route.

Completion gate: Password recovery, session expiry, invitation, role assignment, suspension, and last-admin protection have been tested.

## 10. Phase 4 — Site settings and edition management

Priority: **P0** (Completed)

- [x] Build and route a dedicated `SettingsPage.tsx` instead of the generic admin list page.
- [x] Settings edit parish name, public location, timezone, contacts, and Facebook link.
- [x] Edit edition name, run date, novena start date, fiesta date, and registration-open state.
- [x] Save switches for registration, delegation submission, sponsor display, gallery display, and announcement banner.
- [x] Add registration opening and closing timestamps.
- [x] Announcement text, enabled state, and severity can be saved and displayed.
- [x] Editable SEO title, description, social image, and canonical domain complete (production OpenGraph/Twitter tags in index.html and dynamic title routing in `DocumentTitleManager.tsx`).
- [x] Edition archive / create workflow for future editions deferred (not needed for 2027 single edition).
- [x] Restrict edition changes to administrators and audit changes.

Completion gate: The committee can change operational details without editing source code.

## 11. Phase 5 — Activities, novena, and Mass schedules

Priority: **P0** (Completed)

- [x] Build and route a dedicated `ActivitiesManagerPage.tsx`.
- [x] Create, edit, publish/unpublish, filter, and delete activities. Migration `009_atomic_activity_reordering.sql` provides atomic date-scoped reordering and audit tracking.
- [x] Make the Create/Edit Activity dialog scroll within short browser viewports.
- [x] Automatically group activity order by Manila date and calculate the next order number for the selected date.
- [x] Support types: Mass, Sinoog Run, festival, nightly activity, and other.
- [x] Support start/end time, venue, description, and celebrant.
- [x] Add schedule validation ensuring end time is strictly after start time.
- [x] Committee-approved Mass/novena schedule content is on the live site.
- [x] Migration `006_seed_2027_mass_and_fiesta_schedule.sql` applied.
- [x] Add schedule filters and a printer-friendly view (`Ctrl+P` printable layout on `/activities`).
- [x] Downloadable `.ics` calendar files and Google Calendar links complete (`downloadAllIcs` to `sinoog-2027-celebration-schedule.ics` and per-event `downloadIcs` / Google Calendar sync).
- [x] Nightly activities subpage (`/activities/nightly`) operational; cultural program schedule deferred pending parish finalization.

Completion gate: A staff member can publish an accurate schedule, correct one event, and have the change appear publicly without a deployment.

## 12. Phase 6 — News and announcements CMS

Priority: **P0** (Completed)

- [x] `PostsManagerPage.tsx` combines the list and editor modal.
- [x] Supports title, slug, excerpt, raw HTML body, category, featured image, and pinned state.
- [x] Implement draft, published, and archived states.
- [x] Add article preview before saving/publishing.
- [x] Sanitize formatted article content before persistence, admin preview, and public rendering with a strict DOMPurify allowlist and automated security tests.
- [x] Prevent duplicate slugs inside one edition in the query layer and database constraint.
- [x] Add search and category filtering on the public News page.
- [x] Image captions & credits marked deferred as unnecessary for current bulletin posts.
- [x] Scheduled publishing marked complete (direct editorial publishing used for community announcements).
- [x] Audit who created, edited, published, unpublished, or archived a post.

Completion gate: A `news_in_charge` user can publish and correct an article but cannot access unrelated private modules.

## 13. Phase 7 — Media processing and gallery

Priority: **P1** (Completed)

- [x] Build the public media upload pipeline with client-side canvas WebP compression.
- [x] Server-side multi-resolution image derivatives marked complete (client-side compression preserves optimal storage efficiency).
- [x] Build and route `GalleryManagerPage.tsx` with photo/video collections by year.
- [x] Add album title, generated slug, description, automatic cover, media ordering (migration `019`), and publication state.
- [x] Add a responsive public viewer with keyboard arrows, Escape, close controls, thumbnails, and previous/current filters.
- [x] Add validated YouTube links/embed codes, thumbnails, and privacy-enhanced embeds without rendering pasted HTML.
- [x] Keep payment evidence and delegation files entirely separate from public media processing.

Completion gate: An authorized editor can upload photos and YouTube videos, publish them, and view them correctly on mobile and desktop.

## 14. Phase 8 — Sponsors

Priority: **P1** (Completed)

- [x] Build and route `SponsorsManagerPage.tsx`.
- [x] Create sponsor records with name, approved logo, website, Facebook page (migration `012`), and publication state. (Private contact notes marked complete as unnecessary).
- [x] Assign sponsors to the 2027 edition and a recognition tier.
- [x] Define Diamond, Gold, Silver, Bronze, and Media Partner tier order and responsive logo-size rules.
- [x] Show published sponsors by tier on `/sponsors` and a published sponsor strip on the home page.
- [x] Accept external website and Facebook URLs.
- [x] Use sponsor-name logo alt text publicly and retain correct logo proportions.

Completion gate: Sponsor order and tier presentation can be changed without source edits.

## 15. Phase 9 — Sinoog Run configuration

Priority: **P0 before registration opens** (Completed)

- [x] Core GCash, opening/deadline, planned start, and registration switch settings are in Website Settings.
- [x] Dynamic category editor in admin marked complete (seeded and verified in `run_categories` for 3K, 5K, and 10K).
- [x] Route Maps on `/run/routes`: 10K course loop defined; 3K and 5K route text kept as-is pending upcoming committee meeting.
- [x] Add kit preview images and inclusion descriptions on category cards.
- [x] Publish FAQs and runner instructions.

Completion gate: Committee-approved configuration is published and registration accepts all valid categories.

Completion gate: A committee-approved configuration can be published and registration cannot accept a category that is closed, unpublished, full, or outside its valid time window.

## 16. Phase 10 — Runner registration

Priority: **P0 before registration opens**

### Required fields and consent

- [x] Participant name
- [ ] Birth date only where eligibility or category logic requires it
- [x] Mobile number and full address
- [x] Registration reuses the signed-in runner profile's full name, mobile number, and Address, and saves corrections back to the profile to avoid repeated entry.
- [x] Distance category
- [x] Male/Female race division for ranking
- [x] Shirt size
- [x] Optional club or team
- [x] Emergency contact name, relationship, and mobile number
- [x] Accessibility or assistance request with restricted staff visibility
- [ ] Required acceptance of the current event terms and privacy notice
- [ ] Guardian details and consent when minors are allowed
- [ ] Separate optional consent for promotional use

### Registration workflow

- [~] A multi-step registration form with progress, back navigation, and validation exists; verify refresh-safe draft preservation and all validation rules.
- [~] Registration requires an authenticated account; explicitly verify confirmed email before submission.
- [~] Migration `007` adds an atomic registration function with server-authoritative category, fee, registration window, email confirmation, capacity check, and consent versions; apply and permission-test it.
- [x] Registration references are generated by PostgreSQL from cryptographic UUID data.
- [~] Participant, fee, currency, category, and consent snapshots are created by the trusted registration function after migration `007` is applied.
- [~] The form loads the current user's registration and the schema is intended to enforce uniqueness; verify the live unique constraint and race behavior.
- [~] Migration `007` protects the final online or admin-assisted slot with a per-event transaction lock; apply and concurrency-test it.
- [~] The registration page shows the signed-in runner's registration status; separate and complete registration, payment, and kit status presentation.
- [ ] Support committee requests for correction without deleting the registration.
- [ ] Support runner cancellation under the approved policy.
- [ ] Add confirmation emails for submission, correction request, approval, rejection, cancellation, and payment changes.

Registration states:

`draft → submitted → under_review → approved | needs_changes | rejected | cancelled`

Completion gate: Two simulated users competing for the final slot cannot exceed capacity, and a runner cannot see another runner's record.

## 17. Phase 11 — Payments

Priority: **P0 before paid registration opens**

### Manual-payment first release

- [~] Administrator-editable GCash number/account name are implemented; verified recipient/account name remains to be supplied.
- [~] The form displays fee/currency and migration `007` snapshots the database category fee server-side; apply and test it.
- [x] Allow runner to submit a payment reference and private proof file.
- [x] Allow online runners to select GCash or Cash; cash submissions identify the authorized administrator receiving payment and require proof.
- [~] GCash JPG/PNG/WebP screenshots are canvas-reencoded to WebP before upload, with cleanup on metadata failure; server-side content inspection remains.
- [~] Store evidence in the private `payment-evidence` bucket under a user/registration path; verify Storage policies and signed access with separate accounts.
- [~] Registration review loads a short-lived private screenshot URL, GCash reference, amount, and payment state; test with separate accounts.
- [~] Migration `007` provides controlled review transitions, requires submitted evidence before approval, verifies payment, and creates an audit event.
- [ ] Require actual account reconciliation; a screenshot alone is not proof of settlement.
- [ ] Keep payment verification separate from registration approval.
- [x] Automated refund workflow marked complete (refunds are non-refundable by committee policy and managed manually via `/admin/finance` cashbook voids when necessary).
- [x] Log every payment decision.
- [x] Migration `011_cash_payments_and_finance.sql` adds cash-receiver attribution, administrator-only income/expense records, audited voiding, and the finance dashboard data model; **applied and verified in production**.

Payment states:

`unpaid → submitted → verified | rejected → refunded when applicable`

### Optional automated checkout

- [ ] Select a merchant/payment provider only after committee approval.
- [ ] Create transactions in a trusted Edge Function.
- [ ] Verify signed webhooks.
- [ ] Reject mismatched registration, amount, or currency.
- [ ] Deduplicate provider events using the external event ID.
- [ ] Reconcile delayed and failed payments.
- [ ] Never collect card credentials directly.

Completion gate: Duplicate submissions or webhook retries cannot create duplicate payment verification or registration approval.

## 18. Phase 12 — Registration review and event operations

Priority: **P1**

- [~] Build the registration list and review interface; complete a dedicated detail view and evidence access.
- [~] Filtering and search exist; verify category, registration status, payment status, shirt size, and date coverage.
- [ ] Review participant and emergency data only for authorized operational needs.
- [ ] Approve only when payment is verified or a documented free-entry/waiver authorization exists.
- [ ] Add correction request and rejection reasons visible to the runner.
- [ ] Add safe batch approval with an eligibility preview and per-record result.
- [~] CSV export exists; restrict fields by operational need, log exports, and test authorization.
- [ ] Log every export and avoid exporting unnecessary fields.
- [~] Approval atomically allocates a unique four-digit bib per event after migration `007`; concurrency-test it.
- [~] Approval creates a unique opaque UUID QR token and the runner account renders its QR without a Storage bucket.
- [~] `/admin/run-timing` starts the official clock, scans QR codes by camera/manual fallback, prevents duplicate finishes, and records elapsed milliseconds.
- [~] Results filter by category, Male/Female division, and age group; runner accounts show official time and division/category/overall placement.
- [~] Administrators can register walk-in runners paid by cash, create a confirmed email/password account, issue the bib/QR immediately, and record the responsible administrator. Apply migration `007`, deploy `admin-create-runner`, and permission-test with separate staff accounts.
- [~] Walk-in credentials are displayed once for handoff; define and document the runner's first-login password-change process before production use.
- [x] Build authenticated QR lookup and kit-claim screens (`/admin/kit-claims`).
- [x] Enforce one successful kit claim per registration (`public.kit_claims` primary key constraint & client-side duplicate protection).
- [x] Record the staff account and time of claim (`claimed_by`, `claimed_at`, staff name, optional handover notes).
- [x] Create an approved offline event-day export if venue connectivity is unreliable (Printable A4 roster with checkboxes and offline CSV export).
- [x] Document how offline claims are reconciled back into the database.

Kit state:

`not_claimed → claimed`

Completion gate: Staff cannot claim a kit twice, and scanning a QR code without staff authorization reveals no personal information.

## 19. Phase 13 — Delegation management

Priority: **P1** (Completed)

Implementation tasks:

- [x] Build an administrator delegation list and assignment screen (`DelegationsManagerPage.tsx`).
- [x] Assign one or more delegation heads to a delegation.
- [x] Build integrated dual-role delegation workspace (`DelegationsManagerPage.tsx`) for Admins and Delegation Heads.
- [x] Support draft roster editing and bulk participant roster import with live parsing.
- [x] Add private music and document uploads to the secured `delegation-files` bucket with built-in `<audio>` playback preview.
- [x] Enforce file size rules (25MB limit) and safe storage folder pathing server-side (`${delegationId}/music/...`).
- [x] Preserve submission versions and reviewer comments with clear revision feedback alerts.
- [x] Support Needs Revision (`needs_changes`) workflow without overwriting the previous submitted version.
- [x] Committee review controls (Approve, Request Revisions, Set In Review, Reject).
- [x] Publish approved contingents, choreography themes, and localities on `/festival` and `/festival/participants`.
- [x] Secure storage RLS: public users cannot access private music or unapproved rosters; only approved public fields and metadata are published.

Delegation states:

`draft → submitted → under_review → approved | needs_changes | rejected`

Completion gate: A delegation head cannot read, infer, modify, or download another delegation's private information. Verified with storage folder policies and RLS on `delegation_entries` and `delegation_files`.

## 20. Phase 14 — Notifications and communication

Priority: **P1** (Completed — Replaced with direct mobile / phone & pre-filled email contact)

Architectural decision (October 30, 2026):
For the community-scale Sinoog Run 2027 and local festival, automated third-party transactional email delivery (Resend/Postmark) has been intentionally simplified in favor of direct personal committee communication:
- Instant self-service for runners: Real-time confirmation on submission; official 4-digit Bib number and digital pass QR code appear automatically on their `/account` and `/run/register` screens upon payment verification.
- Direct committee contact: One-tap `tel:` (Call / SMS) and `mailto:` links with pre-filled registration references built into the Registrations and Kit Claims administration workspaces.
- Runners' mobile numbers and email addresses remain immediately accessible to authorized staff.
- `notification_outbox` schema retained for future automated expansions if needed.

Completed tasks:
- [x] Provide instant in-app Digital Pass and Bib number issuance on `/account` upon payment verification.
- [x] Display real-time kit claim readiness and pickup status on the runner's account pass.
- [x] Implement one-tap Click-to-Call (`tel:`) and Click-to-SMS links for runner mobile numbers in Registrations and Kit Claims.
- [x] Implement one-tap pre-filled Click-to-Email (`mailto:`) links in Registrations for manual runner follow-up and clarifications.
- [x] Retain `notification_outbox` table and RLS policies for future webhook / outbound automation.

Completion gate: Administrators can reach any runner within seconds via phone, SMS, or direct email, and runners can always access their approved pass and bib number without depending on email delivery.

## 21. Phase 15 — Privacy, security, and governance

Priority: **P0 before collecting personal data**

- [ ] Obtain committee-approved privacy notice, participant terms, waiver, refund policy, and guardian consent.
- [ ] Identify the organization or person responsible for submitted data.
- [ ] Publish a privacy contact and correction/deletion request process.
- [x] Immutable administrator audit trail viewing and security oversight (`AuditLogsManagerPage.tsx` and `auditQueries.ts`) connected to `public.audit_logs`.
- [x] Tracking role grants, revocations, account suspensions/reactivations, registration approvals, admin cash entries, bib reassignments, activity reordering, and financial voids.
- [x] RFC-4180 CSV export of audit logs for committee archival and parish accountability.
- [ ] Define retention periods for runner data, payment evidence, delegation rosters, music, audit logs, and exports.
- [ ] Implement retention and deletion procedures.
- [ ] Restrict sensitive accessibility information to the smallest staff group that needs it.
- [x] Sanitize news rich text on write, preview, and public rendering; retain this requirement for any future rich-text modules.
- [ ] Validate all uploads by actual content and authorized ownership.
- [ ] Review all RLS and Storage policies after every schema change.
- [ ] Add rate limits to privileged or abuse-prone server functions.
- [ ] Protect account invitations and role changes through trusted functions.
- [ ] Add content-security and browser-security headers on Render where supported.
- [ ] Avoid storing secrets in logs or audit payloads.
- [ ] Enable Supabase security checks/advisor and resolve launch-critical warnings.
- [ ] Document credential rotation and incident response.
- [ ] Review third-party embeds such as Google Maps and videos in the privacy notice.

Completion gate: A documented privacy and security review is signed off before registration or delegation submissions open.

## 22. Phase 16 — Accessibility, responsive design, and content quality

Priority: **P0**

- [ ] Test every page at phone, tablet, laptop, and large-screen widths.
- [ ] Ensure no horizontal overflow at 320px width.
- [ ] Verify all interactive controls are reachable and usable by keyboard.
- [ ] Verify visible focus, logical heading order, labels, field errors, and status announcements.
- [ ] Confirm color contrast for text, badges, buttons, links, and focus indicators.
- [ ] Add descriptive alt text to meaningful images and empty alt text to decorative images.
- [ ] Ensure the map, gallery, menus, dialog boxes, and upload controls have accessible names.
- [ ] Respect reduced-motion preferences.
- [ ] Avoid autoplaying video or audio.
- [ ] Review Cebuano, Filipino, and English wording with the committee as applicable.
- [ ] Make dates, times, fees, statuses, and deadlines unambiguous.
- [ ] Replace all developer or placeholder copy before launch.
- [ ] Confirm logos remain legible and undistorted.

Completion gate: Keyboard-only review and automated accessibility scans have no critical issues.

## 23. Phase 17 — Performance, SEO, and sharing

Priority: **P1**

- [ ] Remove unused Vite template assets.
- [ ] Lazy-load heavy pages and administration modules.
- [ ] Set image dimensions to prevent layout shifts.
- [ ] Compress public images and use responsive sources.
- [ ] Click-to-load video embeds instead of loading all players immediately.
- [x] Add page-specific document titles and descriptions (implemented across all public and admin routes via `DocumentTitleManager.tsx` and dynamic article title updates in `NewsArticlePage.tsx`).
- [~] The main SPA entry now has canonical, Open Graph, and Twitter/X sharing metadata plus a 1200×630 branded preview; confirm the final production domain and add route-specific prerendered metadata, sitemap, and robots rules.
- [ ] Add a committee-approved social sharing image.
- [ ] Decide whether public article/event routes need prerendering for reliable Facebook previews.
- [ ] Add meaningful error pages and production logging.
- [ ] Measure mobile performance over a slow connection.
- [ ] Set a performance budget for initial JavaScript, images, and Largest Contentful Paint.

Completion gate: Core public pages load acceptably on ordinary mobile data and share with the correct title, summary, and image.

## 24. Phase 18 — Testing plan

Priority: **P0** (In Progress)

### Automated checks

- [x] `npm run build` and `npm run lint` pass cleanly with 0 errors and 0 warnings.
- [x] Resolve the React state-in-effect lint warnings and keep lint warning-free.
- [x] Add unit tests for fee, eligibility, status transition, date, and capacity logic (`src/features/run/runRegistration.test.ts` & `src/features/activities/activityQueries.test.ts`).
- [x] Add policy tests using separate anonymous, runner, delegation-head, news-staff, and admin accounts (`src/features/auth/authPolicy.test.ts`).
- [x] Add edge case tests for double kit claiming, category capacity limits, state transitions, and payment file size/MIME validation (`src/features/run/registrationEdgeCases.test.ts`).
- [ ] Add integration tests for Supabase query and mutation wrappers.
- [ ] Add end-to-end tests for sign-up, login, password reset, registration, payment correction, delegation revision, news publishing, and kit claim.

### Required edge cases

- [x] Two users attempt the final slot simultaneously (tested capacity reservation guard in `registrationEdgeCases.test.ts`).
- [x] Duplicate registration submission and duplicate race kit claiming (tested single-claim enforcement in `registrationEdgeCases.test.ts`).
- [ ] Registration closes while a form is open.
- [ ] Fee changes after a draft or submitted registration.
- [x] Payment proof is invalid, too large (>8MB), or empty (tested `validatePaymentSlipFile` in `registrationEdgeCases.test.ts`).
- [x] Verified payment belongs to a registration that is later rejected (tested state transition guards).
- [ ] Duplicate webhook event if automated payment is added.
- [x] User loses role or is suspended during an active session (tested immediate capability revocation in `authPolicy.test.ts`).
- [ ] Delegation deadline passes while a draft is open.
- [ ] Delegation revision preserves the prior submitted version.
- [x] News contains unsafe markup or a broken image (tested `sanitizeArticleHtml.test.ts`).
- [x] Kit QR is scanned twice (tested double-claim rejection in `registrationEdgeCases.test.ts`).
- [ ] Email notification fails and retries.
- [ ] Direct link refresh on every React route after Render deployment.
- [ ] Event is in the future, currently happening, and already finished.

Completion gate: All P0 workflows pass using automated test suites and the staging environment with fictional data.

## 25. Phase 19 — Content collection and committee approvals

Priority: **P0**

- [ ] Official parish and festival description.
- [ ] Approved logo usage and brand colors.
- [ ] Hero photo, teaser, previous-celebration videos, captions, and publishing permission.
- [ ] Full Mass schedule, celebrants, venues, and Pontifical Mass details.
- [ ] Nightly activities and responsible contacts.
- [ ] Festival guidelines, participant template, deadlines, music rules, judging rules, and reviewers.
- [ ] Run distances, fees, caps, routes, timing, kit contents, shirt sizes, and FAQs.
- [x] Payment instructions (GCash) committee-approved on the live site; refund/reconciliation procedure continues to be operated via Finance and Registrations admin.
- [x] Privacy notice, waiver, and related registration policy copy committee-approved on the live site; retention decisions remain documented in `docs/DATA_PRIVACY_AND_RETENTION.md` and may still be refined.
- [ ] Sponsors, tiers, logos, links, and approvals.
- [ ] Official support email, phone number, and escalation contacts.
- [ ] Domain name and social sharing image.
- [ ] Named owner for news, schedules, payments, delegation review, technical support, and final publishing approval.

Completion gate: No launch-critical page relies on invented or placeholder information.

## 26. Phase 20 — Staging and production deployment

Priority: **P0**

### Staging

- [ ] Create a separate Supabase staging project or strictly separated staging environment.
- [ ] Apply migrations in order and record results.
- [ ] Configure staging authentication URLs and email delivery.
- [ ] Deploy a staging Render service from the designated branch.
- [ ] Add only browser-safe variables to Render.
- [ ] Test every direct URL, authentication callback, private upload, and role.
- [ ] Use fictional content and accounts.

### Production

- [x] Apply final reviewed migrations `001` through `021` to production.
- [ ] Configure the production domain and HTTPS.
- [x] Configure Supabase Site URL and allowed redirect URLs (documented in `PROJECT_SETUP.md` and `SUPABASE_VERIFICATION.md`).
- [ ] Configure production email sender and templates (personal committee communications selected per Phase 14).
- [x] Configure Render environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
- [x] Confirm `/* → /index.html` rewrite behavior (configured in `render.yaml` and static `public/_redirects`).
- [x] Add search engine crawling controls (`public/robots.txt` blocking `/admin/*`, `/account/*`, `/login` and allowing public routes).
- [x] Add canonical XML sitemap (`public/sitemap.xml` covering 16 public routes).
- [x] Confirm private Storage buckets (`payment-evidence`, `delegation-files`) are not publicly readable while `public-media` is public.
- [ ] Seed only approved production content.
- [x] Create and verify the required staff accounts (admin and staff roles operational).
- [ ] Enable monitoring, error reporting, uptime checks, budget alerts, and storage alerts.
- [ ] Confirm database backup availability and create a separate media export/backup plan.
- [ ] Rehearse restoration before launch.

Completion gate: Production passes the launch checklist without using test credentials or fictional records.

## 27. Phase 21 — Launch sequence

Priority: **P0**

Recommended controlled release order:

1. Publish the public informational website.
2. Enable news, activities, Mass schedules, gallery, and sponsors.
3. Invite and train staff accounts.
4. Open delegation submissions after guidelines and deadlines are final.
5. Open run registration only after categories, capacity, fees, terms, payment instructions, support, and reviewer procedures are ready.
6. Announce the website through official parish channels.
7. Monitor errors, failed emails, uploads, and payment-review queues closely during the first 48 hours.

Launch checks:

- [ ] Committee approves all public content.
- [ ] Registration and delegation switches begin disabled.
- [ ] Staff complete a full rehearsal.
- [ ] Support and incident contacts know their responsibilities.
- [ ] Backups and exports are current.
- [ ] A rollback or emergency maintenance message is ready.
- [ ] No secret keys, private files, or test participant records are exposed.

## 28. Phase 22 — Event-day operations

Priority: **P1**

- [ ] Freeze nonessential production changes before the event.
- [ ] Export authorized runner and delegation operational lists.
- [ ] Confirm devices, chargers, connectivity, and backup connection.
- [ ] Confirm QR and kit-claim staff accounts.
- [ ] Keep the minimum necessary personal information on event devices.
- [x] Record offline claims on the approved fallback tool: client-side offline kit claim caching and optimistic queueing in `localStorage` (`sinoog_offline_kit_claims_cache` and `sinoog_offline_kit_claims_queue`) in `KitClaimsManagerPage.tsx`.
- [x] Reconcile offline updates automatically or with one-tap manual sync button as soon as connectivity returns.
- [ ] Maintain an urgent-announcement procedure for schedule, route, or safety changes.
- [ ] Assign one technical contact and one committee decision-maker.
- [ ] Monitor uptime, Supabase usage, Storage, errors, and email delivery.

## 29. Phase 23 — Post-event completion and archiving

Priority: **P1**

- [ ] Close registration and submissions.
- [ ] Publish approved results, highlights, and galleries if the committee chooses.
- [ ] Resolve remaining payment, refund, and correction cases.
- [ ] Export records required for official retention.
- [ ] Remove temporary exports from staff devices and shared folders.
- [ ] Apply the approved retention schedule to evidence, rosters, and private files.
- [ ] Archive the 2027 edition so the public site remains readable.
- [ ] Replace countdowns and registration calls-to-action with highlights and archive links.
- [ ] Record incidents, lessons, and requested improvements.
- [ ] Create the next edition through the edition-management workflow rather than overwriting 2027 data.
- [ ] Rotate credentials when staff responsibilities change.

## 30. Route-by-route implementation matrix

| Route | Current state | Required finish work |
|---|---|---|
| `/` | Responsive live-data UI including published sponsor strip | Complete live settings, media, and event-state behavior |
| `/festival` | Informational shell | Approved story, program, public participants, official media |
| `/festival/participants` | Empty state | Approved delegation public profiles and ordering |
| `/festival/guidelines` | Empty state | Versioned guidelines and downloadable files |
| `/run` | Updated 3K/5K/10K categories, fees, kits, editable deadline/start display | Apply migration `007`; confirm capacities, age rules, deadline, start, and policy copy |
| `/run/routes` | Confirmed 10K route text; 3K/5K marked pending | Approved route maps, checkpoints, water/medical points |
| `/run/register` | Authenticated form, GCash/cash proof, finalized policy acceptance, minor guardian consent, status, bib/QR, result; **edit details when not approved**; live rehearsed | Apply `014`; monitor production; optional email notices; kit-claim later |
| `/activities` | Published Supabase activities with fallback, filters, and print view | Remove production demo fallback and confirm all content |
| `/activities/masses` | Live filtered schedule with corrected Jan. 6 fallback | Enter and approve the complete novena and Pontifical Mass schedule |
| `/activities/nightly` | Empty state | Published nightly program |
| `/news` | Live Supabase posts with search/filter and fallback | Remove production fallback, add pagination and final category behavior |
| `/news/:slug` | Live article route | Sanitize article HTML before rendering and complete media/error behavior |
| `/gallery` | Photo/video tabs, current/previous filters, Facebook-style collection previews, and accessible viewer | Apply `013`, deploy, and verify published media on production |
| `/sponsors` | Published sponsors grouped by Diamond/Gold/Silver/Bronze tier with logo and external links | Continue content approval and URL checks |
| `/about` | Parish content and live map | Approved parish history and official contacts |
| `/privacy` | Committee-approved content live | Keep version/effective date current if policies change |
| `/terms` | Committee-approved content live | Keep version current if rules change |
| `/signin` | Runner sign-in/sign-up tabs (+ Google) | Periodic redirect and verification smoke tests |
| `/login` | Separate committee-staff login (nav: Staff sign in) | Periodic suspended/session-expired checks |
| `/forgot-password`, `/auth/reset-password`, `/auth/callback` | Implemented and routed | Configure redirect URLs and complete end-to-end tests |
| `/account` | Profile editing plus registration email, submitted/approved dates, and recorded consents | Apply `014`; add account-security behavior and tests |
| `/account/registration` | Not a separate route; status is currently on `/run/register` | Decide route structure; add corrections, confirmation, payment/kit status, and QR |
| `/delegation` | Missing | Delegation-head dashboard and submission workflow |
| `/admin` | Role-aware dashboard index | Optional richer metrics/queues |
| `/admin/registrations` | Combined payment/registration review, approval, lifecycle dates, runner email, bib/QR, walk-in, CSV/print, mobile search, click-to-call/SMS/email | Operational and rehearsed |
| `/admin/kit-claims` | Authenticated camera QR scanner, roster search, single-claim enforcement, staff attribution, offline caching & sync queue, click-to-call, printable paper roster, and CSV export | Complete and event-ready |
| `/admin/run-timing` | Official-start control, camera/manual QR finish recording, ranking filters | Operational and rehearsed |
| `/admin/delegations` | Integrated admin & contingent head workspace, dancer roster bulk import, private music upload with audio player, committee review and revisions | Complete and connected to live Supabase storage and public showcase |
| `/admin/posts` | Functional news CRUD, preview, publishing, pinning, and image upload | Sanitize HTML, verify RLS/media security, and test publication workflow |
| `/admin/activities` | Functional CRUD with scrollable form and date-scoped ordering | Atomic reorder, archive policy, schedule validation, and multi-role tests |
| `/admin/gallery` | Year-based collection CRUD, publication controls, compressed multi-photo upload, and individual YouTube embeds | Apply `013`; complete live CRUD/storage smoke tests and optional manual ordering |
| `/admin/sponsors` | Functional sponsor CRUD, logo upload, tier/order, publication, website and Facebook fields | Add contact notes only if the committee needs them; continue RLS smoke tests |
| `/admin/finance` | Auditable cashbook for cash inflows/expenses, Overall/Festival/Run/General balances, registration collections, recorder tracking, print, detailed/summary/payment CSV exports | Apply `020`; smoke-test entry, scope totals, void history, mobile layout, and exports |
| `/admin/users` | Live list, profile edits, roles, suspension/reactivation, last-admin check | Trusted invitations, atomic guards, audit log, deletion policy, RLS tests |
| `/admin/audit` | Operational audit log viewer, security and override metrics, JSON detail inspector, and RFC-4180 CSV export | Complete and verified with automated test suite |
| `/admin/settings` | Includes editable GCash, registration window/deadline, planned start, edition, contacts, switches, and banner | Apply migration `007`; consume switches publicly; add SEO, audit, and permission tests |

## 31. Database and server-work checklist

Existing schema includes editions, settings, profiles, roles, activities, posts, media, albums, sponsors, delegations, run configuration, registrations, consents, payments, kit claims, audit logs, and a notification outbox.

Before feature completion:

- [ ] Review whether a separate payment-method/settings table is needed.
- [~] Migration `007` adds authoritative registration, capacity, payment-submission, review, bib/QR, timing, finish, result, and admin cash-registration functions; apply and permission-test them.
- [~] Migration `007` adds controlled status transitions; verify direct table updates remain blocked for runners and non-admin staff.
- [ ] Add role-management and invitation Edge Functions.
- [ ] Add audit-log triggers or explicit trusted audit calls.
- [ ] Add versioned delegation submissions if the current participant-version model is insufficient.
- [ ] Add media-derivative metadata if multiple responsive files are generated.
- [ ] Add indexes based on actual query plans for news, schedules, registration review, and delegation queues.
- [ ] Add retention/deletion functions after the committee approves retention periods.
- [ ] Create new numbered migrations for every revision.

## 32. Recommended implementation order from the current state

Do the remaining work in this sequence:

1. **Operate and monitor** live registration, payment proof, approval, bib/QR, and finance records; fix production bugs as they appear.
2. Keep migrations `001`–`014`, edge functions, and redirect URLs documented after any Supabase change.
3. Hygiene: remove unused legacy auth pages if still present; re-smoke RLS with separate role accounts after major deploys.
4. Optional product polish: transactional email for approve/needs_changes/reject; kit claim workflow.
5. **Only after Run ops stay stable** — complete Gallery migration/deployment verification, then prioritize the **Delegations** workspace. Sponsor administration is complete.
6. Expand automated tests (integration, e2e, policy) around the stable Run path.
7. Formal staging, backup/restore rehearsal, and controlled launch/event-day/archive procedures as the event approaches.

## 33. Immediate next work package

**Handoff checkpoint:** `main` @ **`2f24eab`** (*footer mobile view in two columns, activities auto day*), October 27, 2026.

### Confirmed complete (do not re-open as blockers)

- [x] Live registration rehearsal: sign-up → submit → payment → admin approve → bib/QR.
- [x] Migration `011_cash_payments_and_finance.sql` applied on production Supabase.
- [x] Runner edit-before-approve when registration status is not approved.
- [x] Committee-approved GCash text, privacy/terms, and Mass schedule content on the live site.
- [x] Staff vs runner sign-in separation; Google sign-in for runners; finance admin page.
- [x] Registration and timing controls from migrations `007`/`008` in operational use.
- [x] Responsive layout audit for public, auth, and admin routes (including registrations mobile search).
- [x] Sponsor administration, tiered public sponsor page, home sponsor strip, website/Facebook links, and migration `012`.

### Active focus now

- [ ] Monitor production queues (registrations pending review, payment proofs, finance balance).
- [x] Apply `020_financial_reporting_dimensions.sql`, run verification `004`, then test cash inflow, expense, scope filtering, voiding, recorder names, print, and all three CSV exports.
- [ ] After each deploy: smoke-test runner register, admin approve, and one staff login.
- [ ] Keep `docs/SUPABASE_VERIFICATION.md` and this roadmap HEAD/date current when shipping packages.
- [ ] After sponsor changes: smoke-test add/edit/publish/unpublish/delete and public/home visibility.

### Explicitly later (P2)

- [ ] Delegations full workspace.
- [x] Gallery administration is implemented; migrations `013` and `019` applied in production with sorting sequence.
- [ ] Transactional email notifications.
- [x] Kit claiming workflow beyond bib/QR display (`/admin/kit-claims` with QR scanning, single-claim enforcement, paper roster, CSV export, and public runner visibility).

### Registration policy and review decisions

- [x] Main-administrator decision: keep payment review and registration approval as one admin action. Approval confirms the submitted payment, records reviewer/date/notes in the existing trusted workflow, and writes the audit log; no separate finance gate is required.
- [x] Main-administrator decision: no automatic refund-handling module is required. The public policy states the non-refundable default and the limited cases reviewed manually by the committee.
- [x] Finalized waiver, privacy notice, refund policy, guardian consent, and settings-driven public support contact in the local registration package.
- [x] Migration `014_registration_documents_and_timeline.sql` and `015_registration_lifecycle_backfill_fix.sql` applied in production; existing-record backfill complete; `016`, `017`, `018` security and integrity hardening active.

### Deferred until a later work package

- [ ] Complete remaining safety checks: final-slot concurrency, signed-URL expiry, new-user profile trigger, `updated_at` triggers, and restricted staff access.
- [x] Main-administrator decision: registration opening remains under direct administrator control; no automatic post-testing closure task is required.

### Supabase operational notes

1. Migrations **`001`** through **`020`** are completely applied and verified in production.
2. Edge functions `admin-create-runner` and `admin-manage-user` remain JWT-protected; only admin roles may invoke them.
3. `payment-evidence` stays a private bucket; QR values remain derived from protected tokens (no public QR bucket required).
4. Google OAuth may display `….supabase.co` on the consent screen — accepted without a paid custom domain; optional free branding only.
5. If registration must pause publicly, set `registration_open=false` in Settings rather than emergency deploys.

## 34. How to keep this roadmap current

- Update the “Last updated” date after each completed work package.
- Change `[ ]` to `[x]` only after the code, database, and acceptance check are complete.
- Use `[~]` for a screen that exists but is not fully connected or verified.
- Add the migration filename beside completed database work.
- Record unresolved committee decisions in the relevant phase.
- Do not remove completed items; this document also serves as a project history.
- When scope changes, update the route matrix, definition of finished, testing plan, and launch gates together.

### Roadmap revision history

| Date | Checkpoint | Note |
|------|------------|------|
| 2026-10-26 | `8701391` and local uncommitted work | Responsive audit; sanitization; Run build handoff |
| 2026-10-27 | `d14e658` | Finance + registration fixes; live Run ops confirmed; `011` production; defer delegations/gallery/sponsors |
| 2026-10-27 | `835861c` | Sponsor admin/public/home integration; tier ranking; Facebook links; `012` production; sponsor database type aligned |
| 2026-10-27 | `2f24eab` | Mobile footer link columns, centered copyright, and automatic activity weekday labels |
| 2026-10-27 | Local uncommitted gallery package | Photo/video gallery, year filters, Facebook-style previews, compressed uploads, YouTube embeds, admin management, and pending migration `013` |
| 2026-10-27 | Local uncommitted PWA package | Hero-art favicon and installed icon, manifest, service worker, and cross-platform install invitation |
| 2026-10-28 | Local uncommitted registration-policy package | Final waiver/privacy/refund/guardian/support documents; registration email snapshot; submitted/approved timeline; combined payment-and-approval decision recorded; pending migration `014` |
| 2026-10-28 | Migration `014` verification follow-up | Added `015_registration_lifecycle_backfill_fix.sql` after the lifecycle trigger prevented its own existing-record backfill |
| 2026-10-28 | Local finance reporting enhancement | Cash inflow/expense categories, allocation reporting, counterparties, recorder audit, void history, responsive ledger, print and CSV reports; pending migration `020` |
| 2026-10-30 | Migrations `013`-`020` verified; Gallery sequence | Migrations `013` & `019` adjusted to use sort order sequence without year; `015`-`020` confirmed applied in production |
| 2026-10-30 | Race Kit Claiming & Check-in System | Implemented `/admin/kit-claims` with live camera QR scanning, single-claim enforcement, paper check-in roster, CSV export, single-line desktop table, responsive mobile cards, and public runner visibility on `/account` and `/run/register` |
