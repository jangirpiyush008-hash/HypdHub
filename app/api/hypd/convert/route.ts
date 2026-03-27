import { NextRequest, NextResponse } from "next/server";
import { fetchCurrentHypdCreator, convertHypdMarketplaceLink } from "@/lib/hypd-server";
import { generateHypdConversion } from "@/lib/hypd-links";

function buildCommissionSource(payload: Record<string, unknown>) {
  const commission = String(
    payload.commission_rate_text ??
      payload.commission ??
      payload.affiliate_program_name ??
      ""
  ).trim();

  if (commission) {
    return `Commission mapped from HYPD: ${commission}`;
  }

  return "Commission mapped from HYPD.";
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { sourceUrl?: string } | null;
  const sourceUrl = body?.sourceUrl?.trim() ?? "";

  if (!sourceUrl) {
    return NextResponse.json(
      {
        ok: false,
        message: "Source URL is required."
      },
      { status: 400 }
    );
  }

  const creator = await fetchCurrentHypdCreator();

  if (!creator) {
    return NextResponse.json(
      {
        ok: false,
        message: "Please login with your HYPD account first."
      },
      { status: 401 }
    );
  }

  const localConversion = generateHypdConversion(sourceUrl, creator.hypdUsername);

  if (!localConversion) {
    return NextResponse.json(
      {
        ok: false,
        message: "Unsupported or invalid URL."
      },
      { status: 400 }
    );
  }

  if (localConversion.marketplace === "HYPD Store") {
    return NextResponse.json({
      ok: true,
      result: localConversion
    });
  }

  try {
    const payload = (await convertHypdMarketplaceLink(sourceUrl, creator)) as Record<string, unknown>;

    return NextResponse.json({
      ok: true,
      result: {
        ...localConversion,
        shortLink: String(payload.hypd_link ?? localConversion.shortLink),
        expandedLink: String(payload.product_link ?? payload.original_link ?? sourceUrl),
        commissionSource: buildCommissionSource(payload),
        notes: [
          `Converted live through HYPD for ${localConversion.marketplace}.`,
          "This short link came from the real HYPD creator conversion flow."
        ]
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to convert this link on HYPD.";
    return NextResponse.json(
      {
        ok: false,
        message
      },
      { status: 400 }
    );
  }
}
