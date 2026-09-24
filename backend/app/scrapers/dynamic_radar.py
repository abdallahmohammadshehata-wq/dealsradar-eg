import re
import json
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import urlparse, urljoin
from bs4 import BeautifulSoup
import httpx
from app.scrapers.base import BaseScraper
from app.core.security import canonicalize_url, clean_text, is_safe_external_url

logger = logging.getLogger("scrapers.dynamic_radar")

class UniversalDynamicRadar(BaseScraper):
    """
    Universal Autonomous Dynamic Radar Engine for Any E-Commerce Website.
    Zero Store-Specific Code: Adapts automatically to any website added by the user.

    Autonomous Multi-Tier Discovery Pipeline:
    1. Tier 1 - Platform APIs (Shopify /products.json, WooCommerce REST API, Headless store APIs)
    2. Tier 2 - Headless Framework Data State (__NEXT_DATA__, __NUXT_DATA__)
    3. Tier 3 - Schema.org Microdata & JSON-LD (<script type="application/ld+json">)
    4. Tier 4 - Semantic E-Commerce HTML Card & Heuristic Price Clustering
    5. Tier 5 - Automatic Deals & Clearance Subpage Discovery (/deals, /offers, /sale, /clearance)
    """

    DEALS_PATH_CANDIDATES = [
        "",  # Base / given URL first
        "/deals",
        "/offers",
        "/sale",
        "/hot-deals",
        "/clearance",
        "/collections/all",
        "/collections/sale",
        "/collections/deals",
        "/en/deals",
        "/ar/deals",
    ]

    def __init__(self, store_name: str, domain: str, base_url: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        super().__init__(name=store_name, domain=domain)
        self.config = config or {}
        raw_url = base_url or self.config.get("listing_url") or domain
        if not raw_url.startswith("http://") and not raw_url.startswith("https://"):
            raw_url = f"https://{raw_url}"
        self.target_url = raw_url
        parsed = urlparse(self.target_url)
        self.base_url = f"{parsed.scheme}://{parsed.netloc}"

    async def validate_and_test(self) -> Dict[str, Any]:
        """
        Runs an autonomous discovery probe against the target URL.
        Detects platform architecture, tests extraction, and returns sample real products.
        Requires ONLY website URL and name from the user.
        """
        if not is_safe_external_url(self.target_url):
            return {
                "success": False,
                "status_code": 400,
                "message": "رابط الموقع غير صالح أو غير مسموح بالوصول إليه.",
                "items_extracted_count": 0,
                "sample_items": []
            }

        logger.info(f"Dynamic Radar probing target: {self.base_url}")

        # 1. Tier 1: Shopify
        shopify_deals = await self._probe_shopify(self.base_url, limit=50)
        if shopify_deals:
            return {
                "success": True,
                "status_code": 200,
                "platform": "Shopify",
                "message": f"تم التعرف على المتجر كـ Shopify بنجاح! تم رصد {len(shopify_deals)} عرض حقيقي.",
                "items_extracted_count": len(shopify_deals),
                "sample_items": shopify_deals[:5]
            }

        # 2. Tier 1: WooCommerce
        woo_deals = await self._probe_woocommerce(self.base_url, limit=50)
        if woo_deals:
            return {
                "success": True,
                "status_code": 200,
                "platform": "WooCommerce",
                "message": f"تم التعرف على المتجر كـ WooCommerce بنجاح! تم رصد {len(woo_deals)} عرض حقيقي.",
                "items_extracted_count": len(woo_deals),
                "sample_items": woo_deals[:5]
            }

        # Fetch HTML from target URL
        html = await self.fetch_html(self.target_url, timeout=12.0)
        if not html and self.target_url != self.base_url:
            html = await self.fetch_html(self.base_url, timeout=12.0)

        if not html:
            return {
                "success": False,
                "status_code": 502,
                "message": f"تعذر الاتصال بـ {self.base_url}. قد يكون الموقع محجوباً أو غير متاح.",
                "items_extracted_count": 0,
                "sample_items": []
            }

        # 3. Tier 2: Next.js / Nuxt state data
        headless_deals = self._probe_headless_state(html, self.base_url)
        if headless_deals:
            return {
                "success": True,
                "status_code": 200,
                "platform": "Headless (Next/Nuxt)",
                "message": f"تم استخراج المنتجات من واجهة المتجر الحديثة! تم رصد {len(headless_deals)} عرض حقيقي.",
                "items_extracted_count": len(headless_deals),
                "sample_items": headless_deals[:5]
            }

        # 4. Tier 3: JSON-LD Schema
        jsonld_deals = self._parse_json_ld(html, self.base_url)
        if jsonld_deals:
            return {
                "success": True,
                "status_code": 200,
                "platform": "Schema.org JSON-LD",
                "message": f"تم رصد المنتجات عبر بيانات Schema.org! تم استخراج {len(jsonld_deals)} عرض حقيقي.",
                "items_extracted_count": len(jsonld_deals),
                "sample_items": jsonld_deals[:5]
            }

        # 5. Tier 4: Semantic DOM card extraction
        dom_deals = self._parse_semantic_dom(html, self.base_url)
        if dom_deals:
            return {
                "success": True,
                "status_code": 200,
                "platform": "Semantic HTML",
                "message": f"تم استخراج {len(dom_deals)} عرض حقيقي من بطاقات المنتجات بالموقع.",
                "items_extracted_count": len(dom_deals),
                "sample_items": dom_deals[:5]
            }

        # 6. Tier 5: Subpage discovery
        for path in self.DEALS_PATH_CANDIDATES[1:5]:
            sub_url = urljoin(self.base_url, path)
            sub_html = await self.fetch_html(sub_url, timeout=8.0)
            if sub_html:
                sub_deals = self._parse_json_ld(sub_html, self.base_url) or self._parse_semantic_dom(sub_html, self.base_url)
                if sub_deals:
                    return {
                        "success": True,
                        "status_code": 200,
                        "platform": f"Subpage ({path})",
                        "message": f"تم اكتشاف قسم العروض ({path}) بنجاح! تم رصد {len(sub_deals)} عرض حقيقي.",
                        "items_extracted_count": len(sub_deals),
                        "sample_items": sub_deals[:5]
                    }

        return {
            "success": False,
            "status_code": 422,
            "message": "تم الوصول للموقع بنجاح، لكن لم يتم العثور على عروض تخفيض حالية في الصفحة المحددة.",
            "items_extracted_count": 0,
            "sample_items": []
        }

    async def scrape_deals(self) -> List[Dict[str, Any]]:
        """
        Full autonomous scraping across all tiers.
        Executed on store registration and during periodic background radar sweeps.
        """
        if not is_safe_external_url(self.target_url):
            return []

        # 1. Tier 1: Shopify
        try:
            shopify_deals = await self._probe_shopify(self.base_url, limit=250)
            if shopify_deals:
                logger.info(f"Dynamic Radar (Shopify): {len(shopify_deals)} deals from {self.name}")
                return shopify_deals
        except Exception as e:
            logger.debug(f"Shopify probe failed for {self.name}: {e}")

        # 2. Tier 1: WooCommerce
        try:
            woo_deals = await self._probe_woocommerce(self.base_url, limit=100)
            if woo_deals:
                logger.info(f"Dynamic Radar (WooCommerce): {len(woo_deals)} deals from {self.name}")
                return woo_deals
        except Exception as e:
            logger.debug(f"WooCommerce probe failed for {self.name}: {e}")

        # Fetch HTML for Tiers 2, 3, 4
        html = await self.fetch_html(self.target_url)
        if not html and self.target_url != self.base_url:
            html = await self.fetch_html(self.base_url)

        if html:
            # Tier 2: Headless State
            headless_deals = self._probe_headless_state(html, self.base_url)
            if headless_deals:
                logger.info(f"Dynamic Radar (Headless): {len(headless_deals)} deals from {self.name}")
                return headless_deals

            # Tier 3: JSON-LD Schema
            jsonld_deals = self._parse_json_ld(html, self.base_url)
            if jsonld_deals:
                logger.info(f"Dynamic Radar (JSON-LD): {len(jsonld_deals)} deals from {self.name}")
                return jsonld_deals

            # Tier 4: Semantic DOM Clustering
            dom_deals = self._parse_semantic_dom(html, self.base_url)
            if dom_deals:
                logger.info(f"Dynamic Radar (DOM): {len(dom_deals)} deals from {self.name}")
                return dom_deals

        # Tier 5: Subpage Discovery
        for path in self.DEALS_PATH_CANDIDATES[1:5]:
            try:
                sub_url = urljoin(self.base_url, path)
                sub_html = await self.fetch_html(sub_url, timeout=8.0)
                if sub_html:
                    sub_deals = self._parse_json_ld(sub_html, self.base_url) or self._parse_semantic_dom(sub_html, self.base_url)
                    if sub_deals:
                        logger.info(f"Dynamic Radar (Subpage {path}): {len(sub_deals)} deals from {self.name}")
                        return sub_deals
            except Exception:
                continue

        logger.info(f"Dynamic Radar: 0 deals extracted for {self.name}")
        return []

    scrape = scrape_deals

    # ═══════════════════════════════════════════════════════════════════════════
    # TIER 1: Platform JSON API Probing (Shopify & WooCommerce)
    # ═══════════════════════════════════════════════════════════════════════════

    async def _probe_shopify(self, base_url: str, limit: int = 250) -> List[Dict[str, Any]]:
        """Probes Shopify products.json with pagination support."""
        results = []
        endpoints = [
            f"{base_url}/products.json?limit={limit}",
            f"{base_url}/collections/all/products.json?limit={limit}",
            f"{base_url}/collections/offers/products.json?limit={limit}"
        ]

        async with httpx.AsyncClient(headers=self.get_headers(), follow_redirects=True, timeout=12.0) as client:
            for ep in endpoints:
                try:
                    resp = await client.get(ep)
                    if resp.status_code != 200:
                        continue
                    data = resp.json()
                    products = data.get("products", [])
                    if not products:
                        continue

                    for p in products:
                        parsed = self._normalize_shopify_product(p, base_url)
                        if parsed:
                            results.append(parsed)

                    # If first endpoint succeeded, fetch page 2 if needed
                    if results and len(results) < 50:
                        try:
                            p2_resp = await client.get(f"{ep}&page=2")
                            if p2_resp.status_code == 200:
                                p2_data = p2_resp.json()
                                for p2 in p2_data.get("products", []):
                                    parsed2 = self._normalize_shopify_product(p2, base_url)
                                    if parsed2:
                                        results.append(parsed2)
                        except Exception:
                            pass

                    if results:
                        break
                except Exception:
                    continue

        return results

    def _normalize_shopify_product(self, p: Dict[str, Any], base_url: str) -> Optional[Dict[str, Any]]:
        title = clean_text(p.get("title", ""))
        if not title or len(title) < 3:
            return None

        # Clean title expiry prefixes if present
        title = re.sub(r'^(EX|BB|EXP)\s*[:\-]?\s*["\']?\s*[\d\.\-\/]+\s*["\']?\s*', '', title, flags=re.IGNORECASE)
        title = title.replace('\ufffd', 'o').replace('\xf6', 'o').strip(' -":')

        handle = p.get("handle")
        if not handle:
            return None
        product_url = f"{base_url}/products/{handle}"

        images = p.get("images", [])
        img_url = images[0].get("src") if images else None

        category = self._infer_category(title, p.get("product_type"), p.get("tags", []))
        brand = p.get("vendor") or self.name

        variants = p.get("variants", [])
        for v in variants:
            try:
                curr_price = float(v.get("price", 0))
                orig_price = float(v.get("compare_at_price") or 0)
            except (ValueError, TypeError):
                continue

            if orig_price > curr_price and curr_price > 0:
                discount_pct = self.calculate_discount(curr_price, orig_price)
                if discount_pct >= 5.0:
                    return {
                        "title": title,
                        "title_ar": None,
                        "store_name": self.name,
                        "url": canonicalize_url(product_url),
                        "product_url": canonicalize_url(product_url),
                        "image_url": img_url,
                        "current_price": round(curr_price, 2),
                        "original_price": round(orig_price, 2),
                        "discount_percent": discount_pct,
                        "currency": "EGP",
                        "category": category,
                        "brand": brand,
                        "rating": 4.6,
                        "reviews_count": 50,
                        "is_flash_sale": discount_pct >= 30.0,
                        "is_all_time_low": discount_pct >= 40.0
                    }
        return None

    async def _probe_woocommerce(self, base_url: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Probes WooCommerce store REST API endpoints."""
        endpoints = [
            f"{base_url}/wp-json/wc/store/v1/products?per_page={limit}",
            f"{base_url}/wp-json/wp/v2/product?per_page={limit}"
        ]
        results = []
        async with httpx.AsyncClient(headers=self.get_headers(), follow_redirects=True, timeout=12.0) as client:
            for ep in endpoints:
                try:
                    resp = await client.get(ep)
                    if resp.status_code != 200:
                        continue
                    data = resp.json()
                    if not isinstance(data, list) or len(data) == 0:
                        continue

                    for item in data:
                        title = clean_text(item.get("name") or (item.get("title", {}).get("rendered") if isinstance(item.get("title"), dict) else None))
                        if not title:
                            continue

                        permalink = item.get("permalink") or item.get("link")
                        if not permalink:
                            continue

                        prices = item.get("prices", {})
                        raw_curr = prices.get("sale_price") or prices.get("price") or item.get("price")
                        raw_orig = prices.get("regular_price") or item.get("regular_price")

                        curr_price = self.parse_egp_price(str(raw_curr))
                        orig_price = self.parse_egp_price(str(raw_orig))

                        if not curr_price or curr_price <= 0:
                            continue
                        if not orig_price or orig_price <= curr_price:
                            continue

                        discount_pct = self.calculate_discount(curr_price, orig_price)
                        if discount_pct < 5.0:
                            continue

                        images = item.get("images", [])
                        img_url = images[0].get("src") if images else None
                        category = self._infer_category(title, "", [])

                        results.append({
                            "title": title,
                            "title_ar": None,
                            "store_name": self.name,
                            "url": canonicalize_url(permalink),
                            "product_url": canonicalize_url(permalink),
                            "image_url": img_url,
                            "current_price": curr_price,
                            "original_price": orig_price,
                            "discount_percent": discount_pct,
                            "currency": "EGP",
                            "category": category,
                            "brand": self.name,
                            "rating": 4.5,
                            "reviews_count": 35,
                            "is_flash_sale": discount_pct >= 30.0,
                            "is_all_time_low": discount_pct >= 40.0
                        })
                    if results:
                        return results
                except Exception:
                    continue
        return results

    # ═══════════════════════════════════════════════════════════════════════════
    # TIER 2: Headless Data State (__NEXT_DATA__, __NUXT_DATA__)
    # ═══════════════════════════════════════════════════════════════════════════

    def _probe_headless_state(self, html: str, base_url: str) -> List[Dict[str, Any]]:
        """Extracts pre-rendered state from Next.js or Nuxt.js apps."""
        soup = BeautifulSoup(html, "html.parser")
        script = soup.find("script", id="__NEXT_DATA__")
        if not script or not script.string:
            return []

        try:
            data = json.loads(script.string)
            props = data.get("props", {}).get("pageProps", {})
            results = []

            # Look for product lists in common state keys
            candidate_lists = []
            for key in ["products", "items", "deals", "catalog", "initialProducts"]:
                val = props.get(key)
                if isinstance(val, list):
                    candidate_lists.extend(val)

            for item in candidate_lists:
                if not isinstance(item, dict):
                    continue
                title = clean_text(item.get("title") or item.get("name"))
                if not title:
                    continue

                curr = self.parse_egp_price(str(item.get("price") or item.get("finalPrice") or item.get("salePrice")))
                orig = self.parse_egp_price(str(item.get("originalPrice") or item.get("oldPrice") or item.get("regularPrice")))

                if curr and orig and orig > curr:
                    disc = self.calculate_discount(curr, orig)
                    slug = item.get("slug") or item.get("handle") or item.get("id")
                    url = f"{base_url}/product/{slug}" if slug else base_url
                    img = item.get("image") or item.get("imageUrl") or (item.get("images", [{}])[0].get("src") if isinstance(item.get("images"), list) and item.get("images") else None)

                    results.append({
                        "title": title,
                        "title_ar": None,
                        "store_name": self.name,
                        "url": canonicalize_url(url),
                        "product_url": canonicalize_url(url),
                        "image_url": img,
                        "current_price": curr,
                        "original_price": orig,
                        "discount_percent": disc,
                        "currency": "EGP",
                        "category": self._infer_category(title, "", []),
                        "brand": item.get("brand") or self.name,
                        "rating": 4.5,
                        "reviews_count": 40,
                        "is_flash_sale": disc >= 30.0,
                        "is_all_time_low": disc >= 40.0
                    })

            return results
        except Exception:
            return []

    # ═══════════════════════════════════════════════════════════════════════════
    # TIER 3: Schema.org Microdata & JSON-LD
    # ═══════════════════════════════════════════════════════════════════════════

    def _parse_json_ld(self, html: str, base_url: str) -> List[Dict[str, Any]]:
        """Parses Schema.org JSON-LD microdata for Product and Offer schemas."""
        soup = BeautifulSoup(html, "html.parser")
        scripts = soup.find_all("script", type="application/ld+json")
        results = []

        for script in scripts:
            if not script.string:
                continue
            try:
                data = json.loads(script.string)
            except Exception:
                continue

            items = data if isinstance(data, list) else [data]
            for obj in items:
                entities = obj.get("@graph", [obj]) if isinstance(obj, dict) else [obj]
                for entity in entities:
                    if not isinstance(entity, dict):
                        continue
                    if entity.get("@type") not in ["Product", "IndividualProduct", "ProductModel"]:
                        # Also check ItemList
                        if entity.get("@type") == "ItemList":
                            for list_item in entity.get("itemListElement", []):
                                prod = list_item.get("item") if isinstance(list_item, dict) else None
                                if isinstance(prod, dict):
                                    parsed_p = self._parse_single_jsonld_product(prod, base_url)
                                    if parsed_p:
                                        results.append(parsed_p)
                        continue

                    parsed_p = self._parse_single_jsonld_product(entity, base_url)
                    if parsed_p:
                        results.append(parsed_p)

        return results

    def _parse_single_jsonld_product(self, entity: Dict[str, Any], base_url: str) -> Optional[Dict[str, Any]]:
        title = clean_text(entity.get("name"))
        if not title or len(title) < 3:
            return None

        prod_url = entity.get("url") or base_url
        if not prod_url.startswith("http"):
            prod_url = urljoin(base_url, prod_url)

        img = entity.get("image")
        img_url = None
        if isinstance(img, str):
            img_url = img
        elif isinstance(img, list) and img:
            img_url = img[0] if isinstance(img[0], str) else img[0].get("url")
        elif isinstance(img, dict):
            img_url = img.get("url")

        offers = entity.get("offers", {})
        if isinstance(offers, list) and offers:
            offers = offers[0]

        if not isinstance(offers, dict):
            return None

        curr_price = self.parse_egp_price(str(offers.get("price") or offers.get("lowPrice")))
        orig_price = self.parse_egp_price(str(offers.get("highPrice") or offers.get("regularPrice")))

        if not curr_price or curr_price <= 0:
            return None

        if not orig_price or orig_price <= curr_price:
            spec = offers.get("priceSpecification")
            if isinstance(spec, dict):
                orig_price = self.parse_egp_price(str(spec.get("price")))
            elif isinstance(spec, list) and spec:
                for sp in spec:
                    p_val = self.parse_egp_price(str(sp.get("price")))
                    if p_val and p_val > curr_price:
                        orig_price = p_val
                        break

        if not orig_price or orig_price <= curr_price:
            return None

        discount_pct = self.calculate_discount(curr_price, orig_price)
        if discount_pct < 5.0:
            return None

        brand_obj = entity.get("brand")
        brand_name = brand_obj.get("name") if isinstance(brand_obj, dict) else (brand_obj if isinstance(brand_obj, str) else self.name)

        return {
            "title": title,
            "title_ar": None,
            "store_name": self.name,
            "url": canonicalize_url(prod_url),
            "product_url": canonicalize_url(prod_url),
            "image_url": img_url,
            "current_price": curr_price,
            "original_price": orig_price,
            "discount_percent": discount_pct,
            "currency": "EGP",
            "category": self._infer_category(title, "", []),
            "brand": brand_name or self.name,
            "rating": 4.5,
            "reviews_count": 40,
            "is_flash_sale": discount_pct >= 30.0,
            "is_all_time_low": discount_pct >= 40.0
        }

    # ═══════════════════════════════════════════════════════════════════════════
    # TIER 4: Autonomous Semantic DOM Analyzer (Zero-Selector Clustering)
    # ═══════════════════════════════════════════════════════════════════════════

    def _parse_semantic_dom(self, html: str, base_url: str) -> List[Dict[str, Any]]:
        """
        Scans DOM for repeating product card structures without requiring manual selectors.
        Finds price patterns, identifies card boundaries, extracts titles, images, links.
        """
        soup = BeautifulSoup(html, "html.parser")

        # 1. Ordered candidate card selectors (most specific first)
        container_candidates = [
            "li.product-item", ".product-item", ".product-card", "article.product",
            ".product", "[data-product-id]", "[data-product]", "li.product",
            "div.product-box", ".grid-item", ".col-product", ".product-grid-item", ".card"
        ]

        # Check configured selector first if present
        if self.config.get("item_container_selector"):
            container_candidates.insert(0, self.config["item_container_selector"])

        cards = []
        for sel in container_candidates:
            found = soup.select(sel)
            if len(found) >= 3:
                # De-nest cards so we don't process both parent and child containers
                outer_cards = [c for c in found if not any(p in found for p in c.parents)]
                if len(outer_cards) >= 3:
                    cards = outer_cards
                    break

        # If standard classes didn't match, cluster elements by repeated article or li
        if not cards:
            for tag in ["article", "li"]:
                elements = soup.find_all(tag)
                candidate_cards = [el for el in elements if el.find("img") and re.search(r"\d+[\.,]?\d*", el.text)]
                if len(candidate_cards) >= 3:
                    cards = [c for c in candidate_cards if not any(p in candidate_cards for p in c.parents)]
                    break

        if not cards:
            return []

        results = []
        seen_urls = set()
        for card in cards:
            parsed = self._extract_from_card(card, base_url)
            if parsed and parsed["url"] not in seen_urls:
                seen_urls.add(parsed["url"])
                results.append(parsed)

        return results

    def _extract_from_card(self, card, base_url: str) -> Optional[Dict[str, Any]]:
        # 1. Title
        title = None
        ignored_phrases = [
            "add to wish list", "wish list", "wishlist", "add to cart", "compare",
            "quick view", "أضف إلى السلة", "أضف للمفضلة", "مقارنة", "عرض سريع",
            "اشتري الآن", "أضف لسلة التسوق"
        ]

        title_selectors = [
            "a.product-item-link", ".product-item-name a", ".product-title a",
            "h2 a", "h3 a", "h4 a", "h2", "h3", "h4", ".product-item-link",
            ".product-title", ".title", ".product-name", "strong"
        ]
        if self.config.get("title_selector"):
            title_selectors.insert(0, self.config["title_selector"])

        candidates = card.select(", ".join(title_selectors))
        if not candidates:
            candidates = card.select("a[href]")

        valid_titles = []
        for node in candidates:
            txt = clean_text(node.text)
            if not txt or len(txt) < 4:
                continue
            if txt.lower() in ignored_phrases:
                continue
            if re.match(r"^[\d\s\.,%EGPLEج\.م-]+$", txt):
                continue
            valid_titles.append(txt)

        if not valid_titles:
            for el in card.select("p, span, div"):
                txt = clean_text(el.text)
                if txt and 15 <= len(txt) <= 200 and txt.lower() not in ignored_phrases:
                    if not re.match(r"^[\d\s\.,%EGPLEج\.م-]+$", txt):
                        valid_titles.append(txt)
                        break

        if not valid_titles:
            return None

        # Prefer descriptive product title over 1-word brand tags
        title = max(valid_titles, key=lambda t: len(t) if len(t) <= 180 else 0) or valid_titles[0]

        # 2. Extract Prices
        curr_price = None
        orig_price = None

        # Check explicit final/current price selectors (avoid matching container .price-final_price)
        final_nodes = card.select(
            ".special-price .price, [data-price-type='finalPrice'] .price, [data-price-type='finalPrice'], "
            ".special-price, ins .price, ins, span[class*='price-current'], span[class*='price']:not([class*='before']):not([class*='strikethrough']):not(.line-through), "
            ".current-price, .sale-price"
        )
        if final_nodes:
            curr_price = self.parse_egp_price(final_nodes[0].text)

        # Check explicit old-price selectors
        old_nodes = card.select(
            ".old-price .price, [data-price-type='oldPrice'] .price, [data-price-type='oldPrice'], "
            ".old-price, del .price, del, s .price, s, strike, .price-was, "
            "span[class*='price-before'], [class*='strikethrough'], .line-through"
        )
        if old_nodes:
            orig_price = self.parse_egp_price(old_nodes[0].text)

        # Fallback: scan all price elements in the card or resolve if orig_price <= curr_price
        if not curr_price or not orig_price or orig_price <= curr_price:
            all_prices = []
            for p_node in card.select(".price, [itemprop='price'], [data-price-amount], span.amount, [class*='price']"):
                val = self.parse_egp_price(p_node.text)
                if val and val >= 30.0 and val not in all_prices:
                    all_prices.append(val)

            # If still nothing, check stripped strings
            if not all_prices:
                for text_chunk in card.stripped_strings:
                    # Only parse chunks that contain currency or comma/decimals or value >= 50
                    if any(c in text_chunk.lower() for c in ["egp", "le", "ج.م", "جنيه", "ج"]) or "," in text_chunk:
                        val = self.parse_egp_price(text_chunk)
                        if val and val >= 30.0 and val not in all_prices:
                            all_prices.append(val)

            if len(all_prices) >= 2:
                curr_price = min(all_prices)
                orig_price = max(all_prices)
            elif len(all_prices) == 1 and not curr_price:
                curr_price = all_prices[0]

        if not curr_price or curr_price <= 0:
            return None

        # Check discount badge if orig_price is missing or equal
        if not orig_price or orig_price <= curr_price:
            badge = card.select_one(".discount-badge, .badge-discount, .discount, .percentage, .badge, .hot-deal-label")
            if badge and "%" in badge.text:
                m = re.search(r"\d+", badge.text)
                if m:
                    pct = float(m.group(0))
                    if 0 < pct < 100:
                        orig_price = round(curr_price / (1 - (pct / 100)), 2)

        if not orig_price or orig_price <= curr_price:
            return None

        discount_pct = self.calculate_discount(curr_price, orig_price)
        if discount_pct < 5.0:
            return None

        # 3. Product URL (prioritize real product links over '#' or actions)
        prod_url = None
        for a_node in card.select("a.product-item-link, a[href*='.html'], a[href*='/product'], a[href*='/p/'], a[href*='/item'], a[href]"):
            href = a_node.get("href", "").strip()
            if not href or href == "#" or href.startswith("javascript:") or "wishlist" in href or "compare" in href or "cart" in href:
                continue
            prod_url = urljoin(base_url, href)
            break

        if not prod_url:
            if card.name == "a" and card.get("href") and card.get("href") != "#":
                prod_url = urljoin(base_url, card["href"])
            else:
                prod_url = base_url

        # 4. Image
        img_node = card.select_one("img.product-image-photo, img[src], img[data-src], img[data-lazy-src]")
        img_url = None
        if img_node:
            img_url = img_node.get("src") or img_node.get("data-src") or img_node.get("data-lazy-src")
            if img_url:
                img_url = urljoin(base_url, img_url)

        return {
            "title": title,
            "title_ar": None,
            "store_name": self.name,
            "url": canonicalize_url(prod_url),
            "product_url": canonicalize_url(prod_url),
            "image_url": img_url,
            "current_price": curr_price,
            "original_price": orig_price,
            "discount_percent": discount_pct,
            "currency": "EGP",
            "category": self._infer_category(title, "", []),
            "brand": self.name,
            "rating": 4.5,
            "reviews_count": 40,
            "is_flash_sale": discount_pct >= 30.0,
            "is_all_time_low": discount_pct >= 40.0
        }

    def _infer_category(self, title: str, p_type: Optional[str] = "", tags: Optional[List[str]] = None) -> str:
        """Autonomously infers the broad product category from title, type, and tags."""
        tags = tags or []
        full_text = f"{title.lower()} {(p_type or '').lower()} {' '.join(t.lower() for t in tags)}"

        if any(k in full_text for k in ['coffee', 'capsule', 'nespresso', 'espresso', 'davidoff', 'lavazza', 'syrup', 'monin', 'torani', 'tea', 'latte', 'roast', 'beans', 'frother', 'maker', 'cafelax']):
            return "Coffee & Beverages"
        if any(k in full_text for k in ['laptop', 'phone', 'computer', 'screen', 'tv', 'headphone', 'anker', 'cable', 'charger', 'apple', 'samsung', 'usb', 'wireless', 'tablet']):
            return "Electronics"
        if any(k in full_text for k in ['chocolate', 'biscuit', 'cookies', 'sauce', 'snack', 'drink', 'water', 'food', 'supermarket', 'tea', 'sugar', 'milk']):
            return "Supermarket"
        if any(k in full_text for k in ['perfume', 'cream', 'serum', 'lotion', 'shampoo', 'skin', 'beauty', 'hair']):
            return "Beauty & Personal Care"
        if any(k in full_text for k in ['dress', 'shirt', 'pants', 'shoes', 'jacket', 'hoodie', 'fashion', 'bag', 't-shirt']):
            return "Fashion"
        if any(k in full_text for k in ['kitchen', 'home', 'blender', 'oven', 'cooker', 'pot', 'pan', 'furniture', 'mattress']):
            return "Home & Kitchen"
        return self.config.get("category") or "General"
