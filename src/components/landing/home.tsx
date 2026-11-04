import Link from "next/link";
import { CalendarCheck, Camera, Clock3, ShieldCheck } from "lucide-react";
import { business } from "@/config/business";
import { media } from "@/config/media";
import { money, range } from "@/lib/format";
import { heroExample, policyLine, startingRanges } from "@/lib/pricing";
import type { Settings } from "@/lib/types";
import { Logo } from "@/components/brand";
import { FaqList } from "./faq";

const nav = [
  { href: "/#how", label: "How it works" },
  { href: "/#heaters", label: "Water heaters" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function HomePage({ settings }: { settings: Settings }) {
  const hero = heroExample(settings.priceBook);
  const starts = startingRanges(settings.priceBook);
  const policy = policyLine(settings.priceConfirmedOnSite);
  const priceFoot = settings.priceConfirmedOnSite
    ? "Prices shown are estimated ranges. Final price confirmed on site."
    : "Prices shown are set for the quoted scope. Work outside that scope is a separate line.";

  const faqs = [
    {
      q: "Do I need a permit?",
      a: "Yes. California requires a permit for water heater replacement. In the City of Sacramento the permit fee is about $75 base, roughly $89 to $95 all-in. We pull the permit and schedule the inspection.",
    },
    {
      q: "Are earthquake straps required?",
      a: "Yes. California requires water heaters to be braced or strapped. Two straps go in the upper and lower thirds of the tank, with the lower strap at least 4 inches above the controls. Straps are included in every install.",
    },
    {
      q: "How long does a water heater last?",
      a: "Most tank water heaters last about 8 to 12 years. Tankless units often last longer, about 20 years, and need descaling in hard water. Age is one of the things we read from the data plate.",
    },
    {
      q: "Can I switch to tankless?",
      a: `Yes. A tank to tankless switch is a conversion, not a same-type swap. It often needs a larger gas line and new venting. Estimates start from ${money(starts.tanklessFrom)}. Your photos tighten the range.`,
    },
    {
      q: "How does the $100 deposit work?",
      a: "The $100 is credited at install. It is refundable with 24 or more hours' notice. It holds the arrival window you pick. Only the deposit is due when you book.",
    },
    {
      q: "Is the estimate my final price?",
      a: settings.priceConfirmedOnSite
        ? "The range is an estimate from your answers and photos. Your tech confirms the price on site before work starts. If that check changes the price and you decline, the deposit is refundable."
        : "This office is set to a set price for the scope in your quote. If the site shows work that was not in the quote, that work is priced as its own line before anyone starts.",
    },
  ];

  return (
    <div className="bg-white text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href="/" aria-label="Hot Water Experts home">
            <Logo className="h-8 w-auto" />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-graphite md:flex">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-ink">
                {item.label}
              </a>
            ))}
          </nav>
          <Link href="/estimate" className="btn-pill btn-pill-ink h-10 px-4 text-sm">
            Get my price
          </Link>
        </div>
        <details className="border-t border-line px-4 py-2 md:hidden">
          <summary className="cursor-pointer text-sm text-slate">Menu</summary>
          <div className="flex flex-col gap-2 py-2 text-sm">
            {nav.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </div>
        </details>
      </header>

      <main id="main">
        <section className="relative min-h-[640px] overflow-hidden bg-ink text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={media.hero} alt={media.heroAlt} className="absolute inset-0 h-full w-full object-cover object-[72%_center]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,12,16,0.88)_0%,rgba(10,12,16,0.62)_42%,rgba(10,12,16,0.18)_100%)]" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
            <div>
              <p className="mb-4 inline-flex rounded-full border border-white/30 px-3 py-1 text-xs tracking-wide">
                Pick your install time
              </p>
              <p className="text-xs font-medium tracking-[0.14em] text-white/80">WATER HEATER REPLACEMENT · SACRAMENTO AREA</p>
              <h1 className="mt-3 max-w-xl text-5xl leading-[1.02] md:text-6xl">Hot water back. Price upfront.</h1>
              <p className="mt-4 max-w-lg text-base leading-7 text-white/85">
                Snap a few photos of your water heater for an instant estimate. Then pick an install time and lock it with a $100 refundable deposit.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/estimate" className="btn-pill btn-pill-white">
                  Get my instant estimate
                </Link>
                <a href="#how" className="btn-pill btn-pill-ghost">
                  How it works
                </a>
              </div>
              <ul className="mt-6 flex flex-col gap-2 text-sm text-white/85">
                <li>Estimate from your photos</li>
                <li>$100 deposit, credited at install</li>
                <li>Refundable with 24+ hours&apos; notice</li>
              </ul>
            </div>
            <aside className="rounded-3xl bg-white p-5 text-ink shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-slate">Example</p>
                <p className="text-xs text-slate">From the price book</p>
              </div>
              <h2 className="mt-3 font-sans text-2xl font-semibold tracking-normal">{hero.label}</h2>
              <p className="text-sm text-slate">{hero.detail}</p>
              <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Read from your photos</dt>
                  <dd>Natural gas, 50 gal</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Deposit to lock your date</dt>
                  <dd>$100, refundable</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate">Estimated total</dt>
                  <dd className="num font-medium">{range(hero.low, hero.high)}</dd>
                </div>
              </dl>
              <Link href="/estimate" className="btn-pill btn-pill-blue mt-5 w-full">
                Get my own estimate
              </Link>
              <p className="mt-3 text-center text-xs text-slate">{policy}</p>
            </aside>
          </div>
        </section>

        <section className="border-b border-line bg-mist">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Camera, "Upfront estimate", "From your photos"],
              [ShieldCheck, "$100 refundable deposit", "Credited at install"],
              [CalendarCheck, "Pick your install time", "Choose it online"],
              [Clock3, settings.priceConfirmedOnSite ? "Price confirmed on site" : "Set price upfront", settings.priceConfirmedOnSite ? "Before work starts" : "For the quoted scope"],
            ].map(([Icon, title, body]) => (
              <div key={String(title)} className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 text-blue" aria-hidden />
                <div>
                  <p className="text-sm font-medium">{String(title)}</p>
                  <p className="text-sm text-slate">{String(body)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="heaters" className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs font-medium tracking-[0.14em] text-slate">WATER HEATERS</p>
          <h2 className="mt-2 text-4xl">Every type, estimated before we arrive.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              [media.tank, media.tankAlt, "Gas or electric tank", "Same-type swap. The fastest path back to hot water.", `From ${money(starts.same.low)}`],
              [media.tankless, media.tanklessAlt, "Tankless", "Endless hot water, wall-mounted.", `From ${money(starts.tanklessFrom)}`],
              [media.heatPump, media.heatPumpAlt, "Heat pump", "The most efficient option for electric homes.", `From ${money(starts.heatPumpFrom)}`],
            ].map(([src, alt, title, body, price]) => (
              <article key={String(title)} className="overflow-hidden rounded-3xl border border-line bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={String(src)} alt={String(alt)} className="h-52 w-full object-cover" />
                <div className="p-5">
                  <h3 className="font-sans text-lg font-semibold tracking-normal">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate">{body}</p>
                  <p className="num mt-3 text-sm">{price} est.</p>
                  <Link href="/estimate" className="mt-3 inline-block text-sm font-medium text-blue">
                    See my estimate
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate">
            {settings.priceConfirmedOnSite
              ? "Estimated starting ranges, installed. Your photos and an on-site check set the final price."
              : "Estimated starting ranges, installed. The price you accept is the set price for that scope."}
          </p>
        </section>

        <section id="how" className="bg-mist py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-4xl">From photo to install date in four steps.</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {[
                ["1", "Answer a few taps", "One question per screen. Type, location, age, what you want next.", media.sink],
                ["2", "Snap your water heater", "A short photo checklist. We read the data plate for you.", media.tank],
                ["3", "See your estimate", "Good, better, and best, each as an estimated range.", media.heatPump],
                ["4", "Lock your date with $100", "Pick a time. Credited at install, refundable with 24+ hours' notice.", media.techWall],
              ].map(([n, title, body, src]) => (
                <article key={n} className="overflow-hidden rounded-3xl bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-36 w-full object-cover" />
                  <div className="p-4">
                    <p className="text-xs text-slate">Step {n}</p>
                    <h3 className="mt-1 font-sans text-base font-semibold tracking-normal">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate">{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={media.tank} alt={media.tankAlt} className="h-[420px] w-full object-cover" />
            <p className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/95 px-4 py-3 text-sm">
              Read from your data plate: Natural gas, 50 gal, 2014
            </p>
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-slate">PHOTO ESTIMATE</p>
            <h2 className="mt-2 text-4xl">Snap a photo. We read the details.</h2>
            <p className="mt-4 text-base leading-7 text-slate">
              Your data plate tells us the fuel, size, and age. A few more photos show the venting, gas line, and water connections, so your estimate fits your setup.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>Data plate: fuel, size, age</li>
              <li>Whole unit and its space</li>
              <li>Vent, gas line, water connections</li>
            </ul>
            <Link href="/estimate" className="btn-pill btn-pill-blue mt-6">
              Start with a photo
            </Link>
          </div>
        </section>

        <section className="bg-ink py-16 text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] text-white/60">BOOK WITH CONFIDENCE</p>
              <h2 className="mt-2 text-4xl">$100 refundable deposit locks your date.</h2>
              <p className="mt-4 max-w-md text-white/80">
                Credited at install. Refundable with 24+ hours&apos; notice. Pick the day and arrival window that work for you.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-4 text-ink">
              <div className="grid grid-cols-6 gap-2 text-center text-xs text-slate">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
                {["26", "27", "28", "29", "30", "31"].map((day) => (
                  <div key={day} className={`rounded-xl py-3 ${day === "27" ? "bg-blue text-white" : "bg-mist"}`}>
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {["8 to 10 AM", "10 AM to 12 PM", "12 to 2 PM", "2 to 4 PM"].map((window, index) => (
                  <div key={window} className={`rounded-xl px-3 py-2 ${index === 1 ? "bg-tint text-blue-deep" : "bg-mist"}`}>
                    {window}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-4xl">Pay at install, or spread it out.</h2>
          <p className="mt-3 max-w-xl text-slate">
            Plans are shown after a quick check, subject to approval. No rates are shown before then. Financing partner: {business.financingPartner}
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Pay at install", "Card or bank payment when the job is done."],
              ["Pay over time", "See plans after a quick check. Subject to approval."],
              ["$100 today", "Only the deposit is due when you book."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-3xl border border-line p-5">
                <h3 className="font-sans text-lg font-semibold tracking-normal">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="bg-mist py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-4xl">Proof you can check before you pay.</h2>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              <article className="rounded-3xl bg-white p-5">
                <p className="text-sm text-slate">Your photo readout</p>
                <p className="mt-3 text-lg font-medium">Natural gas, 50 gal, 2014</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media.tank} alt="" className="mt-4 h-36 w-full rounded-2xl object-cover" />
              </article>
              <article className="rounded-3xl bg-white p-5">
                <p className="text-sm text-slate">Your estimate, itemized</p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li className="flex justify-between"><span>Good</span><span className="num">$1,895 to $2,365</span></li>
                  <li className="flex justify-between"><span>Better</span><span className="num">$2,095 to $2,565</span></li>
                  <li className="flex justify-between"><span>Best</span><span className="num">$2,395 to $2,590</span></li>
                </ul>
                <p className="mt-3 text-xs text-slate">{policy}</p>
              </article>
              <article className="overflow-hidden rounded-3xl bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media.tech} alt={media.techAlt} className="h-40 w-full object-cover" />
                <div className="p-5">
                  <p className="text-sm text-slate">Your booking</p>
                  <p className="mt-2 font-medium">Date, arrival window, $100 deposit</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="text-4xl">Questions, answered.</h2>
          <div className="mt-6">
            <FaqList items={faqs} />
          </div>
        </section>

        <section className="relative overflow-hidden bg-ink text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={media.techWall} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-ink/70" />
          <div className="relative mx-auto max-w-6xl px-4 py-20">
            <p className="text-xs font-medium tracking-[0.14em] text-white/70">READY WHEN YOU ARE</p>
            <h2 className="mt-2 max-w-xl text-4xl md:text-5xl">See your price before anyone visits.</h2>
            <p className="mt-4 max-w-lg text-white/80">Instant estimate from photos. A $100 refundable deposit locks your install date.</p>
            <Link href="/estimate" className="btn-pill btn-pill-white mt-6">
              Get my instant estimate
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-ink text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo reversed className="h-9 w-auto" />
            <p className="mt-4 text-sm text-white/70">{business.name}</p>
            <p className="mt-2 text-sm text-white/70">{priceFoot}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium">Get started</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li><Link href="/estimate">Instant estimate</Link></li>
              <li><Link href="/estimate">Book an install</Link></li>
              <li><Link href="/login">Staff sign in</Link></li>
            </ul>
          </div>
          <div className="text-sm text-white/70">
            <p>Phone: {business.phone}</p>
            <p className="mt-1">Hours: {business.hours}</p>
            <p className="mt-1">License: {business.license}</p>
            <p className="mt-1">Service area: {business.serviceArea}</p>
            <p className="mt-1">{business.address}</p>
            <p className="mt-3 flex gap-4">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
