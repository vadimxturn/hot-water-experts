import { BookedView } from "@/components/funnel/v3/booked-view";
import { formatHoldDate, formatLongDate, range, windowLabel } from "@/lib/format";
import { getDb } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "You're booked" };

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  const { lead: leadId } = await searchParams;
  const db = await getDb();
  const lead = db.leads.find((row) => row.id === leadId);
  const job = lead?.jobId ? db.jobs.find((row) => row.id === lead.jobId) : undefined;
  const booked = Boolean(lead?.depositPaid && job);
  const packageLine = lead?.quoteLabel ? lead.quoteLabel.replace(", ", " · ") : lead?.summary || "Estimate";
  const rangeLabel = lead?.quoteLow && lead?.quoteHigh ? `${range(lead.quoteLow, lead.quoteHigh)} [est.]` : "";
  const dateChip = lead?.installDate ? formatHoldDate(lead.installDate, "rail") : "";
  const arrival = windowLabel(lead?.window);

  return (
    <BookedView
      booked={booked}
      deposit={db.settings.depositAmount}
      dateLong={lead?.installDate ? formatLongDate(lead.installDate) : ""}
      dateChip={dateChip}
      arrival={arrival}
      packageLine={packageLine}
      rangeLabel={rangeLabel}
      zip={lead?.zip || ""}
      confirmedOnSite={db.settings.priceConfirmedOnSite}
      demo={!lead || lead.paymentMode !== "stripe"}
      calendarHref={booked && lead?.installDate ? `/api/calendar?lead=${lead.id}` : undefined}
    />
  );
}
