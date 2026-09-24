import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from app.db.session import Base

class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    slug = Column(String(100), nullable=False, unique=True, index=True)
    domain = Column(String(255), nullable=False)
    base_url = Column(String(500), nullable=False)
    logo_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    is_custom = Column(Boolean, default=False)
    
    # Custom scraping selector configuration:
    # {
    #   "listing_url": "https://...",
    #   "item_container_selector": ".product-card",
    #   "title_selector": ".product-title",
    #   "current_price_selector": ".price-now",
    #   "original_price_selector": ".price-was",
    #   "image_selector": "img",
    #   "discount_badge_selector": ".badge-discount",
    #   "link_selector": "a.product-link",
    #   "category": "General"
    # }
    custom_config = Column(JSON, nullable=True)
    
    last_crawled_at = Column(DateTime, nullable=True)
    deals_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
