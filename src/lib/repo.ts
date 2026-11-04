import "server-only";
import { lookupZip } from "@/config/service-area";
import { business, installPhotoSlots } from "@/config/business";
import { firstTechWithRoom } from "./availability";
import { driveEta, sendSms, syncLeadToGhl, createDepositIntent } from "./integrations";
import { quoteFor } from "./pricing";
import { renderTemplate } from "./templates";
import { updateDb } from "./store";
import type { Database, FieldStatus, Job, JobStage, Lead, PermitStatus, Settings, SideState } from "./types";

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function nextJobNumber(db: Database) {
  const nums = db.jobs.map((job) => Number(job.id.replace(/\D/g, ""))).filter((value) => Number.isFinite(value));
  const next = Math.max(1000, ...nums) + 1;
  return `HWE-S-${next}`;
}

function log(db: Database, actor: string, action: string, entity: string, detail: string, href?: string) {
  db.activity.unshift({ id: id("act"), at: now(), actor, action, entity, detail, href });
}

export async function createLead(input: Partial<Lead> & { zip: string }, ip?: string) {
  return updateDb(async (db) => {
    const place = lookupZip(input.zip);
    const lead: Lead = {
      id: id("lead"),
      createdAt: now(),
      updatedAt: now(),
      status: "new",
      source: "Estimate funnel",
      name: input.name || "",
      phone: input.phone || "",
      email: input.email || "",
      zip: input.zip,
      city: "city" in place ? place.city : "",
      address: "",
      jurisdictionId: place.jurisdictionId,
      utility: place.utility,
      outOfArea: !place.inArea,
      zipNote: "note" in place ? place.note : undefined,
      situation: input.situation,
      currentType: input.currentType,
      location: input.location,
      age: input.age,
      nextType: input.nextType,
      people: input.people,
      bathrooms: input.bathrooms,
      timing: input.timing,
      photos: input.photos ?? [],
      readout: input.readout,
      tier: input.tier,
      payMethod: input.payMethod,
      installDate: input.installDate,
      window: input.window,
      smsConsent: false,
      depositAck: false,
      depositPaid: false,
      ip,
      summary: input.summary || `ZIP ${input.zip}`,
      step: input.step ?? 1,
    };
    lead.ghl = await syncLeadToGhl({ event: "lead.created", lead });
    db.leads.unshift(lead);
    log(db, "Funnel", "Lead created", lead.id, lead.ghl.detail, "/admin/leads");
    db.settings.ghlLastSync = lead.ghl.at;
    db.settings.ghlHealthy = lead.ghl.status !== "error";
    return lead;
  });
}

export async function updateLead(leadId: string, patch: Partial<Lead>, ip?: string) {
  return updateDb(async (db) => {
    const lead = db.leads.find((row) => row.id === leadId);
    if (!lead) throw new Error("Lead not found");
    Object.assign(lead, patch, { updatedAt: now() });
    if (ip) lead.ip = ip;
    if (patch.zip) {
      const place = lookupZip(patch.zip);
      lead.city = place.city;
      lead.jurisdictionId = place.jurisdictionId;
      lead.utility = place.utility;
      lead.outOfArea = !place.inArea;
      lead.zipNote = "note" in place ? place.note : undefined;
    }
    if (lead.currentType || lead.nextType) {
      const quote = quoteFor(db.settings, lead);
      if (quote.singleRange) {
        lead.quoteLow = quote.singleRange.low;
        lead.quoteHigh = quote.singleRange.high;
        lead.quoteLabel = quote.packageLabel;
      } else if (lead.tier) {
        const tier = quote.tiers.find((row) => row.tier === lead.tier) ?? quote.tiers[0];
        if (tier) {
          lead.quoteLow = tier.low;
          lead.quoteHigh = tier.high;
          lead.quoteLabel = `${tier.label}, ${quote.headline}`;
        }
      }
      if (lead.status === "new" && lead.quoteLow) lead.status = "quoted";
    }
    const parts = [lead.city, lead.summary].filter(Boolean);
    if (!patch.summary && lead.currentType) {
      lead.summary = [labelBit(lead.currentType), lead.city].filter(Boolean).join(" · ");
    }
    void parts;
    return lead;
  });
}

