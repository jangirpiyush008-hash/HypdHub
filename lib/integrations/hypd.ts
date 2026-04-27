import { CATALOG_URL, ENTITY_URL, ORDER_URL } from "@/lib/auth";
import { fetchCurrentHypdCreator, getStoredHypdCookies, UpstreamCookie } from "@/lib/hypd-server";
import { InternetDeal } from "@/lib/types";

type HypdProduct = {
  id: string;
  title: string;
  brandName: string;
  imageUrl: string | null;
  orderCount: number;
  productUrl: string | null;
};

type HypdBrand = {
  id: string;
  name: string;
  imageUrl: string | null;
  orderCount: number;
};

type HypdCommission = {
  label: string;
  commission: string;
};

type HypdStats = {
  sales: string | null;
  orders: string | null;
  withdrawable: string | null;
  pending: string | null;
};

function buildCookieHeader(cookies: UpstreamCookie[]) {
  return cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

async function hypdFetch(url: string, init: RequestInit, upstreamCookies: UpstreamCookie[]) {
  const headers = new Headers(init.headers);

  if (upstreamCookies.length > 0) {
    headers.set("Cookie", buildCookieHeader(upstreamCookies));
  }

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, {
    ...init,
    headers,
    cache: "no-store"
  });
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function pickNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/,/g, ""));
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function pickImage(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim()) {
        return item.trim();
      }

      if (item && typeof item === "object") {
        const object = item as Record<string, unknown>;
        const candidate = pickString(object.url, object.src, object.image);
        if (candidate) {
          return candidate;
        }
      }
    }
  }

  if (value && typeof value === "object") {
    const object = value as Record<string, unknown>;
    return pickString(object.url, object.src, object.image) || null;
  }

  return null;
}

/**
 * Convert HYPD's raw hot-selling-catalogs payload into InternetDeal[].
 *
 * HYPD aggregates products from Flipkart / Myntra / Shopsy / etc. and
 * exposes them through their authenticated catalog API. Field names are
 * not strictly documented, so we read defensively from common aliases
 * (marketplace / source_marketplace / source_brand_name / store_name)
 * to classify each product back to its source marketplace.
 *
 * Result deals link to https://www.hypd.store/<creator>/product/<id> —
 * which is HYPD's affiliate-tracked URL that redirects to the actual
 * marketplace with proper attribution baked in. Cleaner than scraping
 * because we keep HYPD's tracking pipeline intact.
 */
const KNOWN_MARKETPLACES: InternetDeal["marketplace"][] = [
  "Myntra", "Flipkart", "Meesho", "Ajio", "Nykaa", "Shopsy",
];

function classifyMarketplace(raw: unknown): InternetDeal["marketplace"] {
  const candidate = pickString(
    (raw as Record<string, unknown>).marketplace,
    (raw as Record<string, unknown>).source_marketplace,
    (raw as Record<string, unknown>).source_brand,
    (raw as Record<string, unknown>).store,
    (raw as Record<string, unknown>).store_name,
    (raw as Record<string, unknown>).source,
  ).toLowerCase();
  for (const m of KNOWN_MARKETPLACES) {
    if (candidate.includes(m.toLowerCase())) return m;
  }
  // Heuristic: source URL host
  const sourceUrl = pickString(
    (raw as Record<string, unknown>).source_url,
    (raw as Record<string, unknown>).original_url,
    (raw as Record<string, unknown>).external_url,
    (raw as Record<string, unknown>).redirect_url,
  );
  if (sourceUrl) {
    if (sourceUrl.includes("flipkart")) return "Flipkart";
    if (sourceUrl.includes("myntra")) return "Myntra";
    if (sourceUrl.includes("meesho")) return "Meesho";
    if (sourceUrl.includes("ajio")) return "Ajio";
    if (sourceUrl.includes("nykaa")) return "Nykaa";
    if (sourceUrl.includes("shopsy")) return "Shopsy";
  }
  return "HYPD";
}

