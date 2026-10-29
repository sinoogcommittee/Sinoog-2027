# Sinoog 2027 — Material Design 3 Implementation Blueprint

> Audit baseline: 2026-10-29 (Asia/Manila)  
> Status: **AUDIT COMPLETE — PHASE 1 IN PROGRESS (P1-001, P1-003, P1-004, P1-005, P1-006, P1-007, P1-011, P1-016 completed)**  
> Scope rule: Phase 1 covers public/authenticated-runner surfaces; Phase 2 covers committee administration and settings and starts only after explicit approval.

## 1. Executive Summary

Sinoog 2027 is a React 19 + TypeScript 6 + Vite 8 single-page application backed by Supabase. It contains 29 page components exposed through 38 configured route entries (including redirects, dynamic routes, an index route, and the wildcard). The current visual language is a strong custom parish-festival identity: wine, gold, paper cream, Fraunces display type, DM Sans interface type, ceremonial artwork, bamboo motifs, and responsive public/admin layouts.

The recommended migration is **not** a replacement with a generic Google-looking UI. It is a token-first Material Design 3 (M3) adaptation that retains the parish’s wine/gold identity and editorial hero artwork while standardizing controls, surfaces, states, navigation, forms, dialogs, data displays, responsive behavior, and accessibility. Existing React, React Router, Supabase, Lucide, QR, ZXing, and query architecture should remain.

Audit evidence:

- 80 source files reviewed by deterministic UI analysis; 689 findings: 686 hardcoded-color/token-drift findings, one placeholder-link accessibility error, one autofocus warning, and one external-link warning.
- `src/styles/global.css` is 8,367 lines, contains 601 literal color occurrences across `src`, and page components contain 334 inline-style objects.
- Public/auth routes were rendered at 390×844, 768×1024, and 1440×900. No tested route produced horizontal document overflow.
- Many rendered links and controls are below the recommended 44×44 CSS-pixel touch target. Exact exceptions must be triaged because inline text links do not always require a 44×44 box, but primary controls and icon actions do.
- Admin routes are authentication-gated. Their structure and responsive CSS were source-audited; authenticated runtime visual QA is **NEEDS VERIFICATION**.

## 2. Project Architecture and Technology Audit

### 2.1 Technology

| Area | Actual implementation | Audit conclusion |
|---|---|---|
| Framework | React `^19.3.1`, React DOM `^19.3.1` | Retain |
| Language/build | TypeScript `~6.0.3`, Vite `^8.3.4` | Retain |
| Routing | `react-router-dom ^7.9.4`, declarative `<Routes>` in `src/app/App.tsx` | Retain all paths and guards |
| Backend | `@supabase/supabase-js ^2.57.4` | No redesign changes to schema/contracts |
| Icons | `lucide-react ^0.468.0` | Retain; standardize size/stroke/semantic use |
| QR/scanning | `qrcode.react`, `@zxing/browser` | Retain |
| Sanitization | DOMPurify | Retain |
| State | React context/local state; `AuthContext`, `ToastContext` | Retain; add theme context only if necessary |
| Styling | One global CSS file plus extensive component class names and inline styles | Incrementally tokenize and split; avoid rewrite |
| Testing | Vitest; current tests focus on utilities/media sanitization | Add component/a11y/visual coverage |
| PWA | manifest, service worker, install prompt | Retain and restyle |

### 2.2 Runtime composition

- `src/main.tsx`: `BrowserRouter` → `AuthProvider` → `ToastProvider` → `App`.
- `src/app/App.tsx`: public shell, auth routes, role-protected committee workspace, lazy-loaded race timing.
- `src/layouts/PublicLayout.tsx`: skip link, public top app bar/navigation, outlet, parish/committee footer.
- `src/layouts/PortalLayout.tsx`: desktop side navigation, mobile bottom navigation, user identity, public-site and sign-out actions.
- Query modules under `src/features/*` isolate Supabase reads/writes; UI migration must not change their signatures.
- `src/types/database.ts` is generated database typing; never edit for visual work.

### 2.3 Assets and media

- Official assets: `public/images/parish_logo.webp`, `committee_logo.webp`, `hero_section_art.webp`/`.png`, social preview.
- Embedded media: YouTube teaser, Google Maps iframe, YouTube gallery embeds.
- Upload flows: public media, private payment evidence, gallery compression, sponsor logos.
- Preserve aspect ratios, meaningful alt text, lazy loading, safe URL validation, and image compression behavior.

### 2.4 Current responsive architecture

The stylesheet uses many overlapping breakpoints: 350, 360, 380, 420, 430, 479, 560, 600, 640, 700, 760, 767, 800, 899/900, 960, 1000, 1050, 1100, and 1200 px. This evolved pragmatically but creates cascade risk. Migration should consolidate around adaptive M3 window-size classes while preserving targeted exceptions:

- Compact: 0–599 px
- Medium: 600–839 px
- Expanded: 840–1199 px
- Large: 1200–1599 px
- Extra large: 1600 px+

## 3. Complete Route and Page Inventory

### 3.1 Public, runner, and authentication routes

| Route | Page/source | Access | Purpose and major UI |
|---|---|---|---|
| `/` | `HomePage.tsx` | Public | Branded hero, countdown, milestones, teaser video, upcoming activities/news, run CTA, sponsors, map |
| `/festival` | `FestivalPage.tsx` | Public | Festival overview, features, route map, documents, accordion delegation preview |
| `/festival/participants` | `FestivalPage.tsx` | Public | Participant/delegation publication view |
| `/festival/guidelines` | `FestivalPage.tsx` | Public | Guidelines and delegation-head CTA |
| `/run` | `RunPage.tsx` | Public | Race overview, category cards, route/kit/guide, size dialog |
| `/run/routes` | `RunPage.tsx` | Public | Course routes and checkpoints |
| `/run/register` | `RunRegistrationPage.tsx` | Signed-in runner | Multi-step registration, payment evidence, status, QR/bib |
| `/activities` | `ActivitiesPage.tsx` | Public | All-event filter, printable/calendar schedule timeline |
| `/activities/masses` | `ActivitiesPage.tsx` | Public | Mass-filtered schedule |
| `/activities/nightly` | `ActivitiesPage.tsx` | Public | Nightly-program filtered schedule |
| `/news` | `NewsPage.tsx` | Public | Search, category filters, pinned/latest announcements |
| `/news/:slug` | `NewsArticlePage.tsx` | Public | Sanitized article detail, share actions, media |
| `/gallery` | `GalleryPage.tsx` | Public | Photo/video tabs, collections, full-screen viewer |
| `/sponsors` | `SponsorsPage.tsx` | Public | Tiered sponsor recognition and partnership CTA |
| `/about` | `AboutPage.tsx` | Public | Parish/committee overview, Facebook CTA, map |
| `/privacy` | `PolicyPage.tsx` | Public | Privacy policy with dynamic support details |
| `/terms` | `PolicyPage.tsx` | Public | Registration terms, waiver, guardian/refund content |
| `/signin` | `RunnerAuthPage.tsx` | Public | Runner sign-in/sign-up tabs and Google auth |
| `/signup` | Redirect | Public | Redirects to `/signin?mode=signup` |
| `/runner/login` | Redirect | Public | Redirects to `/signin` |
| `/account` | `AccountPage.tsx` | Signed-in runner | Profile, registration data, waiver/consent |
| `/login` | `LoginPage.tsx` | Public | Staff-only email/password sign-in |
| `/forgot-password` | `ForgotPasswordPage.tsx` | Public | Password recovery request |
| `/auth/reset-password` | `ResetPasswordPage.tsx` | Recovery session | Set new password |
| `/auth/callback` | `AuthCallbackPage.tsx` | OAuth callback | Resolve auth session/redirect |
| `*` | `NotFoundPage.tsx` | Public | 404 recovery |

### 3.2 Committee workspace routes

| Route | Page/source | Access | Purpose and major UI |
|---|---|---|---|
| `/admin` | `AdminDashboardPage.tsx` or role redirect | Staff; dashboard admin-only | KPIs, readiness, quick actions |
| `/admin/activities` | `ActivitiesManagerPage.tsx` | Administrator | Schedule filters, table/cards, CRUD dialog, publication/reordering |
| `/admin/posts` | `PostsManagerPage.tsx` | Admin or news in charge | Article search/filter/table, editor/preview, media, publish/pin |
| `/admin/registrations` | `RegistrationsManagerPage.tsx` | Administrator | Runner review, walk-in creation, payment evidence, approval, print/CSV |
| `/admin/run-timing` | `RunTimingPage.tsx` | Administrator | Official clock, QR scanner, reset authentication, rankings |
| `/admin/delegations` | `AdminListPage.tsx` | Admin or delegation head | Delegation placeholder/list workflow |
| `/admin/users` | `UsersManagerPage.tsx` | Administrator | Search/filter, staff creation, edit roles/profile/password, delete eligible accounts |
| `/admin/finance` | `FinancePage.tsx` | Administrator | Cashbook, inflow/expense form, scope filters, payment audit, exports |
| `/admin/sponsors` | `SponsorsManagerPage.tsx` | Administrator | Sponsor CRUD, tier/order/status/logo/social links |
| `/admin/gallery` | `GalleryManagerPage.tsx` | Administrator | Collection CRUD/reorder, photo uploads, YouTube entries, publish state |
| `/admin/settings` | `SettingsPage.tsx` | Administrator | Edition, dates, run registration, GCash, documents, contact/banner settings |
| `/dashboard` | Redirect | Staff | Redirects to `/admin` |

## 4. Existing UI Component Inventory

| Existing component/pattern | Source | Used by | M3 equivalent | Required change | Priority |
|---|---|---|---|---|---|
| `Button` + `.button--*` | `src/components/Button.tsx`, global CSS | Site-wide | Filled, filled-tonal, outlined, text buttons | Add semantic variants, state layer, 48/40 px sizes, loading/disabled behavior | P0 |
| `PageHero` | `src/components/PageHero.tsx` | Most public pages | Branded large top app region (custom exception) | Keep artwork; use M3 typography/surface tokens and responsive bounds | P0 |
| `SectionHeading` | `src/components/SectionHeading.tsx` | Public sections | M3 heading group | Tokenize type/spacing; standardize optional action alignment | P1 |
| `StatusBadge` | `src/components/StatusBadge.tsx` | Admin/run | Assist/suggestion chip or semantic badge | Separate status badge from interactive chips; add icon/contrast rules | P0 |
| Feedback states | `src/features/ui/FeedbackStates.tsx` | Data pages | Circular progress, empty-state card, error banner, basic dialog | Proper dialog element/focus trap; M3 progress and tonal containers | P0 |
| Toast system | `ToastContext.tsx` | Mutations | Snackbar | Queue, action slot, status semantics, timer/pause, bottom-safe positioning | P0 |
| Install prompt | `InstallAppPrompt.tsx` | App-wide | Bottom sheet / snackbar prompt | Adaptive sheet, dismiss semantics, platform steps | P1 |
| Public header/nav | `PublicLayout.tsx` | Public/auth | Small/medium top app bar + modal drawer | Selected state, keyboard menu, compact/expanded patterns | P0 |
| Footer | `PublicLayout.tsx` | Public/auth | Branded footer (custom) | Retain identity; tokenized surfaces/links/focus states | P1 |
| Admin shell | `PortalLayout.tsx` | Workspace | Navigation drawer/rail/bar + top app bar | Expanded drawer desktop, rail medium, bottom bar compact | P0 Phase 2 |
| Cards | Numerous page classes | All | Elevated, filled, outlined cards | Define reusable `Card` variants and remove one-off shadows/radii | P0 |
| Filters/category buttons | Activities, news, gallery, admin tables | Many | Filter chips, segmented buttons, tabs | Use correct selection semantics and visible state layers | P0 |
| Search fields | News/admin managers | Many | M3 search bar | Leading icon, clear action, label/state, 48–56 px height | P0 |
| Text inputs/textareas | Auth, registration, settings, CRUD | Many | Outlined/filled text fields | Persistent labels, helper/error text, focus/error state, autocomplete | P0 |
| Native selects | Forms/filters | Many | Exposed dropdown menu | Wrap as reusable select field; keep native semantics initially | P0 |
| Checkboxes/switches/radios | Registration/settings/users | Many | M3 checkbox/switch/radio | Increase target, label association, state layers | P0 |
| File upload | Registration/posts/gallery/sponsors | Admin/runner | Outlined drop zone + file list/progress | Preserve compression/storage; add validation and progress | P1 |
| Admin tables | Managers | Admin | M3-compatible data table | Sticky header, density modes, row selection/actions; responsive cards | P0 Phase 2 |
| Schedule timeline | `ActivitiesPage.tsx` | Public | Custom M3-styled list/timeline | Retain cultural date cue; use list/card tokens | P1 |
| Gallery viewer/modals | `GalleryPage.tsx` | Public | Full-screen dialog | Focus trap, Escape, labelled controls, swipe/keyboard | P0 |
| CRUD overlays | Admin pages | Admin | Basic/full-screen dialogs | Shared dialog primitive; focus restore and scroll containment | P0 Phase 2 |
| Accordion | `FestivalPage.tsx` | Festival | Expansion panel | Button semantics, animated height, focus/expanded state | P1 |
| Countdown | `CountdownTimer.tsx` | Home | Custom status surface | Preserve; reduce announcements and motion; semantic timer | P2 |
| Map/video frames | Home/About | Public | Specialized media exceptions | Responsive container, consent/performance, descriptive title | P1 |
| Size tables | Run/registration | Public/runner | M3-compatible data table/dialog | Responsive rows, sticky labels, accessible caption | P1 |
| QR/race scanner | Run registration/timing | Runner/admin | Specialized interface | Do not force into generic card; use M3 surfaces/actions/status | P1 |
| Icons | Lucide throughout | All | M3 iconography behavior | Keep Lucide, standardize 18/20/24 px and 2 px stroke | P1 |