function labelBit(type?: string) {
  if (type === "gas_tank") return "Gas tank";
  if (type === "electric_tank") return "Electric tank";
  if (type === "tankless") return "Tankless";
  if (type === "heat_pump") return "Heat pump";
  return "";
}

export async function bookLead(
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
  ip?: string,
) {
  return updateDb(async (db) => {
    const lead = db.leads.find((row) => row.id === leadId);
    if (!lead) throw new Error("Lead not found");
    lead.name = input.name;
    lead.email = input.email;
    lead.phone = input.phone;
    lead.smsConsent = input.smsConsent;
    lead.smsConsentAt = input.smsConsent ? now() : undefined;
    lead.smsConsentText = input.smsConsent ? business.smsConsentText : undefined;
    lead.depositAck = input.depositAck;
    lead.tier = input.tier ?? lead.tier;
    lead.installDate = input.installDate ?? lead.installDate;
    lead.window = input.window ?? lead.window;
    lead.ip = ip || lead.ip;
    lead.updatedAt = now();

    const quote = quoteFor(db.settings, lead);
    const chosen =
      quote.tiers.find((row) => row.tier === lead.tier) ??
      quote.tiers.find((row) => row.tier === quote.recommended) ??
      quote.tiers[0];
    if (quote.singleRange) {
      lead.quoteLow = quote.singleRange.low;
      lead.quoteHigh = quote.singleRange.high;
      lead.quoteLabel = quote.packageLabel;
    } else if (chosen) {
      lead.quoteLow = chosen.low;
      lead.quoteHigh = chosen.high;
      lead.quoteLabel = `${chosen.label}, ${quote.headline}`;
      lead.tier = chosen.tier;
    }

    if (input.saveOnly || !lead.installDate) {
      lead.status = "quoted";
      lead.depositPaid = false;
      lead.ghl = await syncLeadToGhl({ event: "lead.quoted", lead });
      log(db, "Funnel", "Estimate saved", lead.name || lead.id, "No date booked.", `/admin/leads?lead=${lead.id}`);
      return { lead, job: null as Job | null };
    }

    const payment = await createDepositIntent(db.settings.depositAmount * 100);
    lead.depositPaid = true;
    lead.paymentMode = payment.mode === "stripe" ? "stripe" : "stub";
    lead.paymentRef = payment.ref;
    lead.status = "booked";

    const customerId = id("cust");
    const propertyId = id("prop");
    const [first, ...rest] = input.name.trim().split(/\s+/);
    db.customers.unshift({
      id: customerId,
      name: input.name.trim(),
      firstName: first || input.name,
      lastName: rest.join(" "),
      phone: input.phone,
      email: input.email,
      smsOptIn: input.smsConsent,
      prefers: input.smsConsent ? "Text messages" : "Email",
      createdAt: now(),
    });
    db.properties.unshift({
      id: propertyId,
      customerId,
      address: lead.address || `${lead.city || "Sacramento area"} (street address pending)`,
      city: lead.city || "Sacramento area",
      zip: lead.zip,
      lat: 38.58,
      lng: -121.49,
      apn: "Pending",
      jurisdictionId: lead.jurisdictionId || "sac-city",
      utility: lead.utility || "Utility to confirm",
      access: lead.location || "Confirm on arrival",
    });

    const tech = lead.installDate ? firstTechWithRoom(db, lead.installDate) : undefined;
    const total = chosen?.base ?? quote.singleRange?.low ?? lead.quoteLow ?? 0;
    const jobId = nextJobNumber(db);
    const token = id("trk");
    const job: Job = {
      id: jobId,
      customerId,
      propertyId,
      stage: "scheduled",
      side: "none",
      subStatus: "Deposit paid",
      source: "Estimate funnel",
      summary: lead.quoteLabel || quote.headline,
      tier: chosen?.label,
      lines: [{ label: lead.quoteLabel || quote.packageLabel, amount: total }],
      total,
      deposit: db.settings.depositAmount,
      depositPaidAt: now(),
      depositRef: payment.ref,
      balance: Math.max(0, total - db.settings.depositAmount),
      payMethod: lead.payMethod === "over_time" ? "Pay over time" : "Pay at install",
      scheduledDate: lead.installDate,
      window: lead.window,
      durationHours: 3,
      techId: tech?.id,
      createdAt: now(),
      existingUnit: labelBit(lead.currentType) || "See photos",
      newUnit: lead.quoteLabel || quote.packageLabel,
      addons: "Permit, straps, haul-away",
      smud: quote.packageKey.startsWith("hp_") ? "Check SMUD after install. Membership not confirmed." : "N/A",
      trackingToken: token,
      fieldStatus: "scheduled",
      photos: installPhotoSlots.map((slot) => ({
        id: slot.id,
        category: slot.id,
        label: slot.label,
        required: slot.required,
      })),
      scopeText: quote.headline,
    };
    db.jobs.unshift(job);
    lead.jobId = job.id;
    db.permits.unshift({
      id: id("permit"),
      jobId: job.id,
      jurisdictionId: lead.jurisdictionId || "sac-city",
      status: "needed",
      permitNumber: "Pending",
      feeLabel: "Fee from the jurisdiction table",
      feeAmount: db.jurisdictions.find((row) => row.id === lead.jurisdictionId)?.feeAmount ?? 0,
      license: business.licenseClass,
      cf1r: db.jurisdictions.find((row) => row.id === lead.jurisdictionId)?.cf1r ?? false,
      nextAction: "Build the packet and review the pre-fill",
      progress: "1 of 11",
      steps: [],
      docs: [],
      appliedAt: undefined,
    });
    db.payments.unshift({
      id: id("pay"),
      jobId: job.id,
      kind: "deposit",
      amount: db.settings.depositAmount,
      status: payment.mode === "stripe" ? "stubbed" : "stubbed",
      provider: payment.mode === "stripe" ? "stripe" : "stub",
      ref: payment.ref,
      at: now(),
      note: payment.mode === "stripe" ? "PaymentIntent created. Card capture is not completed in this screen." : "Demo deposit. No card was charged.",
    });
    db.payments.unshift({
      id: id("pay"),
      jobId: job.id,
      kind: "final",
      amount: job.balance,
      status: "due",
      provider: "stub",
      ref: "Due on install day",
    });

    const link = `/t/${token}`;
    if (input.smsConsent) {
      const template = db.templates.find((row) => row.key === "confirmed");
      const body = renderTemplate(template?.body || "You're booked. {{link}}", {
        day: lead.installDate || "",
        date: lead.installDate || "",
        window: lead.window || "",
        tech_first: tech?.firstName || "Your installer",
        link,
        office_phone: business.phone,
      });
      const sms = await sendSms(input.phone, body);
      db.messages.unshift({
        id: id("msg"),
        jobId: job.id,
        leadId: lead.id,
        customerId,
        templateKey: "confirmed",
        body,
        status: sms.status === "sent" ? "sent" : "stubbed",
        at: now(),
        channel: "sms",
      });
    }
    lead.ghl = await syncLeadToGhl({ event: "lead.booked", lead, jobId: job.id });
    log(db, "Funnel", "Booked", job.id, `${input.name} · ${lead.installDate} ${lead.window}`, `/admin/jobs/${job.id}`);
    return { lead, job };
  });
}