export function hypdProductsToDeals(
  creatorUsername: string,
  productsPayload: unknown,
): InternetDeal[] {
  const now = new Date().toISOString();
  const result: InternetDeal[] = [];
  asArray(productsPayload).forEach((item, idx) => {
    const deal = ((): InternetDeal | null => {
      if (!item || typeof item !== "object") return null;
      const product = item as Record<string, unknown>;
      const id = pickString(product.id, product._id);
      if (!id) return null;

      const title = pickString(product.name, product.title, product.product_name);
      if (!title) return null;

      const marketplace = classifyMarketplace(product);
      const currentPrice = pickNumber(
        product.sale_price, product.price, product.discounted_price, product.current_price,
      ) || null;
      const originalPrice = pickNumber(
        product.mrp, product.original_price, product.list_price,
      ) || null;
      const discountPercent =
        currentPrice && originalPrice && originalPrice > currentPrice
          ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
          : pickNumber(product.discount_percent, product.discount) || null;

      const imageUrl =
        pickImage(product.images) ?? pickImage(product.image) ?? pickImage(product.defaultImage);

      const productUrl = creatorUsername
        ? `https://www.hypd.store/${creatorUsername}/product/${id}`
        : pickString(product.product_url, product.url) || null;

      const brandName = pickString(
        product.brand_name,
        (product.brand as Record<string, unknown> | undefined)?.name,
      ) || "Brand";

      return {
        id: `hypd-${id}`,
        marketplace,
        canonicalUrl: productUrl ?? "",
        originalUrl: productUrl ?? "",
        title,
        category: brandName,
        imageUrl,
        currentPrice,
        originalPrice,
        discountPercent,
        mentionsCount: 0,
        channelsCount: 1,
        channelNames: ["HYPD Catalog"],
        firstSeenAt: now,
        lastSeenAt: now,
        freshnessHours: 0,
        score: 100 - idx, // preserve HYPD's own ranking order
        validationStatus: "validated" as const,
        stockStatus: "in_stock" as const,
        sourceEvidence: ["HYPD hot-selling catalog"],
        confidenceScore: 90,
      } satisfies InternetDeal;
    })();
    if (deal) result.push(deal);
  });
  return result;
}

/**
 * Server-side helper for the sync route + worker. Calls HYPD's
 * authenticated hot-selling-catalogs endpoint with the given cookies and
 * returns the raw products array, which can then be passed into
 * hypdProductsToDeals().
 */
export async function fetchHypdCatalogRaw(upstreamCookies: UpstreamCookie[]): Promise<unknown[]> {
  if (upstreamCookies.length === 0) return [];
  const response = await hypdFetch(
    `${ORDER_URL}/api/hot-selling-catalogs`,
    { method: "GET" },
    upstreamCookies,
  );
  if (!response.ok) return [];
  const payload = await response.json().catch(() => null);
  return asArray(payload?.payload ?? payload?.data ?? payload);
}

function normalizeHotSellingProducts(
  creatorUsername: string,
  productsPayload: unknown,
  ordersPayload: unknown
) {
  const orderMap = new Map<string, number>();

  for (const item of asArray(ordersPayload)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const id = pickString(record.id);
    if (!id) continue;
    orderMap.set(id, pickNumber(record.number_of_orders));
  }

  return asArray(productsPayload)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const product = item as Record<string, unknown>;
      const id = pickString(product.id, product._id);
      if (!id) return null;

      return {
        id,
        title: pickString(product.name, product.title, product.product_name) || "HYPD Product",
        brandName: pickString(
          product.brand_name,
          (product.brand as Record<string, unknown> | undefined)?.name
        ) || "Brand",
        imageUrl: pickImage(product.images) ?? pickImage(product.image) ?? pickImage(product.defaultImage),
        orderCount: orderMap.get(id) ?? 0,
        productUrl: creatorUsername ? `https://www.hypd.store/${creatorUsername}/product/${id}` : null
      } satisfies HypdProduct;
    })
    .filter((item): item is HypdProduct => Boolean(item))
    .sort((left, right) => right.orderCount - left.orderCount)
    .slice(0, 10);
}

function normalizeHotSellingBrands(brandsPayload: unknown, ordersPayload: unknown) {
  const orderMap = new Map<string, number>();

  for (const item of asArray(ordersPayload)) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const id = pickString(record.brand_id, record.id);
    if (!id) continue;
    orderMap.set(id, pickNumber(record.number_of_orders));
  }

  return asArray(brandsPayload)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const brand = item as Record<string, unknown>;
      const id = pickString(brand.id, brand._id);
      if (!id) return null;

      return {
        id,
        name: pickString(brand.name, brand.title) || "Brand",
        imageUrl: pickImage(brand.image) ?? pickImage(brand.logo) ?? pickImage(brand.images),
        orderCount: orderMap.get(id) ?? 0
      } satisfies HypdBrand;
    })
    .filter((item): item is HypdBrand => Boolean(item))
    .sort((left, right) => right.orderCount - left.orderCount)
    .slice(0, 10);
}

function normalizeCommissionRules(payload: unknown) {
  const rules = asArray(payload)
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rule = item as Record<string, unknown>;
      const label =
        pickString(
          rule.marketplace,
          rule.brand_name,
          rule.name,
          (rule.brand as Record<string, unknown> | undefined)?.name
        ) || "Commission";
      const commission =
        pickString(
          rule.commission_rate_text,
          rule.commission_text,
          rule.display_commission,
          rule.commission
        ) || `${pickNumber(rule.commission_rate, rule.commission_percentage, rule.value)}%`;

      if (!commission || commission === "0%") {
        return null;
      }

      return {
        label,
        commission
      } satisfies HypdCommission;
    })
    .filter((item): item is HypdCommission => Boolean(item));

  const deduped = new Map<string, HypdCommission>();
  for (const rule of rules) {
    if (!deduped.has(rule.label)) {
      deduped.set(rule.label, rule);
    }
  }

  return Array.from(deduped.values()).slice(0, 12);
}