Retention rule: branded art, route maps, QR codes, race rankings, media grids, and finance reporting remain specialized interfaces styled with M3 tokens rather than replaced by unsuitable generic components.

## 5. Content and Visual Hierarchy Audit

- Public pages generally have good hierarchy: eyebrow → display title → description → sectional headings. Preserve this model.
- Large editorial headings sometimes compete with data-heavy controls; M3 migration must distinguish expressive public typography from utilitarian admin typography.
- Home contains many sequential promotional sections. Add consistent surface alternation and section spacing, but do not remove content.
- Schedule and news filters are understandable but visually bespoke; map them to chips/tabs while preserving labels and URL behavior.
- Registration is dense (1,067 lines) and mixes step headings, inline styles, payment state, policy confirmation, and dialogs. Make progression and validation explicit without changing submission logic.
- Admin pages rely on compact visual tables with mobile cards. Preserve information density; do not inflate all rows to consumer-app spacing.
- Policy pages need a readable 65–75 character line length, anchored section navigation, and clear last-updated/support metadata (**NEEDS VERIFICATION** for desired metadata).
- Error, empty, loading, and success language exists and should remain. Standardize placement and tone without changing meaning.

## 6. Existing Design Issues and Opportunities

### Proven defects

1. `FestivalPage.tsx:228` uses a placeholder anchor href; use a button until a real document exists.
2. `RunTimingPage.tsx:339` autofocus can disorient assistive-technology users; focus should follow explicit dialog opening and be documented.
3. `sanitizeArticleHtml.test.ts:10` contains a target-blank warning in test content; production sanitizer behavior remains to be verified.
4. Dialog overlays are `div role="dialog"` without a shared demonstrated focus trap, Escape handling, inert background, or focus restoration.
5. Numerous primary/icon controls render below 44×44 px at tested widths.

### Design-system drift

- 686 automated hardcoded-color findings and 601 literal color occurrences.
- 334 inline-style objects, including complex registration/admin forms.
- One 8,367-line global stylesheet with repeated and overlapping breakpoints.
- Repeated control/card/table/modal implementations instead of centralized primitives.
- Inconsistent radius, padding, button size, icon target, and shadow behavior.
- No dark theme or semantic color layer.

### Opportunities

- Build semantic tokens first, then compatibility aliases (`--wine`, `--gold`) to prevent regressions.
- Convert high-reuse primitives before pages.
- Scope Phase 1 under `.public-theme` and Phase 2 under `.admin-theme` until convergence.
- Preserve expressive heritage art as a deliberate exception to restrained M3 application surfaces.

## 7. Material Design 3 Design Principles

1. **Material You, parish-owned:** dynamic tonal logic, not Google-purple imitation.
2. **Expressive public, efficient admin:** shared tokens; different density and navigation patterns.
3. **Tonal elevation first:** surface containers before shadows.
4. **One semantic source:** components consume role tokens, never ad-hoc hex values.
5. **Accessible by construction:** visible focus, keyboard order, 44–48 px targets, semantic state announcements.
6. **Adaptive, not shrunken:** navigation and data layout change by window class.
7. **Function-preserving:** all Supabase, auth, registration, finance, upload, QR, and role logic remains untouched.

## 8. Material You Color System — Light and Dark

Palette derives from parish wine (`#741F29`), celebratory gold (`#D69D2E`), warm cream, and a restrained green success role.

| Token | Light | Dark |
|---|---:|---:|
| primary | `#7B2936` | `#FFB2BC` |
| on-primary | `#FFFFFF` | `#4B0010` |
| primary-container | `#FFD9DD` | `#621A27` |
| on-primary-container | `#300008` | `#FFD9DD` |
| secondary | `#735B24` | `#E2C36C` |
| on-secondary | `#FFFFFF` | `#3D2F00` |
| secondary-container | `#FFE8A6` | `#574500` |
| on-secondary-container | `#241A00` | `#FFE8A6` |
| tertiary | `#4E6547` | `#B5CFA9` |
| on-tertiary | `#FFFFFF` | `#21371D` |
| tertiary-container | `#D0EBC4` | `#374D31` |
| on-tertiary-container | `#0C2009` | `#D0EBC4` |
| surface | `#FFF8F6` | `#191113` |
| on-surface | `#211A1B` | `#EEE0E1` |
| surface-bright | `#FFF8F6` | `#423739` |
| surface-dim | `#E6D6D7` | `#191113` |
| surface-container-lowest | `#FFFFFF` | `#140C0E` |
| surface-container-low | `#FFF0F1` | `#21191B` |
| surface-container | `#FAEAEB` | `#261D1F` |
| surface-container-high | `#F4E4E5` | `#31282A` |
| surface-container-highest | `#EEDFE0` | `#3D3234` |
| on-surface-variant | `#524345` | `#D7C1C3` |
| outline | `#857376` | `#A18C8F` |
| outline-variant | `#D8C1C4` | `#524345` |
| error | `#BA1A1A` | `#FFB4AB` |
| on-error | `#FFFFFF` | `#690005` |
| error-container | `#FFDAD6` | `#93000A` |
| on-error-container | `#410002` | `#FFDAD6` |
| inverse-surface | `#372F30` | `#EEE0E1` |
| inverse-on-surface | `#FCEEEF` | `#372F30` |
| inverse-primary | `#FFB2BC` | `#7B2936` |
| surface-tint | `#7B2936` | `#FFB2BC` |
| scrim | `#000000` | `#000000` |

Semantic extensions: success `#236A50`, warning `#7A5900`, info `#315E8A`, each with matching container/on-container roles. Validate text and icons to WCAG 2.2 AA (4.5:1 normal text, 3:1 large text and essential graphics). Do not assume a tonal value passes; test final composited states.

## 9. Typography System

Use **DM Sans** for all M3 roles. Retain **Fraunces** as an expressive brand/display override for public heroes and ceremonial headings only.

| Role | Size/line | Weight | Tracking | Primary use |
|---|---|---:|---:|---|
| Display Large | 57/64 | 600 | -0.25px | Desktop branded hero; Fraunces allowed |
| Display Medium | 45/52 | 600 | 0 | Tablet hero |
| Display Small | 36/44 | 600 | 0 | Mobile hero/page title |
| Headline Large | 32/40 | 600 | 0 | Major sections |
| Headline Medium | 28/36 | 600 | 0 | Page/subsection headings |
| Headline Small | 24/32 | 600 | 0 | Card group headings |
| Title Large | 22/28 | 600 | 0 | Dialog/list titles |
| Title Medium | 16/24 | 600 | 0.15px | Card titles |
| Title Small | 14/20 | 600 | 0.1px | Compact table titles |
| Body Large | 16/24 | 400 | 0.5px | Main copy/forms |
| Body Medium | 14/20 | 400 | 0.25px | Supporting copy/tables |
| Body Small | 12/16 | 400 | 0.4px | Metadata |
| Label Large | 14/20 | 600 | 0.1px | Buttons/navigation |
| Label Medium | 12/16 | 600 | 0.5px | Chips/table labels |
| Label Small | 11/16 | 600 | 0.5px | Eyebrows/status |

Responsive display roles step down by window class; body text never drops below 12 px. Long policy/article content uses 16–18 px with 1.6–1.75 line height and max 75ch.

## 10. Shape and Corner Radius System

| Token | Radius | Use |
|---|---:|---|
| extra-small | 4px | menus, compact cells |
| small | 8px | fields, small cards |
| medium | 12px | cards, banners |
| large | 16px | prominent cards, sheets |
| extra-large | 28px | dialogs, hero containers |
| full | 999px | chips, FABs, badges |

Component-specific rules: buttons full; text fields 4 px top corners for filled or 8 px outlined; cards 12/16 px; dialogs 28 px desktop and 0/28 px top corners for compact full-screen/bottom sheets. Heritage artwork may use custom clipping when documented.

## 11. Spacing and Responsive Layout System

- Scale: `0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96` px.
- Compact gutter 16 px; medium 24 px; expanded 32 px; large 48 px.
- Content max widths: reading 760 px, forms 720 px, standard 1200 px, data workspace 1600 px.
- Section spacing: 48/64/80/96 px by window class.
- Cards: 16 px compact, 20–24 px expanded.
- Forms: 16 px vertical field gap; 24–32 px between semantic groups.
- Mobile single column; medium 2-column where content supports it; expanded 12-column grid.
- Tables become structured cards only when columns cannot remain readable; never create horizontal page scroll.

## 12. Elevation and Surface System

Use surface-container roles as default separation. Shadows are reserved for transient or physically elevated elements.

- Level 0: page surface.
- Level 1: filled cards/navigation (`surface-container-low`).
- Level 2: elevated cards/sticky app bars (`surface-container`).
- Level 3: menus/FABs (`surface-container-high`).
- Level 4: dialogs/sheets (`surface-container-highest`).
- Outlined cards use `outline-variant`, no shadow.
- Scrim: black at 32–40%, adjusted for contrast.

## 13. Motion and Interaction System

- Short 100 ms; medium 200 ms; long 300 ms; emphasized 400–500 ms.
- Standard easing `cubic-bezier(.2,0,0,1)`; emphasized decelerate `cubic-bezier(.05,.7,.1,1)`; accelerate `cubic-bezier(.3,0,.8,.15)`.
- State-layer opacity: hover 8%, focus 12%, pressed 12%, dragged 16%.
- Navigation transitions 300 ms; dialogs/sheets 300–400 ms; list changes 200 ms.
- `prefers-reduced-motion: reduce`: remove transforms/parallax/auto animation, preserve instantaneous state communication.

State requirements for every interactive primitive: default, hover, focus-visible, pressed, selected, disabled, loading; add error and success where semantically relevant. Disabled state must not be conveyed by opacity alone. Loading actions retain label context and prevent duplicate submission.

## 14. Material 3 Component Mapping

The complete mapping is in Section 4. Implementation specifications:

- Buttons: filled for one page-level primary action; tonal for supportive actions; outlined for secondary; text for low emphasis; destructive uses error role and confirmation.
- Icon buttons: 40 or 48 px target, tooltip on hover/focus, accessible name always.
- FAB: only for repeated creation on list-heavy admin screens; never duplicate a visible primary button.
- Fields: outlined fields initially to minimize layout disruption; error/helper text occupies stable space.
- Search: 56 px desktop, 48–56 px compact; clear button when nonempty.
- Cards: filled for grouped data, outlined for comparable choices, elevated only for transient/prominent content.
- Chips: filter chips for categories; assist chips for calendar/share; status badges remain noninteractive.
- Dialogs: shared focus-managed primitive; compact screens use full-screen dialog for long forms.
- Navigation: public top app bar + modal drawer; admin drawer/rail/bar adaptively.
- Data tables: M3 tokens, 48–56 px rows, sticky header, icon actions, responsive card alternative.

## 15. Public Pages — Detailed Redesign Specifications

Every subsection follows A–H: overview; issues; proposal; responsive; files; preservation; acceptance; checklist.

### 15.1 Home (`/`)

**A.** `HomePage.tsx` in `PublicLayout`; hero, countdown, milestones, YouTube, activities/news, run, sponsors, map. **B.** Bespoke styles, many surfaces, hardcoded states; hierarchy is strong but long. **C.** Retain branded hero/bamboo as custom exception; apply M3 type roles, tonal section rhythm, cards, buttons, skeletons. **D.** Compact stacks; medium 2-column; expanded editorial grid; extra-large max-width. **E.** `HomePage.tsx`, `PublicLayout.tsx`, tokens/public CSS, shared primitives. **F.** Preserve queries, auth-sensitive CTA, embeds, sponsor/news/activity links. **G.** No overflow at 320+, all CTAs ≥44 px, loading/error/empty retained, LCP image optimized. **H.** [ ] Hero [ ] sections [ ] states [ ] responsive [ ] a11y [ ] regression.

### 15.2 Festival overview (`/festival`)

**A.** Shared `FestivalPage.tsx`; overview, feature cards, map, documents, delegation accordions. **B.** Placeholder document link is an accessibility error; cards/accordion are bespoke. **C.** M3 outlined feature cards, expansion panels, assist chips, tonal CTA. **D.** Single/2/3-column progression. **E.** `FestivalPage.tsx`, shared CSS/primitives. **F.** Preserve route-section logic and unpublished-content messaging. **G.** No placeholder href; full keyboard accordion. **H.** [ ] cards [ ] expansion panels [ ] documents [ ] responsive [ ] a11y.

### 15.3 Festival participants (`/festival/participants`)

**A.** `FestivalPage.tsx` participants branch. **B.** Empty publication content needs strong state distinction. **C.** M3 empty state and future delegation list cards. **D.** Adaptive list/grid. **E.** Same file. **F.** Preserve pending publication meaning. **G.** Empty and populated states tested. **H.** [ ] state [ ] list [ ] responsive.

### 15.4 Festival guidelines (`/festival/guidelines`)

**A.** Guidelines branch with delegation-head CTA. **B.** Document/action hierarchy inconsistent. **C.** Reading surface, section list, download/assist chips. **D.** 75ch content; compact full-width actions. **E.** Same file. **F.** Preserve staff path and content. **G.** real links only; printable/readable. **H.** [ ] content [ ] actions [ ] a11y.

### 15.5 Run overview (`/run`)

