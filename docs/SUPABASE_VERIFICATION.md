# Supabase verification record

Use this document to record the live database checks separately from source-code completion.

## Foundation check

1. Open Supabase → SQL Editor.
2. Run `supabase/verification/001_foundation_verification.sql`.
3. Confirm every required table, enum, and function reports `present = true`.
4. Confirm the three Storage buckets appear with the expected privacy settings.
5. Confirm every application table has `rls_enabled = true`.
6. Confirm the initial administrator account has both `admin` and `public_user`.
7. Confirm the current edition dates are January 6, 9, and 15, 2027, and registration remains closed until launch approval.
8. Paste the date, operator, migration method, and any failed check below.

The first verification run reported `cli_migration_history_available = false`. This is informational and is consistent with migrations being applied through the SQL Editor. Use `supabase/verification/002_foundation_summary.sql` for a single consolidated PASS/FAIL result table.

### October 26, 2026 result

The consolidated check passed all database structure, enum, trusted-function, Storage bucket, bucket-privacy, RLS, administrator-role, edition-date, trigger, and current-run-event checks. `Registration launch state` reported FAIL because the live current edition has registration open. The administrator confirmed on October 26, 2026 that this is intentional for deployment testing only. Close registration after testing unless the committee has approved the public launch terms, waiver, privacy notice, fees, capacity, payment/refund process, deadline, and support contact. CLI migration history remains informational because SQL Editor runs are tracked manually.

## Migration record

| Migration | Applied date | Method | Verified by | Result / notes |
| --- | --- | --- | --- | --- |
| `001_schema.sql` | 2026-10-26 | SQL Editor | Site administrator | PASS — 29 required tables and 4 enums found |
| `002_security_and_storage.sql` | 2026-10-26 | SQL Editor | Site administrator | PASS — buckets/privacy and RLS checks passed |
| `003_seed_placeholders.sql` | Optional — confirm whether used | SQL Editor / CLI |  |  |
| `004_promote_first_admin.sql` | 2026-10-26 | SQL Editor | Site administrator | PASS — admin and public_user roles confirmed |
| `005_correct_novena_start_date.sql` | 2026-10-26 | SQL Editor | Site administrator | PASS — January 6, 9, and 15 dates confirmed |
| `006_seed_2027_mass_and_fiesta_schedule.sql` | Pending verification | SQL Editor / CLI |  | Draft content only |
| `007_run_registration_workflow.sql` | 2026-10-26 | SQL Editor | Site administrator | PASS — required registration functions found; end-to-end acceptance test remains |
| `008_run_registration_and_timing_controls.sql` | 2026-10-26 | SQL Editor | Site administrator | PASS — required timing/control functions found; end-to-end acceptance test remains |
| `009_atomic_activity_reordering.sql` | 2026-10-26 | SQL Editor | Site administrator | PASS — atomic reordering function found; UI acceptance test remains |
| `010_admin_account_deletion.sql` | 2026-10-27 | SQL Editor | Site administrator | PASS — migration applied; suspended/rejected-account deletion and administrator audit tracking confirmed through the deployed management workflow |
| `011_cash_payments_and_finance.sql` | 2026-10-27 | SQL Editor | Site administrator | PASS — cash receiver attribution, financial records, audited voiding, and complete walk-in profile metadata applied successfully |
| `012_sponsor_facebook_url.sql` | 2026-10-27 | SQL Editor | Site administrator | PASS — configured Supabase REST schema query confirmed `public.sponsors.facebook_url` is present |
| `013_gallery_photo_video_collections.sql` | 2026-10-30 | SQL Editor | Site administrator | PASS — applied; added gallery media_type field ('photo'/'video') and indexes; year removed in favor of direct sorting |
| `014_registration_documents_and_timeline.sql` | 2026-10-28 | SQL Editor | Site administrator | PASS — columns, trigger, and policy versions applied |
| `015_registration_lifecycle_backfill_fix.sql` | 2026-10-30 | SQL Editor | Site administrator | PASS — applied; permits one-time email/approval-date backfill while preserving immutable lifecycle snapshots afterward |
| `016_security_hardening.sql` | 2026-10-30 | SQL Editor | Site administrator | PASS — applied; security hardening and RLS policies active in production |
| `017_registration_integrity_and_admin_safety.sql` | 2026-10-30 | SQL Editor | Site administrator | PASS — applied; registration integrity and admin safety triggers active |
| `018_suspended_accounts_cannot_register.sql` | 2026-10-30 | SQL Editor | Site administrator | PASS — applied; suspended accounts blocked from registering |
| `019_gallery_collection_order.sql` | 2026-10-30 | SQL Editor | Site administrator | PASS — applied; added sort_order to albums, initial ordering, and reorder_gallery_album RPC function; year removed |
| `020_financial_reporting_dimensions.sql` | 2026-10-30 | SQL Editor | Site administrator | PASS — applied; adds financial allocation dimensions, counterparties, recorder enforcement, creation audit, and reporting index |

