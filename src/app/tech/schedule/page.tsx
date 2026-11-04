import Link from "next/link";
import { formatLongDate } from "@/lib/format";
import { jobBundle } from "@/lib/queries";
import { techContext } from "@/lib/tech-view";

export const metadata = { title: "Schedule" };

export default async function TechSchedulePage() {
  const { db, techId } = await techContext();
  const jobs = db.jobs.filter((job) => job.techId === techId).sort((a, b) => (a.scheduledDate || "").localeCompare(b.scheduledDate || ""));
  return (
    <div className="px-4 py-4">
      <h1 className="font-sans text-2xl font-semibold">Schedule</h1>
      <ul className="mt-4 space-y-2">
        {jobs.map((job) => {
          const bundle = jobBundle(db, job);
          return (
            <li key={job.id}>
              <Link href={`/tech/jobs/${job.id}`} className="block rounded-2xl bg-white p-3">
                <span className="text-xs text-slate">{job.scheduledDate ? formatLongDate(job.scheduledDate) : "Unscheduled"} · {job.window}</span>
                <span className="block font-medium">{bundle.customer.name}</span>
                <span className="text-xs text-slate">{bundle.property.city} · {job.summary}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
