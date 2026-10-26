# Sinoog 2027 Website — Master Build Roadmap

Last updated: October 26, 2026 — responsive audit, production-data safety, article sanitization, tests, build, and lint
Project folder: `E:\Programs\Sinoog 2027`  
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
- Initial administrator account: `rieldiango24@gmail.com`

The novena begins January 6, 2027. The individual Mass times, celebrants, venues, and confirmation of the complete novena and Pontifical Mass schedule still require parish approval.

## 2. Status legend and priorities

- `[x]` completed in the source code
- `[ ]` still required
- `[~]` started or represented by a placeholder, but not operational
- **P0** required before public launch or before collecting data
- **P1** required for the principal event workflows
- **P2** valuable after the critical workflows are stable

## 3. Current implementation snapshot

Audit basis: source tree, route configuration, feature queries, admin screens, Git state, `npm run build`, and `npm run lint` inspected on October 26, 2026. Database contents and Render production behavior were not independently verified during this audit.

### Completed foundation

- [x] React 19 and TypeScript project created with Vite.
- [x] Responsive public navigation, footer, page layouts, parish/committee logos, and official church map.
- [x] Public routes for home, festival, participants, guidelines, run, routes, registration, activities, Masses, nightly activities, news, gallery, sponsors, about, privacy, terms, login, and 404.
- [x] Protected committee workspace with overview, registrations, delegations, posts, activities, users, and settings routes.
- [x] Supabase browser client configured through safe `VITE_` variables.
- [x] Shared `AuthProvider` loads session, profile, roles, suspension state, and role-derived access flags.
- [x] Shared `RequireRole`, access-denied page, session loading state, and sign-out flow.
- [x] Shared toast, loading, empty, error, and confirmation-dialog components.
- [x] Typed database model file exists at `src/types/database.ts`.
- [x] Feature query modules exist for editions/settings, activities, posts, run data, and public media.
- [x] Public Home, Activities, News, News Article, Run, and Run Registration pages request live Supabase data with local fallback behavior.
- [x] Activities administration supports list, create, edit, publish/unpublish, and delete operations.
- [x] The Create/Edit Activity dialog is viewport-scrollable, and activity ordering is automatically grouped by Manila activity date. Administrators can reorder same-date activities without changing other dates.
- [x] News administration supports list, search/filter, create, edit, preview, publish/unpublish, pin/unpin, image upload, and delete operations.
- [x] Settings administration edits edition identity, dates, registration switch, contact information, feature switches, and announcement-banner values.
- [x] A runner registration form, own-registration status view, payment-evidence upload flow, and a registration-review screen have been implemented in source.
- [x] Initial schema, RLS/Storage policies, optional seed, first-admin, and corrected-novena-date migrations exist through `005`.
- [x] Git repository exists on `main` and tracks `origin/main`; initial commit `d3b4890` is on GitHub.
- [x] `.gitignore` protects environment files, dependencies, build output, Supabase local state, logs, and key files.
- [x] Runner sign-in/sign-up, email confirmation handling, password recovery/reset, and profile editing screens exist and are routed.
- [x] Administrator user management lists accounts and supports profile edits, staff-role assignment/removal, suspension/reactivation, self-suspension prevention, and a last-admin check in source.
- [x] Current production build and lint checks pass (October 26, 2026).

### Implemented but not yet production-ready

- [x] Production queries no longer replace empty/error Supabase responses with demonstration activities or news. Local fallback records are limited to an unconfigured Vite development session.
- [x] The fallback edition and Opening Novena Mass use the corrected January 6, 2027 date (commit `4e63545`).
- [x] Public articles, admin preview, and post create/update paths use a strict DOMPurify allowlist; automated tests cover executable markup, unsafe attributes/URLs, and approved formatting.
- [~] Activities, News, and Settings CRUD exist but require live Supabase role, RLS, error, and publication testing.
- [~] `/admin/registrations` uses trusted review functions from migrations `007` and `008`; live permission and workflow verification remains, and payment verification still needs to be separated from registration approval.
- [~] Migration `007` provides server-authoritative capacity, fee, registration window, consent snapshot, and reference generation; apply/permission/concurrency verification remains.
- [~] Payment evidence upload exists but requires file validation, reconciliation rules, cleanup after partial failure, and reviewer/payment-status administration.
- [~] The waiver and privacy wording in the registration form is hard-coded draft text and has not been committee-approved or versioned from live configuration.
- [~] Public media upload validates browser MIME type and size but does not yet perform trusted content inspection, metadata stripping, derivatives, or cleanup.
- [~] Feature switches and announcement-banner values can be saved, but public layouts do not yet consistently consume them.
- [~] Gallery, sponsors, festival participants, guidelines, and delegations remain placeholder or generic screens.
- [~] User administration is implemented in source but still needs live RLS/role testing, atomic last-admin protection, trusted invitations, and audit logging.
- [~] The latest committed checkpoint is `8701391`; the activity query/page/style changes, this roadmap update, and a separate existing `PublicLayout.tsx` edit are currently uncommitted.
- [x] Vite 8 vendor chunking and the lazy timing route keep generated chunks below the configured warning threshold.
- [x] Lint exits with zero warnings; the prior state-in-effect warnings were corrected.
- [~] Privacy notice and participant terms remain drafts pending committee approval.

