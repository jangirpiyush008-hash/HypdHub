import { cleanUrlForHypdSync, extractMarketplaceFromDeepLink, stripCompetitorParams } from "./url-cleaner";

const HYPD_HOSTS = new Set(["hypd.store", "www.hypd.store"]);

type Marketplace =
  | "HYPD Store"
  | "Myntra"
  | "Flipkart"
  | "Meesho"
  | "Shopsy"
  | "Nykaa"
  | "Ajio"
  | "Amazon"
  | "Unsupported";

type HypdPathType = "collection" | "product" | "brand" | "afflink" | "unknown";

export type HypdConversionResult = {
  sourceUrl: string;
  marketplace: Marketplace;
  shortLink: string;
  expandedLink: string;
  commissionSource: string;
  notes: string[];
  hypdPathType?: HypdPathType;
  entityId?: string;
  sourceUsername?: string;
  clickId?: string;
  creatorUsername: string;
};

function sanitizeUsername(username: string) {
  return username.trim().replace(/^@/, "").toLowerCase() || "creator";
}

function makeClickId(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `d${Math.abs(hash >>> 0).toString(36).padEnd(19, "0").slice(0, 19)}`;
}

function appendSearchParams(url: URL, params: Record<string, string>) {
  const next = new URL(url.toString());

  Object.entries(params).forEach(([key, value]) => {
    next.searchParams.set(key, value);
  });

  return next.toString();
}

function detectMarketplace(url: URL): Marketplace {
  const host = url.hostname.toLowerCase();

  if (HYPD_HOSTS.has(host)) return "HYPD Store";
  if (host.includes("myntra")) return "Myntra";
  if (host.includes("flipkart")) return "Flipkart";
  if (host.includes("meesho")) return "Meesho";
  if (host.includes("shopsy")) return "Shopsy";
  if (host.includes("nykaa")) return "Nykaa";
  if (host.includes("ajio")) return "Ajio";
  if (host.includes("amazon")) return "Amazon";

  return "Unsupported";
}

function parseHypdPath(url: URL): {
  pathType: HypdPathType;
  username: string | null;
  entityId: string | null;
} {
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length < 3) {
    return { pathType: "unknown" as HypdPathType, username: null, entityId: null };
  }

  const [username, pathType, entityId] = parts;

  if (pathType === "collection" || pathType === "product" || pathType === "brand" || pathType === "afflink") {
    return {
      pathType,
      username,
      entityId: entityId ?? null
    };
  }

  return { pathType: "unknown" as HypdPathType, username, entityId: entityId ?? null };
}

function buildHypdStoreLink(url: URL, creatorUsername: string): HypdConversionResult {
  const { pathType, entityId, username } = parseHypdPath(url);
  const normalizedUsername = sanitizeUsername(creatorUsername);
  const nextUrl = new URL(url.toString());
  const pathParts = nextUrl.pathname.split("/").filter(Boolean);

  if (pathParts.length >= 1) {
    pathParts[0] = normalizedUsername;
    nextUrl.pathname = `/${pathParts.join("/")}`;
  }

  return {
    sourceUrl: url.toString(),
    marketplace: "HYPD Store",
    shortLink: nextUrl.toString(),
    expandedLink: nextUrl.toString(),
    commissionSource: "Commission should be mapped from HYPD for HYPD Store products, brands, and collections.",
    notes: [
      "Preserves the HYPD collection, product, or brand route while personalizing the creator username.",
      "Ready to swap to live HYPD API validation once link-save and auth endpoints are available."
    ],
    hypdPathType: pathType,
    entityId: entityId ?? undefined,
    sourceUsername: username ?? undefined,
    creatorUsername: normalizedUsername
  };
}

