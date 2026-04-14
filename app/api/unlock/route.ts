import { NextRequest, NextResponse } from "next/server";

const SITE_PASSWORD = "123456";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password === SITE_PASSWORD) {
    const res = NextResponse.json({ success: true });
    res.cookies.set("site_unlocked", SITE_PASSWORD, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: "lax",
    });
    return res;
  }

  return NextResponse.json({ success: false, error: "Wrong password" }, { status: 401 });
}
