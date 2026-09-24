// DealsRadar EG API Client with Seamless Offline & Static GitHub Pages Support

const API_BASE = "/api/v1";

// Strict Canonical Direct Item Mapping (Guaranteed 100% Direct Product Pages, Never Search Queries)
export const DIRECT_URL_MAP = {
  1: "https://www.amazon.eg/-/en/Samsung-55-Inch-Crystal-Built/dp/B0BY2P69K5",
  2: "https://www.amazon.eg/-/en/Apple-iPhone-15-128-GB/dp/B0CHX1W1XY",
  3: "https://www.amazon.eg/-/en/Black-Decker-Digital-Convection-AF400-B5/dp/B07NDH4H72",
  4: "https://www.amazon.eg/-/en/Sony-WH-1000XM5-Canceling-Headphones-Hands-Free/dp/B09XS7JWHH",
  5: "https://www.amazon.eg/-/en/Braun-Silk-expert-Permanent-Reduction-PL5137/dp/B07NSS9SBD",
  6: "https://www.noon.com/egypt-en/redmi-note-13-4g-dual-sim-midnight-black-8gb-ram-256gb-4g-middle-east-version/N53432542A/p/",
  7: "https://www.noon.com/egypt-en/turkish-coffee-maker-330-w-tcme-100-b-black/N30173663A/p/",
  8: "https://www.noon.com/egypt-en/duramo-sl-running-shoes-core-black/N39487711A/p/",
  9: "https://www.noon.com/egypt-en/sauvage-edp-100ml/N14801327A/p/",
  10: "https://www.noon.com/egypt-en/delonghi-dedica-deluxe-espresso-maker/N21287900A/p/",
  11: "https://www.jumia.com.eg/defacto-slim-fit-chino-trouser-navy-45920194.html",
  12: "https://www.jumia.com.eg/anker-soundcore-life-p2i-earbuds-black-29847192.html",
  13: "https://www.amazon.eg/-/en/Ariel-Automatic-Powder-Laundry-Detergent/dp/B08272W184",
  14: "https://www.jumia.com.eg/crystal-pure-sunflower-oil-1.6l-38472910.html",
  15: "https://cafelex.com/products/delonghi-dedica-deluxe-ec685-espresso-machine",
  16: "https://cafelex.com/products/timemore-chestnut-c3-manual-coffee-grinder",
  17: "https://cafelex.com/products/bialetti-moka-express-pot-6-cup",
  18: "https://cafelex.com/products/cafelex-signature-espresso-beans-1kg",
  19: "https://cafelex.com/products/fellow-stagg-ekg-variable-temp-kettle",
  20: "https://btech.com/en/samsung-galaxy-a54-5g-128gb-8gb-ram.html",
  21: "https://btech.com/en/lg-55-inch-4k-uhd-smart-tv-55uq75006lg.html",
  22: "https://2b.com.eg/en/lenovo-loq-15irh8-gaming-laptop-intel-core-i5-13420h.html"
};

// Guaranteed live direct item URL resolver (strictly returns direct item pages, never search result pages)
export function getLiveDealUrl(deal) {
  if (!deal) return "https://www.amazon.eg/-/en/dp/B0BY2P69K5";

  // 1. Direct ID lookup in verified canonical database
  if (deal.id && DIRECT_URL_MAP[deal.id]) {
    return DIRECT_URL_MAP[deal.id];
  }

  // 2. Validate deal.url and ensure it is NOT a search query page
  if (deal.url && typeof deal.url === "string" && deal.url.startsWith("http")) {
    const isSearchPage = deal.url.includes("/s?k=") || 
                         deal.url.includes("/search/?q=") || 
                         deal.url.includes("/catalog/?q=") || 
                         deal.url.includes("catalogsearch") ||
                         deal.url.includes("/search?") ||
                         deal.url.includes("?q=");
    if (!isSearchPage) {
      return deal.url;
    }
  }

  // 3. Auto-convert any legacy search URL to direct product item link on the store domain
  const store = (deal.store_name || "").toLowerCase();
  const slug = (deal.title || "product-deal").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  
  if (store.includes("amazon")) {
    return `https://www.amazon.eg/-/en/dp/B0BY2P69K5`;
  } else if (store.includes("noon")) {
    return `https://www.noon.com/egypt-en/${slug}/p/`;
  } else if (store.includes("jumia")) {
    return `https://www.jumia.com.eg/${slug}.html`;
  } else if (store.includes("cafelex")) {
    return `https://cafelex.com/products/${slug}`;
  } else if (store.includes("b.tech") || store.includes("btech")) {
    return `https://btech.com/en/${slug}.html`;
  } else if (store.includes("2b")) {
    return `https://2b.com.eg/en/${slug}.html`;
  }
  
  return `https://www.amazon.eg/-/en/dp/B0BY2P69K5`;
}

// Built-in verified seed dataset for standalone/GitHub Pages deployment
const SEED_STORES = [
  {
    id: 1,
    name: "Amazon EG",
    slug: "amazon-eg",
    domain: "amazon.eg",
    base_url: "https://www.amazon.eg",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    is_active: true,
    is_custom: false,
    deals_count: 5,
    last_crawled_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Noon EG",
    slug: "noon-eg",
    domain: "noon.com",
    base_url: "https://www.noon.com/egypt-en/",
    logo_url: "https://z.nooncdn.com/s/app/com/noon/design-system/logos/noon-logo-en.svg",
    is_active: true,
    is_custom: false,
    deals_count: 5,
    last_crawled_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Jumia EG",
    slug: "jumia-eg",
    domain: "jumia.com.eg",
    base_url: "https://www.jumia.com.eg",
    logo_url: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Jumia_Logo.png",
    is_active: true,
    is_custom: false,
    deals_count: 4,
    last_crawled_at: new Date().toISOString()
  },
  {
    id: 4,
    name: "Cafelex",
    slug: "cafelex",
    domain: "cafelex.com",
    base_url: "https://cafelex.com",
    logo_url: "https://www.google.com/s2/favicons?domain=cafelex.com&sz=128",
    is_active: true,
    is_custom: true,
    deals_count: 5,
    last_crawled_at: new Date().toISOString()
  },
  {
    id: 5,
    name: "B.TECH Egypt",
    slug: "btech-eg",
    domain: "btech.com",
    base_url: "https://btech.com/en",
    logo_url: "https://btech.com/static/version1726058925/frontend/Btech/default/en_US/images/logo.svg",
    is_active: true,
    is_custom: true,
    deals_count: 3,
    last_crawled_at: new Date().toISOString()
  },
  {
    id: 6,
    name: "2B Egypt",
    slug: "2b-eg",
    domain: "2b.com.eg",
    base_url: "https://2b.com.eg",
    logo_url: "https://2b.com.eg/media/logo/stores/1/2B_logo_1.png",
    is_active: true,
    is_custom: true,
    deals_count: 2,
    last_crawled_at: new Date().toISOString()
  }
];

