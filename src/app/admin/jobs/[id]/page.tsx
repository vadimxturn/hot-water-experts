import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Pill, SampleChip, jobTone } from "@/components/admin/ui";
import { formatDateTime, formatLongDate, money } from "@/lib/format";
import { findJob, permitAge } from "@/lib/queries";
import { getDb } from "@/lib/store";
import { updateCustomerAction } from "@/server/actions";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const bundle = findJob(db, decodeURIComponent(id));
  if (!bundle) notFound();
  const { job, customer, property, tech, jurisdiction, permit, messages, payments } = bundle;
  const stages = ["Lead", "Quoted", "Scheduled", "Permit", "Installed", "Inspected"];
  const stageIndex = ["lead", "quoted", "scheduled", "permit", "installed", "inspected"].indexOf(job.stage);

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-sans text-xl font-semibold">{customer.name}</h1>
          <p className="text-sm text-[#71717a]">{job.id} · {job.summary} · {property.city} · sample job <SampleChip /></p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/permits/job/${job.id}`} className="office-btn office-btn-secondary">Permit tracker</Link>
          {job.trackingToken && <Link href={`/t/${job.trackingToken}`} className="office-btn office-btn-secondary">Tracking link</Link>}
        </div>
      </div>
      <ol className="mb-5 flex flex-wrap gap-2 text-xs">
        {stages.map((label, index) => (
          <li key={label} className={`rounded-full px-3 py-1 ${index <= stageIndex ? "bg-ink text-white" : "bg-[#f4f4f5] text-[#71717a]"}`}>{label}</li>
        ))}
      </ol>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-4">
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-sans text-sm font-semibold">Customer and property</h2>
              <span className="text-xs text-[#71717a]">Customers have no login</span>
            </div>
            <form action={updateCustomerAction.bind(null, customer.id)} className="grid gap-3 text-sm sm:grid-cols-2">
              <label>Name<input name="name" defaultValue={customer.name} className="mt-1 h-8 w-full rounded-md border border-[#e4e4e7] px-2" /></label>
              <label>Phone<input name="phone" defaultValue={customer.phone} className="mt-1 h-8 w-full rounded-md border border-[#e4e4e7] px-2" /></label>
              <label>Email<input name="email" defaultValue={customer.email} className="mt-1 h-8 w-full rounded-md border border-[#e4e4e7] px-2" /></label>
              <label className="sm:col-span-2">Address<input name="address" defaultValue={property.address} className="mt-1 h-8 w-full rounded-md border border-[#e4e4e7] px-2" /></label>
              <p>APN <span className="num">{property.apn}</span></p>
              <p>Jurisdiction {jurisdiction?.name} · {jurisdiction?.platform}</p>
              <p>Access {property.access}</p>
              <p>Utility {property.utility}</p>
              <p>Old unit {job.existingUnit}</p>
              <p>New unit {job.newUnit}</p>
              <p>Add-ons {job.addons}</p>
              <p>SMUD {job.smud}</p>
              <button className="office-btn office-btn-secondary w-fit" type="submit">Save contact</button>
            </form>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {job.photos.filter((photo) => photo.url).slice(0, 4).map((photo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={photo.id} src={photo.url} alt={photo.label} className="h-20 w-full rounded-md object-cover" />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[#71717a]">Design photo stand-ins. Replace with the job photos.</p>
          </Card>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-sans text-sm font-semibold">Quote, set price</h2>
              <span className="text-xs text-[#71717a]">Sample lines. The public price book is in Settings.</span>
            </div>
            <ul className="divide-y divide-[#f4f4f5] text-sm">
              {job.lines.map((line) => (
                <li key={line.label} className="flex justify-between py-2">
                  <span>{line.label}</span>
                  <span className="num">{money(line.amount)}</span>
                </li>
              ))}
              <li className="flex justify-between py-2 font-medium">
                <span>Total</span>
                <span className="num">{money(job.total)}</span>
              </li>
            </ul>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-[#f7f7f8] p-3 text-sm">
                <p className="text-[#71717a]">Deposit</p>
                <p className="num text-lg">{money(job.deposit)}</p>
                <p className="text-xs text-[#71717a]">{job.depositPaidAt ? formatDateTime(job.depositPaidAt) : "Not paid"} · {job.depositRef || "No reference"}</p>
              </div>
              <div className="rounded-md bg-[#f7f7f8] p-3 text-sm">
                <p className="text-[#71717a]">Balance due on install day</p>
                <p className="num text-lg">{money(job.balance)}</p>
                <p className="text-xs text-[#71717a]">{job.payMethod}</p>
              </div>
            </div>
            <ul className="mt-3 text-xs text-[#71717a]">
              {payments.map((payment) => (
                <li key={payment.id}>{payment.kind} {money(payment.amount)} · {payment.status} · {payment.note || payment.ref}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="font-sans text-sm font-semibold">Text messages</h2>
            <ul className="mt-2 divide-y divide-[#f4f4f5] text-sm">
              {messages.length === 0 && <li className="py-2 text-[#71717a]">No texts on this job yet.</li>}
              {messages.map((message) => (
                <li key={message.id} className="flex items-start justify-between gap-3 py-2">
                  <div>
                    <p className="font-medium">{message.templateKey}</p>
                    <p className="text-xs text-[#71717a]">{message.body}</p>
                  </div>
                  <span className="shrink-0 text-xs text-[#71717a]">{message.status} · {formatDateTime(message.at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <h2 className="font-sans text-sm font-semibold">Schedule</h2>
            <p className="num mt-2 text-lg">{job.scheduledDate ? formatLongDate(job.scheduledDate) : "Not scheduled"}</p>
            <p className="text-sm text-[#71717a]">{job.window} · about {job.durationHours || 3} hrs on site</p>
            <p className="mt-2 text-sm">{tech ? tech.name : "Unassigned"}</p>
            <Link href="/admin/calendar" className="mt-3 inline-block text-xs text-blue">Reschedule on the calendar</Link>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-sm font-semibold">Permit</h2>
              <Pill tone={jobTone(job)}>{permit?.status || "needed"}</Pill>
            </div>
            <p className="mt-2 text-sm">{jurisdiction?.name} · {jurisdiction?.portal}</p>
            <p className="text-sm">Permit # {permit?.permitNumber || "Pending"}</p>
            <p className="text-sm">Fee {permit?.feeLabel}</p>
            <p className="text-sm">License {permit?.license}</p>
            <p className="text-xs text-[#71717a]">{permit?.appliedAt ? `${permitAge(db, job.id)} days since the file opened` : "Not submitted"}</p>
            <p className="mt-2 text-sm">{permit?.nextAction}</p>
            <Link href={`/admin/permits/job/${job.id}`} className="office-btn office-btn-primary mt-3">Open tracker</Link>
            <Link href={`/admin/permits/${job.id}/packet`} className="office-btn office-btn-secondary mt-2 ml-2">Review packet</Link>
          </Card>
          <Card>
            <h2 className="font-sans text-sm font-semibold">Timeline</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {db.activity.filter((row) => row.entity === job.id || row.detail.includes(job.id)).slice(0, 6).map((row) => (
                <li key={row.id}>
                  <p>{row.action}</p>
                  <p className="text-xs text-[#71717a]">{formatDateTime(row.at)} · {row.actor}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