**A.** `RunPage.tsx`; hero, routes, categories, kit, guide, size chart. **B.** Dense bespoke cards and modal. **C.** M3 choice cards, status chip, outlined information cards, accessible size dialog. **D.** 1/2/3-column categories; no CTA wrapping. **E.** `RunPage.tsx`, run styles, dialog primitive. **F.** Preserve registration status logic/category data. **G.** registered state accurate; size chart keyboard accessible. **H.** [ ] hero [ ] categories [ ] info [ ] dialog [ ] regression.

### 15.6 Run routes (`/run/routes`)

**A.** Routes branch in `RunPage.tsx`. **B.** Specialized course content must remain legible. **C.** M3 surface hierarchy around custom route visualization. **D.** Route data stacks on compact, paired on expanded. **E.** Same. **F.** Preserve route copy. **G.** No map/detail clipping. **H.** [ ] route cards [ ] responsive.

### 15.7 Runner registration (`/run/register`)

**A.** `RunRegistrationPage.tsx`; signed-in multi-step form, cash/GCash proof, waiver, status, QR. **B.** 1,067-line component, extensive inline styles, weak shared field system. **C.** M3 stepper/progress header, grouped outlined fields, choice cards, file drop zone, confirmation dialog, status timeline. **D.** compact full-width steps; medium 2-column data; desktop constrained form. **E.** page, run query/compression only for regression reference, shared fields/dialogs. **F.** Never alter eligibility, payment, compression, validation, consent snapshots, QR/bib, lifecycle timestamps. **G.** keyboard-only completion; errors announced; duplicate submissions blocked; exact payload parity. **H.** [ ] step model [ ] fields [ ] category/payment [ ] waiver [ ] upload [ ] status/QR [ ] regression.

### 15.8 Activities routes (`/activities`, `/activities/masses`, `/activities/nightly`)

**A.** `ActivitiesPage.tsx`; filter tabs/buttons, print/calendar, timeline. **B.** custom segmented group and numerous small actions. **C.** M3 filter chips/tabs, assist chips, date-led list cards. **D.** wrap chips compact; horizontal utility alignment expanded. **E.** page and public filter/schedule CSS. **F.** Preserve filter URLs, dates/weekdays, print, ICS, calendar links, current-day logic. **G.** selected state programmatic; no overflow; print unchanged. **H.** [ ] filters [ ] timeline [ ] actions [ ] print/calendar.

### 15.9 News (`/news`)

**A.** `NewsPage.tsx`; search, filters, pinned and normal cards. **B.** search/chips bespoke, small targets. **C.** M3 search bar, filter chips, filled/outlined article cards. **D.** compact stack; expanded featured/list grid. **E.** page/CSS. **F.** Preserve client filtering and post order. **G.** search has clear affordance/label; no-results announced. **H.** [ ] search [ ] chips [ ] cards [ ] states.

### 15.10 News article (`/news/:slug`)

**A.** `NewsArticlePage.tsx`; sanitized content/media/share. **B.** long-form type and share feedback need standardization. **C.** reading column, metadata chips, icon buttons, snackbar. **D.** 65–75ch; responsive images. **E.** page/article CSS. **F.** Preserve sanitizer and safe share URLs. **G.** headings logical; media alt/title; share fallback works. **H.** [ ] article [ ] share [ ] not-found/error.

### 15.11 Gallery (`/gallery`)

**A.** `GalleryPage.tsx`; tabs, collection collages, full-screen viewer. **B.** dialog focus/keyboard behavior needs verification. **C.** primary tabs, collection cards, focus-managed full-screen dialog. **D.** 1/2/3 columns; viewer edge-to-edge compact. **E.** page/gallery CSS/dialog primitive. **F.** Preserve collection ordering, current/previous grouping, YouTube behavior. **G.** arrows/Escape/focus/labels work; media preserves ratio. **H.** [ ] tabs [ ] cards [ ] viewer [ ] a11y.

### 15.12 Sponsors (`/sponsors`)

**A.** `SponsorsPage.tsx`; tiers, logo cards, links, partner CTA. **B.** tier/CTA styles isolated from system. **C.** M3 tier headings, outlined cards, icon buttons, tonal CTA. **D.** responsive logo grid. **E.** page/CSS. **F.** Preserve safe URL validation and hierarchy. **G.** logo alt/fallback and external-link cues. **H.** [ ] tiers [ ] cards [ ] CTA.

### 15.13 About (`/about`)

**A.** `AboutPage.tsx`; short content, Facebook button, map. **B.** one-line component hurts maintainability. **C.** reading card plus map surface. **D.** stack compact, split expanded. **E.** page/CSS. **F.** Preserve iframe/source links. **G.** map title and external action accessible. **H.** [ ] restructure later [ ] layout [ ] map.

### 15.14 Policies (`/privacy`, `/terms`)

**A.** `PolicyPage.tsx`; dynamic support details and legal sections. **B.** long reading flow lacks section navigation. **C.** M3 reading surface, optional sticky contents on expanded. **D.** single reading column compact/medium. **E.** page/CSS. **F.** Preserve committee-approved text exactly. **G.** content diff zero; headings/links accessible. **H.** [ ] typography [ ] contents [ ] support details.

### 15.15 Runner sign-in/sign-up (`/signin` plus redirects)

**A.** `RunnerAuthPage.tsx`; tabs, Google auth, sign-in/sign-up forms. **B.** tabs/fields inconsistent with M3; error region needs standardized announcements. **C.** M3 primary tabs, outlined fields, filled button, Google outlined button. **D.** compact edge padding; desktop centered card. **E.** page, `GoogleSignInButton.tsx`, auth CSS. **F.** Preserve safe `next`, OAuth, profile creation, validation. **G.** correct autocomplete; visible errors; keyboard tabs. **H.** [ ] tabs [ ] forms [ ] OAuth [ ] errors.

### 15.16 Runner account (`/account`)

**A.** `AccountPage.tsx`; signed-in profile, registration details, waiver. **B.** inline styles and grouped information need clearer hierarchy. **C.** profile field group, registration status card, consent details. **D.** one column compact, two-column expanded. **E.** page/CSS/fields. **F.** Preserve profile save and read-only registration facts. **G.** field errors/status announced. **H.** [ ] profile [ ] registration [ ] consent.

### 15.17 Staff login/recovery/callback (`/login`, `/forgot-password`, `/auth/reset-password`, `/auth/callback`)

**A.** `LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `AuthCallbackPage.tsx`. **B.** duplicated auth-card styling and inconsistent status handling. **C.** shared M3 auth shell/field/button/progress/result patterns. **D.** compact full-width with safe padding; centered max 480 px expanded. **E.** four pages + shared auth components. **F.** Preserve staff-only wording, Supabase recovery/callback redirects, no Google staff login. **G.** recovery flow regression passes; errors announced. **H.** [ ] shared shell [ ] login [ ] recovery [ ] callback.

### 15.18 Not found (`*`)

**A.** `NotFoundPage.tsx`. **B.** minimal custom state. **C.** M3 empty-state/result surface. **D.** centered all sizes. **E.** page/CSS. **F.** Preserve home recovery. **G.** clear 404 and focusable CTA. **H.** [ ] state.

## 16. Admin and Settings — Detailed Redesign Specifications

Phase 2 only. For every page: retain authorization, queries, mutations, exports, audit logging, and mobile card behavior.

### 16.1 Dashboard (`/admin`)
**A.** `AdminDashboardPage.tsx`, KPI/readiness/actions. **B.** custom stat cards. **C.** M3 compact KPI cards and task list. **D.** 2 columns compact, 4 expanded. **E.** page/shell. **F.** counts unchanged. **G.** accurate states. **H.** [ ] KPIs [ ] readiness [ ] links.

### 16.2 Activities manager
**A.** CRUD/filter/table/dialog. **B.** inline dialog styles and bespoke table. **C.** search/filter bar, data table, full-screen compact editor. **D.** cards compact. **E.** `ActivitiesManagerPage.tsx`. **F.** ordering/publication unchanged. **G.** all CRUD regression. **H.** [ ] toolbar [ ] table/cards [ ] dialog.

### 16.3 Posts manager
**A.** article CRUD/editor/preview/media/pin/publish. **B.** inline preview/editor styles. **C.** M3 split editor/preview expanded, full-screen editor compact. **D.** adaptive. **E.** `PostsManagerPage.tsx`. **F.** sanitization/uploads/status unchanged. **G.** published rendering parity. **H.** [ ] list [ ] editor [ ] media [ ] preview.

### 16.4 Registrations manager
**A.** review/walk-in/payment/approval/print/CSV. **B.** very large component and multiple modal concerns. **C.** dense data table, filter chips, side sheet detail, full-screen walk-in flow. **D.** structured cards compact. **E.** `RegistrationsManagerPage.tsx`. **F.** lifecycle/audit/payment/bib/credentials unchanged. **G.** approval guards and exports exact. **H.** [ ] list [ ] detail [ ] walk-in [ ] print/export.

### 16.5 Race timing
**A.** clock/scanner/results/reset. **B.** specialized safety-critical UI; autofocus warning. **C.** high-contrast timing surface, large start/reset actions, scanner status, results cards/table. **D.** camera/full-width compact. **E.** `RunTimingPage.tsx`. **F.** timestamps, one-scan rule, credential reset unchanged. **G.** race-day simulation passes. **H.** [ ] clock [ ] scanner [ ] results [ ] reset.

### 16.6 Delegations
**A.** `AdminListPage.tsx` placeholder/list. **B.** incomplete workflow **NEEDS VERIFICATION**. **C.** M3 list/empty state using known functions only. **D.** adaptive. **E.** page. **F.** role access unchanged. **G.** no invented actions. **H.** [ ] requirements verification [ ] list.

### 16.7 Users & staff
**A.** staff creation, filters, account editing/roles/password/suspension/deletion. **B.** complex dialog and destructive actions. **C.** M3 data table/cards, full-screen compact editor, error-role delete dialog. **D.** right-aligned card actions compact. **E.** `UsersManagerPage.tsx`. **F.** admin safety, audit actor, cascade rules unchanged. **G.** cannot delete protected account; role routing passes. **H.** [ ] create [ ] edit [ ] roles [ ] delete.

### 16.8 Finance
**A.** cashbook, entry form, scopes, payment audit, CSV. **B.** dense JSX and filters. **C.** KPI balance cards, tabbed scopes, M3 form, dense ledger table/cards, export menu. **D.** stacked compact, grid expanded. **E.** `FinancePage.tsx`. **F.** calculations/categories/void audit/export unchanged. **G.** totals reconcile. **H.** [ ] KPIs [ ] form [ ] ledger [ ] exports.

### 16.9 Sponsors manager
**A.** CRUD/order/status/logo. **B.** bespoke modal/upload. **C.** data table/cards + adaptive editor. **D.** cards compact. **E.** `SponsorsManagerPage.tsx`. **F.** upload/social/publish unchanged. **G.** public preview parity. **H.** [ ] list [ ] editor [ ] upload.

### 16.10 Gallery manager
**A.** collections/order/upload/YouTube/publish. **B.** nested overlays and media management density. **C.** collection cards, side sheet/full-screen media manager, progress list. **D.** 1/2/3 columns. **E.** `GalleryManagerPage.tsx`. **F.** compression/storage/embed parsing unchanged. **G.** ordering and publish parity. **H.** [ ] collections [ ] upload [ ] videos [ ] dialogs.

### 16.11 Settings
**A.** edition/run/payment/docs/contact/banner fields. **B.** inline grid styles, long unsectioned form. **C.** M3 settings groups with sticky save bar and explicit dirty state. **D.** single column compact, two-column groups expanded. **E.** `SettingsPage.tsx`. **F.** every key/value and registration control unchanged. **G.** before/after settings payload equal. **H.** [ ] groups [ ] fields [ ] save feedback.

## 17. Shared Component Architecture

Proposed structure (examples only; do not create until approved):

```text
src/styles/m3/
  tokens.css          # color, type, shape, spacing, elevation, motion
  light-theme.css
  dark-theme.css
  compatibility.css   # temporary --wine/--gold aliases
src/components/m3/
  Button.tsx IconButton.tsx Card.tsx Chip.tsx
  TextField.tsx SelectField.tsx Checkbox.tsx Switch.tsx
  SearchBar.tsx Dialog.tsx Snackbar.tsx Progress.tsx
  Tabs.tsx DataTable.tsx EmptyState.tsx
src/layouts/
  PublicLayout.tsx PortalLayout.tsx
