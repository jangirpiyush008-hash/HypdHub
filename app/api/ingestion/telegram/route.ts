import { NextResponse } from "next/server";
import { fetchTelegramSignalSummary } from "@/lib/integrations/telegram";

export async function GET() {
  const result = await fetchTelegramSignalSummary();
  return NextResponse.json(result);
}
