import Link from "next/link";
import { SampleChip } from "@/components/admin/ui";
import { jobBundle, officeToday, todayAppointments } from "@/lib/queries";
import { getDb } from "@/lib/store";

export const metadata = { title: "Day plan" };

const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export default async function DayPlanPage() {
  const db = await getDb();
  const today = officeToday(db);
  const jobs = todayAppointments(db);
  return (
    <div>
      <h1 className="font-sans text-xl font-semibold">Day plan</h1>
      <p className="mb-4 text-sm text-[#71717a]">{today} · buffers are shown as gaps. <SampleChip /></p>
      <div className="overflow-x-auto rounded-[10px] border border-[#e9e9ec] bg-white">
        <div className="grid min-w-[860px]" style={{ gridTemplateColumns: `140px repeat(${hours.length}, 1fr)` }}>
          <div className="border-b border-[#f0f0f2] p-2 text-xs text-[#71717a]">Tech</div>
          {hours.map((hour) => <div key={hour} className="border-b border-l border-[#f0f0f2] p-2 text-[11px] text-[#71717a]">{hour > 12 ? hour - 12 : hour}{hour >= 12 ? " PM" : " AM"}</div>)}
          {db.techs.map((tech) => (
            <div key={tech.id} className="contents">
              <div className="border-b border-[#f0f0f2] p-2 text-sm">
                <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: tech.color }} />
                {tech.name}
              </div>
              {hours.map((hour) => {
                const job = jobs.find((item) => item.techId === tech.id && startHour(item.visitDate === today ? item.visitWindow : item.window) === hour);
                const bundle = job ? jobBundle(db, job) : null;
                return (
                  <div key={`${tech.id}-${hour}`} className="border-b border-l border-[#f4f4f5] p-1">
                    {job && bundle && (
                      <Link href={`/admin/jobs/${job.id}`} className="block rounded px-1 py-1 text-[11px]" style={{ background: tech.soft }}>
                        {bundle.customer.name.split(" ").slice(-1)} · {bundle.property.city}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-xs text-[#71717a]">A {db.settings.bufferMin} minute buffer sits between installs, plus drive time when Routes is connected. Capacity is {db.settings.maxInstallsPerTech} installs per tech.</p>
    </div>
  );
}

function startHour(label?: string) {
  if (!label) return -1;
  if (label.startsWith("8")) return 8;
  if (label.startsWith("9")) return 9;
  if (label.startsWith("10")) return 10;
  if (label.startsWith("12")) return 12;
  if (label.startsWith("1")) return 13;
  if (label.startsWith("2")) return 14;
  return -1;
}
