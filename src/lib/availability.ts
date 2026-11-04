import { windows } from "@/config/business";
import { addDays, todayIso } from "./format";
import type { Database } from "./types";

export interface Slot {
  date: string;
  window: string;
  remaining: number;
  full: boolean;
}

function dayOfWeek(iso: string) {
  return new Date(`${iso}T12:00:00`).getDay();
}

export function isClosed(db: Database, iso: string) {
  const day = dayOfWeek(iso);
  if (day === 0 && !db.settings.sunday) return true;
  if (day === 6 && !db.settings.saturday) return true;
  return db.settings.holidays.includes(iso);
}

function nextOpen(db: Database, iso: string) {
  let date = iso;
  for (let i = 0; i < 21; i += 1) {
    if (!isClosed(db, date)) return date;
    date = addDays(date, 1);
  }
  return date;
}

export function earliestBookable(db: Database) {
  const today = todayIso(db.settings.demoToday);
  let date = nextOpen(db, addDays(today, db.settings.minLeadDays));
  if (db.settings.noSameWeek && db.settings.sameWeekMode === "calendar_week") {
    const todayDow = dayOfWeek(today);
    const daysLeft = todayDow === 0 ? 0 : 7 - todayDow;
    const endOfWeek = addDays(today, daysLeft);
    if (date <= endOfWeek) date = nextOpen(db, addDays(endOfWeek, 1));
  }
  return date;
}

export function mondayOf(iso: string) {
  const day = dayOfWeek(iso);
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(iso, offset);
}

export function weekDates(monday: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function installsOn(db: Database, date: string) {
  return db.jobs.filter(
    (job) =>
      job.scheduledDate === date &&
      job.side !== "cancelled" &&
      job.visitKind !== "inspection" &&
      job.stage !== "inspected",
  );
}

export function slotsForDate(db: Database, date: string): Slot[] {
  if (isClosed(db, date)) {
    return windows.map((window) => ({ date, window, remaining: 0, full: true }));
  }
  const installs = installsOn(db, date);
  const techs = db.techs.filter((tech) => tech.active);
  const cap = techs.length * db.settings.maxInstallsPerTech;
  const dayFull = installs.length >= cap;
  return windows.map((window) => {
    const used = installs.filter((job) => job.window === window).length;
    const remaining = dayFull ? 0 : Math.max(0, techs.length - used);
    return { date, window, remaining, full: remaining <= 0 };
  });
}

export function techLoad(db: Database, techId: string, date: string) {
  return installsOn(db, date).filter((job) => job.techId === techId).length;
}

export function firstTechWithRoom(db: Database, date: string) {
  const cap = db.settings.maxInstallsPerTech;
  return db.techs.find((tech) => tech.active && techLoad(db, tech.id, date) < cap);
}
