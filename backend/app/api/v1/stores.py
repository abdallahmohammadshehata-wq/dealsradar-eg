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

    cfg = payload.selectors.dict() if payload.selectors else {}
    if not cfg.get("listing_url"):
        cfg["listing_url"] = payload.url

    scraper = CustomStoreScraper(
        store_name="Validation Probe",
        domain=payload.url,
        config=cfg
    )
    result = await scraper.validate_and_test()
    # Normalize sample items to ensure product_url is set
    samples = []
    for item in result.get("sample_items", []):
        samples.append({
            "title": item["title"],
            "current_price": item["current_price"],
            "original_price": item.get("original_price"),
            "discount_percent": item["discount_percent"],
            "image_url": item.get("image_url"),
            "product_url": item.get("url") or item.get("product_url") or payload.url,
            "url": item.get("url") or item.get("product_url") or payload.url
        })
    result["sample_items"] = samples
    return StoreValidateResponse(**result)

@router.post("", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
async def register_new_store(payload: StoreCreate, db: AsyncSession = Depends(get_db)):
    """
    Dynamically registers a new custom e-commerce store with only website name and link.
    Automatically initiates the first crawl.
    """
    raw_url = (payload.url or payload.base_url or "").strip()
    if not raw_url.startswith("http://") and not raw_url.startswith("https://"):
        raw_url = "https://" + raw_url

    # Auto-extract domain & base_url
    match = re.search(r"https?://([^/]+)", raw_url)
    derived_domain = match.group(1).lower() if match else (payload.domain or "custom-store.eg")
    derived_base_url = f"https://{derived_domain}"

    # Auto logo favicon
    logo_url = payload.logo_url or f"https://www.google.com/s2/favicons?domain={derived_domain}&sz=128"

    # Default custom scraper config
    config_dict = payload.custom_config.dict() if payload.custom_config else {
        "listing_url": raw_url,
        "item_container_selector": ".product-card, .product-item, .item, .card, [data-product]",
        "title_selector": ".product-title, .title, .product-name, h2, h3, a",
        "current_price_selector": ".price, .price-now, .special-price, .current-price, .amount",
        "original_price_selector": ".old-price, .price-was, .regular-price, del, s",
        "image_selector": "img",
        "discount_badge_selector": ".badge-discount, .discount, .percentage",
        "link_selector": "a",
        "category": "General"
    }

    # Slugify name
    slug = re.sub(r"[^\w\s-]", "", payload.name.lower())
    slug = re.sub(r"[\s_-]+", "-", slug).strip("-") or f"store-{derived_domain.replace('.', '-')}"

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
        domain=payload.domain or derived_domain,
        base_url=payload.base_url or derived_base_url,
        logo_url=logo_url,
        is_active=True,
        is_custom=True,
        custom_config=config_dict,
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