export async function moveJob(jobId: string, stage: JobStage, actor: string) {
  return updateDb(async (db) => {
    const job = db.jobs.find((row) => row.id === jobId);
    if (!job) throw new Error("Job not found");
    job.stage = stage;
    log(db, actor, "Stage changed", job.id, `Moved to ${stage}.`, `/admin/jobs/${job.id}`);
    return job;
  });
}

export async function setSide(jobId: string, side: SideState, actor: string) {
  return updateDb(async (db) => {
    const job = db.jobs.find((row) => row.id === jobId);
    if (!job) throw new Error("Job not found");
    job.side = side;
    log(db, actor, "Side state", job.id, side, `/admin/jobs/${job.id}`);
  });
}

export async function assignJob(jobId: string, date: string, techId: string | undefined, window: string | undefined, actor: string) {
  return updateDb(async (db) => {
    const job = db.jobs.find((row) => row.id === jobId);
    if (!job) throw new Error("Job not found");
    job.scheduledDate = date;
    if (window) job.window = window;
    job.techId = techId;
    job.subStatus = techId ? "Scheduled" : "Unassigned";
    if (job.stage === "lead" || job.stage === "quoted") job.stage = "scheduled";
    log(db, actor, "Assigned", job.id, `${date} ${window ?? ""} ${techId ?? "unassigned"}`, `/admin/calendar`);
  });
}

