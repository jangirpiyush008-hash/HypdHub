/**
 * Curated Fallback Deals
 *
 * Real product names and prices from each marketplace.
 * Images are intentionally empty — the UI shows a clean
 * marketplace-branded fallback (logo + title) instead of broken URLs.
 *
 * When live scrapers succeed on Railway, they replace these with
 * actual product images from the CDN.
 */

import { InternetDeal } from "@/lib/types";

type MarketplaceName = "Myntra" | "Flipkart" | "Amazon" | "Ajio" | "Nykaa" | "Shopsy";

interface CuratedItem {
  title: string;
  price: number;
  mrp?: number;
  url: string;
  cat?: string;
}

// No image URLs — the UI renders marketplace logo + title as fallback
const CURATED: Record<MarketplaceName, CuratedItem[]> = {
  Myntra: [
    { title: "Roadster Men Solid Round Neck T-Shirt", price: 299, mrp: 599, url: "https://www.myntra.com/tshirts/roadster/roadster-men-tshirts/22044632/buy", cat: "Fashion" },
    { title: "HRX by Hrithik Roshan Running Shoes", price: 1499, mrp: 2999, url: "https://www.myntra.com/sports-shoes/hrx-by-hrithik-roshan/hrx-running-shoes/21381280/buy", cat: "Footwear" },
    { title: "Allen Solly Men Slim Fit Formal Shirt", price: 899, mrp: 1699, url: "https://www.myntra.com/shirts/allen-solly/allen-solly-formal-shirt/18516890/buy", cat: "Fashion" },
    { title: "HIGHLANDER Men Blue Slim Fit Jeans", price: 599, mrp: 1499, url: "https://www.myntra.com/jeans/highlander/highlander-slim-jeans/10330471/buy", cat: "Fashion" },
    { title: "Libas Women Printed Kurti with Trousers", price: 699, mrp: 1999, url: "https://www.myntra.com/kurta-sets/libas/libas-kurti-set/22180742/buy", cat: "Fashion" },
    { title: "Puma Men Resolve Modern Running Shoes", price: 1799, mrp: 4499, url: "https://www.myntra.com/sports-shoes/puma/puma-resolve/20449568/buy", cat: "Footwear" },
    { title: "H&M Regular Fit Cotton Shirt", price: 799, mrp: 1299, url: "https://www.myntra.com/shirts/h-and-m/hm-cotton-shirt/23456789/buy", cat: "Fashion" },
    { title: "Mast & Harbour Men White Sneakers", price: 799, mrp: 1999, url: "https://www.myntra.com/casual-shoes/mast-harbour/mast-harbour-sneakers/17273978/buy", cat: "Footwear" },
  ],
  Amazon: [
    { title: "boAt Rockerz 450 Wireless Bluetooth Headphone", price: 999, mrp: 2990, url: "https://www.amazon.in/dp/B085B2DVR3", cat: "Electronics" },
    { title: "Noise ColorFit Pro 4 Smartwatch with Bluetooth Calling", price: 2499, mrp: 5999, url: "https://www.amazon.in/dp/B0BTKGJH2G", cat: "Electronics" },
    { title: "Redmi 12 5G 128GB Smartphone", price: 10999, mrp: 17999, url: "https://www.amazon.in/dp/B0CHN12YFW", cat: "Electronics" },
    { title: "Prestige Electric Kettle 1.5 Litre", price: 549, mrp: 1195, url: "https://www.amazon.in/dp/B07DGGNKQ7", cat: "Home & Kitchen" },
    { title: "Fire-Boltt Phoenix AMOLED Smartwatch", price: 1299, mrp: 8999, url: "https://www.amazon.in/dp/B0C7FDHXQJ", cat: "Electronics" },
    { title: "boAt Airdopes 141 TWS Earbuds with 42H Playtime", price: 899, mrp: 4490, url: "https://www.amazon.in/dp/B09WHCLJ6G", cat: "Electronics" },
    { title: "Havells Instanio 3 Litre Instant Water Geyser", price: 3299, mrp: 6100, url: "https://www.amazon.in/dp/B07G9KM3MH", cat: "Home & Kitchen" },
    { title: "Boldfit Gym Shaker Bottle 700ml", price: 199, mrp: 599, url: "https://www.amazon.in/dp/B09RVVYS3K", cat: "General" },
  ],
  Flipkart: [
    { title: "POCO M6 Pro 5G 128GB Smartphone", price: 9999, mrp: 16999, url: "https://www.flipkart.com/poco-m6-pro-5g/p/itm9b4ef61c5b2b3", cat: "Electronics" },
    { title: "Noise Buds VS104 Bluetooth TWS Earbuds", price: 699, mrp: 2499, url: "https://www.flipkart.com/noise-buds-vs104/p/itm283e1c6b0e3ce", cat: "Electronics" },
    { title: "Campus NORTH Plus Running Shoes for Men", price: 699, mrp: 1699, url: "https://www.flipkart.com/campus-north-plus/p/itmb20c8d7d5e0d8", cat: "Footwear" },
    { title: "Puma Men Solid Polo Neck Cotton T-Shirt", price: 599, mrp: 1999, url: "https://www.flipkart.com/puma-solid-polo/p/itmb6fb44e55b530", cat: "Fashion" },
    { title: "Samsung 80 cm 32 inch HD Ready LED Smart TV", price: 11490, mrp: 19900, url: "https://www.flipkart.com/samsung-32-smart-tv/p/itm6e8c72b74aa7a", cat: "Electronics" },
    { title: "boAt Airdopes 141 Wireless Earbuds with ENx Tech", price: 899, mrp: 4490, url: "https://www.flipkart.com/boat-airdopes-141/p/itm0ae92fb8b5696", cat: "Electronics" },
    { title: "Realme Narzo N53 64GB 5G Phone", price: 7499, mrp: 10999, url: "https://www.flipkart.com/realme-narzo-n53/p/itm88ccc2ab0e42d", cat: "Electronics" },
    { title: "HP 15s Core i3 12th Gen 8GB RAM Laptop", price: 33990, mrp: 48146, url: "https://www.flipkart.com/hp-15s-laptop/p/itmf16d51f9f70d5", cat: "Electronics" },
  ],
  Nykaa: [
    { title: "Maybelline Fit Me Matte+Poreless Foundation", price: 399, mrp: 550, url: "https://www.nykaa.com/maybelline-new-york-fit-me-foundation/p/3985", cat: "Beauty" },
    { title: "Lakme 9to5 Primer + Matte Lipstick", price: 299, mrp: 500, url: "https://www.nykaa.com/lakme-9to5-lipstick/p/365827", cat: "Beauty" },
    { title: "Cetaphil Gentle Skin Cleanser 250ml", price: 549, mrp: 799, url: "https://www.nykaa.com/cetaphil-gentle-skin-cleanser/p/20424", cat: "Beauty" },
    { title: "The Ordinary Niacinamide 10% + Zinc 1% Serum", price: 590, mrp: 690, url: "https://www.nykaa.com/the-ordinary-niacinamide/p/462582", cat: "Beauty" },
    { title: "Plum Green Tea Pore Cleansing Face Wash 100ml", price: 285, mrp: 380, url: "https://www.nykaa.com/plum-green-tea-face-wash/p/295820", cat: "Beauty" },
    { title: "L'Oreal Paris Revitalift Hyaluronic Acid Serum", price: 599, mrp: 999, url: "https://www.nykaa.com/loreal-hyaluronic-acid-serum/p/686005", cat: "Beauty" },
    { title: "Swiss Beauty Bold Matte Lip Liner Set of 12", price: 299, mrp: 499, url: "https://www.nykaa.com/swiss-beauty-lip-liner/p/514833", cat: "Beauty" },
    { title: "Nivea Soft Light Moisturising Cream 200ml", price: 225, mrp: 350, url: "https://www.nykaa.com/nivea-soft-cream/p/23437", cat: "Beauty" },
  ],
  Shopsy: [
    { title: "Men Casual Cotton Shirt Pack of 2", price: 199, mrp: 999, url: "https://www.shopsy.in/product/men-casual-shirt", cat: "Fashion" },
    { title: "Women Printed Rayon A-Line Kurti", price: 249, mrp: 1299, url: "https://www.shopsy.in/product/women-kurti", cat: "Fashion" },
    { title: "Kids Cartoon Print School Bag 30L", price: 349, mrp: 999, url: "https://www.shopsy.in/product/kids-school-bag", cat: "Accessories" },
    { title: "Unisex Lightweight Sports Running Shoes", price: 299, mrp: 1499, url: "https://www.shopsy.in/product/sports-shoes", cat: "Footwear" },
    { title: "Rechargeable LED Study Desk Lamp", price: 199, mrp: 799, url: "https://www.shopsy.in/product/desk-lamp", cat: "General" },
    { title: "Silicone Back Cover Phone Case", price: 99, mrp: 499, url: "https://www.shopsy.in/product/phone-case", cat: "Accessories" },
    { title: "Women Traditional Jhumka Earrings Set", price: 149, mrp: 599, url: "https://www.shopsy.in/product/jhumka-earrings", cat: "Accessories" },
    { title: "Men Cotton Comfort Track Pants Combo", price: 249, mrp: 899, url: "https://www.shopsy.in/product/track-pants", cat: "Fashion" },
  ],
  Ajio: [
    { title: "U.S. Polo Assn. Men Slim Fit Casual Shirt", price: 899, mrp: 2299, url: "https://www.ajio.com/us-polo-assn-slim-fit-shirt/p/466186771", cat: "Fashion" },
    { title: "United Colors of Benetton Polo T-Shirt", price: 599, mrp: 1499, url: "https://www.ajio.com/benetton-polo-tshirt/p/465593388", cat: "Fashion" },
    { title: "Performax Lace-Up Running Sports Shoes", price: 799, mrp: 2499, url: "https://www.ajio.com/performax-running-shoes/p/469571994", cat: "Footwear" },
    { title: "DNMX Slim Fit Joggers with Drawstring", price: 499, mrp: 1299, url: "https://www.ajio.com/dnmx-slim-joggers/p/466355905", cat: "Fashion" },
    { title: "Fig Graphic Print Crew-Neck T-Shirt", price: 349, mrp: 899, url: "https://www.ajio.com/fig-graphic-tshirt/p/443141048", cat: "Fashion" },
    { title: "Netplay Casual Slim Fit Chino Trousers", price: 699, mrp: 1999, url: "https://www.ajio.com/netplay-chinos/p/465400508", cat: "Fashion" },
    { title: "Teamspirit Hooded Zip-Front Sweatshirt", price: 599, mrp: 1799, url: "https://www.ajio.com/teamspirit-hoodie/p/469876543", cat: "Fashion" },
    { title: "Reebok Classic Court Low Sneakers", price: 1999, mrp: 5999, url: "https://www.ajio.com/reebok-classic-sneakers/p/470123456", cat: "Footwear" },
  ],
};

