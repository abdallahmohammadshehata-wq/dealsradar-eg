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
            "listing_url": "https://2b.com.eg/en/hot-deals.html",
            "item_container_selector": ".product-item-info",
            "title_selector": ".product-item-name a",
            "current_price_selector": ".special-price .price",
            "original_price_selector": ".old-price .price",
            "image_selector": ".product-image-photo",
            "discount_badge_selector": ".hot-deal-label",
            "link_selector": "a.product-item-photo",
            "category": "Electronics"
        }
    }
]

async def init_db():
    """Initializes schema and seeds baseline stores and deals."""
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
            logger.info("Seeding initial deals catalog across Amazon, Noon, and Jumia...")
            await scraper_registry.crawl_all_active_stores(db)

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
