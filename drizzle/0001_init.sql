-- Hot Water Experts schema. The app reads and writes app_state (full document).
-- The other tables are the relational model from the build brief, refreshed on save.

CREATE TABLE IF NOT EXISTS app_state (
  id text PRIMARY KEY,
  doc jsonb NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text,
  email text,
  sms_opt_in boolean NOT NULL DEFAULT false,
  ghl_contact_id text,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS properties (
  id text PRIMARY KEY,
  customer_id text NOT NULL,
  address text NOT NULL,
  city text,
  zip text,
  apn text,
  jurisdiction_id text,
  utility text
);

CREATE TABLE IF NOT EXISTS jobs (
  id text PRIMARY KEY,
  customer_id text NOT NULL,
  property_id text,
  stage text NOT NULL,
  sub_status text,
  quote_amount integer,
  deposit_paid_at timestamptz,
  scheduled_date text,
  window_label text,
  assigned_tech_id text,
  ghl_opportunity_id text,
  tracking_token text
);

CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY,
  name text,
  phone text,
  email text,
  zip text,
  status text NOT NULL,
  sms_consent boolean NOT NULL DEFAULT false,
  consent_at timestamptz,
  consent_text text,
  ip text,
  answers jsonb,
  created_at timestamptz
);

CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY,
  job_id text NOT NULL,
  kind text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL,
  provider text,
  provider_ref text,
  paid_at timestamptz
);

CREATE TABLE IF NOT EXISTS permits (
  id text PRIMARY KEY,
  job_id text NOT NULL,
  jurisdiction_id text,
  status text NOT NULL,
  permit_number text,
  fee_amount integer
);

CREATE TABLE IF NOT EXISTS messages (
  id text PRIMARY KEY,
  job_id text,
  template_key text,
  channel text,
  body text,
  status text,
  sent_at timestamptz
);

CREATE TABLE IF NOT EXISTS activity_log (
  id text PRIMARY KEY,
  at timestamptz NOT NULL,
  actor text,
  action text,
  entity text,
  detail text
);

CREATE TABLE IF NOT EXISTS staff_users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL,
  tech_id text,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS price_book (
  key text PRIMARY KEY,
  label text NOT NULL,
  data jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS jurisdictions (
  id text PRIMARY KEY,
  name text NOT NULL,
  platform text,
  portal_url text,
  fee_notes text,
  auto_issue boolean,
  cf1r_required boolean,
  inspection_method text
);

CREATE TABLE IF NOT EXISTS techs (
  id text PRIMARY KEY,
  name text NOT NULL,
  phone text,
  licenses text,
  skills text,
  active boolean NOT NULL DEFAULT true
);
