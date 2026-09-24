import pytest
import pytest_asyncio
import httpx
from app.main import app
from app.db.init_db import init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    await init_db()

@pytest.mark.asyncio
async def test_health_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["market"] == "Egypt (EGP)"

@pytest.mark.asyncio
async def test_deals_feed_filtering():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Default feed
        resp = await client.get("/api/v1/deals?page=1&page_size=10")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert data["total"] > 0
        
        # Test minimum discount filter
        resp_disc = await client.get("/api/v1/deals?min_discount=40")
        assert resp_disc.status_code == 200
        items_disc = resp_disc.json()["items"]
        for item in items_disc:
            assert item["discount_percent"] >= 40.0

@pytest.mark.asyncio
async def test_market_stats_endpoint():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/api/v1/deals/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_deals"] > 0
        assert data["average_discount"] > 0
        assert len(data["top_categories"]) > 0
