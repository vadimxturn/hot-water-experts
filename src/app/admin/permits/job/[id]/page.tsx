import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Pill, SampleChip } from "@/components/admin/ui";
import { findJob } from "@/lib/queries";
import { getDb } from "@/lib/store";
import { setPermitStatusAction } from "@/server/actions";

const fallbackSteps = [
  "Determine jurisdiction and APN",
  "Classify scope",
  "Prepare documents",
  "Submit in the portal",
  "Pay the fee and record the permit number",
  "Install to code",
  "Schedule the inspection",
  "Inspection result",
  "Final documents",
  "SMUD rebate, only if it applies",
  "Close the job",
];

export default async function PermitJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const bundle = findJob(db, decodeURIComponent(id));
  if (!bundle?.permit) notFound();
  const { job, customer, property, jurisdiction, permit, inspections } = bundle;
  const steps = permit.steps.length
    ? permit.steps
    : fallbackSteps.map((title, index) => ({
        n: index + 1,
        title: `${index + 1}. ${title}`,
        detail: "Filled from the job when the office opens the file.",
        state: index === 0 ? "current" as const : "todo" as const,
      }));
  const done = steps.filter((step) => step.state === "done").length;
  const inspection = inspections[0];

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-sans text-xl font-semibold">Permit tracker · {job.id}</h1>
          <p className="text-sm text-[#71717a]">{customer.name} · {property.address} · {job.summary} <SampleChip /></p>
        </div>
        <a href={jurisdiction?.portalUrl} target="_blank" rel="noreferrer" className="office-btn office-btn-secondary">Open portal</a>
      </div>
      <Card className="mb-4 grid gap-3 text-sm md:grid-cols-6">
        <p>Jurisdiction<br /><span className="font-medium">{jurisdiction?.name}</span></p>
        <p>Permit #<br /><span className="num">{permit.permitNumber}</span></p>
        <p>Fee<br />{permit.feeLabel}</p>
        <p>Licenses<br />{permit.license}</p>
        <p>Installed<br />{job.installedAt?.slice(0, 10) || "Not yet"}</p>
        <p>Inspection<br />{inspection?.date || "Not booked"} {inspection?.window || ""}</p>
      </Card>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.7fr]">
        <Card>
          <p className="mb-3 text-sm text-[#71717a]">{done} of {steps.length} steps · {jurisdiction?.name}</p>
          <ol className="space-y-3">
            {steps.map((step) => (
              <li key={step.n} className="flex gap-3">
                <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] ${step.state === "done" ? "bg-emerald-500 text-white" : step.state === "current" ? "bg-ink text-white" : "bg-[#f4f4f5] text-[#71717a]"}`}>{step.n}</span>
                <div>
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-[#71717a]">{step.detail} {"date" in step && step.date ? `· ${step.date}` : ""}</p>
                  {step.state === "current" && <Pill tone="accent">In progress</Pill>}
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={setPermitStatusAction.bind(null, job.id, "docs_ready")}><button className="office-btn office-btn-secondary" type="submit">Mark docs ready</button></form>
            <form action={setPermitStatusAction.bind(null, job.id, "submitted")}><button className="office-btn office-btn-secondary" type="submit">Mark submitted</button></form>
            <form action={setPermitStatusAction.bind(null, job.id, "issued")}><button className="office-btn office-btn-primary" type="submit">Mark issued</button></form>
          </div>
          <p className="mt-2 text-xs text-[#71717a]">These buttons record a status a person already completed in the city portal. They do not submit the permit.</p>
        </Card>
        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold">Inspection</h2>
            <p className="mt-2 text-sm">{inspection ? `${inspection.date || "Not booked"} · ${inspection.window || ""}` : "No inspection row yet."}</p>
            {inspection?.adultRequired && <p className="mt-2 text-xs text-amber-800">An adult 18 or older may need to be home. Confirm with {jurisdiction?.short}.</p>}
            <Link href="/admin/inspections" className="mt-3 inline-block text-xs text-blue">Inspection scheduler</Link>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold">Documents</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {permit.docs.map((doc) => (
                <li key={doc.name} className="flex justify-between gap-3">
                  <span>{doc.name}</span>
                  <span className={doc.status === "missing" ? "text-amber-700" : "text-emerald-700"}>{doc.status}</span>
                </li>
              ))}
              {permit.docs.length === 0 && <li className="text-[#71717a]">Packet not built yet.</li>}
            </ul>
            <Link href={`/admin/permits/${job.id}/packet`} className="office-btn office-btn-secondary mt-3">Review pre-fill</Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
