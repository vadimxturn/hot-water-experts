import "server-only";
import fs from "fs";
import path from "path";
import { createSeed } from "./seed";
import type { Database } from "./types";

let memory: Database | null = null;
let queue: Promise<void> = Promise.resolve();

function storeFile() {
  const localDir = path.join(process.cwd(), "data");
  try {
    fs.mkdirSync(localDir, { recursive: true });
    fs.accessSync(localDir, fs.constants.W_OK);
    return path.join(localDir, "store.json");
  } catch {
    return path.join("/tmp", "hwe-store.json");
  }
}

async function loadFile(): Promise<Database> {
  const file = storeFile();
  if (fs.existsSync(file)) {
    try {
      const parsed = JSON.parse(await fs.promises.readFile(file, "utf8")) as Database;
      memory = parsed;
      return parsed;
    } catch (error) {
      console.error("Demo store could not be read. Loading a fresh seed.", error);
    }
  }
  if (memory) return memory;
  memory = createSeed();
  return memory;
}

async function writeFile(db: Database) {
  memory = db;
  const file = storeFile();
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file, JSON.stringify(db));
}

export async function getDb(): Promise<Database> {
  if (process.env.DATABASE_URL) {
    const { loadPg } = await import("@/db/postgres");
    return loadPg();
  }
  return loadFile();
}

export async function saveDb(db: Database) {
  if (process.env.DATABASE_URL) {
    const { savePg } = await import("@/db/postgres");
    await savePg(db);
    return;
  }
  await writeFile(db);
}

export async function updateDb<T>(mutator: (db: Database) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const current = await getDb();
    const db = structuredClone(current);
    const result = await mutator(db);
    await saveDb(db);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function usingPostgres() {
  return Boolean(process.env.DATABASE_URL);
}
