import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

function icsDate(iso: string, windowLabel?: string) {
  const startHour = windowLabel?.startsWith("8") ? 8 : windowLabel?.startsWith("10") ? 10 : windowLabel?.startsWith("12") ? 12 : windowLabel?.startsWith("1-") ? 13 : windowLabel?.startsWith("2") ? 14 : 8;
  const endHour = startHour + 2;
  const stamp = iso.replaceAll("-", "");
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    start: `${stamp}T${pad(startHour)}0000`,
    end: `${stamp}T${pad(endHour)}0000`,
  };
}

export async function GET(request: Request) {
  const leadId = new URL(request.url).searchParams.get("lead");
  const db = await getDb();
  const lead = db.leads.find((row) => row.id === leadId);
  if (!lead?.installDate) {
    return new Response("Missing booking", { status: 404 });
  }
  const when = icsDate(lead.installDate, lead.window);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hot Water Experts//Estimate//EN",
    "BEGIN:VEVENT",
    `UID:${lead.id}@hotwaterexperts`,
    `DTSTAMP:${when.start}`,
    `DTSTART:${when.start}`,
    `DTEND:${when.end}`,
    "SUMMARY:Water heater install",
    `DESCRIPTION:Arrival window ${lead.window || ""}. Hot Water Experts. Deposit credited at install.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=hot-water-experts-install.ics",
    },
  });
}
