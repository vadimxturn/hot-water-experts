import { LeadsInbox } from "@/components/admin/leads-inbox";
import { SampleChip } from "@/components/admin/ui";
import { getDb } from "@/lib/store";

export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  const db = await getDb();
  const leads = [...db.leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-sans text-xl font-semibold">Leads</h1>
          <p className="text-sm text-[#71717a]">New requests from the estimate funnel. Lead and Quoted sync to GoHighLevel when the webhook is set. <SampleChip /></p>
        </div>
      </div>
      <LeadsInbox leads={leads} />
    </div>
  );
}
