import datetime
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, HttpUrl, Field

class CustomSelectorConfig(BaseModel):
    listing_url: Optional[str] = Field(None, description="Target deals or clearance page URL")
    item_container_selector: Optional[str] = Field(".product-card, .product-item, .item, .card, [data-product]", description="CSS selector for the product card container")
    title_selector: Optional[str] = Field(".product-title, .title, .product-name, h2, h3, a", description="CSS selector for product title")
    current_price_selector: Optional[str] = Field(".price, .price-now, .special-price, .current-price, .amount", description="CSS selector for deal price")
    original_price_selector: Optional[str] = Field(".old-price, .price-was, .regular-price, del, s", description="CSS selector for original price")
    image_selector: Optional[str] = Field("img", description="CSS selector for product thumbnail")
    discount_badge_selector: Optional[str] = Field(".badge-discount, .discount, .percentage", description="CSS selector for discount badge text")
    link_selector: Optional[str] = Field("a", description="CSS selector for product URL / anchor")
    category: Optional[str] = Field("General", description="Default product category")

class StoreCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    url: Optional[str] = Field(None, description="Website URL")
    domain: Optional[str] = Field(None, max_length=255)
    base_url: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = None
    custom_config: Optional[CustomSelectorConfig] = None

class StoreResponse(BaseModel):
    id: int
    name: str
    slug: str
    domain: str
    base_url: str
    logo_url: Optional[str] = None
    is_active: bool
    is_custom: bool
    custom_config: Optional[Dict[str, Any]] = None
    last_crawled_at: Optional[datetime.datetime] = None
    deals_count: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class StoreValidateRequest(BaseModel):
    url: str
    selectors: CustomSelectorConfig

class ExtractedSampleItem(BaseModel):
    title: str
    current_price: float
    original_price: Optional[float] = None
    discount_percent: float
    image_url: Optional[str] = None
    product_url: str

class StoreValidateResponse(BaseModel):
    success: bool
    status_code: int
    message: str
    items_extracted_count: int
    sample_items: List[ExtractedSampleItem]
