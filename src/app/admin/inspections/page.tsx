import Link from "next/link";
import { Card, Pill, SampleChip } from "@/components/admin/ui";
import { jobBundle } from "@/lib/queries";
import { getDb } from "@/lib/store";
import { setInspectionAction } from "@/server/actions";

export const metadata = { title: "Inspections" };

export default async function InspectionsPage() {
  const db = await getDb();
  return (
    <div>
      <h1 className="font-sans text-xl font-semibold">Inspection scheduler</h1>
      <p className="mb-4 text-sm text-[#71717a]">Each city books a different way. Record the result after the inspector is done. <SampleChip /></p>
      <div className="grid gap-3">
        {db.inspections.map((inspection) => {
          const job = db.jobs.find((row) => row.id === inspection.jobId);
          if (!job) return null;
          const bundle = jobBundle(db, job);
          return (
            <Card key={inspection.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Link href={`/admin/jobs/${job.id}`} className="font-medium">{bundle.customer.name}</Link>
                <p className="text-xs text-[#71717a]">{job.id} · {bundle.property.city} · {bundle.jurisdiction?.inspectionMethod}</p>
                <p className="mt-1 text-sm">{inspection.type} · {inspection.date || "Not booked"} {inspection.window || ""}</p>
                <p className="text-xs text-[#71717a]">{inspection.notes}</p>
                {inspection.adultRequired && <p className="text-xs text-amber-800">An adult 18 or older may need to be home.</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={inspection.result === "pass" ? "success" : inspection.result === "fail" ? "danger" : inspection.result === "not_booked" ? "warning" : "accent"}>{inspection.result.replaceAll("_", " ")}</Pill>
                <form action={setInspectionAction.bind(null, inspection.id, "scheduled", inspection.date || "2026-10-24")}><button className="office-btn office-btn-secondary" type="submit">Mark booked</button></form>
                <form action={setInspectionAction.bind(null, inspection.id, "pass", inspection.date)}><button className="office-btn office-btn-secondary" type="submit">Record pass</button></form>
                <form action={setInspectionAction.bind(null, inspection.id, "fail", inspection.date)}><button className="office-btn office-btn-secondary" type="submit">Record fail</button></form>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
