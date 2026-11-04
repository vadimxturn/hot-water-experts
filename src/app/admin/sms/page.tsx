import { SmsEditor } from "@/components/admin/sms-editor";
import { SampleChip } from "@/components/admin/ui";
import { getDb } from "@/lib/store";

export const metadata = { title: "SMS templates" };

export default async function SmsPage() {
  const db = await getDb();
  return (
    <div>
      <h1 className="font-sans text-xl font-semibold">SMS templates <SampleChip /></h1>
      <p className="mb-4 text-sm text-[#71717a]">14 job texts. Quiet hours are in Settings. Twilio sends them when the account keys are present.</p>
      <SmsEditor templates={db.templates} />
    </div>
  );
}
