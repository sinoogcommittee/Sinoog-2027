# Sinoog 2027 — Website Development Plan

Planning baseline: October 26, 2026. The year was changed to 2027 at the organizer’s direction. Dates and parish information below are organizer-provided; detailed programs remain subject to committee confirmation.

## 1. Project identity and scope

- Website: **Sinoog 2027**
- Local project folder: **Sinoog 2027**
- Suggested GitHub repository: `sinoog-2027`
- Parish: **Sto. Niño Parish — Guinacot, Guindulman, Bohol**
- Organizing body: **Sinoog Committee**
- Sinoog Run: **January 9, 2027**
- Start of novena Masses: **January 6, 2027**
- Fiesta and Sinoog Festival: **January 15, 2027**
- Time zone: **Asia/Manila**

The novena begins January 6, 2027. Confirm the individual Mass dates, times, celebrants, venues, and the Pontifical Mass schedule with the parish before publication. Nightly activities remain unpublished until supplied.

Build a public information website plus three connected workspaces: a runner account area, a delegation submission area, and a committee administration area. General visitors should browse without signing in. Accounts are required for private submissions and registration tracking.

Make the content year-aware using an event edition record. Keep the 2027 launch focused, while allowing future committees to archive an edition and create the next one without rebuilding the website.

## 2. Public pages

| Page | Route | Main content |
|---|---|---|
| Home | `/` | Hero, key dates, registration CTA, previous celebration videos, teasers, latest headlines, upcoming activities, sponsors |
| Festival | `/festival` | Festival story, confirmed date and venue, program, links to participants and guidelines |
| Participants | `/festival/participants` | Approved delegation profiles, group photos, locality, presentation order when finalized |
| Guidelines | `/festival/guidelines` | Versioned guidelines, eligibility, deadlines, judging criteria if supplied, downloadable documents |
| Gallery | `/gallery` | Albums filtered by edition and event; photo viewer, captions, credits, videos |
| Sinoog Run | `/run` | Approved distances, fees, inclusions, kit previews, gun times, rules, FAQs, registration status |
| Run routes | `/run/routes` | Map per distance, downloadable route image, start/finish, water stations and medical points once confirmed |
| Run registration | `/run/register` | Guided registration, fee summary, payment instructions and submission receipt |
| Activities | `/activities` | Unified program with filters for Masses, festival, run and nightly activities |
| Mass schedule | `/activities/masses` | Novena and Pontifical Masses, date, time, venue, celebrant and schedule changes |
| Nightly activities | `/activities/nightly` | Date-based programs, venues, performers and event details |
| News | `/news` | Searchable published posts, categories, pinned announcements |
| Article | `/news/:slug` | Full title, article, images, author credit, dates, related event and share link |
| Sponsors | `/sponsors` | Approved sponsors by tier, logos, names and approved website links |
| About and contact | `/about` | Parish, committee, location, official contact channels and Facebook link |
| Policy pages | `/privacy`, `/terms` | Data-use notice, registration terms, waiver and applicable event policies |

Do not invent distances, prices, celebrants or sponsors. Use editable placeholders in administration; hide empty public sections or show “Details to be announced.” Registration remains closed until the committee completes the required configuration.

### Home page order

1. Parish identity, festival name, hero photo or poster, date and location.
2. Primary actions: Register for Sinoog Run; View Fiesta Schedule; Explore the Festival.
3. Key-date strip for January 9 and January 15.
4. Teaser video with a poster image and click-to-play control.
5. Previous celebration highlights and archive link.
6. Three to six latest headlines linking to full news articles.
7. Upcoming Masses and activities, followed by sponsors and contact details.

Use a countdown only before the relevant event. Afterward, replace it with highlights and the gallery. Do not autoplay large videos on mobile data.

## 3. Accounts and permissions