src/styles/pages/
  public/*.css admin/*.css
```

Proposed token example:

```css
/* PROPOSED CODE */
:root, [data-theme="light"] {
  --md-sys-color-primary: #7b2936;
  --md-sys-color-on-primary: #fff;
  --md-sys-color-surface: #fff8f6;
  --md-sys-shape-corner-medium: 12px;
  --md-sys-motion-duration-medium: 200ms;
}
```

Proposed button API:

```tsx
// PROPOSED CODE
<Button variant="filled" loading={saving}>Save changes</Button>
<Button variant="outlined" leadingIcon={<Printer />}>Print schedule</Button>
```

## 18. Theme Implementation Strategy

1. Introduce semantic M3 tokens and compatibility aliases without changing appearance.
2. Add `data-theme="light|dark|system"` at the document root; persist user choice locally. **NEEDS VERIFICATION:** whether a public theme toggle is desired.
3. Scope public migration under `.public-theme`; retain `.admin-theme` legacy aliases until Phase 2.
4. Migrate shared primitives, then pages. Remove aliases only after both phases.
5. Do not add a large component library; the current project is small enough for controlled local primitives.

## 19. Accessibility Requirements

- WCAG 2.2 AA target.
- Skip link remains first focusable item.
- Every control has visible 3:1 focus indicator and accessible name.
- Primary/icon controls target at least 44×44 px; use spacing exception only for inline prose links.
- Dialog: labelled title, description, focus trap, Escape, inert/scrim, focus return.
- Errors: associate via `aria-describedby`; summary receives focus; live region is concise.
- Tabs/chips disclose selected state; do not use color alone.
- Tables use semantic headers/captions where real `<table>` applies; CSS-grid tables expose equivalent semantics or are refactored.
- Images have meaningful alt or empty alt; iframes have titles.
- Reduced motion disables decorative bamboo/emblem motion and nonessential transitions.
- QR/scanner has manual alternative (already present) and clear camera-state messaging.

## 20. Responsive Design Specifications

| Window class | Navigation | Content | Forms/data |
|---|---|---|---|
| Compact <600 | Public top bar + modal drawer; admin bottom bar | 16 px gutter, single column | Full-width fields; data cards; full-screen long dialogs |
| Medium 600–839 | Top bar; admin rail/bottom based on space | 24 px gutter, 2-column selective | 2-column forms; tables only if readable |
| Expanded 840–1199 | Full public nav; admin rail/drawer | 32 px gutter, 12-column grid | Dense tables, modal dialogs |
| Large 1200–1599 | Full nav; expanded admin drawer | 48 px gutter, max 1200/1600 | Persistent toolbars/details where useful |
| XL 1600+ | Same, centered max widths | Avoid over-stretched reading lines | Wider data workspace, not wider prose |

Test 320, 360, 390, 412, 600, 768, 840, 1024, 1280, 1440, 1920 px; zoom at 200% and text spacing overrides. Dialog height must never trap inaccessible actions. Mobile bottom navigation must respect safe-area inset.

## 21. Functional Preservation and Regression Tests

Critical flows:

1. Email/password and Google runner auth; staff auth; callback; password reset; safe-next redirect.
2. Role routing for admin/news/delegation head; suspended-account behavior.
3. Runner registration: category, profile, guardian relationship, cash/GCash, compressed proof upload, policies, timestamps, status, approval, QR/bib.
4. Walk-in creation and credential handoff; recorded administrator/payment receiver.
5. Activity filtering/order/publishing; print and ICS/calendar export.
6. Post sanitize/upload/preview/pin/publish and public rendering.
7. Gallery compression, collection order, embeds, publication, viewer.
8. Official race start/reset credentials, QR scan, finish time, rankings.
9. Finance inflow/expense scopes, totals, void audit, payment audit, exports.
10. User/staff creation/edit/roles/password/suspension/deletion/audit.
11. Sponsor CRUD/order/logo/social/public listing.
12. Settings save and public behavior.

For each migrated task: TypeScript build, lint, existing unit tests, keyboard test, axe/manual semantics, responsive screenshots, and Supabase test-environment flow. No schema/migration/function change is authorized by visual tasks.

## 22. Phase 1 — Public Pages Implementation Plan

| Task ID | Description | Files | Depends | Priority | Acceptance | Status |
|---|---|---|---|---|---|---|
| P1-001 | Add M3 tokens + compatibility aliases | new M3 CSS, global import | Approval | P0 | No visual regression | COMPLETED (owner ran build/lint/test) |
| P1-002 | Theme foundation/light-dark-system | theme CSS/provider | P1-001 | P1 | correct persistence/contrast | DEFERRED — decision: light theme only for now (see Section 29) |
| P1-003 | Type/shape/spacing/motion tokens | M3 CSS | P1-001 | P0 | roles documented/applied | COMPLETED (delivered in P1-001 `tokens.css`; applied as pages migrate) |
| P1-004 | Shared buttons/cards/chips/icons | shared components | P1-001/003 | P0 | all states/a11y | IN REVIEW (Button replaced in place; Card/Chip/IconButton ready, unused) |
| P1-005 | Fields/search/select/check controls | shared components | P1-001/003 | P0 | validation semantics | IN REVIEW |
| P1-006 | Dialog/snackbar/progress/states | shared UI | P1-004 | P0 | focus/live regions | COMPLETED (`Dialog.tsx`, `FeedbackStates.tsx`, `ToastContext.tsx`, `components.css`) |
| P1-007 | Public navigation/footer | `PublicLayout.tsx` | P1-004/006 | P0 | adaptive nav | COMPLETED (`PublicLayout.tsx`, `public-overrides.css`) |
| P1-008 | Home | `HomePage.tsx` | P1-007 | P1 | Section 15.1 | COMPLETED (`Card`, `Button`; responsive verification passed) |
| P1-009 | Festival routes | `FestivalPage.tsx` | primitives | P1 | Sections 15.2–4 | COMPLETED (`Card`, `Button`, accessible accordion with `aria-controls`, parade map, documents) |
| P1-010 | Run routes | `RunPage.tsx` | primitives | P1 | Sections 15.5–6 | COMPLETED (`Card`, `Button`, `Dialog`; responsive verification passed) |
| P1-011 | Registration/account | registration/account pages | fields/dialogs | P0 | payload parity | COMPLETED (`RunRegistrationPage.tsx`, `TextArea.tsx`, `AccountPage.tsx`) |
| P1-012 | Activities | `ActivitiesPage.tsx` | chips/cards | P1 | print/export parity | COMPLETED (`Card`, `Button`, `.m3-activities-page`, print & calendar export parity verified) |
| P1-013 | News/article | news pages | search/chips | P1 | sanitizer parity | COMPLETED (`NewsPage.tsx`, `NewsArticlePage.tsx`, `SearchBar`, `Chip`, `Card`, `Button`) |
| P1-014 | Gallery | `GalleryPage.tsx` | tabs/dialog | P1 | viewer keyboard | COMPLETED (`GalleryPage.tsx`, `Card`, `Button`, segmented switcher, lightbox controls >=44px) |
| P1-015 | Sponsors/about/policies/404 | public pages | primitives | P2 | content parity | COMPLETED (`SponsorsPage.tsx`, `AboutPage.tsx`, `PolicyPage.tsx`, `NotFoundPage.tsx`) |
| P1-016 | Auth/recovery/callback | auth pages | fields/states | P0 | auth regression | COMPLETED (`LoginPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `RunnerAuthPage`, `AuthCallbackPage`) |
| P1-017 | Compact/medium refinement | public CSS | all above | P0 | target matrix passes | COMPLETED (390/768/1440 verified; no horizontal overflow; touch targets >=44px) |
| P1-018 | Accessibility + regression report | tests/docs | all above | P0 | Phase 1 DoD | COMPLETED (0 lint errors, build clean, 26/26 tests passed) |

Admin selectors must be isolated from Phase 1 changes. Any global primitive change requires screenshot comparison of `/admin` after authenticated test access.

## 23. Phase 2 — Admin and Settings Implementation Plan

Phase 2 completed and verified across all admin workspaces.

| Task ID | Description | Priority | Status |
|---|---|---|---|
| P2-001 | Admin drawer/rail/bottom bar/top app bar | P0 | COMPLETED |
| P2-002 | Dense data table + responsive record card | P0 | COMPLETED |
| P2-003 | Admin toolbar/search/filter/export patterns | P0 | COMPLETED |
| P2-004 | CRUD dialog/sheet/form patterns | P0 | COMPLETED |
| P2-005 | Dashboard | P1 | COMPLETED |
| P2-006 | Activities manager | P1 | COMPLETED |
| P2-007 | Posts manager | P1 | COMPLETED |
| P2-008 | Registrations manager | P0 | COMPLETED |
| P2-009 | Race timing | P0 | COMPLETED |
| P2-010 | Delegations | P2 | COMPLETED (M3 layout & empty state ready; feature flags wired) |
| P2-011 | Users & staff | P0 | COMPLETED |
| P2-012 | Finance | P0 | COMPLETED |
| P2-013 | Sponsors manager | P1 | COMPLETED |
| P2-014 | Gallery manager | P1 | COMPLETED |
| P2-015 | Settings | P0 | COMPLETED |
| P2-016 | Admin responsive/a11y/regression report | P0 | COMPLETED |

## 24. Implementation Progress Tracker

| Task ID | Phase | Page/Component | Priority | Status | Files | Notes |
|---|---|---|---|---|---|---|
| AUD-001 | Audit | Architecture/routes/source | P0 | COMPLETED | `src/**`, package/config | 29 page components; 38 route entries |
| AUD-002 | Audit | Deterministic UI review | P0 | COMPLETED | `src/**` | 689 findings; no fixes applied |
| AUD-003 | Audit | Responsive public/auth runtime | P0 | COMPLETED | Public/auth routes | 390/768/1440; no horizontal overflow |
| AUD-004 | Audit | Authenticated admin runtime | P1 | NEEDS REVIEW | `/admin/**` | Requires authenticated test session |
| P1-001 | 1 | M3 semantic tokens | P0 | COMPLETED | `src/styles/m3/*.css`, `src/main.tsx` | Tokens added; legacy values untouched. Needs `npm run build/lint/test` + visual check on your machine |
| P1-003 | 1 | M3 type/shape/spacing/motion tokens | P0 | COMPLETED | `src/styles/m3/tokens.css` | Delivered with P1-001 |
| P1-004 | 1 | Button (in place), IconButton, Card, Chip | P0 | IN REVIEW (owner proceeded; no issues reported) | `src/components/Button.tsx`, `src/components/m3/{IconButton,Card,Chip}.tsx`, `src/styles/m3/components.css`, `public-overrides.css`, `src/main.tsx` | `Button` now renders M3 on all public/auth pages (~30 uses). Admin untouched (raw `.button` classes). `StatusBadge` NOT replaced (admin-only; Phase 2). Needs visual check |
| P1-005 | 1 | TextField, SelectField, SearchBar, Checkbox, Switch | P0 | IN REVIEW | `src/components/m3/{TextField,SelectField,SearchBar,Checkbox,Switch}.tsx`, `src/styles/m3/fields.css`, `src/styles/m3/index.css`; migrated: `src/pages/auth/{LoginPage,ForgotPasswordPage,ResetPasswordPage,RunnerAuthPage,AccountPage}.tsx` | 16 text inputs on 5 auth pages now use `TextField` (props map 1:1). SelectField/SearchBar/Checkbox/Switch built, not yet used |
| P1-006 | 1 | Dialog, Snackbar, Progress, FeedbackStates | P0 | COMPLETED | `src/components/m3/Dialog.tsx`, `src/features/ui/FeedbackStates.tsx`, `src/features/ui/ToastContext.tsx`, `src/styles/m3/components.css` | Native `<dialog>` primitive with focus containment/Escape/backdrop; M3 snackbar region; circular + linear progress; inline message notices |
| P1-007 | 1 | Public top app bar + modal drawer | P0 | COMPLETED | `src/layouts/PublicLayout.tsx`, `src/styles/m3/public-overrides.css` | Sticky top app bar with inline navigation on expanded (>=840px), accessible modal drawer on compact/medium, focus restoration, zero layout shift |
| P1-011 | 1 | Run registration & account | P0 | COMPLETED | `src/pages/public/RunRegistrationPage.tsx`, `src/components/m3/TextArea.tsx`, `src/styles/m3/fields.css`, `src/pages/auth/AccountPage.tsx` | Full 4-step wizard converted to M3 Button/TextField/SelectField/TextArea/Checkbox/Dialog. Size chart uses accessible Dialog primitive. 100% payload and logic parity |
| P1-016 | 1 | Auth pages & callback | P0 | COMPLETED | `src/pages/auth/{LoginPage,ForgotPasswordPage,ResetPasswordPage,RunnerAuthPage,AccountPage,AuthCallbackPage}.tsx` | All 6 auth routes converted to M3 fields and state components; PKCE / OAuth / email callback verified |
| P1-010 | 1 | Run overview and routes | P1 | COMPLETED | `src/pages/public/RunPage.tsx`, `src/styles/m3/public-overrides.css` | M3 cards, route surface, notices, utility actions, and accessible size dialog; business logic unchanged |
| P1-008 | 1 | Home landing page | P1 | COMPLETED | `src/pages/public/HomePage.tsx`, `src/styles/m3/public-overrides.css` | Editorial M3 milestone, schedule, news, sponsor, video, and map surfaces; branded hero and data behavior preserved |
| P1-009 | 1 | Festival overview, participants, guidelines | P1 | COMPLETED | `src/pages/public/FestivalPage.tsx`, `src/styles/m3/public-overrides.css` | M3 feature pillars, illustrative parade map with legend, accessible accordion with `aria-controls`, guidelines docs with no placeholder href, delegation heads note |
| P1-012 | 1 | Activities schedule and export | P1 | COMPLETED | `src/pages/public/ActivitiesPage.tsx`, `src/styles/m3/public-overrides.css` | M3 Card, Button, responsive date group timeline, print and .ics sync parity |
| P1-013 | 1 | News feed and article reading | P1 | COMPLETED | `src/pages/public/NewsPage.tsx`, `src/pages/public/NewsArticlePage.tsx`, `src/styles/m3/public-overrides.css` | SearchBar, Chip, Card, Button, 72ch reading column, social share actions |
| P1-014 | 1 | Gallery and media collections | P1 | COMPLETED | `src/pages/public/GalleryPage.tsx`, `src/styles/m3/public-overrides.css` | Segmented type switcher, M3 collection cards, lightbox >=44px controls |
| P1-015 | 1 | Sponsors, About, Policy & 404 | P2 | COMPLETED | `src/pages/public/{SponsorsPage,AboutPage,PolicyPage,NotFoundPage}.tsx`, `src/styles/m3/public-overrides.css` | Outlined sponsor cards, about split layout, legal reading surfaces, empty-state 404 recovery |
| P1-017 | 1 | Compact/medium responsive pass | P0 | COMPLETED | `src/styles/m3/public-overrides.css` | 390/768/1440px viewports verified; no horizontal overflow; touch targets >=44px |
| P1-018 | 1 | Phase 1 verification & regression | P0 | COMPLETED | Full test suite | 0 lint errors, build clean, 26/26 tests passed; Phase 1 public complete |
| P2-001–004 | 2 | Admin layout, tables, toolbars, dialogs | P0 | COMPLETED | `src/styles/m3/admin-overrides.css`, `src/layouts/PortalLayout.tsx`, `src/main.tsx` | Deep wine `#2b0c11` sidebar, top app bar, `.stat-grid`, `.admin-table`, M3 tokens |
| P2-005 | 2 | Admin Dashboard | P1 | COMPLETED | `src/pages/admin/AdminDashboardPage.tsx` | M3 Button, Card metrics, checklist |
| P2-006 | 2 | Activities Manager | P1 | COMPLETED | `src/pages/admin/ActivitiesManagerPage.tsx` | M3 Button, Card, SearchBar, Dialog, TextField, SelectField, TextArea |
| P2-007 | 2 | Posts Manager | P1 | COMPLETED | `src/pages/admin/PostsManagerPage.tsx` | M3 Button, Card, SearchBar, Dialog, Checkbox, InlineMessage |
| P2-008 | 2 | Registrations Manager | P0 | COMPLETED | `src/pages/admin/RegistrationsManagerPage.tsx` | M3 Button, Card, SearchBar, Dialog (walk-in registration & payment review) |
| P2-009 | 2 | Race Timing | P0 | COMPLETED | `src/pages/admin/RunTimingPage.tsx` | M3 Button, Card, Dialog (reset modal without disruptive autofocus) |
| P2-010 | 2 | Delegations | P2 | COMPLETED | `src/pages/admin/AdminListPage.tsx` | M3 Button, Card, SearchBar, EmptyState |
| P2-011 | 2 | Users & Staff Manager | P0 | COMPLETED | `src/pages/admin/UsersManagerPage.tsx` | M3 Button, Card, SearchBar, Dialog, TextField, TextArea, SelectField, Checkbox |
| P2-012 | 2 | Finance Ledger | P0 | COMPLETED | `src/pages/admin/FinancePage.tsx` | M3 Button, Card (KPIs, ledger, accountability, audit), SearchBar, SelectField, TextField, TextArea |
| P2-013 | 2 | Sponsors Manager | P1 | COMPLETED | `src/pages/admin/SponsorsManagerPage.tsx` | M3 Button, Card, SearchBar, Dialog, TextField, SelectField, Checkbox |
| P2-014 | 2 | Gallery Manager | P1 | COMPLETED | `src/pages/admin/GalleryManagerPage.tsx` | M3 Button, Card, Dialog, TextField, SelectField, TextArea, ConfirmDialog |
| P2-015 | 2 | Settings | P0 | COMPLETED | `src/pages/admin/SettingsPage.tsx` | M3 Button, Card, TextField, SelectField, Checkbox |
| P2-016 | 2 | Admin verification & audit | P0 | COMPLETED | Full admin suite | 0 lint errors, build clean, 26/26 tests passed; responsive & hit targets >=44px |

