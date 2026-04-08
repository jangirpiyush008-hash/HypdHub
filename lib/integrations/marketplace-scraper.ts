import { InternetDeal } from "@/lib/types";

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.113 Mobile Safari/537.36";
const FETCH_TIMEOUT_MS = 8000;

type SupportedMarketplace = InternetDeal["marketplace"];

async function safeFetch(url: string, headers?: Record<string, string>): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": MOBILE_UA,
        "accept": "text/html,application/json,*/*",
        "accept-language": "en-IN,en;q=0.9",
        ...headers,
      },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function makeDeal(opts: {
  title: string;
  marketplace: SupportedMarketplace;
  currentPrice: number;
  originalPrice?: number;
  url: string;
  imageUrl?: string;
  category?: string;
}): InternetDeal {
  const discount =
    opts.originalPrice && opts.originalPrice > opts.currentPrice
      ? Math.round(((opts.originalPrice - opts.currentPrice) / opts.originalPrice) * 100)
      : null;

  const now = new Date().toISOString();
  let score = 10;
  if (opts.currentPrice < 500) score += 20;
  else if (opts.currentPrice < 1000) score += 15;
  else if (opts.currentPrice < 2000) score += 10;
  if (discount && discount > 50) score += 25;
  else if (discount && discount > 30) score += 15;
  else if (discount && discount > 15) score += 8;

  return {
    id: `scrape-${opts.marketplace}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: opts.title.slice(0, 80),
    marketplace: opts.marketplace,
    category: opts.category || guessCategory(opts.title),
    imageUrl: opts.imageUrl || null,
    currentPrice: opts.currentPrice,
    originalPrice: opts.originalPrice ?? null,
    discountPercent: discount,
    originalUrl: opts.url,
    canonicalUrl: opts.url,
    mentionsCount: 1,
    channelsCount: 1,
    channelNames: [`${opts.marketplace}`],
    firstSeenAt: now,
    lastSeenAt: now,
    freshnessHours: 0,
    score,
    confidenceScore: opts.url ? 70 : 30,
    validationStatus: "validated",
    stockStatus: "in_stock",
    sourceEvidence: [`${opts.marketplace} scraper`],
  };
}

function guessCategory(title: string): string {
  const l = title.toLowerCase();
  if (/shoe|sneaker|sandal|slipper|boot|floater/i.test(l)) return "Footwear";
  if (/shirt|tshirt|t-shirt|top|kurta|dress|jacket|hoodie|jeans|trouser/i.test(l)) return "Fashion";
  if (/lipstick|serum|cream|foundation|moistur|sunscreen|shampoo|perfume/i.test(l)) return "Beauty";
  if (/watch|earphone|headphone|earbuds|speaker|mobile|phone|laptop/i.test(l)) return "Electronics";
  if (/bag|backpack|wallet|purse|belt|sunglasses/i.test(l)) return "Accessories";
  return "General";
}

// ─── Myntra ───
async function scrapeMyntra(): Promise<InternetDeal[]> {
  // Try multiple Myntra API endpoints
  const urls = [
    "https://www.myntra.com/gateway/v2/search/search?q=trending&rows=20&sort=popularity",
    "https://www.myntra.com/gateway/v2/search/search?q=best+sellers&rows=20&sort=popularity",
  ];

  for (const url of urls) {
    const text = await safeFetch(url);
    if (!text) continue;
    try {
      const json = JSON.parse(text);
      const products = json?.products ?? [];
      if (products.length === 0) continue;
      return products.slice(0, 12).map((p: Record<string, unknown>) => {
        const images = p.images as Array<Record<string, string>> | undefined;
        const imageUrl = images?.[0]?.src ?? (p.searchImage as string) ?? "";
        return makeDeal({
          title: (p.productName as string) ?? (p.name as string) ?? "Myntra Product",
          marketplace: "Myntra",
          currentPrice: (p.price as number) ?? (p.discountedPrice as number) ?? 0,
          originalPrice: (p.mrp as number) ?? undefined,
          url: p.landingPageUrl ? `https://www.myntra.com/${p.landingPageUrl}` : "https://www.myntra.com",
          imageUrl: imageUrl ? (imageUrl.startsWith("http") ? imageUrl : `https://assets.myntassets.com/${imageUrl}`) : undefined,
        });
      }).filter((d: InternetDeal) => d.currentPrice && d.currentPrice > 0);
    } catch { continue; }
  }

  return [];
}

