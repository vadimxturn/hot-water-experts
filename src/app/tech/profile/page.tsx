import { logoutAction } from "@/server/actions";
import { techContext } from "@/lib/tech-view";

export const metadata = { title: "Profile" };

export default async function TechProfile() {
  const { db, techId, session } = await techContext();
  const tech = db.techs.find((row) => row.id === techId);
  return (
    <div className="px-4 py-4">
      <h1 className="font-sans text-2xl font-semibold">{tech?.name || session.name}</h1>
      <p className="mt-2 text-sm text-slate">{tech?.bio}</p>
      <p className="mt-3 text-sm">{tech?.licenses.join(", ")}</p>
      <p className="text-sm">{tech?.van}</p>
      <p className="mt-2 text-xs text-slate">Signed in as {session.email}</p>
      <form action={logoutAction} className="mt-6">
        <button className="office-btn office-btn-secondary" type="submit">Sign out</button>
      </form>
    </div>
  );
}
