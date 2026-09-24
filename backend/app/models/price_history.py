import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    deal_id = Column(Integer, ForeignKey("deals.id"), nullable=False, index=True)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=False)
    discount_percent = Column(Float, nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    deal = relationship("Deal", back_populates="price_history")

    __table_args__ = (
        Index("idx_history_deal_time", "deal_id", "recorded_at"),
    )