### Not yet implemented

- [~] Runner sign-up, email confirmation flow, password recovery/reset, and profile editing are implemented; production redirect URLs, verification enforcement before registration, and end-to-end tests remain.
- [~] Migration `007` contains the authoritative registration and transition functions; live Supabase application and permission/concurrency verification remain.
- [ ] Complete payment-review screen, verified-payment requirement, refund handling, and audit trail.
- [~] Unique bib allocation and opaque QR confirmation are implemented; authenticated kit lookup and kit claiming remain.
- [ ] Delegation-head workspace, assignment, roster submission, private music upload, revisions, and approval.
- [ ] Sponsor and gallery administration connected to Supabase.
- [~] Role CRUD, last-admin check, suspension, and reactivation UI exist; trusted staff invitations, database-atomic last-admin enforcement, deletion policy, and audit events remain.
- [ ] Transactional email provider and retryable notifications.
- [ ] Application audit-event creation for sensitive actions.
- [ ] Automated unit, integration, end-to-end, and RLS permission tests.
- [ ] Verified Render production configuration, Supabase redirect URLs, monitoring, backups, and recovery rehearsal.

### Immediate P0 corrections before opening registration or publishing staff-authored HTML

1. Stop returning published demonstration records on live Supabase errors; show an honest empty/error state instead.
2. Sanitize stored article HTML before preview and public rendering; add an allowlist and tests.
3. Move run fee, category, capacity, eligibility, registration-window, reference, consent-version, and submission logic into an atomic database function or trusted Edge Function.
4. Move registration/payment review transitions into controlled server/database functions and require verified payment (or documented free-entry authority) before approval.
5. Keep `registration_open=false` until the committee approves distances, fees, capacity, waiver, privacy notice, payment instructions, refund rules, and support ownership.
6. Validate payment-evidence file content/size, clean up failed uploads, and complete reviewer/payment-status administration.
7. Verify user/role RLS with separate accounts and make last-admin protection atomic in the database.
8. Commit and push the activity dialog/order changes after review, or isolate unfinished work on a development branch.

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
- [x] Application work through commit `8701391` is committed on `main`; only the latest activity dialog/order and related layout/style edits remain uncommitted at this checkpoint.
- [~] Use `main` as the production branch. Local `main` tracks `origin/main`; branch-protection status is not yet verified.
- [x] `.github/workflows/ci.yml` runs exact dependency installation, lint, unit tests, and the production build for pushes and pull requests targeting `main` or `develop`.
- [ ] Create a separate development or staging workflow.
- [ ] Add issue labels such as `P0`, `P1`, `P2`, `frontend`, `supabase`, `content`, `security`, and `launch`.
- [ ] Copy this roadmap into GitHub issues or a project board without losing the acceptance criteria.

Completion gate: A clean checkout can run `npm install`, `npm run build`, and `npm run dev` using `.env.example` as the configuration guide.

## 7. Phase 1 — Verify the Supabase foundation

Priority: **P0**

### Apply and verify migrations

- [ ] Confirm `001_schema.sql` completed successfully.
- [ ] Confirm `002_security_and_storage.sql` completed successfully.
- [ ] Confirm the corrected `003_seed_placeholders.sql` was applied only if placeholder records are wanted.
- [ ] Run `004_promote_first_admin.sql` and confirm the result shows `rieldiango24@gmail.com` with `admin` and `public_user` roles.
- [ ] Run `005_correct_novena_start_date.sql` and confirm the result shows run date January 9, novena start January 6, and fiesta date January 15.
- [~] `SUPABASE_VERIFICATION.md` now provides the migration record; fill in the applied date, method, verifier, and result from the live Supabase project.
- [ ] Do not treat the optional activity seed as official content; it remains draft until reviewed.