| Role | Allowed actions |
|---|---|
| Visitor | Read published content and public delegation profiles |
| Public user / runner | Manage own profile, submit own registration and payment evidence, view own statuses and confirmation |
| Delegation head | All ordinary account features plus manage submissions for assigned delegation only |
| News in charge | Create, edit and publish news and related public media; no runner payments or private delegation lists |
| Admin | Manage website content, schedules, sponsors, registrations, payments, delegations, user invitations and assigned roles |

Allow multiple roles per account. A delegation head may also register as a runner. Staff access is granted through invitations or an existing administrator; public sign-up must never allow role selection.

User management includes invitation, profile updates, role assignment, suspension, reactivation and controlled deletion. Keep an audit history for sensitive actions. Do not allow removal of the last active administrator. Use suspension for ordinary access removal; handle permanent deletion and related record retention deliberately.

Add an optional run-reviewer role later if volunteers need access to registration without full administrative access.

## 4. Sinoog Run workflow

### Registration fields

- Account email; participant name; date of birth only if age eligibility or categories require it.
- Mobile number and locality; avoid collecting a full street address without a clear need.
- Distance category, shirt size and optional club/team.
- Emergency contact name, relationship and mobile number.
- Required agreement to the current event rules and waiver; store the accepted version and timestamp.
- Guardian details and consent when minors are permitted.
- Separate, optional consent for promotional use; do not bundle this with essential registration.
- Accessibility or assistance request, if useful; keep sensitive information minimal and restrict staff access.

### Participant journey

1. Verify account email and choose an available distance.
2. Enter participant details and accept the current terms.
3. Server validates eligibility, registration window, fee and capacity; creates a unique reference and fee snapshot.
4. Show the exact amount and configured payment methods.
5. Participant submits payment reference and proof, or completes hosted checkout if a gateway is enabled.
6. Committee verifies payment and reviews the registration.
7. Participant sees the outcome in My Registration and receives a confirmation email when approved.
8. Approved participants receive their bib allocation, kit-claim instructions and a QR confirmation when these are ready.

### Separate status records

- Registration: `draft → submitted → under_review → approved / needs_changes / rejected`; support cancellation with recorded reason.
- Payment: `unpaid → submitted → verified / rejected`; support refund tracking if the committee offers refunds.
- Kit: `not_claimed → claimed`, with staff member and timestamp.

Payment verification must not automatically imply registration approval. Paid-but-rejected cases need a visible resolution or refund workflow. Return a rejected payment for correction without discarding the registration.

For a practical first release, support committee-approved manual methods such as GCash transfer, bank transfer or payment at the parish office. Publish only verified recipient instructions. A screenshot is evidence for review, not proof of settlement; reviewers reconcile amount and reference against actual receipts. Do not describe manual transfers as an automated payment gateway.

Automated checkout is an optional later integration after merchant approval and provider selection. Use server-created transactions, signed webhooks, repeat-event protection and reconciliation. Never trust a browser success page as the payment record. Never collect card credentials directly.

### Operational safeguards

- Unique registration per participant account and run edition for the initial scope; one runner per account. Group/family entries are a separate later feature.
- Enforce caps and duplicate protection in the database, including simultaneous submissions.
- Store fee and category snapshots so later price edits do not change existing registrations.
- Define how long unpaid entries reserve a slot, when reservations expire, and whether late payments need manual review.
- Approval requires verified payment, or an explicitly recorded waiver/free-entry authorization.
- Batch approval is limited to eligible selected records, with a confirmation summary and per-record results.
- Export authorized registration lists by category and shirt size; log exports and avoid public attendee lists.
- QR codes contain an opaque reference, not personal data. Staff must sign in before viewing private information or marking a kit claimed.

## 5. Delegation submissions

Each head sees only the assigned delegation and its edition-specific entry. Store the delegation name, locality, head’s contact, participant roster, required positions, uploaded music, and requested documents.

Recommended flow: Draft → Submitted → Under review → Approved or Needs revision. Preserve the previous submitted version and reviewer comments when revisions are requested. Lock approved entries after the deadline, with an auditable administrator override.

