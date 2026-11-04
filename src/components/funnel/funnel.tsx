"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { business, photoSlots } from "@/config/business";
import { lookupZip } from "@/config/service-area";
import { Logo } from "@/components/brand";
import { media } from "@/config/media";
import { formatLongDate, money, range, weekdayShort } from "@/lib/format";
import { labelLocation, policyLine, quoteFor, startingRanges } from "@/lib/pricing";
import type { PricePackage, TierKey } from "@/lib/types";
import { bookLeadAction, createLeadAction, updateLeadAction } from "@/server/actions";

interface DaySlot {
  date: string;
  closed: boolean;
  slots: { window: string; full: boolean }[];
}

interface Draft {
  step: number;
  leadId?: string;
  zip: string;
  situation?: string;
  currentType?: string;
  location?: string;
  age?: string;
  nextType?: string;
  people?: string;
  bathrooms: number;
  timing?: string;
  photos: { slot: string; name: string }[];
  tier?: TierKey;
  payMethod?: "install" | "over_time";
  installDate?: string;
  window?: string;
  name: string;
  email: string;
  phone: string;
  smsConsent: boolean;
  depositAck: boolean;
  error?: string;
  busy?: boolean;
}

const empty: Draft = {
  step: 1,
  zip: "",
  bathrooms: 2,
  photos: [],
  name: "",
  email: "",
  phone: "",
  smsConsent: false,
  depositAck: false,
};

