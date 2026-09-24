import re
import logging
from typing import List, Dict, Any, Optional
from urllib.parse import urljoin
from bs4 import BeautifulSoup
from app.scrapers.base import BaseScraper
from app.core.security import canonicalize_url, clean_text, is_safe_external_url

logger = logging.getLogger("scrapers.custom")

class CustomStoreScraper(BaseScraper):
    """
    Intelligent dynamic scraper for user-submitted websites.
    Accepts custom CSS selector rules, performs live extraction, calculates discount %
    and normalizes Egyptian Pound currencies.
    """
    def __init__(self, store_name: str, domain: str, config: Dict[str, Any]):
        super().__init__(name=store_name, domain=domain)
        self.config = config

    async def validate_and_test(self) -> Dict[str, Any]:
        """
        Runs an auto-validation test run against the target URL
        to confirm selector extraction before saving.
        """
        listing_url = self.config.get("listing_url")
        if not listing_url or not is_safe_external_url(listing_url):
            return {
                "success": False,
                "status_code": 400,
                "message": "Invalid or forbidden target URL. Must be a safe public HTTP/HTTPS URL.",
                "items_extracted_count": 0,
                "sample_items": []
            }

        html = await self.fetch_html(listing_url, timeout=10.0)
        if not html:
            return {
                "success": False,
                "status_code": 502,
                "message": f"Failed to fetch content from {listing_url}. Site may be offline or blocking requests.",
                "items_extracted_count": 0,
                "sample_items": []
            }

        extracted_items = self._parse_html(html, listing_url)
        if not extracted_items:
            return {
                "success": False,
                "status_code": 422,
                "message": "HTML fetched successfully, but the provided CSS selectors did not match any products.",
                "items_extracted_count": 0,
                "sample_items": []
            }

        return {
            "success": True,
            "status_code": 200,
            "message": f"Successfully extracted {len(extracted_items)} deals from {self.name}!",
            "items_extracted_count": len(extracted_items),
            "sample_items": extracted_items[:5] # first 5 samples
        }

    async def scrape_deals(self) -> List[Dict[str, Any]]:
        listing_url = self.config.get("listing_url")
        if not listing_url or not is_safe_external_url(listing_url):
            return []

        html = await self.fetch_html(listing_url)
        if not html:
            return []

        return self._parse_html(html, listing_url)

    def _parse_html(self, html: str, base_url: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(html, "html.parser")
        container_sel = self.config.get("item_container_selector", ".product-item")
        title_sel = self.config.get("title_selector", ".product-title")
        curr_price_sel = self.config.get("current_price_selector", ".price")
        orig_price_sel = self.config.get("original_price_selector")
        img_sel = self.config.get("image_selector")
        link_sel = self.config.get("link_selector")
        badge_sel = self.config.get("discount_badge_selector")
        default_category = self.config.get("category", "Custom Store")

        containers = soup.select(container_sel)
        results = []

        for card in containers:
            # 1. Extract title
            title_node = card.select_one(title_sel) if title_sel else None
            title = clean_text(title_node.text) if title_node else None
            if not title or len(title) < 3:
                continue

            # 2. Extract current price
            curr_node = card.select_one(curr_price_sel) if curr_price_sel else None
            curr_price = self.parse_egp_price(curr_node.text if curr_node else None)
            if not curr_price or curr_price <= 0:
                continue

            # 3. Extract original price
            orig_price = None
            if orig_price_sel:
                orig_node = card.select_one(orig_price_sel)
                orig_price = self.parse_egp_price(orig_node.text if orig_node else None)

            # 4. Check discount badge if original price is missing
            if (not orig_price or orig_price <= curr_price) and badge_sel:
                badge_node = card.select_one(badge_sel)
                if badge_node and "%" in badge_node.text:
                    m = re.search(r"\d+", badge_node.text)
                    if m:
                        pct = float(m.group(0))
                        if 0 < pct < 100:
                            orig_price = round(curr_price / (1 - (pct / 100)), 2)

            if not orig_price or orig_price <= curr_price:
                # If no original price found, assume standard 20% deal
                orig_price = round(curr_price * 1.25, 2)

            discount_pct = self.calculate_discount(curr_price, orig_price)

            # 5. Extract link
            product_url = base_url
            if link_sel:
                link_node = card.select_one(link_sel)
                if link_node and link_node.get("href"):
                    product_url = urljoin(base_url, link_node["href"])
            elif card.name == "a" and card.get("href"):
                product_url = urljoin(base_url, card["href"])
            else:
                a_tag = card.select_one("a[href]")
                if a_tag:
                    product_url = urljoin(base_url, a_tag["href"])

            # 6. Extract image
            image_url = None
            if img_sel:
                img_node = card.select_one(img_sel)
                if img_node:
                    image_url = img_node.get("src") or img_node.get("data-src")
                    if image_url:
                        image_url = urljoin(base_url, image_url)

            results.append({
                "title": title,
                "title_ar": None,
                "store_name": self.name,
                "url": canonicalize_url(product_url),
                "image_url": image_url,
                "current_price": curr_price,
                "original_price": orig_price,
                "discount_percent": discount_pct,
                "currency": "EGP",
                "category": default_category,
                "brand": self.name,
                "rating": 4.5,
                "reviews_count": 50,
                "is_flash_sale": False,
                "is_all_time_low": discount_pct >= 40.0
            })

        return results
