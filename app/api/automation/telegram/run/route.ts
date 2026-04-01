import { NextResponse } from "next/server";
import { fetchCurrentHypdCreator, convertHypdMarketplaceLinkForStoredCreator } from "@/lib/hypd-server";
import { getTelegramAutomationsForCreator } from "@/lib/runtime/telegram-automations";
import { fetchTelegramDeals } from "@/lib/integrations/telegram";
import { InternetDeal } from "@/lib/types";
import { postDealToTelegramAutomation } from "@/lib/telegram-bot";
import { TelegramAutomation } from "@/lib/automation-config";

function pickCandidateDeal(automation: TelegramAutomation, deals: InternetDeal[]) {
  const sourceLabel = automation.sourceChannelLabel.trim().toLowerCase();
  const sourceId = automation.sourceChannelId.trim().toLowerCase();

  const filtered = deals.filter((deal) => {
    if (automation.sourceMode === "official_hypd") {
      return deal.channelNames.some((name) => name.toLowerCase().includes("official hypd deals"));
    }

    return deal.channelNames.some((name) => {
      const lowered = name.toLowerCase();
      return (sourceLabel && lowered.includes(sourceLabel)) || (sourceId && lowered.includes(sourceId));
    });
  });

  const pool = filtered.length > 0 ? filtered : deals;
  return pool[0] ?? null;
}

function renderCaption(template: string, deal: InternetDeal, link: string) {
  const fallback = [
    deal.title,
    `${deal.marketplace}${deal.currentPrice ? ` • Rs ${deal.currentPrice}` : ""}`,
    link
  ]
    .filter(Boolean)
    .join("\n");

  if (!template.trim()) {
    return fallback;
  }

  return template
    .replaceAll("{title}", deal.title)
    .replaceAll("{marketplace}", deal.marketplace)
    .replaceAll("{price}", deal.currentPrice ? `Rs ${deal.currentPrice}` : "")
    .replaceAll("{link}", link)
    .replaceAll("{category}", deal.category);
}

export async function POST() {
  const creator = await fetchCurrentHypdCreator();

  if (!creator) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  const automations = (await getTelegramAutomationsForCreator(creator.id)).filter(
    (automation) => automation.enabled && automation.autoPostingEnabled
  );

  if (automations.length === 0) {
    return NextResponse.json({ ok: false, message: "No enabled Telegram auto-posting automation found." }, { status: 400 });
  }

  const telegram = await fetchTelegramDeals(true);
  const rankedDeals = Object.values(telegram.topDealsByMarketplace).flat();

  if (rankedDeals.length === 0) {
    return NextResponse.json({ ok: false, message: "No live deals available to post right now." }, { status: 400 });
  }

  const results = await Promise.all(
    automations.map(async (automation) => {
      try {
        const deal = pickCandidateDeal(automation, rankedDeals);

        if (!deal) {
          return {
            automationId: automation.id,
            automationName: automation.name || "Telegram automation",
            ok: false,
            message: "No matching live deal found."
          };
        }

        const conversion = (await convertHypdMarketplaceLinkForStoredCreator(creator.id, deal.originalUrl)) as Record<
          string,
          unknown
        >;
        const convertedLink = String(conversion.hypd_link ?? conversion.product_link ?? deal.originalUrl);
        const caption = renderCaption(automation.captionTemplate, deal, convertedLink);

        await postDealToTelegramAutomation(automation, {
          text: caption,
          imageUrl: null
        });

        return {
          automationId: automation.id,
          automationName: automation.name || "Telegram automation",
          ok: true,
          postedDeal: deal.title,
          postedLink: convertedLink
        };
      } catch (error) {
        return {
          automationId: automation.id,
          automationName: automation.name || "Telegram automation",
          ok: false,
          message: error instanceof Error ? error.message : "Telegram automation failed."
        };
      }
    })
  );

  return NextResponse.json({
    ok: results.some((item) => item.ok),
    results
  });
}
