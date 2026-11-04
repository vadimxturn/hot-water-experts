"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, signInWithPassword, signOut } from "@/lib/auth";
import * as repo from "@/lib/repo";
import type { FieldStatus, JobStage, Lead, PermitStatus, Settings, SideState } from "@/lib/types";

async function clientIp() {
  const headerList = await headers();
  return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
}

async function requireOffice() {
  const session = await getSession();
  if (!session || session.role === "tech") throw new Error("Office sign-in required");
  return session;
}

async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("Sign in required");
  return session;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");
  const session = await signInWithPassword(email, password);
  if (!session) {
    const params = new URLSearchParams({ error: "1" });
    if (next) params.set("next", next);
    redirect(`/login?${params.toString()}`);
  }
  if (session.role === "tech") redirect(next.startsWith("/tech") ? next : "/tech");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}

export async function createLeadAction(input: { zip: string }) {
  return repo.createLead({ zip: input.zip, step: 1, summary: `ZIP ${input.zip}` }, await clientIp());
}

export async function updateLeadAction(leadId: string, patch: Partial<Lead>) {
  return repo.updateLead(leadId, patch, await clientIp());
}

export async function bookLeadAction(
  leadId: string,
  input: {
    name: string;
    email: string;
    phone: string;
    smsConsent: boolean;
    depositAck: boolean;
    tier?: Lead["tier"];
    installDate?: string;
    window?: string;
    saveOnly?: boolean;
  },
) {
  return repo.bookLead(leadId, input, await clientIp());
}

export async function newJobAction() {
  const session = await requireOffice();
  const jobId = await repo.createDraftJob(session.name);
  redirect(`/admin/jobs/${jobId}`);
}

export async function syncGhlAction() {
  const session = await requireOffice();
  return repo.syncGhlNow(session.name);
}

export async function moveJobAction(jobId: string, stage: JobStage) {
  const session = await requireOffice();
  await repo.moveJob(jobId, stage, session.name);
}

export async function setSideAction(jobId: string, side: SideState) {
  const session = await requireOffice();
  await repo.setSide(jobId, side, session.name);
}

export async function assignJobAction(jobId: string, date: string, techId: string | undefined, window?: string) {
  const session = await requireOffice();
  await repo.assignJob(jobId, date, techId || undefined, window, session.name);
}

export async function saveSettingsAction(patch: Partial<Settings>) {
  const session = await requireOffice();
  await repo.updateSettings(patch, session.name);
}

export async function saveTemplateAction(key: string, body: string, enabled: boolean) {
  const session = await requireOffice();
  await repo.updateTemplate(key, body, enabled, session.name);
}

export async function addStaffAction(formData: FormData) {
  const session = await requireOffice();
  await repo.addStaff(
    {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      role: String(formData.get("role") || "office") as "admin" | "office" | "tech",
      title: String(formData.get("title") || "Staff"),
    },
    session.name,
  );
}

export async function toggleTechAction(techId: string, active: boolean) {
  const session = await requireOffice();
  await repo.setTechActive(techId, active, session.name);
}

export async function setPermitStatusAction(jobId: string, status: PermitStatus) {
  const session = await requireOffice();
  await repo.setPermitStatus(jobId, status, session.name);
}

export async function setInspectionAction(inspectionId: string, result: "pass" | "fail" | "scheduled", date?: string) {
  const session = await requireOffice();
  await repo.setInspectionResult(inspectionId, result, date, session.name);
}

export async function techStatusAction(jobId: string, status: FieldStatus, coords?: { lat: number; lng: number }) {
  const session = await requireUser();
  return repo.techSetStatus(jobId, status, session.name, coords);
}

export async function addPhotoAction(jobId: string, category: string, filename: string) {
  await requireUser();
  await repo.addJobPhoto(jobId, category, filename);
}

export async function saveSignatureAction(jobId: string, dataUrl: string, serial?: string) {
  await requireUser();
  await repo.saveSignature(jobId, dataUrl, serial);
}

export async function rescheduleAction(token: string, note: string) {
  await repo.requestReschedule(token, note);
}

export async function resetDemoAction() {
  const session = await requireOffice();
  if (session.role !== "admin") throw new Error("Admin only");
  await repo.resetDemo(session.name);
  redirect("/admin/settings");
}

export async function updateCustomerAction(customerId: string, formData: FormData) {
  await requireOffice();
  await repo.updateCustomer(
    customerId,
    {
      name: String(formData.get("name") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
    },
    String(formData.get("address") || ""),
  );
}
