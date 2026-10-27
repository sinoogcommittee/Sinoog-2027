# Backup and recovery

The site holds registrations, payment records and payment screenshots. Losing them close to race day would be hard to recover from, so treat backups as part of the launch checklist.

## What needs protecting

| Item | Where it lives | Covered by a database dump? |
|---|---|---|
| Registrations, payments, roles, schedule, posts | Supabase Postgres | Yes |
| Payment screenshots (`payment-evidence`), delegation files, public media | Supabase Storage | **No**: back up separately |
| Auth settings, redirect URLs, Edge Function secrets | Supabase dashboard | **No**: write them down (without secret values) |
| Source code and migrations | GitHub | Yes (it is the repository) |

## Check your plan first

In the Supabase dashboard open **Database → Backups** and note what your plan provides (automatic backups, retention, point-in-time recovery). Free projects may have no downloadable automatic backups and can be paused after a period of inactivity; confirm the current terms on Supabase's pricing page. Because this project collects payments, consider upgrading for the weeks around the event, or rely on the manual routine below.

## Manual backup routine

Requires the Supabase CLI and a linked project.

```bash
mkdir -p backups
npx supabase db dump -f backups/schema-YYYY-MM-DD.sql
npx supabase db dump --data-only -f backups/data-YYYY-MM-DD.sql
```

Then download the Storage buckets (at least `payment-evidence`) from **Storage** in the dashboard, or with a small script using the service key kept on your own computer.

Rules:

- `backups/` is in `.gitignore`. **Never commit a dump or upload it to a public place**: it contains personal data.
- Store copies encrypted or on an access-controlled drive, with at least two locations.
- Keep the last several backups, not only the newest.

## Suggested schedule (proposal)

| When | Frequency |
|---|---|
| Before registration opens | One full backup |
| While registration is open | Weekly |
| January 2–9, 2027 | Daily |
| Before and right after any bulk change, role change or deletion | One backup |
| After the event and payment reconciliation | Final backup, then follow the retention plan |

## Test a restore once

An untested backup is only a hope. Create a separate free Supabase project, apply the migrations (`docs/PROJECT_SETUP.md`), load the data dump, and confirm you can sign in and see registrations. Delete that project afterwards because it holds real data.

## Event-day fallback

Before race day, export the registration list (name, category, bib, payment status, emergency contact) and keep a printed copy and an offline copy on a phone or laptop. If the internet or Supabase is unavailable, registration check-in and kit release can continue on paper.

## If something goes wrong

1. Stop further changes (tell staff to pause editing).
2. Note the time and what happened.
3. Restore from the most recent good backup into a **new** project first and compare before replacing anything.
4. If personal data may have been exposed, follow the breach steps in `DATA_PRIVACY_AND_RETENTION.md`.
