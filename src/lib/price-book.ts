import type { PricePackage, PriceTier } from "./types";

function tier(base: number, high: number, blurb: string): PriceTier {
  return { base, low: base, high, blurb };
}

/** Editable defaults. All figures are estimates from the pricing model, not final prices. */
export const defaultPriceBook: PricePackage[] = [
  {
    key: "gas_tank_40",
    label: "Gas tank 40 gal",
    family: "tank",
    size: "40",
    good: tier(1795, 2195, "Standard 40 gal gas tank"),
    better: tier(1995, 2395, "Higher-efficiency 40 gal tank, new connectors"),
    best: tier(2195, 2395, "12-year tank plus expansion tank"),
  },
  {
    key: "gas_tank_50",
    label: "Gas tank 50 gal",
    family: "tank",
    size: "50",
    good: tier(1895, 2365, "Standard 50 gal gas tank"),
    better: tier(2095, 2565, "Higher-efficiency tank, new connectors"),
    best: tier(2395, 2590, "Premium tank, full valve refresh"),
  },
  {
    key: "gas_tank_75",
    label: "Gas tank 75 gal",
    family: "tank",
    size: "75",
    good: tier(2795, 3295, "Standard 75 gal gas tank"),
    better: tier(3095, 3595, "Higher-efficiency 75 gal tank"),
  },
  {
    key: "electric_tank_50",
    label: "Electric tank 50 gal",
    family: "tank",
    size: "50",
    good: tier(1695, 2095, "Standard 50 gal electric tank"),
    better: tier(1895, 2295, "Higher-efficiency electric tank"),
  },
  {
    key: "tankless_gas",
    label: "Tankless gas replacement",
    family: "tankless",
    good: tier(2995, 3495, "Tankless replacement"),
    better: tier(3495, 3995, "Higher-output tankless"),
    best: tier(3995, 4495, "Tankless with recirculation"),
  },
  {
    key: "tankless_conversion",
    label: "Tank to gas tankless",
    family: "tankless",
    fromOnly: {
      amount: 4495,
      high: 6495,
      note: "Starting range. Gas line and venting work move the price.",
    },
  },
  {
    key: "hp_from_electric",
    label: "Heat pump 50 gal, from electric",
    family: "heat_pump",
    size: "50",
    good: tier(4495, 5295, "Heat pump replacing an electric tank"),
    better: tier(4995, 5795, "Heat pump with leak shutoff"),
  },
  {
    key: "hp_from_gas",
    label: "Heat pump, gas to electric",
    family: "heat_pump",
    fromOnly: {
      amount: 5995,
      high: 7995,
      note: "Starting range for a 65 to 80 gal heat pump. A new 240V circuit is extra.",
    },
  },
];

export const includedInEveryLevel = [
  "Permit",
  "Seismic straps",
  "Haul-away of the old unit",
  "Standard connectors",
  "1-year labor warranty (terms pending)",
];
