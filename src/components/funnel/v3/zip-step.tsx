"use client";

import type { ZipLookup } from "@/config/service-area";
import { StepActions } from "./actions";
import { StepHeading } from "./shell";

const BULLETS = ["Photos, not a home visit", "Estimated price ranges", "Pick your install date"];

export function ZipStep({
  zip,
  onZip,
  place,
  jurisdictionName,
  deposit,
  canContinue,
  busy,
  onContinue,
}: {
  zip: string;
  onZip: (zip: string) => void;
  place: ZipLookup | null;
  jurisdictionName?: string;
  deposit: number;
  canContinue: boolean;
  busy: boolean;
  onContinue: () => void;
}) {
  const detail = place
    ? [place.city, place.utility, jurisdictionName].filter(Boolean).join(" · ")
    : "";
  const note = place && "note" in place ? place.note : "";

  return (
    <form
      className="mx-auto flex w-full max-w-[720px] flex-1 flex-col lg:items-center"
      onSubmit={(event) => {
        event.preventDefault();
        if (canContinue) onContinue();
      }}
    >
      <StepHeading
        title="Where's the install?"
        body={`Instant estimate from photos. A $${deposit} refundable deposit locks your date.`}
      />
      <label className="mt-6 block w-full max-w-[420px] lg:mt-8 lg:text-center" htmlFor="zip">
        <span className="text-sm text-slate">ZIP code</span>
        <input
          id="zip"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          value={zip}
          placeholder="95819"
          onChange={(event) => onZip(event.target.value.replace(/\D/g, "").slice(0, 5))}
          className="mt-1.5 h-16 w-full rounded-2xl border-2 border-blue bg-white px-4 text-center text-[30px] font-medium tracking-wide text-ink outline-none placeholder:text-slate/40"
        />
      </label>
      <p className="mt-2 text-sm text-slate lg:text-center">Sets your permit office and utility.</p>
      {detail ? <p className="mt-1 text-sm text-graphite lg:text-center">{detail}</p> : null}
      {note ? <p className="mt-1 max-w-[460px] text-sm text-slate lg:text-center">{note}</p> : null}
      <ul className="mt-5 flex flex-col gap-2 text-[15px] text-graphite lg:flex-row lg:gap-6">
        {BULLETS.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue" />
            {item}
          </li>
        ))}
      </ul>
      <StepActions type="submit" label="Start my estimate" hint="Press Enter" disabled={!canContinue} busyLabel={busy ? "Saving..." : undefined} />
    </form>
  );
}
