import fs from "fs";
import path from "path";
import { createSeed } from "../src/lib/seed";

async function main() {
  const db = createSeed();
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "store.json");
  fs.writeFileSync(file, JSON.stringify(db, null, 2));
  console.log(`Wrote ${file}`);
  console.log(
    `Demo clock ${db.settings.demoToday}. Jobs ${db.jobs.length}. Leads ${db.leads.length}. Staff ${db.staff.length}.`,
  );

  if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL is not set. Postgres was not seeded.");
    return;
  }
  const { savePg } = await import("../src/db/postgres");
  await savePg(db);
  console.log("Seeded Postgres app_state and normalized tables.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
