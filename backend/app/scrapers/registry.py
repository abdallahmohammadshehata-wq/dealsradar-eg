import logging
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.models.store import Store
from app.models.deal import Deal
from app.models.price_history import PriceHistory
from app.scrapers.amazon_eg import AmazonEgScraper
from app.scrapers.noon_eg import NoonEgScraper
from app.scrapers.jumia_eg import JumiaEgScraper
from app.scrapers.dynamic_radar import UniversalDynamicRadar
from app.core.security import hash_url

logger = logging.getLogger("scrapers.registry")

class ScraperRegistry:
    def __init__(self):
        self.builtin_scrapers = {
            "amazon-eg": AmazonEgScraper(),
            "noon-eg": NoonEgScraper(),
            "jumia-eg": JumiaEgScraper(),
        }

    async def crawl_store(self, store: Store, db: AsyncSession) -> List[Deal]:
        """
        Runs autonomous dynamic extraction for any store and updates the DB.
        If a built-in scraper exists for huge multi-category marketplaces, it is used.
        Otherwise, the UniversalDynamicRadar autonomously adapts to the store.
        """
        deals_data: List[Dict[str, Any]] = []
        
        if not store.is_active:
            return []

        try:
            if store.slug in self.builtin_scrapers:
                deals_data = await self.builtin_scrapers[store.slug].scrape_deals()
            else:
                # Universal autonomous dynamic radar adapts to ANY website automatically
                radar = UniversalDynamicRadar(
                    store_name=store.name,
                    domain=store.domain,
                    base_url=store.base_url or f"https://{store.domain}",
                    config=store.custom_config or {}
                )
                deals_data = await radar.scrape_deals()
        except Exception as e:
            logger.error(f"Error dynamically scraping store {store.name}: {str(e)}")
            return []

        saved_deals = []
        now = datetime.datetime.utcnow()

        for item in deals_data:
            canonical_hash = hash_url(item["url"])
            
            # Check if deal already exists
            stmt = select(Deal).where(Deal.canonical_url_hash == canonical_hash)
            res = await db.execute(stmt)
            existing_deal = res.scalar_one_or_none()

            curr_p = item["current_price"]
            orig_p = item["original_price"]
            disc_p = item["discount_percent"]

            if existing_deal:
                # Update price if changed
                old_price = existing_deal.current_price
                existing_deal.title = item["title"]
                if item.get("title_ar"):
                    existing_deal.title_ar = item["title_ar"]
                existing_deal.current_price = curr_p
                existing_deal.original_price = orig_p
                existing_deal.discount_percent = disc_p
                existing_deal.updated_at = now
                if item.get("image_url"):
                    existing_deal.image_url = item["image_url"]

                # Update price extrema
                if existing_deal.lowest_price_recorded is None or curr_p < existing_deal.lowest_price_recorded:
                    existing_deal.lowest_price_recorded = curr_p
                    existing_deal.is_all_time_low = True
                else:
                    existing_deal.is_all_time_low = (curr_p <= existing_deal.lowest_price_recorded)

                if existing_deal.highest_price_recorded is None or orig_p > existing_deal.highest_price_recorded:
                    existing_deal.highest_price_recorded = orig_p

                # Add historical price point if changed or if none exists
                if abs(old_price - curr_p) > 0.01:
                    history = PriceHistory(
                        deal_id=existing_deal.id,
                        price=curr_p,
                        original_price=orig_p,
                        discount_percent=disc_p,
                        recorded_at=now
                    )
                    db.add(history)

                saved_deals.append(existing_deal)
            else:
                # Create brand new deal
                new_deal = Deal(
                    title=item["title"],
                    title_ar=item.get("title_ar"),
                    store_id=store.id,
                    store_name=store.name,
                    url=item["url"],
                    canonical_url_hash=canonical_hash,
                    image_url=item.get("image_url"),
                    current_price=curr_p,
                    original_price=orig_p,
                    discount_percent=disc_p,
                    currency=item.get("currency", "EGP"),
                    category=item.get("category", "General"),
                    brand=item.get("brand"),
                    rating=item.get("rating", 4.5),
                    reviews_count=item.get("reviews_count", 0),
                    is_all_time_low=item.get("is_all_time_low", False),
                    lowest_price_recorded=curr_p,
                    highest_price_recorded=orig_p,
                    is_flash_sale=item.get("is_flash_sale", False),
                    is_available=True,
                    created_at=now,
                    updated_at=now
                )
                db.add(new_deal)
                await db.flush() # get ID

                # Add initial price history point
                history = PriceHistory(
                    deal_id=new_deal.id,
                    price=curr_p,
                    original_price=orig_p,
                    discount_percent=disc_p,
                    recorded_at=now
                )
                db.add(history)
                saved_deals.append(new_deal)

        # Update store metadata
        store.last_crawled_at = now
        store.deals_count = len(saved_deals)
        await db.commit()

        logger.info(f"Store {store.name} crawl completed. Processed {len(saved_deals)} deals.")
        return saved_deals

    async def crawl_all_active_stores(self, db: AsyncSession) -> List[Deal]:
        """Iterates through all active stores and triggers scraping."""
        stmt = select(Store).where(Store.is_active == True)
        res = await db.execute(stmt)
        stores = res.scalars().all()
        
        all_deals = []
        for store in stores:
            deals = await self.crawl_store(store, db)
            all_deals.extend(deals)
            
        return all_deals

scraper_registry = ScraperRegistry()
