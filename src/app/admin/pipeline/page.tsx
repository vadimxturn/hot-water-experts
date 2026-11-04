import { PipelineBoard } from "@/components/admin/pipeline-board";
import { SampleChip } from "@/components/admin/ui";
import { jobBundle } from "@/lib/queries";
import { getDb } from "@/lib/store";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const db = await getDb();
  const leads = db.leads
    .filter((lead) => lead.status !== "booked")
    .map((lead) => ({
      id: lead.id,
      name: lead.name || "New lead",
      status: lead.status,
      summary: lead.summary,
      city: lead.city,
      urgent: lead.urgent,
    }));
  const jobs = db.jobs.map((job) => {
    const bundle = jobBundle(db, job);
    return {
      id: job.id,
      stage: job.stage,
      summary: job.summary,
      subStatus: job.subStatus,
      side: job.side,
      city: bundle.property.city,
      name: bundle.customer.name,
      tech: bundle.tech?.initials,
      date: job.scheduledDate,
    };
  });
  return (
    <div>
      <h1 className="font-sans text-xl font-semibold">Pipeline</h1>
      <p className="mb-4 text-sm text-[#71717a]">Lead and Quoted sync from the funnel. Later stages live here. <SampleChip /></p>
      <PipelineBoard leads={leads} jobs={jobs} />
    </div>
  );
}
