import "server-only";
import { cookies } from "next/headers";
import { getDb } from "./store";
import { readSession, signSession, type SessionPayload } from "./session-token";

const COOKIE = "hwe_session";

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return readSession(jar.get(COOKIE)?.value);
}

export async function signInWithPassword(email: string, password: string) {
  const expected = process.env.DEMO_PASSWORD || "demo";
  if (!safeEqual(password, expected)) return null;
  const db = await getDb();
  const staff = db.staff.find((person) => person.email.toLowerCase() === email.trim().toLowerCase() && person.active);
  if (!staff) return null;
  const payload: SessionPayload = {
    sub: staff.id,
    email: staff.email,
    name: staff.name,
    role: staff.role,
    techId: staff.techId,
    title: staff.title,
    initials: staff.initials,
  };
  const token = await signSession(payload);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return payload;
}

export async function signOut() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) mismatch |= left[i] ^ right[i];
  return mismatch === 0;
}
