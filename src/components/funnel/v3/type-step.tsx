"use client";

import { UnitArt, type UnitKind } from "./art";
import { StepActions } from "./actions";
import { ChoiceBadge, StepHeading } from "./shell";

const OPTIONS: { id: UnitKind; title: string; body: string }[] = [
  { id: "gas_tank", title: "Gas tank", body: "Most common" },
  { id: "electric_tank", title: "Electric tank", body: "No gas line" },
  { id: "tankless", title: "Tankless", body: "Wall-mounted" },
  { id: "heat_pump", title: "Heat pump", body: "Fan on top" },
];

export function TypeStep({
  value,
  onChange,
  onSkip,
  canContinue,
  busy,
  onContinue,
}: {
  value?: string;
  onChange: (id: string) => void;
  onSkip: () => void;
  canContinue: boolean;
  busy: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col">
      <StepHeading title="What do you have now?" body="Photo cards help you pick fast. Skip if you are not sure." />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:mt-8 lg:grid-cols-4 lg:gap-4">
        {OPTIONS.map((option, index) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className={`overflow-hidden rounded-2xl border-2 text-left ${selected ? "border-blue bg-tint" : "border-[#E6E8EC] bg-white"}`}
            >
              <span className="grid h-[104px] place-items-center bg-[#F4F6F8] lg:h-[132px]">
                <UnitArt kind={option.id} />
              </span>
              <span className="flex items-start justify-between gap-2 px-3 pb-3 pt-3 lg:block lg:text-center">
                <span className="block">
                  <span className="block text-[15px] font-medium">{option.title}</span>
                  <span className="mt-0.5 block text-[13px] text-slate">{option.body}</span>
                </span>
                <span className="lg:mt-3 lg:inline-flex lg:justify-center">
                  <ChoiceBadge n={index + 1} selected={selected} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <button type="button" className="mt-4 text-left text-sm font-medium text-blue lg:text-center" onClick={onSkip}>
        Not sure? Skip it. Your photos will tell us.
      </button>
      {value === "unknown" ? <p className="mt-2 text-sm text-slate lg:text-center">Skipped. Your photos will tell us.</p> : null}
      <StepActions label="Continue" hint="Press 1 to 4, or S to skip" disabled={!canContinue} onClick={onContinue} busyLabel={busy ? "Saving..." : undefined} />
    </div>
  );
}