Provide a downloadable roster template and a validated import preview. Set file type, size and audio duration requirements in configuration. Allow safe preview/download for authorized reviewers. Keep rosters and music private; publish only selected approved profile fields and photos. Guideline files must have version numbers and effective dates.

## 6. News, media and content management

Provide a familiar Create Post screen: title, rich-text body, featured image, gallery, category, related event, image captions and preview. Use `draft`, `published` and `archived` states; scheduling is a useful second-stage enhancement. Keep correction timestamps and identify who published a post.

Sanitize formatted content to prevent unsafe markup. Validate uploads on the server as well as in the browser. Accept approved image formats, correct orientation, strip location metadata, and create responsive WebP variants plus JPEG fallback where needed. Suggested starting widths are 480, 960 and 1600 pixels; tune compression against actual festival photos. Maintain aspect ratios, captions and alt text. Large posters must retain readable text.

Browser compression can improve upload speed, but a trusted processing step must still validate and generate the final public assets. Use a dedicated processing worker if the chosen workload exceeds function limits. Set explicit file-size and storage quotas; do not assume image optimization is unlimited or included in every service tier.

Use a restricted staging area for new uploads, then publish approved derivatives. Decide whether originals should be retained and for how long. Keep payment evidence and delegation documents outside public media buckets, without lossy processing that could obscure review details.

Use approved video URLs with thumbnails and click-to-load embeds for teasers and previous celebrations. Offer an ordinary watch link if an embed fails. Check permission to publish photos, music and videos, especially material involving minors.

## 7. Application architecture

- Development: VS Code, Node.js, React, TypeScript and Vite.
- Frontend: React Router, reusable layouts and components, responsive CSS or Tailwind, validated forms.
- Data: Supabase Postgres, Auth and Storage.
- Trusted operations: Supabase Edge Functions and carefully scoped database functions.
- Source control: GitHub with a protected production branch and pull-request checks.
- Hosting: Render Static Site for the built frontend.
- Email: Supabase Auth email configuration plus a transactional email provider for application notifications, selected before launch.

