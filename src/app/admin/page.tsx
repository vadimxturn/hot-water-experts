import Link from "next/link";
import { RouteMap } from "@/components/route-map";
import { Card, Pill, SampleChip, jobStatusLabel, jobTone } from "@/components/admin/ui";
import { formatLongDate, formatDate } from "@/lib/format";
import { alerts, jobBundle, officeToday, oldPermits, pipelineCounts, todayAppointments } from "@/lib/queries";
import { getDb } from "@/lib/store";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const db = await getDb();
  const today = officeToday(db);
  const counts = pipelineCounts(db);
  const todays = todayAppointments(db);
  const installs = todays.filter((job) => job.visitKind !== "inspection" && job.scheduledDate === today);
  const alertRows = alerts(db);
  const stages = [
    ["Lead", counts.lead],
    ["Quoted", counts.quoted],
    ["Scheduled", counts.scheduled],
    ["Permit", counts.permit],
    ["Installed", counts.installed],
    ["Inspected / Closed", counts.inspected],
  ] as const;
  const max = Math.max(...stages.map(([, n]) => n), 1);

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-xl font-semibold tracking-[-0.01em]">Dashboard</h1>
          <p className="mt-1 text-sm text-[#71717a]">
            {formatLongDate(today)} · all numbers are sample data <SampleChip />
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/day-plan" className="office-btn office-btn-secondary">Today</Link>
          <a href="/api/export/today" className="office-btn office-btn-secondary">Export</a>
        </div>
      </div>

      <Card className="grid gap-0 p-0 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Jobs today", String(todays.length), `${installs.length} installs · ${todays.length - installs.length} inspection`],
          ["Open pipeline", String(counts.open), `Lead ${counts.lead} · Quoted ${counts.quoted} · Scheduled ${counts.scheduled}`],
          ["Permits waiting", String(counts.permit), `${oldPermits(db).length} over 7 days`],
          ["Inspections this week", String(db.inspections.filter((row) => row.date && row.date >= today && row.date <= "2026-10-25").length + db.inspections.filter((row) => row.result === "not_booked").length), `${db.inspections.filter((row) => row.result === "not_booked").length} not booked yet`],
        ].map(([label, value, meta], index) => (
          <div key={label} className={`p-5 ${index > 0 ? "sm:border-l sm:border-[#e9e9ec]" : ""}`}>
            <p className="text-xs text-[#71717a]">{label}</p>
            <p className="num mt-1 text-[28px] font-semibold leading-8">{value}</p>
            <p className={`mt-1 text-xs ${label === "Permits waiting" ? "text-amber-700" : "text-[#71717a]"}`}>{meta}</p>
          </div>
        ))}
      </Card>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-sans text-sm font-semibold">Today&apos;s jobs</h2>
              <p className="text-xs text-[#71717a]">{formatLongDate(today)} · office hours 7 AM to 5 PM</p>
            </div>
            <Link href="/admin/day-plan" className="text-xs text-[#71717a]">View day plan</Link>
          </div>
          <ul className="divide-y divide-[#f0f0f2]">
            {todays.map((job) => {
              const bundle = jobBundle(db, job);
              const windowLabel = job.visitDate === today ? job.visitWindow : job.window;
              return (
                <li key={job.id} className="flex items-center gap-3 py-3">
                  <span className="num w-16 text-xs text-[#71717a]">{windowLabel}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/jobs/${job.id}`} className="text-sm font-medium">{bundle.customer.name}</Link>
                    <p className="text-xs text-[#71717a]">{job.id} · {bundle.property.city} · {job.summary}</p>
                  </div>
                  <span className="grid h-7 w-7 place-items-center rounded-full text-[11px] text-white" style={{ background: bundle.tech?.color || "#a1a1aa" }}>{bundle.tech?.initials || "?"}</span>
                  <Pill tone={jobTone(job)}>{jobStatusLabel(job)}</Pill>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between px-5 pt-5">
            <div>
              <h2 className="font-sans text-sm font-semibold">Techs on the map</h2>
              <p className="text-xs text-[#71717a]">Sample positions. Live GPS starts when a tech is en route.</p>
            </div>
            <Link href="/admin/day-plan" className="text-xs text-[#71717a]">Open day plan</Link>
          </div>
          <RouteMap className="mt-3 h-56 w-full" minutes={10} homeLabel="Folsom" techLabel="Tech A" />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-sm font-semibold">Pipeline</h2>
            <Link href="/admin/pipeline" className="text-xs text-[#71717a]">Board</Link>
          </div>
          <ul className="space-y-3">
            {stages.map(([label, value]) => (
              <li key={label} className="flex items-center gap-3 text-sm">
                <span className="w-28 text-[#71717a]">{label}</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#f4f4f5]">
                  <span className="block h-full rounded-full bg-ink" style={{ width: `${(value / max) * 100}%` }} />
                </span>
                <span className="num w-6 text-right">{value}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-sans text-sm font-semibold">Alerts</h2>
          <p className="text-xs text-[#71717a]">Needs attention</p>
          <ul className="mt-3 divide-y divide-[#f0f0f2]">
            {alertRows.map((alert) => (
              <li key={alert.id}>
                <Link href={alert.href} className="block py-2">
                  <span className="text-sm">{alert.title}</span>
                  <span className="block text-xs text-[#71717a]">{alert.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-sans text-sm font-semibold">Tech availability</h2>
          <p className="text-xs text-[#71717a]">Today · installs booked / capacity</p>
          <ul className="mt-3 space-y-3">
            {db.techs.map((tech) => {
              const load = db.jobs.filter((job) => job.techId === tech.id && (job.scheduledDate === today || job.visitDate === today)).length;
              const current = db.jobs.find((job) => job.techId === tech.id && job.scheduledDate === today && (job.fieldStatus === "en_route" || job.fieldStatus === "arrived"));
              return (
                <li key={tech.id} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full text-[11px] text-white" style={{ background: tech.color }}>{tech.initials}</span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/techs/${tech.id}`} className="text-sm font-medium">{tech.name}</Link>
                    <p className="truncate text-xs text-[#71717a]">{current ? `${jobStatusLabel(current)} · ${current.id}` : "No active stop"}</p>
                  </div>
                  <span className="num text-xs">{load}/{tech.maxPerDay}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs text-[#71717a]">Next open install slot: Mon, {formatDate("2026-10-26")} (1 week out)</p>
        </Card>
      </div>
    </div>
  );
}
