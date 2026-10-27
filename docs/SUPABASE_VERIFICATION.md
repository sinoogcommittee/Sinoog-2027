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

## Type regeneration

After every applied migration, regenerate the live database types from the linked project:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase gen types typescript --linked | Set-Content -Encoding utf8 src/types/database.generated.ts
```

Review the generated diff before replacing or merging `src/types/database.ts`. Never put the service-role key in `.env` or a `VITE_` variable.

## Still required after the foundation query

- Separate anonymous, runner A, runner B, news staff, delegation head, administrator, and suspended-user test accounts.
- Direct REST and Storage attempts for permitted and forbidden operations.
- Profile-trigger test with a newly created fictional account.
- `updated_at` trigger test on a disposable record.
- Signed-URL expiry verification.
- Registration final-slot concurrency test.
