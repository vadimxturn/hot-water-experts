import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultPriceBook } from "../price-book";
import { quoteFor } from "../pricing";
import {
  canBook,
  canContinue,
  emptyDraft,
  firstOpenSlot,
  leadPatch,
  quoteInput,
  takePhotos,
  timingForSituation,
} from "./model";

const settings = { priceBook: defaultPriceBook, priceConfirmedOnSite: true };

describe("funnel pricing defaults", () => {
  it("prices a gas tank same-type swap from the price book", () => {
    const quote = quoteFor(settings, quoteInput({ ...emptyDraft(), currentType: "gas_tank" }));
    const good = quote.tiers.find((row) => row.tier === "good");
    const better = quote.tiers.find((row) => row.tier === "better");
    const best = quote.tiers.find((row) => row.tier === "best");
    assert.equal(good?.low, 1895);
    assert.equal(good?.high, 2365);
    assert.equal(better?.low, 2095);
    assert.equal(better?.high, 2565);
    assert.equal(best?.low, 2395);
    assert.equal(best?.high, 2590);
    assert.equal(quote.recommended, "better");
  });

  it("keeps the attic adder when a view collects location", () => {
    const quote = quoteFor(settings, quoteInput({ ...emptyDraft(), currentType: "gas_tank", location: "attic" }));
    const better = quote.tiers.find((row) => row.tier === "better");
    assert.equal(better?.low, 2395);
    assert.equal(better?.high, 3165);
  });

  it("uses the tankless starting range when a view sets the next unit", () => {
    const quote = quoteFor(settings, quoteInput({ ...emptyDraft(), currentType: "gas_tank", nextType: "tankless" }));
    assert.equal(quote.singleRange?.low, 4495);
  });
});

describe("funnel rules", () => {
  it("requires a 5 digit ZIP and a situation before those steps continue", () => {
    const draft = emptyDraft();
    assert.equal(canContinue(draft), false);
    assert.equal(canContinue({ ...draft, zip: "95819" }), true);
    assert.equal(canContinue({ ...draft, step: 2 }), false);
    assert.equal(canContinue({ ...draft, step: 2, situation: "leaking" }), true);
  });

  it("requires the deposit acknowledgement before booking", () => {
    const ready = {
      ...emptyDraft(),
      step: 6,
      name: "Sample Customer",
      email: "funnel.sample@example.com",
      phone: "9165550199",
      installDate: "2026-10-26",
      window: "8-10 AM",
    };
    assert.equal(canBook(ready), false);
    assert.equal(canBook({ ...ready, depositAck: true }), true);
  });

  it("maps urgent situations to the earliest timing and leaves location unset", () => {
    assert.equal(timingForSituation("no_hot_water"), "asap");
    assert.equal(timingForSituation("getting_old"), "this_week");
    const patch = leadPatch({
      ...emptyDraft(),
      zip: "95819",
      situation: "no_hot_water",
      currentType: "gas_tank",
    });
    assert.equal(patch.nextType, "same");
    assert.equal(patch.payMethod, "install");
    assert.equal(patch.timing, "asap");
    assert.equal(patch.location, undefined);
    assert.equal(patch.urgent, true);
  });

  it("rejects the wrong photo type and files over 10 MB", () => {
    const slots = ["data_plate", "whole_unit"];
    const bad = takePhotos([], [{ name: "notes.txt", type: "text/plain", size: 12 }], slots);
    assert.equal(bad.photos.length, 0);
    assert.match(bad.error || "", /JPG or PNG/);
    const huge = takePhotos([], [{ name: "plate.jpg", type: "image/jpeg", size: 11 * 1024 * 1024 }], slots);
    assert.equal(huge.photos.length, 0);
    const ok = takePhotos([], [{ name: "plate.png", type: "image/png", size: 1000 }], slots);
    assert.deepEqual(ok.photos, [{ slot: "data_plate", name: "plate.png" }]);
  });

  it("picks the earliest open arrival window", () => {
    const slot = firstOpenSlot(
      [
        { date: "2026-10-26", closed: false, slots: [{ window: "8-10 AM", full: false }, { window: "10 AM-12 PM", full: false }] },
      ],
      "2026-10-26",
    );
    assert.equal(slot.installDate, "2026-10-26");
    assert.equal(slot.window, "8-10 AM");
  });
});
