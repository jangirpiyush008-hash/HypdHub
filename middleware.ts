import { NextResponse } from "next/server";

// Site password gate removed. Keep middleware as a no-op so any future
// per-route auth logic has a single place to live.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
