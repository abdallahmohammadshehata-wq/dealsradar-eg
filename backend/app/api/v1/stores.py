import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.store import Store
from app.schemas.store import (
    StoreResponse,
    StoreCreate,
    StoreValidateRequest,
    StoreValidateResponse
)
from app.scrapers.custom_scraper import CustomStoreScraper
from app.scrapers.registry import scraper_registry
from app.core.security import is_safe_external_url

router = APIRouter()

@router.get("", response_model=List[StoreResponse])
async def get_all_stores(db: AsyncSession = Depends(get_db)):
    """Lists all active native and custom registered Egyptian stores."""
    stmt = select(Store).order_by(Store.id)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/validate", response_model=StoreValidateResponse)
async def validate_custom_website_selectors(payload: StoreValidateRequest):
    """
    Performs a dry-run test extraction against a target website using provided CSS selectors.
    Allows user to preview parsed products before saving the store.
    """
    if not is_safe_external_url(payload.url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forbidden or invalid website URL."
        )

    scraper = CustomStoreScraper(
        store_name="Validation Probe",
        domain=payload.url,
        config=payload.selectors.dict()
    )
    result = await scraper.validate_and_test()
    return StoreValidateResponse(**result)

@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def register_new_store(payload: StoreCreate, db: AsyncSession = Depends(get_db)):
    """
    Dynamically registers a new custom e-commerce store with custom selector configurations.
    Automatically initiates the first crawl.
    """
    # Slugify name
    slug = re.sub(r"[^\w\s-]", "", payload.name.lower())
    slug = re.sub(r"[\s_-]+", "-", slug).strip("-")

    # Check for duplicate
    stmt = select(Store).where((Store.slug == slug) | (Store.name == payload.name))
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A store with name '{payload.name}' already exists."
        )

    new_store = Store(
        name=payload.name,
        slug=slug,
        domain=payload.domain,
        base_url=payload.base_url,
        logo_url=payload.logo_url,
        is_active=True,
        is_custom=True,
        custom_config=payload.custom_config.dict(),
        deals_count=0
    )
    db.add(new_store)
    await db.commit()
    await db.refresh(new_store)

    # Trigger background/initial crawl for the newly added store
    await scraper_registry.crawl_store(new_store, db)
    await db.refresh(new_store)

    return new_store

@router.post("/{store_id}/crawl")
async def trigger_manual_store_crawl(store_id: int, db: AsyncSession = Depends(get_db)):
    """Manually triggers an immediate crawl of a specific store."""
    stmt = select(Store).where(Store.id == store_id)
    res = await db.execute(stmt)
    store = res.scalar_one_or_none()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    deals = await scraper_registry.crawl_store(store, db)
    return {
        "success": True,
        "store_id": store.id,
        "store_name": store.name,
        "deals_crawled_count": len(deals)
    }
