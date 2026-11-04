# Hot Water Experts

Water heater replacement for the Sacramento area. This repo is a Next.js app (App Router, TypeScript) with:

- The public landing page
- A 14-step estimate and booking funnel
- A thank-you page for ad tracking
- An office back end (dashboard, leads, pipeline, customers, jobs, permits, inspections, dispatch, technicians, payments, texts, reports, staff, activity, settings)
- A phone view for technicians
- A public tracking link per job

Sample customers, prices, and dates are marked as sample data. Missing business facts are placeholders in one file.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app runs with no keys. Leads, bookings, and office edits are stored in `data/store.json` after the first write. Until then, pages read the built-in seed.

### Demo staff

Password for every sample account is `demo` (override with `DEMO_PASSWORD`).

| Email | Role |
|---|---|
| admin@hotwaterexperts.demo | admin |
| office@hotwaterexperts.demo | office |
| permits@hotwaterexperts.demo | office (permit VA) |
| tech.a@hotwaterexperts.demo | tech |
| tech.b@hotwaterexperts.demo | tech |
| tech.c@hotwaterexperts.demo | tech |

Office: [/admin](http://localhost:3000/admin). Tech phone view: [/tech](http://localhost:3000/tech).

Sample tracking links:

- On the way: [/t/sample-on-the-way](http://localhost:3000/t/sample-on-the-way)
- Complete: [/t/sample-complete](http://localhost:3000/t/sample-complete)

The sample office date is Monday, Oct 19, 2026, so the board matches the designs. Change it in Settings, or clear it to use the real date.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run db:migrate` | Apply `drizzle/0001_init.sql` when `DATABASE_URL` is set |
| `npm run db:seed` | Rewrite `data/store.json` and, if configured, Postgres |

## Environment

Copy `.env.example`. Empty values mean the feature stays in demo mode.

| Variable | When empty |
|---|---|
| `AUTH_SECRET` | A dev-only signing secret is used. Set a long random string before production. |
| `DEMO_PASSWORD` | Password is `demo`. |
| `DATABASE_URL` | File or memory store. No Postgres. |
| `STRIPE_SECRET_KEY` | $100 deposit is recorded and not charged. |
| `STRIPE_WEBHOOK_SECRET` | Webhook route is not required for the demo. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No card element. The funnel explains demo mode. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | Texts are saved on the job and not sent. |
| `GHL_WEBHOOK_URL` | Lead sync is marked stubbed. |
| `GHL_API_KEY`, `GHL_LOCATION_ID` | Reserved for a later HighLevel API client. The webhook is the sync this build uses. |
| `GOOGLE_MAPS_API_KEY` | ETA is a straight-line estimate. The map is a drawn sample. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Reserved if a map script is added later. |
| `RESEND_API_KEY`, `EMAIL_FROM` | The job summary is stored as an email record and not sent. |

## Postgres

The schema is in `drizzle/0001_init.sql`. The running app stores one JSON document in `app_state` and copies customers, jobs, leads, payments, permits, messages, staff, and the price book into normalized tables on each save.

```bash
# Supabase or any Postgres
DATABASE_URL=postgresql://... npm run db:migrate
DATABASE_URL=postgresql://... npm run db:seed
```

On Vercel, set `DATABASE_URL` if leads must survive across serverless instances. Without it, the site still renders the seed. Writes live in that instance's `/tmp` and are not shared.

## Deploy on Vercel

1. Import the Git repository.
2. Framework preset: Next.js. Root directory: the repo root. Build command: `npm run build`.
3. Add `AUTH_SECRET` (required in production) and `DEMO_PASSWORD` if you do not want `demo`.
4. Add `DATABASE_URL` from Supabase, then run migrate and seed once from a machine that can reach the database. The first request also writes the seed into `app_state` if that table exists and is empty.
5. Add Stripe, Twilio, GoHighLevel, Google, and email keys when those accounts exist. Leave them blank until then.
6. Deploy. Check `/`, `/estimate`, `/admin`, `/tech`, and `/t/sample-on-the-way`.

Do not turn on a custom domain until the placeholders in `src/config/business.ts` are real.

## Where to edit the business

| Change | File or screen |
|---|---|
| Phone, license, hours, address, warranty, financing partner | `src/config/business.ts` |
| ZIP list and utilities | `src/config/service-area.ts` |
| Photos | `public/photos` and `src/config/media.ts` |
| Logo | `public/brand` |
| Prices and "set price" vs "confirm on site" | Office Settings |
| SMS wording and quiet hours | Office SMS templates and Settings |
| Permit offices | Seeded from the permits research. Edit in the database later, or `src/lib/seed.ts` before a reset. |

## What is real vs stubbed

Real in this build: the funnel saves a lead, recomputes the quote from the price book, and a booking creates a customer, property, job, permit shell, deposit row, tracking link, and (if consent was checked) a text record. The lead appears in the office inbox. Pipeline drag, calendar assignment, permit status, inspection results, tech status, photos, and signature all write to the store.

Stubbed until keys exist: Stripe charges, Twilio delivery, GoHighLevel webhook, Google live traffic, and outbound email. Photo "reading" shows a labeled sample readout. It is not a vision model.

Decisions made while finishing the build are in `DECISIONS.md`.
