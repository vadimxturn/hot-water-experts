/**
 * Single place for business facts we do not have yet.
 * Replace the [pending] strings when Vadim confirms them.
 * Do not invent license numbers, phone numbers, hours, reviews, or warranties.
 */
export const business = {
  name: "Hot Water Experts",
  legalName: "[Legal entity pending]",
  // PLACEHOLDER: main phone
  phone: "[Phone pending]",
  // PLACEHOLDER: SMS sending number
  smsNumber: "[SMS number pending]",
  // PLACEHOLDER: office email
  email: "[Email pending]",
  // PLACEHOLDER: permit inbox
  permitsEmail: "[permits@ pending]",
  // PLACEHOLDER: hours. Research note only: office 7 AM to 5 PM, days TBC.
  hours: "[Hours pending]",
  hoursNote: "Office hours were noted as 7 AM to 5 PM. Days are still to be confirmed.",
  // PLACEHOLDER: CSLB license number
  license: "[License # pending]",
  // PLACEHOLDER: classifications
  licenseClass: "[C-36 / C-10 pending]",
  // PLACEHOLDER: service area wording
  serviceArea: "[Service area pending]",
  serviceAreaAssumption:
    "Designs assume the Sacramento area: Sacramento, Sacramento County, Elk Grove, Folsom, Roseville, Rocklin, Citrus Heights, and Placer County.",
  // PLACEHOLDER: street address
  address: "[Business address pending]",
  // PLACEHOLDER: warranty
  warranty: "[Warranty terms pending]",
  warrantyNote:
    "Packages in the estimate include a 1-year labor warranty placeholder. Final warranty wording is pending.",
  // PLACEHOLDER: financing partner
  financingPartner: "[Financing partner pending]",
  // No review link until a real Google Business Profile is provided.
  reviewUrl: "",
  // PLACEHOLDER: reviews. Do not show a count, rating, or quote until real reviews exist.
  reviews: "[Reviews pending]",
  depositAmount: 100,
  depositPolicy:
    "The $100 deposit is credited at install and is refundable with 24 or more hours' notice.",
  smsConsentText:
    "I agree to receive text messages from Hot Water Experts about my estimate, booking, and install. Message frequency varies. Message and data rates may apply. Reply STOP to opt out and HELP for help. Consent is not a condition of purchase.",
  depositAckText:
    "I understand the $100 deposit is credited at install and refundable with 24+ hours' notice.",
  priceConfirmedCopy:
    "Final price confirmed on site, before any work starts.",
  priceSetCopy: "The price you accept is the set price for the scope in your quote.",
  photosNote:
    "Photos in this build are design stand-ins. Swap the files in public/photos or the paths in src/config/media.ts.",
};

export const photoSlots = [
  { id: "data_plate", label: "Data plate (label)" },
  { id: "whole_unit", label: "Whole unit, top to bottom" },
  { id: "vent", label: "Top: vent and pipes" },
  { id: "gas", label: "Gas and shutoff valves" },
  { id: "water", label: "Water connections" },
] as const;

export const installPhotoSlots = [
  { id: "old_plate", label: "Old unit plate", required: true },
  { id: "new_plate", label: "New unit plate", required: true },
  { id: "gas_shutoff", label: "Gas line shutoff", required: true },
  { id: "venting", label: "Venting", required: true },
  { id: "seismic", label: "Seismic straps", required: true },
  { id: "tp", label: "T&P discharge", required: true },
  { id: "expansion", label: "Expansion tank", required: true },
  { id: "permit_card", label: "Permit card", required: true },
  { id: "completed", label: "Completed install", required: true },
] as const;

export const windows = ["8-10 AM", "10 AM-12 PM", "12-2 PM", "2-4 PM"] as const;
export type ArrivalWindow = (typeof windows)[number];