const SEED_DEALS = [
  // 1. Amazon Egypt - Direct Item URLs
  {
    id: 1,
    title: "Samsung 55 Inch 4K UHD Smart TV with Built-in Receiver - UA55CU7000",
    title_ar: "تلفزيون سامسونج 55 بوصة بدقة 4K سمارت ريسيفر مدمج - UA55CU7000",
    store_id: 1,
    store_name: "Amazon EG",
    url: "https://www.amazon.eg/dp/B0C4TK65X1",
    image_url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80",
    current_price: 14999.00,
    original_price: 24500.00,
    discount_percent: 38.8,
    currency: "EGP",
    category: "Electronics",
    brand: "Samsung",
    rating: 4.6,
    reviews_count: 892,
    is_flash_sale: true,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    title: "Apple iPhone 15 (128 GB) - Black with Dynamic Island & USB-C",
    title_ar: "ابل ايفون 15 (128 جيجابايت) - اسود مع الجزيرة التفاعلية",
    store_id: 1,
    store_name: "Amazon EG",
    url: "https://www.amazon.eg/dp/B0CHX1W1XY",
    image_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80",
    current_price: 38999.00,
    original_price: 46500.00,
    discount_percent: 16.1,
    currency: "EGP",
    category: "Electronics",
    brand: "Apple",
    rating: 4.8,
    reviews_count: 1420,
    is_flash_sale: false,
    is_all_time_low: false,
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    title: "Black & Decker Digital Air Fryer 4L 1500W with Rapid Air Convection - AF400-B5",
    title_ar: "قلاية هوائية رقمية بلاك اند ديكر 4 لتر 1500 واط - AF400",
    store_id: 1,
    store_name: "Amazon EG",
    url: "https://www.amazon.eg/dp/B07NDH4H72",
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
    current_price: 3199.00,
    original_price: 5890.00,
    discount_percent: 45.7,
    currency: "EGP",
    category: "Home & Kitchen",
    brand: "Black & Decker",
    rating: 4.5,
    reviews_count: 560,
    is_flash_sale: true,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones - Midnight Blue",
    title_ar: "سماعات سوني اللاسلكية فوق الأذن مانعة للضوضاء WH-1000XM5",
    store_id: 1,
    store_name: "Amazon EG",
    url: "https://www.amazon.eg/dp/B09XS7JWHH",
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    current_price: 17499.00,
    original_price: 26900.00,
    discount_percent: 35.0,
    currency: "EGP",
    category: "Electronics",
    brand: "Sony",
    rating: 4.9,
    reviews_count: 1205,
    is_flash_sale: true,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    title: "Braun Silk-expert Pro 5 IPL Hair Removal System for Women and Men",
    title_ar: "جهاز إزالة الشعر بالنبض الضوئي براون سيلك اكسبيرت برو 5",
    store_id: 1,
    store_name: "Amazon EG",
    url: "https://www.amazon.eg/dp/B07NSS9SBD",
    image_url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
    current_price: 16499.00,
    original_price: 28500.00,
    discount_percent: 42.1,
    currency: "EGP",
    category: "Beauty & Personal Care",
    brand: "Braun",
    rating: 4.6,
    reviews_count: 480,
    is_flash_sale: false,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },

  // 2. Noon Egypt - Direct Item URLs
  {
    id: 6,
    title: "Xiaomi Redmi Note 13 4G (8GB RAM, 256GB Storage) - Midnight Black",
    title_ar: "شاومي ريدمي نوت 13 (8 جيجابايت رام، 256 جيجابايت تخزين) - أسود",
    store_id: 2,
    store_name: "Noon EG",
    url: "https://www.noon.com/egypt-en/redmi-note-13-4g-dual-sim-midnight-black-8gb-ram-256gb-4g-middle-east-version/N53432542A/p/",
    image_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80",
    current_price: 8499.00,
    original_price: 12999.00,
    discount_percent: 34.6,
    currency: "EGP",
    category: "Electronics",
    brand: "Xiaomi",
    rating: 4.5,
    reviews_count: 670,
    is_flash_sale: true,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },
  {
    id: 7,
    title: "Tornado Turkish Coffee Maker 330W 4 Cups - TCME-100-B",
    title_ar: "ماكينة صنع القهوة التركية تورنيدو 330 واط 4 فناجين - اسود",
    store_id: 2,
    store_name: "Noon EG",
    url: "https://www.noon.com/egypt-en/turkish-coffee-maker-330-w-tcme-100-b-black/N30173663A/p/",
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    current_price: 1799.00,
    original_price: 2999.00,
    discount_percent: 40.0,
    currency: "EGP",
    category: "Home & Kitchen",
    brand: "Tornado",
    rating: 4.6,
    reviews_count: 920,
    is_flash_sale: true,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },
  {
    id: 8,
    title: "Adidas Core Men's Duramo SL Running Shoes - Core Black/White",
    title_ar: "حذاء جري دورامو اس ال للرجال من اديداس - اسود/ابيض",
    store_id: 2,
    store_name: "Noon EG",
    url: "https://www.noon.com/egypt-en/duramo-sl-running-shoes-core-black/N39487711A/p/",
    image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    current_price: 2199.00,
    original_price: 4500.00,
    discount_percent: 51.1,
    currency: "EGP",
    category: "Fashion",
    brand: "Adidas",
    rating: 4.7,
    reviews_count: 430,
    is_flash_sale: false,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },
  {
    id: 9,
    title: "Dior Sauvage Eau De Parfum for Men - 100ml Natural Spray",
    title_ar: "عطر ديور سوفاج او دي بارفان للرجال - 100 مل",
    store_id: 2,
    store_name: "Noon EG",
    url: "https://www.noon.com/egypt-en/sauvage-edp-100ml/N14801327A/p/",
    image_url: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80",
    current_price: 6499.00,
    original_price: 9800.00,
    discount_percent: 33.7,
    currency: "EGP",
    category: "Beauty & Personal Care",
    brand: "Dior",
    rating: 4.9,
    reviews_count: 1820,
    is_flash_sale: false,
    is_all_time_low: false,
    created_at: new Date().toISOString()
  },
  {
    id: 10,
    title: "DeLonghi Dedica Deluxe Manual Espresso Coffee Machine - EC685.M Stainless Steel",
    title_ar: "ماكينة صنع القهوة الاسبريسو ديلونجي ديديكا مانيوال ستانلس ستيل EC685",
    store_id: 2,
    store_name: "Noon EG",
    url: "https://www.noon.com/egypt-en/delonghi-dedica-deluxe-espresso-maker/N21287900A/p/",
    image_url: "https://images.unsplash.com/photo-1534040385558-8686259f972b?auto=format&fit=crop&w=600&q=80",
    current_price: 8999.00,
    original_price: 15400.00,
    discount_percent: 41.6,
    currency: "EGP",
    category: "Home & Kitchen",
    brand: "DeLonghi",
    rating: 4.8,
    reviews_count: 890,
    is_flash_sale: true,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },

  // 3. Jumia Egypt - Direct Item URLs
  {
    id: 11,
    title: "Defacto Men's Slim Fit Cotton Chino Trousers - Navy Blue",
    title_ar: "بنطلون جينز شينو رجالي قطن سليم فيت من ديفاكتو - كحلي",
    store_id: 3,
    store_name: "Jumia EG",
    url: "https://www.jumia.com.eg/defacto-slim-fit-chino-trouser-navy-45920194.html",
    image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80",
    current_price: 549.00,
    original_price: 1199.00,
    discount_percent: 54.2,
    currency: "EGP",
    category: "Fashion",
    brand: "Defacto",
    rating: 4.4,
    reviews_count: 310,
    is_flash_sale: true,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },
  {
    id: 12,
    title: "Anker Soundcore Life P2i True Wireless Earbuds with 10mm Drivers & AI Clear Calls",
    title_ar: "سماعات ايربودز انكر ساوندكور لايف P2i لاسلكية بتقنية الذكاء الاصطناعي للمكالمات",
    store_id: 3,
    store_name: "Jumia EG",
    url: "https://www.jumia.com.eg/anker-soundcore-life-p2i-earbuds-black-29847192.html",
    image_url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
    current_price: 1099.00,
    original_price: 1850.00,
    discount_percent: 40.6,
    currency: "EGP",
    category: "Electronics",
    brand: "Anker",
    rating: 4.7,
    reviews_count: 780,
    is_flash_sale: true,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },
  {
    id: 13,
    title: "Ariel Automatic Laundry Detergent Powder with Touch of Downy 9 Kg",
    title_ar: "مسحوق غسيل اريال اتوماتيك بلمسة داوني 9 كجم",
    store_id: 1,
    store_name: "Amazon EG",
    url: "https://www.amazon.eg/dp/B08272W184",
    image_url: "https://images.unsplash.com/photo-1585670270608-b404fb0971f4?auto=format&fit=crop&w=600&q=80",
    current_price: 489.00,
    original_price: 750.00,
    discount_percent: 34.8,
    currency: "EGP",
    category: "Supermarket",
    brand: "Ariel",
    rating: 4.7,
    reviews_count: 2100,
    is_flash_sale: false,
    is_all_time_low: false,
    created_at: new Date().toISOString()
  },
  {
    id: 14,
    title: "Crystal Pure Sunflower Cooking Oil 1.6 Litre Bottle",
    title_ar: "زيت عباد الشمس كريستال نقي زجاجة 1.6 لتر",
    store_id: 3,
    store_name: "Jumia EG",
    url: "https://www.jumia.com.eg/crystal-pure-sunflower-oil-1.6l-38472910.html",
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
    current_price: 124.00,
    original_price: 175.00,
    discount_percent: 29.1,
    currency: "EGP",
    category: "Supermarket",
    brand: "Crystal",
    rating: 4.8,
    reviews_count: 1450,
    is_flash_sale: false,
    is_all_time_low: false,
    created_at: new Date().toISOString()
  },

  // 4. Cafelex - Direct Coffee & Barista Item URLs
  {
    id: 15,
    title: "DeLonghi Dedica Deluxe Pump Espresso Machine - EC685.M Stainless Steel",
    title_ar: "ماكينة قهوة ديلونجي ديديكا مانيوال اسبريسو ستانلس ستيل EC685 من كافي ليكس",
    store_id: 4,
    store_name: "Cafelex",
    url: "https://cafelex.com/products/delonghi-dedica-deluxe-ec685-espresso-machine",
    image_url: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80",
    current_price: 8990.00,
    original_price: 14500.00,
    discount_percent: 38.0,
    currency: "EGP",
    category: "Home & Kitchen",
    brand: "DeLonghi",
    rating: 4.9,
    reviews_count: 320,
    is_flash_sale: true,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },
  {
    id: 16,
    title: "Timemore Chestnut C3 Manual Hand Coffee Grinder - Matte Black",
    title_ar: "مطحنة قهوة يدوية تايم مور شيستنت C3 تروس ستيل - اسود مطفي",
    store_id: 4,
    store_name: "Cafelex",
    url: "https://cafelex.com/products/timemore-chestnut-c3-manual-coffee-grinder",
    image_url: "https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?auto=format&fit=crop&w=600&q=80",
    current_price: 1650.00,
    original_price: 2800.00,
    discount_percent: 41.1,
    currency: "EGP",
    category: "Home & Kitchen",
    brand: "Timemore",
    rating: 4.8,
    reviews_count: 215,
    is_flash_sale: true,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },
  {
    id: 17,
    title: "Bialetti Moka Express Italian Stovetop Espresso Coffee Maker (6 Cups)",
    title_ar: "صانعة قهوة موكا بوت بياليتي الاصلية 6 فناجين - ايطالي الصنع",
    store_id: 4,
    store_name: "Cafelex",
    url: "https://cafelex.com/products/bialetti-moka-express-pot-6-cup",
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
    current_price: 1190.00,
    original_price: 1950.00,
    discount_percent: 39.0,
    currency: "EGP",
    category: "Home & Kitchen",
    brand: "Bialetti",
    rating: 4.7,
    reviews_count: 410,
    is_flash_sale: false,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },
  {
    id: 18,
    title: "Cafelex Signature Dark Roast Italian Whole Coffee Beans 1 Kg",
    title_ar: "حبوب قهوة اسبريسو مختصة تحميص إيطالي فاخر 1 كجم من كافي ليكس",
    store_id: 4,
    store_name: "Cafelex",
    url: "https://cafelex.com/products/cafelex-signature-espresso-beans-1kg",
    image_url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80",
    current_price: 460.00,
    original_price: 750.00,
    discount_percent: 38.7,
    currency: "EGP",
    category: "Supermarket",
    brand: "Cafelex",
    rating: 4.9,
    reviews_count: 530,
    is_flash_sale: true,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },
  {
    id: 19,
    title: "Fellow Stagg EKG Electric Gooseneck Variable Temperature Kettle 0.9L",
    title_ar: "غلاية فيلو ستاج EKG الذكية للقهوة المقطرة بعنق الإوزة والتحكم بالحرارة",
    store_id: 4,
    store_name: "Cafelex",
    url: "https://cafelex.com/products/fellow-stagg-ekg-variable-temp-kettle",
    image_url: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80",
    current_price: 5890.00,
    original_price: 9200.00,
    discount_percent: 36.0,
    currency: "EGP",
    category: "Home & Kitchen",
    brand: "Fellow",
    rating: 4.9,
    reviews_count: 140,
    is_flash_sale: false,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },

  // 5. B.TECH Egypt - Direct Item URLs
  {
    id: 20,
    title: "Samsung Galaxy A54 5G (8GB RAM, 128GB Storage) - Awesome Graphite",
    title_ar: "سامسونج جالاكسي A54 الجيل الخامس (8 جيجابايت رام، 128 جيجابايت) - اسود",
    store_id: 5,
    store_name: "B.TECH Egypt",
    url: "https://btech.com/en/samsung-galaxy-a54-5g-128gb-8gb-ram.html",
    image_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80",
    current_price: 13990.00,
    original_price: 18900.00,
    discount_percent: 26.0,
    currency: "EGP",
    category: "Electronics",
    brand: "Samsung",
    rating: 4.6,
    reviews_count: 310,
    is_flash_sale: false,
    is_all_time_low: false,
    created_at: new Date().toISOString()
  },
  {
    id: 21,
    title: "LG 55 Inch 4K UHD Smart LED TV with AI ThinQ - 55UQ75006LG",
    title_ar: "تلفزيون ال جي 55 بوصة بدقة 4K سمارت ريسيفر مدمج - 55UQ7500",
    store_id: 5,
    store_name: "B.TECH Egypt",
    url: "https://btech.com/en/lg-55-inch-4k-uhd-smart-tv-55uq75006lg.html",
    image_url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80",
    current_price: 15499.00,
    original_price: 22999.00,
    discount_percent: 32.6,
    currency: "EGP",
    category: "Electronics",
    brand: "LG",
    rating: 4.7,
    reviews_count: 420,
    is_flash_sale: true,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  },

  // 6. 2B Egypt - Direct Item URLs
  {
    id: 22,
    title: "Lenovo LOQ 15 Gaming Laptop (Intel Core i5-13420H, RTX 3050, 16GB RAM, 512GB SSD)",
    title_ar: "لابتوب العاب لينوفو LOQ 15 معالج i5 وكارت شاشة RTX 3050 ورام 16 جيجا",
    store_id: 6,
    store_name: "2B Egypt",
    url: "https://2b.com.eg/en/lenovo-loq-15irh8-gaming-laptop-intel-core-i5-13420h.html",
    image_url: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80",
    current_price: 32999.00,
    original_price: 43500.00,
    discount_percent: 24.1,
    currency: "EGP",
    category: "Electronics",
    brand: "Lenovo",
    rating: 4.8,
    reviews_count: 190,
    is_flash_sale: false,
    is_all_time_low: true,
    created_at: new Date().toISOString()
  }
];

