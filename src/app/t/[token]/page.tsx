import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand";
import { RouteMap } from "@/components/route-map";
import { LiveRefresh } from "@/components/tracking/refresh";
import { RescheduleForm } from "@/components/tracking/reschedule-form";
import { business } from "@/config/business";
import { formatLongDate, money } from "@/lib/format";
import { jobBundle } from "@/lib/queries";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

const steps = [
  ["scheduled", "Scheduled"],
  ["en_route", "On the way"],
  ["arrived", "Arrived"],
  ["installing", "Installing"],
  ["complete", "Complete"],
] as const;

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await getDb();
  const job = db.jobs.find((row) => row.trackingToken === token);
  if (!job) notFound();
  const bundle = jobBundle(db, job);
  const tech = bundle.tech;
  const status = job.fieldStatus;
  const index = steps.findIndex((step) => step[0] === status);
  const done = status === "complete";
  const photos = job.photos.filter((photo) => photo.url);

  return (
    <main className="min-h-dvh bg-white text-ink">
      <LiveRefresh />
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-between px-4 py-3">
          <Logo className="h-8 w-auto" />
          {db.settings.showSampleChip && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">Sample data</span>}
        </div>
        {!done && status !== "scheduled" && (
          <RouteMap className="h-64 w-full" minutes={job.etaMin} homeLabel="Your home" techLabel={tech?.firstName || "Tech"} />
        )}
        <div className="px-4 py-5">
          {done ? (
            <>
              <p className="text-sm text-success">Completed {job.installedAt ? formatLongDate(job.installedAt.slice(0, 10)) : ""}</p>
              <h1 className="mt-1 font-sans text-4xl font-semibold">All done.</h1>
              <p className="mt-2 text-sm text-slate">Your new {job.newUnit.toLowerCase()} is installed and tested.</p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate">{status === "en_route" ? "Your technician is on the way" : status === "arrived" ? "Your technician has arrived" : status === "installing" ? "Install in progress" : "Your install is scheduled"}</p>
              <h1 className="mt-1 font-sans text-4xl font-semibold">
                {status === "en_route" ? `${job.etaMin || 10} min away` : status === "installing" ? "Installing" : status === "arrived" ? "On site" : formatLongDate(job.scheduledDate)}
              </h1>
              {status === "en_route" && (
                <p className="mt-1 text-sm text-slate">{job.distanceMi || "A few"} mi · ETA {job.etaTime || "shortly"}</p>
              )}
              {status === "scheduled" && <p className="mt-1 text-sm text-slate">Arrival {job.window}</p>}
            </>
          )}

          <ol className="mt-5 flex justify-between text-[10px] text-slate">
            {steps.map((step, stepIndex) => (
              <li key={step[0]} className={stepIndex <= index ? "text-ink" : ""}>
                <span className={`mx-auto mb-1 block h-2 w-2 rounded-full ${stepIndex <= index ? "bg-blue" : "bg-line"}`} />
                {step[1]}
              </li>
            ))}
          </ol>

          {tech && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-mist p-3">
              <span className="grid h-12 w-12 place-items-center rounded-full text-sm text-white" style={{ background: tech.color }}>{tech.initials}</span>
              <div>
                <p className="font-medium">{tech.name}</p>
                <p className="text-xs text-slate">{tech.bio}</p>
                <p className="text-xs text-slate">{tech.van}</p>
              </div>
            </div>
          )}

          {done && (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl bg-mist p-3">
                <p className="font-medium">Photos and invoice</p>
                <p className="text-xs text-slate">{photos.length} install photos · balance {money(job.balance)}</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {photos.slice(0, 6).map((photo) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={photo.id} src={photo.url} alt={photo.label} className="h-16 w-full rounded-lg object-cover" />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-mist p-3">
                <p className="font-medium">Next: city permit inspection</p>
                <p className="text-xs text-slate">{bundle.jurisdiction?.name} permit {bundle.permit?.permitNumber}. We book the inspection and text you the date.</p>
              </div>
              <div className="rounded-2xl bg-mist p-3">
                <p className="font-medium">Your new unit</p>
                <p className="text-xs text-slate">{job.newUnit}{tech ? ` · installed by ${tech.name}` : ""}{job.serial ? ` · ${job.serial}` : ""}</p>
              </div>
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2">
            {business.phone.startsWith("[") ? (
              <span className="btn-pill btn-pill-ink opacity-80">Call the office</span>
            ) : (
              <a className="btn-pill btn-pill-ink" href={`tel:${business.phone}`}>Call</a>
            )}
            {business.email.startsWith("[") ? (
              <span className="btn-pill border border-line text-center">Text the office</span>
            ) : (
              <a className="btn-pill border border-line text-center" href={`mailto:${business.email}`}>Text</a>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-slate">Office phone: {business.phone}</p>
          {job.rescheduleRequest && <p className="mt-3 text-sm text-slate">Reschedule request: {job.rescheduleRequest}</p>}
          {!done && <RescheduleForm token={token} />}
          <p className="mt-6 text-center text-xs text-slate">
            <Link href="/" className="underline">Hot Water Experts</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