export function Funnel({
  priceBook,
  confirmedOnSite,
  deposit,
  earliest,
  days,
}: {
  priceBook: PricePackage[];
  confirmedOnSite: boolean;
  deposit: number;
  earliest: string;
  days: DaySlot[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<Draft>({ ...empty, installDate: earliest, window: "10 AM-12 PM" });
  const [weekIndex, setWeekIndex] = useState(0);
  const patch = (partial: Partial<Draft>) => setDraft((current) => ({ ...current, ...partial, error: undefined }));

  const quote = useMemo(
    () =>
      quoteFor(
        { priceBook, priceConfirmedOnSite: confirmedOnSite },
        {
          currentType: draft.currentType,
          nextType: draft.nextType,
          people: draft.people,
          location: draft.location,
          tier: draft.tier,
        },
      ),
    [priceBook, confirmedOnSite, draft.currentType, draft.nextType, draft.people, draft.location, draft.tier],
  );
  const starts = startingRanges(priceBook);
  const place = draft.zip.length === 5 ? lookupZip(draft.zip) : null;
  const saveOnly = draft.timing === "just_pricing";
  const weeks: DaySlot[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const week = weeks[Math.min(weekIndex, Math.max(0, weeks.length - 1))] || [];

  async function ensureLead() {
    if (draft.leadId) return draft.leadId;
    const lead = await createLeadAction({ zip: draft.zip });
    patch({ leadId: lead.id });
    return lead.id;
  }

  async function sync(extra: Partial<Draft>) {
    const next = { ...draft, ...extra };
    if (!next.leadId) return;
    await updateLeadAction(next.leadId, {
      zip: next.zip,
      situation: next.situation,
      currentType: next.currentType,
      location: next.location,
      age: next.age,
      nextType: next.nextType,
      people: next.people,
      bathrooms: next.bathrooms,
      timing: next.timing,
      photos: next.photos,
      tier: next.tier,
      payMethod: next.payMethod,
      installDate: next.installDate,
      window: next.window,
      step: next.step,
      readout: next.photos.length
        ? { fuel: "Natural gas", size: "50 gal", year: "2014", sample: true }
        : undefined,
    });
  }

  async function go(nextStep: number, extra: Partial<Draft> = {}) {
    patch({ busy: true, ...extra });
    try {
      let leadId = draft.leadId;
      if (draft.step === 1) leadId = await ensureLead();
      const merged = { ...draft, ...extra, leadId, step: nextStep, busy: false };
      setDraft(merged);
      if (leadId) await sync({ ...extra, leadId, step: nextStep });
    } catch (error) {
      patch({ busy: false, error: error instanceof Error ? error.message : "Something went wrong." });
    }
  }

  async function finish() {
    patch({ busy: true });
    try {
      const leadId = draft.leadId || (await ensureLead());
      await bookLeadAction(leadId, {
        name: draft.name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        smsConsent: draft.smsConsent,
        depositAck: draft.depositAck,
        tier: draft.tier || quote.recommended,
        installDate: saveOnly ? undefined : draft.installDate,
        window: saveOnly ? undefined : draft.window,
        saveOnly,
      });
      router.push(`/thank-you?lead=${leadId}`);
    } catch (error) {
      patch({ busy: false, error: error instanceof Error ? error.message : "Could not save the booking." });
    }
  }

  const phoneOk = draft.phone.replace(/\D/g, "").length >= 10;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email);
  const can = (() => {
    if (draft.busy) return false;
    if (draft.step === 1) return draft.zip.length === 5;
    if (draft.step === 2) return Boolean(draft.situation);
    if (draft.step === 3) return true;
    if (draft.step === 4) return Boolean(draft.location);
    if (draft.step === 5) return Boolean(draft.age);
    if (draft.step === 6) return Boolean(draft.nextType);
    if (draft.step === 7) return Boolean(draft.people);
    if (draft.step === 8) return Boolean(draft.timing);
    if (draft.step === 11) return Boolean(draft.payMethod);
    if (draft.step === 12) return Boolean(draft.installDate && draft.window) || saveOnly;
    if (draft.step === 13) {
      const base = draft.name.trim().length > 1 && phoneOk && emailOk;
      return saveOnly ? base : base && draft.depositAck;
    }
    return true;
  })();

  const buttonLabel = (() => {
    if (draft.step === 1) return "Start my estimate";
    if (draft.step === 9 && draft.photos.length < 5) return `Take photo ${draft.photos.length + 1} of 5`;
    if (draft.step === 10) {
      if (quote.singleRange) return "Continue";
      const tier = draft.tier || quote.recommended;
      return `Continue with ${tier[0].toUpperCase()}${tier.slice(1)}`;
    }
    if (draft.step === 12) return saveOnly ? "Continue" : "Continue to deposit";
    if (draft.step === 13) return saveOnly ? "Save my estimate" : `Pay $${deposit} and book`;
    return "Continue";
  })();

  function onPrimary() {
    if (draft.step === 9 && draft.photos.length < 5) {
      fileRef.current?.click();
      return;
    }
    if (draft.step === 13) {
      void finish();
      return;
    }
    const extra: Partial<Draft> = {};
    if (draft.step === 10 && !draft.tier) extra.tier = quote.recommended;
    const jump = draft.step === 8 && draft.timing === "just_pricing" ? 9 : draft.step + 1;
    void go(draft.step === 12 && saveOnly ? 13 : jump, extra);
  }

  return (
    <div className="h-dvh overflow-hidden bg-[#e7e9ee] text-ink">
      <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col bg-[#f4f5f7]">
        <header className="flex h-12 shrink-0 items-center justify-between px-3">
          {draft.step === 1 ? (
            <Link href="/" className="grid h-9 w-9 place-items-center rounded-full text-lg" aria-label="Back to home">
              ←
            </Link>
          ) : (
            <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-lg" aria-label="Back" onClick={() => patch({ step: Math.max(1, draft.step - 1) })}>
              ←
            </button>
          )}
          <Logo className="h-6 w-auto" />
          <span className="w-12 text-right text-xs text-slate">{draft.step} / 14</span>
        </header>

        <div className="flex min-h-0 flex-1 flex-col px-4">
          {draft.step === 1 && (
            <Step title="Where's the install?" body="Instant estimate from photos. A $100 refundable deposit locks your date.">
              <label className="text-xs font-medium text-slate" htmlFor="zip">ZIP code</label>
              <input id="zip" inputMode="numeric" maxLength={5} value={draft.zip} onChange={(event) => patch({ zip: event.target.value.replace(/\D/g, "").slice(0, 5) })} placeholder="95819" className="mt-1 h-11 w-full rounded-2xl border border-line bg-white px-3 text-base" />
              <p className="mt-1 text-xs text-slate">Sets your permit office and utility.</p>
              {place && <p className="mt-2 text-xs text-graphite">{place.city}. {place.utility}. {"note" in place ? place.note : "In the placeholder service area."}</p>}
              <ul className="mt-3 space-y-1 text-sm text-graphite">
                <li>Photos, not a home visit</li>
                <li>Estimated price ranges</li>
                <li>Pick your install date</li>
              </ul>
            </Step>
          )}
          {draft.step === 2 && (
            <Step title="What's going on?" body="Pick the closest match.">
              <Choices value={draft.situation} onChange={(situation) => patch({ situation })} options={[
                ["no_hot_water", "No hot water", "Need it fixed fast"],
                ["leaking", "Leaking", "Water around the tank"],
                ["getting_old", "Getting old", "Planning ahead"],
                ["upgrading", "Upgrading", "Tankless or heat pump"],
              ]} />
            </Step>
          )}
          {draft.step === 3 && (
            <Step title="What do you have now?">
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
                {[
                  ["gas_tank", "Gas tank", "Most common", media.tank],
                  ["electric_tank", "Electric tank", "No gas line", media.hero],
                  ["tankless", "Tankless", "Wall-mounted", media.tankless],
                  ["heat_pump", "Heat pump", "Fan on top", media.heatPump],
                ].map(([id, title, body, src]) => (
                  <button key={id} type="button" onClick={() => patch({ currentType: id })} className={`overflow-hidden rounded-2xl border text-left ${draft.currentType === id ? "border-blue" : "border-line"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-16 w-full object-cover sm:h-20" />
                    <span className="block px-2 py-1.5">
                      <span className="block text-sm font-medium">{title}</span>
                      <span className="block text-[11px] text-slate">{body}</span>
                    </span>
                  </button>
                ))}
              </div>
              <button type="button" className="mt-2 text-left text-xs text-blue" onClick={() => patch({ currentType: "unknown" })}>
                Not sure? Skip it. Your photos will tell us.
              </button>
            </Step>
          )}
          {draft.step === 4 && (
            <Step title="Where is it?" body="Location changes venting and access.">
              <Choices value={draft.location} onChange={(location) => patch({ location })} options={[
                ["garage", "Garage", "Most common"],
                ["closet", "Indoor closet", "Hall or utility"],
                ["attic", "Attic", "Above the ceiling"],
                ["outside", "Outside", "Exterior wall or yard"],
              ]} />
            </Step>
          )}
          {draft.step === 5 && (
            <Step title="How old is it?" body="Most tanks last about 8 to 12 years.">
              <Choices value={draft.age} onChange={(age) => patch({ age })} options={[
                ["under_8", "Under 8 years", ""],
                ["8_12", "8 to 12 years", ""],
                ["12+", "12+ years", ""],
                ["unsure", "Not sure", ""],
              ]} />
              <details className="mt-2 text-xs text-slate">
                <summary className="cursor-pointer text-blue">Where to find the age</summary>
                <p className="pt-1">Look for a sticker on the tank, often near the gas valve or the top. The first four digits of the serial number are often the year and month.</p>
              </details>
            </Step>
          )}
          {draft.step === 6 && (
            <Step title="What do you want next?" body="Estimated starting ranges. Your photos tighten them.">
              <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
                {[
                  ["same", "Same type", `${money(starts.same.low)} to ${money(starts.same.high)} est.`, media.tank],
                  ["tankless", "Tankless", `From ${money(starts.tanklessFrom)} est.`, media.tankless],
                  ["heat_pump", "Heat pump", `From ${money(starts.heatPumpFrom)} est.`, media.heatPump],
                  ["help", "Help me choose", "We'll recommend one", media.tech],
                ].map(([id, title, body, src]) => (
                  <button key={id} type="button" onClick={() => patch({ nextType: id })} className={`overflow-hidden rounded-2xl border bg-white text-left ${draft.nextType === id ? "border-blue bg-tint" : "border-line"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="h-14 w-full object-cover" />
                    <span className="block px-2 py-1.5">
                      <span className="block text-sm font-medium">{title}</span>
                      <span className="block text-[11px] text-slate">{body}</span>
                    </span>
                  </button>
                ))}
              </div>
            </Step>
          )}
          {draft.step === 7 && (
            <Step title="How many people live there?" body="Sets the right tank size.">
              <div className="grid grid-cols-4 gap-2">
                {[
                  ["1-2", "1-2"],
                  ["3-4", "3-4"],
                  ["5+", "5+"],
                  ["unsure", "Not sure"],
                ].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => patch({ people: id })} className={`rounded-2xl border px-1 py-3 text-center text-sm ${draft.people === id ? "border-blue bg-tint" : "border-line bg-white"}`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-2xl border border-line bg-white px-3 py-2">
                <div>
                  <p className="text-sm font-medium">Bathrooms</p>
                  <p className="text-xs text-slate">Optional</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" className="h-8 w-8 rounded-full border border-line" onClick={() => patch({ bathrooms: Math.max(1, draft.bathrooms - 1) })} aria-label="Fewer bathrooms">-</button>
                  <span className="num w-4 text-center">{draft.bathrooms}</span>
                  <button type="button" className="h-8 w-8 rounded-full border border-line" onClick={() => patch({ bathrooms: Math.min(6, draft.bathrooms + 1) })} aria-label="More bathrooms">+</button>
                </div>
              </div>
            </Step>
          )}
          {draft.step === 8 && (
            <Step title="When do you need it?">
              <Choices value={draft.timing} onChange={(timing) => patch({ timing })} options={[
                ["asap", "As soon as possible", "We'll show the earliest open date"],
                ["this_week", "This week", "Pick a day that works"],
                ["just_pricing", "Just pricing for now", "No date needed yet"],
              ]} />
            </Step>
          )}
          {draft.step === 9 && (
            <Step title="Snap 5 quick photos." body="We read the data plate and setup for you.">
              <ul className="space-y-1.5">
                {photoSlots.map((slot, index) => {
                  const done = draft.photos.some((photo) => photo.slot === slot.id);
                  return (
                    <li key={slot.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm">
                      <span>{slot.label}</span>
                      <span className="text-xs text-slate">{done ? "Done" : index + 1}</span>
                    </li>
                  );
                })}
              </ul>
              {draft.photos.length > 0 && (
                <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs">
                  Sample readout (photo reading is not connected): Natural gas, 50 gal, 2014
                </p>
              )}
              <p className="mt-2 text-[11px] text-slate">Heat pump or tankless? We will ask for 2 more photos on the job.</p>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const slot = photoSlots[draft.photos.length]?.id || "extra";
                patch({ photos: [...draft.photos, { slot, name: file.name }] });
                event.target.value = "";
              }} />
            </Step>
          )}
          {draft.step === 10 && (
            <Step title="Your estimate" body="Pick a level.">
              <p className="text-sm font-medium">{quote.headline}</p>
              <p className="text-xs text-slate">{labelLocation(draft.location)}, {quote.context}</p>
              <div className="mt-2 space-y-1.5">
                {quote.singleRange ? (
                  <button type="button" className="w-full rounded-2xl border border-blue bg-tint px-3 py-2 text-left">
                    <span className="block text-sm font-medium">{quote.packageLabel}</span>
                    <span className="num text-sm">{range(quote.singleRange.low, quote.singleRange.high)} estimated</span>
                  </button>
                ) : (
                  quote.tiers.map((tier) => (
                    <button key={tier.tier} type="button" onClick={() => patch({ tier: tier.tier })} className={`w-full rounded-2xl border px-3 py-2 text-left ${ (draft.tier || quote.recommended) === tier.tier ? "border-blue bg-tint" : "border-line bg-white"}`}>
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium">{tier.label}</span>
                        <span className="num text-sm">{range(tier.low, tier.high)}</span>
                      </span>
                      <span className="block text-[11px] text-slate">{tier.blurb} · estimated</span>
                    </button>
                  ))
                )}
              </div>
              <details className="mt-1 text-xs text-slate">
                <summary className="cursor-pointer">What is in every level</summary>
                <p className="pt-1">{quote.included.join(", ")}.</p>
              </details>
              <details className="text-xs text-slate">
                <summary className="cursor-pointer">Why it is a range</summary>
                <p className="pt-1">{quote.notes.join(" ")}</p>
              </details>
              <p className="text-[11px] text-slate">{policyLine(confirmedOnSite)}</p>
            </Step>
          )}
          {draft.step === 11 && (
            <Step title="How do you want to pay?">
              <Choices value={draft.payMethod} onChange={(payMethod) => patch({ payMethod: payMethod as Draft["payMethod"] })} options={[
                ["install", "Pay at install", "Card or bank payment when the job is done"],
                ["over_time", "Pay over time", "See plans after a quick check. Subject to approval."],
              ]} />
              <details className="mt-2 text-xs text-slate">
                <summary className="cursor-pointer text-blue">How pay over time works</summary>
                <p className="pt-1">Plans are shown after a quick check, subject to approval. No rates are shown before then. Partner: {business.financingPartner}</p>
              </details>
              <p className="mt-2 text-xs">Either way, only the ${deposit} deposit is due today.</p>
            </Step>
          )}
          {draft.step === 12 && (
            <Step title="Pick your install date.">
              {saveOnly ? (
                <p className="text-sm text-slate">You asked for pricing only. You can still pick a date, or continue and save the estimate.</p>
              ) : null}
              <div className="mt-1 flex items-center justify-between text-sm">
                <button type="button" aria-label="Previous week" onClick={() => setWeekIndex((value) => Math.max(0, value - 1))}>←</button>
                <span>{week[0] ? formatLongDate(week[0].date).replace(/^[^,]+, /, "") : ""}</span>
                <button type="button" aria-label="Next week" onClick={() => setWeekIndex((value) => Math.min(weeks.length - 1, value + 1))}>→</button>
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                {week.map((day) => (
                  <button key={day.date} type="button" disabled={day.closed || day.slots.every((slot) => slot.full)} onClick={() => patch({ installDate: day.date })} className={`rounded-xl py-1.5 text-xs ${draft.installDate === day.date ? "bg-blue text-white" : day.closed ? "text-slate/40" : "bg-white"}`}>
                    <span className="block text-[10px]">{weekdayShort(day.date).slice(0, 1)}</span>
                    <span className="num">{day.date.slice(-2)}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate">Arrival window{draft.installDate ? ` · ${formatLongDate(draft.installDate)}` : ""}</p>
              <div className="mt-1 grid grid-cols-2 gap-1.5">
                {(week.find((day) => day.date === draft.installDate)?.slots || week[0]?.slots || []).map((slot) => (
                  <button key={slot.window} type="button" disabled={slot.full} onClick={() => patch({ window: slot.window })} className={`rounded-xl px-2 py-2 text-xs ${draft.window === slot.window ? "bg-blue text-white" : "bg-white"} ${slot.full ? "opacity-40" : ""}`}>
                    {slot.window}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate">Most swaps take about 3 hours on site. Booking starts {deposit === 100 ? "1 week out" : "after the lead time"}. Earliest {formatLongDate(earliest)}.</p>
            </Step>
          )}
          {draft.step === 13 && (
            <Step title={saveOnly ? "Save your estimate" : `Hold ${draft.installDate ? formatLongDate(draft.installDate) : "your date"} with $${deposit}.`} body={saveOnly ? "We will not text you unless you agree below." : "Credited at install. Refundable with 24+ hours' notice."}>
              <div className="grid gap-1.5">
                <input aria-label="Full name" value={draft.name} onChange={(event) => patch({ name: event.target.value })} placeholder="Full name" className="h-10 rounded-xl border border-line bg-white px-3 text-sm" />
                <input aria-label="Email" value={draft.email} onChange={(event) => patch({ email: event.target.value })} placeholder="Email" className="h-10 rounded-xl border border-line bg-white px-3 text-sm" />
                <input aria-label="Mobile phone" value={draft.phone} onChange={(event) => patch({ phone: event.target.value })} placeholder="Mobile phone" className="h-10 rounded-xl border border-line bg-white px-3 text-sm" />
                {!saveOnly && (
                  <div className="rounded-xl border border-dashed border-line bg-white px-3 py-2 text-xs text-slate">
                    Card · Demo mode. No card is charged unless Stripe keys are set. A real card field is added with those keys.
                  </div>
                )}
              </div>
              {!saveOnly && (
                <label className="mt-2 flex items-start gap-2 text-[11px] leading-4">
                  <input type="checkbox" checked={draft.depositAck} onChange={(event) => patch({ depositAck: event.target.checked })} className="mt-0.5" />
                  <span>{business.depositAckText}</span>
                </label>
              )}
              <label className="mt-1 flex items-start gap-2 text-[11px] leading-4">
                <input type="checkbox" checked={draft.smsConsent} onChange={(event) => patch({ smsConsent: event.target.checked })} className="mt-0.5" />
                <span>
                  {business.smsConsentText}{" "}
                  <Link href="/privacy" className="underline">Privacy</Link> and <Link href="/terms" className="underline">Terms</Link>.
                </span>
              </label>
              <p className="mt-1 text-[11px] text-slate">
                {quote.headline}. {draft.installDate ? formatLongDate(draft.installDate) : "No date yet"} {draft.window || ""}.
              </p>
            </Step>
          )}
        </div>

        <div className="shrink-0 px-4 pb-4">
          {draft.error && <p className="mb-2 text-center text-xs text-danger">{draft.error}</p>}
          <button type="button" disabled={!can} onClick={onPrimary} className="btn-pill btn-pill-blue h-12 w-full disabled:bg-slate/30">
            {draft.busy ? "Saving..." : buttonLabel}
          </button>
          {draft.step === 9 && (
            <button type="button" className="mt-2 w-full text-center text-xs text-slate" onClick={() => void go(10, draft.tier ? {} : { tier: quote.recommended })}>
              {draft.photos.length ? "Continue" : "Continue without photos"}
            </button>
          )}
          {draft.step === 13 && <p className="mt-1 text-center text-[11px] text-slate">Secure card payment</p>}
        </div>
      </div>
    </div>
  );
}

function Step({ title, body, children }: { title: string; body?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col pt-1">
      <h1 className="font-sans text-[26px] font-semibold leading-7 tracking-[-0.02em]">{title}</h1>
      {body && <p className="mt-1 text-sm leading-5 text-slate">{body}</p>}
      <div className="mt-3 flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function Choices({
  options,
  value,
  onChange,
}: {
  options: string[][];
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map(([id, title, body]) => {
        const selected = value === id;
        return (
          <button key={id} type="button" onClick={() => onChange(id)} className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left ${selected ? "border-blue bg-tint" : "border-line bg-white"}`}>
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? "border-blue bg-blue" : "border-slate/40"}`}>
              {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            <span>
              <span className="block text-[15px] font-medium leading-5">{title}</span>
              {body && <span className="block text-[12px] leading-4 text-slate">{body}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
