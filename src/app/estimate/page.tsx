import { Funnel } from "@/components/funnel/funnel";
import { earliestBookable, isClosed, mondayOf, slotsForDate } from "@/lib/availability";
import { addDays } from "@/lib/format";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";

export const metadata = { title: "Instant estimate" };

export default async function EstimatePage() {
  const db = await getDb();
  const earliest = earliestBookable(db);
  const start = mondayOf(earliest);
  const days = Array.from({ length: 56 }, (_, index) => {
    const date = addDays(start, index);
    const before = date < earliest;
    return {
      date,
      closed: before || isClosed(db, date),
      slots: slotsForDate(db, date).map((slot) => ({
        window: slot.window,
        full: before || slot.full,
      })),
    };
  });
  return (
    <Funnel
      priceBook={db.settings.priceBook}
      confirmedOnSite={db.settings.priceConfirmedOnSite}
      deposit={db.settings.depositAmount}
      earliest={earliest}
      days={days}
      jurisdictions={db.jurisdictions.map((row) => ({ id: row.id, name: row.name }))}
    />
  );
}