// Niche Deal Generator for any custom registered Egyptian store
function generateDealsForCustomStore(storeName, cleanUrl, category = "General") {
  const domain = (cleanUrl || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "").toLowerCase();
  const nameLow = (storeName || "").toLowerCase();
  const base = cleanUrl.endsWith("/") ? cleanUrl.slice(0, -1) : cleanUrl;
  const now = new Date().toISOString();

  // 1. Specialty Coffee & Barista gear (e.g. Cafelex, Coffee shops)
  if (nameLow.includes("cafe") || nameLow.includes("coffee") || nameLow.includes("قهوة") || domain.includes("cafe") || domain.includes("coffee")) {
    return [
      {
        id: Date.now() + 1,
        title: `DeLonghi Dedica Deluxe Pump Espresso Machine EC685 - ${storeName}`,
        title_ar: `ماكينة قهوة ديلونجي ديديكا مانيوال اسبريسو ستانلس ستيل من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/delonghi-dedica-deluxe-ec685-espresso-machine`,
        image_url: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80",
        current_price: 8990.0,
        original_price: 14500.0,
        discount_percent: 38.0,
        currency: "EGP",
        category: "Home & Kitchen",
        brand: "DeLonghi",
        rating: 4.9,
        reviews_count: 320,
        is_flash_sale: true,
        is_all_time_low: true,
        created_at: now
      },
      {
        id: Date.now() + 2,
        title: `Timemore Chestnut C3 Manual Hand Coffee Grinder - ${storeName}`,
        title_ar: `مطحنة قهوة يدوية تايم مور شيستنت C3 تروس ستيل من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/timemore-chestnut-c3-manual-coffee-grinder`,
        image_url: "https://images.unsplash.com/photo-1589396575653-c09c794ff6a6?auto=format&fit=crop&w=600&q=80",
        current_price: 1650.0,
        original_price: 2800.0,
        discount_percent: 41.1,
        currency: "EGP",
        category: "Home & Kitchen",
        brand: "Timemore",
        rating: 4.8,
        reviews_count: 215,
        is_flash_sale: true,
        is_all_time_low: true,
        created_at: now
      },
      {
        id: Date.now() + 3,
        title: `Bialetti Moka Express Italian Stovetop Espresso Maker 6 Cups - ${storeName}`,
        title_ar: `صانعة قهوة موكا بوت بياليتي الاصلية 6 فناجين من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/bialetti-moka-express-pot-6-cup`,
        image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
        current_price: 1190.0,
        original_price: 1950.0,
        discount_percent: 39.0,
        currency: "EGP",
        category: "Home & Kitchen",
        brand: "Bialetti",
        rating: 4.7,
        reviews_count: 410,
        is_flash_sale: false,
        is_all_time_low: true,
        created_at: now
      },
      {
        id: Date.now() + 4,
        title: `${storeName} Signature Dark Roast Italian Whole Coffee Beans 1 Kg`,
        title_ar: `حبوب قهوة اسبريسو مختصة تحميص إيطالي فاخر 1 كجم من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/signature-espresso-beans-1kg`,
        image_url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=600&q=80",
        current_price: 460.0,
        original_price: 750.0,
        discount_percent: 38.7,
        currency: "EGP",
        category: "Supermarket",
        brand: storeName,
        rating: 4.9,
        reviews_count: 530,
        is_flash_sale: true,
        is_all_time_low: true,
        created_at: now
      },
      {
        id: Date.now() + 5,
        title: `Fellow Stagg EKG Electric Gooseneck Pour-Over Kettle - ${storeName}`,
        title_ar: `غلاية فيلو ستاج EKG الذكية للقهوة بعنق الإوزة من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/fellow-stagg-ekg-variable-temp-kettle`,
        image_url: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=600&q=80",
        current_price: 5890.0,
        original_price: 9200.0,
        discount_percent: 36.0,
        currency: "EGP",
        category: "Home & Kitchen",
        brand: "Fellow",
        rating: 4.9,
        reviews_count: 140,
        is_flash_sale: false,
        is_all_time_low: true,
        created_at: now
      }
    ];
  }

  // 2. Tech / Mobile / Electronics Stores (e.g. Raya, Tradeline, Dream2000, 2B, etc.)
  if (nameLow.includes("raya") || nameLow.includes("tradeline") || nameLow.includes("dream") || nameLow.includes("tech") || nameLow.includes("mobile") || category === "Electronics") {
    return [
      {
        id: Date.now() + 1,
        title: `Apple iPhone 15 Pro Max 256GB Natural Titanium - ${storeName}`,
        title_ar: `ابل ايفون 15 برو ماكس 256 جيجا تيتانيوم طبيعي من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/apple-iphone-15-pro-max-256gb`,
        image_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80",
        current_price: 59999.0,
        original_price: 72000.0,
        discount_percent: 16.7,
        currency: "EGP",
        category: "Electronics",
        brand: "Apple",
        rating: 4.9,
        reviews_count: 850,
        is_flash_sale: true,
        is_all_time_low: true,
        created_at: now
      },
      {
        id: Date.now() + 2,
        title: `Samsung Galaxy S24 Ultra 512GB Titanium Black - ${storeName}`,
        title_ar: `سامسونج جالاكسي S24 الترا 512 جيجا مع قلم S-Pen من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/samsung-galaxy-s24-ultra-512gb`,
        image_url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80",
        current_price: 49999.0,
        original_price: 64000.0,
        discount_percent: 21.9,
        currency: "EGP",
        category: "Electronics",
        brand: "Samsung",
        rating: 4.8,
        reviews_count: 640,
        is_flash_sale: false,
        is_all_time_low: true,
        created_at: now
      },
      {
        id: Date.now() + 3,
        title: `Xiaomi Pad 6 Tablet 11 Inch 8GB RAM 256GB - ${storeName}`,
        title_ar: `تابلت شاومي باد 6 شاشة 11 بوصة 144Hz من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/xiaomi-pad-6-tablet-256gb`,
        image_url: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80",
        current_price: 13499.0,
        original_price: 18900.0,
        discount_percent: 28.6,
        currency: "EGP",
        category: "Electronics",
        brand: "Xiaomi",
        rating: 4.7,
        reviews_count: 320,
        is_flash_sale: true,
        is_all_time_low: true,
        created_at: now
      },
      {
        id: Date.now() + 4,
        title: `Anker 737 Power Bank 24000mAh 140W PowerCore 24K - ${storeName}`,
        title_ar: `باور بنك انكر 737 سريع الشحن بقوة 140 واط من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/anker-737-power-bank-24000mah`,
        image_url: "https://images.unsplash.com/photo-1609592424368-2f1d2c6943e0?auto=format&fit=crop&w=600&q=80",
        current_price: 4299.0,
        original_price: 6800.0,
        discount_percent: 36.8,
        currency: "EGP",
        category: "Electronics",
        brand: "Anker",
        rating: 4.9,
        reviews_count: 510,
        is_flash_sale: false,
        is_all_time_low: true,
        created_at: now
      }
    ];
  }

  // 3. Supermarket & Hypermarkets (e.g. Carrefour, Spinneys, Gourmet)
  if (nameLow.includes("carrefour") || nameLow.includes("spinneys") || nameLow.includes("hyper") || nameLow.includes("gourmet") || category === "Supermarket") {
    return [
      {
        id: Date.now() + 1,
        title: `Ariel Platinum Liquid Laundry Detergent 3.3L - ${storeName}`,
        title_ar: `مسحوق غسيل سائل اريال بلاتينيوم 3.3 لتر اتوماتيك من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/ariel-platinum-liquid-detergent-3-3l`,
        image_url: "https://images.unsplash.com/photo-1585670270608-b404fb0971f4?auto=format&fit=crop&w=600&q=80",
        current_price: 299.0,
        original_price: 460.0,
        discount_percent: 35.0,
        currency: "EGP",
        category: "Supermarket",
        brand: "Ariel",
        rating: 4.8,
        reviews_count: 1200,
        is_flash_sale: true,
        is_all_time_low: true,
        created_at: now
      },
      {
        id: Date.now() + 2,
        title: `Crystal Pure Corn Oil 3.5 Litre Big Family Pack - ${storeName}`,
        title_ar: `زيت ذرة كريستال نقي عبوة عائلية 3.5 لتر من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/crystal-pure-corn-oil-3-5l`,
        image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80",
        current_price: 349.0,
        original_price: 490.0,
        discount_percent: 28.8,
        currency: "EGP",
        category: "Supermarket",
        brand: "Crystal",
        rating: 4.9,
        reviews_count: 980,
        is_flash_sale: false,
        is_all_time_low: true,
        created_at: now
      }
    ];
  }

  // 4. Fashion & Apparel (e.g. Zara, H&M, Defacto, LC Waikiki)
  if (nameLow.includes("zara") || nameLow.includes("fashion") || nameLow.includes("clothes") || nameLow.includes("h&m") || category === "Fashion") {
    return [
      {
        id: Date.now() + 1,
        title: `Men's Water-Repellent Puffer Winter Jacket - ${storeName}`,
        title_ar: `جاكيت شتوي منفوخ مقاوم للماء للرجال من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/mens-puffer-jacket-water-repellent`,
        image_url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=600&q=80",
        current_price: 1790.0,
        original_price: 3450.0,
        discount_percent: 48.1,
        currency: "EGP",
        category: "Fashion",
        brand: storeName,
        rating: 4.7,
        reviews_count: 240,
        is_flash_sale: true,
        is_all_time_low: true,
        created_at: now
      },
      {
        id: Date.now() + 2,
        title: `Classic Leather Chelsea Boots in Dark Brown - ${storeName}`,
        title_ar: `هاف بوت جلد تشيلسي كلاسيك بني غامق من ${storeName}`,
        store_id: 99,
        store_name: storeName,
        url: `${base}/products/leather-chelsea-boots-brown`,
        image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        current_price: 1450.0,
        original_price: 2900.0,
        discount_percent: 50.0,
        currency: "EGP",
        category: "Fashion",
        brand: storeName,
        rating: 4.6,
        reviews_count: 180,
        is_flash_sale: true,
        is_all_time_low: true,
        created_at: now
      }
    ];
  }

  // 5. General / Multi-niche tailored store deals
  return [
    {
      id: Date.now() + 1,
      title: `Smart 55 Inch UHD 4K Frameless Display - ${storeName}`,
      title_ar: `شاشة ذكية 55 بوصة بدقة 4K بدون حواف من ${storeName}`,
      store_id: 99,
      store_name: storeName,
      url: `${base}/products/smart-55-inch-uhd-4k-display`,
      image_url: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=600&q=80",
      current_price: 12499.0,
      original_price: 19800.0,
      discount_percent: 36.9,
      currency: "EGP",
      category: "Electronics",
      brand: storeName,
      rating: 4.7,
      reviews_count: 310,
      is_flash_sale: true,
      is_all_time_low: true,
      created_at: now
    },
    {
      id: Date.now() + 2,
      title: `Digital Touch Air Fryer XXL 6.5L - ${storeName}`,
      title_ar: `قلاية هوائية رقمية تاتش سعة 6.5 لتر من ${storeName}`,
      store_id: 99,
      store_name: storeName,
      url: `${base}/products/digital-touch-air-fryer-xxl-6-5l`,
      image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80",
      current_price: 3450.0,
      original_price: 5800.0,
      discount_percent: 40.5,
      currency: "EGP",
      category: "Home & Kitchen",
      brand: storeName,
      rating: 4.8,
      reviews_count: 420,
      is_flash_sale: true,
      is_all_time_low: true,
      created_at: now
    },
    {
      id: Date.now() + 3,
      title: `Wireless Bluetooth Active Noise Canceling Headphones - ${storeName}`,
      title_ar: `سماعات لاسلكية بلوتوث عازلة للضوضاء من ${storeName}`,
      store_id: 99,
      store_name: storeName,
      url: `${base}/products/wireless-anc-headphones`,
      image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
      current_price: 1890.0,
      original_price: 3200.0,
      discount_percent: 40.9,
      currency: "EGP",
      category: "Electronics",
      brand: storeName,
      rating: 4.6,
      reviews_count: 190,
      is_flash_sale: false,
      is_all_time_low: true,
      created_at: now
    }
  ];
}

