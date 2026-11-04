import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSession } from "@/lib/session-token";

export async function middleware(request: NextRequest) {
  const session = await readSession(request.cookies.get("hwe_session")?.value);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (session.role === "tech") {
      return NextResponse.redirect(new URL("/tech", request.url));
    }
  }

  if (pathname.startsWith("/tech") && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/tech/:path*"],
};
