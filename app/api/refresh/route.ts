import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    ok: true,
    message: "Mock refresh completed. Real 2-hour job wiring is ready for HYPD APIs and Telegram channels."
  });
}
