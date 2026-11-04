import { SampleChip } from "@/components/admin/ui";
import { money } from "@/lib/format";
import { pipelineCounts } from "@/lib/queries";
import { getDb } from "@/lib/store";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const db = await getDb();
  const counts = pipelineCounts(db);
  const byCity = new Map<string, number>();
  for (const job of db.jobs) {
    const city = db.properties.find((row) => row.id === job.propertyId)?.city || "Unknown";
    byCity.set(city, (byCity.get(city) || 0) + 1);
  }
  const booked = db.payments.filter((row) => row.kind === "deposit").reduce((sum, row) => sum + row.amount, 0);
  return (
    <div>
      <h1 className="font-sans text-xl font-semibold">Reports <SampleChip /></h1>
      <p className="mb-4 text-sm text-[#71717a]">Office counts from the sample file. These are not public marketing stats.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[10px] border border-[#e9e9ec] bg-white p-5">
          <h2 className="text-sm font-semibold">Jobs by stage</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.entries(counts).filter(([key]) => key !== "open").map(([key, value]) => (
              <li key={key} className="flex justify-between"><span className="capitalize">{key}</span><span className="num">{value}</span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-[10px] border border-[#e9e9ec] bg-white p-5">
          <h2 className="text-sm font-semibold">Jobs by city</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[...byCity.entries()].map(([city, count]) => (
              <li key={city} className="flex justify-between"><span>{city}</span><span className="num">{count}</span></li>
            ))}
          </ul>
        </section>
        <section className="rounded-[10px] border border-[#e9e9ec] bg-white p-5">
          <h2 className="text-sm font-semibold">Deposits recorded</h2>
          <p className="num mt-2 text-3xl font-semibold">{money(booked)}</p>
          <p className="text-xs text-[#71717a]">Demo ledger. Not a Stripe balance.</p>
        </section>
        <section className="rounded-[10px] border border-[#e9e9ec] bg-white p-5">
          <h2 className="text-sm font-semibold">Leads</h2>
          <p className="mt-2 text-sm">{db.leads.length} in the inbox, including quotes that are not booked.</p>
          <p className="text-sm">{db.leads.filter((lead) => lead.smsConsent).length} with SMS consent.</p>
        </section>
      </div>
    </div>
  );
}
