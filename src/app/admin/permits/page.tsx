import Link from "next/link";
import { Pill, SampleChip } from "@/components/admin/ui";
import { permitAge, jobBundle } from "@/lib/queries";
import { getDb } from "@/lib/store";

export const metadata = { title: "Permits" };

export default async function PermitsPage() {
  const db = await getDb();
  return (
    <div>
      <h1 className="font-sans text-xl font-semibold">Permits by jurisdiction</h1>
      <p className="mb-4 text-sm text-[#71717a]">
        Eight Sacramento-area offices. No portal has a public submit API, so a person still reviews and submits. <SampleChip />
      </p>
      <div className="grid gap-4">
        {db.jurisdictions.map((jurisdiction) => {
          const rows = db.permits.filter((permit) => permit.jurisdictionId === jurisdiction.id);
          return (
            <section key={jurisdiction.id} className="rounded-[10px] border border-[#e9e9ec] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0f0f2] px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold">{jurisdiction.name}</h2>
                  <p className="text-xs text-[#71717a]">{jurisdiction.platform} · {jurisdiction.fee} · {jurisdiction.cf1r ? "CF1R required" : "CF1R not required"} {jurisdiction.autoIssue ? "· Auto-issue after payment" : ""}</p>
                </div>
                <a href={jurisdiction.portalUrl} target="_blank" rel="noreferrer" className="text-xs text-blue">Open portal</a>
              </div>
              <table className="w-full text-left text-[13px]">
                <tbody>
                  {rows.length === 0 && <tr><td className="px-4 py-3 text-[#71717a]">No open sample permits.</td></tr>}
                  {rows.map((permit) => {
                    const job = db.jobs.find((row) => row.id === permit.jobId);
                    if (!job) return null;
                    const bundle = jobBundle(db, job);
                    const age = permitAge(db, job.id);
                    return (
                      <tr key={permit.id} className="border-t border-[#f4f4f5]">
                        <td className="px-4 py-2">
                          <Link href={`/admin/permits/job/${job.id}`} className="font-medium">{bundle.customer.name}</Link>
                          <span className="num block text-[11px] text-[#71717a]">{job.id}</span>
                        </td>
                        <td className="px-4 py-2"><Pill tone={age > 7 && permit.status !== "issued" ? "danger" : "accent"}>{permit.status.replaceAll("_", " ")}</Pill></td>
                        <td className="px-4 py-2 text-[#71717a]">{permit.permitNumber}</td>
                        <td className="px-4 py-2">{age} days</td>
                        <td className="px-4 py-2 text-right"><Link href={`/admin/permits/${job.id}/packet`} className="text-blue">Packet</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="px-4 py-2 text-xs text-[#71717a]">{jurisdiction.notes} Adult at home: {jurisdiction.adultHome}</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
