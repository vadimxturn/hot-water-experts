"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime, money } from "@/lib/format";
import type { Lead } from "@/lib/types";
import { syncGhlAction } from "@/server/actions";
import { Pill } from "./ui";

export function LeadsInbox({ leads }: { leads: Lead[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | Lead["status"]>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(leads[0]?.id);
  const [note, setNote] = useState("");
  const visible = useMemo(
    () =>
      leads.filter((lead) => {
        if (filter !== "all" && lead.status !== filter) return false;
        const hay = `${lead.name} ${lead.city} ${lead.summary} ${lead.phone}`.toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      }),
    [leads, filter, query],
  );
  const lead = leads.find((row) => row.id === selected) || visible[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <section className="rounded-[10px] border border-[#e9e9ec] bg-white">
        <div className="border-b border-[#e9e9ec] p-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search leads..." className="h-8 w-full rounded-md border border-[#e4e4e7] px-2 text-sm" />
          <div className="mt-2 flex flex-wrap gap-1 text-xs">
            {(["all", "new", "contacted", "quoted"] as const).map((key) => (
              <button key={key} type="button" onClick={() => setFilter(key)} className={`rounded-full px-2 py-1 ${filter === key ? "bg-tint text-blue-deep" : "text-[#71717a]"}`}>
                {key === "all" ? `All ${leads.length}` : `${key} ${leads.filter((row) => row.status === key).length}`}
              </button>
            ))}
          </div>
        </div>
        <ul className="max-h-[70vh] overflow-auto">
          {visible.map((row) => (
            <li key={row.id}>
              <button type="button" onClick={() => setSelected(row.id)} className={`w-full border-b border-[#f4f4f5] px-3 py-3 text-left ${lead?.id === row.id ? "bg-tint" : ""}`}>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{row.name || "New lead"}</span>
                  <span className="text-[11px] text-[#71717a]">{formatDateTime(row.createdAt)}</span>
                </span>
                <span className="mt-1 block text-xs text-[#71717a]">{row.source} · {row.summary}</span>
                {row.urgent && <span className="mt-1 inline-block text-[11px] text-danger">Urgent</span>}
              </button>
            </li>
          ))}
        </ul>
      </section>
      {lead && (
        <section className="rounded-[10px] border border-[#e9e9ec] bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-sans text-lg font-semibold">{lead.name || "Unnamed lead"}</h2>
              <p className="text-xs text-[#71717a]">
                {lead.ghl?.status === "sent" ? "Synced to GoHighLevel" : "GHL sync stubbed"} · {formatDateTime(lead.createdAt)} · {lead.source}
              </p>
            </div>
            <div className="flex gap-2">
              <a className="office-btn office-btn-secondary" href={`tel:${lead.phone}`}>Call</a>
              <button
                type="button"
                className="office-btn office-btn-secondary"
                onClick={async () => {
                  const result = await syncGhlAction();
                  setNote(result.detail);
                  router.refresh();
                }}
              >
                Sync GHL now
              </button>
            </div>
          </div>
          {note && <p className="mt-2 text-xs text-[#71717a]">{note}</p>}
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="text-[#71717a]">Phone</span><br />{lead.phone || "Not yet"}</p>
            <p><span className="text-[#71717a]">Email</span><br />{lead.email || "Not yet"}</p>
            <p><span className="text-[#71717a]">Address</span><br />{lead.address || lead.city}</p>
            <p><span className="text-[#71717a]">Utility</span><br />{lead.utility || "To confirm"}</p>
          </div>
          <h3 className="mt-5 text-xs font-medium text-[#71717a]">Funnel answers</h3>
          <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <p>Situation: {lead.situation || "Not answered"}</p>
            <p>Current: {lead.currentType || "Not answered"}</p>
            <p>Wants: {lead.nextType || lead.summary}</p>
            <p>Where: {lead.location || "Not answered"}</p>
            <p>Timing: {lead.timing || "Not answered"}</p>
            <p>People: {lead.people || "Not answered"}</p>
          </div>
          {lead.readout && (
            <p className="mt-3 text-xs text-[#71717a]">
              Readout {lead.readout.sample ? "(sample, vision not connected)" : ""}: {lead.readout.fuel}, {lead.readout.size}, {lead.readout.year}
            </p>
          )}
          {lead.quoteLow && (
            <div className="mt-4 flex items-center justify-between rounded-[10px] bg-[#f7f7f8] px-4 py-3">
              <div>
                <p className="text-sm font-medium">{lead.quoteLabel || "Estimate"}</p>
                <p className="text-xs text-[#71717a]">Sample price from the funnel or the inbox seed</p>
              </div>
              <p className="num text-sm">{lead.quoteLow === lead.quoteHigh ? money(lead.quoteLow) : `${money(lead.quoteLow)} to ${money(lead.quoteHigh || lead.quoteLow)}`}</p>
            </div>
          )}
          <div className="mt-4">
            <Pill tone={lead.status === "new" ? "info" : lead.status === "quoted" ? "accent" : "neutral"}>{lead.status}</Pill>
            {lead.smsConsent ? <span className="ml-2 text-xs text-success">SMS consent on file</span> : <span className="ml-2 text-xs text-[#71717a]">No SMS consent</span>}
          </div>
          {lead.ghl && <p className="mt-3 text-xs text-[#71717a]">{lead.ghl.detail}</p>}
        </section>
      )}
    </div>
  );
}
