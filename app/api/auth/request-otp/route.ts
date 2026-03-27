import { NextRequest, NextResponse } from "next/server";
import { requestHypdOtp } from "@/lib/hypd-server";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { mobileNumber?: string } | null;
  const result = await requestHypdOtp(body?.mobileNumber ?? "");

  return NextResponse.json(result, {
    status: result.ok ? 200 : 400
  });
}
