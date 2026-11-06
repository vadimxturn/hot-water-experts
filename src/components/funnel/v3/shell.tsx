"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand";

const STEPS = [
  { id: 1, desktop: "ZIP", phone: "ZIP" },
  { id: 2, desktop: "Situation", phone: "Sit." },
  { id: 3, desktop: "Type", phone: "Type" },
  { id: 4, desktop: "Photos", phone: "Photos" },
  { id: 5, desktop: "Price", phone: "Price" },
  { id: 6, desktop: "Deposit", phone: "Dep." },
  { id: 7, desktop: "Booked", phone: "Done" },
] as const;

export function FunnelShell({
  step,
  onStep,
  tip,
  tipIsKeys = false,
  dock = true,
  children,
}: {
  step: number;
  onStep?: (step: number) => void;
  tip?: string;
  tipIsKeys?: boolean;
  dock?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-white text-ink" data-funnel-step={step}>
      <header className="mx-auto w-full max-w-[1440px] px-5 pt-4 lg:px-12 lg:pt-9">
        <div className="flex items-center justify-between lg:grid lg:grid-cols-[160px_1fr_72px] lg:items-center">
          <Link href="/" className="lg:justify-self-start">
            <Logo className="h-6 w-auto lg:h-[30px]" />
          </Link>
          <nav aria-label="Estimate progress" className="hidden lg:flex lg:justify-center">
            <ol className="flex items-center gap-2.5">
              {STEPS.map((item) => (
                <li key={item.id}>
                  <StepDot item={item} step={step} onStep={onStep} variant="desktop" />
                </li>
              ))}
            </ol>
          </nav>
          <p className="text-sm text-slate lg:justify-self-end">
            {step} of 7
          </p>
        </div>
        <ol className="mt-3 grid grid-cols-7 gap-1 lg:hidden">
          {STEPS.map((item) => (
            <li key={item.id}>
              <StepDot item={item} step={step} onStep={onStep} variant="phone" />
            </li>
          ))}
        </ol>
      </header>
      <main className={`mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 pt-6 lg:px-12 lg:pt-8 ${dock ? "pb-36 lg:pb-6" : "pb-10"}`}>
        {children}
      </main>
      {tip ? (
        <p className={`px-5 pb-6 text-center text-[13px] text-slate ${tipIsKeys ? "key-hint-block" : "hidden lg:block"}`}>
          {tip}
        </p>
      ) : null}
    </div>
  );
}

function StepDot({
  item,
  step,
  onStep,
  variant,
}: {
  item: (typeof STEPS)[number];
  step: number;
  onStep?: (step: number) => void;
  variant: "desktop" | "phone";
}) {
  const current = item.id === step;
  const done = item.id < step;
  const label = variant === "desktop" ? item.desktop : item.phone;
  const clickable = Boolean(onStep && done);
  const text = current ? "text-blue" : done ? "text-ink" : "text-slate";

  if (variant === "phone") {
    const inner = (
      <>
        <span className={`block h-[3px] rounded-full ${item.id <= step ? "bg-blue" : "bg-[#E6E8EC]"}`} />
        <span className={`mt-1 block text-center text-[10px] ${current ? "text-blue" : "text-slate"}`}>{label}</span>
      </>
    );
    if (!clickable) return <div aria-current={current ? "step" : undefined}>{inner}</div>;
    return (
      <button type="button" className="w-full" aria-current={current ? "step" : undefined} onClick={() => onStep?.(item.id)}>
        {inner}
      </button>
    );
  }

  const inner = (
    <span className={`inline-flex items-center gap-1.5 text-[13px] ${text}`}>
      <span className={`h-2 w-2 rounded-full ${current || done ? "bg-blue" : "bg-[#D5D8DE]"}`} />
      {label}
    </span>
  );
  if (!clickable) return <span aria-current={current ? "step" : undefined}>{inner}</span>;
  return (
    <button type="button" aria-current={current ? "step" : undefined} onClick={() => onStep?.(item.id)}>
      {inner}
    </button>
  );
}

export function StepHeading({ title, body }: { title: string; body?: string }) {
  return (
    <header className="lg:text-center">
      <h1 className="text-[28px] leading-8 lg:text-[44px] lg:leading-[52px]">{title}</h1>
      {body ? <p className="mt-2 text-[15px] leading-6 text-slate lg:text-[17px]">{body}</p> : null}
    </header>
  );
}

export function ChoiceBadge({ n, selected }: { n: number; selected: boolean }) {
  return (
    <span className={`grid h-7 w-7 place-items-center rounded-md text-sm font-medium ${selected ? "bg-blue text-white" : "bg-[#F3F4F6] text-slate"}`}>
      {n}
    </span>
  );
}
