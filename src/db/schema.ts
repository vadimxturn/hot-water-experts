import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type { Database } from "@/lib/types";

/** Working copy the app reads and writes. Normalized tables mirror it for SQL. */
export const appState = pgTable("app_state", {
  id: text("id").primaryKey(),
  doc: jsonb("doc").$type<Database>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  smsOptIn: boolean("sms_opt_in").notNull().default(false),
  ghlContactId: text("ghl_contact_id"),
  createdAt: timestamp("created_at", { withTimezone: true }),
});

export const properties = pgTable("properties", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  address: text("address").notNull(),
  city: text("city"),
  zip: text("zip"),
  apn: text("apn"),
  jurisdictionId: text("jurisdiction_id"),
  utility: text("utility"),
});

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  propertyId: text("property_id"),
  stage: text("stage").notNull(),
  subStatus: text("sub_status"),
  quoteAmount: integer("quote_amount"),
  depositPaidAt: timestamp("deposit_paid_at", { withTimezone: true }),
  scheduledDate: text("scheduled_date"),
  windowLabel: text("window_label"),
  techId: text("assigned_tech_id"),
  ghlOpportunityId: text("ghl_opportunity_id"),
  trackingToken: text("tracking_token"),
});

export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  name: text("name"),
  phone: text("phone"),
  email: text("email"),
  zip: text("zip"),
  status: text("status").notNull(),
  smsConsent: boolean("sms_consent").notNull().default(false),
  consentAt: timestamp("consent_at", { withTimezone: true }),
  consentText: text("consent_text"),
  ip: text("ip"),
  answers: jsonb("answers"),
  createdAt: timestamp("created_at", { withTimezone: true }),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull(),
  kind: text("kind").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").notNull(),
  provider: text("provider"),
  providerRef: text("provider_ref"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
});

export const permits = pgTable("permits", {
  id: text("id").primaryKey(),
  jobId: text("job_id").notNull(),
  jurisdictionId: text("jurisdiction_id"),
  status: text("status").notNull(),
  permitNumber: text("permit_number"),
  feeAmount: integer("fee_amount"),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  jobId: text("job_id"),
  templateKey: text("template_key"),
  channel: text("channel"),
  body: text("body"),
  status: text("status"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export const activityLog = pgTable("activity_log", {
  id: text("id").primaryKey(),
  at: timestamp("at", { withTimezone: true }).notNull(),
  actor: text("actor"),
  action: text("action"),
  entity: text("entity"),
  detail: text("detail"),
});

export const staffUsers = pgTable("staff_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  techId: text("tech_id"),
  active: boolean("active").notNull().default(true),
});

export const priceBook = pgTable("price_book", {
  key: text("key").primaryKey(),
  label: text("label").notNull(),
  data: jsonb("data").notNull(),
});
