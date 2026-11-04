import Link from "next/link";
import { Pill, jobStatusLabel, jobTone } from "@/components/admin/ui";
import { formatDate, money } from "@/lib/format";
import { jobBundle } from "@/lib/queries";
import { getDb } from "@/lib/store";

export const metadata = { title: "Jobs" };

export default async function JobsPage() {
  const db = await getDb();
  const jobs = [...db.jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <h1 className="font-sans text-xl font-semibold">Jobs</h1>
      <p className="mb-4 text-sm text-[#71717a]">Every sample job in the office. Open one for the permit, texts, and price.</p>
      <div className="overflow-hidden rounded-[10px] border border-[#e9e9ec] bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#f4f4f5] text-xs text-[#71717a]">
            <tr>
              <th className="px-3 py-2 font-medium">Customer</th>
              <th className="px-3 py-2 font-medium">City</th>
              <th className="px-3 py-2 font-medium">Stage</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const bundle = jobBundle(db, job);
              return (
                <tr key={job.id} className="border-t border-[#f0f0f2] hover:bg-[#fafafa]">
                  <td className="px-3 py-2">
                    <Link href={`/admin/jobs/${job.id}`} className="font-medium">{bundle.customer.name}</Link>
                    <span className="num block text-[11px] text-[#71717a]">{job.id}</span>
                  </td>
                  <td className="px-3 py-2">{bundle.property.city}</td>
                  <td className="px-3 py-2"><Pill tone={jobTone(job)}>{jobStatusLabel(job)}</Pill></td>
                  <td className="px-3 py-2">{job.scheduledDate ? formatDate(job.scheduledDate) : "Not set"}</td>
                  <td className="num px-3 py-2 text-right">{money(job.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
