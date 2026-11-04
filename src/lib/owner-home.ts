import { earliestBookable, mondayOf } from "./availability";
import { addDays, agingDays, formatDate, monthLabel, weekdayShort } from "./format";
import { jobBundle, officeToday, permitAge, todayAppointments } from "./queries";
import type { Database, Job, Lead, Payment } from "./types";

/**
 * Owner home figures.
 *
 * "records" means the number is counted from leads, jobs, payments, permits,
 * inspections, or the schedule in the office file.
 * "missing" means the app has no field for it. Those stay blank. The design
 * mock's $186.4K / 75 jobs / 4.9 rating are not used as stand-ins.
 */

export type RangePreset = "this-month" | "last-month" | "this-week" | "custom";

export interface OfficeRange {
  preset: RangePreset;
  from: string;
  to: string;
  priorFrom: string;
  priorTo: string;
  label: string;
  spanLabel: string;
  compare: string;
  monthTitle: string;
}

export interface Trend {
  label: string;
  tone: "up" | "down" | "flat";
}

export interface KpiCard {
  id: string;
  label: string;
  value: string;
  missing: boolean;
  tag?: string;
  trend?: Trend;
  spark: number[];
  sparkTone: "blue" | "red" | "green" | "gray";
  sparkFill: boolean;
}

export interface ChartModel {
  id: "revenue" | "jobs" | "leads" | "close";
  tab: string;
  headline: string;
  caption: string;
  trend?: Trend;
  primary: number[];
  secondary?: number[];
  primaryName: string;
  secondaryName?: string;
  yMax: number;
  yLabels: string[];
  startLabel: string;
  midLabel: string;
  endLabel: string;
}

export interface MixSlice {
  id: string;
  label: string;
  pct: number;
  amount: number;
  color: string;
}

export interface FlowStage {
  id: string;
  label: string;
  count: number;
  meta: string;
  tone: "muted" | "warn" | "bad";
  href: string;
}

export interface ScheduleStop {
  id: string;
  time: string;
  name: string;
  meta: string;
  href: string;
  tech?: { initials: string; name: string };
  status: string;
  statusTone: "enroute" | "onsite" | "scheduled" | "inspection";
}

export interface AttentionRow {
  id: string;
  title: string;
  detail: string;
  age: string;
  tone: "bad" | "warn" | "info";
  href: string;
}

export interface SourceNote {
  id: string;
  label: string;
  state: "records" | "missing";
  detail: string;
}

export interface OwnerHome {
  range: OfficeRange;
  sampleData: boolean;
  kpis: KpiCard[];
  charts: ChartModel[];
  mix: MixSlice[];
  mixTotal: number;
  sla: { within: number; total: number };
  flow: FlowStage[];
  schedule: ScheduleStop[];
  scheduleWhen: string;
  techLoads: { label: string; text: string }[];
  nextOpenLabel: string;
  attention: AttentionRow[];
  attentionTotal: number;
  sales: {
    leadsToday: number;
    leadsWeek: number;
    quotesWaiting: number;
    sources: { label: string; count: number }[];
  };
  ops: {
    permitsWaiting: number;
    permitsOld: number;
    inspections: number;
    inspectionsNote: string;
    installUsed: number;
    installCap: number;
  };
  sources: SourceNote[];
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const SLA_DAYS = 7;

const PRESET_LABEL: Record<RangePreset, string> = {
  "this-month": "This month",
  "last-month": "Last month",
  "this-week": "This week",
  custom: "Custom",
};

export function greetingFor(name: string, now = new Date()) {
  const hourPart = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now).find((part) => part.type === "hour")?.value;
  const hour = Number(hourPart ?? "12") % 24;
  const part = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  const first = name.trim().split(/\s+/)[0] || "there";
  return `Good ${part}, ${first}`;
}

