import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base

class Deal(Base):
    __tablename__ = "deals"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    title_ar = Column(String(500), nullable=True)
    
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False, index=True)
    store_name = Column(String(100), nullable=False, index=True)
    
    url = Column(String(2000), nullable=False)
    canonical_url_hash = Column(String(64), nullable=False, unique=True, index=True)
    sku = Column(String(100), nullable=True, index=True)
    image_url = Column(String(2000), nullable=True)
    
    current_price = Column(Float, nullable=False, index=True)
    original_price = Column(Float, nullable=False, index=True)
    discount_percent = Column(Float, nullable=False, index=True)
    currency = Column(String(10), default="EGP")
    
    category = Column(String(100), default="General", index=True)
    brand = Column(String(100), nullable=True, index=True)
    
    rating = Column(Float, default=4.5)
    reviews_count = Column(Integer, default=0)
    
    is_all_time_low = Column(Boolean, default=False, index=True)
    lowest_price_recorded = Column(Float, nullable=True)
    highest_price_recorded = Column(Float, nullable=True)
    
    is_flash_sale = Column(Boolean, default=False)
    is_available = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    price_history = relationship("PriceHistory", back_populates="deal", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_deal_store_discount", "store_name", "discount_percent"),
        Index("idx_deal_category_price", "category", "current_price"),
    )
