"use client";

import { FunnelIcon, type IconName } from "./art";
import { StepActions } from "./actions";
import { ChoiceBadge, StepHeading } from "./shell";

const OPTIONS: { id: string; title: string; body: string; short: string; icon: IconName }[] = [
  { id: "no_hot_water", title: "No hot water", body: "Need it fixed fast", short: "Need it fixed fast", icon: "droplet" },
  { id: "leaking", title: "Leaking", body: "Water around the tank", short: "Water around tank", icon: "leak" },
  { id: "getting_old", title: "Getting old", body: "Planning ahead", short: "Planning ahead", icon: "clock" },
  { id: "upgrading", title: "Upgrading", body: "Tankless or heat pump", short: "Tankless or HP", icon: "up" },
];

export function SituationStep({
  value,
  onChange,
  canContinue,
  busy,
  onContinue,
}: {
  value?: string;
  onChange: (id: string) => void;
  canContinue: boolean;
  busy: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-1 flex-col">
      <StepHeading title="What's going on?" body="Pick the closest match." />
      <div className="mt-6 grid grid-cols-2 gap-3 lg:mt-8 lg:grid-cols-4 lg:gap-4">
        {OPTIONS.map((option, index) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className={`flex min-h-[168px] flex-col items-center rounded-2xl border-2 px-3 py-5 text-center lg:min-h-[220px] ${selected ? "border-blue bg-tint" : "border-[#E6E8EC] bg-white"}`}
            >
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${selected ? "bg-white" : "bg-tint"}`}>
                <FunnelIcon name={option.icon} />
              </span>
              <span className="mt-4 text-[15px] font-medium">{option.title}</span>
              <span className="mt-1 text-[13px] leading-5 text-slate">
                <span className="lg:hidden">{option.short}</span>
                <span className="hidden lg:inline">{option.body}</span>
              </span>
              <span className="mt-auto pt-4">
                <ChoiceBadge n={index + 1} selected={selected} />
              </span>
            </button>
          );
        })}
      </div>
      <StepActions label="Continue" hint="Press 1 to 4, then Enter" disabled={!canContinue} onClick={onContinue} busyLabel={busy ? "Saving..." : undefined} />
    </div>
  );
}
