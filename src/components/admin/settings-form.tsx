"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Jurisdiction, PricePackage, Settings, Tech } from "@/lib/types";
import { saveSettingsAction, resetDemoAction, toggleTechAction } from "@/server/actions";

const tabs = ["Jurisdictions", "Technicians", "Buffers and booking", "Service areas", "Text settings", "Price book"] as const;

export function SettingsForm({
  settings,
  jurisdictions,
  techs,
}: {
  settings: Settings;
  jurisdictions: Jurisdiction[];
  techs: Tech[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof tabs)[number]>("Buffers and booking");
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState("");

  async function save() {
    await saveSettingsAction({
      priceConfirmedOnSite: draft.priceConfirmedOnSite,
      minLeadDays: Number(draft.minLeadDays),
      noSameWeek: draft.noSameWeek,
      sameWeekMode: draft.sameWeekMode,
      offerWeekStart: Number(draft.offerWeekStart),
      offerWeekEnd: Number(draft.offerWeekEnd),
      maxInstallsPerTech: Number(draft.maxInstallsPerTech),
      bufferMin: Number(draft.bufferMin),
      addDriveTime: draft.addDriveTime,
      inspectionMeetSlot: draft.inspectionMeetSlot,
      saturday: draft.saturday,
      sunday: draft.sunday,
      quietStart: draft.quietStart,
      quietEnd: draft.quietEnd,
      priceBook: draft.priceBook,
      showSampleChip: draft.showSampleChip,
      demoToday: draft.demoToday,
    });
    setSaved("Saved. The public estimate uses this price book and the price policy.");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          {tabs.map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`border-b-2 px-2 py-1 ${tab === item ? "border-ink" : "border-transparent text-[#71717a]"}`}>{item}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" className="office-btn office-btn-secondary" onClick={() => setDraft(settings)}>Discard</button>
          <button type="button" className="office-btn office-btn-primary" onClick={() => void save()}>Save changes</button>
        </div>
      </div>
      {saved && <p className="mb-3 text-sm text-success">{saved}</p>}

      {tab === "Buffers and booking" && (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-[10px] border border-[#e9e9ec] bg-white p-5 text-sm">
            <h2 className="font-semibold">Booking window</h2>
            <label className="mt-4 flex items-center justify-between">Minimum lead time
              <input type="number" min={1} max={60} value={draft.minLeadDays} onChange={(event) => setDraft({ ...draft, minLeadDays: Number(event.target.value) })} className="h-8 w-20 rounded-md border border-[#e4e4e7] px-2" />
            </label>
            <p className="text-xs text-[#71717a]">Earliest bookable date is the office date plus this many days.</p>
            <label className="mt-4 flex items-center justify-between">No same-week booking
              <input type="checkbox" checked={draft.noSameWeek} onChange={(event) => setDraft({ ...draft, noSameWeek: event.target.checked })} />
            </label>
            <div className="mt-2 text-xs text-[#71717a]">
              <label className="mr-3"><input type="radio" checked={draft.sameWeekMode === "next_7"} onChange={() => setDraft({ ...draft, sameWeekMode: "next_7" })} /> Next 7 days</label>
              <label><input type="radio" checked={draft.sameWeekMode === "calendar_week"} onChange={() => setDraft({ ...draft, sameWeekMode: "calendar_week" })} /> Rest of the calendar week</label>
            </div>
            <p className="mt-1 text-xs text-amber-800">How &quot;same week&quot; is counted is still an open decision. The research flag is not confirmed.</p>
            <label className="mt-4 flex items-center justify-between">Offer window start (weeks)
              <input type="number" value={draft.offerWeekStart} onChange={(event) => setDraft({ ...draft, offerWeekStart: Number(event.target.value) })} className="h-8 w-20 rounded-md border px-2" />
            </label>
            <label className="mt-2 flex items-center justify-between">Offer window end (weeks)
              <input type="number" value={draft.offerWeekEnd} onChange={(event) => setDraft({ ...draft, offerWeekEnd: Number(event.target.value) })} className="h-8 w-20 rounded-md border px-2" />
            </label>
            <label className="mt-4 flex items-center justify-between">Max installs per tech per day
              <input type="number" min={1} max={6} value={draft.maxInstallsPerTech} onChange={(event) => setDraft({ ...draft, maxInstallsPerTech: Number(event.target.value) })} className="h-8 w-20 rounded-md border px-2" />
            </label>
            <label className="mt-4 flex items-center justify-between">Buffer between installs (minutes)
              <input type="number" min={0} max={180} value={draft.bufferMin} onChange={(event) => setDraft({ ...draft, bufferMin: Number(event.target.value) })} className="h-8 w-20 rounded-md border px-2" />
            </label>
            <label className="mt-3 flex items-center justify-between">Add drive time <input type="checkbox" checked={draft.addDriveTime} onChange={(event) => setDraft({ ...draft, addDriveTime: event.target.checked })} /></label>
            <label className="mt-2 flex items-center justify-between">Inspection-meet slot <input type="checkbox" checked={draft.inspectionMeetSlot} onChange={(event) => setDraft({ ...draft, inspectionMeetSlot: event.target.checked })} /></label>
            <label className="mt-4 block text-xs text-[#71717a]">Sample office date
              <input value={draft.demoToday} onChange={(event) => setDraft({ ...draft, demoToday: event.target.value })} className="mt-1 h-8 w-full rounded-md border px-2 text-sm" />
            </label>
            <p className="mt-1 text-xs text-[#71717a]">Leave the date as 2026-10-19 to match the sample board. Clear it and save to use the real date. That control is stored as demoToday.</p>
          </section>
          <section className="rounded-[10px] border border-[#e9e9ec] bg-white p-5 text-sm">
            <h2 className="font-semibold">Price policy</h2>
            <label className="mt-3 flex items-start gap-2">
              <input type="checkbox" checked={draft.priceConfirmedOnSite} onChange={(event) => setDraft({ ...draft, priceConfirmedOnSite: event.target.checked })} />
              <span>Confirm the price on site before work starts. Leave this off to use a set price for the quoted scope. The public site and funnel follow this switch.</span>
            </label>
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={draft.showSampleChip} onChange={(event) => setDraft({ ...draft, showSampleChip: event.target.checked })} />
              Show the sample-data chip on tracking pages
            </label>
          </section>
        </div>
      )}

      {tab === "Jurisdictions" && (
        <ul className="divide-y divide-[#f0f0f2] rounded-[10px] border border-[#e9e9ec] bg-white">
          {jurisdictions.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-xs text-[#71717a]">{row.platform} · {row.portal}</p>
              </div>
              <span className="text-xs text-[#71717a]">{row.fee}</span>
            </li>
          ))}
        </ul>
      )}

      {tab === "Technicians" && (
        <ul className="divide-y divide-[#f0f0f2] rounded-[10px] border border-[#e9e9ec] bg-white">
          {techs.map((tech) => (
            <li key={tech.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{tech.name}</p>
                <p className="text-xs text-[#71717a]">{tech.skills.join(", ")} · {tech.days}</p>
              </div>
              <button type="button" className="text-xs text-blue" onClick={async () => { await toggleTechAction(tech.id, !tech.active); router.refresh(); }}>
                {tech.active ? "Active" : "Off"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {tab === "Service areas" && (
        <section className="rounded-[10px] border border-[#e9e9ec] bg-white p-5 text-sm">
          <p>The ZIP list is a placeholder in <span className="num">src/config/service-area.ts</span>. Designs assume Sacramento, Sacramento County, Elk Grove, Folsom, Roseville, Rocklin, Citrus Heights, and Placer County.</p>
          <p className="mt-2 text-[#71717a]">A 956, 957, or 958 ZIP that is not listed is treated as likely in area, and the office confirms the permit desk. Other ZIPs are saved as outside the placeholder area.</p>
        </section>
      )}

      {tab === "Text settings" && (
        <section className="rounded-[10px] border border-[#e9e9ec] bg-white p-5 text-sm">
          <label className="flex items-center justify-between">Quiet hours start
            <input value={draft.quietStart} onChange={(event) => setDraft({ ...draft, quietStart: event.target.value })} className="h-8 rounded-md border px-2" />
          </label>
          <label className="mt-3 flex items-center justify-between">Quiet hours end
            <input value={draft.quietEnd} onChange={(event) => setDraft({ ...draft, quietEnd: event.target.value })} className="h-8 rounded-md border px-2" />
          </label>
          <p className="mt-3 text-xs text-[#71717a]">Research example is 8 AM to 8 PM. ETA texts on install day are an open question. Twilio sends only when its keys are set. Otherwise the text is stored on the job.</p>
          <p className="mt-2 text-xs text-[#71717a]">Saturday booking <input type="checkbox" checked={draft.saturday} onChange={(event) => setDraft({ ...draft, saturday: event.target.checked })} className="ml-2" /></p>
          <p className="mt-2 text-xs text-[#71717a]">Sunday booking <input type="checkbox" checked={draft.sunday} onChange={(event) => setDraft({ ...draft, sunday: event.target.checked })} className="ml-2" /></p>
        </section>
      )}

      {tab === "Price book" && (
        <div className="overflow-x-auto rounded-[10px] border border-[#e9e9ec] bg-white">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="bg-[#f7f7f8] text-xs text-[#71717a]">
              <tr>
                <th className="px-3 py-2">Package</th>
                <th className="px-3 py-2">Good base / high</th>
                <th className="px-3 py-2">Better base / high</th>
                <th className="px-3 py-2">Best base / high</th>
              </tr>
            </thead>
            <tbody>
              {draft.priceBook.map((row, index) => (
                <tr key={row.key} className="border-t border-[#f4f4f5]">
                  <td className="px-3 py-2">{row.label}</td>
                  <td className="px-3 py-2">{row.fromOnly ? <FromEditor row={row} index={index} draft={draft} setDraft={setDraft} /> : <TierEditor row={row} index={index} tier="good" draft={draft} setDraft={setDraft} />}</td>
                  <td className="px-3 py-2">{row.better ? <TierEditor row={row} index={index} tier="better" draft={draft} setDraft={setDraft} /> : <span className="text-[#a1a1aa]">n/a</span>}</td>
                  <td className="px-3 py-2">{row.best ? <TierEditor row={row} index={index} tier="best" draft={draft} setDraft={setDraft} /> : <span className="text-[#a1a1aa]">n/a</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-2 text-xs text-[#71717a]">All prices are estimates until the real book is confirmed. Saving here changes the public landing ranges and the funnel.</p>
        </div>
      )}

      <form action={resetDemoAction} className="mt-6">
        <button type="submit" className="text-xs text-danger">Reset sample data</button>
      </form>
    </div>
  );
}

function TierEditor({
  row,
  index,
  tier,
  draft,
  setDraft,
}: {
  row: PricePackage;
  index: number;
  tier: "good" | "better" | "best";
  draft: Settings;
  setDraft: (value: Settings) => void;
}) {
  const value = row[tier];
  if (!value) return null;
  function update(field: "base" | "high", amount: number) {
    const book = draft.priceBook.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const current = item[tier];
      if (!current) return item;
      return { ...item, [tier]: { ...current, [field]: amount, low: field === "base" ? amount : current.low } };
    });
    setDraft({ ...draft, priceBook: book });
  }
  return (
    <span className="flex gap-1">
      <input aria-label={`${row.label} ${tier} base`} value={value.base} onChange={(event) => update("base", Number(event.target.value))} className="h-8 w-20 rounded-md border px-1" />
      <input aria-label={`${row.label} ${tier} high`} value={value.high} onChange={(event) => update("high", Number(event.target.value))} className="h-8 w-20 rounded-md border px-1" />
    </span>
  );
}

function FromEditor({
  row,
  index,
  draft,
  setDraft,
}: {
  row: PricePackage;
  index: number;
  draft: Settings;
  setDraft: (value: Settings) => void;
}) {
  if (!row.fromOnly) return null;
  return (
    <span className="flex gap-1">
      <input aria-label={`${row.label} from`} value={row.fromOnly.amount} onChange={(event) => {
        const book = draft.priceBook.map((item, itemIndex) => itemIndex === index && item.fromOnly ? { ...item, fromOnly: { ...item.fromOnly, amount: Number(event.target.value) } } : item);
        setDraft({ ...draft, priceBook: book });
      }} className="h-8 w-20 rounded-md border px-1" />
      <input aria-label={`${row.label} high`} value={row.fromOnly.high} onChange={(event) => {
        const book = draft.priceBook.map((item, itemIndex) => itemIndex === index && item.fromOnly ? { ...item, fromOnly: { ...item.fromOnly, high: Number(event.target.value) } } : item);
        setDraft({ ...draft, priceBook: book });
      }} className="h-8 w-20 rounded-md border px-1" />
    </span>
  );
}