function buildMarketplaceLinks(url: URL, creatorUsername: string, marketplace: Exclude<Marketplace, "HYPD Store" | "Unsupported">): HypdConversionResult {
  const normalizedUsername = sanitizeUsername(creatorUsername);
  const clickId = makeClickId(`${marketplace}:${url.toString()}`);
  const shortLink = `https://hypd.store/${normalizedUsername}/afflink/${clickId}`;
  let expandedLink = url.toString();

  if (marketplace === "Myntra") {
    expandedLink = appendSearchParams(url, {
      af_siteid: "68b81dcedc7e01ec6a4a8435",
      clickid: clickId,
      utm_source: "Hypd",
      af_xp: "custom",
      af_force_deeplink: "true",
      host_internal: "single_product",
      pid: "hypdmarke3gf_int",
      is_retargeting: "true",
      af_click_lookback: "1d",
      product_name: "product",
      utm_medium: "hypd.store",
      deep_link_value: `myntra://myntra.com${url.pathname ? url.pathname : "/"}`,
      c: "gh_hypd"
    });
  }

  if (marketplace === "Flipkart") {
    expandedLink = appendSearchParams(url, {
      affExtParam1: "68b81dcedc7e01ec6a4a8435",
      affExtParam2: clickId,
      affid: "hypdfk"
    });
  }

  if (marketplace === "Meesho") {
    expandedLink = appendSearchParams(url, {
      af_force_deeplink: "true",
      host_internal: "single_product",
      pid: "hypdmarke3gf_int",
      is_retargeting: "true",
      product_name: "product",
      utm_source: "Hypd",
      clickid: clickId,
      af_siteid: "68b81dcedc7e01ec6a4a8435"
    });
  }

  if (marketplace === "Shopsy") {
    expandedLink = appendSearchParams(url, {
      _appId: "WA",
      _refId: "PP.ff3936aa-4f0e-4baf-a67f-023b7d287b35.MRUGHGDAVJTMBX9Y",
      affExtParam1: "68b81dcedc7e01ec6a4a8435",
      affExtParam2: clickId,
      affid: "infhypd",
      cmpid: "AFF_infhypd"
    });
  }

  if (marketplace === "Nykaa") {
    expandedLink = appendSearchParams(url, {
      utm_source: "admitad",
      utm_campaign: "2103564_68b81dcedc7e01ec6a4a8435",
      tagtag_uid: makeClickId(`nykaa:${clickId}`).replace(/^d/, "")
    });
  }

  if (marketplace === "Ajio") {
    expandedLink = appendSearchParams(url, {
      utm_source: "Admitad",
      utm_medium: "affiliate",
      utm_campaign: "2103564",
      utm_term: "sub_68b81dcedc7e01ec6a4a8435",
      clickid: makeClickId(`ajio:${clickId}`).replace(/^d/, "69"),
      pid: "11",
      offer_id: "2",
      attribution_window: "2D",
      return_cancellation_window: "45D"
    });
  }

  if (marketplace === "Amazon") {
    expandedLink = appendSearchParams(url, {
      tag: "hypd0f-21",
      linkCode: "ogi",
      th: "1",
      psc: "1",
      utm_source: "hypd",
      utm_medium: "affiliate",
      utm_campaign: normalizedUsername,
      ref_: `as_li_ss_tl_${clickId}`
    });
  }

  return {
    sourceUrl: url.toString(),
    marketplace,
    shortLink,
    expandedLink,
    commissionSource: "Commission should be fetched and mapped from HYPD once marketplace payout APIs are connected.",
    notes: [
      `Short link follows the HYPD afflink format for ${marketplace}.`,
      "Expanded destination preserves the marketplace URL and appends HYPD-style attribution parameters."
    ],
    clickId,
    creatorUsername: normalizedUsername
  };
}

export function generateHypdConversion(sourceUrl: string, creatorUsername: string) {
  const input = sourceUrl.trim();

  if (!input) {
    return null;
  }

  try {
    // Clean competitor/affiliate params & unwrap deep_link_value before building HYPD URL.
    // (Sync variant — does not follow HTTP redirects; callers handling competitor short
    // links like wishlink.com/share/xyz should pre-resolve via cleanUrlForHypd.)
    const cleaned = cleanUrlForHypdSync(input);
    const url = new URL(cleaned);
    const marketplace = detectMarketplace(url);

    if (marketplace === "HYPD Store") {
      return buildHypdStoreLink(url, creatorUsername);
    }

    if (marketplace === "Unsupported") {
      return {
        sourceUrl: input,
        marketplace,
        shortLink: "",
        expandedLink: "",
        commissionSource: "Unsupported marketplace. HYPD commission mapping is unavailable for this URL.",
        notes: ["Paste a HYPD, Myntra, Flipkart, Meesho, Shopsy, Nykaa, or Ajio URL."],
        creatorUsername: sanitizeUsername(creatorUsername)
      } satisfies HypdConversionResult;
    }

    return buildMarketplaceLinks(url, creatorUsername, marketplace);
  } catch {
    return null;
  }
}

// Re-export for convenience so callers can clean URLs without importing url-cleaner separately.
export { cleanUrlForHypdSync, extractMarketplaceFromDeepLink, stripCompetitorParams };
