import { NextResponse } from "next/server";
import { logoutHypdSession } from "@/lib/hypd-server";

export async function POST() {
  await logoutHypdSession();

  return NextResponse.json({
    ok: true
  });
}
