import { getSession } from "@/lib/auth";
import { jobBundle, officeToday, todayAppointments } from "@/lib/queries";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session || session.role === "tech") return new Response("Sign in required", { status: 401 });
  const db = await getDb();
  const today = officeToday(db);
  const lines = [["date", "window", "job", "customer", "city", "summary", "tech", "status"]];
  for (const job of todayAppointments(db)) {
    const bundle = jobBundle(db, job);
    lines.push([
      today,
      (job.visitDate === today ? job.visitWindow : job.window) || "",
      job.id,
      bundle.customer.name,
      bundle.property.city,
      job.summary,
      bundle.tech?.name || "",
      job.subStatus,
    ]);
  }
  const csv = lines.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=hwe-today-${today}.csv`,
    },
  });
}
