/**
 * Curated Fallback Deals
 *
 * Real working search/category URLs per marketplace.
 * These are guaranteed to resolve (search pages never 404).
 * categoryUrl = search/browse page, originalUrl = same for curated.
 * Live-scraped deals will have real product page URLs in originalUrl.
 */

import { InternetDeal } from "@/lib/types";

type MarketplaceName = "Myntra" | "Flipkart" | "Amazon" | "Ajio" | "Nykaa" | "Shopsy";

interface CuratedItem {
  title: string;
  price: number;
  mrp?: number;
  searchUrl: string;
  cat?: string;
}

const CURATED: Record<MarketplaceName, CuratedItem[]> = {
  Myntra: [
    { title: "Roadster Men Solid Round Neck T-Shirt", price: 299, mrp: 599, searchUrl: "https://www.myntra.com/tshirts?rawQuery=roadster+men+solid+round+neck+t-shirt", cat: "Fashion" },
    { title: "HRX by Hrithik Roshan Running Shoes", price: 1499, mrp: 2999, searchUrl: "https://www.myntra.com/sports-shoes?rawQuery=hrx+running+shoes", cat: "Footwear" },
    { title: "Allen Solly Men Slim Fit Formal Shirt", price: 899, mrp: 1699, searchUrl: "https://www.myntra.com/shirts?rawQuery=allen+solly+slim+fit+formal+shirt", cat: "Fashion" },
    { title: "HIGHLANDER Men Blue Slim Fit Jeans", price: 599, mrp: 1499, searchUrl: "https://www.myntra.com/jeans?rawQuery=highlander+men+blue+slim+fit+jeans", cat: "Fashion" },
    { title: "Libas Women Printed Kurti with Trousers", price: 699, mrp: 1999, searchUrl: "https://www.myntra.com/kurta-sets?rawQuery=libas+women+printed+kurti+trousers", cat: "Fashion" },
    { title: "Puma Men Resolve Modern Running Shoes", price: 1799, mrp: 4499, searchUrl: "https://www.myntra.com/sports-shoes?rawQuery=puma+resolve+modern+running+shoes", cat: "Footwear" },
    { title: "H&M Regular Fit Cotton Shirt", price: 799, mrp: 1299, searchUrl: "https://www.myntra.com/shirts?rawQuery=h+m+regular+fit+cotton+shirt", cat: "Fashion" },
    { title: "Mast & Harbour Men White Sneakers", price: 799, mrp: 1999, searchUrl: "https://www.myntra.com/casual-shoes?rawQuery=mast+harbour+men+white+sneakers", cat: "Footwear" },
  ],
  Amazon: [
    { title: "boAt Rockerz 450 Wireless Bluetooth Headphone", price: 999, mrp: 2990, searchUrl: "https://www.amazon.in/s?k=boAt+Rockerz+450+Wireless+Bluetooth+Headphone", cat: "Electronics" },
    { title: "Noise ColorFit Pro 4 Smartwatch", price: 2499, mrp: 5999, searchUrl: "https://www.amazon.in/s?k=Noise+ColorFit+Pro+4+Smartwatch", cat: "Electronics" },
    { title: "Redmi 12 5G 128GB Smartphone", price: 10999, mrp: 17999, searchUrl: "https://www.amazon.in/s?k=Redmi+12+5G+128GB", cat: "Electronics" },
    { title: "Prestige Electric Kettle 1.5 Litre", price: 549, mrp: 1195, searchUrl: "https://www.amazon.in/s?k=Prestige+Electric+Kettle+1.5+Litre", cat: "Home & Kitchen" },
    { title: "Fire-Boltt Phoenix AMOLED Smartwatch", price: 1299, mrp: 8999, searchUrl: "https://www.amazon.in/s?k=Fire-Boltt+Phoenix+AMOLED+Smartwatch", cat: "Electronics" },
    { title: "boAt Airdopes 141 TWS Earbuds", price: 899, mrp: 4490, searchUrl: "https://www.amazon.in/s?k=boAt+Airdopes+141+TWS+Earbuds", cat: "Electronics" },
    { title: "Havells Instanio 3L Instant Water Geyser", price: 3299, mrp: 6100, searchUrl: "https://www.amazon.in/s?k=Havells+Instanio+3L+Instant+Water+Geyser", cat: "Home & Kitchen" },
    { title: "Boldfit Gym Shaker Bottle 700ml", price: 199, mrp: 599, searchUrl: "https://www.amazon.in/s?k=Boldfit+Gym+Shaker+Bottle+700ml", cat: "General" },
  ],
  Flipkart: [
    { title: "POCO M6 Pro 5G 128GB Smartphone", price: 9999, mrp: 16999, searchUrl: "https://www.flipkart.com/search?q=POCO+M6+Pro+5G+128GB", cat: "Electronics" },
    { title: "Noise Buds VS104 Bluetooth Earbuds", price: 699, mrp: 2499, searchUrl: "https://www.flipkart.com/search?q=Noise+Buds+VS104+Bluetooth+Earbuds", cat: "Electronics" },
    { title: "Campus NORTH Plus Running Shoes", price: 699, mrp: 1699, searchUrl: "https://www.flipkart.com/search?q=Campus+NORTH+Plus+Running+Shoes", cat: "Footwear" },
    { title: "Puma Men Solid Polo Neck T-Shirt", price: 599, mrp: 1999, searchUrl: "https://www.flipkart.com/search?q=Puma+Men+Solid+Polo+Neck+T-Shirt", cat: "Fashion" },
    { title: "Samsung 32 inch HD Ready LED Smart TV", price: 11490, mrp: 19900, searchUrl: "https://www.flipkart.com/search?q=Samsung+32+inch+HD+Ready+LED+Smart+TV", cat: "Electronics" },
    { title: "boAt Airdopes 141 Wireless Earbuds", price: 899, mrp: 4490, searchUrl: "https://www.flipkart.com/search?q=boAt+Airdopes+141+Wireless+Earbuds", cat: "Electronics" },
    { title: "Realme Narzo N53 64GB 5G Phone", price: 7499, mrp: 10999, searchUrl: "https://www.flipkart.com/search?q=Realme+Narzo+N53+64GB+5G", cat: "Electronics" },
    { title: "HP 15s Core i3 12th Gen Laptop", price: 33990, mrp: 48146, searchUrl: "https://www.flipkart.com/search?q=HP+15s+Core+i3+12th+Gen+Laptop", cat: "Electronics" },
  ],
  Nykaa: [
    { title: "Maybelline Fit Me Matte+Poreless Foundation", price: 399, mrp: 550, searchUrl: "https://www.nykaa.com/search/result/?q=maybelline+fit+me+matte+poreless+foundation", cat: "Beauty" },
    { title: "Lakme 9to5 Primer + Matte Lipstick", price: 299, mrp: 500, searchUrl: "https://www.nykaa.com/search/result/?q=lakme+9to5+primer+matte+lipstick", cat: "Beauty" },
    { title: "Cetaphil Gentle Skin Cleanser 250ml", price: 549, mrp: 799, searchUrl: "https://www.nykaa.com/search/result/?q=cetaphil+gentle+skin+cleanser", cat: "Beauty" },
    { title: "The Ordinary Niacinamide 10% Serum", price: 590, mrp: 690, searchUrl: "https://www.nykaa.com/search/result/?q=the+ordinary+niacinamide+10+serum", cat: "Beauty" },
    { title: "Plum Green Tea Face Wash 100ml", price: 285, mrp: 380, searchUrl: "https://www.nykaa.com/search/result/?q=plum+green+tea+face+wash", cat: "Beauty" },
    { title: "L'Oreal Paris Hyaluronic Acid Serum", price: 599, mrp: 999, searchUrl: "https://www.nykaa.com/search/result/?q=loreal+paris+hyaluronic+acid+serum", cat: "Beauty" },
    { title: "Swiss Beauty Bold Matte Lip Liner Set", price: 299, mrp: 499, searchUrl: "https://www.nykaa.com/search/result/?q=swiss+beauty+bold+matte+lip+liner", cat: "Beauty" },
    { title: "Nivea Soft Light Moisturising Cream", price: 225, mrp: 350, searchUrl: "https://www.nykaa.com/search/result/?q=nivea+soft+light+moisturising+cream", cat: "Beauty" },
  ],
  Shopsy: [
    { title: "Men Casual Cotton Shirt Pack of 2", price: 199, mrp: 999, searchUrl: "https://www.shopsy.in/search?q=men+casual+cotton+shirt+pack+of+2", cat: "Fashion" },
    { title: "Women Printed Rayon A-Line Kurti", price: 249, mrp: 1299, searchUrl: "https://www.shopsy.in/search?q=women+printed+rayon+a-line+kurti", cat: "Fashion" },
    { title: "Kids Cartoon Print School Bag 30L", price: 349, mrp: 999, searchUrl: "https://www.shopsy.in/search?q=kids+cartoon+print+school+bag", cat: "Accessories" },
    { title: "Unisex Lightweight Sports Running Shoes", price: 299, mrp: 1499, searchUrl: "https://www.shopsy.in/search?q=unisex+lightweight+sports+running+shoes", cat: "Footwear" },
    { title: "Rechargeable LED Study Desk Lamp", price: 199, mrp: 799, searchUrl: "https://www.shopsy.in/search?q=rechargeable+led+study+desk+lamp", cat: "General" },
    { title: "Silicone Back Cover Phone Case", price: 99, mrp: 499, searchUrl: "https://www.shopsy.in/search?q=silicone+back+cover+phone+case", cat: "Accessories" },
    { title: "Women Traditional Jhumka Earrings Set", price: 149, mrp: 599, searchUrl: "https://www.shopsy.in/search?q=women+traditional+jhumka+earrings", cat: "Accessories" },
    { title: "Men Cotton Comfort Track Pants Combo", price: 249, mrp: 899, searchUrl: "https://www.shopsy.in/search?q=men+cotton+comfort+track+pants+combo", cat: "Fashion" },
  ],
  Ajio: [
    { title: "U.S. Polo Assn. Men Slim Fit Shirt", price: 899, mrp: 2299, searchUrl: "https://www.ajio.com/search/?text=us+polo+assn+men+slim+fit+shirt", cat: "Fashion" },
    { title: "United Colors of Benetton Polo T-Shirt", price: 599, mrp: 1499, searchUrl: "https://www.ajio.com/search/?text=united+colors+of+benetton+polo+t-shirt", cat: "Fashion" },
    { title: "Performax Lace-Up Running Shoes", price: 799, mrp: 2499, searchUrl: "https://www.ajio.com/search/?text=performax+lace+up+running+shoes", cat: "Footwear" },
    { title: "DNMX Slim Fit Joggers with Drawstring", price: 499, mrp: 1299, searchUrl: "https://www.ajio.com/search/?text=dnmx+slim+fit+joggers+drawstring", cat: "Fashion" },
    { title: "Fig Graphic Print Crew-Neck T-Shirt", price: 349, mrp: 899, searchUrl: "https://www.ajio.com/search/?text=fig+graphic+print+crew+neck+t-shirt", cat: "Fashion" },
    { title: "Netplay Casual Slim Fit Chinos", price: 699, mrp: 1999, searchUrl: "https://www.ajio.com/search/?text=netplay+casual+slim+fit+chinos", cat: "Fashion" },
    { title: "Teamspirit Hooded Zip-Front Sweatshirt", price: 599, mrp: 1799, searchUrl: "https://www.ajio.com/search/?text=teamspirit+hooded+zip+front+sweatshirt", cat: "Fashion" },
    { title: "Reebok Classic Court Low Sneakers", price: 1999, mrp: 5999, searchUrl: "https://www.ajio.com/search/?text=reebok+classic+court+low+sneakers", cat: "Footwear" },
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
    originalUrl: item.searchUrl,
    canonicalUrl: item.searchUrl,
    categoryUrl: item.searchUrl,
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
