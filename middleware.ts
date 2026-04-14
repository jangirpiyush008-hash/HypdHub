import { NextRequest, NextResponse } from "next/server";

const SITE_PASSWORD = "123456";
const COOKIE_NAME = "site_unlocked";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow the unlock page and API routes through
  if (pathname === "/unlock" || pathname.startsWith("/api/") || pathname.startsWith("/_next/") || pathname.startsWith("/logos/") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Check for unlock cookie
  const unlocked = request.cookies.get(COOKIE_NAME)?.value;
  if (unlocked === SITE_PASSWORD) {
    return NextResponse.next();
  }

  // Redirect to unlock page
  const unlockUrl = request.nextUrl.clone();
  unlockUrl.pathname = "/unlock";
  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logos/).*)"],
};
