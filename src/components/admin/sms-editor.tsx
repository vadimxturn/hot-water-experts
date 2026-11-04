"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { renderTemplate } from "@/lib/templates";
import type { SmsTemplate } from "@/lib/types";
import { saveTemplateAction } from "@/server/actions";

const sample = {
  tech_first: "Tech A",
  eta_time: "8:52 AM",
  window: "8-10 AM",
  date: "Oct 28",
  day: "Wednesday",
  street: "410 Sample Way",
  link: "/t/sample-on-the-way",
  office_phone: "[Phone pending]",
  city: "Folsom",
  permit_no: "FOL-S-0000",
  unit_short: "50 gal gas tank",
  insp_date: "Oct 22",
  insp_window: "8-12 AM",
};

export function SmsEditor({ templates }: { templates: SmsTemplate[] }) {
  const router = useRouter();
  const [key, setKey] = useState(templates.find((row) => row.key === "eta_10")?.key || templates[0]?.key);
  const current = templates.find((row) => row.key === key) || templates[0];
  const [body, setBody] = useState(current?.body || "");
  const [enabled, setEnabled] = useState(current?.enabled ?? true);
  const [note, setNote] = useState("");
  const groups = useMemo(() => {
    const map = new Map<string, SmsTemplate[]>();
    for (const template of templates) {
      map.set(template.group, [...(map.get(template.group) || []), template]);
    }
    return [...map.entries()];
  }, [templates]);
  const preview = renderTemplate(body, sample);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr_280px]">
      <section className="rounded-[10px] border border-[#e9e9ec] bg-white">
        <p className="border-b border-[#f0f0f2] px-3 py-2 text-xs text-[#71717a]">{templates.length} templates · {templates.filter((row) => row.enabled).length} on · {templates.filter((row) => !row.enabled).length} paused</p>
        {groups.map(([group, rows]) => (
          <div key={group}>
            <p className="px-3 pt-3 text-[11px] text-[#71717a]">{group}</p>
            {rows.map((row) => (
              <button key={row.key} type="button" onClick={() => { setKey(row.key); setBody(row.body); setEnabled(row.enabled); }} className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${row.key === key ? "bg-tint" : ""}`}>
                <span>
                  <span className="block">{row.name}</span>
                  <span className="num text-[11px] text-[#71717a]">{row.key}</span>
                </span>
                <span className={`h-2 w-2 rounded-full ${row.enabled ? "bg-emerald-500" : "bg-zinc-300"}`} />
              </button>
            ))}
          </div>
        ))}
      </section>
      {current && (
        <section className="rounded-[10px] border border-[#e9e9ec] bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{current.name}</h2>
            <label className="text-xs">On <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="ml-1" /></label>
          </div>
          <p className="text-xs text-[#71717a]">{current.trigger}</p>
          <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={5} className="mt-3 w-full rounded-md border border-[#e4e4e7] p-2 text-sm" />
          <p className="mt-1 text-xs text-[#71717a]">{body.length} characters</p>
          <button
            type="button"
            className="office-btn office-btn-primary mt-3"
            onClick={async () => {
              await saveTemplateAction(current.key, body, enabled);
              setNote(enabled ? "Saved. A test send is stored, not texted, until Twilio is connected." : "Paused.");
              router.refresh();
            }}
          >
            Save
          </button>
          {note && <p className="mt-2 text-xs text-[#71717a]">{note}</p>}
        </section>
      )}
      <section className="rounded-[28px] border border-[#e9e9ec] bg-white p-4">
        <p className="text-center text-xs text-[#71717a]">Phone preview · sample values</p>
        <div className="mt-3 rounded-2xl bg-[#f4f4f5] p-3 text-sm">{preview}</div>
      </section>
    </div>
  );
}
