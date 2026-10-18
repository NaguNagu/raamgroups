# Firebase and Vercel handover

## Current accounts

- Firebase project: `sri-raam-rope` / `822993063639`.
- Firestore: `(default)`, Standard, `asia-south1` (Mumbai).
- Firebase management login verified: `sriganeshrope@gmail.com`.
- Business administrator identity: verified `sriraamrope@gmail.com`.
- Vercel owner: `nagunagu`, team `nagunagus-projects`.
- Project: `raamgroups`, ID `prj_gcq3riMK4mKwpZg5T32Jl4GyM9WG`.
- Production address: `https://raamgroups.vercel.app`.

The project was transferred from its initial deployment team into the owner's selected Vercel team. No paid features were added. GitHub origin remains `https://github.com/NaguNagu/raamgroups.git`; the saved GitHub account lacked write access. Local commits/source are complete; GitHub sync and automatic Git deployments need repository write authorization.

## Administrator login

Open `/admin`, click **Sign in with Google**, and choose **sriraamrope@gmail.com**. The Google account used to manage the Firebase project is separate from the store administrator account. Any other email, including an unverified account using the administrator address, is denied.

Google sign-in creates the Firebase user on first use. To use a password afterward, use the login page's password reset action for the business account and complete it privately through that mailbox. No password is stored in the application source or chat. There is no public account-creation form or client-editable administrator role.

The first authenticated save initializes the indicative inventory and business settings atomically. In Settings, confirm the business details and enter the real GSTIN before issuing GST sales bills. Choose A4 or A5 for printing.

## Firebase deployment

Use the Firebase account with project permissions:

```sh
npx -y firebase-tools@latest login
npx -y firebase-tools@latest deploy --only firestore,auth --project sri-raam-rope
```

The existing project-local `.firebaserc` and `firebase.json` select this project. Do not deploy the parent workspace's unrelated Firebase configuration. Review `firestore.rules` and indexes before deployment. Authorized sign-in domains include `raamgroups.vercel.app`, `localhost`, and the project's Firebase-provided domains. New custom domains must also be authorized in Firebase Authentication.

The web configuration is public and checked into `lib/firebase-config.ts`. `NEXT_PUBLIC_FIREBASE_API_KEY` is an optional override. No DATABASE_URL, ADMIN_PASSWORD_HASH, SESSION_SECRET or service-account key is needed. Never put Firebase management OAuth tokens in runtime environment variables.

## Vercel deployment

Sign in to the intended `nagunagu` account, then deploy the Next.js project into `nagunagus-projects`. The task used a separate CLI profile to preserve the pre-existing account's configuration. Its temporary local profile is not included in source control. If it is unavailable, authenticate again through the official Vercel CLI.

```sh
npx --yes vercel login
npx --yes vercel deploy --prod --scope nagunagus-projects
```

Use Node 24 and `npm run build`. No server credential environment variables are required for the Firebase user-context architecture.

## Owner verification

1. Sign in to the business workspace with the administrator Google account.
2. Save Settings; add GSTIN when available and choose print paper size.
3. Review the imported inventory. Confirm missing units/quantities, reconcile negative balances, and enter selling prices before GST plus HSN/tax rates. The PDF closing valuations are not selling prices. Publish reviewed items and upload exact product photos.
4. Record opening stock or vendor purchases, then save a customer bill and confirm stock deduction, bill number, tax split and total.
5. Print A4/A5 with matching printer paper, portrait orientation, 100% scale and browser headers/footers disabled. Driver settings may also need to match.
6. Check reports and CSV export, enquiry follow-up and a WhatsApp request using your own contact details.

Use `/admin/demo` for practice without production writes. No production financial test bills were fabricated during setup.

## Storage and backups

Images are optimized before upload and stored separately from catalogue/transaction documents. Firestore rules deny asset updates after creation; image URLs use a content hash and are cached immutably. Review provider backup options before accumulating business records; report CSV exports are not a full database backup. Paid backup/PITR features were not enabled automatically.

Admin history is currently loaded for the small single-business workspace. As the ledger grows, add date-based pagination/server aggregation to keep reads and response sizes bounded. Public contact-form throttling is per instance; add App Check or stronger abuse controls if spam becomes an operational problem.


## Trusted team and sessions

The deployed rules and application must be updated together when changing session/membership behavior. Every approved team member has the same business access. No Firebase management credentials are required on Vercel: a separate in-memory client Auth instance provisions a login, and an already authenticated business user's session grants its exact UID access. Team passwords are never written to Firestore or source. Sessions expire after two hours without user input; expired/ended `authSessions` cannot be revived. Refresh existing browser tabs after rollout.
