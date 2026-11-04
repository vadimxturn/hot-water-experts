# Decisions made without Vadim

Vadim asked for the build to finish while he was unavailable. These are the calls made so the app could ship. Each one is easy to change in the place named.

## Price policy

The public site defaults to a **set price** for the quoted scope. The Oct 17 customer-flow note said to set the price with no on-site confirmation. The landing and funnel designs still say the price is confirmed on site. Both sentences exist in the app.

Settings, under Buffers and booking, has **Confirm the price on site**. It is off in the seed. Turning it on switches the landing, the funnel footnote, the FAQ, and the thank-you page back to on-site confirmation. The price numbers themselves do not change.

## Name and brand

The product name is **Hot Water Experts**, matching the latest logo and funnel. Older docs that say Water Heater Experts were treated as the working name. Fonts are Archivo for marketing headlines (weight 600) and Inter for everything else. Back office IDs and money use JetBrains Mono. Buttons are flat. There is no gradient fill on a button.

## Missing business facts

License, phone, hours, address, legal name, warranty, financing partner, and service-area wording are placeholders in `src/config/business.ts`. They show on the site as `[pending]` text. Nothing was invented. There are no reviews, star ratings, or review counts.

Photos in `public/photos` are the design stand-ins from the handoff. Swap the files, or the paths in `src/config/media.ts`. They are not presented as named employees.

## Service area

`src/config/service-area.ts` is a placeholder ZIP list for the Sacramento area. A listed ZIP sets a city, a permit office, and a utility. A 956, 957, or 958 ZIP that is not listed is treated as likely in area, and the office confirms the desk. Any other ZIP is saved as outside the placeholder area. The lead is still stored.

## Booking rules

The sample office date is **Monday, Oct 19, 2026**, so the seeded board matches the designs. Settings can clear that date and the app will use the real date.

The earliest install is that date plus 7 days, which lands on Monday, Oct 26. "No same week" defaults to the next 7 days. Settings can switch that to the rest of the calendar week. Offer weeks 3 to 8 are stored. The date picker still shows the first open week, because the funnel design starts one week out. Max installs per tech per day is 2. Buffer is 90 minutes.

## Money

The $100 deposit is recorded. Without `STRIPE_SECRET_KEY`, no card is charged and the payment is marked as a stub. With a key, the server creates a PaymentIntent and still does not collect the card on this screen, because Stripe Elements is not mounted yet. The balance stays due on the job.

Prices in the funnel come from the editable price book in Settings. The numbers are the estimate sheet from the handoff, not a final tariff. The sample job HWE-S-1038 keeps the set-price lines from its design screen. Those lines are not the public price book.

## Messaging and maps

Texts are saved on the job. Twilio sends them only when account SID, token, and from-number are set. GoHighLevel receives a JSON POST only when `GHL_WEBHOOK_URL` is set. Otherwise the lead row stores a stub sync. Maps are a drawn sample route. Google Routes is used for ETA only when `GOOGLE_MAPS_API_KEY` is set. Email summaries are recorded and not sent until `RESEND_API_KEY` is set.

SMS consent is optional and unchecked. The deposit acknowledgement is required to book. The exact consent sentence is stored with the time and IP when the host sends one.

## Permits

The app pre-fills a packet and tracks 11 steps. A person still opens the city portal, signs, submits, and pays. Status buttons only record what a person already did. There is no unattended portal bot.

## Data and auth

With no `DATABASE_URL`, the app uses the seed in memory and writes `data/store.json` when the disk is writable (or `/tmp` on a read-only host). With `DATABASE_URL`, Drizzle stores the same document in `app_state` and refreshes the normalized tables from `drizzle/0001_init.sql`.

Staff sign-in is a signed cookie. Demo password is `demo` unless `DEMO_PASSWORD` is set. Roles are admin, office, and tech. The sample permit VA is an office user. Techs only see their jobs. Customers have no login. They use `/t/[token]`.

## What was not built

A full legal privacy policy and terms. Real Stripe card entry. Live GPS streaming to every viewer (the tracking page refreshes every 20 seconds). Drag-and-drop on the dispatch calendar (assignment is a form; the pipeline board does drag between stages). Per-tech day-off calendar beyond the office hours toggle.