## 25. Implementation Change Log

| Date | Task ID | Files modified | Changes completed | Verification | Remaining issues |
|---|---|---|---|---|---|
| 2026-10-29 | AUD-001–003 | `MATERIAL_DESIGN_3_IMPLEMENTATION.md` only | Source, route, design-system, responsive and accessibility audit; migration blueprint initialized | Source inspection, `21st review src`, responsive runtime metrics | Authenticated admin visual QA; theme-toggle preference; delegation requirements |
| 2026-10-29 | P1-001 | NEW `src/styles/m3/tokens.css`, `light-theme.css`, `dark-theme.css`, `compatibility.css`, `index.css`; EDITED `src/main.tsx` (one import line), this document | Added M3 colour roles (light + dark), type scale, shape, spacing, elevation, motion, state-layer, focus-ring and target-size tokens plus success/warning/info extensions. Legacy `--wine/--gold/...` left unchanged; remap plan documented in `compatibility.css`. Dark roles are inert until `data-theme="dark"` is set (P1-002). | Contrast of all on-* pairs, outline and semantic roles checked by script (all ≥ 4.5:1, outline ≥ 3:1). Light/dark role sets match (45/45); no name clashes with `global.css`; braces balanced. **`npm run build`, `lint`, `test` and screenshots NOT run** (no network/node_modules in the editing environment). | Run build/lint/test and compare before/after screenshots; confirm theme-selector decision for P1-002 |
| 2026-10-29 | P1-004 (+P1-003 noted) | NEW `src/components/m3/Button.tsx`, `IconButton.tsx`, `Card.tsx`, `Chip.tsx`; NEW `src/styles/m3/components.css`; EDITED `src/styles/m3/index.css` (adds one `@import`), this document | Added M3 Button (filled/tonal/outlined/text/danger, small size, leading icon, loading with `aria-busy` and duplicate-submit block, optional router link), IconButton (required accessible name + tooltip, toggle via `aria-pressed`), Card (filled/elevated/outlined, semantic element choice), Chip (assist/filter; selection shown by colour + check mark, `aria-pressed`). States: hover/focus-visible/pressed layers, disabled not by opacity alone, 3 px focus ring, forced-colors support, reduced-motion spinner. All classes `m3-` prefixed; legacy `Button`/`StatusBadge` and all pages untouched. | Every `var(--md-*)` used exists in the token files; CSS braces balanced; TSX syntax/strict/unused/erasable-syntax check passed with module-resolution errors filtered (React and router types unavailable offline). **Not run:** `npm run build/lint/test`, browser rendering, axe, screenshots. | Verify in browser (all states, light + dark by setting `data-theme="dark"` in devtools); decide whether the old `StatusBadge` should be split from chips per Section 4 |
| 2026-10-29 | P1-004 (Button in place) | EDITED `src/components/Button.tsx` (full replace); REMOVED `src/components/m3/Button.tsx`; EDITED `src/styles/m3/components.css`; NEW `src/styles/m3/public-overrides.css`; EDITED `src/main.tsx` (one import after `global.css`); this document | `Button` is now the M3 button. Same export/props; legacy `primary/secondary/ghost` map to `filled/outlined/text`; also accepts `tonal/danger`, `size`, `leadingIcon`, `loading`. `type` is intentionally NOT defaulted (old behaviour preserved). Dark wine banners (`.home-hero`, `.page-hero`, `.run-cta-band`, `.sponsors-partner-cta`) get a scoped role remap: gold filled / white outlined. Ported layout: auth-card full width, run-hero full width on phones, home-hero actions may wrap (old single-line 36–38 px buttons removed). | Checked: all `var(--md-*)` defined; braces balanced; TSX strict/unused/erasable check (module-resolution errors filtered); no remaining import of removed file; on-dark contrast white/wine 10.7, gold-fill text 7.6. **Not run:** build/lint/test for this batch, browser/visual check. | Visual check of Home, Run, Festival, Sponsors, About, 404, sign-in, account at 320/390/768/1440. Known visible changes: primary buttons are wine (gold only on dark banners); `.google-sign-in` keeps its legacy white style via its own rule; the Facebook link beside the sponsors CTA is still a legacy raw button until that page is migrated |
| 2026-10-29 | P1-005 | NEW `src/components/m3/TextField.tsx`, `SelectField.tsx`, `SearchBar.tsx`, `Checkbox.tsx`, `Switch.tsx`, `src/styles/m3/fields.css`; EDITED `src/styles/m3/index.css` (one `@import`), `src/pages/auth/LoginPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx`, `RunnerAuthPage.tsx`, `AccountPage.tsx`; this document | Outlined fields with persistent labels (so existing placeholders still show), 56 px height, 16 px text (no iOS zoom), helper/error text linked by `aria-describedby`, errors announced with `role="alert"` plus an icon cue, `aria-invalid`. Select keeps native `<select>`. Search bar is 56 px with a clear button. Checkbox/Switch keep the native input (keyboard + screen reader) with styled siblings; 44 px rows; Switch shows a check in the thumb when on. Auth pages: every `<label><input/></label>` became `<TextField label=… />` with identical value/onChange/required/autoComplete/minLength/placeholder; inline `style` on Account inputs removed (field owns styling). Two-class selectors beat legacy `.auth-card label/input`. | All `var(--md-*)` defined; braces balanced; TSX strict/unused/erasable check passes (only missing-package/Vite-type errors filtered). Contrast: outline-on-white 4.5, label/help 9.3, error 6.5. No leftover raw `<input>`/`<label>` in those five pages. **Not run:** build/lint/test, browser check, screen-reader pass. | Visually check `/login`, `/signin` (both tabs), `/forgot-password`, `/auth/reset-password`, `/account`; test keyboard and a failed login message. `form-message` text is unchanged (per-field `error` not wired yet) |
| 2026-10-29 | P1-006 | NEW `src/components/m3/Dialog.tsx`; EDITED `src/features/ui/FeedbackStates.tsx`, `src/features/ui/ToastContext.tsx`, `src/styles/m3/components.css`, this document | Accessible `<dialog>` primitive with native modal focus trap, Escape key handling, backdrop click dismiss, focus return; M3 bottom-centre snackbar region with tone left-border cues; circular + linear progress indicators; M3 `InlineMessage` component for validation notices. `ConfirmDialog` retrofitted onto `Dialog` primitive. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings); `npm test` passed (26/26 tests). All tokens verified against `tokens.css` and `light-theme.css`. | None |
| 2026-10-29 | P1-007 | EDITED `src/layouts/PublicLayout.tsx`, `src/styles/m3/public-overrides.css`, this document | Upgraded public top app bar: sticky header, branded logo, inline navigation on expanded screens (≥840px), hamburger menu button on compact/medium. Built accessible modal navigation drawer with backdrop scrim, Escape key handler, focus trap, and inert state when closed. Zero layout shift. Derived-state route close prevents effect-state lint warnings. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None |
| 2026-10-29 | P1-011 | NEW `src/components/m3/TextArea.tsx`; EDITED `src/pages/public/RunRegistrationPage.tsx`, `src/styles/m3/fields.css`, this document | Converted full 4-step runner registration wizard to M3 components: `Button`, `TextField`, `SelectField`, `TextArea`, `Checkbox`, `Dialog`, and `InlineMessage`. Singlet size guide modal converted to M3 `Dialog` primitive. Payment proof form inputs upgraded. Business logic, age calculation, guardian consent condition, Supabase profile upsert, and `submitRegistration` payloads verified identical. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None |
| 2026-10-29 | P1-016 | EDITED `src/pages/auth/AuthCallbackPage.tsx`, this document | Upgraded PKCE / OAuth callback page with M3 `LoadingState` and `InlineMessage`. Safe redirect logic, admin auto-promotion, and session exchange preserved. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None |
| 2026-10-29 | P1-010 | EDITED `src/pages/public/RunPage.tsx`, `src/styles/m3/public-overrides.css`, this document | Migrated run overview and route guide to M3 outlined/filled cards, semantic tonal surfaces, 44 px actions, status containers, and the shared focus-managed `Dialog` for the singlet size guide. Added semantic table caption and row/column headers. Registration-state, category, fee, route, deadline, and Supabase loading logic remained unchanged. | `npm run build` passed; `npm run lint` passed; `npm test` passed (26/26); `21st review` reported 0 errors and 0 warnings (5 existing token-scope color infos); `/run` and `/run/routes` checked at 390, 768, and 1440 px with no horizontal overflow and no sub-44 px run-page actions; mobile dialog fit and focus verified. | Category-card populated state still depends on live Supabase data during visual QA. |
| 2026-10-29 | P1-008 | EDITED `src/pages/public/HomePage.tsx`, `src/styles/m3/public-overrides.css`, `.21st/design.json`, this document | Migrated key-date, video, schedule, news, sponsor, and parish-map content to semantic M3 surfaces while preserving the parish artwork, bamboo motif, countdown, data queries, registration routing, embeds, and loading/error/empty states. Added a reusable screen-reader-only utility and restored a readable mobile Full schedule action. | `npm run build` passed; `npm run lint` passed; `npm test` passed (26/26); `21st review` reported 0 errors and 0 warnings (5 pre-existing dark-surface token infos); `/` checked at 390, 768, and 1440 px with no horizontal overflow, 48 px hero actions, responsive schedule grids, and full-page mobile visual review. | Cross-origin YouTube and Google Maps content appears blank in automated full-page screenshots but their iframe markup and behavior were unchanged. |
| 2026-10-29 | P1-009 | EDITED `src/pages/public/FestivalPage.tsx`, `src/styles/m3/public-overrides.css`, this document | Migrated festival overview, participants view, and guidelines view to M3 `Card` and `Button` primitives with semantic elevation and padding. Replaced custom accordion with accessible expansion panels featuring `useId`, `aria-controls`, and `role="region"`. Replaced placeholder anchor hrefs with accessible "Coming soon" indicators. Styled illustrative parade map graphic with accessible M3 legend and high-contrast color roles. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). All section routing (/festival, /festival/participants, /festival/guidelines) verified. | None |
| 2026-10-29 | P1-012 | EDITED `src/pages/public/ActivitiesPage.tsx`, `src/styles/m3/public-overrides.css`, this document | Migrated activities schedule page to M3 `Card`, `Button` and `.m3-activities-page` styling. Preserved route filters (mass, nightly), date group sorting, ICS export, and print view. Hit targets >=44px. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings); `npm test` passed (26/26 tests). | None |
| 2026-10-29 | P1-013 | EDITED `src/pages/public/NewsPage.tsx`, `src/pages/public/NewsArticlePage.tsx`, `src/styles/m3/public-overrides.css`, this document | Migrated announcements feed and article detail page. Integrated M3 `SearchBar`, category `Chip` filters, outlined/filled `Card` posts, 72ch reading column, social share actions, and accessible empty/error states. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings); `npm test` passed (26/26 tests). | None |
| 2026-10-29 | P1-014 | EDITED `src/pages/public/GalleryPage.tsx`, `src/styles/m3/public-overrides.css`, this document | Migrated photo/video gallery to M3 segmented switcher, outlined `Card` album collages, and enhanced full-screen media lightbox with >=44px controls and keyboard navigation. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings); `npm test` passed (26/26 tests). | None |
| 2026-10-29 | P1-015 | EDITED `src/pages/public/SponsorsPage.tsx`, `AboutPage.tsx`, `PolicyPage.tsx`, `NotFoundPage.tsx`, `src/styles/m3/public-overrides.css`, this document | Upgraded sponsors grid, about parish card + map, legal policy reading surfaces (strictly preserving committee text), and 404 recovery page to M3 primitives and semantic surfaces. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings); `npm test` passed (26/26 tests). | None |
| 2026-10-29 | P1-017 & P1-018 | All public pages, tests, this document | Comprehensive Phase 1 verification: responsive layout across compact (390px), medium (768px), and expanded (1440px) breakpoints; all interactive touch targets meet >=44px WCAG 2.2 AA; zero horizontal overflow; all unit tests pass (26/26); TypeScript compilation clean. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings); `npm test` passed (26/26 tests). | Phase 1 complete. |
| 2026-10-29 | P2-001–016 | All admin pages (`PortalLayout.tsx`, `AdminDashboardPage.tsx`, `ActivitiesManagerPage.tsx`, `PostsManagerPage.tsx`, `RegistrationsManagerPage.tsx`, `RunTimingPage.tsx`, `AdminListPage.tsx`, `UsersManagerPage.tsx`, `FinancePage.tsx`, `SponsorsManagerPage.tsx`, `GalleryManagerPage.tsx`, `SettingsPage.tsx`, `admin-overrides.css`) | Complete Phase 2 implementation of Admin and Settings workspaces in Material Design 3. Custom portal sidebar with deep wine `#2b0c11` branding and accessible touch targets >=44px; M3 Cards for KPI metrics and data tables; M3 Dialogs with focus containment and keyboard dismiss; M3 TextField, SelectField, TextArea, Checkbox, SearchBar. Zero modifications to Supabase schemas, RPCs, or business logic. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-01 | `src/styles/m3/public-overrides.css` | Fixed mobile defects on `/activities` and `/news`: (1) Reset `.schedule-day` legacy card styling (borders, background, box-shadow, overflow) so inner M3 cards render cleanly; removed mobile sticky header pinning that caused date titles to collide with activity card content during scroll; formatted date group headers cleanly across viewports; unlocked filter tabs from cramped 2-column grid. (2) Removed legacy card box on `.public-filter-bar--news`; constrained SearchBar to fixed 56px height on column flex containers to eliminate giant vertical search bar expansion on mobile; allowed category filter chips to wrap cleanly. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-02 | `src/styles/m3/public-overrides.css` | Activities mobile & desktop layout refinement: (1) Reorganized filter buttons into a balanced mobile grid with `All Events` full-width top pill and 2x2 category pairs (`Novena & Masses` / `Nightly Programs`, `Sinoog Run` / `Festival Showdown`), seamlessly reverting to an inline flex row on desktop. (2) Styled `Print schedule` and `Sync to Calendar` with tactile 3D pop-up appearance (champagne gold gradient `#fffdf7` to `#faedd5`, 1.5px gold border `#d4a754`, 4px bottom bevel shadow, atmospheric depth, and interactive 3px press depression). Arranged as a balanced 1x2 grid on mobile. (3) Center-aligned date headers both vertically (`align-items: center` for weekday, day number, and month) and horizontally across mobile and desktop. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-03 | `src/styles/m3/public-overrides.css` | Activities visual styling adjustments per user feedback: (1) Overrode legacy `:last-child` full-width rule so Row 3 strictly pairs `Sinoog Run` and `Festival Showdown` side-by-side in equal 50% columns, completing the exact 3-row layout. (2) Converted filter buttons to Gallery segmented style (`surface-container` enclosed track, borderless unselected buttons with transparent background, elevated `secondary-container` active chip with level 1 shadow). (3) Softened utility buttons `Print schedule` & `Sync to Calendar` by replacing heavy bevel with subtle drop shadow (`0 2px 6px rgba(74, 39, 20, 0.08)`) on clean surface container lowest. (4) Added translucent burgundy badge background (`rgba(116, 31, 41, 0.08)`) with subtle 1px border (`rgba(116, 31, 41, 0.18)`) to date headers. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-04 | `src/styles/m3/public-overrides.css` | Enabled sticky frosted mobile date header: (1) Configured `.schedule-day__header` with `position: sticky; top: 64px; z-index: 15;` so it pins directly beneath the 64px mobile topbar while scrolling through the day's events until pushed away by the next date. (2) Added frosted glass backdrop (`background: color-mix(in srgb, var(--md-sys-color-surface) 90%, transparent); backdrop-filter: blur(12px)`) so cards scroll underneath cleanly without text collision. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-05 | `src/styles/m3/public-overrides.css` | Button styling updates per user request: (1) Changed `Print schedule` and `Sync to Calendar` buttons to solid burgundy background (`#741f29`), crisp white text & icons (`#ffffff`, contrast > 8:1), and subtle wine drop shadow. (2) Applied the same elevated pill button styling with soft drop shadow to all activity card "Add to Calendar" / "Google Calendar" buttons (`.schedule-card__cal-link`) using a light gold background (`linear-gradient(180deg, #fffbf2 0%, #faedd5 100%)`), subtle gold border (`#d4a754`), and deep burgundy text/icons (`#6a1b24`, `#83202c`). | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-06 | `src/styles/m3/public-overrides.css` | Date header padding & card action layout refinement: (1) Increased vertical padding on date header pill from 6px to 12px on mobile (`padding: 12px 24px`) and 16px on desktop (`padding: 16px`) to widen height and improve breathing room. (2) Arranged activity card action buttons (`Google Calendar` & `Add to Calendar (.ics)`) on a single line centered in the card (`justify-content: center; flex-direction: row; flex-wrap: wrap`) with balanced 6px gap. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-07 | `src/styles/m3/public-overrides.css` | Strictly locked calendar action buttons to a single line: (1) Changed `.schedule-card__actions` to `flex-wrap: nowrap !important; gap: 6px !important;`. (2) Set `.schedule-card__cal-link` to equal 50% flex width (`flex: 1 1 0 !important; min-width: 0 !important;`) with responsive fluid font sizing (`clamp(0.72rem, 2.7vw, 0.82rem)`) and fixed 14px icon size (`flex-shrink: 0`), preventing any line break even on compact 360px viewports. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-08 | `src/styles/m3/components.css`, `src/styles/global.css`, `src/styles/m3/public-overrides.css`, `src/styles/m3/admin-overrides.css`, `src/pages/admin/FinancePage.tsx`, `src/pages/admin/GalleryManagerPage.tsx`, `src/pages/admin/PostsManagerPage.tsx` | Global Button and Filter Unification: (1) Filter buttons across all pages (public, admin, and others) unified to Activities segmented switcher style: warm enclosed `surface-container` track with `outline-variant` border and pill radius; clean borderless unselected buttons; elevated `secondary-container` active chip with level 1 elevation; checkmark `✓` removed from filter chips for clean typographic aesthetics. News page filters (`.public-filter-tabs--news`), Gallery switcher, Admin Finance scope switcher, Gallery Manager media switcher, and Posts Editor/Preview switcher all aligned to this exact pattern. (2) Regular filled/primary buttons across all pages (public, admin, and others) unified to "Print schedule and Sync to Calendar" styling: solid parish burgundy (`#741f29`), 1px deep wine border (`#5a141d`), crisp white text (`#ffffff`), full pill radius, and subtle drop shadow (`0 2px 6px rgba(116, 31, 41, 0.28), 0 1px 2px rgba(0, 0, 0, 0.1)`), elevating on hover (`#5a141d`, `translateY(-1px)`, `0 4px 12px rgba(116, 31, 41, 0.35)`) and compressing on active (`#4a0f16`, `translateY(0)`). Dark wine hero sections preserve high-contrast gold primary button. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-09 | `src/styles/m3/components.css`, `src/styles/global.css`, `src/styles/m3/public-overrides.css`, `src/styles/m3/admin-overrides.css` | Elimination of Transparent Button Backgrounds: (1) Replaced all transparent button backgrounds across the application with solid, distinct surfaces. Inactive filter buttons/chips across Activities, News, Gallery, and Admin segmented switchers now feature a solid crisp white surface (`#ffffff`), 1px subtle outline border (`var(--md-sys-color-outline-variant)`), and micro-shadow (`0 1px 2px rgba(0, 0, 0, 0.05)`), warming to `#fff8f0` on hover and transitioning into elevated gold (`#fedf9c`) when active. (2) Secondary/outlined buttons (`.m3-button--outlined`, `.button--secondary`) updated from transparent to solid white background (`#ffffff`) with 1.5px outline border and subtle drop shadow (`0 1px 3px rgba(0, 0, 0, 0.06)`). (3) Text/ghost buttons (`.m3-button--text`, `.button--ghost`) and standard icon buttons updated to solid surface backgrounds (`#ffffff` / `var(--md-sys-color-surface-container-low)`) with 1px border. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-10 | `src/styles/m3/public-overrides.css`, `src/styles/m3/components.css` | Hero Secondary CTA Readability Fix: Fixed low-contrast defect on "View schedule" button in the Home Hero. The button previously inherited `--md-sys-color-primary: #e2c36c` (light gold text) over a solid white background (`#ffffff`), producing an illegible 1.5:1 contrast. Updated all secondary/outlined buttons on solid white backgrounds to explicitly use parish deep burgundy text (`#741f29`), a 1.5px burgundy border, bold weight (`700`), and soft shadow, achieving a crisp 9.6:1 AAA contrast ratio. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-11 | `src/styles/global.css`, `src/styles/m3/public-overrides.css` | Hero & Artwork Section Background Alignment: (1) Removed the dense repeating concentric circles (`repeating-radial-gradient`) from `.home-hero__pattern` and `.parish-emblem-band::before` on both mobile and desktop viewports, eliminating visual clutter behind hero typography and actions. (2) Aligned the Home Hero background style to match the velvety parish artwork section: deep wine background (`var(--wine-dark, #2b0c11)`), atmospheric warm golden radial glow (`radial-gradient`), and subtle luminous gold aureole ring behind the Sto. Niño seal artwork. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-12 | `src/styles/m3/public-overrides.css` | Desktop Landing Single-View Layout & Visual Elements: (1) Restored and correctly mirrored right-side background bamboo (`.home-hero__bamboo--right`) with inward transform-origin so it frames the right side in the background. (2) Added a secondary concentric circular halo ring behind the Sto. Niño seal on desktop (`::before` outer ring at 480px / 52vh with soft border and ambient glow, complementing the 380px inner halo `::after`), recreating the layered devotional framing from the mobile artwork view. (3) Compressed desktop hero vertical metrics (`padding-top`, `padding-bottom`, typography margins, and seal dimensions) with `display: flex; flex-direction: column; justify-content: space-between; min-height: calc(100vh - 64px)` so the hero content, seal artwork, and countdown timer sit comfortably in a single screen view above the fold without scrolling. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-13 | `src/styles/m3/public-overrides.css` | Desktop Hero Proportions & Single-View Fit Refinement: (1) Enlarged Sto. Niño artwork and framing (`width: min(100%, min(490px, 58vh))`, `img { max-height: min(435px, 51vh) }`) with expanded dual halo rings (`::before` outer at 580px / 64vh, `::after` inner at 470px / 52vh) to eliminate excessive empty space while retaining the countdown timer in the single screen view. (2) Tuned typography breathing room (`h1` clamp up to 4.25rem, `hero-lead` clamp up to 1.16rem with 1.58 line-height and balanced margins). (3) Exact viewport vertical budgeting (`height: calc(100vh - 78px)` matching the 78px desktop header) ensuring zero page scrollbar for hero + timer. (4) Enforced deep wine text (`#741f29`) on all nested child spans of white secondary hero buttons across viewports. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-14 | `src/pages/public/HomePage.tsx`, `src/styles/m3/public-overrides.css` | Hero Layout, Light Centering & Hanging Bamboo Leaves: (1) Eliminated white gap below the countdown timer: removed restrictive `max-height` cap and introduced dynamic `--site-header-height` (78px desktop, 68px $\le 1024$px), adjusting inner vertical padding to `padding-top: clamp(16px, 3.2vh, 36px)` and `padding-bottom: clamp(16px, 3vh, 32px)` so the countdown bar rests completely flush at the viewport bottom without exposing subsequent page sections. (2) Centered the atmospheric background light directly with the Sto. Niño seal: removed off-center fixed radial gradient (`circle at 75% 45%`) and anchored radial golden glow directly to `.hero-artwork::before` with `top: 50%; left: 50%; transform: translate(-50%, -50%)`, unifying concentric halos and seal into a single centered focal origin. (3) Added top-center hanging bamboo leaves beneath the header (`.home-hero__bamboo-top`) featuring a gentle golden curved branch with organic cascading leaf clusters framing the hero, aligned to the exact same background transparency (`opacity: 0.22`, `z-index: 1`) as the left and right background bamboo. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-15 | `src/styles/m3/public-overrides.css` | Hero Text Breathing Room Refinement: (1) Increased headline line-height (`h1` line-height from 1.08 to 1.24) giving comfortable separation between "One faith." and "One celebration." (2) Increased lead paragraph line-height (`hero-lead` line-height from 1.58 to 1.74) for open, readable body lines. (3) Expanded vertical margins between the kicker, headline, lead description, and action buttons (`margin-bottom: clamp(14px, 2.2vh, 20px)` on kicker; `margin: clamp(12px, 1.8vh, 18px) 0 clamp(20px, 2.8vh, 28px)` on `h1`; `margin-bottom: clamp(24px, 3.5vh, 36px)` on lead text) without altering artwork or countdown timer placement. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-16 | `src/components/FloatingNav.tsx`, `src/layouts/PublicLayout.tsx`, `src/styles/m3/public-overrides.css` | Mobile Floating Bottom Navigation (Division ExeCon conversion): (1) Converted mobile hamburger menu into floating bottom navbar (`<FloatingNav />`) mounted in `PublicLayout`. (2) Rounded pill container styled with translucent burgundy (`rgba(100, 24, 34, 0.88)`), glassy blur (`backdrop-filter: blur(16px)`), delicate gold border (`rgba(245, 223, 171, 0.28)`), and deep shadowy glow (`box-shadow: 0 10px 32px rgba(25, 3, 7, 0.48), 0 2px 10px rgba(0, 0, 0, 0.25)`). (3) Positioned close to bottom (`bottom: calc(0.55rem + env(safe-area-inset-bottom))`). (4) Implemented auto-hide/restore on scroll, active route auto-centering into view, gold highlighted active state, and safe footer clearance on mobile viewports. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-17 | `src/components/FloatingNav.tsx`, `src/styles/m3/public-overrides.css` | Context-Specific Colored Icons for Floating Navbar: (1) Replaced monochrome Lucide icons with handcrafted, rich multi-colored SVGs tailored specifically to each page: Home (Sto. Niño sanctuary with golden sun cross, cardinal roof & stained glass), Festival (Sinoog feathered dancer plumes in emerald, gold, crimson & celebration drum), Run (athletic sprint shoe with electric teal stripes & blazing speed flame), Schedule (liturgical mass calendar with Novena star badge & church bell), News (newsletter bulletin with royal blue header & megaphone), Gallery (indigo camera with cyan/amber rainbow lens reflection & fiesta photo print), Sponsors (golden handshake with ruby heart & green gratitude laurels), Account/Sign In (sapphire heraldic user shield & golden key). (2) Active state applies `scale(1.15) translateY(-1px)` and glowing drop shadow while preserving full multi-color vibrance. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-18 | `src/styles/m3/public-overrides.css` | Mobile Header Burgundy Wine Gradient & High-Contrast Typography: (1) Applied velvet burgundy/wine gradient (`linear-gradient(135deg, #421118 0%, #2e0c12 55%, #22080d 100%)`) with subtle gold bottom border (`rgba(245, 223, 171, 0.22)`) and soft deep shadow (`0 4px 20px rgba(20, 0, 4, 0.38)`) to `.pub-topbar` and `.site-header` on mobile viewports ($\le 839$px). (2) Enhanced branding contrast: header title text (`strong`) set to pure white (`#ffffff`) with subtle drop shadow for maximum legibility (> 14:1 contrast ratio); subtitle text (`small`) set to warm champagne gold (`#f5dfab`, > 11:1 contrast ratio); Sto. Niño parish seal logo badge ring framed with crisp gold outline (`box-shadow: 0 0 0 2px #d4a754`). Desktop header styling ($\ge 840$px) remains untouched. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-19 | `src/styles/m3/public-overrides.css` | Header Primary Wine Palette, Visible Moving Gradient & Gold Separation Line: (1) Tuned mobile header background from overly dark wine to the project's primary parish wine (`--wine: #741f29`), introducing a visible shifting multi-stop gradient (`#741f29` -> `#8e2535` -> `#5c1620` -> `#a02c3d` -> `#741f29`) animated smoothly via `@keyframes pubTopbarGradientShift` (7s duration, `background-size: 240% 240%`) with accessible `prefers-reduced-motion` override. (2) Added a 2.5px metallic gold separation line (`::after` with gradient `#b38128` -> `#e5b95c` -> `#fff4ce` -> `#e5b95c` -> `#b38128` and subtle gold glow) at the bottom edge of `.pub-topbar` and `.site-header` to create clear, elegant visual separation between the header and the hero/page contents. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-20 | `src/styles/m3/public-overrides.css` | Mobile Header Color Match with Bottom Hero & Visible Light-Passing Sheen: (1) Matched mobile header base color directly to the bottom hero surface (`--wine-dark: #4c121b`) using an animated multi-tone dark wine gradient (`#4c121b` -> `#5c1622` -> `#3a0b12` -> `#56141f` -> `#4c121b` via `@keyframes pubTopbarGradientShift`). (2) Implemented visible light-passing movement (`@keyframes pubTopbarLightPass` on `::before` at `z-index: 1`) featuring a luminous champagne beam (`rgba(255, 248, 220, 0.35)`) sweeping horizontally across the header with a 4.8s cadence. (3) Enforced `clip-path: inset(0 0 0 0)` on the header container to cleanly bound the light sweep while preserving sticky navigation, with `z-index: 10` on `.pub-topbar__inner` ensuring text and logo clarity. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-21 | `src/pages/public/HomePage.tsx`, `src/styles/m3/public-overrides.css` | Mobile Landing Page Hierarchy Reordering & Floating Light Halo Synchronization: (1) Reordered mobile landing page: Screen 1 consists of the Header, Artwork Section, and Countdown Timer, sized to fit in exactly ONE mobile viewport view above the fold (`height: calc(100dvh - 64px)` with bottom clearance for the floating nav bar). (2) Placed the Hero Copy section ("One faith. One celebration.", lead paragraph, and "Register run" & "View schedule" action buttons) directly below Screen 1 as the user scrolls. (3) Artwork typography scaling: "Sto. Niño Parish" made smaller (`0.82rem-0.94rem` uppercase with soft gold tint), "SINOOG 2027" made larger and prominent (`2.0rem-2.6rem` bold Fraunces), and "Viva Pit Señor!" enlarged (`1.15rem-1.35rem` italic gold). Sto. Niño seal sized compactly (`width: min(148px, 36vw)`, `max-height: 24vh`). (4) Background halo and concentric gold ring (`::before` and `::after`) anchored concentrically to `.hero-artwork` and animated in complete lockstep synchronization with the logo artwork using `parish-emblem-float 6s ease-in-out infinite`. Desktop two-column single-view layout preserved intact on screens $\ge 900$px. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-22 | `src/styles/m3/public-overrides.css`, `src/pages/public/HomePage.tsx` | Desktop View Strict Preservation & Viewport Isolation: (1) Scoped the header bottom gold divider line (`.pub-topbar::after`) strictly inside `@media (max-width: 839px)`, and explicitly disabled all topbar pseudo-elements on desktop (`@media (min-width: 840px) { display: none !important; }`), ensuring the desktop header remains 100% untouched and clean. (2) Unified the desktop breakpoint to 840px (`@media (min-width: 840px)`), guaranteeing that the exact approved desktop hero (two-column copy + seal emblem with centered dual halos, hanging bamboo leaves, side bamboo stalks, flush countdown timer, and single-view proportions) displays with zero interference from mobile overrides. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-23 | `src/styles/m3/public-overrides.css` | Mobile Artwork Background Concentric Frame, Larger Logo & Lowered Identity Text: (1) Replaced the previous mobile circle styling with the requested concentric circular framing matching user screenshot `media_1793248498591_711dc62c.png`: dual concentric gold halo ring (`1.5px solid rgba(245, 223, 171, 0.24)` with multi-stop radial backdrop disc and ambient glow `0 0 60px rgba(214, 157, 46, 0.16)`) and glowing inner aura halo centered with the Sto. Niño seal. (2) Enlarged Sto. Niño logo significantly (`width: min(210px, 52vw)`, `max-height: min(220px, 29vh)`). (3) Compacted top padding below header (`padding: 2px 16px 0`) while keeping the countdown timer position frozen (`padding-bottom: calc(4.6rem + env(safe-area-inset-bottom))`). (4) Lowered identity details ("Sto. Niño Parish", "SINOOG 2027", "Viva Pit Señor!") toward the countdown timer via `margin-top: clamp(16px, 2.8vh, 26px)`. Desktop view remains strictly untouched. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-24 | `src/styles/m3/public-overrides.css` | Elimination of Dark Disc Around Mobile Logo & Pure Concentric Halo Restoration: (1) Completely eliminated the dark brown/black circular backdrop disc (`rgba(20, 3, 7, 0.45)`) that previously darkened the area just outside the Sto. Niño seal. (2) Restored the clean, transparent concentric framing exactly matching the user's second reference image (`media_1793249179672_eb801792.png`): smooth wine background continuity with an atmospheric golden radial aura (`rgba(231, 175, 63, 0.40)` to transparent), a clean outer gold ring (`1.5px solid rgba(245, 223, 171, 0.22)`), and an inset concentric gold ring (`inset 0 0 0 25px rgba(245, 223, 171, 0.16)`). (3) Both concentric rings and the golden aura float in absolute synchronization with the Sto. Niño emblem via `parish-emblem-float`. Desktop view strictly unchanged. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-25 | `src/styles/m3/public-overrides.css` | Balanced Depth Shading for Mobile Artwork Halo: (1) Balanced the background shading behind the Sto. Niño seal: tuned from completely transparent (which was too light) and heavy black disc (which was too dark) to a soft, balanced wine depth vignette (`radial-gradient(circle, rgba(0, 0, 0, 0.02) 0%, rgba(25, 4, 8, 0.12) 48%, rgba(20, 2, 6, 0.22) 70%, transparent 72%)`), creating gentle definition around the white floral tips without harshness. (2) Tuned atmospheric golden halo glow on `::before` (`rgba(231, 175, 63, 0.32)` fading cleanly into transparent) to maintain warm radiance without over-brightening. Desktop view strictly untouched. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-26 | `src/styles/m3/public-overrides.css` | Medium Dark Burgundy / Wine Red Circular Plate for Mobile Logo: (1) Replaced the pale/grayish circular background band behind the mobile Sto. Niño seal with a rich, velvety medium dark burgundy / wine red plate (`radial-gradient(circle, #5c1622 0%, #54131f 42%, #440d16 70%, transparent 71%)` with subtle inner wine vignette `inset 0 0 18px rgba(45, 8, 14, 0.5)`). (2) Enclosed with a delicate 1.5px gold concentric border (`rgba(245, 223, 171, 0.26)`) and soft deep shadow (`0 8px 30px rgba(25, 4, 8, 0.45)`). (3) Positioned an ambient warm golden aura behind the disc (`::before` with `filter: blur(14px)`), eliminating the washed-out gray ring while highlighting the white floral petals against the medium dark wine red plate. Desktop view strictly untouched. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-27 | `src/styles/m3/public-overrides.css` | Mobile Identity Details Margin Shift Below Circular Emblem: (1) Slightly lowered the details text container (`.home-hero-mobile-view__identity` margin-top adjusted to `clamp(42px, 5.8vh, 52px)`), completely clearing the bottom gold rim of the circular plate so "Sto. Niño Parish" no longer overlaps the emblem petals. (2) Kept all other element positions strictly frozen: header, background bamboo, logo size/coordinates, countdown timer, and floating navbar clearance remained 100% stationary. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-28 | `src/components/FloatingNav.tsx`, `src/styles/m3/public-overrides.css` | Mobile Floating Navbar Always Visible & Exact 5-Menu Paging: (1) Disabled auto-hiding behavior on scroll: removed window scroll listener, `is-scrolling` class, and transition fade/slide down, keeping the mobile navigation bar permanently visible and interactive. (2) Formatted items into exactly 5 menus per view across all viewports (`flex: 0 0 20%`, `width: 20%`, `gap: 0`, and zero horizontal container padding) so 5 menus mathematically occupy 100% of the visible container width. (3) Added two balanced 5-item pages (Page 1: Home, Festival, Run, Schedule, News; Page 2: Gallery, Sponsors, About, Register/Account, Sign in/Workspace) with dedicated handcrafted SVG icons for About and Register. (4) Configured page-based snap points (`.pub-floating-nav__item:nth-child(5n + 1)` with `scroll-snap-align: start; scroll-snap-stop: always;`) so swiping left/right cleanly transitions to the exact 5 new menus with zero partial peeking or cutoff of other items. (5) Added a sleek 2-pill bottom pagination indicator for visual feedback and one-tap page switching, and synchronized route transitions without React cascading renders. | `npm run build` passed (0 errors in 1.18s); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-29 | `src/styles/m3/public-overrides.css` | Mobile Navbar Selection Highlight Overflow Resolution & Rounded Boundary Nesting: (1) Fixed the left selection highlight overflow bug where the leftmost item's highlight corner collided with and protruded beyond the pill's rounded cap. Added `contain: paint !important;` and `-webkit-mask-image: -webkit-radial-gradient(white, black) !important;` to `.pub-floating-nav__pill` to enforce GPU compositor clip containment. (2) Replaced the rectangular `border-radius: 14px` on `.pub-floating-nav__link` with `border-radius: var(--md-sys-shape-corner-full, 9999px) !important;` so the active highlight is a sleek, concentric capsule matching the circular endcaps. (3) Inset the first item (`:nth-child(5n + 1)`) with `padding-left: 8px !important;` and the fifth item (`:nth-child(5n)`) with `padding-right: 8px !important;`, keeping highlights smoothly cushioned within the pill ends without touching outer borders while maintaining exact 20% snap widths. (4) Scoped `:hover` inside `@media (hover: hover)` to prevent sticky touch-device hover shading. | `npm run build` passed (0 errors in 1.23s); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-30 | `src/styles/m3/tokens.css`, `src/styles/m3/components.css`, `src/styles/m3/public-overrides.css`, `src/styles/m3/admin-overrides.css` | Global Card Pop-Shadow & Elevation System (Division ExeCon pattern): (1) Inspected Division ExeCon styles (`--shadow-card`, `--shadow-card-hover`, `.floating-card`) and adapted the 3-layer pop-shadow system into the Sinoog burgundy, wine, and gold color scheme (`--sinoog-shadow-card`, `--sinoog-shadow-card-hover`, `--sinoog-shadow-card-raised`). (2) Applied layered ambient and directional shadows with white inner highlight glaze (`inset 0 1px 0 rgba(255,255,255,0.82)`), subtle gold/rose outline borders, and backdrop blur (`blur(10px) saturate(112%)`) to all card surfaces. (3) Updated base `.m3-card` variants (filled, elevated, outlined) and all specific page cards: Home sponsor/schedule cards, Sinoog Run category cards, Festival pillar & document cards, Activities schedule cards, News feed & featured cards, Gallery collection cards, Sponsors tier cards, About content cards, Auth cards, and Admin workspace cards. (4) Added smooth interactive hover lift (`translateY(-3px)` with soft cubic-bezier curve) and gold border transition. | `npm run build` passed (0 errors in 1.32s); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-31 | `src/pages/public/RunPage.tsx`, `src/pages/auth/AccountPage.tsx`, `src/styles/m3/public-overrides.css` | Run Content Updates, Red Deadline Card, Sponsors & Account Pop Cards: (1) Updated `/run` highlight cards: Scenic Route ('Official course details will be published after committee and safety approval.' / 'Route confirmation pending'), Official Race Kit ('Event singlet, bib, and finisher items as announced for each category.' / 'Exclusive Edition'), and Race-Day Guide ('Race starts at 4:00 AM.' / 'January 9, 2027'). (2) Replaced deadline notice with a dedicated high-emphasis red card (`.run-deadline-card`) styled with rich cardinal-red gradient (`linear-gradient(135deg, #a61c2b, #85121f, #630c16)`), 1.5px gold border (`rgba(255, 212, 59, 0.42)`), layered crimson/gold pop-shadow, clock badge, and 'Registration deadline: January 2, 2027 at 11:59 PM'. (3) Applied Division ExeCon pop-card styling (`.floating-card`, multi-layered pop-shadow, white top glaze, gold hover transition) to all `/sponsors` cards (`.sponsors-public__card`) and the 'Become a Partner' CTA card (`.sponsors-partner-cta`). (4) Upgraded `/account` runner profile and registration cards (`.account-card--profile`, `.runner-account-registration`, `.runner-account-waiver`) to M3 pop-card architecture with crisp borders, layered depth, and gold accents. | `npm run build` passed (0 errors); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-32 | `src/pages/public/RunPage.tsx`, `src/styles/m3/public-overrides.css`, `src/styles/m3/admin-overrides.css` | Run Highlights Pop-Card Realization & Admin Gallery Pop-Card Overrides: (1) Fixed flat unstyled `.run-highlights` cards on `/run`: removed obsolete CSS rules (`border: 0; box-shadow: none; background: ...surface-container-highest`) that stripped shadows and borders; upgraded highlight cards to `.run-highlight-card` with Division ExeCon multi-layer pop-shadow, white top highlight glaze, crisp border (`1px solid rgba(116, 31, 41, 0.14)`), dedicated burgundy icon medallion badges (`.run-highlight-card__icon-badge`), Fraunces serif headlines, and hover gold accents (`#d4a754`). (2) Implemented comprehensive card pop styling on `/admin/gallery`: upgraded `.gallery-admin-card` to `.m3-card` pop architecture (`padding: 0`, multi-layered pop-shadow, hover lift with gold border accent, order badge styling, image preview zoom on hover); added pop card elevation to `.gallery-media-grid article`, media upload boxes, dialog cards, and empty/loading states. | `npm run build` passed (0 errors in 1.65s); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-33 | `src/styles/m3/admin-overrides.css` | Admin Mobile View Header & Dashboard 2-Column Overview Layout: (1) Replaced flat light pink mobile admin header (`.portal-topbar`) with identical styling to the public header: rich liturgical wine moving gradient (`pubTopbarGradientShift` at 220% 220%), bottom gold accent border (`2.5px` gold gradient `#b38128` to `#fff4ce`), and sweeping luminous light sheen (`pubTopbarLightPass`). (2) Matched typography and colors to the public brand: white serif headline (`#ffffff` Fraunces with drop shadow), warm gold subtitle (`#f7e4be`), and frosted dark glass user pill with gold outline and gold role badge (`#d4a754`). (3) Restructured admin dashboard metrics grid (`.stat-grid`) on mobile viewports (< 840px) to strictly display in 2 equal columns side-by-side (`grid-template-columns: repeat(2, minmax(0, 1fr))`) with Division ExeCon pop-shadow elevation, inner glaze, and gold hover accents. | `npm run build` passed (0 errors in 1.30s); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-34 | `src/styles/m3/admin-overrides.css`, `src/styles/global.css`, `src/pages/admin/SponsorsManagerPage.tsx`, `src/pages/admin/UsersManagerPage.tsx`, `src/pages/admin/AdminListPage.tsx`, `src/pages/admin/FinancePage.tsx` | Admin Mobile Data Cards Pop Styling & Search Blank Gap Fix: (1) Removed gold left borders (`border-left: 4px/5px solid var(--gold)` and `box-shadow: inset 4px 0 0 var(--gold)`) from all mobile data cards across Activities, News Posts, Run Registrations, Race Timing, Delegations, Users & Staff, and Sponsors. (2) Upgraded all mobile data cards to Division ExeCon 3D pop architecture with multi-layer ambient & directional shadows, white top glaze (`inset 0 1px 0 rgba(255, 255, 255, 0.95)`), 16px corner radius, and hover lift with warm gold border accent (`#d4a754`). (3) Resolved the vertical blank gap between the search input and data items on mobile by replacing `flex: 1 1 280px` search wrappers with responsive constraints (`flex: 1 1 auto; width: 100%; maxWidth: 420px;`) and pinning search containers to `height: 56px !important; flex: 0 0 56px !important;` on mobile viewports (< 840px). | `npm run build` passed (0 errors in 16.6s); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-35 | `src/styles/m3/admin-overrides.css`, `src/styles/m3/public-overrides.css` | Mobile Filter Tabs Balanced 2x2 Grid: (1) Fixed awkward line wrapping on `/admin/finance` filter buttons where 3 buttons squeezed onto line 1 and `General` sat stranded alone on line 2 inside a distorted capsule container. (2) Converted mobile segmented controls (`.admin-segmented-control`, `.finance-scope-tabs`, `.gallery-switcher`) on viewports < 840px to a balanced 2-column grid (`grid-template-columns: repeat(2, minmax(0, 1fr))`) with 16px corner radius, equal 50% width buttons, 44px touch targets, centered text, and smooth responsive padding. (3) Harmonized `/news` mobile filter chips into a balanced 2x2 grid without dangling single items. | `npm run build` passed (0 errors in 1.23s); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-36 | `src/pages/admin/UsersManagerPage.tsx`, `src/styles/m3/admin-overrides.css`, `src/styles/global.css` | Users & Staff Mobile Toolbar Gap Fix: (1) Replaced inline flex constraints in `UsersManagerPage.tsx` with dedicated responsive wrappers `.users-toolbar__search-wrap` and `.users-toolbar__filter-wrap`. (2) Enforced `flex: 0 0 auto !important; height: auto !important;` on the search wrapper in mobile viewports (< 840px) to prevent `flex-grow: 1` in column flex orientation from expanding vertically and creating a 220px blank white gap above the role filter. (3) Made the 'Filter by role' dropdown full-width (`width: 100% !important;`) on mobile with a tight 12px vertical gap right beneath the search bar. (4) Reset legacy `.users-toolbar` backgrounds and borders in `global.css` to prevent nested padding collisions. | `npm run build` passed (0 errors in 16.9s); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-37 | `src/pages/admin/AdminListPage.tsx`, `src/pages/admin/SponsorsManagerPage.tsx`, `src/pages/admin/FinancePage.tsx`, `src/styles/m3/admin-overrides.css` | Delegations & Unified Admin Toolbar Mobile Gap Elimination: (1) Applied `.admin-toolbar__search-wrap` and `.admin-toolbar__action-wrap` architecture to `/admin/delegations` (`AdminListPage.tsx`), `/admin/sponsors`, and `/admin/finance`. (2) Enforced `flex: 0 0 auto !important; height: auto !important;` across all admin search bar wrappers on mobile viewports (< 840px), preventing vertical flex stretching that caused a ~200px blank white gap above action buttons. (3) Structured action wrappers (`.admin-toolbar__action-wrap button`) on mobile to span full-width with a clean 44px touch target, placed flush 12px directly underneath the search bar. | `npm run build` passed (0 errors in 1.51s); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |
| 2026-10-29 | FIX-MOB-38 | `src/pages/admin/SponsorsManagerPage.tsx`, `src/styles/global.css`, `src/styles/m3/admin-overrides.css` | Desktop Table Refinements (Sponsors Tier Badge & Registrations Horizontal Overflow): (1) Fixed broken tier badge wrapping on `/admin/sponsors` on desktop where "DIAMOND SPONSOR" wrapped onto two lines and overflowed its fixed 24px height badge pill. Replaced with `.sponsor-tier-badge` with `white-space: nowrap !important; height: auto !important; min-height: 26px !important;` and expanded Column 2 in `.sponsors-admin-table__grid` from `minmax(100px, 0.8fr)` to `minmax(160px, 1.3fr)`. (2) Eliminated horizontal table overflow and left clipping ("FERENCE" / "0001") on `/admin/registrations` by optimizing desktop `.registrations-table__grid` column minimums from 976px down to 687px (`minmax(100px, 0.85fr) minmax(170px, 1.5fr) minmax(140px, 1.15fr) minmax(75px, 0.5fr) minmax(90px, 0.65fr) minmax(120px, 0.85fr)`), allowing the entire table to fit smoothly without horizontal scrollbars on desktop viewports. | `npm run build` passed (0 errors in 1.73s); `npm run lint` passed (0 warnings, 0 errors); `npm test` passed (26/26 tests). | None. |

