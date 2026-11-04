import "server-only";
import { getSession } from "./auth";
import { officeToday } from "./queries";
import { getDb } from "./store";
import type { SessionPayload } from "./session-token";
import type { Database } from "./types";

export async function techContext(): Promise<{ db: Database; session: SessionPayload; techId: string; today: string }> {
  const session = await getSession();
  if (!session) throw new Error("Sign in required");
  const db = await getDb();
  const techId = session.techId || "tech-a";
  return { db, session, techId, today: officeToday(db) };
}