## Financial reporting enhancement — October 28, 2026

| Area | Result | Notes |
| --- | --- | --- |
| Cash inflow categories | CODE COMPLETE | Sponsorships, PFC Budget, Donations, and Others. |
| Expense categories | CODE COMPLETE | Cash prizes, subsidy, shirts, honorarium, stage/program, trophies, tarpaulins, working budget, sound, photo/video coverage, tokens/certificates, and Others. |
| Payment methods | CODE COMPLETE | Cash, GCash, and Bank controlled selections. |
| Allocation reporting | CODE COMPLETE | Overall, Sinoog Festival, Sinoog Run, and General views with inflow, expense, pending-registration, and balance totals. |
| Recorder audit | PASS | Migration `020` forces the signed-in administrator into `created_by` and writes a creation audit row. |
| Reporting exports | CODE COMPLETE | Detailed ledger CSV, category/scope summary CSV, registration-payment audit CSV, and print layout. |
| Live acceptance | PASS | Migration `020` applied in production; financial allocation reporting, recorder audit, and exports active. |

## Registration policy and lifecycle package — October 28, 2026

| Area | Result | Notes |
| --- | --- | --- |
| Combined review decision | RECORDED | The main administrator chose one-step payment review and registration approval. The existing trusted review function records the reviewer, review date, notes, status change, and audit entry. |
| Separate finance verification gate | NOT REQUIRED | Finance records remain available to administrators, but approval does not require a second reviewer. |
| Automatic refund workflow | NOT REQUIRED | Refund handling is not being productized. The public policy documents the non-refundable default and manual committee review for duplicates, clear errors, or full event cancellation. |
| Waiver and terms | CODE COMPLETE | Full participant responsibilities, risk, emergency assistance, event changes, and acceptance record are published by the policy page. |
| Privacy notice | CODE COMPLETE | Data categories, purposes, access, public results, retention, rights, minors, and support contact are documented. |
| Guardian consent | CODE COMPLETE | Online minors receive a required guardian checkbox and consent record; walk-in minors receive an offline guardian consent record when the signed waiver is confirmed. |
| Registration email and dates | PENDING SQL | UI and types are ready; apply migration `014`, then verify online and walk-in rows contain `registration_email`, `submitted_at`, and `approved_at`. |

## Live application acceptance tests — October 27, 2026

| Area | Result | Notes |
| --- | --- | --- |
| Staff account creation | PASS | Newly deployed `admin-manage-user` function successfully created a staff account. |
| Staff account editing | PASS | Profile details, roles, account state, and the supported account-management actions were successfully tested. |
| Staff account deletion | PASS | Eligible account deletion succeeded and retained the acting-administrator audit trail. |
| Walk-in runner creation | PASS | The latest deployed `admin-create-runner` function successfully created a walk-in runner. |
| Updated `admin-create-runner` deployment | PASS | The function version containing complete walk-in profile metadata was deployed and tested. |