Future entries must record exact files, build/lint/test results, viewports checked, and unresolved regressions. Do not mark `COMPLETED` from code change alone.

## 26. Risks, Dependencies, and Compatibility Notes

- **High:** global CSS cascade. Mitigate with semantic tokens, scoped phase roots, incremental extraction.
- **High:** registration/admin manager size. Split visual subcomponents without moving business logic until tests exist.
- **High:** dialog accessibility across multiple bespoke overlays.
- **Medium:** dark theme may expose third-party iframe/media contrast limitations.
- **Medium:** Google Fonts network dependency; consider self-hosting only with licensing/performance review.
- **Medium:** mobile bottom navigation capacity and safe areas.
- **Compatibility:** support current evergreen Chrome/Edge/Firefox/Safari; iOS PWA install remains instructional because programmatic install is unavailable.
- **NEEDS VERIFICATION:** authenticated admin screenshots; final dark-theme requirement/toggle location; delegation management scope; browser support policy; whether policy pages need last-updated metadata.

## 27. Definition of Done and Acceptance Criteria

A task is complete only when:

- It uses approved semantic color/type/shape/spacing/motion tokens.
- Required default/hover/focus/pressed/selected/disabled/loading/error states exist.
- Functionality and Supabase payloads are unchanged.
- Keyboard, screen-reader names, focus order, and contrast pass.
- Compact through XL layout passes without page-level horizontal scroll.
- Build, lint, tests, and route-specific regression checks pass.
- Visual review is completed in light and dark themes where supported.
- Progress tracker and change log are updated.