export async function updateSettings(patch: Partial<Settings>, actor: string) {
  return updateDb(async (db) => {
    Object.assign(db.settings, patch);
    log(db, actor, "Settings saved", "Settings", "Booking rules, price book, or text settings updated.", "/admin/settings");
  });
}

export async function updateTemplate(key: string, body: string, enabled: boolean, actor: string) {
  return updateDb(async (db) => {
    const template = db.templates.find((row) => row.key === key);
    if (!template) throw new Error("Template not found");
    template.body = body;
    template.enabled = enabled;
    log(db, actor, "SMS template", key, enabled ? "Enabled" : "Paused", "/admin/sms");
  });
}

export async function addStaff(input: { name: string; email: string; role: "admin" | "office" | "tech"; title: string }, actor: string) {
  return updateDb(async (db) => {
    db.staff.push({
      id: id("staff"),
      name: input.name,
      email: input.email,
      role: input.role,
      title: input.title,
      active: true,
      lastActive: now(),
      initials: input.name.slice(0, 2).toUpperCase(),
    });
    log(db, actor, "Staff added", input.email, input.role, "/admin/staff");
  });
}

export async function setTechActive(techId: string, active: boolean, actor: string) {
  return updateDb(async (db) => {
    const tech = db.techs.find((row) => row.id === techId);
    if (!tech) throw new Error("Tech not found");
    tech.active = active;
    log(db, actor, active ? "Tech on" : "Tech off", tech.name, "Availability toggle", "/admin/techs");
  });
}

export async function setPermitStatus(jobId: string, status: PermitStatus, actor: string) {
  return updateDb(async (db) => {
    const permit = db.permits.find((row) => row.jobId === jobId);
    const job = db.jobs.find((row) => row.id === jobId);
    if (!permit || !job) throw new Error("Permit not found");
    permit.status = status;
    if (status === "submitted") permit.appliedAt = permit.appliedAt || now().slice(0, 10);
    if (status === "issued") permit.issuedAt = now().slice(0, 10);
    job.subStatus = status.replaceAll("_", " ");
    const current = permit.steps.find((step) => step.state === "current");
    if (current) current.state = "done";
    log(db, actor, "Permit updated", jobId, status, `/admin/permits/job/${jobId}`);
    if (status === "issued") {
      const customer = db.customers.find((row) => row.id === job.customerId);
      const template = db.templates.find((row) => row.key === "permit_issued");
      if (customer && template?.enabled && customer.smsOptIn) {
        const body = renderTemplate(template.body, {
          city: db.properties.find((row) => row.id === job.propertyId)?.city || "",
          permit_no: permit.permitNumber,
          link: `/t/${job.trackingToken}`,
        });
        const sms = await sendSms(customer.phone, body);
        db.messages.unshift({
          id: id("msg"),
          jobId,
          customerId: customer.id,
          templateKey: "permit_issued",
          body,
          status: sms.status === "sent" ? "sent" : "stubbed",
          at: now(),
          channel: "sms",
        });
      }
    }
  });
}

