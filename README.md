# Whitehill Bank website

React, TypeScript, Vite, and Tailwind CSS website with Supabase-backed authentication:

- Home (`/`)
- About (`/about/`)
- Services (`/services/`)
- Terms & Conditions (`/terms-and-condtitions/`)
- Contact (`/contact/`)

It also includes registration (`/register`), login (`/login`), password recovery
(`/reset-password`), an authenticated member area (`/dashboard`), and a
role-protected admin review dashboard (`/admin`).

## Run locally

```sh
npm install
npm run dev
```

Run `npm run build` for a production build and `npm run lint` for lint checks.
Vercel deployments use `vercel.json` to serve the React app for direct route
loads such as `/login`, `/register`, and `/dashboard`.

The supplied site images are in `public/assets`. Configure local settings in
`.env.local` using `.env.example` as a template. The Supabase URL, publishable
key, and site URL are client-side values; never put a service-role key or SMTP
credentials in the website or commit `.env.local`.

Before using registration or case submissions, apply
[`supabase/schema.sql`](./supabase/schema.sql) in the Supabase SQL Editor. It
creates profiles and case-request tables, a private document bucket, and
row-level security so users can access only their own requests and files while
authorized admins can review all submissions. Supabase Auth stores and verifies
passwords; this app never stores password values in the profiles table. Set the
Supabase Auth site URL to
`https://www.whitehillesettlement.online` and add
`https://www.whitehillesettlement.online/**` to its allowed redirect URLs. Add
`http://localhost:5173/**` for local development. Set `VITE_SITE_URL` to the
production URL in the Vercel project environment; signup confirmation links
return users to `/login`, and password reset links return them to
`/reset-password`. Enable email confirmations in Supabase Auth so new users
must verify their email before signing in.

## Custom domain and email

In **Vercel Dashboard → your project → Settings → Domains**, add
`www.whitehillesettlement.online` and optionally add the root domain too. Open
the domain's DNS instructions/status there; Vercel displays the exact records
to create. In Hostinger, open **hPanel → Domains → Manage → DNS / Nameservers →
DNS Records** and add the records Vercel shows. If the domain uses DNS
nameservers elsewhere, add the records at that DNS provider instead. Keep
Hostinger's mail-related MX, SPF, and DKIM records in place; do not replace
them with website records. Wait for DNS propagation until Vercel shows the
domain as valid.

To send Supabase authentication messages (including signup confirmation and
password reset) from `info@whitehillesettlement.online`, configure Custom SMTP
in the Supabase project's Auth SMTP settings using the SMTP server details
shown in Hostinger. Set the sender name to `Whitehill Settlement`, the sender
email and SMTP username to `info@whitehillesettlement.online`, and use the
mailbox's SMTP password. Enable email confirmations in Supabase Auth and ensure
the confirmation email template uses the Supabase confirmation URL
(`{{ .ConfirmationURL }}`). Keep the SMTP password in the Supabase dashboard
only; never put it in this repository, Vercel client-side environment
variables, or GitHub.

The contact form sends submissions to `info@whitehillesettlement.online` from a
Vercel server function. In **Vercel Dashboard → your project → Settings →
Environment Variables**, set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and
`SMTP_PASS` using the SMTP details for the Hostinger mailbox. Use port `465`
for implicit TLS or `587` for STARTTLS, as supported by the Hostinger account.
Set these as server environment variables (not `VITE_` variables), then
redeploy. The sender and recipient are the business email; replies go to the
submitter's address. SMTP credentials must not be added to GitHub or browser
code.

Member dashboard forms save claims, verification, loan, withdrawal, and support
requests for staff review only; they do not authorize or execute financial
transactions. Verification and supporting files are private PDF/JPG/PNG uploads
limited to 10 MB per file and five files per request. A daily Vercel Cron job
removes file objects and their metadata 30 days after a request is marked
resolved or declined. To enable it, add `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, and a high-entropy `CRON_SECRET` in Vercel Project
Settings → Environment Variables. These are server-only secrets. Never prefix
the service-role key with `VITE_`, expose it to client code, or commit it. The
case request records remain available after document cleanup.

### Identity verification and user deletion

Members must verify their identity before they can start claims, withdrawals,
loans, or other requests (customer service stays available). From the dashboard
**Verification** tab they choose an ID card, passport, or driver's license,
upload it, and take a live face photo with their camera. Files are stored in the
private `identity-verifications` bucket. Administrators review submissions in
the admin **Verifications** tab, compare the face photo with the document, and
approve or reject (with a note). The gate is enforced by row-level security, not
only in the UI. A rejected member can resubmit.

Administrators can delete member accounts from the admin **Users** tab. This
calls `/api/admin-delete-user`, which verifies the caller is an admin, removes
the member's private files, and deletes the auth user (database rows cascade).
It uses the same server-only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
variables as the cleanup job. Admin accounts cannot be deleted from the
dashboard. Re-run `supabase/schema.sql` after pulling these changes.

There are no default admin credentials in this repository. Register and confirm
an account using an email address you control, then grant the `admin` role in
the Supabase SQL Editor for that exact account email. That account uses the
password you chose at signup (or password reset); there is no separate admin
password:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'info@whitehillesettlement.online';
```

The administrator must sign out and back in to refresh the role claim. Admin
authorization is checked from trusted `app_metadata`, and row-level security
independently enforces admin-only access to member and case data. Do not assign
admin roles through user-editable metadata.

Balances, transfers, bills, savings, and deposits remain sample UI. Claims,
verification, loan, withdrawal, and support forms store requests for review
only; no loan decisions, transfers, withdrawals, or banking actions are
executed. The admin area never exposes or manages account passwords.