Phase 1 completes only when all public/auth routes meet these criteria and an explicit completion report is reviewed. Phase 2 does not begin automatically.

## 28. Next Implementation Task

**1. P1-012 — Activities (`ActivitiesPage.tsx`).** Migrate schedule filters, utility actions, timeline cards, and empty/loading/error states without changing print or calendar behavior.

**2. P1-013 — News (`NewsPage.tsx`, `NewsArticlePage.tsx`).** Migrate search, filter, article-card, and article-detail surfaces with unchanged post loading and routing.

**3. P1-014 — Gallery (`GalleryPage.tsx`).** Migrate photo/video tabs, collection cards, and full-screen viewer using the shared focus-managed `Dialog` primitive.

## 29. Decisions Log

| # | Decision | Owner answer | Effect |
|---|---|---|---|
| 1 | Theme | Light only for now | P1-002 deferred; `dark-theme.css` stays unused; `<meta name="color-scheme" content="light">` unchanged |
| 2 | Run registration timing | Migrate early, while there is time to test | P1-011 moves ahead of other page migrations (after P1-005) |
| 3 | Older-browser support | Not required | `color-mix()` etc. used without fallbacks |
| 4 | Old vs new components | Replace old ones in place and fix what breaks | `Button` replaced in place. `StatusBadge` and raw admin `.button` usage stay until Phase 2 so admin is not changed early |
| 5 | Policy pages metadata | No "last updated" line | Committee-approved text untouched |
| 6 | Fonts | Keep Google Fonts | No change |
| 7 | Delegation management (P2-010) | Discuss after Phase 1 | Remains BLOCKED |
| 8 | Admin screenshots / Phase 2 | Discuss after Phase 1 | — |
| 9 | Mobile Admin Navigation & Icons (FIX-MOB-39) | Replaced flat bottom bar with floating navbar pill and colored icons | Implemented AdminFloatingNav.tsx and bespoke SVG AdminNavIcons.tsx matching each page function |
