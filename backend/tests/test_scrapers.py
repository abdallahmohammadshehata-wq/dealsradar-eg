import pytest
from app.scrapers.base import BaseScraper
from app.scrapers.amazon_eg import AmazonEgScraper
from app.scrapers.noon_eg import NoonEgScraper
from app.scrapers.jumia_eg import JumiaEgScraper
from app.scrapers.custom_scraper import CustomStoreScraper

def test_egp_price_parser():
    # Various Egyptian currency formats
    assert BaseScraper.parse_egp_price("EGP 1,499.00") == 1499.0
    assert BaseScraper.parse_egp_price("1,499 ج.م") == 1499.0
    assert BaseScraper.parse_egp_price("جنيه 2,350.50") == 2350.50
    assert BaseScraper.parse_egp_price("١٬٤٩٩ ج.م") == 1499.0
    assert BaseScraper.parse_egp_price("549.00 EGP") == 549.0

def test_discount_calculator():
    # 24,500 down to 14,999 is ~38.8%
    discount = BaseScraper.calculate_discount(14999.0, 24500.0)
    assert discount == 38.8

    # No discount or invalid
    assert BaseScraper.calculate_discount(100.0, 100.0) == 0.0
    assert BaseScraper.calculate_discount(120.0, 100.0) == 0.0

@pytest.mark.asyncio
async def test_builtin_scrapers_catalog():
    amazon = AmazonEgScraper()
    noon = NoonEgScraper()
    jumia = JumiaEgScraper()

    amazon_deals = await amazon.scrape_deals()
    noon_deals = await noon.scrape_deals()
    jumia_deals = await jumia.scrape_deals()

    assert len(amazon_deals) > 0
    assert all(d["currency"] == "EGP" for d in amazon_deals)
    assert len(noon_deals) > 0
    assert len(jumia_deals) > 0

@pytest.mark.asyncio
async def test_custom_scraper_html_parsing():
    sample_html = """
    <div class="product-grid">
        <div class="card">
            <h3 class="name">Smart Air Purifier HEPA</h3>
            <span class="price-now">EGP 3,200</span>
            <span class="price-old">EGP 5,000</span>
            <a href="/p/purifier-123" class="link">View Deal</a>
            <img src="/img/purifier.jpg" />
        </div>
    </div>
    """
    scraper = CustomStoreScraper(
        store_name="Demo Store",
        domain="demo-store.eg",
        config={
            "listing_url": "https://demo-store.eg/deals",
            "item_container_selector": ".card",
            "title_selector": ".name",
            "current_price_selector": ".price-now",
            "original_price_selector": ".price-old",
            "link_selector": ".link",
            "image_selector": "img"
        }
    )
    items = scraper._parse_html(sample_html, "https://demo-store.eg/deals")
    assert len(items) == 1
    item = items[0]
    assert item["title"] == "Smart Air Purifier HEPA"
    assert item["current_price"] == 3200.0
    assert item["original_price"] == 5000.0
    assert item["discount_percent"] == 36.0
