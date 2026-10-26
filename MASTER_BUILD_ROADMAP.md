# Sinoog 2027 Website — Master Build Roadmap

Last updated: October 26, 2026  
Project folder: `E:\Programs\Sinoog 2027`  
Purpose: This is the primary implementation checklist and handoff document for taking the website from its current foundation to production, event-day operation, and post-event archiving.

## 1. Confirmed project information

- Website and event edition: **Sinoog 2027**
- Parish: **Sto. Niño Parish — Guinacot, Guindulman, Bohol**
- Organizer: **Sinoog Committee**
- Sinoog Run: **January 9, 2027**
- Stated start of novena: **January 9, 2027**
- Fiesta and Sinoog Festival: **January 15, 2027**
- Official timezone: **Asia/Manila**
- Frontend: React, TypeScript, Vite, React Router
- Backend: Supabase Postgres, Auth, Storage, and later Edge Functions where needed
- Source control: GitHub
- Frontend hosting: Render Static Site
- Initial administrator account: `rieldiango24@gmail.com`

The complete novena schedule still requires parish confirmation. January 9 through January 15 contains seven calendar dates, so the website must not invent nine Mass dates or celebrants.

## 2. Status legend and priorities

- `[x]` completed in the source code
- `[ ]` still required
- `[~]` started or represented by a placeholder, but not operational
- **P0** required before public launch or before collecting data
- **P1** required for the principal event workflows
- **P2** valuable after the critical workflows are stable

## 3. Current implementation snapshot

### Completed foundation

- [x] React and TypeScript project created with Vite.
- [x] Responsive public navigation, footer, and page layout.
- [x] Public routes for home, festival, participants, guidelines, run, routes, registration, activities, Masses, nightly activities, news, gallery, sponsors, about, privacy, terms, login, and 404.
- [x] Committee workspace routes for overview, registrations, delegations, posts, activities, users, and settings.
- [x] Supabase client configuration using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- [x] Email/password login screen.
- [x] Protected `/admin` route that checks the Supabase `admin` role.
- [x] Admin sign-out behavior.
- [x] Parish and committee logos integrated into the public and admin interfaces.
- [x] Optimized 512×512 WebP version of the parish logo while preserving its original PNG.
- [x] Official Google Maps embed added to the About page.
- [x] Responsive visual system using parish wine, celebration gold, paper cream, Fraunces, and DM Sans.
- [x] Render static-site configuration with SPA routing fallback.
- [x] Initial SQL schema, access policies, Storage buckets, placeholder data, and first-admin script.
- [x] Production build and lint checks passing at the time of this document.

### Present but still placeholders

- [~] Public news pages currently use local demonstration content.
- [~] Public activity and Mass pages currently use local placeholder data.
- [~] Festival participants and guidelines pages show pending-content states.
- [~] Run page, route page, kit information, and registration page show pending states.
- [~] Gallery uses visual placeholders rather than Supabase media.
- [~] Sponsors page has no database-backed sponsor list.
- [~] Admin lists are interface shells without connected CRUD operations.
- [~] Privacy notice and participant terms are drafts pending committee review.

### Not yet implemented

- [ ] Public runner account creation, email verification, password recovery, and account dashboard.
- [ ] Full admin CRUD for all modules.
- [ ] Run registration, payment evidence, review, approval, status tracking, bibs, QR confirmation, and kit claiming.
- [ ] Delegation-head workspace, roster submission, music upload, revisions, and approval.
- [ ] News rich-text editor and media processing.
- [ ] Transactional email notifications.
- [ ] Audit-event creation from application actions.
- [ ] Automated tests and permission tests.
- [ ] GitHub repository and production deployment verification.

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

- [ ] Initialize Git in `E:\Programs\Sinoog 2027` if it is not already a repository.
- [ ] Create the GitHub repository, preferably named `sinoog-2027`.
- [ ] Confirm `.gitignore` excludes `.env`, `.env.local`, `node_modules`, `dist`, editor files, logs, and temporary uploads.
- [ ] Commit the application source, SQL migrations, documentation, logos, and `render.yaml`.
- [ ] Use `main` as the protected production branch.
- [ ] Require successful build and lint checks before merging changes.
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
- [ ] Record which migrations were applied and when.
- [ ] Do not treat the optional activity seed as official content; it remains draft until reviewed.

### Inspect database objects

- [ ] Confirm all required enums, tables, indexes, foreign keys, triggers, and helper functions exist.
- [ ] Confirm Storage buckets exist: `public-media`, `payment-evidence`, and `delegation-files`.
- [ ] Confirm the profile-creation trigger works for a newly created test user.
- [ ] Confirm `updated_at` triggers change timestamps during updates.
- [ ] Generate TypeScript database types and save them under `src/types/database.ts`.
- [ ] Add a repeatable command or documented process for regenerating types after migrations.

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

