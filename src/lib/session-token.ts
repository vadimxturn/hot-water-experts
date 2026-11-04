import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./types";

export interface SessionPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  techId?: string;
  title: string;
  initials: string;
}

function secret() {
  const value = process.env.AUTH_SECRET || "dev-only-hwe-demo-secret-change-me";
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function readSession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || !payload.email || !payload.role) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name ?? ""),
      role: payload.role as Role,
      techId: payload.techId ? String(payload.techId) : undefined,
      title: String(payload.title ?? ""),
      initials: String(payload.initials ?? ""),
    };
  } catch {
    return null;
  }
}
