import { agingDays, todayIso } from "./format";
import type { Database, Job, Lead } from "./types";

export function officeToday(db: Database) {
  return todayIso(db.settings.demoToday);
}

export function customerOf(db: Database, id: string) {
  const customer = db.customers.find((row) => row.id === id);
  if (!customer) throw new Error(`Missing customer ${id}`);
  return customer;
}

export function propertyOf(db: Database, id: string) {
  const property = db.properties.find((row) => row.id === id);
  if (!property) throw new Error(`Missing property ${id}`);
  return property;
}

export function techOf(db: Database, id?: string) {
  return db.techs.find((row) => row.id === id);
}

export function jurisdictionOf(db: Database, id?: string) {
  return db.jurisdictions.find((row) => row.id === id);
}

export function jobBundle(db: Database, job: Job) {
  const customer = customerOf(db, job.customerId);
  const property = propertyOf(db, job.propertyId);
  return {
    job,
    customer,
    property,
    tech: techOf(db, job.techId),
    jurisdiction: jurisdictionOf(db, property.jurisdictionId),
    permit: db.permits.find((row) => row.jobId === job.id),
    inspections: db.inspections.filter((row) => row.jobId === job.id),
    messages: db.messages.filter((row) => row.jobId === job.id),
    payments: db.payments.filter((row) => row.jobId === job.id),
  };
}

export function findJob(db: Database, id: string) {
  const job = db.jobs.find((row) => row.id === id);
  if (!job) return null;
  return jobBundle(db, job);
}

function windowStart(label?: string) {
  if (!label) return 99;
  if (label.startsWith("8")) return 8;
  if (label.startsWith("9")) return 9;
  if (label.startsWith("10")) return 10;
  if (label.startsWith("12")) return 12;
  if (label.startsWith("1")) return 13;
  if (label.startsWith("2")) return 14;
  return 99;
}

export function todayAppointments(db: Database) {
  const today = officeToday(db);
  const label = (job: Job) => (job.visitDate === today ? job.visitWindow : job.window);
  return db.jobs
    .filter((job) => job.scheduledDate === today || job.visitDate === today)
    .sort((a, b) => windowStart(label(a)) - windowStart(label(b)));
}

export function pipelineCounts(db: Database) {
  const lead = db.leads.filter((row) => row.status === "new" || row.status === "contacted").length;
  const quoted = db.leads.filter((row) => row.status === "quoted").length;
  const scheduled = db.jobs.filter((row) => row.stage === "scheduled").length;
  const permit = db.jobs.filter((row) => row.stage === "permit").length;
  const installed = db.jobs.filter((row) => row.stage === "installed").length;
  const inspected = db.jobs.filter((row) => row.stage === "inspected").length;
  return { lead, quoted, scheduled, permit, installed, inspected, open: lead + quoted + scheduled };
}

export function permitAge(db: Database, jobId: string) {
  const permit = db.permits.find((row) => row.jobId === jobId);
  return agingDays(permit?.appliedAt, officeToday(db));
}

export function oldPermits(db: Database) {
  return db.jobs.filter((job) => {
    if (job.stage !== "permit") return false;
    const permit = db.permits.find((row) => row.jobId === job.id);
    if (!permit) return false;
    if (["issued", "passed", "closed", "inspection_scheduled"].includes(permit.status)) return false;
    return permitAge(db, job.id) > 7;
  });
}

export function navCounts(db: Database) {
  const counts = pipelineCounts(db);
  const today = todayAppointments(db).length;
  return {
    leads: db.leads.filter((row) => row.status === "new").length,
    pipeline: counts.open,
    permits: counts.permit,
    permitsOld: oldPermits(db).length,
    today,
  };
}

export interface AlertItem {
  id: string;
  tone: "danger" | "warning" | "success" | "info";
  title: string;
  detail: string;
  href: string;
}

export function alerts(db: Database): AlertItem[] {
  const items: AlertItem[] = [];
  for (const job of oldPermits(db)) {
    const bundle = jobBundle(db, job);
    const age = permitAge(db, job.id);
    items.push({
      id: `permit-${job.id}`,
      tone: "danger",
      title: `Permit not issued in ${age} days`,
      detail: `${job.id} · ${bundle.jurisdiction?.name ?? bundle.property.city} · ${bundle.jurisdiction?.platform ?? "Portal"}`,
      href: `/admin/permits/job/${job.id}`,
    });
  }
  for (const inspection of db.inspections.filter((row) => row.result === "not_booked")) {
    const job = db.jobs.find((row) => row.id === inspection.jobId);
    if (!job) continue;
    const bundle = jobBundle(db, job);
    items.push({
      id: `insp-${inspection.id}`,
      tone: "warning",
      title: "Inspection not booked",
      detail: `${job.id} · ${bundle.property.city} · installed ${job.installedAt?.slice(0, 10) ?? ""}`,
      href: `/admin/inspections`,
    });
  }
  for (const inspection of db.inspections.filter((row) => row.result === "fail")) {
    const job = db.jobs.find((row) => row.id === inspection.jobId);
    if (!job) continue;
    const bundle = jobBundle(db, job);
    items.push({
      id: `fail-${inspection.id}`,
      tone: "danger",
      title: "Failed inspection, correction",
      detail: `${job.id} · ${bundle.property.city} · re-inspect needed`,
      href: `/admin/jobs/${job.id}`,
    });
  }
  items.push({
    id: "ghl",
    tone: db.settings.ghlHealthy ? "success" : "warning",
    title: db.settings.ghlHealthy ? "GHL sync healthy" : "GHL sync needs a look",
    detail: process.env.GHL_WEBHOOK_URL
      ? "Webhook is configured."
      : "Last sync is a stub. GHL_WEBHOOK_URL is empty. 0 errors in the sample log.",
    href: "/admin/settings",
  });
  return items;
}

export function searchIndex(db: Database) {
  const rows: { title: string; meta: string; href: string; group: string }[] = [];
  for (const job of db.jobs) {
    const bundle = jobBundle(db, job);
    rows.push({
      title: bundle.customer.name,
      meta: `${job.id} · ${bundle.property.city}`,
      href: `/admin/jobs/${job.id}`,
      group: "Jobs",
    });
  }
  for (const lead of db.leads) {
    rows.push({
      title: lead.name || "Unnamed lead",
      meta: `${lead.city || lead.zip} · ${lead.status}`,
      href: `/admin/leads?lead=${lead.id}`,
      group: "Leads",
    });
  }
  const pages = [
    ["Dashboard", "/admin"],
    ["Leads", "/admin/leads"],
    ["Pipeline", "/admin/pipeline"],
    ["Jobs", "/admin/jobs"],
    ["Day plan", "/admin/day-plan"],
    ["Calendar", "/admin/calendar"],
    ["Customers", "/admin/customers"],
    ["Permits", "/admin/permits"],
    ["Inspections", "/admin/inspections"],
    ["Payments", "/admin/payments"],
    ["Technicians", "/admin/techs"],
    ["Reports", "/admin/reports"],
    ["Staff", "/admin/staff"],
    ["Activity", "/admin/activity"],
    ["SMS templates", "/admin/sms"],
    ["Settings", "/admin/settings"],
  ];
  for (const [title, href] of pages) {
    rows.push({ title, meta: "Back office", href, group: "Navigate" });
  }
  return rows;
}

export function leadHeadline(lead: Lead) {
  return lead.summary || lead.name || "New lead";
}
