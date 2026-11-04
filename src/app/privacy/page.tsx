import Link from "next/link";
import { Logo } from "@/components/brand";
import { business } from "@/config/business";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 text-ink">
      <Link href="/"><Logo className="h-8 w-auto" /></Link>
      <h1 className="mt-8 text-4xl">Privacy</h1>
      <p className="mt-4 text-sm text-danger">Placeholder pending legal review. Do not treat this page as a finished policy.</p>
      <div className="mt-6 space-y-4 text-sm leading-6 text-graphite">
        <p>{business.legalName} will publish a privacy policy here. Until then, this is what the estimate form does with the details you type.</p>
        <p>The form stores your ZIP, answers, name, email, phone, and whether you checked the text-message box. The consent record keeps the time, the IP address when the host provides one, and the exact sentence you were shown.</p>
        <p>We do not text you unless that box is checked. You can reply STOP to opt out and HELP for help. Consent is not a condition of purchase. Message and data rates may apply.</p>
        <p>Photos you upload in this demo stay in the browser except for the file name, which is saved on the lead. Card numbers are not stored. Payments run through Stripe only when keys are configured.</p>
        <p>Questions: {business.email}. Phone: {business.phone}.</p>
      </div>
    </main>
  );
}
