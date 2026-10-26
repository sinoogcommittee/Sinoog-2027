# Sinoog 2027 project setup

## Local setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Add the Supabase project URL and publishable key.
4. Run `npm run dev`.

## Supabase SQL

Run the following files in Supabase SQL Editor in order:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_security_and_storage.sql`
3. `supabase/migrations/003_seed_placeholders.sql` (optional)
4. `supabase/migrations/004_promote_first_admin.sql` (assigns the initial administrator)
5. `supabase/migrations/005_correct_novena_start_date.sql` (sets the novena start to January 6, 2027)

The fourth script looks up `rieldiango24@gmail.com` in Supabase Authentication and safely assigns the initial `admin` role. It can be rerun without creating duplicate roles.

The optional schedule seed remains in draft status. Confirm all times, distances, fees, payment details, celebrants, and terms before publishing.

## Render

The included `render.yaml` builds with `npm ci && npm run build`, publishes `dist`, and rewrites client-side routes to `index.html`. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to Render.

Never place the Supabase secret/service-role key in a `VITE_` environment variable or browser code.
