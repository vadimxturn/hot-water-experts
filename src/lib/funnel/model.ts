import type { Lead, TierKey } from "@/lib/types";
import type { QuoteResult } from "@/lib/pricing";

/**
 * Shared funnel engine. No React and no styling.
 *
 * Swap the screen components without rewriting this file. A view may set
 * location, age, people, nextType, timing, or payMethod. When those are
 * empty, this 7-step flow uses the defaults below. It does not invent prices.
 * quoteFor still owns the ranges.
 *
 * Defaults, only when the view left the field empty:
 * - next unit: same-type swap
 * - pay method: pay at install (only the deposit is due now)
 * - timing: from the situation (no hot water and leaking count as asap)
 * - size: the price book default, 50 gal, until people is set
 * - location: unset, so the attic adder is not applied
 * - plate readout: a marked sample, never a price input
 */

export interface DaySlot {
  date: string;
  closed: boolean;
  slots: { window: string; full: boolean }[];
}

export interface FunnelPhoto {
  slot: string;
  name: string;
}

export interface FunnelDraft {
  step: number;
  leadId?: string;
  zip: string;
  situation?: string;
  currentType?: string;
  location?: string;
  age?: string;
  nextType?: string;
  people?: string;
  bathrooms?: number;
  timing?: string;
  photos: FunnelPhoto[];
  tier?: TierKey;
  payMethod?: "install" | "over_time";
  installDate?: string;
  window?: string;
  name: string;
  email: string;
  phone: string;
  smsConsent: boolean;
  depositAck: boolean;
  error?: string;
  busy?: boolean;
}

export const samplePlateReadout = {
  fuel: "Natural gas",
  size: "50 gal",
  year: "2014",
  sample: true as const,
};

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function emptyDraft(): FunnelDraft {
  return {
    step: 1,
    zip: "",
    photos: [],
    name: "",
    email: "",
    phone: "",
    smsConsent: false,
    depositAck: false,
  };
}

export function timingForSituation(situation?: string) {
  if (situation === "no_hot_water" || situation === "leaking") return "asap";
  if (situation === "getting_old" || situation === "upgrading") return "this_week";
  return undefined;
}

export function quoteInput(draft: Pick<FunnelDraft, "currentType" | "nextType" | "people" | "location" | "tier">): Partial<Lead> {
  return {
    currentType: draft.currentType,
    nextType: draft.nextType || "same",
    people: draft.people,
    location: draft.location,
    tier: draft.tier,
  };
}

export function resolvedTier(draft: FunnelDraft, quote: QuoteResult): TierKey {
  if (draft.tier && quote.tiers.some((row) => row.tier === draft.tier)) return draft.tier;
  return quote.recommended;
}

export function canBook(draft: FunnelDraft) {
  const phoneOk = draft.phone.replace(/\D/g, "").length >= 10;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim());
  const identity = draft.name.trim().length > 1 && phoneOk && emailOk;
  if (draft.timing === "just_pricing") return identity;
  return identity && draft.depositAck && Boolean(draft.installDate && draft.window);
}

export function canContinue(draft: FunnelDraft) {
  if (draft.busy) return false;
  if (draft.step === 1) return draft.zip.length === 5;
  if (draft.step === 2) return Boolean(draft.situation);
  if (draft.step === 6) return canBook(draft);
  return true;
}

export function leadPatch(draft: FunnelDraft): Partial<Lead> {
  const patch: Partial<Lead> = {
    zip: draft.zip,
    photos: draft.photos,
    step: draft.step,
    nextType: draft.nextType || "same",
    payMethod: draft.payMethod || "install",
    urgent: draft.situation === "no_hot_water" || draft.situation === "leaking",
  };
  const timing = draft.timing || timingForSituation(draft.situation);
  if (timing) patch.timing = timing;
  if (draft.situation) patch.situation = draft.situation;
  if (draft.currentType) patch.currentType = draft.currentType;
  if (draft.location) patch.location = draft.location;
  if (draft.age) patch.age = draft.age;
  if (draft.people) patch.people = draft.people;
  if (draft.bathrooms) patch.bathrooms = draft.bathrooms;
  if (draft.tier) patch.tier = draft.tier;
  if (draft.installDate) patch.installDate = draft.installDate;
  if (draft.window) patch.window = draft.window;
  if (draft.photos.length) patch.readout = samplePlateReadout;
  return patch;
}

export function takePhotos(
  existing: FunnelPhoto[],
  incoming: { name: string; type: string; size: number }[],
  slotIds: string[],
) {
  const photos = [...existing];
  let error: string | undefined;
  for (const file of incoming) {
    if (photos.length >= slotIds.length) break;
    const jpeg = file.type === "image/jpeg" || /\.jpe?g$/i.test(file.name);
    const png = file.type === "image/png" || /\.png$/i.test(file.name);
    if (!jpeg && !png) {
      error = "Use a JPG or PNG.";
      continue;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      error = "Each photo needs to be 10 MB or smaller.";
      continue;
    }
    photos.push({ slot: slotIds[photos.length], name: file.name });
  }
  return { photos, error };
}

export function firstOpenSlot(days: DaySlot[], earliest: string) {
  const preferred = days.find((day) => day.date === earliest && !day.closed && day.slots.some((slot) => !slot.full));
  const fallback = days.find((day) => !day.closed && day.slots.some((slot) => !slot.full));
  const day = preferred || fallback;
  const slot = day?.slots.find((item) => !item.full);
  return {
    installDate: day?.date || earliest,
    window: slot?.window || "10 AM-12 PM",
  };
}

export function windowOnDay(day: DaySlot | undefined, current?: string) {
  if (!day) return current;
  if (current && day.slots.some((slot) => slot.window === current && !slot.full)) return current;
  return day.slots.find((slot) => !slot.full)?.window;
}
