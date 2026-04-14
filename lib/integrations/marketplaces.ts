import { InternetDeal } from "@/lib/types";

type PublicValidationResult = {
  validatedTitle: string | null;
  currentPrice: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  stockStatus: "in_stock" | "out_of_stock" | "unknown";
  validationStatus: "validated" | "failed";
};

const VALIDATION_TIMEOUT_MS = 6000;

function htmlDecode(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMetaContent(html: string, key: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return htmlDecode(match[1].trim());
    }
  }

  return null;
}

function extractJsonLd(html: string) {
  return Array.from(
    html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  )
    .map((match) => match[1]?.trim())
    .filter(Boolean);
}

function extractPriceCandidates(html: string) {
  const prices = new Set<number>();
  const patterns = [
    /"price"\s*:\s*"?(?:INR)?\s*([0-9]+(?:\.[0-9]{1,2})?)"?/gi,
    /"price"\s*content\s*=\s*"([0-9]+(?:\.[0-9]{1,2})?)"/gi,
    /₹\s*([0-9][0-9,]{1,8})/gi
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const value = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(value) && value > 0) {
        prices.add(value);
      }
    }
  }

  return Array.from(prices).sort((a, b) => a - b);
}

function extractStockStatus(html: string) {
  const lowered = html.toLowerCase();
  if (/(out of stock|sold out|currently unavailable|unavailable)/.test(lowered)) return "out_of_stock";
  if (/(in stock|available now|only few left|limited stock)/.test(lowered)) return "in_stock";
  return "unknown";
}

async function fetchValidatedPage(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
      },
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    return response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function validatePublicDeal(deal: InternetDeal): Promise<PublicValidationResult> {
  const html = await fetchValidatedPage(deal.canonicalUrl);

  if (!html) {
    return {
      validatedTitle: null,
      currentPrice: deal.currentPrice,
      originalPrice: deal.originalPrice,
      discountPercent: deal.discountPercent,
      stockStatus: "unknown",
      validationStatus: "failed"
    };
  }

  const ogTitle = extractMetaContent(html, "og:title");
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
  const validatedTitle = ogTitle ?? (titleTag ? htmlDecode(titleTag) : null);
  const stockStatus = extractStockStatus(html);
  const priceCandidates = extractPriceCandidates(html);

  let currentPrice = deal.currentPrice;
  let originalPrice = deal.originalPrice;

  if (priceCandidates.length > 0) {
    currentPrice = priceCandidates[0];
    originalPrice = priceCandidates.length > 1 ? priceCandidates[priceCandidates.length - 1] : deal.originalPrice;
  }

  const discountPercent =
    currentPrice && originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : deal.discountPercent;

  return {
    validatedTitle,
    currentPrice,
    originalPrice,
    discountPercent,
    stockStatus,
    validationStatus: "validated"
  };
}

export async function validateInternetDeals(deals: InternetDeal[]) {
  const validatedAt = new Date().toISOString();

  const results = await Promise.all(
    deals.map(async (deal) => {
      const validated = await validatePublicDeal(deal);
      const validationBonus =
        validated.validationStatus === "validated"
          ? validated.stockStatus === "in_stock"
            ? 18
            : 10
          : 0;

      return {
        ...deal,
        title: validated.validatedTitle ?? deal.title,
        currentPrice: validated.currentPrice,
        originalPrice: validated.originalPrice,
        discountPercent: validated.discountPercent,
        validationStatus: validated.validationStatus,
        validatedAt,
        validatedTitle: validated.validatedTitle,
        stockStatus: validated.stockStatus,
        sourceEvidence: [
          ...new Set([
            "Telegram channels",
            validated.validationStatus === "validated" ? `${deal.marketplace} public page` : ""
          ].filter(Boolean))
        ],
        score: deal.score + validationBonus
      } satisfies InternetDeal;
    })
  );

  return results.sort((left, right) => right.score - left.score);
}

export async function fetchMarketplaceSnapshots() {
  return {
    status: "public_web_strategy_ready",
    refreshWindowHours: 2,
    marketplaces: ["Myntra", "Meesho", "Flipkart", "Shopsy", "Ajio", "Nykaa"],
    categories: ["Beauty", "Fashion", "Sneakers", "Wearables", "Audio", "Home", "Studio"],
    strategy: [
      "Use Telegram, public deal communities, and marketplace pages as discovery sources",
      "Scrape bestseller pages",
      "Scrape category listing pages",
      "Scrape trending and sale sections",
      "Normalize listing price, original price, stock status, badge, and URL",
      "Rank with discount, price advantage, stock health, listing prominence, and repeat-source validation"
    ],
    rankingPriority: [
      "Discount strength",
      "Commission-friendly product potential",
      "Price attractiveness",
      "Stock availability",
      "Marketplace listing prominence",
      "Repeat appearance across public internet sources"
    ],
    marketplaceSignals: {
      Myntra: ["sale sections", "bestseller tags", "discount %", "stock visibility"],
      Meesho: ["trending sections", "super saver tags", "discount %", "stock visibility"],
      Flipkart: ["listing prominence", "discount %", "stock visibility", "bestseller labels"],
      Shopsy: ["price-led listings", "discount %", "listing prominence", "stock visibility"],
      Ajio: ["sale sections", "discount %", "listing prominence", "stock visibility"],
      Nykaa: ["beauty bestseller sections", "discount %", "offer labels", "stock visibility"]
    }
  };
}
