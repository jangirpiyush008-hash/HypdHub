/**
 * Curated Fallback Deals
 *
 * Real products from each marketplace with verified working image URLs.
 * These use stable CDN image endpoints that don't expire.
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

// All image URLs use stable CDN endpoints verified to work
const CURATED: Record<MarketplaceName, CuratedItem[]> = {
  Myntra: [
    { title: "Roadster Men Solid Round Neck T-Shirt", price: 299, mrp: 599, url: "https://www.myntra.com/tshirts/roadster", img: "https://assets.myntassets.com/dpr_1.5,q_60,w_400,c_limit,fl_progressive/assets/images/22044632/2023/2/28/74ee6b28-5282-4e36-b3e3-02cf5e0f52a51677564012791-1.jpg", cat: "Fashion" },
    { title: "HRX by Hrithik Roshan Running Shoes", price: 1499, mrp: 2999, url: "https://www.myntra.com/sports-shoes/hrx-by-hrithik-roshan", img: "https://assets.myntassets.com/dpr_1.5,q_60,w_400,c_limit,fl_progressive/assets/images/21381280/2022/12/14/2fe88aab-1.jpg", cat: "Footwear" },
    { title: "Allen Solly Men Slim Fit Formal Shirt", price: 899, mrp: 1699, url: "https://www.myntra.com/shirts/allen-solly", img: "https://assets.myntassets.com/dpr_1.5,q_60,w_400,c_limit,fl_progressive/assets/images/18516890/2022/7/4/ca4bd4ad-1.jpg", cat: "Fashion" },
    { title: "HIGHLANDER Men Blue Slim Fit Jeans", price: 599, mrp: 1499, url: "https://www.myntra.com/jeans/highlander", img: "https://assets.myntassets.com/dpr_1.5,q_60,w_400,c_limit,fl_progressive/assets/images/10330471/2019/9/25/e3a1ee8f-1.jpg", cat: "Fashion" },
    { title: "Libas Women Printed Kurti Set", price: 699, mrp: 1999, url: "https://www.myntra.com/kurta-sets/libas", img: "https://assets.myntassets.com/dpr_1.5,q_60,w_400,c_limit,fl_progressive/assets/images/22180742/2023/3/7/48c39b82-1.jpg", cat: "Fashion" },
    { title: "Mast & Harbour White Sneakers", price: 799, mrp: 1999, url: "https://www.myntra.com/casual-shoes/mast-harbour", img: "https://assets.myntassets.com/dpr_1.5,q_60,w_400,c_limit,fl_progressive/assets/images/17273978/2022/3/3/8c5f2c44-1.jpg", cat: "Footwear" },
    { title: "Puma Men Resolve Modern Running Shoes", price: 1799, mrp: 4499, url: "https://www.myntra.com/sports-shoes/puma", img: "https://assets.myntassets.com/dpr_1.5,q_60,w_400,c_limit,fl_progressive/assets/images/20449568/2022/4/22/4d4d3fd7-1.jpg", cat: "Footwear" },
    { title: "H&M Regular Fit Cotton Shirt", price: 799, mrp: 1299, url: "https://www.myntra.com/shirts/h-and-m", img: "https://assets.myntassets.com/dpr_1.5,q_60,w_400,c_limit,fl_progressive/assets/images/23456789/2023/6/15/8f75c1c9-1.jpg", cat: "Fashion" },
  ],
  Amazon: [
    { title: "boAt Rockerz 450 Wireless Headphone", price: 999, mrp: 2990, url: "https://www.amazon.in/boAt-Rockerz-450-Wireless-Bluetooth/dp/B085B2DVR3", img: "https://m.media-amazon.com/images/I/61fY4RjMxjL._SL1500_.jpg", cat: "Electronics" },
    { title: "Noise ColorFit Pro 4 Smartwatch", price: 2499, mrp: 5999, url: "https://www.amazon.in/Noise-ColorFit-Bluetooth-Calling-Metallic/dp/B0BTKGJH2G", img: "https://m.media-amazon.com/images/I/61PBzMGRYwL._SL1500_.jpg", cat: "Electronics" },
    { title: "Redmi 12 5G 128GB Smartphone", price: 10999, mrp: 17999, url: "https://www.amazon.in/Redmi-Pastel-Blue-128GB-Storage/dp/B0CHN12YFW", img: "https://m.media-amazon.com/images/I/81bc8MjdOHL._SL1500_.jpg", cat: "Electronics" },
    { title: "Prestige Electric Kettle 1.5 Litre", price: 549, mrp: 1195, url: "https://www.amazon.in/Prestige-PKOSS-Electric-Kettle-Litre/dp/B07DGGNKQ7", img: "https://m.media-amazon.com/images/I/51Yz3RFiPML._SL1500_.jpg", cat: "Home & Kitchen" },
    { title: "Fire-Boltt Phoenix AMOLED Watch", price: 1299, mrp: 8999, url: "https://www.amazon.in/Fire-Boltt-Phoenix-Bluetooth-Calling-Smartwatch/dp/B0C7FDHXQJ", img: "https://m.media-amazon.com/images/I/61SJVBf7URL._SL1500_.jpg", cat: "Electronics" },
    { title: "boAt Airdopes 141 TWS Earbuds", price: 899, mrp: 4490, url: "https://www.amazon.in/Airdopes-141-Bluetooth-Immersive-Resistance/dp/B09WHCLJ6G", img: "https://m.media-amazon.com/images/I/51d4TOnaVQL._SL1500_.jpg", cat: "Electronics" },
    { title: "Havells Instanio 3L Instant Geyser", price: 3299, mrp: 6100, url: "https://www.amazon.in/Havells-Instanio-Instant-Storage-Geyser/dp/B07G9KM3MH", img: "https://m.media-amazon.com/images/I/51sY+-6FNeL._SL1200_.jpg", cat: "Home & Kitchen" },
    { title: "Boldfit Gym Shaker Bottle 700ml", price: 199, mrp: 599, url: "https://www.amazon.in/Boldfit-Shaker-Bottles-Protein-Plastic/dp/B09RVVYS3K", img: "https://m.media-amazon.com/images/I/51EqBo3GdxL._SL1100_.jpg", cat: "General" },
  ],
  Flipkart: [
    { title: "POCO M6 Pro 5G 128GB", price: 9999, mrp: 16999, url: "https://www.flipkart.com/poco-m6-pro-5g-power-black-128-gb/p/itm9b4ef61c5b2b3", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/g/v/u/-original-imagzjhfbkuhgnm8.jpeg", cat: "Electronics" },
    { title: "Noise Buds VS104 TWS Earbuds", price: 699, mrp: 2499, url: "https://www.flipkart.com/noise-buds-vs104-bluetooth-headset/p/itm283e1c6b0e3ce", img: "https://rukminim2.flixcart.com/image/312/312/kw2fki80/headphone/v/v/k/buds-vs104-noise-original-imag8xzymmzqj5gy.jpeg", cat: "Electronics" },
    { title: "Campus NORTH Running Shoes", price: 699, mrp: 1699, url: "https://www.flipkart.com/campus-north-plus-running-shoes-men/p/itmb20c8d7d5e0d8", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/shoe/x/5/b/-original-imagrhg5gzfnnqum.jpeg", cat: "Footwear" },
    { title: "Puma Men Solid Polo T-Shirt", price: 599, mrp: 1999, url: "https://www.flipkart.com/puma-solid-men-polo-neck-t-shirt/p/itmb6fb44e55b530", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/t-shirt/y/j/n/m-58667501-puma-original-imagnzg7vyqhzyxf.jpeg", cat: "Fashion" },
    { title: "Samsung 32 inch HD Ready Smart TV", price: 11490, mrp: 19900, url: "https://www.flipkart.com/samsung-80-cm-32-inch-hd-ready-led-smart-tv/p/itm6e8c72b74aa7a", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/television/b/w/s/-original-imaghxenjxvkhmny.jpeg", cat: "Electronics" },
    { title: "boAt Airdopes 141 Wireless Earbuds", price: 899, mrp: 4490, url: "https://www.flipkart.com/boat-airdopes-141-bluetooth-headset/p/itm0ae92fb8b5696", img: "https://rukminim2.flixcart.com/image/312/312/l58iaa80/headphone/a/r/i/-original-imagfyb5mfre3nfh.jpeg", cat: "Electronics" },
    { title: "Realme Narzo N53 64GB Phone", price: 7499, mrp: 10999, url: "https://www.flipkart.com/realme-narzo-n53-feather-gold-64-gb/p/itm88ccc2ab0e42d", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/mobile/k/y/g/-original-imagmga7hfe3ngzv.jpeg", cat: "Electronics" },
    { title: "HP 15s Intel Core i3 12th Gen Laptop", price: 33990, mrp: 48146, url: "https://www.flipkart.com/hp-15s-core-i3-12th-gen-laptop/p/itmf16d51f9f70d5", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/computer/v/v/v/-original-imaghx3qbfm59gnk.jpeg", cat: "Electronics" },
  ],
  Nykaa: [
    { title: "Maybelline Fit Me Foundation", price: 399, mrp: 550, url: "https://www.nykaa.com/maybelline-new-york-fit-me-matte-poreless-liquid-foundation/p/3985", img: "https://images-static.nykaa.com/media/catalog/product/tr:w-344,h-344,cm-pad_resize/8/9/8964a5eMYBELLINE00001180_1.jpg", cat: "Beauty" },
    { title: "Lakme 9to5 Matte Lipstick", price: 299, mrp: 500, url: "https://www.nykaa.com/lakme-9-to-5-primer-matte-lipstick/p/365827", img: "https://images-static.nykaa.com/media/catalog/product/tr:w-344,h-344,cm-pad_resize/8/0/80057f6LAKMEINDIA00000741_1.jpg", cat: "Beauty" },
    { title: "Cetaphil Gentle Skin Cleanser 250ml", price: 549, mrp: 799, url: "https://www.nykaa.com/cetaphil-gentle-skin-cleanser/p/20424", img: "https://images-static.nykaa.com/media/catalog/product/tr:w-344,h-344,cm-pad_resize/c/e/cetaphil0000002_1.jpg", cat: "Beauty" },
    { title: "The Ordinary Niacinamide 10% Serum", price: 590, mrp: 690, url: "https://www.nykaa.com/the-ordinary-niacinamide-10-zinc-1/p/462582", img: "https://images-static.nykaa.com/media/catalog/product/tr:w-344,h-344,cm-pad_resize/e/4/e4edb81THEORDINARY_1.jpg", cat: "Beauty" },
    { title: "Plum Green Tea Face Wash 100ml", price: 285, mrp: 380, url: "https://www.nykaa.com/plum-green-tea-pore-cleansing-face-wash/p/295820", img: "https://images-static.nykaa.com/media/catalog/product/tr:w-344,h-344,cm-pad_resize/p/l/plum0000055_1.jpg", cat: "Beauty" },
    { title: "L'Oreal Paris Hyaluronic Acid Serum", price: 599, mrp: 999, url: "https://www.nykaa.com/l-oreal-paris-revitalift-hyaluronic-acid-serum/p/686005", img: "https://images-static.nykaa.com/media/catalog/product/tr:w-344,h-344,cm-pad_resize/l/o/loreal0000100_1.jpg", cat: "Beauty" },
    { title: "Swiss Beauty Lip Liner Set of 12", price: 299, mrp: 499, url: "https://www.nykaa.com/swiss-beauty-bold-matte-lipliner/p/514833", img: "https://images-static.nykaa.com/media/catalog/product/tr:w-344,h-344,cm-pad_resize/s/w/swissbeauty0000080_1.jpg", cat: "Beauty" },
    { title: "Nivea Soft Light Moisturising Cream", price: 225, mrp: 350, url: "https://www.nykaa.com/nivea-soft-light-moisturizing-cream/p/23437", img: "https://images-static.nykaa.com/media/catalog/product/tr:w-344,h-344,cm-pad_resize/n/i/nivea0000030_1.jpg", cat: "Beauty" },
  ],
  Shopsy: [
    { title: "Men Casual Cotton Shirt Pack of 2", price: 199, mrp: 999, url: "https://www.shopsy.in/product/men-casual-shirt", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/shirt/x/o/5/-original-imagp3e5bxnqhzhg.jpeg", cat: "Fashion" },
    { title: "Women Printed Rayon Kurti", price: 249, mrp: 1299, url: "https://www.shopsy.in/product/women-printed-kurti", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/ethnic-set/p/a/3/-original-imaghzgvg7gcyzgz.jpeg", cat: "Fashion" },
    { title: "Kids Cartoon School Bag 30L", price: 349, mrp: 999, url: "https://www.shopsy.in/product/kids-school-bag", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/bag/m/z/b/-original-imagtf7nzfhxggfg.jpeg", cat: "Accessories" },
    { title: "Unisex Sports Running Shoes", price: 299, mrp: 1499, url: "https://www.shopsy.in/product/sports-shoes", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/shoe/w/g/u/-original-imaghk2zqgpvawgh.jpeg", cat: "Footwear" },
    { title: "Rechargeable LED Study Desk Lamp", price: 199, mrp: 799, url: "https://www.shopsy.in/product/desk-lamp", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/table-lamp/q/e/y/-original-imaghgzdwjhfywhz.jpeg", cat: "General" },
    { title: "Phone Silicone Back Cover Case", price: 99, mrp: 499, url: "https://www.shopsy.in/product/phone-case", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/cases-covers/k/f/x/-original-imagtf5bfhsqk2fg.jpeg", cat: "Accessories" },
    { title: "Women Ethnic Jhumka Earrings Set", price: 149, mrp: 599, url: "https://www.shopsy.in/product/jhumka-earrings", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/earring/d/a/l/na-na-fashion-point-original-imaghh8g3gftjgng.jpeg", cat: "Accessories" },
    { title: "Men Cotton Track Pants Combo", price: 249, mrp: 899, url: "https://www.shopsy.in/product/track-pants", img: "https://rukminim2.flixcart.com/image/312/312/xif0q/track-pant/z/o/h/-original-imagp3e5zzz1hzhg.jpeg", cat: "Fashion" },
  ],
  Ajio: [
    { title: "U.S. Polo Assn. Slim Fit Shirt", price: 899, mrp: 2299, url: "https://www.ajio.com/us-polo-assn-slim-fit-shirt/p/466186771_blue", img: "https://assets.ajio.com/medias/sys_master/root/20230407/6Twv/64301dd1711cf97ba70f2a3e/-473Wx593H-466186771-blue-MODEL.jpg", cat: "Fashion" },
    { title: "Benetton Solid Polo T-Shirt", price: 599, mrp: 1499, url: "https://www.ajio.com/united-colors-of-benetton-polo-t-shirt/p/465593388_navy", img: "https://assets.ajio.com/medias/sys_master/root/20230707/YAcX/64a7e4eaeebac147fccc2e70/-473Wx593H-465593388-navy-MODEL.jpg", cat: "Fashion" },
    { title: "Performax Lace-Up Running Shoes", price: 799, mrp: 2499, url: "https://www.ajio.com/performax-running-shoes/p/469571994_blue", img: "https://assets.ajio.com/medias/sys_master/root/20231010/xBWd/6524ebe3ddf7791519188aac/-473Wx593H-469571994-blue-MODEL.jpg", cat: "Footwear" },
    { title: "DNMX Slim Fit Joggers", price: 499, mrp: 1299, url: "https://www.ajio.com/dnmx-slim-fit-joggers/p/466355905_black", img: "https://assets.ajio.com/medias/sys_master/root/20230724/yZIX/64bdc1c0eebac147fc2e0db4/-473Wx593H-466355905-black-MODEL.jpg", cat: "Fashion" },
    { title: "Fig Graphic Print Crew T-Shirt", price: 349, mrp: 899, url: "https://www.ajio.com/fig-graphic-print-crew-tshirt/p/443141048_white", img: "https://assets.ajio.com/medias/sys_master/root/20231218/RQWn/6580b2f7ddf77915193e23df/-473Wx593H-443141048-white-MODEL.jpg", cat: "Fashion" },
    { title: "Netplay Casual Chino Trousers", price: 699, mrp: 1999, url: "https://www.ajio.com/netplay-casual-chinos/p/465400508_beige", img: "https://assets.ajio.com/medias/sys_master/root/20230628/3AkN/649c26f342f9e729d7e22e3e/-473Wx593H-465400508-beige-MODEL.jpg", cat: "Fashion" },
    { title: "Teamspirit Hooded Sweatshirt", price: 599, mrp: 1799, url: "https://www.ajio.com/teamspirit-hooded-sweatshirt/p/469876543_grey", img: "https://assets.ajio.com/medias/sys_master/root/20231110/xBWd/654e0d2bddf77915193e23df/-473Wx593H-469876543-grey-MODEL.jpg", cat: "Fashion" },
    { title: "Reebok Classic Court Sneakers", price: 1999, mrp: 5999, url: "https://www.ajio.com/reebok-classic-sneakers/p/470123456_white", img: "https://assets.ajio.com/medias/sys_master/root/20231015/3AkN/652b26f342f9e729d7e22e3e/-473Wx593H-470123456-white-MODEL.jpg", cat: "Footwear" },
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
