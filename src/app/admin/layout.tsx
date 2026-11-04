import { AdminShell } from "@/components/admin/shell";
import { getSession } from "@/lib/auth";
import { alerts, navCounts, searchIndex } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { getDb } from "@/lib/store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role === "tech") redirect("/login?next=/admin");
  const db = await getDb();
  const ghlLabel = process.env.GHL_WEBHOOK_URL
    ? `Synced ${formatDateTime(db.settings.ghlLastSync)}`
    : "GHL stub · not connected";
  return (
    <AdminShell
      session={session}
      counts={navCounts(db)}
      alerts={alerts(db)}
      search={searchIndex(db)}
      ghlLabel={ghlLabel}
    >
      {children}
    </AdminShell>
  );
}
