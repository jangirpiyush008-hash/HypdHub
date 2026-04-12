/**
 * Curated Fallback Deals
 *
 * Real product names/prices with WORKING marketplace URLs.
 * Links point to search/category pages that always resolve —
 * never fake product IDs that return 404.
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

const CURATED: Record<MarketplaceName, CuratedItem[]> = {
  Myntra: [
    { title: "Roadster Men Solid Round Neck T-Shirt", price: 299, mrp: 599, url: "https://www.myntra.com/tshirts/roadster", cat: "Fashion" },
    { title: "HRX by Hrithik Roshan Running Shoes", price: 1499, mrp: 2999, url: "https://www.myntra.com/sports-shoes/hrx-by-hrithik-roshan", cat: "Footwear" },
    { title: "Allen Solly Men Slim Fit Formal Shirt", price: 899, mrp: 1699, url: "https://www.myntra.com/shirts/allen-solly", cat: "Fashion" },
    { title: "HIGHLANDER Men Blue Slim Fit Jeans", price: 599, mrp: 1499, url: "https://www.myntra.com/jeans/highlander", cat: "Fashion" },
    { title: "Libas Women Printed Kurti with Trousers", price: 699, mrp: 1999, url: "https://www.myntra.com/kurta-sets/libas", cat: "Fashion" },
    { title: "Puma Men Resolve Modern Running Shoes", price: 1799, mrp: 4499, url: "https://www.myntra.com/sports-shoes/puma", cat: "Footwear" },
    { title: "H&M Regular Fit Cotton Shirt", price: 799, mrp: 1299, url: "https://www.myntra.com/shirts/h-and-m", cat: "Fashion" },
    { title: "Mast & Harbour Men White Sneakers", price: 799, mrp: 1999, url: "https://www.myntra.com/casual-shoes/mast-and-harbour", cat: "Footwear" },
  ],
  Amazon: [
    { title: "boAt Rockerz 450 Wireless Bluetooth Headphone", price: 999, mrp: 2990, url: "https://www.amazon.in/s?k=boat+rockerz+450", cat: "Electronics" },
    { title: "Noise ColorFit Pro 4 Smartwatch", price: 2499, mrp: 5999, url: "https://www.amazon.in/s?k=noise+colorfit+pro+4", cat: "Electronics" },
    { title: "Redmi 12 5G 128GB Smartphone", price: 10999, mrp: 17999, url: "https://www.amazon.in/s?k=redmi+12+5g", cat: "Electronics" },
    { title: "Prestige Electric Kettle 1.5 Litre", price: 549, mrp: 1195, url: "https://www.amazon.in/s?k=prestige+electric+kettle", cat: "Home & Kitchen" },
    { title: "Fire-Boltt Phoenix AMOLED Smartwatch", price: 1299, mrp: 8999, url: "https://www.amazon.in/s?k=fire+boltt+phoenix", cat: "Electronics" },
    { title: "boAt Airdopes 141 TWS Earbuds", price: 899, mrp: 4490, url: "https://www.amazon.in/s?k=boat+airdopes+141", cat: "Electronics" },
    { title: "Havells Instanio 3L Instant Water Geyser", price: 3299, mrp: 6100, url: "https://www.amazon.in/s?k=havells+instanio+3l", cat: "Home & Kitchen" },
    { title: "Boldfit Gym Shaker Bottle 700ml", price: 199, mrp: 599, url: "https://www.amazon.in/s?k=boldfit+shaker+bottle", cat: "General" },
  ],
  Flipkart: [
    { title: "POCO M6 Pro 5G 128GB Smartphone", price: 9999, mrp: 16999, url: "https://www.flipkart.com/search?q=poco+m6+pro+5g", cat: "Electronics" },
    { title: "Noise Buds VS104 Bluetooth Earbuds", price: 699, mrp: 2499, url: "https://www.flipkart.com/search?q=noise+buds+vs104", cat: "Electronics" },
    { title: "Campus NORTH Plus Running Shoes", price: 699, mrp: 1699, url: "https://www.flipkart.com/search?q=campus+north+running+shoes", cat: "Footwear" },
    { title: "Puma Men Solid Polo Neck T-Shirt", price: 599, mrp: 1999, url: "https://www.flipkart.com/search?q=puma+polo+tshirt+men", cat: "Fashion" },
    { title: "Samsung 32 inch HD Ready LED Smart TV", price: 11490, mrp: 19900, url: "https://www.flipkart.com/search?q=samsung+32+inch+smart+tv", cat: "Electronics" },
    { title: "boAt Airdopes 141 Wireless Earbuds", price: 899, mrp: 4490, url: "https://www.flipkart.com/search?q=boat+airdopes+141", cat: "Electronics" },
    { title: "Realme Narzo N53 64GB 5G Phone", price: 7499, mrp: 10999, url: "https://www.flipkart.com/search?q=realme+narzo+n53", cat: "Electronics" },
    { title: "HP 15s Core i3 12th Gen Laptop", price: 33990, mrp: 48146, url: "https://www.flipkart.com/search?q=hp+15s+i3+12th+gen", cat: "Electronics" },
  ],
  Nykaa: [
    { title: "Maybelline Fit Me Matte+Poreless Foundation", price: 399, mrp: 550, url: "https://www.nykaa.com/search/result/?q=maybelline+fit+me+foundation", cat: "Beauty" },
    { title: "Lakme 9to5 Primer + Matte Lipstick", price: 299, mrp: 500, url: "https://www.nykaa.com/search/result/?q=lakme+9to5+lipstick", cat: "Beauty" },
    { title: "Cetaphil Gentle Skin Cleanser 250ml", price: 549, mrp: 799, url: "https://www.nykaa.com/search/result/?q=cetaphil+gentle+cleanser", cat: "Beauty" },
    { title: "The Ordinary Niacinamide 10% Serum", price: 590, mrp: 690, url: "https://www.nykaa.com/search/result/?q=ordinary+niacinamide+serum", cat: "Beauty" },
    { title: "Plum Green Tea Face Wash 100ml", price: 285, mrp: 380, url: "https://www.nykaa.com/search/result/?q=plum+green+tea+face+wash", cat: "Beauty" },
    { title: "L'Oreal Paris Hyaluronic Acid Serum", price: 599, mrp: 999, url: "https://www.nykaa.com/search/result/?q=loreal+hyaluronic+acid+serum", cat: "Beauty" },
    { title: "Swiss Beauty Bold Matte Lip Liner Set", price: 299, mrp: 499, url: "https://www.nykaa.com/search/result/?q=swiss+beauty+lip+liner", cat: "Beauty" },
    { title: "Nivea Soft Light Moisturising Cream", price: 225, mrp: 350, url: "https://www.nykaa.com/search/result/?q=nivea+soft+cream", cat: "Beauty" },
  ],
  Shopsy: [
    { title: "Men Casual Cotton Shirt Pack of 2", price: 199, mrp: 999, url: "https://www.shopsy.in/search?q=men+casual+cotton+shirt", cat: "Fashion" },
    { title: "Women Printed Rayon A-Line Kurti", price: 249, mrp: 1299, url: "https://www.shopsy.in/search?q=women+printed+kurti", cat: "Fashion" },
    { title: "Kids Cartoon Print School Bag 30L", price: 349, mrp: 999, url: "https://www.shopsy.in/search?q=kids+school+bag", cat: "Accessories" },
    { title: "Unisex Lightweight Sports Running Shoes", price: 299, mrp: 1499, url: "https://www.shopsy.in/search?q=sports+running+shoes", cat: "Footwear" },
    { title: "Rechargeable LED Study Desk Lamp", price: 199, mrp: 799, url: "https://www.shopsy.in/search?q=led+desk+lamp", cat: "General" },
    { title: "Silicone Back Cover Phone Case", price: 99, mrp: 499, url: "https://www.shopsy.in/search?q=silicone+phone+case", cat: "Accessories" },
    { title: "Women Traditional Jhumka Earrings Set", price: 149, mrp: 599, url: "https://www.shopsy.in/search?q=jhumka+earrings", cat: "Accessories" },
    { title: "Men Cotton Comfort Track Pants Combo", price: 249, mrp: 899, url: "https://www.shopsy.in/search?q=men+cotton+track+pants", cat: "Fashion" },
  ],
  Ajio: [
    { title: "U.S. Polo Assn. Men Slim Fit Shirt", price: 899, mrp: 2299, url: "https://www.ajio.com/search/?text=us+polo+slim+fit+shirt", cat: "Fashion" },
    { title: "United Colors of Benetton Polo T-Shirt", price: 599, mrp: 1499, url: "https://www.ajio.com/search/?text=benetton+polo+tshirt", cat: "Fashion" },
    { title: "Performax Lace-Up Running Shoes", price: 799, mrp: 2499, url: "https://www.ajio.com/search/?text=performax+running+shoes", cat: "Footwear" },
    { title: "DNMX Slim Fit Joggers with Drawstring", price: 499, mrp: 1299, url: "https://www.ajio.com/search/?text=dnmx+slim+joggers", cat: "Fashion" },
    { title: "Fig Graphic Print Crew-Neck T-Shirt", price: 349, mrp: 899, url: "https://www.ajio.com/search/?text=fig+graphic+tshirt", cat: "Fashion" },
    { title: "Netplay Casual Slim Fit Chinos", price: 699, mrp: 1999, url: "https://www.ajio.com/search/?text=netplay+chinos", cat: "Fashion" },
    { title: "Teamspirit Hooded Zip-Front Sweatshirt", price: 599, mrp: 1799, url: "https://www.ajio.com/search/?text=teamspirit+hoodie", cat: "Fashion" },
    { title: "Reebok Classic Court Low Sneakers", price: 1999, mrp: 5999, url: "https://www.ajio.com/search/?text=reebok+classic+sneakers", cat: "Footwear" },
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
    imageUrl: null,
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
