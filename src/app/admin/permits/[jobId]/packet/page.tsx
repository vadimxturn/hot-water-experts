import Link from "next/link";
import { notFound } from "next/navigation";
import { business } from "@/config/business";
import { Card, Pill, SampleChip } from "@/components/admin/ui";
import { findJob } from "@/lib/queries";
import { getDb } from "@/lib/store";

export default async function PacketPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const db = await getDb();
  const bundle = findJob(db, decodeURIComponent(jobId));
  if (!bundle) notFound();
  const { job, customer, property, jurisdiction, permit } = bundle;
  const panelMissing = job.panel === "";
  const rows = [
    ["Contractor", business.name, "Settings", "Verified"],
    ["CSLB license", `${business.license} ${business.licenseClass}`, "Settings", "Check"],
    ["Owner", `${customer.name} · ${customer.phone}`, "Job", "Verified"],
    ["Site address", property.address, "Job", "Verified"],
    ["APN", property.apn, "County GIS placeholder", property.apn.includes("000") ? "Check" : "Verified"],
    ["Jurisdiction", jurisdiction?.name || "Unknown", "ZIP resolver", jurisdiction ? "Verified" : "Missing"],
    ["Scope", job.scopeText || job.summary, "Packet builder", "Verified"],
    ["New unit", job.newUnit, "Job", "Verified"],
    ["Valuation", job.total ? `$${job.total.toLocaleString("en-US")} from the quote` : "Not entered", "Job", "Check"],
    ["Panel rating", job.panel || "Not entered", "Tech survey", panelMissing || !job.panel ? "Missing" : "Verified"],
  ];

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-sans text-xl font-semibold">Permit packet review</h1>
          <p className="text-sm text-[#71717a]">{job.id} · {customer.name} · {job.summary} <SampleChip /></p>
        </div>
        <a href={jurisdiction?.portalUrl} className="office-btn office-btn-primary" target="_blank" rel="noreferrer">Open portal to sign, submit, and pay</a>
      </div>
      <p className="mb-4 text-sm text-[#71717a]">The app pre-fills the packet. A person reviews it, signs the declaration in the city portal, and pays. Nothing here is submitted on its own.</p>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.7fr]">
        <Card className="p-0">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f7f7f8] text-xs text-[#71717a]">
              <tr><th className="px-4 py-2">Field</th><th className="px-4 py-2">Pre-filled value</th><th className="px-4 py-2">Source</th><th className="px-4 py-2">Check</th></tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-t border-[#f4f4f5]">
                  <td className="px-4 py-2">{row[0]}</td>
                  <td className="px-4 py-2">{row[1]}</td>
                  <td className="px-4 py-2 text-[#71717a]">{row[2]}</td>
                  <td className="px-4 py-2"><Pill tone={row[3] === "Verified" ? "success" : row[3] === "Missing" ? "danger" : "warning"}>{row[3]}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div className="space-y-4">
          <Card>
            <h2 className="text-sm font-semibold">Docs checklist</h2>
            <ul className="mt-2 space-y-2 text-sm">
              <li>CF1R-ALT-05-E {permit?.cf1r || jurisdiction?.cf1r ? "required" : "not required here"}</li>
              <li>Cut sheet from the unit library</li>
              <li>Scope text from the job</li>
              <li>License file: {business.license}</li>
              <li>Customer authorization: sample, not a real signature</li>
            </ul>
          </Card>
          <Card>
            <h2 className="text-sm font-semibold">Submit in the portal</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-[#3f3f46]">
              <li>Open {jurisdiction?.portal || "the portal"} in your own logged-in browser.</li>
              <li>Copy the checked fields. The helper stops before the declaration, Submit, and Pay.</li>
              <li>You review, tick the certification, submit, and pay with the company card.</li>
              <li>Status comes back from the portal email to {business.permitsEmail}.</li>
            </ol>
            {panelMissing && <p className="mt-3 text-xs text-amber-800">Panel rating is blank. Fix it before a heat pump permit, or the portal field stays empty.</p>}
            <p className="mt-3 text-xs text-[#71717a]">Permitio is an optional overflow filing service ($25 to $100 per permit, vendor figure). It is not connected.</p>
          </Card>
        </div>
      </div>
      <p className="mt-4 text-sm"><Link href={`/admin/permits/job/${job.id}`} className="text-blue">Back to the tracker</Link></p>
    </div>
  );
}
