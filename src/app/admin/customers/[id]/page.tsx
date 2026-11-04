import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, SampleChip } from "@/components/admin/ui";
import { formatDateTime, money } from "@/lib/format";
import { getDb } from "@/lib/store";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getDb();
  const customer = db.customers.find((row) => row.id === decodeURIComponent(id));
  if (!customer) notFound();
  const properties = db.properties.filter((row) => row.customerId === customer.id);
  const jobs = db.jobs.filter((row) => row.customerId === customer.id);
  const messages = db.messages.filter((row) => row.customerId === customer.id);
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div>
        <h1 className="font-sans text-xl font-semibold">{customer.name} <SampleChip /></h1>
        <p className="text-sm text-[#71717a]">{customer.phone} · {customer.email}</p>
        <Card className="mt-4">
          <h2 className="text-sm font-semibold">Properties</h2>
          {properties.map((property) => (
            <p key={property.id} className="mt-2 text-sm">{property.address}<br /><span className="text-[#71717a]">APN {property.apn} · {property.utility} · {property.access}</span></p>
          ))}
        </Card>
        <Card className="mt-4">
          <h2 className="text-sm font-semibold">Jobs</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {jobs.map((job) => (
              <li key={job.id}><Link href={`/admin/jobs/${job.id}`} className="font-medium">{job.id}</Link> · {job.summary} · {money(job.total)}</li>
            ))}
          </ul>
        </Card>
      </div>
      <Card>
        <h2 className="text-sm font-semibold">Messages</h2>
        <ul className="mt-2 space-y-2 text-xs text-[#71717a]">
          {messages.length === 0 && <li>No messages yet.</li>}
          {messages.map((message) => <li key={message.id}>{formatDateTime(message.at)} · {message.status}<br />{message.body}</li>)}
        </ul>
        <p className="mt-3 text-xs">SMS consent: {customer.smsOptIn ? "yes" : "no"}</p>
      </Card>
    </div>
  );
}