export function resolveRange(today: string, preset?: string, from?: string, to?: string): OfficeRange {
  const choice = preset === "last-month" || preset === "this-week" || preset === "custom" ? preset : "this-month";
  let start = monthStart(today);
  let end = monthEnd(today);
  if (choice === "last-month") {
    start = shiftMonth(today, -1);
    end = monthEnd(start);
  } else if (choice === "this-week") {
    start = mondayOf(today);
    end = addDays(start, 6);
  } else if (choice === "custom" && from && to && ISO.test(from) && ISO.test(to)) {
    start = from <= to ? from : to;
    end = from <= to ? to : from;
  }
  const prior = priorWindow(start, end);
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  return {
    preset: choice === "custom" && !(from && to && ISO.test(from) && ISO.test(to)) ? "this-month" : choice,
    from: start,
    to: end,
    priorFrom: prior.priorFrom,
    priorTo: prior.priorTo,
    label: PRESET_LABEL[choice === "custom" && !(from && to && ISO.test(from) && ISO.test(to)) ? "this-month" : choice],
    spanLabel: spanLabel(start, end),
    compare: prior.compare,
    monthTitle: sameMonth ? monthLabel(start) : spanLabel(start, end),
  };
}

export function buildOwnerHome(db: Database, range: OfficeRange): OwnerHome {
  const today = officeToday(db);
  const weekStart = mondayOf(today);
  const weekEnd = addDays(weekStart, 6);
  const days = eachDay(range.from, range.to);

  const currentJobs = bookedJobs(db, range.from, range.to);
  const priorJobs = bookedJobs(db, range.priorFrom, range.priorTo);
  const revenue = sum(currentJobs.map((job) => job.total));
  const priorRevenue = sum(priorJobs.map((job) => job.total));
  const collected = collectedOn(db, range.from, range.to);
  const priorCollected = collectedOn(db, range.priorFrom, range.priorTo);
  const stripeLive = db.payments.some((row) => row.provider === "stripe" && row.status === "paid");
  const ticket = currentJobs.length ? revenue / currentJobs.length : null;
  const priorTicket = priorJobs.length ? priorRevenue / priorJobs.length : null;

  const leadsNow = db.leads.filter((lead) => inRange(lead.createdAt, range.from, range.to));
  const leadsPrior = db.leads.filter((lead) => inRange(lead.createdAt, range.priorFrom, range.priorTo));
  const closeNow = closeRate(db, range.from, range.to);
  const closePrior = closeRate(db, range.priorFrom, range.priorTo);

  const revenueByDay = days.map((day) => sum(bookedJobs(db, day, day).map((job) => job.total)));
  const collectedByDay = days.map((day) => collectedOn(db, day, day).amount);
  const jobsByDay = days.map((day) => bookedJobs(db, day, day).length);
  const leadsByDay = days.map((day) => db.leads.filter((lead) => lead.createdAt.slice(0, 10) === day).length);
  const quotesByDay = days.map((day) => db.leads.filter((lead) => lead.createdAt.slice(0, 10) === day && lead.status === "quoted").length);
  const revenueCum = cumulative(revenueByDay);
  const collectedCum = cumulative(collectedByDay);
  const jobsCum = cumulative(jobsByDay);
  const leadsCum = cumulative(leadsByDay);
  const closeSeries = runningClose(jobsByDay, quotesByDay);
  const ticketSeries = revenueCum.map((value, index) => (jobsCum[index] ? value / jobsCum[index] : 0));

  const compare = range.compare;
  const revenueTrend = changeTrend(revenue, priorRevenue, compare, "percent");
  const collectedTrend = changeTrend(collected.amount, priorCollected.amount, compare, "percent");
  const ticketTrend = ticket == null ? undefined : changeTrend(ticket, priorTicket ?? 0, compare, "percent");
  const jobsTrend = changeTrend(currentJobs.length, priorJobs.length, compare, "percent");
  const leadsTrend = changeTrend(leadsNow.length, leadsPrior.length, compare, "percent");
  const closeTrend = closeNow.rate == null ? undefined : changeTrend(closeNow.rate, closePrior.rate ?? 0, compare, "points");

  const kpis: KpiCard[] = [
    kpi("revenue-booked", "Revenue booked", moneyCompact(revenue), false, revenueTrend, revenueCum, trendTone(revenueTrend, "blue"), true),
    kpi(
      "collected",
      "Collected",
      moneyCompact(collected.amount),
      false,
      collectedTrend,
      collectedCum,
      trendTone(collectedTrend, "blue"),
      false,
      stripeLive ? undefined : "Stripe not connected",
    ),
    kpi("average-ticket", "Average ticket", ticket == null ? "None" : moneyCompact(ticket), false, ticketTrend, ticketSeries, "gray", false),
    kpi("jobs-booked", "Jobs booked", String(currentJobs.length), false, jobsTrend, jobsCum, trendTone(jobsTrend, "blue"), false),
    kpi("new-leads", "New leads", String(leadsNow.length), false, leadsTrend, leadsCum, trendTone(leadsTrend, "blue"), false),
    kpi("quote-to-booked", "Quote to booked", closeNow.rate == null ? "None" : formatPct(closeNow.rate), false, closeTrend, closeSeries, trendTone(closeTrend, "blue"), false),
    missingKpi("speed-to-lead", "Speed to lead"),
    missingKpi("gross-margin", "Gross margin"),
  ];

  const axisLabels = axisEnds(days);
  const charts: ChartModel[] = [
    chart("revenue", "Revenue", moneyFull(revenue), `Revenue booked vs collected · ${range.monthTitle}`, revenueTrend, revenueCum, collectedCum, "Booked", "Collected", "money", axisLabels),
    chart("jobs", "Jobs", String(currentJobs.length), `Jobs booked · ${range.monthTitle}`, jobsTrend, jobsCum, undefined, "Jobs booked", undefined, "count", axisLabels),
    chart("leads", "Leads", String(leadsNow.length), `New leads · ${range.monthTitle}`, leadsTrend, leadsCum, undefined, "New leads", undefined, "count", axisLabels),
    chart("close", "Close rate", closeNow.rate == null ? "None" : formatPct(closeNow.rate), `Quote to booked · ${range.monthTitle}`, closeTrend, closeSeries, undefined, "Close rate", undefined, "percent", axisLabels),
  ];

  const mix = jobMix(currentJobs);
  const sla = permitSla(db, today);
  const flow = jobFlow(db, today, weekStart, weekEnd);
  const schedule = scheduleStops(db);
  const techLoads = techLoadRows(db);
  const attention = attentionRows(db, today);
  const inspections = inspectionSnapshot(db, weekStart, weekEnd);
  const installCap = db.techs.filter((tech) => tech.active).reduce((total, tech) => total + tech.maxPerDay, 0);
  const installUsed = db.jobs.filter((job) => job.scheduledDate === today && job.side !== "cancelled" && job.visitKind !== "inspection" && job.stage !== "inspected").length;

  const sources: SourceNote[] = [
    { id: "revenue-booked", label: "Revenue booked", state: "records", detail: "Sum of job totals for jobs whose deposit date falls in the range. Cancelled jobs are left out." },
    { id: "collected", label: "Collected", state: "records", detail: stripeLive ? "Paid deposits and finals in the range, minus refunds. Due invoices are not counted." : "Deposit, final, and refund rows on the office ledger, minus anything still due. Stripe is not connected, so this is not card money that has settled." },
    { id: "average-ticket", label: "Average ticket", state: "records", detail: "Revenue booked divided by jobs booked in the range." },
    { id: "jobs-booked", label: "Jobs booked", state: "records", detail: "Jobs with a deposit date in the range." },
    { id: "new-leads", label: "New leads", state: "records", detail: "Leads created in the range." },
    { id: "quote-to-booked", label: "Quote to booked", state: "records", detail: "Jobs booked in the range, divided by those jobs plus leads created in the range that are still Quoted. Leads are not linked to jobs, so this is an office-file ratio." },
    { id: "speed-to-lead", label: "Speed to lead", state: "missing", detail: "No first-response time is stored on a lead. The 11 minute figure from the design is not shown." },
    { id: "gross-margin", label: "Gross margin", state: "missing", detail: "Jobs have a price and no cost. Margin is not invented." },
    { id: "mix", label: "Revenue by job type", state: "records", detail: "Booked job totals in the range, grouped from the job summary into tank, tankless, heat pump, or repair." },
    { id: "sla", label: "Permits within SLA", state: "records", detail: "Open permit-stage jobs at or under 7 days from the apply date, or already issued. This is the live board, not the month picker." },
    { id: "flow", label: "Job flow", state: "records", detail: "Current open leads and jobs by stage, with age against a 7-day SLA. This is the live board, not the month picker." },
    { id: "schedule", label: "Today's schedule", state: "records", detail: "Jobs whose install or visit date is the office date." },
    { id: "attention", label: "Needs attention", state: "records", detail: "Permits not issued, failed inspections, quoted leads waiting 5 days or more, and bookings with no deposit. Oldest serious items first." },
    { id: "leads-today", label: "Leads today and this week", state: "records", detail: "Leads created on the office date, and inside the office week (Monday to Sunday)." },
    { id: "sources", label: "Lead sources", state: "records", detail: "Lead source field for leads created in the selected range." },
    { id: "quotes-waiting", label: "Quotes waiting", state: "records", detail: "Leads whose status is Quoted right now." },
    { id: "cost-per-lead", label: "Cost per lead", state: "missing", detail: "No ad-spend account is connected. The $42 figure from the design is not shown." },
    { id: "permits", label: "Permits waiting", state: "records", detail: "Jobs in the permit stage, and how many have been waiting more than 7 days." },
    { id: "inspections", label: "Inspections", state: "records", detail: "Inspections dated this office week, plus any still not booked. Failed count is inspections with a fail result." },
    { id: "capacity", label: "Install capacity", state: "records", detail: "Installs on the office date, against each active tech's daily cap." },
    { id: "callbacks", label: "Callbacks and warranty", state: "missing", detail: "No callback or warranty record exists. Nothing is counted." },
    { id: "reputation", label: "Reputation", state: "missing", detail: "No review feed is connected. Ratings, review counts, and ask rate are not shown." },
  ];

  return {
    range,
    sampleData: db.settings.sampleData,
    kpis,
    charts,
    mix,
    mixTotal: revenue,
    sla,
    flow,
    schedule,
    scheduleWhen: `${schedule.length} ${schedule.length === 1 ? "job" : "jobs"} · ${weekdayShort(today)}, ${formatDate(today)}`,
    techLoads,
    nextOpenLabel: `${weekdayShort(earliestBookable(db))}, ${formatDate(earliestBookable(db))}`,
    attention: attention.rows,
    attentionTotal: attention.total,
    sales: {
      leadsToday: db.leads.filter((lead) => lead.createdAt.slice(0, 10) === today).length,
      leadsWeek: db.leads.filter((lead) => inRange(lead.createdAt, weekStart, weekEnd)).length,
      quotesWaiting: db.leads.filter((lead) => lead.status === "quoted").length,
      sources: sourceCounts(leadsNow),
    },
    ops: {
      permitsWaiting: db.jobs.filter((job) => job.stage === "permit" && job.side !== "cancelled").length,
      permitsOld: db.jobs.filter((job) => job.stage === "permit" && job.side !== "cancelled" && !permitWithinSla(db, job, today)).length,
      inspections: inspections.count,
      inspectionsNote: inspections.note,
      installUsed,
      installCap,
    },
    sources,
  };
}