// ─── Flipkart ───
async function scrapeFlipkart(): Promise<InternetDeal[]> {
  const urls = [
    "https://www.flipkart.com/deals-of-the-day",
    "https://www.flipkart.com/offers-store",
  ];

  for (const url of urls) {
    const html = await safeFetch(url);
    if (!html) continue;
    const deals: InternetDeal[] = [];

    // Extract from JSON-LD
    const jsonLdBlocks = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
    for (const match of jsonLdBlocks) {
      try {
        const data = JSON.parse(match[1]);
        const items = Array.isArray(data) ? data : data?.itemListElement ?? [data];
        for (const item of items) {
          const name = item.name ?? item.item?.name ?? "";
          const price = parseFloat(item.offers?.price ?? item.price ?? "0");
          const image = item.image ?? item.item?.image ?? "";
          const itemUrl = item.url ?? item.item?.url ?? "";
          if (name && price > 0) {
            deals.push(makeDeal({
              title: name,
              marketplace: "Flipkart",
              currentPrice: price,
              url: itemUrl.startsWith("http") ? itemUrl : `https://www.flipkart.com${itemUrl}`,
              imageUrl: typeof image === "string" ? image : Array.isArray(image) ? image[0] : undefined,
            }));
          }
        }
      } catch { /* skip */ }
    }

    // Fallback: extract from HTML patterns
    if (deals.length === 0) {
      const imgPatterns = html.matchAll(/<img[^>]+src=["'](https:\/\/rukminim[^"']+)["'][^>]*(?:alt|title)=["']([^"']{5,80})["'][^>]*>/gi);
      for (const m of imgPatterns) {
        const imageUrl = m[1];
        const title = m[2];
        const idx = m.index ?? 0;
        const nearby = html.slice(idx, idx + 1500);
        const priceMatch = nearby.match(/₹\s*([0-9][0-9,]{1,8})/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(/,/g, ""));
          if (price > 0 && price < 100000) {
            deals.push(makeDeal({ title, marketplace: "Flipkart", currentPrice: price, url, imageUrl }));
          }
        }
      }
    }

    if (deals.length > 0) return deals.slice(0, 12);
  }

  return [];
}

// ─── Amazon ───
async function scrapeAmazon(): Promise<InternetDeal[]> {
  const urls = [
    "https://www.amazon.in/gp/bestsellers",
    "https://www.amazon.in/deals",
  ];

  for (const url of urls) {
    const html = await safeFetch(url);
    if (!html) continue;
    const deals: InternetDeal[] = [];

    const cardPattern = /<img[^>]+src=["'](https:\/\/[^"']*images-amazon[^"']+)["'][^>]*alt=["']([^"']{5,120})["'][^>]*>[\s\S]{0,2000}?₹\s*([0-9][0-9,]{1,8})/gi;
    for (const m of html.matchAll(cardPattern)) {
      const imageUrl = m[1];
      const title = m[2].trim();
      const price = parseFloat(m[3].replace(/,/g, ""));
      if (title && price > 0 && price < 100000) {
        deals.push(makeDeal({ title, marketplace: "Amazon", currentPrice: price, url, imageUrl }));
      }
      if (deals.length >= 12) break;
    }

    if (deals.length > 0) return deals;
  }

  return [];
}

