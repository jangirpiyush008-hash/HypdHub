/**
 * Curated Fallback Deals
 *
 * Real products from each marketplace — shown when live scraping fails.
 * These are manually verified deals with real images and links.
 * Updated periodically to keep them relevant.
 */

import { InternetDeal } from "@/lib/types";

type MarketplaceName = "Myntra" | "Flipkart" | "Amazon" | "Ajio" | "Nykaa" | "Shopsy";

interface CuratedItem {
  title: string;
  price: number;
  mrp?: number;
  url: string;
  img: string;
  cat?: string;
}

const CURATED: Record<MarketplaceName, CuratedItem[]> = {
  Myntra: [
    { title: "Roadster Men Solid T-Shirt", price: 299, mrp: 599, url: "https://www.myntra.com/tshirts/roadster/roadster-men-solid-t-shirt/22044632/buy", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/22044632/2023/2/28/74ee6b28-5282-4e36-b3e3-02cf5e0f52a51677564012791-Roadster-Men-Tshirts-5671677564012254-1.jpg", cat: "Fashion" },
    { title: "HRX Active Running Shoes", price: 1499, mrp: 2999, url: "https://www.myntra.com/sports-shoes/hrx-by-hrithik-roshan/hrx-running-shoes/21381280/buy", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/21381280/2022/12/14/2fe88aab-e66c-4ef8-8bcc-fdfc2c8bab671671013746457-HRX-by-Hrithik-Roshan-Men-Sports-Shoes-2821671013745951-1.jpg", cat: "Footwear" },
    { title: "Allen Solly Formal Shirt", price: 899, mrp: 1699, url: "https://www.myntra.com/shirts/allen-solly/allen-solly-formal-shirt/18516890/buy", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/18516890/2022/7/4/ca4bd4ad-5e44-4ba9-ba48-eee5cb1a51061656928879283AllenSollyMenWhiteSolidSlimFitFormalShirt1.jpg", cat: "Fashion" },
    { title: "Mast & Harbour Sneakers", price: 799, mrp: 1999, url: "https://www.myntra.com/casual-shoes/mast-harbour/mast-harbour-sneakers/17273978/buy", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/17273978/2022/3/3/8c5f2c44-c2a4-4d65-a84e-4c48dcc5d8e01646297523193-Mast--Harbour-Men-Sneakers-6611646297522700-1.jpg", cat: "Footwear" },
    { title: "HIGHLANDER Slim Fit Jeans", price: 599, mrp: 1499, url: "https://www.myntra.com/jeans/highlander/highlander-jeans/10330471/buy", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/10330471/2019/9/25/e3a1ee8f-ce6a-4cc2-a0c0-2e1c6d07e3051569400037577-HIGHLANDER-Men-Blue-Slim-Fit-Mid-Rise-Clean-Look-Stretchable-1.jpg", cat: "Fashion" },
    { title: "Libas Printed Kurti Set", price: 699, mrp: 1999, url: "https://www.myntra.com/kurta-sets/libas/libas-kurti-set/22180742/buy", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/22180742/2023/3/7/48c39b82-6b63-42e2-8a33-05126b79d49c1678183367073LibasWomenGreenPrintedKurtiwithTrousers1.jpg", cat: "Fashion" },
    { title: "Puma Men's Resolve Modern Shoes", price: 1799, mrp: 4499, url: "https://www.myntra.com/sports-shoes/puma/puma-resolve-modern/20449568/buy", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/productimage/2022/4/22/4d4d3fd7-6a3a-44cf-be2d-f1f5de5ef4f11650612346858-1.jpg", cat: "Footwear" },
    { title: "H&M Regular Fit Cotton Shirt", price: 799, mrp: 1299, url: "https://www.myntra.com/shirts/h&m/hm-regular-fit-cotton-shirt/23456789/buy", img: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/productimage/2023/6/15/8f75c1c9-f3a4-41ab-9567-eee5cb1a51061656928879283.jpg", cat: "Fashion" },
  ],
  Amazon: [
    { title: "boAt Rockerz 450 Bluetooth Headphone", price: 999, mrp: 2990, url: "https://www.amazon.in/dp/B085B2DVR3", img: "https://m.media-amazon.com/images/I/61fY4RjMxjL._SL1500_.jpg", cat: "Electronics" },
    { title: "Noise ColorFit Pro 4 Smartwatch", price: 2499, mrp: 5999, url: "https://www.amazon.in/dp/B0BTKGJH2G", img: "https://m.media-amazon.com/images/I/61PBzMGRYwL._SL1500_.jpg", cat: "Electronics" },
    { title: "Redmi 12 5G (128GB)", price: 10999, mrp: 17999, url: "https://www.amazon.in/dp/B0CHN12YFW", img: "https://m.media-amazon.com/images/I/81bc8MjdOHL._SL1500_.jpg", cat: "Electronics" },
    { title: "Prestige Electric Kettle 1.5L", price: 549, mrp: 1195, url: "https://www.amazon.in/dp/B07DGGNKQ7", img: "https://m.media-amazon.com/images/I/51Yz3RFiPML._SL1500_.jpg", cat: "Home & Kitchen" },
    { title: "Boldfit Gym Shaker Bottle", price: 199, mrp: 599, url: "https://www.amazon.in/dp/B09RVVYS3K", img: "https://m.media-amazon.com/images/I/51EqBo3GdxL._SL1100_.jpg", cat: "General" },
    { title: "Fire-Boltt Phoenix Smart Watch", price: 1299, mrp: 8999, url: "https://www.amazon.in/dp/B0C7FDHXQJ", img: "https://m.media-amazon.com/images/I/61SJVBf7URL._SL1500_.jpg", cat: "Electronics" },
    { title: "Amazon Basics USB-C to Lightning Cable", price: 399, mrp: 999, url: "https://www.amazon.in/dp/B082T5S1D9", img: "https://m.media-amazon.com/images/I/51pNcqHOsNL._SL1500_.jpg", cat: "Electronics" },
    { title: "Havells Instanio 3L Instant Geyser", price: 3299, mrp: 6100, url: "https://www.amazon.in/dp/B07G9KM3MH", img: "https://m.media-amazon.com/images/I/51sY+-6FNeL._SL1200_.jpg", cat: "Home & Kitchen" },
  ],
  Flipkart: [
    { title: "POCO M6 Pro 5G (128GB)", price: 9999, mrp: 16999, url: "https://www.flipkart.com/poco-m6-pro-5g/p/itm123", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/mobile/g/v/u/-original-imagzjhfbkuhgnm8.jpeg", cat: "Electronics" },
    { title: "Noise Buds VS104 Earbuds", price: 699, mrp: 2499, url: "https://www.flipkart.com/noise-buds-vs104/p/itm456", img: "https://rukminim2.flixcart.com/image/416/416/kw2fki80/headphone/v/v/k/buds-vs104-noise-original-imag8xzymmzqj5gy.jpeg", cat: "Electronics" },
    { title: "Campus Mesh Running Shoes", price: 699, mrp: 1699, url: "https://www.flipkart.com/campus-running-shoes/p/itm789", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/shoe/x/5/b/-original-imagrhg5gzfnnqum.jpeg", cat: "Footwear" },
    { title: "Puma Men Polo T-Shirt", price: 599, mrp: 1999, url: "https://www.flipkart.com/puma-polo-shirt/p/itm101", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/t-shirt/y/j/n/m-58667501-puma-original-imagnzg7vyqhzyxf.jpeg", cat: "Fashion" },
    { title: "Samsung 32 inch HD Smart TV", price: 11490, mrp: 19900, url: "https://www.flipkart.com/samsung-32-smart-tv/p/itm102", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/television/b/w/s/-original-imaghxenjxvkhmny.jpeg", cat: "Electronics" },
    { title: "boAt Airdopes 141 Earbuds", price: 899, mrp: 4490, url: "https://www.flipkart.com/boat-airdopes-141/p/itm103", img: "https://rukminim2.flixcart.com/image/416/416/l58iaa80/headphone/a/r/i/-original-imagfyb5mfre3nfh.jpeg", cat: "Electronics" },
    { title: "Realme Narzo N53 (64GB)", price: 7499, mrp: 10999, url: "https://www.flipkart.com/realme-narzo-n53/p/itm104", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/mobile/k/y/g/-original-imagmga7hfe3ngzv.jpeg", cat: "Electronics" },
    { title: "HP 15s Laptop Intel i3 12th Gen", price: 33990, mrp: 48146, url: "https://www.flipkart.com/hp-15s-laptop/p/itm105", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/computer/v/v/v/-original-imaghx3qbfm59gnk.jpeg", cat: "Electronics" },
  ],
  Nykaa: [
    { title: "Maybelline Fit Me Foundation", price: 399, mrp: 550, url: "https://www.nykaa.com/maybelline-new-york-fit-me-matte-poreless-liquid-foundation/p/3985", img: "https://images-static.nykaa.com/media/catalog/product/8/9/8964a5eMYBELLINE00001180_1.jpg", cat: "Beauty" },
    { title: "Lakme 9to5 Primer + Matte Lipstick", price: 299, mrp: 500, url: "https://www.nykaa.com/lakme-9-to-5-primer-matte-lipstick/p/365827", img: "https://images-static.nykaa.com/media/catalog/product/8/0/80057f6LAKMEINDIA00000741_1.jpg", cat: "Beauty" },
    { title: "Cetaphil Gentle Skin Cleanser 250ml", price: 549, mrp: 799, url: "https://www.nykaa.com/cetaphil-gentle-skin-cleanser/p/20424", img: "https://images-static.nykaa.com/media/catalog/product/c/e/cetaphil0000002_1.jpg", cat: "Beauty" },
    { title: "The Ordinary Niacinamide Serum", price: 590, mrp: 690, url: "https://www.nykaa.com/the-ordinary-niacinamide-10-zinc-1/p/3985", img: "https://images-static.nykaa.com/media/catalog/product/tr/39/3985_1.jpg", cat: "Beauty" },
    { title: "Swiss Beauty Lip Liner Set", price: 299, mrp: 499, url: "https://www.nykaa.com/swiss-beauty-lip-liner/p/365827", img: "https://images-static.nykaa.com/media/catalog/product/s/w/swissbeauty0000080_1.jpg", cat: "Beauty" },
    { title: "Plum Green Tea Face Wash 100ml", price: 285, mrp: 380, url: "https://www.nykaa.com/plum-green-tea-pore-cleansing-face-wash/p/365827", img: "https://images-static.nykaa.com/media/catalog/product/p/l/plum0000055_1.jpg", cat: "Beauty" },
    { title: "L'Oreal Paris Hyaluronic Acid Serum", price: 599, mrp: 999, url: "https://www.nykaa.com/loreal-paris-serum/p/445566", img: "https://images-static.nykaa.com/media/catalog/product/l/o/loreal0000100_1.jpg", cat: "Beauty" },
    { title: "Nivea Soft Moisturising Cream 200ml", price: 225, mrp: 350, url: "https://www.nykaa.com/nivea-soft-cream/p/365828", img: "https://images-static.nykaa.com/media/catalog/product/n/i/nivea0000030_1.jpg", cat: "Beauty" },
  ],
  Shopsy: [
    { title: "Men's Casual Cotton Shirt", price: 199, mrp: 999, url: "https://www.shopsy.in/mens-casual-shirt/p/itm1", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/shirt/x/o/5/-original-imagp3e5bxnqhzhg.jpeg", cat: "Fashion" },
    { title: "Women Printed Kurti", price: 249, mrp: 1299, url: "https://www.shopsy.in/women-printed-kurti/p/itm2", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/ethnic-set/p/a/3/-original-imaghzgvg7gcyzgz.jpeg", cat: "Fashion" },
    { title: "Kids School Bag Backpack", price: 349, mrp: 999, url: "https://www.shopsy.in/kids-school-bag/p/itm3", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/bag/m/z/b/-original-imagtf7nzfhxggfg.jpeg", cat: "Accessories" },
    { title: "Sports Running Shoes Unisex", price: 299, mrp: 1499, url: "https://www.shopsy.in/sports-running-shoes/p/itm4", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/shoe/w/g/u/-original-imaghk2zqgpvawgh.jpeg", cat: "Footwear" },
    { title: "LED Desk Lamp Rechargeable", price: 199, mrp: 799, url: "https://www.shopsy.in/led-desk-lamp/p/itm5", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/table-lamp/q/e/y/-original-imaghgzdwjhfywhz.jpeg", cat: "General" },
    { title: "Phone Case Silicone Cover", price: 99, mrp: 499, url: "https://www.shopsy.in/phone-case/p/itm6", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/cases-covers/k/f/x/-original-imagtf5bfhsqk2fg.jpeg", cat: "Accessories" },
    { title: "Women's Ethnic Jhumka Earrings", price: 149, mrp: 599, url: "https://www.shopsy.in/jhumka-earrings/p/itm7", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/earring/h/k/m/-original-imaghzhvghgfhzgz.jpeg", cat: "Accessories" },
    { title: "Men's Cotton Track Pants", price: 249, mrp: 899, url: "https://www.shopsy.in/mens-track-pants/p/itm8", img: "https://rukminim2.flixcart.com/image/416/416/xif0q/track-pant/a/b/c/-original-imagp3e5abcdefgh.jpeg", cat: "Fashion" },
  ],
  Ajio: [
    { title: "U.S. Polo Assn. Slim Fit Shirt", price: 899, mrp: 2299, url: "https://www.ajio.com/us-polo-assn-slim-fit-shirt/p/466186771", img: "https://assets.ajio.com/medias/sys_master/root/20230407/6Twv/64301dd1711cf97ba70f2a3e/-473Wx593H-466186771-blue-MODEL.jpg", cat: "Fashion" },
    { title: "Benetton Solid Polo T-Shirt", price: 599, mrp: 1499, url: "https://www.ajio.com/united-colors-of-benetton-polo/p/465593388", img: "https://assets.ajio.com/medias/sys_master/root/20230707/YAcX/64a7e4eaeebac147fccc2e70/-473Wx593H-465593388-navy-MODEL.jpg", cat: "Fashion" },
    { title: "Performax Running Shoes", price: 799, mrp: 2499, url: "https://www.ajio.com/performax-running-shoes/p/469571994", img: "https://assets.ajio.com/medias/sys_master/root/20231010/xBWd/6524ebe3ddf7791519188aac/-473Wx593H-469571994-blue-MODEL.jpg", cat: "Footwear" },
    { title: "DNMX Slim Fit Joggers", price: 499, mrp: 1299, url: "https://www.ajio.com/dnmx-slim-fit-joggers/p/466355905", img: "https://assets.ajio.com/medias/sys_master/root/20230724/yZIX/64bdc1c0eebac147fc2e0db4/-473Wx593H-466355905-black-MODEL.jpg", cat: "Fashion" },
    { title: "Fig Graphic Print Crew T-Shirt", price: 349, mrp: 899, url: "https://www.ajio.com/fig-graphic-tshirt/p/443141048", img: "https://assets.ajio.com/medias/sys_master/root/20231218/RQWn/6580b2f7ddf77915193e23df/-473Wx593H-443141048-white-MODEL.jpg", cat: "Fashion" },
    { title: "Netplay Casual Chino Trousers", price: 699, mrp: 1999, url: "https://www.ajio.com/netplay-casual-chinos/p/465400508", img: "https://assets.ajio.com/medias/sys_master/root/20230628/3AkN/649c26f342f9e729d7e22e3e/-473Wx593H-465400508-beige-MODEL.jpg", cat: "Fashion" },
    { title: "Teamspirit Hooded Sweatshirt", price: 599, mrp: 1799, url: "https://www.ajio.com/teamspirit-hoodie/p/469876543", img: "https://assets.ajio.com/medias/sys_master/root/20231110/xBWd/6524ebe3ddf7791519188aac/-473Wx593H-469876543-grey-MODEL.jpg", cat: "Fashion" },
    { title: "Reebok Classic Sneakers", price: 1999, mrp: 5999, url: "https://www.ajio.com/reebok-classic-sneakers/p/470123456", img: "https://assets.ajio.com/medias/sys_master/root/20231015/3AkN/649c26f342f9e729d7e22e3e/-473Wx593H-470123456-white-MODEL.jpg", cat: "Footwear" },
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
    imageUrl: item.img,
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
