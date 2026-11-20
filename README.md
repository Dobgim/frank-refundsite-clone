# Whitehill Bank website

React, TypeScript, Vite, and Tailwind CSS recreation of the five public pages:

- Home (`/`)
- About (`/about/`)
- Services (`/services/`)
- Terms & Conditions (`/terms-and-condtitions/`)
- Contact (`/contact/`)

It also includes local registration (`/register`) and login (`/login`) UI
previews based on the supplied reference image, plus a sample user dashboard
(`/dashboard`) with Loan, Transactions, Track a Case, Help Center, and Contact
Support menus, plus My Claims, Notifications, Start a Claim, Verification,
Settings, Fund Transfer, Withdraw, Pay Bill, DPS, and FDR.

## Run locally

```sh
npm install
npm run dev
```

Run `npm run build` for a production build and `npm run lint` for lint checks.

The supplied site images are in `public/assets`. The public website, login,
registration, and dashboard share the same green-and-lime visual theme.
Login, registration, contact, and loan forms are UI-only previews; they do not
send or store submitted information. Dashboard data is synthetic, and no
backend or financial actions are connected.