function kpi(
  id: string,
  label: string,
  value: string,
  missing: boolean,
  trend: Trend | undefined,
  spark: number[],
  sparkTone: KpiCard["sparkTone"],
  sparkFill: boolean,
  tag?: string,
): KpiCard {
  return { id, label, value, missing, tag, trend, spark, sparkTone, sparkFill };
}

function missingKpi(id: string, label: string): KpiCard {
  return { id, label, value: "Not connected", missing: true, spark: [], sparkTone: "gray", sparkFill: false };
}

function chart(
  id: ChartModel["id"],
  tab: string,
  headline: string,
  caption: string,
  trend: Trend | undefined,
  primary: number[],
  secondary: number[] | undefined,
  primaryName: string,
  secondaryName: string | undefined,
  kind: "money" | "count" | "percent",
  labels: { start: string; mid: string; end: string },
): ChartModel {
  const peak = Math.max(...primary, ...(secondary ?? []), 0);
  const yMax = kind === "percent" ? 100 : niceMax(peak);
  return {
    id,
    tab,
    headline,
    caption,
    trend,
    primary,
    secondary,
    primaryName,
    secondaryName,
    yMax,
    yLabels: yTicks(yMax, kind),
    startLabel: labels.start,
    midLabel: labels.mid,
    endLabel: labels.end,
  };
}

