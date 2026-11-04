import { notFound } from "next/navigation";
import { Card, SampleChip } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";
import { getDb } from "@/lib/store";

export default async function TechProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const tech = db.techs.find((row) => row.id === id);
  if (!tech) notFound();
  const jobs = db.jobs.filter((job) => job.techId === tech.id).slice(0, 8);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <Card>
        <h1 className="font-sans text-xl font-semibold">{tech.name} <SampleChip /></h1>
        <p className="mt-2 text-sm">{tech.bio}</p>
        <p className="mt-3 text-sm">Skills: {tech.skills.join(", ")}</p>
        <p className="text-sm">Licenses: {tech.licenses.join(", ")}</p>
        <p className="text-sm">Days: {tech.days}. Max {tech.maxPerDay} installs.</p>
        <p className="text-sm">Phone: {tech.phone}</p>
        <h2 className="mt-5 text-sm font-semibold">Assigned sample jobs</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {jobs.map((job) => <li key={job.id}>{job.id} · {formatDate(job.scheduledDate)} · {job.summary}</li>)}
        </ul>
      </Card>
      <Card>
        <h2 className="text-sm font-semibold">Home base</h2>
        <p className="mt-2 text-sm">{tech.homeBase}</p>
        <p className="text-sm text-[#71717a]">{tech.van}</p>
        <p className="mt-4 text-xs text-[#71717a]">Availability blocks are the office hours in Settings. A per-day off switch can be added when real schedules exist.</p>
      </Card>
    </div>
  );
}
