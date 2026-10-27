# Data privacy and retention (DRAFT for committee review)

> This is a working draft written from the database design. It is **not legal advice**. Have it reviewed by the parish's legal adviser or whoever acts as data protection contact before publishing. Items marked *(proposal)* are suggestions for the committee to decide.

The site processes personal data of Filipino residents, so the **Data Privacy Act of 2012 (RA 10173)** and the National Privacy Commission (NPC) rules apply.

## 1. What the system collects

| Data | Where | Notes |
|---|---|---|
| Name, mobile number, locality, email | `profiles`, Supabase Auth | Needed for accounts |
| Runner details: name, birth date, mobile, locality, shirt size, club | `run_registrations` | Birth date also determines age category |
| Emergency contact: name, relationship, mobile | `run_registrations` | Belongs to a third person |
| Accessibility notes | `run_registrations` | May reveal **health information**, which the Act treats as sensitive |
| Payment method, amount, payer reference | `payments` | |
| Payment screenshots / receipts | Storage `payment-evidence` (private) | May show account numbers or other transactions |
| Consents (terms, privacy, guardian, marketing) with version and hashed IP | `registration_consents` | Keep as proof of consent |
| Bib, QR token, finish time | `run_registrations`, `run_finish_records` | Results may be published |
| Delegation participants (name, role, birth date) and files | `delegation_*`, Storage `delegation-files` | May include **minors** |
| Staff actions | `audit_logs` | Who changed what |

## 2. Principles to apply

- **Collect only what is needed.** Review each optional field. If accessibility notes are not needed, make clear they are optional and what they are used for.
- **Say why.** The privacy notice (stored in `run_events.privacy_body` and shown at `/privacy`) should list the purposes above, who sees the data (admins, race staff), how long it is kept, and how to ask questions or make requests.
- **Minors.** Runners under 18 need guardian consent (the schema supports a `guardian` consent). Decide how the guardian's identity is verified on race day.
- **Publishing results.** Decide whether names and times are published, and tell runners before they pay. Offer an opt-out *(proposal)*.
- **Access.** Only `admin` sees registrations and payments. Keep the number of admins small, use individual accounts (never shared logins), and suspend accounts that are no longer needed.
- **Security.** Row Level Security, private storage buckets and server-side admin functions are in place. Re-run `supabase/verification/003_policy_tests.sql` after policy changes.
- **Marketing.** Do not use run registration data for unrelated mailings unless the runner opted in.

## 3. Retention *(proposal)*

| Data | Suggested retention |
|---|---|
| Payment screenshots | Delete after reconciliation and any dispute window, for example 30–60 days after the event |
| Registration details (birth date, mobile, emergency contact, accessibility notes) | Delete or anonymise within about 3 months after the event, unless needed for an incident report |
| Results (name, bib, time) | Keep if the committee wants a public archive and runners were told; otherwise anonymise |
| Consent records | Keep as long as the related record exists, then delete with it |
| Audit logs | Keep about 1 year, then archive or delete |
| Staff accounts | Remove when the person leaves the committee |
| Backups | Delete old backups on the same schedule, including copies on personal devices |

The committee should confirm these periods and record who is responsible for carrying them out, with a date in the roadmap.

## 4. How deletion works today

Administrators can permanently delete an account from the admin **Users** page. Migration `010_admin_account_deletion.sql` makes the runner's personal records cascade away with the profile and clears staff attribution on records that remain. The `admin-manage-user` function also removes the user's files from the `payment-evidence` bucket and reports any cleanup errors.

Things to verify before relying on it:

- Delete a **test** runner and confirm the registration, payment, consent and storage files are all gone.
- Confirm what happens to rows other staff created (activities, posts) and to published results.
- Remember that **old backups still contain deleted data**, so deletion on request should be reflected in your backup retention.

## 5. Requests from individuals

People may ask to see, correct or delete their data, or to withdraw consent. Designate one contact (an email address or number published on the site) and agree on a standard reply time *(proposal: within 15 days)*. Record each request and what was done.

## 6. If personal data is exposed

1. Contain it: remove access, rotate any exposed keys (Supabase dashboard → API keys), suspend affected accounts.
2. Record what happened, when, and which data and people are involved.
3. Notify the NPC and affected people as required. Under NPC rules this generally has to happen within **72 hours** of knowledge for qualifying breaches involving sensitive personal information; confirm the current requirement with the NPC or your legal adviser.
4. Fix the cause and add a test for it.

## 7. Checklist before opening registration

- [ ] Designate a data protection contact and publish how to reach them
- [ ] Review and approve the privacy notice and terms text shown to runners
- [ ] Decide on published results and the minors procedure
- [ ] Confirm retention periods and assign who deletes data after the event
- [ ] Limit admin accounts to people who need them
- [ ] Run the policy tests and test a full account deletion on a test runner
- [ ] Test a backup restore (see `BACKUP_AND_RECOVERY.md`)