function bookedJobs(db: Database, from: string, to: string) {
  return db.jobs.filter((job) => job.side !== "cancelled" && !!job.depositPaidAt && inRange(job.depositPaidAt, from, to));
}

function collectedOn(db: Database, from: string, to: string) {
  const rows = db.payments.filter((row) => row.at && inRange(row.at, from, to));
  return { amount: sum(rows.map(signedAmount)), rows };
}

function signedAmount(payment: Payment) {
  if (payment.status === "due") return 0;
  if (payment.kind === "refund" || payment.status === "refunded") return -Math.abs(payment.amount);
  if (payment.status === "paid" || payment.status === "stubbed") return payment.amount;
  return 0;
}

function closeRate(db: Database, from: string, to: string) {
  const wins = bookedJobs(db, from, to).length;
  const quotes = db.leads.filter((lead) => inRange(lead.createdAt, from, to) && lead.status === "quoted").length;
  const denom = wins + quotes;
  return { rate: denom === 0 ? null : (wins / denom) * 100, wins, quotes };
}

function runningClose(wins: number[], quotes: number[]) {
  let won = 0;
  let open = 0;
  return wins.map((win, index) => {
    won += win;
    open += quotes[index] ?? 0;
    const denom = won + open;
    return denom === 0 ? 0 : (won / denom) * 100;
  });
}

