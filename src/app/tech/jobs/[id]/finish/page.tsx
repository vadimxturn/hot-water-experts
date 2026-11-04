import Link from "next/link";
import { notFound } from "next/navigation";
import { SignaturePad } from "@/components/tech/job-controls";
import { SampleChip } from "@/components/admin/ui";
import { money } from "@/lib/format";
import { jobBundle } from "@/lib/queries";
import { techContext } from "@/lib/tech-view";

export default async function FinishPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, session, techId } = await techContext();
  const job = db.jobs.find((row) => row.id === decodeURIComponent(id));
  if (!job) notFound();
  if (session.role === "tech" && job.techId && job.techId !== techId) notFound();
  const bundle = jobBundle(db, job);
  const done = job.photos.filter((photo) => photo.required && photo.url).length;
  const required = job.photos.filter((photo) => photo.required).length;
  return (
    <div className="px-4 py-4">
      <Link href={`/tech/jobs/${job.id}`} className="text-sm text-slate">Back</Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-sans text-2xl font-semibold">Finish job</h1>
        <SampleChip />
      </div>
      <p className="text-sm text-slate">{job.id} · {bundle.customer.name}</p>
      <section className="mt-4 rounded-3xl bg-white p-4 text-sm">
        <p>Installed <span className="float-right">{job.newUnit}</span></p>
        <p className="mt-2">Photos <span className="float-right">{done} of {required}</span></p>
        <p className="mt-2">Balance due <span className="num float-right">{money(job.balance)}</span></p>
        <p className="mt-3 text-xs text-slate">Collect card and text pay link stay in demo mode until Stripe is connected. Marking the job done records the balance as still due.</p>
      </section>
      <section className="mt-4 rounded-3xl bg-white p-4">
        <SignaturePad jobId={job.id} locked={done < required} />
      </section>
    </div>
  );
}