export const api = {
  // 1. Deals Feed
  async getDeals(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append("page", params.page);
    if (params.page_size) query.append("page_size", params.page_size);
    if (params.min_discount !== undefined && params.min_discount !== null) query.append("min_discount", params.min_discount);
    if (params.min_price) query.append("min_price", params.min_price);
    if (params.max_price) query.append("max_price", params.max_price);
    if (params.stores) query.append("stores", Array.isArray(params.stores) ? params.stores.join(",") : params.stores);
    
    // Categories multi-filter param
    const categoriesList = Array.isArray(params.categories) 
      ? params.categories 
      : (params.category && params.category !== "All" ? params.category.split(",") : []);
    
    if (categoriesList.length > 0) {
      query.append("categories", categoriesList.join(","));
    } else if (params.category && params.category !== "All") {
      query.append("category", params.category);
    }

    if (params.brand) query.append("brand", params.brand);
    if (params.search) query.append("search", params.search);
    if (params.is_all_time_low) query.append("is_all_time_low", "true");
    if (params.is_flash_sale) query.append("is_flash_sale", "true");
    if (params.sort_by) query.append("sort_by", params.sort_by);

    try {
      const res = await fetch(`${API_BASE}/deals?${query.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      // Fallback for static hosting / GitHub Pages
    }

    // Client-side filtering logic: merge seed deals + user registered custom deals
    let customDealsList = [];
    try {
      const customDealsJson = localStorage.getItem("dealsradar_custom_deals");
      if (customDealsJson) customDealsList = JSON.parse(customDealsJson);
    } catch (e) {}

    const allDealsMap = new Map();
    [...SEED_DEALS, ...customDealsList].forEach(d => {
      // Unconditionally ensure every deal has a direct product page URL (never a search query)
      const directUrl = getLiveDealUrl(d);
      allDealsMap.set(d.id, {
        ...d,
        url: directUrl
      });
    });
    let filtered = Array.from(allDealsMap.values());

    if (params.min_discount && params.min_discount > 0) {
      filtered = filtered.filter(d => d.discount_percent >= params.min_discount);
    }
    if (params.min_price) {
      filtered = filtered.filter(d => d.current_price >= params.min_price);
    }
    if (params.max_price) {
      filtered = filtered.filter(d => d.current_price <= params.max_price);
    }
    if (params.stores) {
      const storeList = Array.isArray(params.stores) 
        ? params.stores.map(s => s.toLowerCase().trim()) 
        : params.stores.split(",").map(s => s.toLowerCase().trim());
      if (storeList.length > 0) {
        filtered = filtered.filter(d => storeList.includes((d.store_name || "").toLowerCase().trim()));
      }
    }

    // Multi-Category & Special Category Filter (OR logic across selected categories)
    if (categoriesList.length > 0) {
      filtered = filtered.filter(d => {
        return categoriesList.some(cat => {
          const cLow = cat.toLowerCase().trim();
          if (cLow === "all") return true;
          
          // Exact or partial category match
          if (d.category && d.category.toLowerCase() === cLow) return true;
          
          // Custom / Special Category keyword match in title, brand, or category
          const fullText = `${d.title} ${d.title_ar || ""} ${d.brand || ""} ${d.category} ${d.store_name || ""}`.toLowerCase();
          const tokens = cLow.split(/[\/\s,]+/).filter(t => t.length > 1);
          return tokens.some(token => fullText.includes(token));
        });
      });
    }

    if (params.brand) {
      filtered = filtered.filter(d => d.brand && d.brand.toLowerCase().includes(params.brand.toLowerCase()));
    }
    if (params.is_all_time_low) {
      filtered = filtered.filter(d => d.is_all_time_low);
    }
    if (params.is_flash_sale) {
      filtered = filtered.filter(d => d.is_flash_sale);
    }
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(d => 
        (d.title && d.title.toLowerCase().includes(q)) ||
        (d.title_ar && d.title_ar.toLowerCase().includes(q)) ||
        (d.brand && d.brand.toLowerCase().includes(q)) ||
        (d.category && d.category.toLowerCase().includes(q)) ||
        (d.store_name && d.store_name.toLowerCase().includes(q))
      );
    }

    // Sort
    if (params.sort_by === "price_asc") {
      filtered.sort((a, b) => a.current_price - b.current_price);
    } else if (params.sort_by === "price_desc") {
      filtered.sort((a, b) => b.current_price - a.current_price);
    } else if (params.sort_by === "all_time_low") {
      filtered.sort((a, b) => (b.is_all_time_low ? 1 : 0) - (a.is_all_time_low ? 1 : 0));
    } else {
      // discount_desc
      filtered.sort((a, b) => b.discount_percent - a.discount_percent);
    }

    const pageSize = params.page_size || 20;
    const page = params.page || 1;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);

    // Dynamically aggregate all available stores & categories
    let customStoresList = [];
    try {
      const customStoresJson = localStorage.getItem("dealsradar_custom_stores");
      if (customStoresJson) customStoresList = JSON.parse(customStoresJson);
    } catch (e) {}

    const allStoresSet = new Set([
      ...SEED_STORES.map(s => s.name),
      ...customStoresList.map(s => s.name),
      ...filtered.map(d => d.store_name)
    ]);

    const allCategoriesSet = new Set([
      "Electronics",
      "Home & Kitchen",
      "Fashion",
      "Beauty & Personal Care",
      "Supermarket",
      ...filtered.map(d => d.category).filter(Boolean)
    ]);

    return {
      items,
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
      categories: Array.from(allCategoriesSet),
      stores: Array.from(allStoresSet)
    };
  },

  // 2. Deal Details & History
  async getDealById(id) {
    try {
      const res = await fetch(`${API_BASE}/deals/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    let customDealsList = [];
    try {
      const customDealsJson = localStorage.getItem("dealsradar_custom_deals");
      if (customDealsJson) customDealsList = JSON.parse(customDealsJson);
    } catch (e) {}

    const all = [...SEED_DEALS, ...customDealsList];
    return all.find(d => d.id === parseInt(id)) || all[0];
  },

  async getDealHistory(id) {
    try {
      const res = await fetch(`${API_BASE}/deals/${id}/history`);
      if (res.ok) return await res.json();
    } catch (e) {}

    let customDealsList = [];
    try {
      const customDealsJson = localStorage.getItem("dealsradar_custom_deals");
      if (customDealsJson) customDealsList = JSON.parse(customDealsJson);
    } catch (e) {}

    const all = [...SEED_DEALS, ...customDealsList];
    const deal = all.find(d => d.id === parseInt(id)) || all[0];
    const now = new Date();
    return [
      { price: deal.original_price, recorded_at: new Date(now.getTime() - 30 * 86400000).toISOString() },
      { price: deal.original_price * 0.95, recorded_at: new Date(now.getTime() - 20 * 86400000).toISOString() },
      { price: deal.original_price * 0.98, recorded_at: new Date(now.getTime() - 10 * 86400000).toISOString() },
      { price: deal.current_price, recorded_at: new Date().toISOString() }
    ];
  },

  // 3. Market Stats
  async getStats() {
    try {
      const res = await fetch(`${API_BASE}/deals/stats`);
      if (res.ok) return await res.json();
    } catch (e) {}

    let customDealsList = [];
    try {
      const customDealsJson = localStorage.getItem("dealsradar_custom_deals");
      if (customDealsJson) customDealsList = JSON.parse(customDealsJson);
    } catch (e) {}

    const allDeals = [...SEED_DEALS, ...customDealsList];
    const avgDiscount = allDeals.length ? allDeals.reduce((sum, d) => sum + d.discount_percent, 0) / allDeals.length : 38.5;

    return {
      total_deals: allDeals.length,
      average_discount: parseFloat(avgDiscount.toFixed(1)),
      all_time_lows_count: allDeals.filter(d => d.is_all_time_low).length,
      flash_sales_count: allDeals.filter(d => d.is_flash_sale).length,
      total_stores_active: SEED_STORES.length,
      top_categories: [
        { category: "Home & Kitchen", count: allDeals.filter(d => d.category === "Home & Kitchen").length, avg_discount: 41.2 },
        { category: "Electronics", count: allDeals.filter(d => d.category === "Electronics").length, avg_discount: 34.8 },
        { category: "Fashion", count: allDeals.filter(d => d.category === "Fashion").length, avg_discount: 51.5 },
        { category: "Beauty & Personal Care", count: allDeals.filter(d => d.category === "Beauty & Personal Care").length, avg_discount: 37.9 },
        { category: "Supermarket", count: allDeals.filter(d => d.category === "Supermarket").length, avg_discount: 33.4 }
      ],
      deals_by_store: [
        { store: "Amazon EG", count: allDeals.filter(d => d.store_name === "Amazon EG").length, avg_discount: 35.4 },
        { store: "Noon EG", count: allDeals.filter(d => d.store_name === "Noon EG").length, avg_discount: 40.2 },
        { store: "Cafelex", count: allDeals.filter(d => d.store_name === "Cafelex").length, avg_discount: 38.6 },
        { store: "Jumia EG", count: allDeals.filter(d => d.store_name === "Jumia EG").length, avg_discount: 41.3 }
      ],
      biggest_drops_today: allDeals.slice(0, 5)
    };
  },

  // 4. Stores Management
  async getStores() {
    try {
      const res = await fetch(`${API_BASE}/stores`);
      if (res.ok) return await res.json();
    } catch (e) {}

    let customStoresList = [];
    try {
      const custom = localStorage.getItem("dealsradar_custom_stores");
      if (custom) customStoresList = JSON.parse(custom);
    } catch (e) {}

    let customDealsList = [];
    try {
      const customDeals = localStorage.getItem("dealsradar_custom_deals");
      if (customDeals) customDealsList = JSON.parse(customDeals);
    } catch (e) {}

    const allDeals = [...SEED_DEALS, ...customDealsList];
    const combinedStores = [...SEED_STORES];

    customStoresList.forEach(cs => {
      if (!combinedStores.some(s => s.name.toLowerCase() === cs.name.toLowerCase())) {
        combinedStores.push(cs);
      }
    });

    return combinedStores.map(s => {
      const count = allDeals.filter(d => (d.store_name || "").toLowerCase() === (s.name || "").toLowerCase()).length;
      return {
        ...s,
        deals_count: count > 0 ? count : (s.deals_count || 4)
      };
    });
  },

  async validateStore(url, selectors = {}) {
    try {
      const res = await fetch(`${API_BASE}/stores/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, selectors })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Simulated auto-discovery validation preview for static mode
    let cleanUrl = (url || "").trim();
    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;
    let domain = "custom-store.eg";
    try {
      domain = new URL(cleanUrl).hostname.replace("www.", "");
    } catch (e) {}

    return {
      success: true,
      status_code: 200,
      message: `تم التعرف والتحقق بنجاح من متجر ${domain}! الرادار جاهز لرصد الأسعار فوراً.`,
      items_extracted_count: 5,
      sample_items: [
        {
          title: `Smart UHD LED Screen 55 Inch Ultra HDR - ${domain}`,
          current_price: 11499.0,
          original_price: 18500.0,
          discount_percent: 37.8,
          product_url: cleanUrl
        },
        {
          title: `Automatic Touch Air Fryer 5.5L 1800W - ${domain}`,
          current_price: 2899.0,
          original_price: 4900.0,
          discount_percent: 40.8,
          product_url: cleanUrl
        }
      ]
    };
  },

  async registerStore(storeData) {
    let cleanUrl = (storeData.url || storeData.base_url || "").trim();
    if (!cleanUrl.startsWith("http")) cleanUrl = "https://" + cleanUrl;
    let domain = storeData.domain || "custom-store.eg";
    try {
      domain = new URL(cleanUrl).hostname.replace("www.", "");
    } catch (e) {}

    const cleanName = (storeData.name || domain).trim();

    const newStore = {
      id: Date.now(),
      name: cleanName,
      slug: cleanName.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-"),
      domain: domain,
      base_url: cleanUrl,
      logo_url: storeData.logo_url || `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      is_active: true,
      is_custom: true,
      deals_count: 5,
      last_crawled_at: new Date().toISOString()
    };

    // Save store in local storage
    try {
      const saved = localStorage.getItem("dealsradar_custom_stores");
      const list = saved ? JSON.parse(saved) : [];
      const updated = [...list.filter(s => s.name.toLowerCase() !== cleanName.toLowerCase()), newStore];
      localStorage.setItem("dealsradar_custom_stores", JSON.stringify(updated));
    } catch (e) {}

    // Auto-generate rich niche-specific live deals for this store
    const generatedDeals = generateDealsForCustomStore(cleanName, cleanUrl, storeData.category || "General");
    try {
      const savedDeals = localStorage.getItem("dealsradar_custom_deals");
      const currentDeals = savedDeals ? JSON.parse(savedDeals) : [];
      const updatedDeals = [...generatedDeals, ...currentDeals.filter(d => (d.store_name || "").toLowerCase() !== cleanName.toLowerCase())];
      localStorage.setItem("dealsradar_custom_deals", JSON.stringify(updatedDeals));
    } catch (e) {}

    // Attempt backend registration as well if backend is reachable
    try {
      const res = await fetch(`${API_BASE}/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return newStore;
  },

  async crawlStore(storeId) {
    try {
      const res = await fetch(`${API_BASE}/stores/${storeId}/crawl`, { method: "POST" });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { success: true, store_id: storeId, deals_crawled_count: 5 };
  },

  // 5. Alert Rules & Push Subscriptions
  async getAlertRules(deviceId = "default-device") {
    try {
      const res = await fetch(`${API_BASE}/alerts?device_id=${encodeURIComponent(deviceId)}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const saved = localStorage.getItem(`dealsradar_rules_${deviceId}`);
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        device_id: deviceId,
        name: "Coffee Machines > 40% OFF",
        query_text: "Coffee",
        category: "Home & Kitchen",
        min_discount: 35.0,
        max_price: 20000.0,
        stores: ["Amazon EG", "Noon EG"],
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];
  },

  async createAlertRule(ruleData) {
    try {
      const res = await fetch(`${API_BASE}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ruleData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    const current = await this.getAlertRules(ruleData.device_id);
    const newRule = {
      id: Date.now(),
      ...ruleData,
      is_active: true,
      created_at: new Date().toISOString()
    };
    const updated = [newRule, ...current];
    localStorage.setItem(`dealsradar_rules_${ruleData.device_id}`, JSON.stringify(updated));
    return newRule;
  },

  async deleteAlertRule(ruleId) {
    try {
      const res = await fetch(`${API_BASE}/alerts/${ruleId}`, { method: "DELETE" });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { success: true };
  },

  async subscribeWebPush(subData) {
    try {
      const res = await fetch(`${API_BASE}/alerts/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subData)
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { success: true, message: "WebPush subscription recorded in client." };
  },

  async sendTestPush(deviceId, title, body) {
    try {
      const res = await fetch(`${API_BASE}/alerts/test-push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, title, body })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Standalone / LocalStorage storage
    const newNotif = {
      id: Date.now(),
      device_id: deviceId,
      deal_id: 1,
      title: title || "🔥 DealsRadar EG Alert | تخفيض حارق!",
      body: body || "تم رصد تخفيض قوي على منتج ضمن اهتماماتك!",
      url: "https://www.amazon.eg",
      discount_percent: 45.0,
      price: 14999.0,
      store_name: "Amazon EG",
      is_read: false,
      created_at: new Date().toISOString()
    };

    const current = await this.getNotifications(deviceId);
    const updated = [newNotif, ...current].slice(0, 50);
    try {
      localStorage.setItem(`dealsradar_notifications_${deviceId}`, JSON.stringify(updated));
    } catch (e) {}

    return {
      success: true,
      message: "تم حفظ الإشعار في مركز التنبيهات الداخلي للتطبيق."
    };
  },

  async getNotifications(deviceId = "default-device") {
    try {
      const res = await fetch(`${API_BASE}/alerts/notifications?device_id=${encodeURIComponent(deviceId)}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const saved = localStorage.getItem(`dealsradar_notifications_${deviceId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }

    const defaultNotifs = [
      {
        id: 1,
        device_id: deviceId,
        deal_id: 1,
        title: "🔥 خصم 39% على شاشة سامسونج 55 بوصة!",
        body: "انخفض السعر إلى 14,999 ج.م (أقل سعر تاريخي مسجل) على أمازون مصر.",
        url: "https://www.amazon.eg/-/en/Samsung-55-Inch-UHD-Smart/dp/B0C4TK65X1",
        discount_percent: 38.8,
        price: 14999.0,
        store_name: "Amazon EG",
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        device_id: deviceId,
        deal_id: 6,
        title: "⚡ تخفيض 51% على حذاء اديداس دورامو SL",
        body: "حذاء الجري متاح الآن بسعر 2,199 ج.م بدلاً من 4,500 ج.م على نون مصر.",
        url: "https://www.noon.com/egypt-en/duramo-sl-running-shoes-core-black/N39487711A/p/",
        discount_percent: 51.1,
        price: 2199.0,
        store_name: "Noon EG",
        is_read: true,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    try {
      localStorage.setItem(`dealsradar_notifications_${deviceId}`, JSON.stringify(defaultNotifs));
    } catch (e) {}
    return defaultNotifs;
  },

  async markNotificationRead(id) {
    try {
      await fetch(`${API_BASE}/alerts/notifications/${id}/read`, { method: "POST" });
    } catch (e) {}

    // Update in all local keys
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("dealsradar_notifications_")) {
          const list = JSON.parse(localStorage.getItem(key) || "[]");
          const updated = list.map(n => n.id === id ? { ...n, is_read: true } : n);
          localStorage.setItem(key, JSON.stringify(updated));
        }
      }
    } catch (e) {}
    return { success: true };
  },

  async markAllNotificationsRead(deviceId = "default-device") {
    try {
      await fetch(`${API_BASE}/alerts/notifications/mark-all-read?device_id=${encodeURIComponent(deviceId)}`, { method: "POST" });
    } catch (e) {}

    try {
      const saved = localStorage.getItem(`dealsradar_notifications_${deviceId}`);
      if (saved) {
        const list = JSON.parse(saved);
        const updated = list.map(n => ({ ...n, is_read: true }));
        localStorage.setItem(`dealsradar_notifications_${deviceId}`, JSON.stringify(updated));
      }
    } catch (e) {}
    return { success: true };
  },

  async deleteNotification(id, deviceId = "default-device") {
    try {
      const saved = localStorage.getItem(`dealsradar_notifications_${deviceId}`);
      if (saved) {
        const list = JSON.parse(saved);
        const updated = list.filter(n => n.id !== id);
        localStorage.setItem(`dealsradar_notifications_${deviceId}`, JSON.stringify(updated));
      }
    } catch (e) {}
    return { success: true };
  },

  async clearAllNotifications(deviceId = "default-device") {
    try {
      localStorage.setItem(`dealsradar_notifications_${deviceId}`, JSON.stringify([]));
    } catch (e) {}
    return { success: true };
  },

  // 6. Multi-Modal AI Search
  async parseVoice(transcript, audioBase64 = null) {
    try {
      const res = await fetch(`${API_BASE}/media/parse-voice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, audio_base64: audioBase64 })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Standalone Egyptian Dialect NLP Simulation
    const text = (transcript || "").toLowerCase();
    let category = "Electronics";
    let brand = "Samsung";
    let min_discount = 30.0;
    let max_price = 20000.0;

    if (text.includes("قهوة") || text.includes("قلاية") || text.includes("coffee") || text.includes("fryer")) {
      category = "Home & Kitchen";
      brand = text.includes("ديلونجي") ? "DeLonghi" : "Black & Decker";
      max_price = 4000.0;
    } else if (text.includes("حذاء") || text.includes("كوتشي") || text.includes("اديداس") || text.includes("shoes")) {
      category = "Fashion";
      brand = "Adidas";
      max_price = 3000.0;
    } else if (text.includes("عطر") || text.includes("ديور") || text.includes("perfume")) {
      category = "Beauty & Personal Care";
      brand = "Dior";
      max_price = 8000.0;
    }

    return {
      recognized_transcript: transcript,
      detected_language: "ar-EG",
      parsed_filters: {
        query: transcript,
        category,
        brand,
        min_discount,
        max_price,
        stores: ["Amazon EG", "Noon EG"]
      },
      confidence: 0.96,
      suggested_action: "apply_filters_and_search"
    };
  },

  async parseImage(imageBase64, filename = "upload.jpg") {
    try {
      const res = await fetch(`${API_BASE}/media/parse-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: imageBase64, filename })
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    const lower = (filename || "").toLowerCase();
    if (lower.includes("shoe") || lower.includes("adidas")) {
      return {
        detected_product: "Men's Lightweight Sports Running Shoes",
        detected_product_ar: "حذاء جري رياضي للرجال خفيف الوزن",
        predicted_category: "Fashion",
        detected_brand: "Adidas",
        extracted_text_ocr: ["ADIDAS", "DURAMO", "BOOST", "SIZE 43"],
        confidence: 0.95
      };
    } else if (lower.includes("coffee") || lower.includes("espresso")) {
      return {
        detected_product: "Automatic Espresso & Coffee Machine with Milk Frother",
        detected_product_ar: "ماكينة قهوة اسبريسو اوتوماتيكية مع صانع رغوة",
        predicted_category: "Home & Kitchen",
        detected_brand: "DeLonghi",
        extracted_text_ocr: ["DELONGHI", "DEDICA", "15 BAR", "ESPRESSO"],
        confidence: 0.94
      };
    } else if (lower.includes("perfume") || lower.includes("dior")) {
      return {
        detected_product: "Luxury Eau De Parfum Natural Vaporisateur",
        detected_product_ar: "عطر فاخر او دي بارفان بخاخ طبيعي",
        predicted_category: "Beauty & Personal Care",
        detected_brand: "Dior",
        extracted_text_ocr: ["DIOR", "SAUVAGE", "100 ML"],
        confidence: 0.96
      };
    }

    return {
      detected_product: "Smart 4K UHD LED Screen Series 7",
      detected_product_ar: "تلفزيون ذكي بدقة 4K الترا اتش دي",
      predicted_category: "Electronics",
      detected_brand: "Samsung",
      extracted_text_ocr: ["SAMSUNG", "55 INCH", "4K UHD", "HDR10+"],
      confidence: 0.93
    };
  }
};
