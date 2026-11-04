export type Role = "admin" | "office" | "tech";

export type JobStage = "lead" | "quoted" | "scheduled" | "permit" | "installed" | "inspected";

export type SideState = "none" | "on_hold" | "cancelled" | "correction";

export type PermitStatus =
  | "needed"
  | "docs_ready"
  | "submitted"
  | "issued"
  | "inspection_scheduled"
  | "passed"
  | "failed"
  | "closed";

export type FieldStatus = "scheduled" | "en_route" | "arrived" | "installing" | "complete";

export type TierKey = "good" | "better" | "best";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  techId?: string;
  active: boolean;
  lastActive: string;
  initials: string;
}

export interface Tech {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  color: string;
  soft: string;
  phone: string;
  photo: string;
  bio: string;
  licenses: string[];
  skills: string[];
  homeBase: string;
  van: string;
  active: boolean;
  days: string;
  maxPerDay: number;
}

export interface Customer {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  smsOptIn: boolean;
  prefers: string;
  createdAt: string;
  ghlContactId?: string;
}

export interface Property {
  id: string;
  customerId: string;
  address: string;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  apn: string;
  jurisdictionId: string;
  utility: string;
  access: string;
  gateCode?: string;
}

export interface LineItem {
  label: string;
  amount: number;
}

export interface JobPhoto {
  id: string;
  category: string;
  label: string;
  url?: string;
  required: boolean;
  takenAt?: string;
}

export interface Job {
  id: string;
  customerId: string;
  propertyId: string;
  stage: JobStage;
  side: SideState;
  subStatus: string;
  source: string;
  summary: string;
  tier?: string;
  lines: LineItem[];
  total: number;
  deposit: number;
  depositPaidAt?: string;
  depositRef?: string;
  balance: number;
  payMethod: string;
  scheduledDate?: string;
  window?: string;
  durationHours?: number;
  techId?: string;
  notes?: string;
  createdAt: string;
  installedAt?: string;
  existingUnit: string;
  newUnit: string;
  addons: string;
  smud: string;
  ghlOpportunityId?: string;
  trackingToken?: string;
  fieldStatus: FieldStatus;
  etaMin?: number;
  etaTime?: string;
  distanceMi?: number;
  signature?: string;
  signedAt?: string;
  serial?: string;
  hauledAway?: boolean;
  photos: JobPhoto[];
  rescheduleRequest?: string;
  panel?: string;
  scopeText?: string;
  visitDate?: string;
  visitWindow?: string;
  visitKind?: "install" | "inspection";
}

export interface PermitStep {
  n: number;
  title: string;
  detail: string;
  state: "done" | "current" | "todo";
  date?: string;
}

export interface PermitDoc {
  name: string;
  status: "attached" | "missing" | "check";
  date?: string;
}

export interface Permit {
  id: string;
  jobId: string;
  jurisdictionId: string;
  status: PermitStatus;
  permitNumber: string;
  feeLabel: string;
  feeAmount: number;
  license: string;
  appliedAt?: string;
  issuedAt?: string;
  cf1r: boolean;
  nextAction: string;
  steps: PermitStep[];
  docs: PermitDoc[];
  progress: string;
}

export interface Inspection {
  id: string;
  jobId: string;
  permitId: string;
  type: string;
  date?: string;
  window?: string;
  result: "pending" | "scheduled" | "pass" | "fail" | "not_booked";
  method: string;
  notes: string;
  adultRequired: boolean;
}

export interface LeadPhoto {
  slot: string;
  name: string;
}

export interface Lead {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: "new" | "contacted" | "quoted" | "booked" | "abandoned";
  source: string;
  name: string;
  phone: string;
  email: string;
  zip: string;
  city: string;
  address: string;
  jurisdictionId?: string;
  utility?: string;
  outOfArea: boolean;
  zipNote?: string;
  situation?: string;
  currentType?: string;
  location?: string;
  age?: string;
  nextType?: string;
  people?: string;
  bathrooms?: number;
  timing?: string;
  photos: LeadPhoto[];
  readout?: { fuel: string; size: string; year: string; sample: boolean };
  tier?: TierKey;
  quoteLow?: number;
  quoteHigh?: number;
  quoteLabel?: string;
  payMethod?: "install" | "over_time";
  installDate?: string;
  window?: string;
  smsConsent: boolean;
  smsConsentAt?: string;
  smsConsentText?: string;
  depositAck: boolean;
  depositPaid: boolean;
  paymentMode?: "stub" | "stripe";
  paymentRef?: string;
  ip?: string;
  ghl?: { status: "stubbed" | "sent" | "error"; at: string; detail: string };
  jobId?: string;
  summary: string;
  urgent?: boolean;
  step: number;
  homeType?: string;
}

export interface Message {
  id: string;
  jobId?: string;
  leadId?: string;
  customerId?: string;
  templateKey: string;
  body: string;
  status: "sent" | "scheduled" | "stubbed" | "failed" | "skipped";
  at: string;
  channel: "sms" | "email";
}

export interface Activity {
  id: string;
  at: string;
  actor: string;
  action: string;
  entity: string;
  detail: string;
  href?: string;
}

export interface SmsTemplate {
  key: string;
  name: string;
  group: string;
  trigger: string;
  body: string;
  enabled: boolean;
  stageLabel: string;
}

export interface Jurisdiction {
  id: string;
  name: string;
  short: string;
  platform: string;
  portal: string;
  portalUrl: string;
  fee: string;
  feeAmount: number;
  autoIssue: boolean;
  cf1r: boolean;
  inspectionMethod: string;
  adultHome: string;
  notes: string;
}

export interface PriceTier {
  base: number;
  low: number;
  high: number;
  blurb: string;
}

export interface PricePackage {
  key: string;
  label: string;
  family: "tank" | "tankless" | "heat_pump";
  size?: string;
  good?: PriceTier;
  better?: PriceTier;
  best?: PriceTier;
  fromOnly?: { amount: number; high: number; note: string };
}

export interface Settings {
  sampleData: boolean;
  showSampleChip: boolean;
  /** Office clock for the demo. Empty string uses the real date. */
  demoToday: string;
  priceConfirmedOnSite: boolean;
  minLeadDays: number;
  noSameWeek: boolean;
  sameWeekMode: "next_7" | "calendar_week";
  offerWeekStart: number;
  offerWeekEnd: number;
  maxInstallsPerTech: number;
  bufferMin: number;
  addDriveTime: boolean;
  inspectionMeetSlot: boolean;
  officeStart: string;
  officeEnd: string;
  saturday: boolean;
  sunday: boolean;
  quietStart: string;
  quietEnd: string;
  etaThresholds: number[];
  depositAmount: number;
  priceBook: PricePackage[];
  ghlLastSync: string;
  ghlHealthy: boolean;
  holidays: string[];
}

export interface Payment {
  id: string;
  jobId: string;
  kind: "deposit" | "final" | "refund";
  amount: number;
  status: "paid" | "due" | "refunded" | "stubbed";
  provider: "stripe" | "stub";
  ref: string;
  at?: string;
  note?: string;
}

export interface Database {
  staff: StaffUser[];
  techs: Tech[];
  customers: Customer[];
  properties: Property[];
  jobs: Job[];
  permits: Permit[];
  inspections: Inspection[];
  leads: Lead[];
  messages: Message[];
  activity: Activity[];
  templates: SmsTemplate[];
  jurisdictions: Jurisdiction[];
  payments: Payment[];
  settings: Settings;
}
