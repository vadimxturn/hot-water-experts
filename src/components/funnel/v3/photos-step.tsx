"use client";

import { useRef, type ChangeEvent } from "react";
import { photoSlots } from "@/config/business";
import { samplePlateReadout } from "@/lib/funnel/model";
import type { FunnelPhoto } from "@/lib/funnel/model";
import { PrimaryButton } from "./actions";
import { StepHeading } from "./shell";

const LABELS: Record<string, string> = {
  data_plate: "Data plate (label)",
  whole_unit: "Whole unit, top to bottom",
  vent: "Top: vent and pipes",
  gas: "Gas and shutoff valves",
  water: "Water connections",
};

export function PhotosStep({
  photos,
  onAdd,
  onRemove,
  onContinue,
}: {
  photos: FunnelPhoto[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (slot: string) => void;
  onContinue: () => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const next = photos.length;
  const full = next >= photoSlots.length;
  const label = full ? "Continue" : `Take photo ${next + 1} of 5`;

  function take() {
    if (full) onContinue();
    else cameraRef.current?.click();
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) onAdd(event.target.files);
    event.target.value = "";
  }

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col lg:rounded-[28px] lg:border lg:border-[#E6E8EC] lg:px-10 lg:py-10 lg:shadow-[0_10px_40px_rgba(16,24,40,0.06)]">
      <StepHeading title="Snap 5 quick photos." body="We read the data plate and setup for you." />
      <ul className="mt-6 space-y-2.5">
        {photoSlots.map((slot, index) => {
          const done = photos.some((photo) => photo.slot === slot.id);
          const current = !done && index === next;
          return (
            <li key={slot.id}>
              <button
                type="button"
                onClick={() => (done ? onRemove(slot.id) : cameraRef.current?.click())}
                className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left ${current ? "border-blue bg-tint" : "border-[#E6E8EC] bg-white"}`}
                aria-label={done ? `Remove ${LABELS[slot.id] || slot.label}` : LABELS[slot.id] || slot.label}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`h-4 w-4 rounded-full ${done ? "bg-success" : current ? "bg-blue" : "border border-[#C5CAD3]"}`}
                  />
                  <span className="text-[15px]">{LABELS[slot.id] || slot.label}</span>
                </span>
                <span className={`text-sm ${done ? "text-success" : "text-slate"}`}>{done ? "Done" : index + 1}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {photos.length > 0 ? (
        <p className="mt-3 rounded-xl bg-[#F4F6F8] px-4 py-3 text-sm text-slate">
          <span className="lg:hidden">
            Sample readout: {samplePlateReadout.fuel} · {samplePlateReadout.size} · {samplePlateReadout.year}
          </span>
          <span className="hidden lg:inline">
            Read from your data plate: {samplePlateReadout.fuel} · {samplePlateReadout.size} · {samplePlateReadout.year} · Sample. Human verifies in back office.
          </span>
        </p>
      ) : null}
      <input ref={cameraRef} type="file" accept="image/jpeg,image/png" capture="environment" className="sr-only" onChange={onPick} />
      <input ref={libraryRef} type="file" accept="image/jpeg,image/png" multiple className="sr-only" onChange={onPick} />
      <div className="mt-6 hidden items-center justify-center gap-4 lg:flex">
        <PrimaryButton onClick={take}>{label}</PrimaryButton>
        <button type="button" className="text-sm font-medium text-blue" onClick={() => libraryRef.current?.click()}>
          Or upload from your library
        </button>
        <span className="key-hint text-sm text-slate">Press Enter to continue</span>
      </div>
      <div className="fixed inset-x-0 bottom-0 bg-white px-5 pt-2 pb-3 lg:hidden">
        <PrimaryButton wide onClick={take}>{label}</PrimaryButton>
        <button type="button" className="mt-2 w-full text-center text-sm font-medium text-blue" onClick={() => libraryRef.current?.click()}>
          Or upload from your library
        </button>
        {!full ? (
          <button type="button" className="touch-only mt-1 w-full text-center text-sm text-blue" onClick={onContinue}>
            Continue with {photos.length} of 5
          </button>
        ) : null}
      </div>
    </div>
  );
}