Supabase Edge Functions support server-side TypeScript and webhook integrations. Use them for privileged account actions, payment integration and notification dispatch; apply authorization on every request. Source: [Supabase Edge Functions](https://supabase.com/docs/guides/functions).

Enforce access in database Row Level Security and Storage policies, as well as in the interface. Public users read only published content; runners read only their own registrations; delegation heads read assigned entries; news staff cannot read payment proofs. Secret/service credentials bypass ordinary protections and belong only in trusted server environments. Sources: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

## 8. Proposed folder structure

```text
Sinoog 2027/
  public/
  src/
    app/                 # Router, providers and route access rules
    components/          # Reusable UI: navigation, cards, forms, tables
    layouts/             # PublicLayout, AccountLayout, AdminLayout
    pages/
      public/
        HomePage.tsx
        FestivalPage.tsx
        ParticipantsPage.tsx
        GuidelinesPage.tsx
        GalleryPage.tsx
        RunPage.tsx
        RunRoutesPage.tsx
        RunRegistrationPage.tsx
        ActivitiesPage.tsx
        MassSchedulePage.tsx
        NightlyActivitiesPage.tsx
        NewsPage.tsx
        NewsArticlePage.tsx
        SponsorsPage.tsx
        AboutPage.tsx
        PrivacyPage.tsx
        TermsPage.tsx
        NotFoundPage.tsx
      auth/
        LoginPage.tsx
        SignUpPage.tsx
        ForgotPasswordPage.tsx
        ResetPasswordPage.tsx
        AuthCallbackPage.tsx
      account/
        AccountPage.tsx
        MyRegistrationPage.tsx
        DelegationDashboardPage.tsx
        DelegationSubmissionPage.tsx
      admin/
        AdminDashboardPage.tsx
        RegistrationsPage.tsx
        RegistrationDetailPage.tsx
        PaymentsPage.tsx
        DelegationsPage.tsx
        DelegationDetailPage.tsx
        PostsPage.tsx
        PostEditorPage.tsx
        ActivitiesManagerPage.tsx
        GalleryManagerPage.tsx
        SponsorsManagerPage.tsx
        UsersPage.tsx
        SettingsPage.tsx
    features/            # Run, delegation, news and media logic
    hooks/
    lib/                 # Supabase client, validation and formatting
    types/               # Generated database types and app types
    styles/
  supabase/
    migrations/
    functions/
    seed.sql             # Development data only
  docs/
  .env.example
  render.yaml
  package.json
  README.md
```

Keep each route in a separate `.tsx` file, as requested. Move shared forms and data access into feature folders so page files stay easy to follow. Never commit actual credentials or real registration records.

## 9. Proposed database model

| Tables | Purpose |
|---|---|
| `editions`, `site_settings` | Edition dates, branding, contacts, publication and registration switches |
| `profiles`, `user_roles` | Account profile and administrator-controlled role assignments |
| `activities`, `mass_details` | Unified event calendar plus celebrant and Mass-specific data |
| `posts`, `post_media` | News content, categories, publication state and attached media |
| `media_assets`, `albums`, `album_items`, `videos` | Files, metadata, annual galleries and approved video links |
| `sponsors`, `edition_sponsors` | Sponsor identity, edition tier, logo, order and approval |
| `delegations`, `delegation_memberships` | Groups and assigned heads |
| `delegation_entries`, `delegation_versions`, `delegation_participants`, `delegation_files` | Year-specific submission, revisions, private roster and music |
| `run_events`, `run_categories`, `run_routes` | Run settings, distance, fee, capacity, route and kit information |
| `run_registrations`, `registration_consents` | Participant snapshot, category, status, reference and accepted terms |
| `payments`, `payment_evidence`, `payment_events` | Payment attempts, private proof, verification and gateway deduplication |
| `kit_claims` | Bib/kit release with unique claim protection |
| `notification_outbox`, `audit_logs` | Retryable notices and sensitive-action history |

Use UUID primary keys, foreign keys, appropriate unique constraints and timestamps. Store monetary amounts as integer centavos with PHP currency. Use timezone-aware event timestamps and display them in Asia/Manila. Include edition IDs where content belongs to a celebration year.

Use transactions for capacity reservation, approval and kit claims. Calculate authoritative fees on the server. Track review actor, review time and reason. Keep an audit record of changes while excluding unnecessary sensitive payloads from logs.

Suggested storage separation: public published media; private upload staging; private delegation files; private payment evidence. Use short-lived signed URLs for private downloads, generated only after authorization.

## 10. Design and public experience

Create a mobile-first festival identity using committee-approved colors, logo and photography. A warm red/gold palette is a possible direction, subject to branding approval. Prioritize legible schedules and clear registration buttons over decorative animation.

Include accessible contrast, keyboard controls, labeled forms, visible focus, image descriptions, reduced-motion support and useful validation messages. Make upload progress, pending submissions, empty sections and failed payments understandable. Preserve draft work when possible.

Provide schedule filters, printable schedules, calendar downloads and clear announcement banners for changes. Add page titles, descriptions, sitemap, canonical URLs and social sharing metadata. Plan prerendering for public article/event routes if reliable Facebook link previews are required; a browser-rendered SPA alone may not provide route-specific previews to crawlers.

## 11. Deployment and operations

1. Create the GitHub repository and commit the frontend, migrations, environment template and setup guide.
2. Keep staging and production data separate. Test using fictional participants.
3. Configure Supabase Auth URLs, email delivery, database permissions and storage policies.
4. On Render, deploy the frontend as a Static Site. Start with build command `npm ci && npm run build` and publish directory `dist`; match these to the actual project scripts.
5. Configure the SPA rewrite `/*` to `/index.html` so direct links work. Verify real static assets and prerendered pages still resolve as intended.
6. Put only the Supabase URL and browser-safe publishable key in frontend variables. Keep privileged keys and payment secrets in server-side function secrets.
7. Add the domain when chosen, verify authentication redirects and test the deployed registration journey.
8. Set up error reporting, uptime checks, storage/budget alerts, database backups and a separate media backup/export process. Confirm backup availability for the selected plans and rehearse recovery.

Render supports static-site hosting and rewrite rules. Sources: [Render Static Sites](https://render.com/docs/static-sites), [Render rewrites](https://render.com/docs/redirects-rewrites), [Vite deployment](https://vite.dev/guide/static-deploy.html).

Define who monitors registration issues during the run and who handles payment disputes. Prepare an authorized offline check-in export if connectivity at the venue is unreliable. Set data retention and deletion periods with the committee before collecting entries; publish the resulting privacy notice and staff procedures.

## 12. Delivery phases and launch gates

| Phase | Deliverable | Completion gate |
|---|---|---|
| 1. Requirements and identity | Confirmed dates, roles, branding, registration rules and data fields | Committee approves launch scope and content owners |
| 2. Foundation | Project structure, Auth, database migrations, permission policies and staging deployment | Role and ownership tests pass |
| 3. Public site and publishing | Home, program, Masses, festival, gallery, news and sponsors with admin editors | Staff can publish and correct content without code |
| 4. Run registration | Categories, form, manual payment review, status tracking and exports | A full test entry reaches approval and kit claim |
| 5. Delegation portal | Roster, music, deadline and revision workflow | One delegation cannot access another’s files |
| 6. Launch preparation | Accessibility, mobile checks, permission tests, staff training and backups | Committee signs off on content and operating procedures |
| 7. Later improvements | Automated payments, scheduled posts, results, certificates, advanced check-in | Added only after launch-critical workflows are stable |

Release public information first; open registration only after payment instructions, fees, eligibility, capacity, terms and support contacts are ready. Automated payments should not block a well-reviewed manual-payment launch.

There are roughly ten weeks between the planning baseline and the January 9 run. Use an early public launch and set the registration opening date with the committee. A calendar estimate should follow confirmation of developer availability, content readiness and payment scope.

## 13. Required verification

- Visitor, runner, news staff and delegation-head permissions enforced through direct API requests, including private file URLs.
- Full registration and payment correction flows, duplicate submissions, expired reservations and simultaneous attempts at the final slot.
- Batch approval eligibility, rejected paid entries and notification retry without duplicate approval.
- Delegation deadline, revision history, roster validation and music upload limits.
- Image processing failure, unsafe formatted text, unreadable posters and interrupted uploads.
- One-time kit claims and authorization behind QR references.
- Mobile layouts, keyboard access, slow connections, password recovery and deployed deep links.
- Future and past event behavior, schedule time zones, backups and recovery.
- If a gateway is added: invalid webhook signatures, duplicate events, mismatched amount/currency and delayed settlement.

## 14. Committee decisions still needed

1. Official logo, theme, festival story and approved photos/videos.
2. Full novena/Pontifical Mass dates, times, celebrants and venues.
3. Run distances, fees, age limits, capacity, deadlines, route approval, kit contents and shirt sizes.
4. Verified payment recipients, refund policy, payment reviewer and reconciliation procedure.
5. Waiver, guardian consent, data retention and support contact.
6. Delegation eligibility, roster fields, deadlines, music specifications, judging rules and reviewers.
7. Nightly program, sponsors, recognition tiers and publication permissions.
8. Administrator and news-staff accounts; who authorizes final content.
9. Domain, hosting budget, email provider and selected service plans.

Do not delay the foundation for these answers: design configurable fields and publication controls now, then populate and validate the confirmed details before each feature opens to the public.