## Cash payment and finance acceptance tests — October 27, 2026

| Area | Result | Notes |
| --- | --- | --- |
| Emergency relationship selection | PASS | Online and walk-in registration use the controlled relationship dropdown. |
| Online GCash submission | PASS | GCash reference and compressed private payment proof were accepted. |
| Online cash submission | PASS | Runner selected the receiving administrator and uploaded proof of cash payment. |
| Walk-in cash attribution | PASS | Cash was automatically recorded under the administrator who created the walk-in registration. |
| Walk-in runner profile autofill | PASS | Full name, mobile number, and address appeared in the runner profile after sign-in. |
| Financial income and expense entry | PASS | Administrator successfully recorded and viewed financial entries and updated totals. |
| Audited financial-entry voiding | PASS | Voided entry was excluded from active totals and retained through the audited void workflow. |
| Finance CSV export | PASS | Filtered registration payment records exported successfully. |
| Finance route authorization | PASS | Administrator could access `/admin/finance`; news and delegation staff were denied access. |

## RLS and Storage policy tests — October 27, 2026

| Test | Result | Detail |
| --- | --- | --- |
| Runner cannot insert a payment row, including a forged `verified` payment | PASS | Blocked with `new row violates row-level security policy for table "payments"`. |
| Runner cannot approve their own registration | PASS | Update affected or exposed zero rows. |
| Runner cannot lift their own suspension | PASS | Blocked with `Only administrators can change suspension status.` |
| Runner cannot edit another runner's profile | PASS | Update affected or exposed zero rows. |
| Runner cannot grant themselves the administrator role | PASS | Blocked with `new row violates row-level security policy for table "user_roles"`. |
| Runner cannot read another runner's registration | PASS | Query exposed zero rows. |
| Runner cannot read audit logs | PASS | Query exposed zero rows. |
| Runner cannot read payment webhook events | PASS | Query exposed zero rows. |
| Runner cannot upload into another runner's payment-evidence folder | PASS | Blocked with `new row violates row-level security policy for table "objects"`. |
| Anonymous visitor cannot read draft activities | PASS | Query exposed zero rows. |
| Anonymous visitor cannot read profiles | PASS | Query exposed zero rows. |
| Anonymous visitor cannot read run registrations | PASS | Query exposed zero rows. |
| Anonymous visitor cannot read payments | PASS | Query exposed zero rows. |
| Control: runner can read their own registration | PASS | Worked as expected and returned one row. |
| Control: anonymous visitor can read published activities | PASS | Worked as expected and returned 15 rows. |

## Sponsor deployment verification — October 27, 2026

| Area | Result | Notes |
| --- | --- | --- |
| Migration 012 schema | PASS | Direct query through the configured Supabase project confirmed the `facebook_url` sponsor column. |
| Public sponsor routes | PASS | `/` and `/sponsors` both returned HTTP 200 from Render. |
| Sponsor source integration | PASS | Database types now include `facebook_url`; lint, unit tests, and the production build pass at the `835861c` sponsor checkpoint plus the type-alignment fix. |

## Type regeneration

After every applied migration, regenerate the live database types from the linked project:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase gen types typescript --linked | Set-Content -Encoding utf8 src/types/database.generated.ts
```

Review the generated diff before replacing or merging `src/types/database.ts`. Never put the service-role key in `.env` or a `VITE_` variable.

## Still required after the foundation query

- Confirm the deployed route-level experience with dedicated `news_in_charge` and `delegation_head` test accounts.
- Profile-trigger test with a newly created fictional account.
- `updated_at` trigger test on a disposable record.
- Signed-URL expiry verification.
- Registration final-slot concurrency test.
- Live sponsor CRUD smoke test: add, edit, publish, unpublish, delete, and confirm home/public visibility with a disposable sponsor.
