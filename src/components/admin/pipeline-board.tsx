"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Job, JobStage, Lead } from "@/lib/types";
import { moveJobAction, setSideAction } from "@/server/actions";
import { Pill } from "./ui";

const columns: { key: string; label: string; stage?: JobStage }[] = [
  { key: "lead", label: "Lead" },
  { key: "quoted", label: "Quoted" },
  { key: "scheduled", label: "Scheduled", stage: "scheduled" },
  { key: "permit", label: "Permit", stage: "permit" },
  { key: "installed", label: "Installed", stage: "installed" },
  { key: "inspected", label: "Inspected / Closed", stage: "inspected" },
];

export function PipelineBoard({
  leads,
  jobs,
}: {
  leads: { id: string; name: string; status: Lead["status"]; summary: string; city: string; urgent?: boolean }[];
  jobs: {
    id: string;
    stage: JobStage;
    summary: string;
    subStatus: string;
    side: Job["side"];
    city: string;
    name: string;
    tech?: string;
    date?: string;
  }[];
}) {
  const router = useRouter();
  const [city, setCity] = useState("Any");
  const [tech, setTech] = useState("Any");
  const cities = ["Any", ...Array.from(new Set([...leads.map((row) => row.city), ...jobs.map((row) => row.city)])).filter(Boolean)];
  const techs = ["Any", ...Array.from(new Set(jobs.map((row) => row.tech).filter(Boolean) as string[]))];
  const filteredJobs = useMemo(
    () => jobs.filter((job) => (city === "Any" || job.city === city) && (tech === "Any" || job.tech === tech)),
    [jobs, city, tech],
  );

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <select value={tech} onChange={(event) => setTech(event.target.value)} className="h-8 rounded-md border border-[#e4e4e7] bg-white px-2 text-sm" aria-label="Tech">
          {techs.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={city} onChange={(event) => setCity(event.target.value)} className="h-8 rounded-md border border-[#e4e4e7] bg-white px-2 text-sm" aria-label="City">
          {cities.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      <div className="grid gap-3 xl:grid-cols-6">
        {columns.map((column) => {
          const cards = column.stage
            ? filteredJobs.filter((job) => job.stage === column.stage)
            : leads.filter((lead) => (column.key === "lead" ? lead.status === "new" || lead.status === "contacted" : lead.status === "quoted") && (city === "Any" || lead.city === city));
          return (
            <div
              key={column.key}
              className="min-h-64 rounded-[10px] bg-[#f4f4f5] p-2"
              onDragOver={(event) => event.preventDefault()}
              onDrop={async (event) => {
                const jobId = event.dataTransfer.getData("text/job");
                if (!jobId || !column.stage) return;
                await moveJobAction(jobId, column.stage);
                router.refresh();
              }}
            >
              <p className="px-1 text-sm font-medium">{column.label} <span className="text-[#71717a]">{cards.length}</span></p>
              <ul className="mt-2 space-y-2">
                {cards.slice(0, 4).map((card) => (
                  <li key={card.id}>
                    {"stage" in card ? (
                      <article draggable onDragStart={(event) => event.dataTransfer.setData("text/job", card.id)} className="cursor-grab rounded-[10px] border border-[#e9e9ec] bg-white p-3">
                        <Link href={`/admin/jobs/${card.id}`} className="text-sm font-medium">{card.name}</Link>
                        <p className="text-[11px] text-[#71717a]">{card.id}</p>
                        <p className="mt-1 text-xs">{card.summary}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-[11px] text-[#71717a]">{card.tech} {card.date}</span>
                          <Pill tone={card.side === "correction" ? "danger" : "accent"}>{card.subStatus}</Pill>
                        </div>
                        <div className="mt-2 flex gap-1">
                          {(["none", "on_hold", "cancelled", "correction"] as const).map((side) => (
                            <button key={side} type="button" className="text-[10px] text-[#71717a] underline" onClick={async () => { await setSideAction(card.id, side); router.refresh(); }}>
                              {side === "none" ? "Clear tag" : side.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      </article>
                    ) : (
                      <Link href="/admin/leads" className="block rounded-[10px] border border-[#e9e9ec] bg-white p-3">
                        <span className="text-sm font-medium">{card.name}</span>
                        <span className="mt-1 block text-xs text-[#71717a]">{card.summary}</span>
                        {card.urgent && <span className="mt-1 block text-[11px] text-danger">Urgent</span>}
                      </Link>
                    )}
                  </li>
                ))}
                {cards.length > 4 && <li className="px-1 text-xs text-[#71717a]">+ {cards.length - 4} more</li>}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-[#71717a]">Drag a job card to move its stage. Lead and Quoted stay in GoHighLevel until someone books. Side tags: On hold, Cancelled, Correction.</p>
    </div>
  );
}
