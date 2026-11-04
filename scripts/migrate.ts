import fs from "fs";
import path from "path";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL is not set. Skipping Postgres migrate. The app will use the local demo store.");
    return;
  }
  const file = path.join(process.cwd(), "drizzle", "0001_init.sql");
  const sqlText = fs.readFileSync(file, "utf8");
  const sql = postgres(url, { max: 1 });
  await sql.unsafe(sqlText);
  await sql.end();
  console.log("Applied drizzle/0001_init.sql");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
