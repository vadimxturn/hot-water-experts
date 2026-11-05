import Link from "next/link";
import { business } from "@/config/business";
import { CheckMark } from "./art";
import { FunnelShell } from "./shell";
import { TextMeButton } from "./text-me";

export function BookedView({
  booked,
  deposit,
  dateLong,
  dateChip,
  arrival,
  packageLine,
  rangeLabel,
  zip,
  confirmedOnSite,
  demo,
  calendarHref,
}: {
  booked: boolean;
  deposit: number;
  dateLong: string;
  dateChip: string;
  arrival: string;
  packageLine: string;
  rangeLabel: string;
  zip: string;
  confirmedOnSite: boolean;
  demo: boolean;
  calendarHref?: string;
}) {
  const next = confirmedOnSite
    ? "Confirmation text and email when messaging is connected. Your tech checks the setup and confirms the price before starting. Reschedule or cancel with 24+ hours' notice for a full refund."
    : "Confirmation text and email when messaging is connected. The price you accepted is the set price for this scope. Reschedule or cancel with 24+ hours' notice for a full refund.";

  return (
    <FunnelShell step={7} dock={false} tip={booked ? "Tip: save this page." : undefined}>
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col lg:rounded-[28px] lg:border lg:border-[#E6E8EC] lg:px-10 lg:py-12 lg:shadow-[0_10px_40px_rgba(16,24,40,0.06)]">
        {booked ? (
          <>
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-[#E5F6EC] px-3 py-1 text-sm text-success lg:hidden">
              <span className="h-2 w-2 rounded-full bg-success" />
              Deposit paid
            </p>
            <div className="mx-auto mt-2 hidden h-14 w-14 place-items-center rounded-full bg-[#EAF1FE] text-blue lg:grid">
              <CheckMark className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-[32px] leading-9 lg:mt-5 lg:text-center lg:text-[44px] lg:leading-[50px]">You&apos;re booked.</h1>
            <p className="mt-2 text-[15px] leading-6 text-slate lg:hidden">
              Your ${deposit} deposit is paid and your install window is held.
            </p>
            <div className="mt-4 rounded-2xl border border-[#E6E8EC] px-4 py-4 lg:hidden">
              <p className="text-[17px] font-medium">{dateLong || "Date pending"}</p>
              <p className="mt-1 text-sm text-slate">Arrival {arrival}</p>
              <p className="mt-3 text-[15px]">{packageLine}</p>
              {rangeLabel ? <p className="mt-1 text-lg font-semibold">{rangeLabel}</p> : null}
              <p className="mt-2 text-sm font-medium text-success">${deposit} paid · Credited at install</p>
            </div>
            <p className="mt-3 hidden text-center text-[15px] font-medium lg:block">{dateChip}{arrival ? ` · ${arrival}` : ""}{zip ? ` · ZIP ${zip}` : ""}</p>
            <p className="mt-1 hidden text-center text-sm text-slate lg:block">
              {packageLine}{rangeLabel ? ` · ${rangeLabel}` : ""} · ${deposit} deposit paid
            </p>
            <div className="mt-5 lg:rounded-2xl lg:bg-[#F4F6F8] lg:px-4 lg:py-4">
              <p className="text-[15px] font-medium">What happens next</p>
              <p className="mt-2 text-sm leading-6 text-graphite">{next}</p>
            </div>
            {demo ? <p className="mt-3 text-sm text-slate lg:text-center">Demo payment. No card was charged, and no text or email was sent.</p> : null}
            <div className="mt-6 flex flex-col items-center gap-3 lg:flex-row lg:justify-center">
              {calendarHref ? (
                <div className="w-full lg:hidden">
                  <a href={calendarHref} className="btn-pill btn-pill-ink h-[52px] w-full">Add to calendar</a>
                </div>
              ) : null}
              {calendarHref ? (
                <div className="hidden lg:block">
                  <a href={calendarHref} className="btn-pill btn-pill-blue h-[52px] px-6">Add to calendar</a>
                </div>
              ) : null}
              <div className="hidden lg:block">
                <TextMeButton />
              </div>
            </div>
            <p className="mt-4 hidden text-center text-sm text-slate lg:block">
              Questions? {business.phone} · {business.name}
            </p>
            <p className="mt-4 text-center text-xs text-slate lg:hidden">
              <Link href="/privacy" className="underline">Privacy</Link>
              {" · "}
              <Link href="/terms" className="underline">Terms</Link>
              {" · "}
              {business.phone}
            </p>
            {/* PLACEHOLDER: license, warranty, and reviews. No counts or ratings. */}
            <p className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-center text-[12px] leading-5 text-slate">
              <span>License {business.license}</span>
              <span>Warranty {business.warranty}</span>
              <span>Reviews {business.reviews}</span>
            </p>
          </>
        ) : (
          <div className="lg:text-center">
            <h1 className="text-[32px] leading-9">We have your estimate.</h1>
            <p className="mt-3 text-[15px] leading-6 text-slate">The office can follow up. We will not text you unless you agreed.</p>
            <Link href="/" className="btn-pill mt-6 inline-flex border border-[#E6E8EC]">Back to the site</Link>
          </div>
        )}
      </div>
    </FunnelShell>
  );
}