export async function setInspectionResult(inspectionId: string, result: "pass" | "fail" | "scheduled", date: string | undefined, actor: string) {
  return updateDb(async (db) => {
    const inspection = db.inspections.find((row) => row.id === inspectionId);
    if (!inspection) throw new Error("Inspection not found");
    inspection.result = result;
    if (date) inspection.date = date;
    const job = db.jobs.find((row) => row.id === inspection.jobId);
    if (job && result === "pass") {
      job.stage = "inspected";
      job.subStatus = "Passed";
      job.side = "none";
    }
    if (job && result === "fail") {
      job.side = "correction";
      job.subStatus = "Correction";
    }
    log(db, actor, "Inspection", inspection.jobId, result, "/admin/inspections");
  });
}

export async function techSetStatus(jobId: string, status: FieldStatus, actor: string, coords?: { lat: number; lng: number }) {
  return updateDb(async (db) => {
    const job = db.jobs.find((row) => row.id === jobId);
    if (!job) throw new Error("Job not found");
    const customer = db.customers.find((row) => row.id === job.customerId);
    const property = db.properties.find((row) => row.id === job.propertyId);
    const tech = db.techs.find((row) => row.id === job.techId);
    job.fieldStatus = status;
    if (status === "en_route") job.subStatus = "En route";
    if (status === "arrived" || status === "installing") job.subStatus = status === "arrived" ? "On site" : "Installing";
    if (status === "complete") {
      job.subStatus = "Installed";
      job.stage = "installed";
      job.installedAt = now();
      job.fieldStatus = "complete";
    }
    if (status === "en_route" && property) {
      const origin = coords ?? { lat: property.lat + 0.04, lng: property.lng - 0.05 };
      const eta = await driveEta(origin, property);
      job.etaMin = eta.minutes;
      job.distanceMi = eta.miles;
      const arrival = new Date(Date.now() + eta.minutes * 60000);
      job.etaTime = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" }).format(arrival);
      const template = db.templates.find((row) => row.key === "on_the_way");
      if (template?.enabled && customer?.smsOptIn) {
        const body = renderTemplate(template.body, {
          tech_first: tech?.firstName || "Your installer",
          street: property.address,
          eta_time: job.etaTime,
          link: `/t/${job.trackingToken}`,
        });
        const sms = await sendSms(customer.phone, body);
        db.messages.unshift({
          id: id("msg"),
          jobId: job.id,
          customerId: customer.id,
          templateKey: "on_the_way",
          body,
          status: sms.status === "sent" ? "sent" : "stubbed",
          at: now(),
          channel: "sms",
        });
      }
    }
    if (status === "arrived" && customer?.smsOptIn) {
      const template = db.templates.find((row) => row.key === "arrived");
      if (template?.enabled) {
        const body = renderTemplate(template.body, {
          tech_first: tech?.firstName || "Your installer",
          office_phone: business.phone,
        });
        const sms = await sendSms(customer.phone, body);
        db.messages.unshift({
          id: id("msg"),
          jobId: job.id,
          customerId: customer.id,
          templateKey: "arrived",
          body,
          status: sms.status === "sent" ? "sent" : "stubbed",
          at: now(),
          channel: "sms",
        });
      }
    }
    if (status === "complete" && customer) {
      const template = db.templates.find((row) => row.key === "done");
      if (template?.enabled && customer.smsOptIn) {
        const body = renderTemplate(template.body, {
          unit_short: job.newUnit,
          link: `/t/${job.trackingToken}`,
        });
        const sms = await sendSms(customer.phone, body);
        db.messages.unshift({
          id: id("msg"),
          jobId: job.id,
          customerId: customer.id,
          templateKey: "done",
          body,
          status: sms.status === "sent" ? "sent" : "stubbed",
          at: now(),
          channel: "sms",
        });
      }
      db.messages.unshift({
        id: id("msg"),
        jobId: job.id,
        customerId: customer.id,
        templateKey: "summary_email",
        body: `Job summary for ${job.newUnit}. Photos, permit, and balance are on the tracking page. Email sending waits on RESEND_API_KEY.`,
        status: "stubbed",
        at: now(),
        channel: "email",
      });
    }
    log(db, actor, "Field status", job.id, status, `/tech/jobs/${job.id}`);
    return job;
  });
}

