"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { newJobAction } from "@/server/actions";
import type { RangePreset } from "@/lib/owner-home";

export function OwnerRange({
  preset,
  from,
  to,
  spanLabel,
}: {
  preset: RangePreset;
  from: string;
  to: string;
  spanLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(preset === "custom");
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <label className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-[#e2e5eb] bg-white px-3 text-[13px] font-medium text-ink">
        <span className="sr-only">Month</span>
        <select
          className="bg-transparent pr-1 outline-none"
          value={preset}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "custom") {
              setOpen(true);
              return;
            }
            setOpen(false);
            router.push(`/admin?range=${value}`);
          }}
        >
          <option value="this-month">This month</option>
          <option value="last-month">Last month</option>
          <option value="this-week">This week</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      <button
        type="button"
        className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-[#e2e5eb] bg-white px-3 text-[13px] font-medium text-ink"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <CalendarIcon />
        <span>{spanLabel}</span>
        <Chevron />
      </button>
      {open && (
        <form action="/admin" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="range" value="custom" />
          <label className="text-xs text-[#6b7280]">
            From
            <input type="date" name="from" defaultValue={from} required className="ml-1 h-9 rounded-[9px] border border-[#e2e5eb] px-2 text-[13px] text-ink" />
          </label>
          <label className="text-xs text-[#6b7280]">
            To
            <input type="date" name="to" defaultValue={to} required className="ml-1 h-9 rounded-[9px] border border-[#e2e5eb] px-2 text-[13px] text-ink" />
          </label>
          <button type="submit" className="h-9 rounded-[9px] border border-[#e2e5eb] bg-white px-3 text-[13px] font-medium text-ink">
            Apply
          </button>
        </form>
      )}
      <form action={newJobAction}>
        <button type="submit" className="inline-flex h-9 items-center rounded-[9px] bg-[#367af4] px-3.5 text-[13px] font-medium text-white hover:bg-[#1f5fd6]">
          + New job
        </button>
      </form>
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#6b7280]" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#9ca3af]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
