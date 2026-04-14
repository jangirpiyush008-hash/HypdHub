import { NextRequest, NextResponse } from "next/server";
import { fetchCurrentHypdCreator, convertHypdMarketplaceLink } from "@/lib/hypd-server";
import { generateHypdConversion } from "@/lib/hypd-links";
import { cleanUrlForHypd } from "@/lib/url-cleaner";

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
  const rawUrl = body?.sourceUrl?.trim() ?? "";

  if (!rawUrl) {
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

  // Step 1: Unwrap competitor short links (wishlink, earnkaro, etc.) and strip
  // their tracking params so we start from a clean marketplace URL.
  const cleanedUrl = await cleanUrlForHypd(rawUrl);

  const localConversion = generateHypdConversion(cleanedUrl, creator.hypdUsername);

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
      result: { ...localConversion, sourceUrl: rawUrl }
    });
  }

  try {
    const payload = (await convertHypdMarketplaceLink(cleanedUrl, creator)) as Record<string, unknown>;
    const shortLink = String(payload.hypd_link ?? localConversion.shortLink);

    // IMPORTANT: use our locally-built expandedLink (cleaned marketplace URL +
    // HYPD params) rather than echoing back payload.product_link — otherwise
    // the "Full Link" can still contain competitor tracking when HYPD's backend
    // echoes the input verbatim.
    const expandedLink = localConversion.expandedLink;

    return NextResponse.json({
      ok: true,
      result: {
        ...localConversion,
        sourceUrl: rawUrl,
        shortLink,
        expandedLink,
        commissionSource: buildCommissionSource(payload),
        notes: [
          `Converted live through HYPD for ${localConversion.marketplace}.`,
          "Short link from HYPD API. Full link is the cleaned marketplace URL with HYPD affiliate params."
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
