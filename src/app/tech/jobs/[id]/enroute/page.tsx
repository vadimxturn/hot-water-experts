import Link from "next/link";
import { notFound } from "next/navigation";
import { RouteMap } from "@/components/route-map";
import { StatusButton } from "@/components/tech/job-controls";
import { SampleChip } from "@/components/admin/ui";
import { jobBundle } from "@/lib/queries";
import { techContext } from "@/lib/tech-view";

export default async function EnRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, session, techId } = await techContext();
  const job = db.jobs.find((row) => row.id === decodeURIComponent(id));
  if (!job) notFound();
  if (session.role === "tech" && job.techId && job.techId !== techId) notFound();
  const bundle = jobBundle(db, job);
  const tech = db.techs.find((row) => row.id === job.techId);
  return (
    <div className="px-4 py-4">
      <Link href={`/tech/jobs/${job.id}`} className="text-sm text-slate">Back to the job</Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-sans text-2xl font-semibold">On the way</h1>
        <SampleChip />
      </div>
      <p className="text-sm text-slate">{bundle.customer.name} · {bundle.property.address}</p>
      <div className="mt-4 overflow-hidden rounded-3xl bg-white">
        <RouteMap className="h-52 w-full" minutes={job.etaMin || 10} homeLabel="Home" techLabel={tech?.firstName || "Tech"} />
        <div className="grid grid-cols-2 gap-2 p-4">
          <div>
            <p className="text-xs text-slate">ETA</p>
            <p className="text-3xl font-semibold">{job.etaMin || 10} min</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate">{job.distanceMi || 2.4} mi</p>
            <p className="text-sm">Arrive {job.etaTime || "soon"}</p>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate">
        {process.env.GOOGLE_MAPS_API_KEY
          ? "Drive time came from Google Routes."
          : "Drive time is a straight-line estimate. A Google Maps key switches this to live traffic."}
        {" "}
        {process.env.TWILIO_ACCOUNT_SID ? "The on-the-way text was sent." : "The on-the-way text is saved on the job. Twilio is not connected."}
      </p>
      <div className="mt-4">
        <StatusButton jobId={job.id} status="arrived" label="I've arrived" />
      </div>
      <p className="mt-3 text-center text-xs">
        <Link href={`/t/${job.trackingToken}`} className="text-blue">Customer tracking link</Link>
      </p>
    </div>
  );
}
