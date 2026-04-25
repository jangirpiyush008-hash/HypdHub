import { NextRequest, NextResponse } from "next/server";

const SITE_PASSWORD = "123456";
const COOKIE_NAME = "site_unlocked";
const PUBLIC_MARKETING_ROUTES = new Set([
  "/",
  "/about",
  "/academy",
  "/contact",
  "/services"
]);

function isPublicRoute(pathname: string) {
  return (
    PUBLIC_MARKETING_ROUTES.has(pathname) ||
    pathname === "/unlock" ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/logos/") ||
    pathname === "/favicon.ico"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const unlocked = request.cookies.get(COOKIE_NAME)?.value;
  if (unlocked === SITE_PASSWORD) {
    return NextResponse.next();
  }

  const unlockUrl = request.nextUrl.clone();
  unlockUrl.pathname = "/unlock";
  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logos/).*)"],
};
