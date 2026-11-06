"use client";

import { range } from "@/lib/format";
import type { QuoteResult } from "@/lib/pricing";
import type { TierKey } from "@/lib/types";
import { StepActions } from "./actions";
import { StepHeading } from "./shell";

export function PriceStep({
  quote,
  tier,
  unknown,
  confirmedOnSite,
  busy,
  onTier,
  onContinue,
}: {
  quote: QuoteResult;
  tier: TierKey;
  unknown: boolean;
  confirmedOnSite: boolean;
  busy: boolean;
  onTier: (tier: TierKey) => void;
  onContinue: () => void;
}) {
  const active = quote.tiers.find((row) => row.tier === tier) || quote.tiers[0];
  const shown = quote.singleRange
    ? range(quote.singleRange.low, quote.singleRange.high)
    : active
      ? range(active.low, active.high)
      : "";
  const kicker = quote.singleRange ? quote.packageLabel : `${active?.label || "Estimate"}, estimated range`;
  const context = unknown
    ? `${quote.headline} · same-type swap until the unit is identified`
    : `${quote.headline} · same-type swap`;
  const caption = confirmedOnSite
    ? "Sample estimate [est.]. Final price confirmed on site."
    : "Sample estimate [est.]. This office uses a set price for the quoted scope.";
  const label = quote.singleRange || !active
    ? "Continue"
    : `Continue with ${active.label}`;

  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-1 flex-col">
      <div className="lg:text-center">
        <StepHeading title="Your estimate" />
        <p className="mt-2 text-[15px] text-slate">{context}</p>
        <p className="mt-4 text-[15px] font-medium text-blue">{kicker}</p>
        <p className="mt-1 font-display text-[44px] font-semibold leading-none tracking-[-0.03em] lg:text-[64px]">{shown}</p>
        <p className="mt-3 text-sm text-slate">{caption}</p>
      </div>
      {quote.singleRange ? null : (
        <div className={`mt-6 grid gap-3 ${quote.tiers.length > 2 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          {quote.tiers.map((row, index) => {
            const selected = row.tier === tier;
            return (
              <button
                key={row.tier}
                type="button"
                aria-pressed={selected}
                onClick={() => onTier(row.tier)}
                className={`relative rounded-2xl border-2 px-4 py-4 text-left lg:min-h-[148px] lg:px-5 lg:py-5 ${selected ? "border-blue bg-tint" : "border-[#E6E8EC] bg-white"}`}
              >
                <span className={`absolute right-4 top-4 hidden text-xs lg:inline ${selected ? "text-blue" : "text-slate"}`}>{index + 1}</span>
                <span className="flex items-center justify-between gap-3 lg:block">
                  <span className={`text-[15px] font-medium ${selected ? "text-blue" : "text-ink"}`}>{row.label}</span>
                  <span className="text-[15px] font-medium lg:mt-3 lg:block lg:text-lg">{range(row.low, row.high)}</span>
                </span>
                <span className="mt-2 hidden text-sm leading-5 text-slate lg:block">{row.blurb}</span>
              </button>
            );
          })}
        </div>
      )}
      <p className="mt-4 rounded-2xl bg-[#F4F6F8] px-4 py-3 text-sm leading-5 text-slate lg:text-center">
        In every level: {quote.included.join(" · ")}. [est.]
      </p>
      <StepActions
        label={label}
        hint="Press Enter · or 1 2 3 to switch tier"
        onClick={onContinue}
        busyLabel={busy ? "Saving..." : undefined}
      />
    </div>
  );
}
