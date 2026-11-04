import { SettingsForm } from "@/components/admin/settings-form";
import { SampleChip } from "@/components/admin/ui";
import { getDb } from "@/lib/store";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const db = await getDb();
  return (
    <div>
      <h1 className="font-sans text-xl font-semibold">Settings <SampleChip /></h1>
      <p className="mb-4 text-sm text-[#71717a]">Booking rules, jurisdictions, and the editable price table. Placeholders for license, phone, and hours stay in src/config/business.ts.</p>
      <SettingsForm settings={db.settings} jurisdictions={db.jurisdictions} techs={db.techs} />
    </div>
  );
}
