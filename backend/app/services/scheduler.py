import asyncio
import logging
from app.db.session import AsyncSessionLocal
from app.scrapers.registry import scraper_registry
from app.services.alert_evaluator import alert_evaluator
from app.core.config import settings

logger = logging.getLogger("services.scheduler")

class BackgroundScheduler:
    def __init__(self):
        self.is_running = False
        self.task: asyncio.Task = None

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self.task = asyncio.create_task(self._run_loop())
        logger.info("Background Deals Radar scheduler started.")

    async def stop(self):
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Background Deals Radar scheduler stopped.")

    async def _run_loop(self):
        # Run initial crawl after 5 seconds on startup
        await asyncio.sleep(5)
        while self.is_running:
            try:
                logger.info("Scheduler running periodic crawl across active stores...")
                async with AsyncSessionLocal() as db:
                    new_deals = await scraper_registry.crawl_all_active_stores(db)
                    if new_deals:
                        await alert_evaluator.evaluate_deals(new_deals, db)
            except Exception as e:
                logger.error(f"Error in background crawl scheduler: {str(e)}")

            # Sleep for configured interval
            interval_secs = max(60, settings.CRAWL_INTERVAL_MINUTES * 60)
            await asyncio.sleep(interval_secs)

scheduler = BackgroundScheduler()
