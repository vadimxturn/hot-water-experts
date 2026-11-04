import Link from "next/link";
import { SampleChip } from "@/components/admin/ui";
import { addDays, formatDate, weekdayShort } from "@/lib/format";
import { isClosed, techLoad } from "@/lib/availability";
import { jobBundle, officeToday } from "@/lib/queries";
import { getDb } from "@/lib/store";

export const metadata = { title: "Dispatch calendar" };

export default async function CalendarPage() {
  const db = await getDb();
  const start = "2026-10-18";
  const days = Array.from({ length: 56 }, (_, index) => addDays(start, index));
  const unassigned = db.jobs.filter((job) => !job.techId && job.stage === "scheduled");
  const today = officeToday(db);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-sans text-xl font-semibold">Dispatch calendar</h1>
          <p className="text-sm text-[#71717a]">Oct 18 to Dec 12, 2026 · sample data. Same week as {formatDate(today)} is blocked by the 7-day rule. <SampleChip /></p>
        </div>
        <Link href="/admin/day-plan" className="office-btn office-btn-secondary">Unassigned ({unassigned.length})</Link>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div className="overflow-hidden rounded-[10px] border border-[#e9e9ec] bg-white">
          <div className="grid grid-cols-7 border-b border-[#f0f0f2] text-center text-[11px] text-[#71717a]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="py-2">{day}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: 0 }).map(() => null)}
            {pad(start).map((blank) => <div key={blank} className="min-h-24 border-b border-r border-[#f4f4f5] bg-[#fafafa]" />)}
            {days.map((date) => {
              const closed = isClosed(db, date) || date < addDays(today, db.settings.minLeadDays);
              const jobs = db.jobs.filter((job) => job.scheduledDate === date && job.visitKind !== "inspection");
              return (
                <div key={date} className={`min-h-24 border-b border-r border-[#f4f4f5] p-1 ${closed ? "hatch" : ""}`}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span>{date.slice(-2)} {weekdayShort(date) === "Sun" || date.endsWith("-01") ? formatDate(date, { month: "short" }) : ""}</span>
                    <span className="text-[#a1a1aa]">{jobs.length}/6</span>
                  </div>
                  {jobs.slice(0, 2).map((job) => {
                    const bundle = jobBundle(db, job);
                    return (
                      <Link key={job.id} href={`/admin/jobs/${job.id}`} className="mt-1 block truncate rounded px-1 text-[10px]" style={{ background: bundle.tech?.soft || "#f4f4f5", borderLeft: `3px solid ${bundle.tech?.color || "#d4d4d8"}` }}>
                        {job.window?.slice(0, 4)} {bundle.property.city}
                      </Link>
                    );
                  })}
                  {jobs.length > 2 && <p className="text-[10px] text-[#71717a]">+{jobs.length - 2} more</p>}
                </div>
              );
            })}
          </div>
        </div>
        <form action={assignJobActionFromForm} className="h-fit rounded-[10px] border border-[#e9e9ec] bg-white p-4">
          <h2 className="text-sm font-semibold">Book install</h2>
          <label className="mt-3 block text-xs text-[#71717a]">Job
            <select name="jobId" className="mt-1 h-8 w-full rounded-md border border-[#e4e4e7] px-2 text-sm">
              {db.jobs.filter((job) => job.stage === "scheduled" || job.stage === "permit").map((job) => (
                <option key={job.id} value={job.id}>{job.id} {jobBundle(db, job).customer.name}</option>
              ))}
            </select>
          </label>
          <label className="mt-2 block text-xs text-[#71717a]">Date
            <input type="date" name="date" defaultValue="2026-11-11" className="mt-1 h-8 w-full rounded-md border border-[#e4e4e7] px-2 text-sm" />
          </label>
          <label className="mt-2 block text-xs text-[#71717a]">Window
            <select name="window" className="mt-1 h-8 w-full rounded-md border border-[#e4e4e7] px-2 text-sm">
              {["8-10 AM", "10 AM-12 PM", "12-2 PM", "2-4 PM"].map((window) => <option key={window}>{window}</option>)}
            </select>
          </label>
          <label className="mt-2 block text-xs text-[#71717a]">Tech
            <select name="techId" className="mt-1 h-8 w-full rounded-md border border-[#e4e4e7] px-2 text-sm">
              <option value="">Unassigned</option>
              {db.techs.map((tech) => <option key={tech.id} value={tech.id}>{tech.name} ({techLoad(db, tech.id, "2026-11-11")}/{db.settings.maxInstallsPerTech} on Nov 11)</option>)}
            </select>
          </label>
          <button className="office-btn office-btn-primary mt-4 w-full" type="submit">Book on the calendar</button>
          <p className="mt-2 text-[11px] text-[#71717a]">Buffers of {db.settings.bufferMin} min are noted on the day plan. Drive time uses Google Routes when a key is set.</p>
        </form>
      </div>
    </div>
  );
}

function pad(iso: string) {
  const day = new Date(`${iso}T12:00:00`).getDay();
  return Array.from({ length: day }, (_, index) => `pad-${index}`);
}

async function assignJobActionFromForm(formData: FormData) {
  "use server";
  const { assignJobAction } = await import("@/server/actions");
  await assignJobAction(
    String(formData.get("jobId") || ""),
    String(formData.get("date") || ""),
    String(formData.get("techId") || "") || undefined,
    String(formData.get("window") || ""),
  );
}