function jobMix(jobs: Job[]): MixSlice[] {
  const buckets = [
    { id: "tank", label: "Tank", color: "#367AF4", amount: 0 },
    { id: "tankless", label: "Tankless", color: "#7AA4F8", amount: 0 },
    { id: "heat_pump", label: "Heat pump", color: "#B6CBF9", amount: 0 },
    { id: "repair", label: "Repair", color: "#D1D5DB", amount: 0 },
  ];
  for (const job of jobs) {
    const family = jobFamily(job);
    const bucket = buckets.find((row) => row.id === family);
    if (bucket) bucket.amount += job.total;
  }
  const pcts = largestRemainder(buckets.map((row) => row.amount), 100);
  return buckets.map((row, index) => ({ ...row, pct: pcts[index] ?? 0 }));
}

export function jobFamily(job: Pick<Job, "summary" | "newUnit" | "existingUnit">) {
  const text = `${job.summary} ${job.newUnit} ${job.existingUnit}`.toLowerCase();
  if (text.includes("heat pump") || text.includes("hpwh")) return "heat_pump" as const;
  if (text.includes("tankless")) return "tankless" as const;
  if (/\brepair\b|\bcallback\b|\bwarranty\b/.test(text)) return "repair" as const;
  return "tank" as const;
}

function permitWithinSla(db: Database, job: Job, today: string) {
  const permit = db.permits.find((row) => row.jobId === job.id);
  if (permit && ["issued", "inspection_scheduled", "passed", "closed"].includes(permit.status)) return true;
  const age = permit?.appliedAt ? agingDays(permit.appliedAt, today) : permitAge(db, job.id);
  return age <= SLA_DAYS;
}

function permitSla(db: Database, today: string) {
  const open = db.jobs.filter((job) => job.stage === "permit" && job.side !== "cancelled");
  return { total: open.length, within: open.filter((job) => permitWithinSla(db, job, today)).length };
}

