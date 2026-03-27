import { NextRequest, NextResponse } from "next/server";
import { verifyHypdOtp } from "@/lib/hypd-server";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { mobileNumber?: string; otp?: string }
    | null;
  const result = await verifyHypdOtp(body?.mobileNumber ?? "", body?.otp ?? "");

  return NextResponse.json(result, {
    status: result.ok ? 200 : 400
  });
}
