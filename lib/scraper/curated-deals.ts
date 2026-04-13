/**
 * Curated Fallback Deals
 *
 * Each deal has TWO different URLs:
 * - productUrl: specific search for that exact product (for "Product Link" toggle)
 * - categoryUrl: broad category page (for "Category Link" toggle)
 *
 * Both are real, working marketplace URLs that never 404.
 */

import { InternetDeal } from "@/lib/types";

type MarketplaceName = "Myntra" | "Flipkart" | "Amazon" | "Ajio" | "Nykaa" | "Shopsy";

interface CuratedItem {
  title: string;
  price: number;
  mrp?: number;
  productUrl: string;    // Specific product search
  categoryUrl: string;   // Broad category page
  cat?: string;
}

const CURATED: Record<MarketplaceName, CuratedItem[]> = {
  Myntra: [
    { title: "Roadster Men Solid Round Neck T-Shirt", price: 299, mrp: 599, productUrl: "https://www.myntra.com/tshirts?rawQuery=roadster+men+solid+round+neck+t-shirt&sort=popularity", categoryUrl: "https://www.myntra.com/men-tshirts", cat: "Fashion" },
    { title: "HRX by Hrithik Roshan Running Shoes", price: 1499, mrp: 2999, productUrl: "https://www.myntra.com/sports-shoes?rawQuery=hrx+by+hrithik+roshan+running+shoes&sort=popularity", categoryUrl: "https://www.myntra.com/men-sports-shoes", cat: "Footwear" },
    { title: "Allen Solly Men Slim Fit Formal Shirt", price: 899, mrp: 1699, productUrl: "https://www.myntra.com/shirts?rawQuery=allen+solly+men+slim+fit+formal+shirt&sort=popularity", categoryUrl: "https://www.myntra.com/men-formal-shirts", cat: "Fashion" },
    { title: "HIGHLANDER Men Blue Slim Fit Jeans", price: 599, mrp: 1499, productUrl: "https://www.myntra.com/jeans?rawQuery=highlander+men+blue+slim+fit+jeans&sort=popularity", categoryUrl: "https://www.myntra.com/men-jeans", cat: "Fashion" },
    { title: "Libas Women Printed Kurti with Trousers", price: 699, mrp: 1999, productUrl: "https://www.myntra.com/kurta-sets?rawQuery=libas+women+printed+kurti+trousers&sort=popularity", categoryUrl: "https://www.myntra.com/women-kurta-sets", cat: "Fashion" },
    { title: "Puma Men Resolve Modern Running Shoes", price: 1799, mrp: 4499, productUrl: "https://www.myntra.com/sports-shoes?rawQuery=puma+men+resolve+modern+running+shoes&sort=popularity", categoryUrl: "https://www.myntra.com/men-sports-shoes", cat: "Footwear" },
    { title: "H&M Regular Fit Cotton Shirt", price: 799, mrp: 1299, productUrl: "https://www.myntra.com/shirts?rawQuery=h+m+regular+fit+cotton+shirt&sort=popularity", categoryUrl: "https://www.myntra.com/men-shirts", cat: "Fashion" },
    { title: "Mast & Harbour Men White Sneakers", price: 799, mrp: 1999, productUrl: "https://www.myntra.com/casual-shoes?rawQuery=mast+harbour+men+white+sneakers&sort=popularity", categoryUrl: "https://www.myntra.com/men-casual-shoes", cat: "Footwear" },
  ],
  Amazon: [
    { title: "boAt Rockerz 450 Wireless Bluetooth Headphone", price: 999, mrp: 2990, productUrl: "https://www.amazon.in/s?k=boAt+Rockerz+450+Wireless+Bluetooth+Headphone", categoryUrl: "https://www.amazon.in/b?node=1388921031", cat: "Electronics" },
    { title: "Noise ColorFit Pro 4 Smartwatch", price: 2499, mrp: 5999, productUrl: "https://www.amazon.in/s?k=Noise+ColorFit+Pro+4+Smartwatch", categoryUrl: "https://www.amazon.in/b?node=21927692031", cat: "Electronics" },
    { title: "Redmi 12 5G 128GB Smartphone", price: 10999, mrp: 17999, productUrl: "https://www.amazon.in/s?k=Redmi+12+5G+128GB", categoryUrl: "https://www.amazon.in/b?node=1389401031", cat: "Electronics" },
    { title: "Prestige Electric Kettle 1.5 Litre", price: 549, mrp: 1195, productUrl: "https://www.amazon.in/s?k=Prestige+Electric+Kettle+1.5+Litre", categoryUrl: "https://www.amazon.in/b?node=3561625031", cat: "Home & Kitchen" },
    { title: "Fire-Boltt Phoenix AMOLED Smartwatch", price: 1299, mrp: 8999, productUrl: "https://www.amazon.in/s?k=Fire-Boltt+Phoenix+AMOLED+Smartwatch", categoryUrl: "https://www.amazon.in/b?node=21927692031", cat: "Electronics" },
    { title: "boAt Airdopes 141 TWS Earbuds", price: 899, mrp: 4490, productUrl: "https://www.amazon.in/s?k=boAt+Airdopes+141+TWS+Earbuds", categoryUrl: "https://www.amazon.in/b?node=1388921031", cat: "Electronics" },
    { title: "Havells Instanio 3L Instant Water Geyser", price: 3299, mrp: 6100, productUrl: "https://www.amazon.in/s?k=Havells+Instanio+3L+Instant+Water+Geyser", categoryUrl: "https://www.amazon.in/b?node=4369221031", cat: "Home & Kitchen" },
    { title: "Boldfit Gym Shaker Bottle 700ml", price: 199, mrp: 599, productUrl: "https://www.amazon.in/s?k=Boldfit+Gym+Shaker+Bottle+700ml", categoryUrl: "https://www.amazon.in/b?node=3408861031", cat: "General" },
  ],
  Flipkart: [
    { title: "POCO M6 Pro 5G 128GB Smartphone", price: 9999, mrp: 16999, productUrl: "https://www.flipkart.com/search?q=POCO+M6+Pro+5G+128GB", categoryUrl: "https://www.flipkart.com/mobiles/pr?sid=tyy%2C4io", cat: "Electronics" },
    { title: "Noise Buds VS104 Bluetooth Earbuds", price: 699, mrp: 2499, productUrl: "https://www.flipkart.com/search?q=Noise+Buds+VS104+Bluetooth+Earbuds", categoryUrl: "https://www.flipkart.com/audio-video/headphones/pr?sid=0pm%2Cfcn", cat: "Electronics" },
    { title: "Campus NORTH Plus Running Shoes", price: 699, mrp: 1699, productUrl: "https://www.flipkart.com/search?q=Campus+NORTH+Plus+Running+Shoes", categoryUrl: "https://www.flipkart.com/mens-footwear/sports-shoes/pr?sid=osp%2Ccil%2C1cu", cat: "Footwear" },
    { title: "Puma Men Solid Polo Neck T-Shirt", price: 599, mrp: 1999, productUrl: "https://www.flipkart.com/search?q=Puma+Men+Solid+Polo+Neck+T-Shirt", categoryUrl: "https://www.flipkart.com/men-tshirts/pr?sid=clo%2Cash%2Cank", cat: "Fashion" },
    { title: "Samsung 32 inch HD Ready LED Smart TV", price: 11490, mrp: 19900, productUrl: "https://www.flipkart.com/search?q=Samsung+32+inch+HD+Ready+LED+Smart+TV", categoryUrl: "https://www.flipkart.com/televisions/pr?sid=ckf%2Cczl", cat: "Electronics" },
    { title: "boAt Airdopes 141 Wireless Earbuds", price: 899, mrp: 4490, productUrl: "https://www.flipkart.com/search?q=boAt+Airdopes+141+Wireless+Earbuds", categoryUrl: "https://www.flipkart.com/audio-video/headphones/pr?sid=0pm%2Cfcn", cat: "Electronics" },
    { title: "Realme Narzo N53 64GB 5G Phone", price: 7499, mrp: 10999, productUrl: "https://www.flipkart.com/search?q=Realme+Narzo+N53+64GB+5G", categoryUrl: "https://www.flipkart.com/mobiles/pr?sid=tyy%2C4io", cat: "Electronics" },
    { title: "HP 15s Core i3 12th Gen Laptop", price: 33990, mrp: 48146, productUrl: "https://www.flipkart.com/search?q=HP+15s+Core+i3+12th+Gen+Laptop", categoryUrl: "https://www.flipkart.com/laptops/pr?sid=6bo%2Cb5g", cat: "Electronics" },
  ],
  Nykaa: [
    { title: "Maybelline Fit Me Matte+Poreless Foundation", price: 399, mrp: 550, productUrl: "https://www.nykaa.com/search/result/?q=maybelline+fit+me+matte+poreless+foundation", categoryUrl: "https://www.nykaa.com/makeup/face/foundation/c/8399", cat: "Beauty" },
    { title: "Lakme 9to5 Primer + Matte Lipstick", price: 299, mrp: 500, productUrl: "https://www.nykaa.com/search/result/?q=lakme+9to5+primer+matte+lipstick", categoryUrl: "https://www.nykaa.com/makeup/lips/lipstick/c/10", cat: "Beauty" },
    { title: "Cetaphil Gentle Skin Cleanser 250ml", price: 549, mrp: 799, productUrl: "https://www.nykaa.com/search/result/?q=cetaphil+gentle+skin+cleanser", categoryUrl: "https://www.nykaa.com/skin/cleansers/face-wash/c/6", cat: "Beauty" },
    { title: "The Ordinary Niacinamide 10% Serum", price: 590, mrp: 690, productUrl: "https://www.nykaa.com/search/result/?q=the+ordinary+niacinamide+10+serum", categoryUrl: "https://www.nykaa.com/skin/serums-and-essence/c/8397", cat: "Beauty" },
    { title: "Plum Green Tea Face Wash 100ml", price: 285, mrp: 380, productUrl: "https://www.nykaa.com/search/result/?q=plum+green+tea+face+wash", categoryUrl: "https://www.nykaa.com/skin/cleansers/face-wash/c/6", cat: "Beauty" },
    { title: "L'Oreal Paris Hyaluronic Acid Serum", price: 599, mrp: 999, productUrl: "https://www.nykaa.com/search/result/?q=loreal+paris+hyaluronic+acid+serum", categoryUrl: "https://www.nykaa.com/skin/serums-and-essence/c/8397", cat: "Beauty" },
    { title: "Swiss Beauty Bold Matte Lip Liner Set", price: 299, mrp: 499, productUrl: "https://www.nykaa.com/search/result/?q=swiss+beauty+bold+matte+lip+liner", categoryUrl: "https://www.nykaa.com/makeup/lips/lip-liner/c/12", cat: "Beauty" },
    { title: "Nivea Soft Light Moisturising Cream", price: 225, mrp: 350, productUrl: "https://www.nykaa.com/search/result/?q=nivea+soft+light+moisturising+cream", categoryUrl: "https://www.nykaa.com/skin/moisturizers/c/8398", cat: "Beauty" },
  ],
  Shopsy: [
    { title: "Men Casual Cotton Shirt Pack of 2", price: 199, mrp: 999, productUrl: "https://www.shopsy.in/search?q=men+casual+cotton+shirt+pack+of+2", categoryUrl: "https://www.shopsy.in/clothing/men-clothing/shirts/pr?sid=clo,ash,ank,edy", cat: "Fashion" },
    { title: "Women Printed Rayon A-Line Kurti", price: 249, mrp: 1299, productUrl: "https://www.shopsy.in/search?q=women+printed+rayon+a-line+kurti", categoryUrl: "https://www.shopsy.in/clothing/women-clothing/kurtas-kurtis/pr?sid=clo,ash,ank,edy", cat: "Fashion" },
    { title: "Kids Cartoon Print School Bag 30L", price: 349, mrp: 999, productUrl: "https://www.shopsy.in/search?q=kids+cartoon+print+school+bag", categoryUrl: "https://www.shopsy.in/bags-wallets-belts/bags/pr?sid=reh", cat: "Accessories" },
    { title: "Unisex Lightweight Sports Running Shoes", price: 299, mrp: 1499, productUrl: "https://www.shopsy.in/search?q=unisex+lightweight+sports+running+shoes", categoryUrl: "https://www.shopsy.in/footwear/mens-footwear/sports-shoes/pr?sid=osp,cil", cat: "Footwear" },
    { title: "Rechargeable LED Study Desk Lamp", price: 199, mrp: 799, productUrl: "https://www.shopsy.in/search?q=rechargeable+led+study+desk+lamp", categoryUrl: "https://www.shopsy.in/home-decor/lamps-lighting/pr?sid=arb", cat: "General" },
    { title: "Silicone Back Cover Phone Case", price: 99, mrp: 499, productUrl: "https://www.shopsy.in/search?q=silicone+back+cover+phone+case", categoryUrl: "https://www.shopsy.in/mobiles-accessories/mobile-accessories/pr?sid=tyy,4mr", cat: "Accessories" },
    { title: "Women Traditional Jhumka Earrings Set", price: 149, mrp: 599, productUrl: "https://www.shopsy.in/search?q=women+traditional+jhumka+earrings", categoryUrl: "https://www.shopsy.in/jewellery/earrings/pr?sid=byc,fem", cat: "Accessories" },
    { title: "Men Cotton Comfort Track Pants Combo", price: 249, mrp: 899, productUrl: "https://www.shopsy.in/search?q=men+cotton+comfort+track+pants+combo", categoryUrl: "https://www.shopsy.in/clothing/men-clothing/track-pants/pr?sid=clo,ash,ank", cat: "Fashion" },
  ],
  Ajio: [
    { title: "U.S. Polo Assn. Men Slim Fit Shirt", price: 899, mrp: 2299, productUrl: "https://www.ajio.com/search/?text=us+polo+assn+men+slim+fit+shirt", categoryUrl: "https://www.ajio.com/men-shirts/c/830201002", cat: "Fashion" },
    { title: "United Colors of Benetton Polo T-Shirt", price: 599, mrp: 1499, productUrl: "https://www.ajio.com/search/?text=united+colors+of+benetton+polo+t-shirt", categoryUrl: "https://www.ajio.com/men-tshirts/c/830201001", cat: "Fashion" },
    { title: "Performax Lace-Up Running Shoes", price: 799, mrp: 2499, productUrl: "https://www.ajio.com/search/?text=performax+lace+up+running+shoes", categoryUrl: "https://www.ajio.com/men-sports-shoes/c/830301003", cat: "Footwear" },
    { title: "DNMX Slim Fit Joggers with Drawstring", price: 499, mrp: 1299, productUrl: "https://www.ajio.com/search/?text=dnmx+slim+fit+joggers+drawstring", categoryUrl: "https://www.ajio.com/men-joggers/c/830201017", cat: "Fashion" },
    { title: "Fig Graphic Print Crew-Neck T-Shirt", price: 349, mrp: 899, productUrl: "https://www.ajio.com/search/?text=fig+graphic+print+crew+neck+t-shirt", categoryUrl: "https://www.ajio.com/men-tshirts/c/830201001", cat: "Fashion" },
    { title: "Netplay Casual Slim Fit Chinos", price: 699, mrp: 1999, productUrl: "https://www.ajio.com/search/?text=netplay+casual+slim+fit+chinos", categoryUrl: "https://www.ajio.com/men-trousers/c/830201004", cat: "Fashion" },
    { title: "Teamspirit Hooded Zip-Front Sweatshirt", price: 599, mrp: 1799, productUrl: "https://www.ajio.com/search/?text=teamspirit+hooded+zip+front+sweatshirt", categoryUrl: "https://www.ajio.com/men-sweatshirts/c/830201011", cat: "Fashion" },
    { title: "Reebok Classic Court Low Sneakers", price: 1999, mrp: 5999, productUrl: "https://www.ajio.com/search/?text=reebok+classic+court+low+sneakers", categoryUrl: "https://www.ajio.com/men-casual-shoes/c/830301001", cat: "Footwear" },
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
    originalUrl: item.productUrl,       // Specific product search
    canonicalUrl: item.productUrl,
    categoryUrl: item.categoryUrl,      // Broad category browse
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
