import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/server/actions";

export const dynamic = "force-dynamic";

const links = [
  ["/tech", "Today"],
  ["/tech/schedule", "Schedule"],
  ["/tech/offers", "Offers"],
  ["/tech/profile", "Profile"],
];

export default async function TechLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/tech");
  return (
    <div className="min-h-dvh bg-[#f4f5f7] text-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
        <div className="flex-1">{children}</div>
        <nav className="sticky bottom-0 grid grid-cols-4 border-t border-line bg-white pb-3 pt-2 text-center text-[11px]">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="text-slate">{label}</Link>
          ))}
        </nav>
        <form action={logoutAction} className="sr-only"><button type="submit">Sign out</button></form>
      </div>
    </div>
  );
}