function normalizeStats(payload: unknown): HypdStats {
  if (!payload || typeof payload !== "object") {
    return {
      sales: null,
      orders: null,
      withdrawable: null,
      pending: null
    };
  }

  const stats = payload as Record<string, unknown>;

  return {
    sales: pickString(stats.total_sales, stats.sales, stats.sales_count) || null,
    orders: pickString(stats.orders, stats.total_orders, stats.order_count) || null,
    withdrawable: pickString(stats.withdrawable, stats.withdrawable_commission, stats.available_commission) || null,
    pending: pickString(stats.pending, stats.pending_commission) || null
  };
}

export async function fetchHypdProducts() {
  const upstreamCookies = await getStoredHypdCookies();
  const creator = await fetchCurrentHypdCreator(upstreamCookies);

  if (!creator || upstreamCookies.length === 0) {
    return {
      status: "login_required",
      notes: ["Login with HYPD to load live HYPD trending products and commission data."],
      hotSellingProducts: [] as HypdProduct[],
      hotSellingBrands: [] as HypdBrand[],
      marketplaceCommissions: [] as HypdCommission[],
      stats: {
        sales: null,
        orders: null,
        withdrawable: null,
        pending: null
      } satisfies HypdStats,
      lastSyncedAt: null as string | null
    };
  }

  const [ordersResponse, brandsResponse, commissionResponse, statsResponse] = await Promise.all([
    hypdFetch(`${ORDER_URL}/api/hot-selling-catalogs`, { method: "GET" }, upstreamCookies),
    hypdFetch(`${ORDER_URL}/api/hot-selling-brands`, { method: "GET" }, upstreamCookies),
    hypdFetch(`${ENTITY_URL}/api/app/commission-rule`, { method: "GET" }, upstreamCookies),
    hypdFetch(`${ENTITY_URL}/api/app/stats`, { method: "GET" }, upstreamCookies)
  ]);

  const hotSellingOrdersPayload = (await ordersResponse.json().catch(() => null))?.payload ?? [];
  const hotSellingBrandsPayload = (await brandsResponse.json().catch(() => null))?.payload ?? [];
  const commissionPayload = (await commissionResponse.json().catch(() => null))?.payload ?? [];
  const statsPayload = (await statsResponse.json().catch(() => null))?.payload ?? null;

  const catalogIds = asArray(hotSellingOrdersPayload)
    .map((item) => (item && typeof item === "object" ? pickString((item as Record<string, unknown>).id) : ""))
    .filter(Boolean);

  const productInfoPayload =
    catalogIds.length > 0
      ? (
          await hypdFetch(
            `${CATALOG_URL}/api/v2/app/catalog/basic?${catalogIds
              .map((id) => `id=${encodeURIComponent(id)}`)
              .join("&")}`,
            { method: "GET" },
            upstreamCookies
          ).then((response) => response.json().catch(() => null))
        )?.payload ?? []
      : [];

  const brandIds = asArray(hotSellingBrandsPayload)
    .map((item) =>
      item && typeof item === "object" ? pickString((item as Record<string, unknown>).brand_id, (item as Record<string, unknown>).id) : ""
    )
    .filter(Boolean);

  const brandInfoPayload =
    brandIds.length > 0
      ? (
          await hypdFetch(
            `${ENTITY_URL}/api/app/brand/basic`,
            {
              method: "POST",
              body: JSON.stringify({
                ids: brandIds
              })
            },
            upstreamCookies
          ).then((response) => response.json().catch(() => null))
        )?.payload ?? []
      : [];

  return {
    status: "live",
    notes: [
      "Live HYPD hot-selling products synced from the creator app APIs.",
      "Marketplace commissions are pulled from HYPD commission rules."
    ],
    hotSellingProducts: normalizeHotSellingProducts(creator.hypdUsername, productInfoPayload, hotSellingOrdersPayload),
    hotSellingBrands: normalizeHotSellingBrands(brandInfoPayload, hotSellingBrandsPayload),
    marketplaceCommissions: normalizeCommissionRules(commissionPayload),
    stats: normalizeStats(statsPayload),
    lastSyncedAt: new Date().toISOString()
  };
}

export async function fetchHypdUserSession() {
  const creator = await fetchCurrentHypdCreator();

  return creator
    ? {
        status: "authenticated",
        creator
      }
    : {
        status: "unauthenticated",
        creator: null
      };
}
