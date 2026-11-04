import Link from "next/link";
import { SampleChip } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/format";
import { getDb } from "@/lib/store";

export const metadata = { title: "Activity log" };

export default async function ActivityPage() {
  const db = await getDb();
  return (
    <div>
      <h1 className="font-sans text-xl font-semibold">Activity log <SampleChip /></h1>
      <ul className="mt-4 divide-y divide-[#f0f0f2] rounded-[10px] border border-[#e9e9ec] bg-white">
        {db.activity.map((row) => (
          <li key={row.id} className="grid gap-1 px-4 py-3 text-sm md:grid-cols-[180px_1fr]">
            <span className="text-xs text-[#71717a]">{formatDateTime(row.at)}</span>
            <span>
              <span className="font-medium">{row.actor}</span> {row.action.toLowerCase()} {row.href ? <Link href={row.href} className="text-blue">{row.entity}</Link> : row.entity}
              <span className="block text-xs text-[#71717a]">{row.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
