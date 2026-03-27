import { NextResponse } from "next/server";
import { fetchCurrentHypdCreator } from "@/lib/hypd-server";

export async function GET() {
  const creator = await fetchCurrentHypdCreator();

  if (!creator) {
    return NextResponse.json(
      {
        status: "unauthenticated",
        creator: null
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: "authenticated",
    creator
  });
}
