import logging
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import engine, Base, AsyncSessionLocal
from app.models.store import Store
from app.models.deal import Deal
from app.models.price_history import PriceHistory
from app.models.alert import AlertRule
from app.scrapers.registry import scraper_registry

logger = logging.getLogger("db.init")

INITIAL_STORES = [
    {
        "name": "Amazon EG",
        "slug": "amazon-eg",
        "domain": "amazon.eg",
        "base_url": "https://www.amazon.eg",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
        "is_active": True,
        "is_custom": False,
        "custom_config": None
    },
    {
        "name": "Noon EG",
        "slug": "noon-eg",
        "domain": "noon.com",
        "base_url": "https://www.noon.com/egypt-en/",
        "logo_url": "https://z.nooncdn.com/s/app/com/noon/design-system/logos/noon-logo-en.svg",
        "is_active": True,
        "is_custom": False,
        "custom_config": None
    },
    {
        "name": "Jumia EG",
        "slug": "jumia-eg",
        "domain": "jumia.com.eg",
        "base_url": "https://www.jumia.com.eg",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Jumia_Logo.png",
        "is_active": True,
        "is_custom": False,
        "custom_config": None
    },
    {
        "name": "B.TECH Egypt",
        "slug": "btech-eg",
        "domain": "btech.com",
        "base_url": "https://btech.com/en",
        "logo_url": "https://btech.com/static/version1726058925/frontend/Btech/default/en_US/images/logo.svg",
        "is_active": True,
        "is_custom": True,
        "custom_config": {
            "listing_url": "https://btech.com/en/deals.html",
            "item_container_selector": ".product-item",
            "title_selector": ".product-item-link",
            "current_price_selector": ".special-price .price",
            "original_price_selector": ".old-price .price",
            "image_selector": ".product-image-photo",
            "discount_badge_selector": ".discount-tag",
            "link_selector": "a.product-item-link",
            "category": "Electronics"
        }
    },
    {
        "name": "2B Egypt",
        "slug": "2b-eg",
        "domain": "2b.com.eg",
        "base_url": "https://2b.com.eg",
        "logo_url": "https://2b.com.eg/media/logo/stores/1/2B_logo_1.png",
        "is_active": True,
        "is_custom": True,
        "custom_config": {
            "listing_url": "https://2b.com.eg/en/computers/laptops.html",
            "item_container_selector": "li.product-item, div.product-item-info",
            "title_selector": "a.product-item-link",
            "current_price_selector": "[data-price-type='finalPrice'] .price, .price-final_price .price, span.price",
            "original_price_selector": "[data-price-type='oldPrice'] .price, .old-price .price",
            "image_selector": "img.product-image-photo",
            "discount_badge_selector": None,
            "link_selector": "a.product-item-link",
            "category": "Electronics"
        }
    }
]

async def init_db():
    """Initializes schema and seeds baseline stores and verified real deals."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # Seed stores if not present
        for store_data in INITIAL_STORES:
            stmt = select(Store).where(Store.slug == store_data["slug"])
            res = await db.execute(stmt)
            existing = res.scalar_one_or_none()
            if not existing:
                store = Store(
                    name=store_data["name"],
                    slug=store_data["slug"],
                    domain=store_data["domain"],
                    base_url=store_data["base_url"],
                    logo_url=store_data["logo_url"],
                    is_active=store_data["is_active"],
                    is_custom=store_data["is_custom"],
                    custom_config=store_data["custom_config"],
                    created_at=datetime.datetime.utcnow()
                )
                db.add(store)
        await db.commit()

        # Check if deals are seeded
        stmt_deals = select(Deal)
        res_deals = await db.execute(stmt_deals)
        deals_count = len(res_deals.scalars().all())

        if deals_count == 0:
            logger.info("Seeding verified real deals from verified_deals.json...")
            import json
            from pathlib import Path
            from app.core.security import hash_url
            data_file = Path(__file__).parent.parent / "scrapers" / "data" / "verified_deals.json"
            if data_file.exists():
                with open(data_file, "r", encoding="utf-8") as f:
                    verified_items = json.load(f)
                    for item in verified_items:
                        deal = Deal(
                            title=item["title"],
                            title_ar=item.get("title_ar"),
                            store_id=item.get("store_id", 1),
                            store_name=item["store_name"],
                            url=item["url"],
                            canonical_url_hash=hash_url(item["url"]),
                            image_url=item.get("image_url"),
                            current_price=item["current_price"],
                            original_price=item["original_price"],
                            discount_percent=item["discount_percent"],
                            currency=item.get("currency", "EGP"),
                            category=item["category"],
                            brand=item.get("brand", item["store_name"]),
                            rating=item.get("rating", 4.5),
                            reviews_count=item.get("reviews_count", 100),
                            is_flash_sale=item.get("is_flash_sale", False),
                            is_all_time_low=item.get("is_all_time_low", False),
                            is_available=True,
                            created_at=datetime.datetime.utcnow(),
                            updated_at=datetime.datetime.utcnow()
                        )
                        db.add(deal)
                await db.commit()

        # Seed sample Alert Rules for demonstration
        stmt_rules = select(AlertRule)
        res_rules = await db.execute(stmt_rules)
        if not res_rules.scalars().first():
            demo_rule = AlertRule(
                device_id="default-device",
                name="Coffee Machines > 40% OFF",
                query_text="Coffee",
                category="Home & Kitchen",
                min_discount=35.0,
                max_price=20000.0,
                stores=["Amazon EG", "Noon EG"],
                is_active=True,
                created_at=datetime.datetime.utcnow()
            )
            db.add(demo_rule)
            await db.commit()

    logger.info("Database initialization completed.")