### Inspect database objects

- [ ] Confirm all required enums, tables, indexes, foreign keys, triggers, and helper functions exist.
- [ ] Confirm Storage buckets exist: `public-media`, `payment-evidence`, and `delegation-files`.
- [ ] Confirm the profile-creation trigger works for a newly created test user.
- [ ] Confirm `updated_at` triggers change timestamps during updates.
- [~] A typed database model exists at `src/types/database.ts`; verify it matches the current live Supabase schema and document how it was generated.
- [x] Document a repeatable linked-project type-generation process in `SUPABASE_VERIFICATION.md`.

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

- [~] Feature folders exist for auth, content, activities, editions, media, run, users, and shared UI. Delegations, sponsors, and a dedicated payment-review module still need implementation.
- [~] Typed Supabase queries exist for editions/settings, activities, posts, run records, and public media; complete the remaining modules and verify all return/error types.
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

- [x] Provide runner sign-in and sign-up in `RunnerAuthPage.tsx`; `/signup` redirects to its sign-up tab. A separate unused `SignUpPage.tsx` remains and should be removed or intentionally adopted.
- [~] Google sign-in is implemented for runner and staff entry screens with a safe `/auth/callback` return path; enable the Google provider and production redirect allowlist in Supabase/Google, then test new and existing accounts.
- [~] Supabase email confirmation handling exists; explicitly block final registration until the email is verified and test it.
- [x] Create and route `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, and `AuthCallbackPage.tsx`.
- [ ] Configure Supabase redirect URLs for local, staging, and production environments.
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

Priority: **P0**

- [x] Build and route a dedicated `SettingsPage.tsx` instead of the generic admin list page.
- [~] Settings edit parish name, public location, timezone, contacts, and Facebook link. Committee-name handling still needs a dedicated setting if required.
- [x] Edit edition name, run date, novena start date, fiesta date, and registration-open state.
- [~] Save switches for registration, delegation submission, sponsor display, gallery display, and announcement banner. Connect every switch to its public route and validate expiry behavior.
- [ ] Add registration opening and closing timestamps.
- [~] Announcement text, enabled state, and severity can be saved; public rendering and expiry enforcement remain.
- [ ] Add editable SEO title, description, social image, and canonical domain.
- [ ] Add an edition archive/create workflow for future Sinoog celebrations.
- [ ] Restrict edition changes to administrators and audit every change.

Completion gate: The committee can change operational details without editing source code.

## 11. Phase 5 — Activities, novena, and Mass schedules

Priority: **P0**

- [x] Build and route a dedicated `ActivitiesManagerPage.tsx`.
- [~] Create, edit, publish/unpublish, filter, and delete activities. Migration `009_atomic_activity_reordering.sql` replaces browser multi-row updates with one edition-locked trusted reorder function and audit event; apply and concurrency-test it, then define the archival policy.
- [x] Make the Create/Edit Activity dialog scroll within short browser viewports.
- [x] Automatically group activity order by Manila date and calculate the next order number for the selected date.
- [x] Support types: Mass, Sinoog Run, festival, nightly activity, and other.
- [~] Support start/end time, venue, description, and celebrant. Contact and related-notice fields are not yet modeled.
- [ ] Add schedule validation so end time cannot precede start time.
- [ ] Confirm and enter the complete novena and Pontifical Mass schedule.
- [~] Draft migration `006_seed_2027_mass_and_fiesta_schedule.sql` has been prepared from the supplied 2026 parish posters: January 6-13 novena Masses, January 14 Vesper Mass, January 15 Fiesta Masses, and January 16 Liwas Mass/Sakay-Sakay. All celebrants are blank and all records remain drafts until the committee confirms the 2027 schedule.
- [ ] Clearly distinguish unconfirmed, changed, and cancelled events.
- [ ] Add schedule filters and a printer-friendly view.
- [ ] Add calendar download files when dates are final.
- [ ] Add a “last updated” time for schedule changes.
- [ ] Allow urgent schedule changes to trigger an announcement.

Completion gate: A staff member can publish an accurate schedule, correct one event, and have the change appear publicly without a deployment.

## 12. Phase 6 — News and announcements CMS

Priority: **P0**

- [~] `PostsManagerPage.tsx` combines the list and editor modal. Split into separate route files later only if maintainability requires it.
- [~] Supports title, slug, excerpt, raw HTML body, category, featured image, and pinned state. Attached gallery, related event, and visible author attribution remain.
- [x] Implement draft, published, and archived states.
- [x] Add article preview before saving/publishing.
- [x] Sanitize formatted article content before persistence, admin preview, and public rendering with a strict DOMPurify allowlist and automated security tests.
- [x] Prevent duplicate slugs inside one edition in the query layer and database constraint.
- [ ] Add image alt text, captions, and credits.
- [ ] Add publish and correction timestamps.
- [x] Add search and category filtering on the public News page.
- [ ] Add related posts and share links.
- [ ] Consider scheduled publishing only after ordinary publishing is stable.
- [ ] Audit who created, edited, published, unpublished, or archived a post.

Completion gate: A `news_in_charge` user can publish and correct an article but cannot access unrelated private modules.

## 13. Phase 7 — Media processing and gallery

Priority: **P1**

- [ ] Build the public media upload pipeline.
- [ ] Validate file type, actual content, file size, dimensions, and upload ownership on the server side.
- [ ] Correct image orientation and strip location metadata.
- [ ] Create responsive WebP derivatives, with an appropriate fallback if required.
- [ ] Keep posters readable; use less aggressive compression for graphics containing text.
- [ ] Define original-file retention and storage quotas.
- [ ] Add upload progress, retry, cancellation, and failure cleanup.
- [ ] Build `GalleryManagerPage.tsx` with albums by year and event.
- [ ] Add album title, slug, description, cover, ordering, captions, credits, alt text, and publication state.
- [ ] Add an accessible public lightbox with keyboard and close controls.
- [ ] Add approved video URLs, thumbnails, and click-to-load embeds.
- [ ] Confirm permission to publish media involving children, performers, music, or third-party footage.
- [ ] Keep payment evidence and delegation files entirely separate from public media processing.

Completion gate: An authorized editor can upload a large phone photo, publish optimized derivatives, and view them correctly on mobile without exposing the original private staging object.

## 14. Phase 8 — Sponsors

Priority: **P1**

- [ ] Build `SponsorsManagerPage.tsx`.
- [ ] Create sponsor records with name, approved logo, website, contact notes, and active state.
- [ ] Assign sponsors to the 2027 edition and a recognition tier.
- [ ] Define tier order and logo-size rules.
- [ ] Preview the sponsor page before publishing.
- [ ] Validate external website URLs.
- [ ] Use meaningful alt text and retain correct logo proportions.
- [ ] Record committee approval before publishing a logo or website link.

Completion gate: Sponsor order and tier presentation can be changed without source edits.

## 15. Phase 9 — Sinoog Run configuration

Priority: **P0 before registration opens**

The committee must supply the following before this phase can be completed:

- Official distance categories
- Fee for each category
- Participant limits
- Minimum and maximum ages
- Registration opening and closing dates (editable after migration `007`; official deadline remains unconfirmed)
- Route approval
- Assembly and gun-start times (planned time is editable; official race-day start is recorded separately by an administrator)
- Cut-off rules
- Kit contents and shirt sizes
- Payment methods and verified recipients (GCash `09260265423` is configured; account name/recipient verification remains pending)
- Refund, transfer, cancellation, and no-show policies
- Participant waiver, privacy notice, and guardian-consent requirements

Implementation tasks:

- [~] Core GCash, opening/deadline, planned start, and registration switch settings are in Website Settings; a complete category/capacity configuration screen remains.
- [ ] Manage categories, distance in meters, fee in centavos, capacity, age limits, publication state, and ordering.
- [ ] Manage the official route map, route notes, water stations, medical posts, start, and finish.
- [ ] Add kit preview images and inclusion descriptions.
- [ ] Validate that registration cannot open until all required configuration exists.
- [ ] Show remaining capacity only if the committee chooses to make it public.
- [ ] Define how long an unpaid entry reserves a slot.
- [ ] Define how expired reservations and late payment submissions are handled.
- [ ] Publish FAQs and runner instructions.

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
- [~] GCash JPG/PNG/WebP screenshots are canvas-reencoded to WebP before upload, with cleanup on metadata failure; server-side content inspection remains.
- [~] Store evidence in the private `payment-evidence` bucket under a user/registration path; verify Storage policies and signed access with separate accounts.
- [~] Registration review loads a short-lived private screenshot URL, GCash reference, amount, and payment state; test with separate accounts.
- [~] Migration `007` provides controlled review transitions, requires submitted evidence before approval, verifies payment, and creates an audit event.
- [ ] Require actual account reconciliation; a screenshot alone is not proof of settlement.
- [ ] Keep payment verification separate from registration approval.
- [ ] Provide a paid-but-rejected resolution and refund-recording workflow.
- [ ] Log every payment decision.

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
- [ ] Build authenticated QR lookup and kit-claim screens.
- [ ] Enforce one successful kit claim per registration.
- [ ] Record the staff account and time of claim.
- [ ] Create an approved offline event-day export if venue connectivity is unreliable.
- [ ] Document how offline claims are reconciled back into the database.

Kit state:

`not_claimed → claimed`

Completion gate: Staff cannot claim a kit twice, and scanning a QR code without staff authorization reveals no personal information.

## 19. Phase 13 — Delegation management

Priority: **P1**

Committee information still needed:

- Eligibility and participation rules
- Required participant fields and positions
- Submission and revision deadlines
- Music types, file-size limit, accepted formats, and maximum duration
- Required documents and naming rules
- Judging criteria, reviewers, and publication rules

Implementation tasks:

- [ ] Build an administrator delegation list and assignment screen.
- [ ] Assign one or more delegation heads to a delegation.
- [ ] Build `DelegationDashboardPage.tsx` and `DelegationSubmissionPage.tsx`.
- [ ] Support draft roster editing and validated spreadsheet import with a preview.
- [ ] Add private music and document uploads.
- [ ] Enforce file rules and submission deadlines server-side.
- [ ] Preserve submission versions and reviewer comments.
- [ ] Support Needs Revision without overwriting the previous submitted version.
- [ ] Lock approved entries after the deadline.
- [ ] Add an auditable administrator override.
- [ ] Publish only approved public profile fields and photos.
- [ ] Never publish private roster or music files.

Delegation states:

`draft → submitted → under_review → approved | needs_changes | rejected`

Completion gate: A delegation head cannot read, infer, modify, or download another delegation's private information.

## 20. Phase 14 — Notifications and communication

Priority: **P1**

- [ ] Choose and configure a transactional email provider.
- [ ] Configure a verified sending domain and sender identity.
- [ ] Create email templates for account verification, password reset, registration changes, payment changes, delegation review, and urgent schedule updates.
- [ ] Use `notification_outbox` for retryable delivery.
- [ ] Add idempotency so retries do not send repeated approval emails.
- [ ] Record delivery status and limited error information.
- [ ] Avoid placing excessive private information in email bodies.
- [ ] Add a visible in-app status even if email fails.
- [ ] Define the committee member responsible for answering support requests.

Completion gate: A failed email can be retried without repeating the underlying approval action.

## 21. Phase 15 — Privacy, security, and governance

Priority: **P0 before collecting personal data**

- [ ] Obtain committee-approved privacy notice, participant terms, waiver, refund policy, and guardian consent.
- [ ] Identify the organization or person responsible for submitted data.
- [ ] Publish a privacy contact and correction/deletion request process.
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
- [ ] Add page-specific document titles and descriptions.
- [~] The main SPA entry now has canonical, Open Graph, and Twitter/X sharing metadata plus a 1200×630 branded preview; confirm the final production domain and add route-specific prerendered metadata, sitemap, and robots rules.
- [ ] Add a committee-approved social sharing image.
- [ ] Decide whether public article/event routes need prerendering for reliable Facebook previews.
- [ ] Add meaningful error pages and production logging.
- [ ] Measure mobile performance over a slow connection.
- [ ] Set a performance budget for initial JavaScript, images, and Largest Contentful Paint.

Completion gate: Core public pages load acceptably on ordinary mobile data and share with the correct title, summary, and image.

## 24. Phase 18 — Testing plan

Priority: **P0**

### Automated checks

- [x] `npm run build` and `npm run lint` pass as of October 26, 2026.
- [x] Resolve the React state-in-effect lint warnings and keep lint warning-free.
- [ ] Add unit tests for fee, eligibility, status transition, date, and capacity logic.
- [ ] Add integration tests for Supabase query and mutation wrappers.
- [ ] Add end-to-end tests for sign-up, login, password reset, registration, payment correction, delegation revision, news publishing, and kit claim.
- [ ] Add policy tests using separate anonymous, runner, delegation-head, news-staff, and admin accounts.

### Required edge cases

- [ ] Two users attempt the final slot simultaneously.
- [ ] Duplicate registration submission.
- [ ] Registration closes while a form is open.
- [ ] Fee changes after a draft or submitted registration.
- [ ] Payment proof is invalid, too large, interrupted, or submitted twice.
- [ ] Verified payment belongs to a registration that is later rejected.
- [ ] Duplicate webhook event if automated payment is added.
- [ ] User loses role or is suspended during an active session.
- [ ] Delegation deadline passes while a draft is open.
- [ ] Delegation revision preserves the prior submitted version.
- [ ] News contains unsafe markup or a broken image.
- [ ] Kit QR is scanned twice.
- [ ] Email notification fails and retries.
- [ ] Direct link refresh on every React route after Render deployment.
- [ ] Event is in the future, currently happening, and already finished.

Completion gate: All P0 workflows pass using the staging environment with fictional data.

## 25. Phase 19 — Content collection and committee approvals

Priority: **P0**

- [ ] Official parish and festival description.
- [ ] Approved logo usage and brand colors.
- [ ] Hero photo, teaser, previous-celebration videos, captions, and publishing permission.
- [ ] Full Mass schedule, celebrants, venues, and Pontifical Mass details.
- [ ] Nightly activities and responsible contacts.
- [ ] Festival guidelines, participant template, deadlines, music rules, judging rules, and reviewers.
- [ ] Run distances, fees, caps, routes, timing, kit contents, shirt sizes, and FAQs.
- [ ] Payment instructions, reviewer, refund policy, and reconciliation procedure.
- [ ] Privacy notice, waiver, guardian consent, and data-retention decisions.
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

- [ ] Apply final reviewed migrations to production.
- [ ] Configure the production domain and HTTPS.
- [ ] Configure Supabase Site URL and allowed redirect URLs.
- [ ] Configure production email sender and templates.
- [ ] Configure Render environment variables.
- [ ] Confirm `/* → /index.html` rewrite behavior.
- [ ] Confirm private Storage buckets are not publicly readable.
- [ ] Seed only approved production content.
- [ ] Create and verify the required staff accounts.
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
- [ ] Record offline claims on the approved fallback sheet or tool.
- [ ] Reconcile offline updates as soon as connectivity returns.
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
| `/` | Responsive UI with Supabase queries and local fallbacks | Remove production demo fallbacks; complete live settings, media, sponsors, and event-state behavior |
| `/festival` | Informational shell | Approved story, program, public participants, official media |
| `/festival/participants` | Empty state | Approved delegation public profiles and ordering |
| `/festival/guidelines` | Empty state | Versioned guidelines and downloadable files |
| `/run` | Updated 3K/5K/10K categories, fees, kits, editable deadline/start display | Apply migration `007`; confirm capacities, age rules, deadline, start, and policy copy |
| `/run/routes` | Confirmed 10K route text; 3K/5K marked pending | Approved route maps, checkpoints, water/medical points |
| `/run/register` | Authenticated form, full address/division, compressed GCash proof, approval status, bib/QR, official result | Apply/test migration `007`; approved waiver/privacy and recovery/correction flows |
| `/activities` | Published Supabase activities with fallback, filters, and print view | Remove production demo fallback and confirm all content |
| `/activities/masses` | Live filtered schedule with corrected Jan. 6 fallback | Enter and approve the complete novena and Pontifical Mass schedule |
| `/activities/nightly` | Empty state | Published nightly program |
| `/news` | Live Supabase posts with search/filter and fallback | Remove production fallback, add pagination and final category behavior |
| `/news/:slug` | Live article route | Sanitize article HTML before rendering and complete media/error behavior |
| `/gallery` | Visual placeholders | Published albums, optimized media, accessible viewer |
| `/sponsors` | Empty state | Published sponsors grouped by tier |
| `/about` | Parish content and live map | Approved parish history and official contacts |
| `/privacy` | Draft | Approved privacy notice and effective/version date |
| `/terms` | Draft | Approved run terms, waiver, refund and guardian rules |
| `/signin` | Runner sign-in/sign-up tabs | Verify email-confirmation and production redirect behavior |
| `/login` | Separate committee-staff Supabase login | Verify suspended/session-expired behavior and production redirects |
| `/forgot-password`, `/auth/reset-password`, `/auth/callback` | Implemented and routed | Configure redirect URLs and complete end-to-end tests |
| `/account` | Profile editing implemented | Resolve lint warning; add account-security behavior and tests |
| `/account/registration` | Not a separate route; status is currently on `/run/register` | Decide route structure; add corrections, confirmation, payment/kit status, and QR |
| `/delegation` | Missing | Delegation-head dashboard and submission workflow |
| `/admin` | Dashboard shell | Live metrics, queues, alerts, readiness checklist |
| `/admin/registrations` | GCash evidence review, trusted approval call, unique bib/QR display, CSV and printable approved-runner cards | Apply/test migration `007`; batch safety, export audit, refund/correction workflows |
| `/admin/run-timing` | Official-start control, camera/manual QR finish recording, ranking filters | Apply/test migration `007`; device rehearsal, offline contingency, result correction/audit policy |
| `/admin/delegations` | Generic empty table | Assignments, review, revisions, deadlines, files |
| `/admin/posts` | Functional news CRUD, preview, publishing, pinning, and image upload | Sanitize HTML, verify RLS/media security, and test publication workflow |
| `/admin/activities` | Functional CRUD with scrollable form and date-scoped ordering | Atomic reorder, archive policy, schedule validation, and multi-role tests |
| `/admin/gallery` | Missing | Album and media management |
| `/admin/sponsors` | Missing | Sponsor and tier management |
| `/admin/users` | Live list, profile edits, roles, suspension/reactivation, last-admin check | Trusted invitations, atomic guards, audit log, deletion policy, RLS tests |
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

1. Review, commit, and push the current activity dialog/date-order changes; keep `main` deployable.
2. Verify migrations `001`–`005`, first-admin roles, Storage buckets, and the complete RLS matrix in the live Supabase project.
3. Remove published demo fallbacks from configured production behavior and sanitize all staff-authored HTML.
4. Resolve the two lint warnings and add route-level code splitting before the application grows further.
5. Apply and permission-test migration `007`, then deploy the `admin-create-runner` Edge Function for safe runner-account creation.
6. Complete payment evidence validation, reconciliation, review, correction, refund, and audit behavior.
7. Finalize privacy, terms, waiver, refund rules, contacts, event configuration, and committee-owned content.
8. Complete registration review, notification, safe export, QR, bib, and kit claiming.
9. Build delegation assignment, submission, private upload, revision, and review.
10. Build gallery and sponsor administration.
11. Add unit, integration, end-to-end, accessibility, performance, and permission tests.
12. Verify Render/Supabase production configuration, rehearse on staging, and follow controlled launch/event-day/archive procedures.

## 33. Immediate next work package

The next development session should complete this exact work package before registration is opened:

- [x] Review and harden the activity form for desktop and short/mobile viewports: the dialog is viewport-bounded, scrollable, closable, and its two-column fields collapse on phones.
- [ ] Verify activity ordering with two dates and multiple same-date activities; reordering one date must not change the other date.
- [~] Migration `009_atomic_activity_reordering.sql` and the updated activity client replace multi-update reordering with one atomic, audited function; apply it and verify two concurrent administrator edits.
- [ ] Commit and push the current activity changes; record the new commit here.
- [ ] Confirm migrations `001`–`005`, `rieldiango24@gmail.com` roles, Storage buckets, and live schema/type alignment.
- [ ] Test anonymous, runner, news staff, delegation head, administrator, and suspended-user access using separate accounts and direct Supabase requests.
- [x] Remove published demo fallback behavior in production and show honest loading/empty/error/retry states.
- [x] Sanitize article HTML during save, admin preview, and public rendering with a strict allowlist and automated unsafe-markup tests.
- [~] Apply migration `007` and deploy `admin-create-runner`; then test online GCash and walk-in cash registration end to end with separate accounts.
- [ ] Keep `registration_open=false` until the terms, privacy notice, waiver, fees, capacity, payment/refund process, and support contact are approved.

Current handoff checkpoint: `main` is at commit `8701391`. The working tree contains this roadmap update, the latest activity query/page/style changes, and a separate existing `PublicLayout.tsx` edit at the time of this audit. `npm run build` and `npm run lint` pass; lint has two warnings, and the build reports a large-chunk warning.

Do not begin collecting runner or delegation personal information until the privacy notice, terms, retention rules, payment process, and permission tests are complete.

### Supabase handoff for the current Sinoog Run build

1. Run the full `supabase/migrations/007_run_registration_workflow.sql` file again in the Supabase SQL Editor. It is intentionally repeatable and now includes walk-in cash registration, `registration_source`, `registered_by`, capacity locking, bib/QR allocation, official timing, and result functions.
2. From the project root, authenticate and link the Supabase CLI, then deploy `supabase/functions/admin-create-runner/index.ts` as the `admin-create-runner` Edge Function. Keep JWT verification enabled.
3. Run `supabase/migrations/010_admin_account_deletion.sql` in the Supabase SQL Editor. It permits controlled profile cleanup: personal runner records cascade, while official content, timing records, claims, and audit history remain with deleted-user attribution cleared.
4. Deploy `supabase/functions/admin-manage-user/index.ts` as the `admin-manage-user` Edge Function with JWT verification enabled. This protected function powers administrator-created staff accounts, complete user editing, optional password resets, deletion previews, guarded account deletion, private payment-evidence cleanup, and administrator audit tracking without exposing the service-role key to the browser.
5. No QR bucket is required. QR images are rendered from the protected UUID token stored in `run_registrations.qr_token`.
6. Confirm that `payment-evidence` is a private bucket with a 5 MB limit and only `image/jpeg`, `image/png`, and `image/webp`. The browser re-encodes screenshots to WebP and targets 1.5 MB before upload. Migration `007` applies the bucket settings; migration `002` contains the owner/admin Storage policies.
7. Confirm the signed-in staff account has an `admin` row in `user_roles`; the Edge Functions refuse all other roles.
8. Test one online GCash runner and one administrator-created cash runner. Confirm account login, unique bib, unique QR, `registration_source`, `registered_by`, payment status, CSV, print layout, official start, finish scan, and runner result.

The read-only `supabase/verification/001_foundation_verification.sql` detail query, consolidated `002_foundation_summary.sql`, and `SUPABASE_VERIFICATION.md` checklist cover the first live verification pass for tables, enums, trusted functions, buckets, RLS, policies, triggers, the first administrator, event dates, run configuration, and operational indexes. CLI migration history is unavailable because the current migrations were applied through the SQL Editor, so the manual record is authoritative.

Foundation verification result on October 26, 2026: 12 operational checks passed, CLI migration history was informational, and the only failed expectation was the launch-state guard because live registration is currently open. The administrator confirmed that registration should remain open temporarily for deployment testing. Close it after testing unless the committee explicitly approves public launch. Detailed role, Storage, concurrency, and end-to-end workflow tests are still required.

### Registration and timing controls — migration 008

- [x] Approved runners see “Registered” on their selected category and all other category registration buttons are disabled.
- [x] Runner Account shows the complete submitted registration, payment/result status, emergency details, and the recorded waiver/privacy acceptances.
- [x] Approval accepts submitted or already verified payment records; verified cash registrations do not require uploaded evidence.
- [x] Rejected entries can be deleted by an administrator or their owning runner, after which the runner can register again. Approved entries are protected from deletion in both the interface and database.
- [x] Race timing has a working refresh state, a live HH:MM:SS elapsed clock, and a confirmed full timing reset.
- [x] A timing reset clears the official start and all finish records but preserves runners, bib numbers, and QR codes.
- [x] Route changes now return the window to the top of the newly opened page.
- [ ] Run `supabase/migrations/008_run_registration_and_timing_controls.sql` manually in Supabase before testing these controls on Render.
- [ ] Acceptance-test approve → request changes → approve, rejected → delete → re-register, approved deletion protection, live clock, finish scan, and timing reset using non-production test accounts.

### Responsive layout audit

- [x] Rechecked all current public, authentication, and committee workspace routes for fixed-width and horizontal-overflow risks.
- [x] Converted posts, users, and run-registration admin rows into stacked cards below 760px instead of horizontally scrolling tables.
- [x] Made activity, post, payment, registration, and settings form grids collapse to one column on phones.
- [x] Added consistent viewport-safe scrolling and padding for every modal dialog.
- [x] Improved the mobile registration stepper and category cards, including keyboard-accessible category selection.
- [x] Hardened long article content, embedded media, account text, toolbars, action buttons, and top-bar text against overflow.
- [x] Added accessible labels/tooltips to the compact committee navigation.
- [x] Verified the responsive changes with clean lint and a successful production build.

## 34. How to keep this roadmap current

- Update the “Last updated” date after each completed work package.
- Change `[ ]` to `[x]` only after the code, database, and acceptance check are complete.
- Use `[~]` for a screen that exists but is not fully connected or verified.
- Add the migration filename beside completed database work.
- Record unresolved committee decisions in the relevant phase.
- Do not remove completed items; this document also serves as a project history.
- When scope changes, update the route matrix, definition of finished, testing plan, and launch gates together.
