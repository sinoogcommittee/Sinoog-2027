# Sinoog 2027 — Architecture & Database Quick Reference

This document is a concise reference for developers and agents on database RPC functions, storage buckets, table schemas, and route access guards.

---

## 1. Supabase Postgres RPC Functions

| Function Name | Parameters | Purpose | Caller Security |
|---|---|---|---|
| `approve_run_registration` | `p_registration_id uuid`, `p_notes text` | Reviews & approves registration; assigns 4-digit bib and QR token; records reviewer audit log | `admin` role |
| `admin_register_cash_runner` | `p_admin_id uuid`, `p_user_id uuid`, `p_run_event_id uuid`, `p_category_id uuid`, `p_participant_name text`, ... | Registers walk-in runner with cash payment attribution and offline waiver consent | `admin` role |
| `record_run_finish` | `p_qr_token text` | Decodes runner QR token and logs official finish timestamp and elapsed duration | `admin` role |
| `reorder_activities` | `p_edition_id uuid`, `p_activity_ids uuid[]` | Atomically updates `sort_order` for a list of scheduled activities | `admin` role |
| `reorder_gallery_album` | `p_album_id uuid`, `p_direction text` | Swaps sort sequence of photo/video collections | `admin` role |

---

## 2. Storage Buckets Matrix

| Bucket ID | Access Level | Max File Size | Allowed MIME Types | Folder Structure Convention |
|---|---|---|---|---|
| `public-media` | Public | 10 MB | `image/jpeg`, `image/png`, `image/webp`, `video/mp4` | `news/`, `sponsors/`, `gallery/` |
| `payment-evidence` | Private | 8 MB | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` | `${userId}/${timestamp}_${fileName}` |
| `delegation-files` | Private | 25 MB | `audio/mpeg`, `audio/wav`, `audio/mp4`, `application/pdf`, `image/*` | `${delegationId}/music/${fileName}` or `${delegationId}/roster/${fileName}` |

### Storage Security Policies:
* **`public-media`**: Public reads; write/update/delete restricted to `admin` and `news_in_charge`.
* **`payment-evidence`**: Runners can only read/upload within their own `${auth.uid()}/` folder; `admin` can read all folders for payment verification.
* **`delegation-files`**: Delegation heads can upload and delete within their assigned contingent's `${delegationId}/` folder; `admin` has full access; anonymous users have zero access.

---

## 3. Database Tables & Key Columns

* **`editions`**: `id`, `year`, `name`, `run_date`, `novena_start_date`, `fiesta_date`, `is_current`.
* **`site_settings`**: `edition_id`, `registration_open`, `gcash_number`, `announcement_banner_enabled`, `announcement_banner_text`.
* **`profiles`**: `id` (references `auth.users`), `full_name`, `mobile`, `locality`, `suspended_at`.
* **`user_roles`**: `user_id`, `role` (`'admin' | 'news_in_charge' | 'delegation_head' | 'public_user'`), `assigned_by`, `created_at`.
* **`activities`**: `id`, `edition_id`, `title`, `type` (`'mass' | 'event'`), `date`, `time`, `venue`, `celebrant`, `sort_order`, `status`.
* **`posts`**: `id`, `slug`, `title`, `excerpt`, `body_html`, `featured_image_path`, `pinned`, `published_at`, `status`.
* **`albums`**: `id`, `edition_id`, `title`, `description`, `media_type` (`'photo' | 'video'`), `published`, `sort_order`.
* **`album_items`**: `id`, `album_id`, `storage_path`, `youtube_video_id`, `sort_order`.
* **`sponsors`**: `id`, `edition_id`, `name`, `tier` (`'diamond' | 'gold' | 'silver' | 'bronze' | 'media'`), `logo_path`, `website_url`, `facebook_url`, `published`.
* **`delegations`**: `id`, `name`, `locality`, `created_at`.
* **`delegation_memberships`**: `delegation_id`, `user_id`, `is_head`, `assigned_by`.
* **`delegation_entries`**: `id`, `delegation_id`, `edition_id`, `theme`, `description`, `status` (`'draft' | 'submitted' | 'under_review' | 'approved' | 'needs_changes' | 'rejected'`), `reviewer_notes`.
* **`delegation_participants`**: `id`, `entry_id`, `full_name`, `role_or_position`, `birth_date`.
* **`delegation_files`**: `id`, `entry_id`, `kind` (`'music' | 'roster' | 'photo' | 'document'`), `object_path`, `original_name`, `bytes`.
* **`run_events`**: `id`, `edition_id`, `title`, `registration_opens_at`, `registration_closes_at`, `race_starts_at`, `official_started_at`.
* **`run_categories`**: `id`, `run_event_id`, `name`, `distance_km`, `fee_centavos`, `capacity`, `sort_order`, `published`.
* **`run_registrations`**: `id`, `run_event_id`, `category_id`, `user_id`, `reference`, `participant_name`, `division` (`'male' | 'female'`), `birth_date`, `mobile`, `locality`, `shirt_size`, `emergency_name`, `emergency_relationship`, `emergency_mobile`, `guardian_consent`, `status` (`'submitted' | 'under_review' | 'approved' | 'needs_changes' | 'rejected'`), `bib_number`, `qr_token`, `registration_email`, `submitted_at`, `approved_at`.
* **`kit_claims`**: `registration_id` (PK), `bib_number`, `claimed_at`, `claimed_by`, `notes`.
* **`run_finish_records`**: `id`, `run_event_id`, `registration_id`, `finished_at`, `elapsed_ms`, `recorded_by`.
* **`finance_records`**: `id`, `edition_id`, `entry_type` (`'inflow' | 'expense'`), `scope` (`'overall' | 'festival' | 'run' | 'general'`), `category`, `amount_centavos`, `payment_method` (`'cash' | 'gcash' | 'bank'`), `counterparty`, `purpose`, `created_by`, `is_void`, `void_reason`, `voided_by`, `voided_at`.
* **`audit_logs`**: `id`, `actor_id`, `action`, `entity_table`, `entity_id`, `detail` (`jsonb`), `created_at`.
* **`notification_outbox`**: `id`, `user_id`, `recipient`, `template`, `payload`, `status`, `attempts`, `sent_at`.

---

## 4. Route Guarding Rules

* **Public layout** (`PublicLayout.tsx`):
  * Open to all visitors.
* **Runner authentication** (`RunnerAuthPage.tsx` / `AccountPage.tsx`):
  * Guarded by `RequireSignIn`. Runners edit their registrations only while `status !== 'approved'`.
* **Staff Login** (`/login`):
  * Separated from public runner registration. Redirects staff to `/admin` based on assigned roles.
* **Committee Portal** (`PortalLayout.tsx`):
  * Guarded by `RequireRole role="staff"`.
  * Index redirects:
    * `admin` → `/admin` (Command Overview)
    * `news_in_charge` only → `/admin/posts`
    * `delegation_head` only → `/admin/delegations`
  * Nested routes:
    * `<RequireAdmin>` protects: `activities`, `settings`, `registrations`, `kit-claims`, `run-timing`, `users`, `finance`, `sponsors`, `gallery`, `audit`.
    * `<RequireRole role="news_in_charge">` protects: `posts`.
    * `<RequireRole role="delegation_head">` protects: `delegations`.