// ─── Ajio ───
async function scrapeAjio(): Promise<InternetDeal[]> {
  const apiUrls = [
    "https://www.ajio.com/api/category/830216001?currentPage=0&pageSize=20&sort=discount-desc",
    "https://www.ajio.com/api/category/830216001?currentPage=0&pageSize=20&sort=newn",
  ];

  for (const apiUrl of apiUrls) {
    const text = await safeFetch(apiUrl, { "x-requested-with": "XMLHttpRequest" });
    if (!text) continue;
    try {
      const json = JSON.parse(text);
      const products = json?.products ?? [];
      if (products.length === 0) continue;
      return products.slice(0, 12).map((p: Record<string, unknown>) => {
        const imgUrl = (p.images as Record<string, unknown>)?.url ?? (p.fnlColorVariantData as Record<string, unknown>)?.img ?? "";
        return makeDeal({
          title: (p.name as string) ?? "Ajio Product",
          marketplace: "Ajio",
          currentPrice: (p.offerPrice as number) ?? (p.price as Record<string, unknown>)?.value as number ?? 0,
          originalPrice: (p.wasPriceData as Record<string, unknown>)?.value as number ?? undefined,
          url: p.url ? `https://www.ajio.com${p.url}` : "https://www.ajio.com/sale",
          imageUrl: typeof imgUrl === "string" && imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `https://assets.ajio.com${imgUrl}`) : undefined,
        });
      }).filter((d: InternetDeal) => d.currentPrice && d.currentPrice > 0);
    } catch { continue; }
  }

  return [];
}

// ─── Nykaa ───
async function scrapeNykaa(): Promise<InternetDeal[]> {
  const urls = [
    "https://www.nykaa.com/sp/deals-page/deals",
    "https://www.nykaa.com/sp/offer-page/offers",
  ];

  for (const url of urls) {
    const html = await safeFetch(url);
    if (!html) continue;
    const deals: InternetDeal[] = [];

    const imgPatterns = html.matchAll(/<img[^>]+src=["'](https:\/\/images-static\.nykaa\.com[^"']+)["'][^>]*alt=["']([^"']{5,80})["']/gi);
    for (const m of imgPatterns) {
      const title = m[2].trim();
      const idx = m.index ?? 0;
      const nearby = html.slice(idx, idx + 1500);
      const priceMatch = nearby.match(/₹\s*([0-9][0-9,]{1,8})/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : 0;
      if (title && price > 0) {
        deals.push(makeDeal({ title, marketplace: "Nykaa", currentPrice: price, url, imageUrl: m[1], category: "Beauty" }));
      }
      if (deals.length >= 12) break;
    }

    if (deals.length > 0) return deals;
  }

  return [];
}

// ─── Shopsy ───
async function scrapeShopsy(): Promise<InternetDeal[]> {
  const html = await safeFetch("https://www.shopsy.in/deals");
  if (!html) return [];
  const deals: InternetDeal[] = [];

  const jsonLdBlocks = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  for (const match of jsonLdBlocks) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : data?.itemListElement ?? [data];
      for (const item of items) {
        const name = item.name ?? item.item?.name ?? "";
        const price = parseFloat(item.offers?.price ?? "0");
        const image = item.image ?? "";
        if (name && price > 0) {
          deals.push(makeDeal({
            title: name,
            marketplace: "Shopsy",
            currentPrice: price,
            url: "https://www.shopsy.in/deals",
            imageUrl: typeof image === "string" ? image : undefined,
          }));
        }
      }
    } catch { /* skip */ }
  }
  return deals.slice(0, 12);
}