function jobFlow(db: Database, today: string, weekStart: string, weekEnd: string): FlowStage[] {
  const openLeads = db.leads.filter((lead) => lead.status === "new" || lead.status === "contacted");
  const quoted = db.leads.filter((lead) => lead.status === "quoted");
  const booked = db.jobs.filter((job) => job.stage === "scheduled" && job.side !== "cancelled");
  const permits = db.jobs.filter((job) => job.stage === "permit" && job.side !== "cancelled");
  const installed = db.jobs.filter((job) => job.stage === "installed" && job.side !== "cancelled");
  const inspected = db.jobs.filter((job) => job.stage === "inspected" && job.side !== "cancelled");
  const leadAges = openLeads.map((lead) => agingDays(lead.createdAt, today));
  const quoteAges = quoted.map((lead) => agingDays(lead.createdAt, today));
  const bookedAges = booked.map((job) => agingDays(job.createdAt, today));
  const quotesOver = quoteAges.filter((age) => age > SLA_DAYS).length;
  const permitsOver = permits.filter((job) => !permitWithinSla(db, job, today)).length;
  const next = booked.map((job) => job.scheduledDate).filter((date): date is string => !!date && date >= today).sort()[0];
  const closedThisWeek = inspected.filter((job) => job.installedAt && inRange(job.installedAt, weekStart, weekEnd)).length;
  const waiting = installed.filter((job) => {
    const rows = db.inspections.filter((row) => row.jobId === job.id);
    return rows.length === 0 || rows.some((row) => row.result !== "pass");
  }).length;
  return [
    { id: "lead", label: "Lead", count: openLeads.length, meta: `avg ${oneDecimal(avg(leadAges))}d · oldest ${Math.max(0, ...leadAges, 0)}d`, tone: "muted", href: "/admin/leads" },
    { id: "quoted", label: "Quoted", count: quoted.length, meta: `avg ${oneDecimal(avg(quoteAges))}d · ${quotesOver} over SLA`, tone: quotesOver ? "warn" : "muted", href: "/admin/leads" },
    { id: "booked", label: "Booked", count: booked.length, meta: next ? `avg ${oneDecimal(avg(bookedAges))}d · next ${formatDate(next)}` : `avg ${oneDecimal(avg(bookedAges))}d`, tone: "muted", href: "/admin/pipeline" },
    { id: "permit", label: "Permit", count: permits.length, meta: permitsOver ? `${permitsOver} over 7 days` : "within 7-day SLA", tone: permitsOver ? "bad" : "muted", href: "/admin/permits" },
    { id: "installed", label: "Installed", count: installed.length, meta: waiting ? "awaiting inspection" : "inspections passed", tone: "muted", href: "/admin/inspections" },
    { id: "inspected", label: "Inspected", count: inspected.length, meta: `${closedThisWeek} closed this week`, tone: "muted", href: "/admin/jobs" },
  ];
}

function scheduleStops(db: Database): ScheduleStop[] {
  return todayAppointments(db).map((job) => {
    const bundle = jobBundle(db, job);
    const today = officeToday(db);
    const time = job.visitDate === today ? job.visitWindow || job.window || "" : job.window || "";
    const inspection = job.visitKind === "inspection" && job.visitDate === today;
    const tone: ScheduleStop["statusTone"] = inspection
      ? "inspection"
      : job.fieldStatus === "en_route"
        ? "enroute"
        : job.fieldStatus === "arrived" || job.fieldStatus === "installing"
          ? "onsite"
          : "scheduled";
    const status = inspection ? "Inspection" : tone === "enroute" ? "En route" : tone === "onsite" ? "On site" : "Scheduled";
    return {
      id: job.id,
      time,
      name: bundle.customer.name,
      meta: `${job.id} · ${bundle.property.city} · ${job.summary}`,
      href: `/admin/jobs/${job.id}`,
      tech: bundle.tech ? { initials: bundle.tech.initials, name: bundle.tech.firstName } : undefined,
      status,
      statusTone: tone,
    };
  });
}

function techLoadRows(db: Database) {
  const stops = todayAppointments(db);
  return db.techs.filter((tech) => tech.active).map((tech) => {
    const load = stops.filter((job) => job.techId === tech.id).length;
    return { label: tech.firstName, text: `${load}/${tech.maxPerDay}` };
  });
}

