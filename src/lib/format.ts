const TZ = "America/Los_Angeles";

export function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function moneyExact(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}

export function range(low: number, high: number) {
  if (low === high) return money(low);
  return `${money(low)} to ${money(high)}`;
}

export function formatDate(iso?: string, opts?: Intl.DateTimeFormatOptions) {
  if (!iso) return "";
  const date = iso.length <= 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    ...opts,
  }).format(date);
}

export function formatLongDate(iso?: string) {
  if (!iso) return "";
  const date = iso.length <= 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(iso?: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso?: string) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function weekdayShort(iso: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(
    new Date(`${iso}T12:00:00`),
  );
}

export function dayNum(iso: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, day: "numeric" }).format(
    new Date(`${iso}T12:00:00`),
  );
}

export function monthLabel(iso: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "long", year: "numeric" }).format(
    new Date(`${iso}T12:00:00`),
  );
}

export function formatHoldDate(iso?: string, style: "short" | "withWeekday" | "rail" = "withWeekday") {
  if (!iso) return "";
  const date = new Date(`${iso}T12:00:00`);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(date);
  const month = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short" }).format(date);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: TZ, day: "numeric" }).format(date);
  if (style === "short") return `${month} ${day}`;
  if (style === "rail") return `${weekday} ${month} ${day}`;
  return `${weekday}, ${month} ${day}`;
}

export function windowLabel(value?: string) {
  if (!value) return "";
  return value.replace("-", " to ");
}

export function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function todayIso(demoToday?: string) {
  if (demoToday) return demoToday;
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function agingDays(from: string | undefined, today: string) {
  if (!from) return 0;
  const a = new Date(`${from.slice(0, 10)}T12:00:00`).getTime();
  const b = new Date(`${today}T12:00:00`).getTime();
  return Math.max(0, Math.round((b - a) / 86400000));
}

export function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter((p) => p.length > 1)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