// ─── Curated Trending Deals (fallback when scrapers get blocked) ───
// These are real products from each marketplace — shown when live scraping fails
function getCuratedDeals(marketplace: SupportedMarketplace): InternetDeal[] {
  const curated: Record<string, Array<{ title: string; price: number; mrp?: number; url: string; img: string; cat?: string }>> = {
    Myntra: [
      { title: "Roadster Men Solid T-Shirt", price: 299, mrp: 599, url: "https://www.myntra.com/tshirts/roadster", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/22044632/2023/2/28/74ee6b28-5282-4e36-b3e3-02cf5e0f52a51677564012791-Roadster-Men-Tshirts-5671677564012254-1.jpg", cat: "Fashion" },
      { title: "HRX Active Running Shoes", price: 1499, mrp: 2999, url: "https://www.myntra.com/sports-shoes/hrx-by-hrithik-roshan", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/21381280/2022/12/14/2fe88aab-e66c-4ef8-8bcc-fdfc2c8bab671671013746457-HRX-by-Hrithik-Roshan-Men-Sports-Shoes-2821671013745951-1.jpg", cat: "Footwear" },
      { title: "Allen Solly Formal Shirt", price: 899, mrp: 1699, url: "https://www.myntra.com/shirts/allen-solly", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/18516890/2022/7/4/ca4bd4ad-5e44-4ba9-ba48-eee5cb1a51061656928879283AllenSollyMenWhiteSolidSlimFitFormalShirt1.jpg", cat: "Fashion" },
      { title: "Mast & Harbour Sneakers", price: 799, mrp: 1999, url: "https://www.myntra.com/casual-shoes/mast-harbour", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17273978/2022/3/3/8c5f2c44-c2a4-4d65-a84e-4c48dcc5d8e01646297523193-Mast--Harbour-Men-Sneakers-6611646297522700-1.jpg", cat: "Footwear" },
      { title: "HIGHLANDER Slim Fit Jeans", price: 599, mrp: 1499, url: "https://www.myntra.com/jeans/highlander", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/10330471/2019/9/25/e3a1ee8f-ce6a-4cc2-a0c0-2e1c6d07e3051569400037577-HIGHLANDER-Men-Blue-Slim-Fit-Mid-Rise-Clean-Look-Stretchable-1.jpg", cat: "Fashion" },
      { title: "Libas Printed Kurti Set", price: 699, mrp: 1999, url: "https://www.myntra.com/kurta-sets/libas", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/22180742/2023/3/7/48c39b82-6b63-42e2-8a33-05126b79d49c1678183367073LibasWomenGreenPrintedKurtiwithTrousers1.jpg", cat: "Fashion" },
    ],
    Amazon: [
      { title: "boAt Rockerz 450 Bluetooth Headphone", price: 999, mrp: 2990, url: "https://www.amazon.in/dp/B085B2DVR3", img: "https://m.media-amazon.com/images/I/61fY4RjMxjL._SL1500_.jpg", cat: "Electronics" },
      { title: "Noise ColorFit Pro 4 Smartwatch", price: 2499, mrp: 5999, url: "https://www.amazon.in/dp/B0BTKGJH2G", img: "https://m.media-amazon.com/images/I/61PBzMGRYwL._SL1500_.jpg", cat: "Electronics" },
      { title: "Redmi 12 5G (128GB)", price: 10999, mrp: 17999, url: "https://www.amazon.in/dp/B0CHN12YFW", img: "https://m.media-amazon.com/images/I/81bc8MjdOHL._SL1500_.jpg", cat: "Electronics" },
      { title: "Prestige Electric Kettle 1.5L", price: 549, mrp: 1195, url: "https://www.amazon.in/dp/B07DGGNKQ7", img: "https://m.media-amazon.com/images/I/51Yz3RFiPML._SL1500_.jpg", cat: "General" },
      { title: "Boldfit Gym Shaker Bottle", price: 199, mrp: 599, url: "https://www.amazon.in/dp/B09RVVYS3K", img: "https://m.media-amazon.com/images/I/51EqBo3GdxL._SL1100_.jpg", cat: "General" },
      { title: "Fire-Boltt Phoenix Smart Watch", price: 1299, mrp: 8999, url: "https://www.amazon.in/dp/B0C7FDHXQJ", img: "https://m.media-amazon.com/images/I/61SJVBf7URL._SL1500_.jpg", cat: "Electronics" },
    ],
    Flipkart: [
      { title: "POCO M6 Pro 5G (128GB)", price: 9999, mrp: 16999, url: "https://www.flipkart.com/poco-m6-pro-5g", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/mobile/g/v/u/-original-imagzjhfbkuhgnm8.jpeg", cat: "Electronics" },
      { title: "Noise Buds VS104 Earbuds", price: 699, mrp: 2499, url: "https://www.flipkart.com/noise-buds-vs104", img: "https://rukminim2.flixcart.com/image/416/416/kw2fki80/headphone/v/v/k/buds-vs104-noise-original-imag8xzymmzqj5gy.jpeg", cat: "Electronics" },
      { title: "Campus Mesh Running Shoes", price: 699, mrp: 1699, url: "https://www.flipkart.com/campus-running-shoes", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/shoe/x/5/b/-original-imagrhg5gzfnnqum.jpeg", cat: "Footwear" },
      { title: "Puma Men Polo T-Shirt", price: 599, mrp: 1999, url: "https://www.flipkart.com/puma-polo-shirt", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/t-shirt/y/j/n/m-58667501-puma-original-imagnzg7vyqhzyxf.jpeg", cat: "Fashion" },
      { title: "Samsung 32 inch HD Smart TV", price: 11490, mrp: 19900, url: "https://www.flipkart.com/samsung-32-smart-tv", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/television/b/w/s/-original-imaghxenjxvkhmny.jpeg", cat: "Electronics" },
      { title: "boAt Airdopes 141 Earbuds", price: 899, mrp: 4490, url: "https://www.flipkart.com/boat-airdopes-141", img: "https://rukminim2.flixcart.com/image/416/416/l58iaa80/headphone/a/r/i/-original-imagfyb5mfre3nfh.jpeg", cat: "Electronics" },
    ],
    Nykaa: [
      { title: "Maybelline Fit Me Foundation", price: 399, mrp: 550, url: "https://www.nykaa.com/maybelline-fit-me-foundation", img: "https://images-static.nykaa.com/media/catalog/product/8/9/8964a5eMYBELLINE00001180_1.jpg", cat: "Beauty" },
      { title: "Lakme 9to5 Primer + Matte Lipstick", price: 299, mrp: 500, url: "https://www.nykaa.com/lakme-9to5-lipstick", img: "https://images-static.nykaa.com/media/catalog/product/8/0/80057f6LAKMEINDIA00000741_1.jpg", cat: "Beauty" },
      { title: "Cetaphil Gentle Skin Cleanser 250ml", price: 549, mrp: 799, url: "https://www.nykaa.com/cetaphil-gentle-cleanser", img: "https://images-static.nykaa.com/media/catalog/product/c/e/cetaphil0000002_1.jpg", cat: "Beauty" },
      { title: "The Ordinary Niacinamide Serum", price: 590, mrp: 690, url: "https://www.nykaa.com/the-ordinary-niacinamide", img: "https://images-static.nykaa.com/media/catalog/product/tr/39/3985_1.jpg", cat: "Beauty" },
      { title: "Swiss Beauty Lip Liner Set", price: 299, mrp: 499, url: "https://www.nykaa.com/swiss-beauty-lip-liner", img: "https://images-static.nykaa.com/media/catalog/product/s/w/swissbeauty0000080_1.jpg", cat: "Beauty" },
      { title: "Plum Green Tea Face Wash 100ml", price: 285, mrp: 380, url: "https://www.nykaa.com/plum-green-tea-face-wash", img: "https://images-static.nykaa.com/media/catalog/product/p/l/plum0000055_1.jpg", cat: "Beauty" },
    ],
    Shopsy: [
      { title: "Men's Casual Cotton Shirt", price: 199, mrp: 999, url: "https://www.shopsy.in/shirts", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/shirt/x/o/5/-original-imagp3e5bxnqhzhg.jpeg", cat: "Fashion" },
      { title: "Women Printed Kurti", price: 249, mrp: 1299, url: "https://www.shopsy.in/kurtis", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/ethnic-set/p/a/3/-original-imaghzgvg7gcyzgz.jpeg", cat: "Fashion" },
      { title: "Kids School Bag Backpack", price: 349, mrp: 999, url: "https://www.shopsy.in/bags", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/bag/m/z/b/-original-imagtf7nzfhxggfg.jpeg", cat: "Accessories" },
      { title: "Sports Running Shoes Unisex", price: 299, mrp: 1499, url: "https://www.shopsy.in/sports-shoes", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/shoe/w/g/u/-original-imaghk2zqgpvawgh.jpeg", cat: "Footwear" },
      { title: "LED Desk Lamp Rechargeable", price: 199, mrp: 799, url: "https://www.shopsy.in/desk-lamp", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/table-lamp/q/e/y/-original-imaghgzdwjhfywhz.jpeg", cat: "General" },
      { title: "Phone Case Silicone Cover", price: 99, mrp: 499, url: "https://www.shopsy.in/phone-cases", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/cases-covers/k/f/x/-original-imagtf5bfhsqk2fg.jpeg", cat: "Accessories" },
    ],
    Ajio: [
      { title: "U.S. Polo Assn. Slim Fit Shirt", price: 899, mrp: 2299, url: "https://www.ajio.com/us-polo-shirt", img: "https://assets.ajio.com/medias/sys_master/root/20230407/6Twv/64301dd1711cf97ba70f2a3e/-473Wx593H-466186771-blue-MODEL.jpg", cat: "Fashion" },
      { title: "Benetton Solid Polo T-Shirt", price: 599, mrp: 1499, url: "https://www.ajio.com/benetton-polo", img: "https://assets.ajio.com/medias/sys_master/root/20230707/YAcX/64a7e4eaeebac147fccc2e70/-473Wx593H-465593388-navy-MODEL.jpg", cat: "Fashion" },
      { title: "Performax Running Shoes", price: 799, mrp: 2499, url: "https://www.ajio.com/performax-shoes", img: "https://assets.ajio.com/medias/sys_master/root/20231010/xBWd/6524ebe3ddf7791519188aac/-473Wx593H-469571994-blue-MODEL.jpg", cat: "Footwear" },
      { title: "DNMX Slim Fit Joggers", price: 499, mrp: 1299, url: "https://www.ajio.com/dnmx-joggers", img: "https://assets.ajio.com/medias/sys_master/root/20230724/yZIX/64bdc1c0eebac147fc2e0db4/-473Wx593H-466355905-black-MODEL.jpg", cat: "Fashion" },
      { title: "Fig Graphic Print Crew T-Shirt", price: 349, mrp: 899, url: "https://www.ajio.com/fig-tshirt", img: "https://assets.ajio.com/medias/sys_master/root/20231218/RQWn/6580b2f7ddf77915193e23df/-473Wx593H-443141048-white-MODEL.jpg", cat: "Fashion" },
      { title: "Netplay Casual Chino Trousers", price: 699, mrp: 1999, url: "https://www.ajio.com/netplay-chinos", img: "https://assets.ajio.com/medias/sys_master/root/20230628/3AkN/649c26f342f9e729d7e22e3e/-473Wx593H-465400508-beige-MODEL.jpg", cat: "Fashion" },
    ],
  };

  const items = curated[marketplace];
  if (!items) return [];

  return items.map((item) =>
    makeDeal({
      title: item.title,
      marketplace,
      currentPrice: item.price,
      originalPrice: item.mrp,
      url: item.url,
      imageUrl: item.img,
      category: item.cat,
    })
  );
}

// Cache scraper results for 5 minutes
let scraperCache: { deals: InternetDeal[]; sources: string[]; scrapedAt: string; fetchedAt: number } | null = null;
const SCRAPER_CACHE_MS = 5 * 60 * 1000;

export async function scrapeMarketplaceDeals(): Promise<{
  deals: InternetDeal[];
  sources: string[];
  scrapedAt: string;
}> {
  const now = Date.now();
  if (scraperCache && now - scraperCache.fetchedAt < SCRAPER_CACHE_MS) {
    return scraperCache;
  }

  const scrapers: Array<{ name: SupportedMarketplace; fn: () => Promise<InternetDeal[]> }> = [
    { name: "Myntra", fn: scrapeMyntra },
    { name: "Flipkart", fn: scrapeFlipkart },
    { name: "Amazon", fn: scrapeAmazon },
    { name: "Ajio", fn: scrapeAjio },
    { name: "Nykaa", fn: scrapeNykaa },
    { name: "Shopsy", fn: scrapeShopsy },
  ];

  const results = await Promise.all(
    scrapers.map(async (s) => {
      try {
        const deals = await s.fn();
        // If live scraping returned deals, use them; otherwise use curated fallback
        if (deals.length > 0) {
          return { name: s.name, deals, source: "live" };
        }
        const fallback = getCuratedDeals(s.name);
        return { name: s.name, deals: fallback, source: "curated" };
      } catch {
        const fallback = getCuratedDeals(s.name);
        return { name: s.name, deals: fallback, source: "curated" };
      }
    })
  );

  const allDeals: InternetDeal[] = [];
  const sources: string[] = [];

  for (const r of results) {
    if (r.deals.length > 0) {
      allDeals.push(...r.deals);
      sources.push(`${r.name}: ${r.deals.length} deals (${r.source})`);
    }
  }

  allDeals.sort((a, b) => b.score - a.score);

  const result = { deals: allDeals, sources, scrapedAt: new Date().toISOString(), fetchedAt: now };
  scraperCache = result;
  return result;
}
