import type { ReactNode } from "react";
import type { Job } from "@/lib/types";

const tones = {
  neutral: "bg-zinc-100 text-zinc-600",
  accent: "bg-tint text-[#1d4fb8]",
  info: "bg-sky-50 text-sky-700",
  warning: "bg-amber-50 text-amber-800",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-red-50 text-red-700",
} as const;

const dots = {
  neutral: "bg-zinc-400",
  accent: "bg-blue",
  info: "bg-sky-500",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
  danger: "bg-red-500",
} as const;

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={`inline-flex h-5 items-center gap-1.5 rounded-full px-2 text-[12px] font-medium ${tones[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
      {children}
    </span>
  );
}

export function SampleChip() {
  return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">Sample data</span>;
}

export function jobTone(job: Job): keyof typeof tones {
  if (job.fieldStatus === "en_route") return "info";
  if (job.fieldStatus === "arrived" || job.fieldStatus === "installing") return "warning";
  if (job.side === "correction" || job.subStatus.toLowerCase().includes("fail")) return "danger";
  if (job.stage === "inspected" || job.subStatus === "Passed" || job.subStatus === "Issued") return "success";
  if (job.stage === "installed") return "success";
  return "accent";
}

export function jobStatusLabel(job: Job) {
  if (job.visitKind === "inspection" && job.visitDate) return "Inspection";
  if (job.fieldStatus === "en_route") return "En route";
  if (job.fieldStatus === "arrived") return "On site";
  if (job.fieldStatus === "installing") return "Installing";
  return job.subStatus;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[10px] border border-[#e9e9ec] bg-white p-5 ${className}`}>{children}</section>;
}
