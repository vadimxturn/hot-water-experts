import type { Lead, PricePackage, Settings, TierKey } from "./types";
import { includedInEveryLevel } from "./price-book";

export interface TierQuote {
  tier: TierKey;
  label: string;
  blurb: string;
  low: number;
  high: number;
  base: number;
}

export interface QuoteResult {
  packageKey: string;
  packageLabel: string;
  headline: string;
  context: string;
  tiers: TierQuote[];
  recommended: TierKey;
  notes: string[];
  included: string[];
  singleRange?: { low: number; high: number; note: string };
}

const TIER_LABEL: Record<TierKey, string> = {
  good: "Good",
  better: "Better",
  best: "Best",
};

export function sizeForPeople(people?: string): "40" | "50" | "75" {
  if (people === "1-2") return "40";
  if (people === "5+") return "75";
  return "50";
}

function findKey(book: PricePackage[], key: string) {
  const found = book.find((p) => p.key === key);
  if (!found) throw new Error(`Missing price package ${key}`);
  return found;
}

export function choosePackage(book: PricePackage[], lead: Partial<Lead>): PricePackage {
  const current = lead.currentType || "gas_tank";
  const want = lead.nextType || "same";
  const size = sizeForPeople(lead.people);

  const tankless = () =>
    current === "tankless" ? findKey(book, "tankless_gas") : findKey(book, "tankless_conversion");
  const heatPump = () =>
    current === "electric_tank" || current === "heat_pump"
      ? findKey(book, "hp_from_electric")
      : findKey(book, "hp_from_gas");

  if (want === "tankless") return tankless();
  if (want === "heat_pump") return heatPump();
  if (want === "help") {
    if (current === "electric_tank") return heatPump();
    return sameType();
  }
  return sameType();

  function sameType() {
    if (current === "electric_tank") return findKey(book, "electric_tank_50");
    if (current === "tankless") return findKey(book, "tankless_gas");
    if (current === "heat_pump") return findKey(book, "hp_from_electric");
    if (current === "unknown") return findKey(book, "gas_tank_50");
    const sized = book.find((p) => p.key === `gas_tank_${size}`);
    return sized || findKey(book, "gas_tank_50");
  }
}

function locationAdder(location?: string) {
  if (location === "attic") return { low: 300, high: 600, note: "Attic access is added to the range." };
  return { low: 0, high: 0, note: "" };
}

export function quoteFor(settings: Pick<Settings, "priceBook" | "priceConfirmedOnSite">, lead: Partial<Lead>): QuoteResult {
  const pkg = choosePackage(settings.priceBook, lead);
  const adder = locationAdder(lead.location);
  const notes = [
    "Prices are estimates from the price book. They are not a final invoice.",
  ];
  if (adder.note) notes.push(adder.note);
  if (lead.people === "5+" && (lead.nextType === "tankless" || pkg.family === "tankless")) {
    notes.push("A larger household often needs a higher-flow tankless unit.");
  }
  if (lead.nextType === "heat_pump" || pkg.family === "heat_pump") {
    notes.push("Heat pump jobs can need a 240V circuit. That adder is confirmed from photos or on site.");
  }
  if (!settings.priceConfirmedOnSite) {
    notes.push("This office is set to a set price. Work outside the quoted scope is a separate line.");
  }

  const size = pkg.size ? `${pkg.size} gal` : "";
  const fuel =
    pkg.key.startsWith("electric") ? "Electric tank" : pkg.family === "heat_pump" ? "Heat pump" : pkg.family === "tankless" ? "Tankless" : "Gas tank";
  const headline = size && pkg.family === "tank" ? `${fuel}, ${size}` : pkg.label;
  const place = lead.location ? labelLocation(lead.location) : "your home";
  const replacing =
    lead.nextType === "same" || !lead.nextType ? "replacing like for like" : "a change of type";
  const context = `${place}, ${replacing}`;

  if (pkg.fromOnly) {
    return {
      packageKey: pkg.key,
      packageLabel: pkg.label,
      headline: pkg.label,
      context,
      tiers: [],
      recommended: "good",
      notes: [...notes, pkg.fromOnly.note],
      included: includedInEveryLevel,
      singleRange: {
        low: pkg.fromOnly.amount + adder.low,
        high: pkg.fromOnly.high + adder.high,
        note: pkg.fromOnly.note,
      },
    };
  }

  const tiers: TierQuote[] = (["good", "better", "best"] as TierKey[])
    .filter((key) => pkg[key])
    .map((key) => {
      const row = pkg[key]!;
      return {
        tier: key,
        label: TIER_LABEL[key],
        blurb: row.blurb,
        base: row.base,
        low: row.low + adder.low,
        high: row.high + adder.high,
      };
    });

  const recommended: TierKey = tiers.some((t) => t.tier === "better") ? "better" : "good";

  return {
    packageKey: pkg.key,
    packageLabel: pkg.label,
    headline,
    context,
    tiers,
    recommended,
    notes,
    included: includedInEveryLevel,
  };
}

export function labelLocation(location?: string) {
  switch (location) {
    case "garage":
      return "Garage";
    case "closet":
      return "Indoor closet";
    case "attic":
      return "Attic";
    case "outside":
      return "Outside";
    default:
      return "Home";
  }
}

export function labelCurrent(type?: string) {
  switch (type) {
    case "gas_tank":
      return "Gas tank";
    case "electric_tank":
      return "Electric tank";
    case "tankless":
      return "Tankless";
    case "heat_pump":
      return "Heat pump";
    default:
      return "Not sure yet";
  }
}

export function labelNext(type?: string) {
  switch (type) {
    case "same":
      return "Same type";
    case "tankless":
      return "Tankless";
    case "heat_pump":
      return "Heat pump";
    case "help":
      return "Help me choose";
    default:
      return "Not chosen";
  }
}

export function labelSituation(value?: string) {
  switch (value) {
    case "no_hot_water":
      return "No hot water";
    case "leaking":
      return "Leaking";
    case "getting_old":
      return "Getting old";
    case "upgrading":
      return "Upgrading";
    default:
      return "Not answered";
  }
}

export function startingRanges(book: PricePackage[]) {
  const gas = book.find((p) => p.key === "gas_tank_50");
  const sameLow = gas?.good?.low ?? 1895;
  const sameHigh = gas?.best?.high ?? 2590;
  const tankless = book.find((p) => p.key === "tankless_conversion");
  const hp = book.find((p) => p.key === "hp_from_gas");
  return {
    same: { low: sameLow, high: sameHigh },
    tanklessFrom: tankless?.fromOnly?.amount ?? 4495,
    heatPumpFrom: hp?.fromOnly?.amount ?? 5995,
  };
}

export function heroExample(book: PricePackage[]) {
  const gas = book.find((p) => p.key === "gas_tank_50");
  return {
    low: gas?.good?.base ?? 1895,
    high: gas?.best?.base ?? 2395,
    label: "Gas tank, 50 gal",
    detail: "Same-type replacement, garage",
  };
}

export function policyLine(confirmedOnSite: boolean) {
  return confirmedOnSite
    ? "Example estimate. Final price confirmed on site."
    : "Example estimate. This office uses a set price for the quoted scope.";
}
