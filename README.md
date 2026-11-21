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
stores password values in the profiles table. Configure the Supabase Auth site
URL and redirect URLs for your local and deployed domains. If email confirmation
is enabled, users must confirm their email before their first sign-in.

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
