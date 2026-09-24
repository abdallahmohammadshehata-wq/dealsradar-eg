import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class PriceHistoryPoint(BaseModel):
    price: float
    original_price: float
    discount_percent: float
    recorded_at: datetime.datetime

    class Config:
        from_attributes = True

class DealResponse(BaseModel):
    id: int
    title: str
    title_ar: Optional[str] = None
    store_id: int
    store_name: str
    url: str
    image_url: Optional[str] = None
    current_price: float
    original_price: float
    discount_percent: float
    currency: str = "EGP"
    category: str
    brand: Optional[str] = None
    rating: float = 4.5
    reviews_count: int = 0
    is_all_time_low: bool = False
    lowest_price_recorded: Optional[float] = None
    highest_price_recorded: Optional[float] = None
    is_flash_sale: bool = False
    is_available: bool = True
    created_at: datetime.datetime
    updated_at: datetime.datetime
    price_history: Optional[List[PriceHistoryPoint]] = None

    class Config:
        from_attributes = True

class DealListResponse(BaseModel):
    items: List[DealResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    min_discount_available: float
    max_discount_available: float
    categories: List[str]
    stores: List[str]

class DealStatsResponse(BaseModel):
    total_deals: int
    average_discount: float
    all_time_lows_count: int
    flash_sales_count: int
    total_stores_active: int
    top_categories: List[dict]
    deals_by_store: List[dict]
    biggest_drops_today: List[DealResponse]
