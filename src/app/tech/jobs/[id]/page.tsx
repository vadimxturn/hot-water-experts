import Link from "next/link";
import { notFound } from "next/navigation";
import { PhotoButton, OnMyWayButton, StatusButton } from "@/components/tech/job-controls";
import { SampleChip } from "@/components/admin/ui";
import { money } from "@/lib/format";
import { jobBundle } from "@/lib/queries";
import { techContext } from "@/lib/tech-view";

export default async function TechJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, techId, session } = await techContext();
  const job = db.jobs.find((row) => row.id === decodeURIComponent(id));
  if (!job) notFound();
  if (session.role === "tech" && job.techId && job.techId !== techId) notFound();
  const bundle = jobBundle(db, job);
  const done = job.photos.filter((photo) => photo.required && photo.url).length;
  const required = job.photos.filter((photo) => photo.required).length;

  return (
    <div className="px-4 py-4">
      <Link href="/tech" className="text-sm text-slate">Back</Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-sans text-2xl font-semibold">{bundle.customer.name}</h1>
        <SampleChip />
      </div>
      <p className="text-sm text-slate">{job.id} · {bundle.property.address}</p>
      <p className="mt-1 text-sm">{job.summary} · {job.window}</p>
      <p className="mt-1 text-xs text-slate">Access: {bundle.property.access}{bundle.property.gateCode ? ` · Gate ${bundle.property.gateCode}` : ""}</p>

      <section className="mt-4 rounded-3xl bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Install photos</h2>
          <span className="text-xs text-slate">{done} of {required}</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {job.photos.map((photo) => (
            <div key={photo.id} className="overflow-hidden rounded-xl border border-line bg-mist">
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt="" className="h-16 w-full object-cover" />
              ) : (
                <div className="grid h-16 place-items-center text-[11px] text-slate">Add</div>
              )}
              <div className="px-1 py-1 text-center">
                <p className="text-[10px] leading-3">{photo.label}</p>
                {!photo.url && <PhotoButton jobId={job.id} category={photo.category} />}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate">Design photos stand in for samples. A new photo marks the slot done. Mixing valve is not required on a straight gas tank.</p>
      </section>

      <div className="mt-4 space-y-2">
        {job.fieldStatus === "scheduled" && <OnMyWayButton jobId={job.id} />}
        {job.fieldStatus === "en_route" && (
          <>
            <Link href={`/tech/jobs/${job.id}/enroute`} className="btn-pill border border-line text-center">Open the drive view</Link>
            <StatusButton jobId={job.id} status="arrived" label="Arrived" />
          </>
        )}
        {job.fieldStatus === "arrived" && <StatusButton jobId={job.id} status="installing" label="Start install" />}
        <Link href={`/tech/jobs/${job.id}/finish`} className="btn-pill btn-pill-ink text-center">
          {done < required ? `Finish job · ${required - done} photos left` : "Finish job"}
        </Link>
      </div>
      <p className="mt-3 text-sm">Balance due <span className="num">{money(job.balance)}</span></p>
      <p className="text-xs text-slate">Collect the balance in the office or with the pay link. Card capture waits on Stripe.</p>
    </div>
  );
}