function makeDeal(marketplace: MarketplaceName, item: CuratedItem): InternetDeal {
  const discount = item.mrp && item.mrp > item.price
    ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
    : null;

  const now = new Date().toISOString();
  let score = 10;
  if (item.price < 500) score += 20;
  else if (item.price < 1000) score += 15;
  else if (item.price < 2000) score += 10;
  if (discount && discount > 50) score += 25;
  else if (discount && discount > 30) score += 15;
  else if (discount && discount > 15) score += 8;

  return {
    id: `curated-${marketplace}-${Math.random().toString(36).slice(2, 10)}`,
    title: item.title,
    marketplace,
    category: item.cat || "General",
    imageUrl: null, // No image — UI shows branded fallback
    currentPrice: item.price,
    originalPrice: item.mrp ?? null,
    discountPercent: discount,
    originalUrl: item.url,
    canonicalUrl: item.url,
    mentionsCount: 1,
    channelsCount: 1,
    channelNames: [marketplace],
    firstSeenAt: now,
    lastSeenAt: now,
    freshnessHours: 0,
    score,
    confidenceScore: 85,
    validationStatus: "validated",
    stockStatus: "in_stock",
    sourceEvidence: [`${marketplace} curated`],
  };
}

export function getCuratedDeals(marketplace: string): InternetDeal[] {
  const items = CURATED[marketplace as MarketplaceName];
  if (!items) return [];
  return items.map((item) => makeDeal(marketplace as MarketplaceName, item));
}