export async function addJobPhoto(jobId: string, category: string, filename: string) {
  return updateDb(async (db) => {
    const job = db.jobs.find((row) => row.id === jobId);
    if (!job) throw new Error("Job not found");
    const photo = job.photos.find((row) => row.category === category);
    if (!photo) throw new Error("Photo slot not found");
    photo.url = "/photos/hero.jpg";
    photo.takenAt = now();
    photo.label = `${photo.label}`;
    void filename;
    return job;
  });
}

export async function saveSignature(jobId: string, dataUrl: string, serial?: string) {
  return updateDb(async (db) => {
    const job = db.jobs.find((row) => row.id === jobId);
    if (!job) throw new Error("Job not found");
    job.signature = dataUrl;
    job.signedAt = now();
    if (serial) job.serial = serial;
    job.hauledAway = true;
  });
}

export async function requestReschedule(token: string, note: string) {
  return updateDb(async (db) => {
    const job = db.jobs.find((row) => row.trackingToken === token);
    if (!job) throw new Error("Tracking link not found");
    job.rescheduleRequest = note;
    log(db, "Customer", "Reschedule request", job.id, note, `/admin/jobs/${job.id}`);
  });
}

export async function createDraftJob(actor: string) {
  return updateDb(async (db) => {
    const customerId = id("cust");
    const propertyId = id("prop");
    const jobId = nextJobNumber(db);
    db.customers.unshift({
      id: customerId,
      name: "New sample customer",
      firstName: "New",
      lastName: "sample customer",
      phone: "",
      email: "",
      smsOptIn: false,
      prefers: "Phone",
      createdAt: now(),
    });
    db.properties.unshift({
      id: propertyId,
      customerId,
      address: "Address pending",
      city: "Sacramento",
      zip: "",
      lat: 38.58,
      lng: -121.49,
      apn: "Pending",
      jurisdictionId: "sac-city",
      utility: "SMUD",
      access: "",
    });
    db.jobs.unshift({
      id: jobId,
      customerId,
      propertyId,
      stage: "scheduled",
      side: "none",
      subStatus: "New",
      source: "Office",
      summary: "New job",
      lines: [],
      total: 0,
      deposit: 0,
      balance: 0,
      payMethod: "Pay at install",
      createdAt: now(),
      existingUnit: "",
      newUnit: "",
      addons: "",
      smud: "N/A",
      trackingToken: id("trk"),
      fieldStatus: "scheduled",
      photos: installPhotoSlots.map((slot) => ({
        id: slot.id,
        category: slot.id,
        label: slot.label,
        required: slot.required,
      })),
    });
    log(db, actor, "Job created", jobId, "Blank sample job.", `/admin/jobs/${jobId}`);
    return jobId;
  });
}

export async function resetDemo(actor: string) {
  const { createSeed } = await import("./seed");
  return updateDb(async (db) => {
    const fresh = createSeed();
    Object.assign(db, fresh);
    db.activity.unshift({
      id: id("act"),
      at: now(),
      actor,
      action: "Demo reset",
      entity: "Database",
      detail: "Sample data was restored.",
      href: "/admin",
    });
  });
}

export async function syncGhlNow(actor: string) {
  return updateDb(async (db) => {
    const result = await syncLeadToGhl({ event: "sync.manual", leads: db.leads.length, jobs: db.jobs.length });
    db.settings.ghlLastSync = result.at;
    db.settings.ghlHealthy = result.status !== "error";
    log(db, actor, "GHL sync", "GoHighLevel", result.detail, "/admin/leads");
    return result;
  });
}

export async function updateCustomer(customerId: string, patch: { phone?: string; email?: string; name?: string }, address?: string) {
  return updateDb(async (db) => {
    const customer = db.customers.find((row) => row.id === customerId);
    if (!customer) throw new Error("Customer not found");
    if (patch.name) customer.name = patch.name;
    if (patch.phone) customer.phone = patch.phone;
    if (patch.email) customer.email = patch.email;
    if (address) {
      const property = db.properties.find((row) => row.customerId === customerId);
      if (property) property.address = address;
    }
  });
}
