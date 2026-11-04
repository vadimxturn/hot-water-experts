import Link from "next/link";
import { RouteMap } from "@/components/route-map";
import { OnMyWayButton } from "@/components/tech/job-controls";
import { SampleChip } from "@/components/admin/ui";
import { formatLongDate } from "@/lib/format";
import { jobBundle } from "@/lib/queries";
import { techContext } from "@/lib/tech-view";

export const metadata = { title: "Today" };

export default async function TechTodayPage() {
  const { db, techId, today, session } = await techContext();
  const tech = db.techs.find((row) => row.id === techId);
  const jobs = db.jobs.filter((job) => job.techId === techId && (job.scheduledDate === today || job.visitDate === today));
  const next = jobs[0];
  const bundle = next ? jobBundle(db, next) : null;
  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate">{formatLongDate(today)}</p>
          <h1 className="font-sans text-3xl font-semibold">Today <SampleChip /></h1>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-full text-sm text-white" style={{ background: tech?.color || "#367af4" }}>{tech?.initials}</span>
      </div>
      <p className="mt-1 text-sm text-slate">{jobs.length} stops · {tech?.van} · signed in as {session.name}</p>
      {next && bundle && (
        <section className="mt-4 overflow-hidden rounded-3xl bg-white">
          <RouteMap className="h-40 w-full" minutes={next.etaMin} homeLabel={bundle.property.city} techLabel={tech?.firstName} />
          <div className="p-4">
            <div className="flex justify-between text-xs text-slate">
              <span>Next · {next.visitDate === today ? next.visitWindow : next.window}</span>
              <span>{next.etaMin ? `${next.etaMin} min` : "Window set"} {next.distanceMi ? `· ${next.distanceMi} mi` : ""}</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold">{bundle.customer.name}</h2>
            <p className="text-sm text-slate">{bundle.property.address}</p>
            <p className="mt-1 text-sm">{next.existingUnit} to {next.newUnit}</p>
            <div className="mt-4">
              {next.fieldStatus === "scheduled" || next.fieldStatus === "en_route" ? (
                <OnMyWayButton jobId={next.id} />
              ) : (
                <Link href={`/tech/jobs/${next.id}`} className="btn-pill btn-pill-blue h-12 w-full">Open job</Link>
              )}
            </div>
            <p className="mt-2 text-center text-[11px] text-slate">Starts a sample GPS point and records the on-the-way text with a tracking link.</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <a className="rounded-xl bg-mist py-2" href={`https://maps.google.com/?q=${encodeURIComponent(bundle.property.address)}`}>Navigate</a>
              <a className="rounded-xl bg-mist py-2" href={`tel:${bundle.customer.phone}`}>Call</a>
              <Link className="rounded-xl bg-mist py-2" href={`/tech/jobs/${next.id}`}>Details</Link>
            </div>
          </div>
        </section>
      )}
      <ul className="mt-4 space-y-2">
        {jobs.slice(1).map((job) => {
          const row = jobBundle(db, job);
          return (
            <li key={job.id}>
              <Link href={`/tech/jobs/${job.id}`} className="block rounded-2xl bg-white p-3">
                <span className="text-xs text-slate">{job.visitDate === today ? job.visitWindow : job.window}</span>
                <span className="block font-medium">{row.customer.name}</span>
                <span className="text-xs text-slate">{row.property.city} · {job.summary}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
