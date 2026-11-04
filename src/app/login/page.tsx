import Link from "next/link";
import { Logo } from "@/components/brand";
import { loginAction } from "@/server/actions";

export const metadata = { title: "Staff sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-mist px-4">
      <form action={loginAction} className="w-full max-w-sm rounded-3xl bg-white p-6">
        <Logo className="h-8 w-auto" />
        <h1 className="mt-6 font-sans text-2xl font-semibold">Staff sign in</h1>
        <p className="mt-2 text-sm text-slate">
          Demo password is <span className="num">demo</span>. Sample accounts only.
        </p>
        {params.error && <p className="mt-3 text-sm text-danger">That email or password did not match.</p>}
        <input type="hidden" name="next" value={params.next || ""} />
        <label className="mt-4 block text-xs font-medium text-slate" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required defaultValue="admin@hotwaterexperts.demo" className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm" />
        <label className="mt-3 block text-xs font-medium text-slate" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required defaultValue="demo" className="mt-1 h-10 w-full rounded-xl border border-line px-3 text-sm" />
        <button className="btn-pill btn-pill-blue mt-4 w-full" type="submit">Sign in</button>
        <div className="mt-4 grid gap-2 text-xs text-slate">
          <p>admin@hotwaterexperts.demo · Owner</p>
          <p>office@hotwaterexperts.demo · Dispatcher</p>
          <p>tech.a@hotwaterexperts.demo · Technician</p>
        </div>
        <Link href="/" className="mt-4 block text-sm text-blue">Customer site</Link>
      </form>
    </main>
  );
}
