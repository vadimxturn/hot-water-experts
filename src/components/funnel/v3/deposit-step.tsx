"use client";

import { useState } from "react";
import Link from "next/link";
import { business } from "@/config/business";
import { formatHoldDate, weekdayShort, windowLabel } from "@/lib/format";
import type { DaySlot } from "@/lib/funnel/model";
import { PrimaryButton } from "./actions";

export function DepositStep({
  deposit,
  name,
  email,
  phone,
  smsConsent,
  depositAck,
  installDate,
  window,
  days,
  busy,
  canContinue,
  onName,
  onEmail,
  onPhone,
  onSms,
  onAck,
  onDate,
  onWindow,
  onContinue,
}: {
  deposit: number;
  name: string;
  email: string;
  phone: string;
  smsConsent: boolean;
  depositAck: boolean;
  installDate?: string;
  window?: string;
  days: DaySlot[];
  busy: boolean;
  canContinue: boolean;
  onName: (value: string) => void;
  onEmail: (value: string) => void;
  onPhone: (value: string) => void;
  onSms: (value: boolean) => void;
  onAck: (value: boolean) => void;
  onDate: (date: string) => void;
  onWindow: (window: string) => void;
  onContinue: () => void;
}) {
  const [open, setOpen] = useState(false);
  const weeks: DaySlot[][] = [];
  for (let index = 0; index < days.length; index += 7) weeks.push(days.slice(index, index + 7));
  const activeWeek = Math.max(0, weeks.findIndex((week) => week.some((day) => day.date === installDate)));
  const [weekIndex, setWeekIndex] = useState(activeWeek === -1 ? 0 : activeWeek);
  const week = weeks[Math.min(weekIndex, Math.max(0, weeks.length - 1))] || [];
  const slots = week.find((day) => day.date === installDate)?.slots || [];
  const shortDate = installDate ? formatHoldDate(installDate, "short") : "your date";
  const chip = installDate ? `${formatHoldDate(installDate, "rail")} · ${windowLabel(window)}` : "Choose a window";

  return (
    <form
      className="mx-auto flex w-full max-w-[560px] flex-1 flex-col lg:rounded-[28px] lg:border lg:border-[#E6E8EC] lg:px-10 lg:py-10 lg:shadow-[0_10px_40px_rgba(16,24,40,0.06)]"
      onSubmit={(event) => {
        event.preventDefault();
        if (canContinue) onContinue();
      }}
    >
      <h1 className="text-[28px] leading-8 lg:text-center lg:text-[40px] lg:leading-[46px]">
        <span className="lg:hidden">Hold {shortDate} with ${deposit}.</span>
        <span className="hidden lg:inline">Hold your install date.</span>
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-slate lg:text-center">
        <span className="lg:hidden">Credited at install. Refundable with 24+ hours&apos; notice.</span>
        <span className="hidden lg:inline">${deposit} refundable deposit. Applied to your job. Never a surprise fee.</span>
      </p>
      <div className="mt-4 lg:text-center">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-full bg-tint px-3 py-1.5 text-sm text-ink"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="h-2 w-2 rounded-full bg-blue" />
          {chip}
        </button>
      </div>
      {open ? (
        <div className="mt-3 rounded-2xl border border-[#E6E8EC] p-3">
          <div className="flex items-center justify-between text-sm">
            <button type="button" aria-label="Previous week" onClick={() => setWeekIndex((value) => Math.max(0, value - 1))}>←</button>
            <span>{week[0] ? formatHoldDate(week[0].date, "short") : ""}</span>
            <button type="button" aria-label="Next week" onClick={() => setWeekIndex((value) => Math.min(weeks.length - 1, value + 1))}>→</button>
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1">
            {week.map((day) => {
              const disabled = day.closed || day.slots.every((slot) => slot.full);
              const selected = day.date === installDate;
              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={disabled}
                  onClick={() => onDate(day.date)}
                  className={`rounded-xl py-1.5 text-xs ${selected ? "bg-blue text-white" : "bg-[#F4F6F8]"} disabled:opacity-40`}
                >
                  <span className="block text-[10px]">{weekdayShort(day.date).slice(0, 1)}</span>
                  <span>{day.date.slice(-2)}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.window}
                type="button"
                disabled={slot.full}
                onClick={() => onWindow(slot.window)}
                className={`rounded-xl px-2 py-2 text-xs ${window === slot.window ? "bg-blue text-white" : "bg-[#F4F6F8]"} disabled:opacity-40`}
              >
                {windowLabel(slot.window)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <Field label="Full name" value={name} autoComplete="name" onChange={onName} />
      <Field label="Mobile phone" desktopLabel="Mobile" value={phone} autoComplete="tel" onChange={onPhone} />
      <Field label="Email" value={email} autoComplete="email" onChange={onEmail} />
      <div className="mt-4 rounded-2xl border border-[#E6E8EC] bg-[#F7F8FA] px-4 py-3">
        <p className="text-sm text-graphite">Card</p>
        <p className="mt-1 text-[15px] text-slate">[Stripe card field · placeholder]</p>
        <p className="mt-1 text-xs text-slate">Demo mode. No card is charged unless Stripe keys are set.</p>
      </div>
      <label className="mt-4 flex items-start gap-2 text-[13px] leading-5">
        <input type="checkbox" checked={depositAck} onChange={(event) => onAck(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#367AF4]" />
        <span>{business.depositAckText}</span>
      </label>
      <label className="mt-3 flex items-start gap-2 text-[13px] leading-5">
        <input type="checkbox" checked={smsConsent} onChange={(event) => onSms(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#367AF4]" />
        <span>
          {business.smsConsentText}{" "}
          <Link href="/privacy" className="underline">Privacy</Link>
          {" · "}
          <Link href="/terms" className="underline">Terms</Link>
        </span>
      </label>
      {/* PLACEHOLDER: license, warranty, and reviews. No counts or ratings. */}
      <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[12px] leading-5 text-slate lg:justify-center">
        <span>License {business.license}</span>
        <span>Warranty {business.warranty}</span>
        <span>Reviews {business.reviews}</span>
      </p>
      <div className="mt-6 hidden flex-col items-center lg:flex">
        <PrimaryButton type="submit" disabled={!canContinue}>{busy ? "Saving..." : `Pay $${deposit} deposit`}</PrimaryButton>
        <p className="mt-3 text-center text-xs text-slate">Secure card payment.</p>
      </div>
      <div className="fixed inset-x-0 bottom-0 bg-white px-5 pt-2 pb-3 lg:hidden">
        <PrimaryButton wide type="submit" disabled={!canContinue}>{busy ? "Saving..." : `Pay $${deposit} and book`}</PrimaryButton>
        <p className="mt-1 text-center text-xs text-slate">Secure card payment.</p>
      </div>
    </form>
  );
}

function Field({
  label,
  desktopLabel,
  value,
  autoComplete,
  onChange,
}: {
  label: string;
  desktopLabel?: string;
  value: string;
  autoComplete: string;
  onChange: (value: string) => void;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="mt-4 block text-sm text-graphite" htmlFor={id}>
      <span className="lg:hidden">{label}</span>
      <span className="hidden lg:inline">{desktopLabel || label}</span>
      <input
        id={id}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-12 w-full rounded-xl border border-[#E6E8EC] bg-white px-3 text-base text-ink outline-none focus:border-blue"
      />
    </label>
  );
}
