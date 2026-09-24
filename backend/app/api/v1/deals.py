import math
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc, or_, and_
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.deal import Deal
from app.models.price_history import PriceHistory
from app.models.store import Store
from app.schemas.deal import DealResponse, DealListResponse, DealStatsResponse, PriceHistoryPoint
from app.core.rate_limit import rate_limiter

router = APIRouter()

@router.get("", response_model=DealListResponse)
async def get_deals_feed(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    min_discount: Optional[float] = Query(None, ge=0.0, le=100.0, description="Minimum discount percentage"),
    min_price: Optional[float] = Query(None, ge=0.0, description="Minimum price in EGP"),
    max_price: Optional[float] = Query(None, ge=0.0, description="Maximum price in EGP"),
    stores: Optional[str] = Query(None, description="Comma-separated store names"),
    category: Optional[str] = Query(None, description="Single category filter"),
    categories: Optional[str] = Query(None, description="Comma-separated category list"),
    brand: Optional[str] = Query(None, description="Brand filter"),
    search: Optional[str] = Query(None, description="Bilingual search query in English or Arabic"),
    is_all_time_low: Optional[bool] = Query(None, description="Filter for historical lowest price deals"),
    is_flash_sale: Optional[bool] = Query(None, description="Filter for flash sales"),
    sort_by: Optional[str] = Query(
        "discount_desc",
        pattern="^(discount_desc|price_asc|price_desc|newest|all_time_low)$",
        description="Sort ordering"
    ),
    db: AsyncSession = Depends(get_db)
):
    """
    Transient Feed View Filtering:
    Provides fast, granular querying by discount slider, EGP bounds, store checkboxes, and sort orders.
    """
    rate_limiter.check_rate_limit(request, max_requests=120, window_seconds=60)
    
    query = select(Deal).where(Deal.is_available == True).options(selectinload(Deal.price_history))

    # 1. Discount filter
    if min_discount is not None and min_discount > 0:
        query = query.where(Deal.discount_percent >= min_discount)

    # 2. Price bounds
    if min_price is not None:
        query = query.where(Deal.current_price >= min_price)
    if max_price is not None:
        query = query.where(Deal.current_price <= max_price)

    # 3. Store filter
    if stores:
        store_list = [s.strip() for s in stores.split(",") if s.strip()]
        if store_list:
            query = query.where(Deal.store_name.in_(store_list))

    # 4. Multi-Category and Special Category filter
    target_cats = []
    if categories:
        target_cats.extend([c.strip() for c in categories.split(",") if c.strip() and c.lower() != "all"])
    elif category and category.lower() != "all":
        target_cats.extend([c.strip() for c in category.split(",") if c.strip() and c.lower() != "all"])

    if target_cats:
        cat_conditions = []
        for cat in target_cats:
            cat_conditions.append(func.lower(Deal.category) == cat.lower())
            # Also allow keyword matching for special custom categories (e.g. Gaming, Laptops)
            cat_conditions.append(func.lower(Deal.title).like(f"%{cat.lower()}%"))
            cat_conditions.append(func.lower(Deal.title_ar).like(f"%{cat.lower()}%"))
        query = query.where(or_(*cat_conditions))

    # 5. Brand filter
    if brand:
        query = query.where(func.lower(Deal.brand) == brand.lower())

    # 6. Historical all-time low & Flash sales
    if is_all_time_low is True:
        query = query.where(Deal.is_all_time_low == True)
    if is_flash_sale is True:
        query = query.where(Deal.is_flash_sale == True)

    # 7. Bilingual Search Query (English & Arabic)
    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.where(
            or_(
                func.lower(Deal.title).like(term),
                func.lower(Deal.title_ar).like(term),
                func.lower(Deal.brand).like(term),
                func.lower(Deal.category).like(term)
            )
        )

    # 8. Sorting
    if sort_by == "discount_desc":
        query = query.order_by(desc(Deal.discount_percent), desc(Deal.created_at))
    elif sort_by == "price_asc":
        query = query.order_by(asc(Deal.current_price))
    elif sort_by == "price_desc":
        query = query.order_by(desc(Deal.current_price))
    elif sort_by == "newest":
        query = query.order_by(desc(Deal.created_at))
    elif sort_by == "all_time_low":
        query = query.order_by(desc(Deal.is_all_time_low), desc(Deal.discount_percent))

    # Execute total count
    count_query = select(func.count()).select_from(query.subquery())
    total_res = await db.execute(count_query)
    total_items = total_res.scalar_one()

    # Pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    res = await db.execute(query)
    items = res.scalars().all()

    # Metadata for filter facets
    cat_res = await db.execute(select(Deal.category).distinct())
    categories = [c[0] for c in cat_res.all() if c[0]]

    store_res = await db.execute(select(Store.name).where(Store.is_active == True))
    store_names = [s[0] for s in store_res.all() if s[0]]

    total_pages = math.ceil(total_items / page_size) if total_items > 0 else 1

    return DealListResponse(
        items=items,
        total=total_items,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        min_discount_available=10.0,
        max_discount_available=90.0,
        categories=categories,
        stores=store_names
    )

