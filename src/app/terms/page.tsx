import Link from "next/link";
import { Logo } from "@/components/brand";
import { business } from "@/config/business";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-ink">
      <Link href="/"><Logo className="h-8 w-auto" /></Link>
      <h1 className="mt-8 text-4xl">Terms</h1>
      <p className="mt-4 text-sm text-danger">Placeholder pending legal review. Do not treat this page as finished terms.</p>
      <div className="mt-6 space-y-4 text-sm leading-6 text-graphite">
        <p>Estimates on this site are ranges from the current price book. {business.warranty}</p>
        <p>{business.depositPolicy} A no-show can forfeit the deposit. If an on-site check changes the price and you decline the work, the deposit is refunded.</p>
        <p>Permits are pulled for the jurisdiction that matches the address. License shown on the site: {business.license} {business.licenseClass}.</p>
        <p>Service area wording: {business.serviceArea}. {business.serviceAreaAssumption}</p>
        <p>Office: {business.hours}. {business.hoursNote}</p>
      </div>
    </main>
  );
}
