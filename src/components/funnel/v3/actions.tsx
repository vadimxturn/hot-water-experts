"use client";

import type { ReactNode } from "react";

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
  wide = false,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  wide?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      data-funnel-primary
      className={`btn-pill btn-pill-blue h-[52px] px-7 text-[15px] disabled:cursor-not-allowed disabled:bg-[#c5ccd6] ${wide ? "w-full" : ""}`}
    >
      {children}
    </button>
  );
}

export function StepActions({
  label,
  hint,
  disabled,
  onClick,
  type = "button",
  busyLabel,
}: {
  label: string;
  hint?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  busyLabel?: string;
}) {
  const text = busyLabel || label;
  return (
    <>
      <div className="mt-8 hidden items-center justify-center gap-3 lg:flex">
        <PrimaryButton type={type} disabled={disabled} onClick={onClick}>
          {text}
        </PrimaryButton>
        {hint ? <span className="key-hint text-sm text-slate">{hint}</span> : null}
      </div>
      <div className="fixed inset-x-0 bottom-0 bg-white px-5 pt-2 pb-3 lg:hidden">
        <PrimaryButton wide type={type} disabled={disabled} onClick={onClick}>
          {text}
        </PrimaryButton>
        {hint ? <p className="key-hint-block mt-1 text-center text-xs text-slate">{hint}</p> : null}
      </div>
    </>
  );
}