- [ ] Create feature folders: `features/auth`, `features/content`, `features/activities`, `features/run`, `features/delegations`, `features/media`, `features/sponsors`, and `features/admin`.
- [ ] Add typed Supabase query functions for every feature.
- [ ] Add a shared authentication/session provider.
- [ ] Add role and profile loading to a shared account context.
- [ ] Handle authentication refresh and expired sessions.
- [ ] Replace local arrays in `src/data/siteData.ts` with Supabase queries.
- [ ] Keep a small explicit fallback only for maintenance or initial loading; do not display demonstration content as official production content.
- [ ] Add reusable loading, empty, error, access-denied, and retry components.
- [ ] Add form validation schemas for user-facing and admin forms.
- [ ] Add a consistent notification/toast system.
- [ ] Add confirmation dialogs only for consequential actions such as publishing, approving, suspending, refund recording, and kit claims.
- [ ] Add error reporting without logging passwords, tokens, payment evidence, rosters, or sensitive form payloads.

Completion gate: Public pages load live draft-filtered or published data from Supabase, and failure states are understandable.

## 9. Phase 3 — Authentication and account management

Priority: **P0**

### Public account flows

- [ ] Create a separate `SignUpPage.tsx` for runners.
- [ ] Require email verification before final registration submission.
- [ ] Create `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, and `AuthCallbackPage.tsx`.
- [ ] Configure Supabase redirect URLs for local, staging, and production environments.
- [ ] Create `AccountPage.tsx` for name, mobile number, and locality.
- [ ] Show clear errors for invalid credentials, unverified email, suspended account, and insufficient role.
- [ ] Add rate limiting or bot protection to exposed forms if abuse appears.

### Staff and role management

- [ ] Replace the admin user-list shell with real data.
- [ ] Invite staff accounts through a trusted server function; never expose the service-role key to the browser.
- [ ] Assign and remove `delegation_head`, `news_in_charge`, and `admin` roles.
- [ ] Prevent self-promotion through public sign-up.
- [ ] Prevent removal or suspension of the last active administrator.
- [ ] Support suspension, reactivation, and controlled deletion.
- [ ] Log staff invitations, role changes, suspensions, and reactivations.
- [ ] Add a visible access-denied page instead of silently redirecting every unauthorized user.

Completion gate: Password recovery, session expiry, invitation, role assignment, suspension, and last-admin protection have been tested.

## 10. Phase 4 — Site settings and edition management

Priority: **P0**

- [ ] Build a real `SettingsPage.tsx` rather than using the generic admin list page.
- [ ] Edit parish name, public location, timezone, committee name, official contacts, and social links.
- [ ] Edit edition dates and display labels.
- [ ] Add feature switches for registration, delegation submission, sponsor display, gallery display, and emergency announcements.
- [ ] Add registration opening and closing timestamps.
- [ ] Add a public announcement banner with severity and expiry.
- [ ] Add editable SEO title, description, social image, and canonical domain.
- [ ] Add an edition archive/create workflow for future Sinoog celebrations.
- [ ] Restrict edition changes to administrators and audit every change.

Completion gate: The committee can change operational details without editing source code.

## 11. Phase 5 — Activities, novena, and Mass schedules

Priority: **P0**

- [ ] Build a dedicated `ActivitiesManagerPage.tsx`.
- [ ] Create, edit, preview, publish, unpublish, reorder, and archive activities.
- [ ] Support types: Mass, Sinoog Run, festival, nightly activity, and other.
- [ ] Support start/end time, venue, description, celebrant, contact, and related notice.
- [ ] Add schedule validation so end time cannot precede start time.
- [ ] Confirm and enter the complete novena and Pontifical Mass schedule.
- [ ] Clearly distinguish unconfirmed, changed, and cancelled events.
- [ ] Add schedule filters and a printer-friendly view.
- [ ] Add calendar download files when dates are final.
- [ ] Add a “last updated” time for schedule changes.
- [ ] Allow urgent schedule changes to trigger an announcement.

Completion gate: A staff member can publish an accurate schedule, correct one event, and have the change appear publicly without a deployment.

## 12. Phase 6 — News and announcements CMS

Priority: **P0**

- [ ] Build `PostsPage.tsx` and `PostEditorPage.tsx`.
- [ ] Support title, slug, excerpt, formatted body, category, featured image, attached gallery, related event, author, and pinned state.
- [ ] Implement draft, published, and archived states.
- [ ] Add preview before publishing.
- [ ] Sanitize formatted article content before display.
- [ ] Prevent duplicate slugs inside one edition.
- [ ] Add image alt text, captions, and credits.
- [ ] Add publish and correction timestamps.
- [ ] Add search and category filtering on the public News page.
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
- Registration opening and closing dates
- Route approval
- Assembly and gun-start times
- Cut-off rules
- Kit contents and shirt sizes
- Payment methods and verified recipients
- Refund, transfer, cancellation, and no-show policies
- Participant waiver, privacy notice, and guardian-consent requirements

Implementation tasks:

- [ ] Build a dedicated run configuration admin page.
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

- [ ] Participant name
- [ ] Birth date only where eligibility or category logic requires it
- [ ] Mobile number and locality
- [ ] Distance category
- [ ] Shirt size
- [ ] Optional club or team
- [ ] Emergency contact name, relationship, and mobile number
- [ ] Accessibility or assistance request with restricted staff visibility
- [ ] Required acceptance of the current event terms and privacy notice
- [ ] Guardian details and consent when minors are allowed
- [ ] Separate optional consent for promotional use

### Registration workflow

- [ ] Build a multi-step registration form with progress, back navigation, validation, and draft preservation.
- [ ] Verify the account email before submission.
- [ ] Calculate authoritative category, eligibility, capacity, and fee on the server.
- [ ] Create a unique, non-guessable registration reference.
- [ ] Store snapshots of participant data, fee, currency, category, and consent versions.
- [ ] Enforce one registration per user for the run edition.
- [ ] Protect the final slot from simultaneous registration attempts using a transaction or atomic database function.
- [ ] Add a My Registration page with registration, payment, and kit statuses shown separately.
- [ ] Support committee requests for correction without deleting the registration.
- [ ] Support runner cancellation under the approved policy.
- [ ] Add confirmation emails for submission, correction request, approval, rejection, cancellation, and payment changes.

Registration states:

`draft → submitted → under_review → approved | needs_changes | rejected | cancelled`

Completion gate: Two simulated users competing for the final slot cannot exceed capacity, and a runner cannot see another runner's record.

## 17. Phase 11 — Payments

Priority: **P0 before paid registration opens**

### Manual-payment first release

- [ ] Add administrator-configured payment methods, instructions, recipient name, and official account identifier.
- [ ] Display the exact fee snapshot and currency.
- [ ] Allow runner to submit a payment reference and private proof file.
- [ ] Validate evidence type and size.
- [ ] Store evidence in the private `payment-evidence` bucket under an authorized user path.
- [ ] Build a payment review queue.
- [ ] Let authorized reviewers verify or reject a payment with a reason.
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

- [ ] Build the registration list and detail pages.
- [ ] Filter by category, registration status, payment status, shirt size, date, and search term.
- [ ] Review participant and emergency data only for authorized operational needs.
- [ ] Approve only when payment is verified or a documented free-entry/waiver authorization exists.
- [ ] Add correction request and rejection reasons visible to the runner.
- [ ] Add safe batch approval with an eligibility preview and per-record result.
- [ ] Export authorized lists by category and shirt size.
- [ ] Log every export and avoid exporting unnecessary fields.
- [ ] Allocate bib numbers with uniqueness enforcement.
- [ ] Generate a QR confirmation containing only an opaque reference.
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
- [ ] Sanitize rich text and protect against unsafe HTML.
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
- [ ] Add canonical URLs, sitemap, robots rules, and social sharing metadata.
- [ ] Add a committee-approved social sharing image.
- [ ] Decide whether public article/event routes need prerendering for reliable Facebook previews.
- [ ] Add meaningful error pages and production logging.
- [ ] Measure mobile performance over a slow connection.
- [ ] Set a performance budget for initial JavaScript, images, and Largest Contentful Paint.

Completion gate: Core public pages load acceptably on ordinary mobile data and share with the correct title, summary, and image.

## 24. Phase 18 — Testing plan

Priority: **P0**

### Automated checks

- [ ] Keep `npm run build` and `npm run lint` passing.
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
| `/` | Responsive UI with local data | Live settings, published activities/news, real media, sponsor data, event-state behavior |
| `/festival` | Informational shell | Approved story, program, public participants, official media |
| `/festival/participants` | Empty state | Approved delegation public profiles and ordering |
| `/festival/guidelines` | Empty state | Versioned guidelines and downloadable files |
| `/run` | Informational shell | Live categories, fees, capacity, timing, kit, FAQs |
| `/run/routes` | Empty route state | Approved route maps and operational points |
| `/run/register` | Closed placeholder | Account, multi-step form, payment, consent, submission |
| `/activities` | Local placeholder data | Published live activities and filtering |
| `/activities/masses` | Local placeholder data | Confirmed novena and Pontifical Mass schedule |
| `/activities/nightly` | Empty state | Published nightly program |
| `/news` | Local placeholder data | Live search, categories, pinned posts, pagination |
| `/news/:slug` | Local article shell | Sanitized live article and media data |
| `/gallery` | Visual placeholders | Published albums, optimized media, accessible viewer |
| `/sponsors` | Empty state | Published sponsors grouped by tier |
| `/about` | Parish content and live map | Approved parish history and official contacts |
| `/privacy` | Draft | Approved privacy notice and effective/version date |
| `/terms` | Draft | Approved run terms, waiver, refund and guardian rules |
| `/login` | Supabase login | Password recovery, suspended/access-denied handling |
| `/account` | Missing | Profile and account security |
| `/account/registration` | Missing | Runner status, corrections, proof, confirmation, QR |
| `/delegation` | Missing | Delegation-head dashboard and submission workflow |
| `/admin` | Dashboard shell | Live metrics, queues, alerts, readiness checklist |
| `/admin/registrations` | Generic empty table | Full list, filters, detail, review, export, batch actions |
| `/admin/delegations` | Generic empty table | Assignments, review, revisions, deadlines, files |
| `/admin/posts` | Generic empty table | News list, editor, preview, publish workflow |
| `/admin/activities` | Generic empty table | Activity and Mass schedule CRUD |
| `/admin/gallery` | Missing | Album and media management |
| `/admin/sponsors` | Missing | Sponsor and tier management |
| `/admin/users` | Generic empty table | Invitations, roles, suspension, last-admin protection |
| `/admin/settings` | Generic empty table | Edition, contacts, features, payment, SEO, banners |

## 31. Database and server-work checklist

Existing schema includes editions, settings, profiles, roles, activities, posts, media, albums, sponsors, delegations, run configuration, registrations, consents, payments, kit claims, audit logs, and a notification outbox.

Before feature completion:

- [ ] Review whether a separate payment-method/settings table is needed.
- [ ] Add authoritative database functions for registration submission and capacity reservation.
- [ ] Add controlled functions for status transitions rather than allowing arbitrary status updates.
- [ ] Add role-management and invitation Edge Functions.
- [ ] Add audit-log triggers or explicit trusted audit calls.
- [ ] Add versioned delegation submissions if the current participant-version model is insufficient.
- [ ] Add media-derivative metadata if multiple responsive files are generated.
- [ ] Add indexes based on actual query plans for news, schedules, registration review, and delegation queues.
- [ ] Add retention/deletion functions after the committee approves retention periods.
- [ ] Create new numbered migrations for every revision.

## 32. Recommended implementation order from the current state

Do the remaining work in this sequence:

1. Run and verify the first-admin SQL.
2. Put the project in GitHub and protect secrets.
3. Generate Supabase database types.
4. Build the shared authentication/profile/role context.
5. Replace local public content with live published queries.
6. Build Settings and Activities CRUD.
7. Build News CRUD and safe media upload.
8. Finalize privacy, terms, contacts, and committee-owned content.
9. Configure the Sinoog Run and build registration.
10. Build manual-payment submission and review.
11. Build registration approval, notification, export, QR, and kit claiming.
12. Build delegation assignment, submission, upload, revision, and review.
13. Build gallery and sponsor administration.
14. Complete permission, accessibility, performance, and end-to-end testing.
15. Deploy staging, conduct committee rehearsal, then deploy production.
16. Follow the controlled launch, event-day, and post-event procedures.

## 33. Immediate next work package

The next development session should complete this exact work package before moving to registration:

- [ ] Confirm `004_promote_first_admin.sql` succeeded.
- [ ] Create the GitHub repository and first clean commit.
- [ ] Generate Supabase TypeScript types.
- [ ] Add a shared authenticated-user and roles provider.
- [ ] Build real loading, denied, and session-expired states.
- [ ] Connect editions, settings, published activities, and published posts to Supabase.
- [ ] Replace `siteData.ts` placeholders on public pages.
- [ ] Build dedicated Settings and Activities administration pages.
- [ ] Verify role and publication policies with multiple accounts.

Do not begin collecting runner or delegation personal information until the privacy notice, terms, retention rules, payment process, and permission tests are complete.

## 34. How to keep this roadmap current

- Update the “Last updated” date after each completed work package.
- Change `[ ]` to `[x]` only after the code, database, and acceptance check are complete.
- Use `[~]` for a screen that exists but is not fully connected or verified.
- Add the migration filename beside completed database work.
- Record unresolved committee decisions in the relevant phase.
- Do not remove completed items; this document also serves as a project history.
- When scope changes, update the route matrix, definition of finished, testing plan, and launch gates together.
