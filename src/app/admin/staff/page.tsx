import { Pill, SampleChip } from "@/components/admin/ui";
import { formatDateTime } from "@/lib/format";
import { getDb } from "@/lib/store";
import { addStaffAction } from "@/server/actions";

export const metadata = { title: "Staff and roles" };

export default async function StaffPage() {
  const db = await getDb();
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      <div>
        <h1 className="font-sans text-xl font-semibold">Staff and roles <SampleChip /></h1>
        <p className="mb-4 text-sm text-[#71717a]">Roles: admin, office, tech. A permit VA uses the office role. Everyone shares the demo password.</p>
        <div className="overflow-hidden rounded-[10px] border border-[#e9e9ec] bg-white">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f4f4f5] text-xs text-[#71717a]"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Last active</th></tr></thead>
            <tbody>
              {db.staff.map((person) => (
                <tr key={person.id} className="border-t border-[#f4f4f5]">
                  <td className="px-3 py-2">{person.name}<span className="block text-[11px] text-[#71717a]">{person.title}</span></td>
                  <td className="px-3 py-2">{person.email}</td>
                  <td className="px-3 py-2"><Pill tone={person.role === "admin" ? "accent" : "neutral"}>{person.role}</Pill></td>
                  <td className="px-3 py-2 text-[#71717a]">{formatDateTime(person.lastActive)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <form action={addStaffAction} className="h-fit rounded-[10px] border border-[#e9e9ec] bg-white p-4 text-sm">
        <h2 className="font-semibold">Add a person</h2>
        <input name="name" required placeholder="Name" className="mt-3 h-8 w-full rounded-md border px-2" />
        <input name="email" type="email" required placeholder="Email" className="mt-2 h-8 w-full rounded-md border px-2" />
        <input name="title" placeholder="Title" className="mt-2 h-8 w-full rounded-md border px-2" />
        <select name="role" className="mt-2 h-8 w-full rounded-md border px-2">
          <option value="office">office</option>
          <option value="admin">admin</option>
          <option value="tech">tech</option>
        </select>
        <button className="office-btn office-btn-primary mt-3" type="submit">Add</button>
      </form>
    </div>
  );
}
