# Whitehill Bank website

React, TypeScript, Vite, and Tailwind CSS website with Supabase-backed authentication:

- Home (`/`)
- About (`/about/`)
- Services (`/services/`)
- Terms & Conditions (`/terms-and-condtitions/`)
- Contact (`/contact/`)

It also includes registration (`/register`), login (`/login`), password recovery
(`/reset-password`), an authenticated member area (`/dashboard`), and a
role-protected admin member list (`/admin`).

## Run locally

```sh
npm install
npm run dev
```

Run `npm run build` for a production build and `npm run lint` for lint checks.
Vercel deployments use `vercel.json` to serve the React app for direct route
loads such as `/login`, `/register`, and `/dashboard`.

The supplied site images are in `public/assets`. Configure local credentials in
`.env.local` using `.env.example` as a template. Only the Supabase project URL
and publishable key belong in this client-side environment; never put a
service-role key in the website or commit `.env.local`.

Before using registration, apply [`supabase/schema.sql`](./supabase/schema.sql)
in the Supabase SQL Editor. It creates a profiles table, a user-profile trigger,
and row-level security so members can read their own data and admins can read
member profiles. Supabase Auth stores and verifies passwords; this app never
stores password values in the profiles table. Set the Supabase Auth site URL to
`https://www.whitehillesettlement.online` and add
`https://www.whitehillesettlement.online/**` to its allowed redirect URLs. Add
`http://localhost:5173/**` for local development. Set `VITE_SITE_URL` to the
production URL in the Vercel project environment; signup confirmation links
return users to `/login`, and password reset links return them to
`/reset-password`. Enable email confirmations in Supabase Auth so new users
must verify their email before signing in.

## Custom domain and email

In the Vercel project settings, add `www.whitehillesettlement.online` as a
domain and apply the DNS records Vercel provides in Hostinger. Keep Hostinger's
mail-related MX, SPF, and DKIM records in place; do not replace them with
website records.

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

To grant admin access, use the Supabase SQL Editor for the exact admin email:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where email = 'admin@example.com';
```

The user must sign out and back in to refresh the role claim. Admin authorization
is checked from trusted `app_metadata`, and the profiles RLS policy independently
enforces admin-only access to the member list. Do not assign admin roles through
user-editable metadata.

The website's financial flows and balance/activity content remain sample UI;
no claims, transfers, loans, or banking actions are processed. The admin area
only lists registered profiles and does not expose credentials or manage
passwords.
