import Link from "next/link";
import { getDb } from "@/lib/store";
import { officeToday } from "@/lib/queries";

export const metadata = { title: "Technicians" };

export default async function TechsPage() {
  const db = await getDb();
  const today = officeToday(db);
  return (
    <div>
      <h1 className="font-sans text-xl font-semibold">Technicians</h1>
      <p className="mb-4 text-sm text-[#71717a]">Sample installers. Names, photos, and licenses are placeholders.</p>
      <div className="grid gap-3 md:grid-cols-3">
        {db.techs.map((tech) => {
          const load = db.jobs.filter((job) => job.techId === tech.id && (job.scheduledDate === today || job.visitDate === today)).length;
          return (
            <Link key={tech.id} href={`/admin/techs/${tech.id}`} className="rounded-[10px] border border-[#e9e9ec] bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full text-sm text-white" style={{ background: tech.color }}>{tech.initials}</span>
                <div>
                  <p className="font-medium">{tech.name}</p>
                  <p className="text-xs text-[#71717a]">{tech.active ? "Active" : "Off"} · {load} today</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#3f3f46]">{tech.skills.join(" · ")}</p>
              <p className="mt-1 text-xs text-[#71717a]">{tech.licenses.join(", ")}</p>
              <p className="mt-1 text-xs text-[#71717a]">{tech.homeBase} · {tech.van}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
