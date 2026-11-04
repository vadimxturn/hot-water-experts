import Link from "next/link";
import { Logo } from "@/components/brand";
import { business } from "@/config/business";
import { formatLongDate, money, range } from "@/lib/format";
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

  return (
    <main className="min-h-dvh bg-[#f4f5f7] px-4 py-8 text-ink">
      <div className="mx-auto w-full max-w-md">
        <Logo className="mx-auto h-8 w-auto" />
        <div className="mt-8 rounded-3xl bg-white p-6">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-50 text-success">✓</div>
          <h1 className="mt-4 text-center font-sans text-3xl font-semibold tracking-[-0.02em]">
            {booked ? "You're booked." : "We have your estimate."}
          </h1>
          <p className="mt-2 text-center text-sm text-slate">
            {booked
              ? `Your $${db.settings.depositAmount} deposit is recorded and your install window is held.`
              : "The office can follow up. We will not text you unless you agreed."}
          </p>
          {lead && (
            <div className="mt-5 rounded-2xl bg-mist p-4 text-sm">
              {booked && (
                <>
                  <p className="font-medium">{lead.installDate ? formatLongDate(lead.installDate) : "Date pending"}</p>
                  <p className="text-slate">Arrival {lead.window}</p>
                </>
              )}
              <p className="mt-2">{lead.quoteLabel || lead.summary}</p>
              {lead.quoteLow && lead.quoteHigh && <p className="num">{range(lead.quoteLow, lead.quoteHigh)} estimated</p>}
              {booked && <p className="mt-2">{money(db.settings.depositAmount)} paid · Credited at install</p>}
              {lead.paymentMode === "stub" && booked && (
                <p className="mt-1 text-xs text-slate">Demo payment. Stripe was not charged.</p>
              )}
            </div>
          )}
          <div className="mt-5">
            <p className="text-sm font-medium">What happens next</p>
            <ul className="mt-2 space-y-2 text-sm text-slate">
              <li>Hot Water Experts texts and emails your confirmation when messaging is connected.</li>
              <li>
                {db.settings.priceConfirmedOnSite
                  ? "Your tech checks the setup and confirms the price before starting."
                  : "The price you accepted is the set price for this scope."}
              </li>
              <li>Need to change? Reschedule or cancel with 24+ hours&apos; notice for a refund of the deposit.</li>
            </ul>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {lead?.installDate && (
              <a href={`/api/calendar?lead=${lead.id}`} className="btn-pill btn-pill-ink">
                Add to calendar
              </a>
            )}
            {job?.trackingToken && (
              <Link href={`/t/${job.trackingToken}`} className="btn-pill border border-line text-center">
                Open your install link
              </Link>
            )}
            <Link href="/" className="text-center text-sm text-slate">
              Back to the site
            </Link>
          </div>
          <p className="mt-4 text-center text-xs text-slate">
            <Link href="/privacy" className="underline">Privacy</Link>
            {" · "}
            <Link href="/terms" className="underline">Terms</Link>
            {" · "}
            {business.phone}
          </p>
        </div>
      </div>
    </main>
  );
}