function attentionRows(db: Database, today: string) {
  const rows: Array<AttentionRow & { days: number; rank: number }> = [];
  for (const job of db.jobs.filter((row) => row.stage === "permit" && row.side !== "cancelled")) {
    const permit = db.permits.find((row) => row.jobId === job.id);
    if (permit && ["issued", "inspection_scheduled", "passed", "closed"].includes(permit.status)) continue;
    const bundle = jobBundle(db, job);
    const days = permit?.appliedAt ? agingDays(permit.appliedAt, today) : agingDays(job.createdAt, today);
    const over = days > SLA_DAYS;
    rows.push({
      id: `permit-${job.id}`,
      title: "Permit not issued",
      detail: `${job.id} · ${bundle.jurisdiction?.name ?? bundle.property.city}`,
      age: ageLabel(days),
      tone: over ? "bad" : "warn",
      href: `/admin/permits/job/${job.id}`,
      days,
      rank: over ? 0 : 1,
    });
  }
  for (const inspection of db.inspections.filter((row) => row.result === "fail")) {
    const job = db.jobs.find((row) => row.id === inspection.jobId);
    if (!job) continue;
    const days = inspection.date ? agingDays(inspection.date, today) : 0;
    rows.push({
      id: `fail-${inspection.id}`,
      title: "Failed inspection",
      detail: `${job.id} · correction needed`,
      age: ageLabel(days),
      tone: "bad",
      href: `/admin/jobs/${job.id}`,
      days,
      rank: 0,
    });
  }
  for (const lead of db.leads.filter((row) => row.status === "quoted")) {
    const days = agingDays(lead.createdAt, today);
    if (days < 5) continue;
    rows.push({
      id: `quote-${lead.id}`,
      title: "Quote waiting on follow-up",
      detail: `${lead.name || "Unnamed lead"}${lead.quoteLow ? ` · ${moneyFull(lead.quoteLow)} quote` : ""}`,
      age: ageLabel(days),
      tone: "warn",
      href: `/admin/leads?lead=${lead.id}`,
      days,
      rank: 1,
    });
  }
  for (const job of db.jobs.filter((row) => row.side !== "cancelled" && !row.depositPaidAt && (row.stage === "scheduled" || row.stage === "permit"))) {
    const bundle = jobBundle(db, job);
    const days = agingDays(job.createdAt, today);
    rows.push({
      id: `deposit-${job.id}`,
      title: "Deposit missing",
      detail: `${job.id} · ${bundle.customer.name}`,
      age: ageLabel(days),
      tone: "warn",
      href: `/admin/jobs/${job.id}`,
      days,
      rank: 1,
    });
  }
  rows.sort((a, b) => a.rank - b.rank || b.days - a.days);
  const serious = rows.filter((row) => row.rank === 0).length;
  const visible = rows.slice(0, Math.max(6, serious));
  return {
    total: rows.length,
    rows: visible.map((row) => ({
      id: row.id,
      title: row.title,
      detail: row.detail,
      age: row.age,
      tone: row.tone,
      href: row.href,
    })),
  };
}

function inspectionSnapshot(db: Database, weekStart: string, weekEnd: string) {
  const dated = db.inspections.filter((row) => row.date && row.date >= weekStart && row.date <= weekEnd && row.result !== "pass" && row.result !== "fail");
  const notBooked = db.inspections.filter((row) => row.result === "not_booked").length;
  const failed = db.inspections.filter((row) => row.result === "fail").length;
  return { count: dated.length + notBooked, note: `${notBooked} not booked · ${failed} failed` };
}

