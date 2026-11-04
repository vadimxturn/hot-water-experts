import { HomePage } from "@/components/landing/home";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const db = await getDb();
  return <HomePage settings={db.settings} />;
}
