# Sinoog 2027 project setup

## Local setup

1. Install Node.js 22, then run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase project URL and publishable key.
4. Run `npm run dev`.

## Supabase SQL

Run the files in `supabase/migrations/` **in numeric order** in the Supabase SQL Editor. Each file is safe to read first; they are not auto-applied.

| # | File | Purpose |
|---|---|---|
| 001 | `001_schema.sql` | Core tables, enums, triggers |
| 002 | `002_security_and_storage.sql` | Roles, Row Level Security policies, storage buckets |
| 003 | `003_seed_placeholders.sql` | Optional placeholder content |
| 004 | `004_promote_first_admin.sql` | Assigns the initial `admin` role (**edit the email placeholder first**) |
| 005 | `005_correct_novena_start_date.sql` | Sets the novena start to January 6, 2027 |
| 006 | `006_seed_2027_mass_and_fiesta_schedule.sql` | Draft Mass and fiesta schedule |
| 007 | `007_run_registration_workflow.sql` | Run registration, GCash review, bib and QR workflow |
| 008 | `008_run_registration_and_timing_controls.sql` | Registration lifecycle and race-clock controls |
| 009 | `009_atomic_activity_reordering.sql` | Atomic activity reordering |
| 010 | `010_admin_account_deletion.sql` | Controlled permanent account deletion |
| 011 | `011_cash_payments_and_finance.sql` | Cash receiver, manual payment submission, finance records |
| 012 | `012_sponsor_facebook_url.sql` | Sponsor Facebook link column |
| 013 | `013_gallery_photo_video_collections.sql` | Photo and video gallery collections |
| 014 | `014_registration_documents_and_timeline.sql` | Registration email snapshot, approval time, policy versions |
| 015 | `015_registration_lifecycle_backfill_fix.sql` | Fix for the 014 lifecycle trigger |
| 016 | `016_security_hardening.sql` | Removes direct payment inserts by runners; only admins may change suspension |
| 017 | `017_registration_integrity_and_admin_safety.sql` | Age, capacity and field checks; payment and evidence locking; last-admin protection; audit trail; sponsor link checks |

Any later numbered migration continues the same sequence. Add each new file to this table when you create it.

Before running `004`, replace `ADMIN_EMAIL_HERE` with the administrator's sign-in email. Create that user in Supabase Authentication first. The script can be rerun safely.

The schedule seeds stay in **draft** status. Confirm all times, distances, fees, payment details, celebrants and terms before publishing.

## Verification

- `supabase/verification/001_foundation_verification.sql` and `002_foundation_summary.sql` are read-only checks. Replace `ADMIN_EMAIL_HERE` in them too.
- `supabase/verification/003_policy_tests.sql` tries forbidden actions as a normal runner and as an anonymous visitor and reports PASS, FAIL or REVIEW. Run it after migration 017. Run it on a **test project** (or off-hours on production, after reading it), and re-run it after any policy change.
- Record manual runs in [SUPABASE_VERIFICATION.md](SUPABASE_VERIFICATION.md).

## Edge Functions

`admin-create-runner` and `admin-manage-user` use the service key on the server and check the caller's administrator role (and suspension status) before acting.

```bash
npx supabase functions deploy admin-create-runner
npx supabase functions deploy admin-manage-user
npx supabase secrets set ALLOWED_ORIGIN=https://sinoog2027.onrender.com
```

`ALLOWED_ORIGIN` restricts browser access to your site. If it is not set, the functions accept any origin (the bearer-token check still applies). Note that setting it blocks calls from `localhost` during local development.

## Render

`render.yaml` builds with `npm ci && npm run build`, publishes `dist`, and rewrites client-side routes to `index.html`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in Render.

Never place the Supabase secret or service-role key in a `VITE_` variable or in browser code.

## Related documents

- [Backup and recovery](BACKUP_AND_RECOVERY.md)
- [Data privacy and retention (draft)](DATA_PRIVACY_AND_RETENTION.md)
