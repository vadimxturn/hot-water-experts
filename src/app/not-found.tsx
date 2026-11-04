import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="font-sans text-3xl font-semibold">That page is not here.</h1>
        <p className="mt-2 text-sm text-slate">The link may be old, or the sample record was reset.</p>
        <Link href="/" className="btn-pill btn-pill-blue mt-4">Back home</Link>
      </div>
    </main>
  );
}
