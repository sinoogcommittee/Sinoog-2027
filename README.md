# Sinoog 2027

Official website for the **Sinoog 2027** celebration of **Sr. Sto. Niño Parish — Guinacot**, Guinacot, Guindulman, Bohol.

It publishes the novena and fiesta schedule, parish news, the gallery and sponsors, and runs the **Sinoog Run** (online registration, GCash payment review, bib and QR timing). Staff manage everything from an admin workspace.

| Date (2027) | Event |
|---|---|
| January 6 | Novena Masses begin |
| January 9 | Sinoog Run |
| January 15 | Fiesta and Sinoog Festival |

## Stack

- **Frontend:** React 19, TypeScript, Vite, React Router
- **Backend:** Supabase (Postgres with Row Level Security, Auth, Storage, Edge Functions)
- **Hosting:** Render static site (`render.yaml`)
- **Quality:** Oxlint, Vitest, GitHub Actions (`.github/workflows/ci.yml`)

## Quick start

Requires Node.js 22.

```bash
npm install
cp .env.example .env.local     # then add your Supabase URL and publishable key
npm run dev
```

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | Run Oxlint |
| `npm test` | Run unit tests |

Without Supabase variables the site runs in a local demo mode (development builds only).

## Roles

| Role | Can do |
|---|---|
| `public_user` | Sign in, register for the run, view their own registration and result |
| `delegation_head` | Manage their delegation's festival entry and files |
| `news_in_charge` | Manage news posts, gallery and media |
| `admin` | Everything, including users, registrations, payments and race timing |

## Project layout

```
src/
  app/          routes
  features/     data access and logic per feature (auth, run, content, ...)
  pages/        public/, auth/ and admin/ screens
  components/   shared UI
  layouts/      public and admin shells
supabase/
  migrations/   numbered SQL, run in order
  verification/ read-only checks and policy tests
  functions/    Edge Functions (admin-create-runner, admin-manage-user)
docs/           setup, roadmap, plans, backup and privacy notes
design-assets/  full-size logo masters (not deployed)
```

## Documentation

- [Project setup](docs/PROJECT_SETUP.md): local setup, Supabase SQL order, Edge Functions, Render
- [Master build roadmap](docs/MASTER_BUILD_ROADMAP.md): status and remaining work
- [Website plan](docs/Sinoog-2027-Website-Plan.md)
- [Supabase verification record](docs/SUPABASE_VERIFICATION.md)
- [Backup and recovery](docs/BACKUP_AND_RECOVERY.md)
- [Data privacy and retention (draft)](docs/DATA_PRIVACY_AND_RETENTION.md)

## Security notes

- Only the Supabase URL and **publishable** key belong in `VITE_` variables. Never expose the secret or service-role key in browser code.
- Never commit `.env.local`, database dumps or `backups/`.
- Access is enforced by Row Level Security and Storage policies, not only by the interface. After any change to policies, run `supabase/verification/003_policy_tests.sql` on a test project.