@router.get("/stats", response_model=DealStatsResponse)
async def get_market_deal_stats(db: AsyncSession = Depends(get_db)):
    """Provides market statistics, top categories on discount, and biggest price drops today."""
    # Total deals
    total_deals = (await db.execute(select(func.count(Deal.id)))).scalar_one() or 0
    avg_discount = (await db.execute(select(func.avg(Deal.discount_percent)))).scalar_one() or 0.0
    all_time_lows = (await db.execute(select(func.count(Deal.id)).where(Deal.is_all_time_low == True))).scalar_one() or 0
    flash_sales = (await db.execute(select(func.count(Deal.id)).where(Deal.is_flash_sale == True))).scalar_one() or 0
    active_stores = (await db.execute(select(func.count(Store.id)).where(Store.is_active == True))).scalar_one() or 0

    # Top categories
    cat_stmt = select(Deal.category, func.count(Deal.id).label("count"), func.avg(Deal.discount_percent).label("avg_discount")).group_by(Deal.category).order_by(desc("count")).limit(6)
    cat_res = await db.execute(cat_stmt)
    top_categories = [{"category": row[0], "count": row[1], "avg_discount": round(row[2], 1)} for row in cat_res.all()]

    # Deals by store
    store_stmt = select(Deal.store_name, func.count(Deal.id).label("count"), func.avg(Deal.discount_percent).label("avg_discount")).group_by(Deal.store_name)
    store_res = await db.execute(store_stmt)
    deals_by_store = [{"store": row[0], "count": row[1], "avg_discount": round(row[2], 1)} for row in store_res.all()]

    # Biggest drops
    biggest_stmt = select(Deal).options(selectinload(Deal.price_history)).order_by(desc(Deal.discount_percent)).limit(5)
    biggest_res = await db.execute(biggest_stmt)
    biggest_drops = biggest_res.scalars().all()

    return DealStatsResponse(
        total_deals=total_deals,
        average_discount=round(avg_discount, 1),
        all_time_lows_count=all_time_lows,
        flash_sales_count=flash_sales,
        total_stores_active=active_stores,
        top_categories=top_categories,
        deals_by_store=deals_by_store,
        biggest_drops_today=biggest_drops
    )

@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal_by_id(deal_id: int, db: AsyncSession = Depends(get_db)):
    """Retrieves a single deal along with complete price history records."""
    stmt = select(Deal).where(Deal.id == deal_id).options(selectinload(Deal.price_history))
    res = await db.execute(stmt)
    deal = res.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal

@router.get("/{deal_id}/history", response_model=List[PriceHistoryPoint])
async def get_deal_price_history(deal_id: int, db: AsyncSession = Depends(get_db)):
    """Returns price trend timeline points to detect genuine drops vs fake markups."""
    stmt = select(PriceHistory).where(PriceHistory.deal_id == deal_id).order_by(asc(PriceHistory.recorded_at))
    res = await db.execute(stmt)
    history = res.scalars().all()
    return history
