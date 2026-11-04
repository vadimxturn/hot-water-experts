/**
 * PLACEHOLDER service area.
 * ZIP to city, permit office, and utility. Boundaries are approximate and must be confirmed.
 * A 956, 957, or 958 ZIP that is not listed is treated as "likely in area, confirm the office".
 * Anything else is outside the placeholder area. The lead is still saved.
 */

export interface ZipMatch {
  zip: string;
  city: string;
  jurisdictionId: string;
  utility: "SMUD" | "PG&E" | "Roseville Electric";
  inArea: true;
  confirmed: true;
}

const listed: ZipMatch[] = [
  ["95811", "Sacramento", "sac-city", "SMUD"],
  ["95814", "Sacramento", "sac-city", "SMUD"],
  ["95815", "Sacramento", "sac-city", "SMUD"],
  ["95816", "Sacramento", "sac-city", "SMUD"],
  ["95817", "Sacramento", "sac-city", "SMUD"],
  ["95818", "Sacramento", "sac-city", "SMUD"],
  ["95819", "Sacramento", "sac-city", "SMUD"],
  ["95820", "Sacramento", "sac-city", "SMUD"],
  ["95822", "Sacramento", "sac-city", "SMUD"],
  ["95823", "Sacramento", "sac-county", "SMUD"],
  ["95824", "Sacramento", "sac-city", "SMUD"],
  ["95825", "Sacramento", "sac-county", "SMUD"],
  ["95826", "Sacramento", "sac-city", "SMUD"],
  ["95828", "Sacramento", "sac-county", "SMUD"],
  ["95829", "Sacramento", "sac-county", "SMUD"],
  ["95831", "Sacramento", "sac-city", "SMUD"],
  ["95832", "Sacramento", "sac-city", "SMUD"],
  ["95833", "Sacramento", "sac-city", "SMUD"],
  ["95834", "Sacramento", "sac-city", "SMUD"],
  ["95835", "Sacramento", "sac-city", "SMUD"],
  ["95838", "Sacramento", "sac-city", "SMUD"],
  ["95608", "Carmichael", "sac-county", "SMUD"],
  ["95610", "Citrus Heights", "citrus-heights", "SMUD"],
  ["95621", "Citrus Heights", "citrus-heights", "SMUD"],
  ["95624", "Elk Grove", "elk-grove", "SMUD"],
  ["95628", "Fair Oaks", "sac-county", "SMUD"],
  ["95630", "Folsom", "folsom", "SMUD"],
  ["95662", "Orangevale", "sac-county", "SMUD"],
  ["95670", "Rancho Cordova", "sac-county", "SMUD"],
  ["95742", "Rancho Cordova", "sac-county", "SMUD"],
  ["95757", "Elk Grove", "elk-grove", "SMUD"],
  ["95758", "Elk Grove", "elk-grove", "SMUD"],
  ["95661", "Roseville", "roseville", "Roseville Electric"],
  ["95678", "Roseville", "roseville", "Roseville Electric"],
  ["95747", "Roseville", "roseville", "Roseville Electric"],
  ["95677", "Rocklin", "rocklin", "PG&E"],
  ["95765", "Rocklin", "rocklin", "PG&E"],
  ["95648", "Lincoln", "placer", "PG&E"],
  ["95650", "Loomis", "placer", "PG&E"],
  ["95663", "Penryn", "placer", "PG&E"],
].map(([zip, city, jurisdictionId, utility]) => ({
  zip,
  city,
  jurisdictionId,
  utility: utility as ZipMatch["utility"],
  inArea: true as const,
  confirmed: true as const,
}));

// 95762 is El Dorado Hills, often served near Folsom. Keep the id but fix the city name.
const ZIPS: Record<string, ZipMatch> = Object.fromEntries(
  listed.map((row) => [row.zip, row.zip === "95762" ? { ...row, city: "El Dorado Hills" } : row]),
);

export type ZipLookup =
  | ZipMatch
  | {
      zip: string;
      city: string;
      jurisdictionId?: string;
      utility: string;
      inArea: boolean;
      confirmed: false;
      note: string;
    };

export function lookupZip(zip: string): ZipLookup {
  const clean = zip.replace(/\D/g, "").slice(0, 5);
  const known = ZIPS[clean];
  if (known) return known;
  if (/^(958|956|957)\d{2}$/.test(clean)) {
    return {
      zip: clean,
      city: "Sacramento area",
      utility: "Utility to confirm",
      inArea: true,
      confirmed: false,
      note: "This ZIP is not in the placeholder list. The office will confirm the permit office and utility.",
    };
  }
  return {
    zip: clean,
    city: "Outside placeholder area",
    utility: "Unknown",
    inArea: false,
    confirmed: false,
    note: "This ZIP is outside the placeholder Sacramento-area list. You can still leave your details and the office will confirm.",
  };
}

export const knownZips = Object.keys(ZIPS);
