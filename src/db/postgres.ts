import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createSeed } from "@/lib/seed";
import type { Database } from "@/lib/types";
import { appState } from "./schema";

function sqlClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return postgres(url, { max: 1, idle_timeout: 20 });
}

let client: ReturnType<typeof postgres> | null = null;

function getClient() {
  if (!client) client = sqlClient();
  return client;
}

function orm() {
  return drizzle(getClient(), { schema: { appState } });
}

export async function loadPg(): Promise<Database> {
  const db = orm();
  const rows = await db.select().from(appState).where(eq(appState.id, "live"));
  if (!rows[0]) {
    const seed = createSeed();
    await savePg(seed);
    return seed;
  }
  return rows[0].doc;
}

export async function savePg(doc: Database) {
  const db = orm();
  const updatedAt = new Date();
  await db
    .insert(appState)
    .values({ id: "live", doc, updatedAt })
    .onConflictDoUpdate({
      target: appState.id,
      set: { doc, updatedAt },
    });
  try {
    await syncNormalized(doc);
  } catch (error) {
    console.error("Normalized table sync failed. app_state was saved.", error);
  }
}

async function syncNormalized(doc: Database) {
  const sql = getClient();
  await sql.begin(async (tx) => {
    await tx`DELETE FROM customers`;
    await tx`DELETE FROM properties`;
    await tx`DELETE FROM jobs`;
    await tx`DELETE FROM leads`;
    await tx`DELETE FROM payments`;
    await tx`DELETE FROM permits`;
    await tx`DELETE FROM messages`;
    await tx`DELETE FROM activity_log`;
    await tx`DELETE FROM staff_users`;
    await tx`DELETE FROM price_book`;
    await tx`DELETE FROM jurisdictions`;
    await tx`DELETE FROM techs`;

    for (const row of doc.customers) {
      await tx`INSERT INTO customers (id, name, phone, email, sms_opt_in, ghl_contact_id, created_at)
        VALUES (${row.id}, ${row.name}, ${row.phone}, ${row.email}, ${row.smsOptIn}, ${row.ghlContactId ?? null}, ${row.createdAt})`;
    }
    for (const row of doc.properties) {
      await tx`INSERT INTO properties (id, customer_id, address, city, zip, apn, jurisdiction_id, utility)
        VALUES (${row.id}, ${row.customerId}, ${row.address}, ${row.city}, ${row.zip}, ${row.apn}, ${row.jurisdictionId}, ${row.utility})`;
    }
    for (const row of doc.jobs) {
      await tx`INSERT INTO jobs (id, customer_id, property_id, stage, sub_status, quote_amount, deposit_paid_at, scheduled_date, window_label, assigned_tech_id, ghl_opportunity_id, tracking_token)
        VALUES (${row.id}, ${row.customerId}, ${row.propertyId}, ${row.stage}, ${row.subStatus}, ${row.total}, ${row.depositPaidAt ?? null}, ${row.scheduledDate ?? null}, ${row.window ?? null}, ${row.techId ?? null}, ${row.ghlOpportunityId ?? null}, ${row.trackingToken ?? null})`;
    }
    for (const row of doc.leads) {
      await tx`INSERT INTO leads (id, name, phone, email, zip, status, sms_consent, consent_at, consent_text, ip, answers, created_at)
        VALUES (${row.id}, ${row.name}, ${row.phone}, ${row.email}, ${row.zip}, ${row.status}, ${row.smsConsent}, ${row.smsConsentAt ?? null}, ${row.smsConsentText ?? null}, ${row.ip ?? null}, ${tx.json(row as never)}, ${row.createdAt})`;
    }
    for (const row of doc.payments) {
      await tx`INSERT INTO payments (id, job_id, kind, amount, status, provider, provider_ref, paid_at)
        VALUES (${row.id}, ${row.jobId}, ${row.kind}, ${row.amount}, ${row.status}, ${row.provider}, ${row.ref}, ${row.at ?? null})`;
    }
    for (const row of doc.permits) {
      await tx`INSERT INTO permits (id, job_id, jurisdiction_id, status, permit_number, fee_amount)
        VALUES (${row.id}, ${row.jobId}, ${row.jurisdictionId}, ${row.status}, ${row.permitNumber}, ${row.feeAmount})`;
    }
    for (const row of doc.messages) {
      await tx`INSERT INTO messages (id, job_id, template_key, channel, body, status, sent_at)
        VALUES (${row.id}, ${row.jobId ?? null}, ${row.templateKey}, ${row.channel}, ${row.body}, ${row.status}, ${row.at})`;
    }
    for (const row of doc.activity) {
      await tx`INSERT INTO activity_log (id, at, actor, action, entity, detail)
        VALUES (${row.id}, ${row.at}, ${row.actor}, ${row.action}, ${row.entity}, ${row.detail})`;
    }
    for (const row of doc.staff) {
      await tx`INSERT INTO staff_users (id, name, email, role, tech_id, active)
        VALUES (${row.id}, ${row.name}, ${row.email}, ${row.role}, ${row.techId ?? null}, ${row.active})`;
    }
    for (const row of doc.settings.priceBook) {
      await tx`INSERT INTO price_book (key, label, data) VALUES (${row.key}, ${row.label}, ${tx.json(row as never)})`;
    }
    for (const row of doc.jurisdictions) {
      await tx`INSERT INTO jurisdictions (id, name, platform, portal_url, fee_notes, auto_issue, cf1r_required, inspection_method)
        VALUES (${row.id}, ${row.name}, ${row.platform}, ${row.portalUrl}, ${row.fee}, ${row.autoIssue}, ${row.cf1r}, ${row.inspectionMethod})`;
    }
    for (const row of doc.techs) {
      await tx`INSERT INTO techs (id, name, phone, licenses, skills, active)
        VALUES (${row.id}, ${row.name}, ${row.phone}, ${row.licenses.join(", ")}, ${row.skills.join(", ")}, ${row.active})`;
    }
  });
}
