import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSeed } from "./seed";
import { buildOwnerHome, greetingFor, jobFamily, resolveRange } from "./owner-home";
import type { Job } from "./types";

const db = createSeed();
const october = resolveRange("2026-10-19", "this-month");
const home = buildOwnerHome(db, october);

function bookedIn(from: string, to: string) {
  return db.jobs.filter((job) => job.side !== "cancelled" && job.depositPaidAt && job.depositPaidAt.slice(0, 10) >= from && job.depositPaidAt.slice(0, 10) <= to);
}

describe("resolveRange", () => {
  it("uses the full calendar month around the office date", () => {
    assert.equal(october.from, "2026-10-01");
    assert.equal(october.to, "2026-10-31");
    assert.equal(october.priorFrom, "2026-09-01");
    assert.equal(october.priorTo, "2026-09-30");
    assert.equal(october.spanLabel, "Oct 1 to Oct 31, 2026");
  });

  it("steps back one calendar month", () => {
    const range = resolveRange("2026-10-19", "last-month");
    assert.equal(range.from, "2026-09-01");
    assert.equal(range.to, "2026-09-30");
    assert.equal(range.priorFrom, "2026-08-01");
  });

  it("uses the office week, Monday through Sunday", () => {
    const range = resolveRange("2026-10-19", "this-week");
    assert.equal(range.from, "2026-10-19");
    assert.equal(range.to, "2026-10-25");
    assert.equal(range.compare, "vs prior period");
  });

  it("keeps a custom range and swaps reversed dates", () => {
    const range = resolveRange("2026-10-19", "custom", "2026-10-10", "2026-10-02");
    assert.equal(range.from, "2026-10-02");
    assert.equal(range.to, "2026-10-10");
  });

  it("falls back to this month when a custom range is not a date", () => {
    const range = resolveRange("2026-10-19", "custom", "soon", "later");
    assert.equal(range.preset, "this-month");
    assert.equal(range.from, "2026-10-01");
  });
});

describe("buildOwnerHome", () => {
  it("counts booked revenue from deposit dates, not the design mock", () => {
    const jobs = bookedIn("2026-10-01", "2026-10-31");
    const revenue = jobs.reduce((sum, job) => sum + job.total, 0);
    const card = home.kpis.find((item) => item.id === "revenue-booked");
    assert.ok(card);
    assert.equal(card.missing, false);
    assert.notEqual(revenue, 186420);
    assert.equal(home.mixTotal, revenue);
    assert.equal(home.kpis.find((item) => item.id === "jobs-booked")?.value, String(jobs.length));
  });

  it("leaves metrics with no source unmarked as real numbers", () => {
    const missing = home.sources.filter((source) => source.state === "missing").map((source) => source.id);
    for (const id of ["speed-to-lead", "gross-margin", "cost-per-lead", "callbacks", "reputation"]) {
      assert.ok(missing.includes(id), id);
    }
    assert.equal(home.kpis.find((item) => item.id === "speed-to-lead")?.value, "Not connected");
    assert.equal(home.kpis.find((item) => item.id === "gross-margin")?.value, "Not connected");
    assert.equal(JSON.stringify(home).includes("4.9"), false);
    assert.equal(JSON.stringify(home).includes("$186"), false);
  });

  it("tags collected when Stripe has not settled a payment", () => {
    const card = home.kpis.find((item) => item.id === "collected");
    assert.equal(card?.tag, "Stripe not connected");
    assert.equal(card?.missing, false);
  });

  it("counts open pipeline stages from the office file", () => {
    assert.deepEqual(home.flow.map((stage) => stage.count), [9, 6, 9, 7, 5, 3]);
    assert.equal(home.sla.total, 7);
    assert.equal(home.sla.within, 4);
    assert.match(home.flow.find((stage) => stage.id === "permit")?.meta ?? "", /3 over 7 days/);
  });

  it("builds today's board from the office date", () => {
    assert.equal(home.schedule.length, 4);
    assert.equal(home.schedule[0]?.status, "En route");
    assert.equal(home.schedule.at(-1)?.status, "Inspection");
    assert.equal(home.ops.installUsed, 3);
    assert.equal(home.ops.installCap, 6);
  });

  it("does not invent ad platforms or a review score in the sales card", () => {
    const labels = home.sales.sources.map((source) => source.label);
    assert.equal(labels.includes("Google Ads"), false);
    assert.equal(labels.includes("Referral"), false);
    assert.ok(home.sales.sources.every((source) => source.count > 0));
  });

  it("changes the chart window with the month switch", () => {
    const last = buildOwnerHome(db, resolveRange("2026-10-19", "last-month"));
    assert.notEqual(last.mixTotal, home.mixTotal);
    assert.equal(last.schedule.length, home.schedule.length);
  });
});

describe("jobFamily", () => {
  it("reads heat pump ahead of the tank it replaces", () => {
    const job = { summary: "Gas tank to heat pump 65 gal", newUnit: "Heat pump 65 gal", existingUnit: "gas tank" } as Pick<Job, "summary" | "newUnit" | "existingUnit">;
    assert.equal(jobFamily(job), "heat_pump");
    assert.equal(jobFamily({ summary: "Tankless", newUnit: "Tankless gas", existingUnit: "Tankless gas" }), "tankless");
    assert.equal(jobFamily({ summary: "Gas tank 50 gal", newUnit: "Gas tank 50 gal", existingUnit: "gas tank" }), "tank");
  });
});

describe("greetingFor", () => {
  it("uses the Pacific hour and the first name", () => {
    assert.equal(greetingFor("Sample Admin", new Date("2026-10-19T22:00:00Z")), "Good afternoon, Sample");
    assert.equal(greetingFor("Sample Admin", new Date("2026-10-19T15:00:00Z")), "Good morning, Sample");
  });
});