function sourceCounts(leads: Lead[]) {
  const map = new Map<string, number>();
  for (const lead of leads) {
    const label = lead.source?.trim() || "Unknown";
    map.set(label, (map.get(label) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([label, count]) => ({ label, count }));
}

function changeTrend(current: number, prior: number, compare: string, mode: "percent" | "points"): Trend | undefined {
  if (current === 0 && prior === 0) return { label: `No change ${compare}`, tone: "flat" };
  if (prior === 0) return { label: compare.includes("month") ? "No prior month to compare" : "No prior period to compare", tone: "flat" };
  const delta = mode === "points" ? current - prior : ((current - prior) / Math.abs(prior)) * 100;
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) return { label: `No change ${compare}`, tone: "flat" };
  const tone: Trend["tone"] = rounded > 0 ? "up" : "down";
  const arrow = rounded > 0 ? "+" : "";
  const body = mode === "points" ? `${arrow}${rounded.toFixed(1)} pts ${compare}` : `${arrow}${rounded.toFixed(1)}% ${compare}`;
  return { label: body, tone };
}

function trendTone(trend: Trend | undefined, rising: "blue" | "green"): KpiCard["sparkTone"] {
  if (!trend || trend.tone === "flat") return "gray";
  if (trend.tone === "down") return "red";
  return rising;
}

function inRange(iso: string | undefined, from: string, to: string) {
  if (!iso) return false;
  const day = iso.slice(0, 10);
  return day >= from && day <= to;
}

function eachDay(from: string, to: string) {
  const days: string[] = [];
  let cursor = from;
  while (cursor <= to && days.length < 400) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

function monthStart(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

function monthEnd(iso: string) {
  const [year, month] = iso.slice(0, 7).split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${iso.slice(0, 7)}-${String(last).padStart(2, "0")}`;
}

function shiftMonth(iso: string, delta: number) {
  const [year, month] = iso.slice(0, 7).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function priorWindow(from: string, to: string) {
  if (from === monthStart(from) && to === monthEnd(from)) {
    const start = shiftMonth(from, -1);
    return { priorFrom: start, priorTo: monthEnd(start), compare: "vs prior month" };
  }
  const length = eachDay(from, to).length;
  const priorTo = addDays(from, -1);
  return { priorFrom: addDays(priorTo, -(length - 1)), priorTo, compare: "vs prior period" };
}

function spanLabel(from: string, to: string) {
  const start = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" }).format(new Date(`${from}T12:00:00`));
  const end = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${to}T12:00:00`));
  return `${start} to ${end}`;
}

function axisEnds(days: string[]) {
  const mid = days[Math.floor((days.length - 1) / 2)] ?? days[0];
  return { start: formatDate(days[0]), mid: formatDate(mid), end: formatDate(days[days.length - 1]) };
}

function cumulative(values: number[]) {
  let total = 0;
  return values.map((value) => (total += value));
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return sum(values) / values.length;
}

function oneDecimal(value: number) {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function ageLabel(days: number) {
  if (days <= 0) return "today";
  return `${days}d`;
}

function moneyFull(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.round(value));
}

export function moneyCompact(value: number) {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? "-" : "";
  const abs = Math.abs(rounded);
  if (abs >= 10000) {
    const thousands = abs / 1000;
    const text = Number.isInteger(thousands) ? thousands.toFixed(0) : thousands.toFixed(1);
    return `${sign}$${text}K`;
  }
  return `${sign}${moneyFull(abs)}`;
}

function formatPct(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`;
}

function niceMax(value: number) {
  if (value <= 0) return 4;
  const rough = value * 1.08;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const scaled = rough / pow;
  const nice = scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 2.5 ? 2.5 : scaled <= 5 ? 5 : 10;
  return nice * pow;
}

function yTicks(max: number, kind: "money" | "count" | "percent") {
  return [1, 0.75, 0.5, 0.25].map((step) => {
    const value = max * step;
    if (kind === "percent") return `${Math.round(value)}%`;
    if (kind === "money") {
      if (value >= 1000) {
        const thousands = value / 1000;
        return `${Number.isInteger(thousands) ? thousands.toFixed(0) : thousands.toFixed(1)}k`;
      }
      return String(Math.round(value));
    }
    return String(Math.round(value));
  });
}

function largestRemainder(weights: number[], target: number) {
  const total = sum(weights);
  if (total <= 0) return weights.map(() => 0);
  const raw = weights.map((weight) => (weight / total) * target);
  const floors = raw.map((value) => Math.floor(value));
  let left = target - sum(floors);
  const order = raw.map((value, index) => ({ index, frac: value - floors[index] })).sort((a, b) => b.frac - a.frac);
  for (const row of order) {
    if (left <= 0) break;
    floors[row.index] += 1;
    left -= 1;
  }
  return floors;
}
