import { NextResponse } from "next/server";
import { mockCreatorProfile } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({
    status: "mock_session_ready",
    creator: mockCreatorProfile,
    note: "Replace with real HYPD auth flow tomorrow."
  });
}
