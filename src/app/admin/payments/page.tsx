import Link from "next/link";
import { Pill, SampleChip } from "@/components/admin/ui";
import { formatDateTime, money } from "@/lib/format";
import { getDb } from "@/lib/store";

export const metadata = { title: "Payments" };

export default async function PaymentsPage() {
  const db = await getDb();
  const paid = db.payments.filter((row) => row.status === "stubbed" || row.status === "paid").reduce((sum, row) => sum + (row.kind === "refund" ? 0 : row.amount), 0);
  const due = db.payments.filter((row) => row.status === "due").reduce((sum, row) => sum + row.amount, 0);
  const refunds = db.payments.filter((row) => row.kind === "refund").reduce((sum, row) => sum + row.amount, 0);
  return (
    <div>
      <h1 className="font-sans text-xl font-semibold">Payments and invoices <SampleChip /></h1>
      <p className="mb-4 text-sm text-[#71717a]">{process.env.STRIPE_SECRET_KEY ? "Stripe keys are set." : "Stripe is not connected. Amounts below are demo records, not charges."}</p>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[["Recorded", money(paid)], ["Balances due", money(due)], ["Refunds", money(refunds)]].map(([label, value]) => (
          <div key={label} className="rounded-[10px] border border-[#e9e9ec] bg-white p-4">
            <p className="text-xs text-[#71717a]">{label}</p>
            <p className="num text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-[10px] border border-[#e9e9ec] bg-white">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#f4f4f5] text-xs text-[#71717a]"><tr><th className="px-3 py-2">Job</th><th className="px-3 py-2">Kind</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Reference</th><th className="px-3 py-2 text-right">Amount</th></tr></thead>
          <tbody>
            {db.payments.map((payment) => (
              <tr key={payment.id} className="border-t border-[#f4f4f5]">
                <td className="px-3 py-2"><Link href={`/admin/jobs/${payment.jobId}`}>{payment.jobId}</Link></td>
                <td className="px-3 py-2">{payment.kind}</td>
                <td className="px-3 py-2"><Pill tone={payment.status === "due" ? "warning" : payment.kind === "refund" ? "danger" : "success"}>{payment.status}</Pill></td>
                <td className="px-3 py-2 text-xs text-[#71717a]">{payment.ref}{payment.at ? ` · ${formatDateTime(payment.at)}` : ""}</td>
                <td className="num px-3 py-2 text-right">{money(payment.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
