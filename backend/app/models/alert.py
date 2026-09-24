import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, JSON, ForeignKey, Index
from app.db.session import Base

class AlertRule(Base):
    """
    Independent persistent user alert rule for background push notifications.
    E.g. "Notify me ONLY if a Coffee Machine drops > 40% and price is under 2,500 EGP on Amazon or Noon"
    """
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), nullable=False, index=True, default="default-device")
    
    name = Column(String(200), nullable=True)
    query_text = Column(String(200), nullable=True) # Keyword or title match
    category = Column(String(100), nullable=True)
    brand = Column(String(100), nullable=True)
    
    min_discount = Column(Float, default=20.0) # Minimum discount percentage
    max_price = Column(Float, nullable=True) # Max EGP threshold
    min_price = Column(Float, nullable=True) # Min EGP threshold
    
    # Selected stores list: ["Amazon EG", "Noon EG", "Jumia EG"]
    stores = Column(JSON, nullable=True)
    
    is_active = Column(Boolean, default=True)
    notify_email = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_triggered_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_alert_device_active", "device_id", "is_active"),
    )

class PushSubscription(Base):
    """Stores Web Push API subscriptions for push notifications."""
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), nullable=False, index=True)
    endpoint = Column(String(1000), nullable=False, unique=True, index=True)
    p256dh = Column(String(255), nullable=False)
    auth = Column(String(255), nullable=False)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class TriggeredNotification(Base):
    """Stores generated alerts for the in-app notification center."""
    __tablename__ = "triggered_notifications"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String(100), nullable=False, index=True)
    alert_rule_id = Column(Integer, ForeignKey("alert_rules.id", ondelete="SET NULL"), nullable=True)
    deal_id = Column(Integer, ForeignKey("deals.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(300), nullable=False)
    body = Column(Text, nullable=False)
    icon = Column(String(500), nullable=True)
    url = Column(String(1000), nullable=False)
    
    discount_percent = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    store_name = Column(String(100), nullable=False)
    
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    __table_args__ = (
        Index("idx_notif_device_deal", "device_id", "deal_id"),
        Index("idx_notif_device_read", "device_id", "is_read"),
    )
