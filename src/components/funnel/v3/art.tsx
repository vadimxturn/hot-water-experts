/**
 * Line illustrations for the type step.
 * The v3 exports use stock heater photos. Do not ship those.
 * Replace UnitArt with real Hot Water Experts photos when they exist.
 */
const UNITS = {
  gas_tank: "/funnel/tank.svg",
  electric_tank: "/funnel/electric.svg",
  tankless: "/funnel/tankless.svg",
  heat_pump: "/funnel/heatpump.svg",
} as const;

const ICONS = {
  droplet: "/funnel/icon-droplet.svg",
  leak: "/funnel/icon-leak.svg",
  clock: "/funnel/icon-clock.svg",
  up: "/funnel/icon-up.svg",
} as const;

export type UnitKind = keyof typeof UNITS;
export type IconName = keyof typeof ICONS;

export function UnitArt({ kind }: { kind: UnitKind }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={UNITS[kind]} alt="" width={72} height={88} />
  );
}

export function FunnelIcon({ name }: { name: IconName }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ICONS[name]} alt="" width={24} height={24} />
  );
}

export function CheckMark({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={className} aria-hidden>
      <path d="M2 6.2 4.7 9 10 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
