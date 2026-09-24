import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class AlertRuleCreate(BaseModel):
    device_id: str = Field("default-device", description="Anonymous client/device identifier")
    name: Optional[str] = None
    query_text: Optional[str] = Field(None, description="Keywords to match in product title (AR/EN)")
    category: Optional[str] = Field(None, description="Category filter (e.g. Electronics, Fashion)")
    brand: Optional[str] = Field(None, description="Brand filter (e.g. Samsung, Apple, Nike)")
    min_discount: float = Field(20.0, ge=5.0, le=95.0, description="Trigger only if discount >= %")
    max_price: Optional[float] = Field(None, description="Trigger only if price <= EGP")
    min_price: Optional[float] = Field(None, description="Trigger only if price >= EGP")
    stores: Optional[List[str]] = Field(None, description="List of store names to watch")

class AlertRuleResponse(BaseModel):
    id: int
    device_id: str
    name: Optional[str] = None
    query_text: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    min_discount: float
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    stores: Optional[List[str]] = None
    is_active: bool
    created_at: datetime.datetime
    last_triggered_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str

class PushSubscriptionCreate(BaseModel):
    device_id: str
    endpoint: str
    keys: PushSubscriptionKeys

class PushTestRequest(BaseModel):
    device_id: str
    title: Optional[str] = "🔥 DealsRadar EG Alert"
    body: Optional[str] = "اختبار الإشعارات: تخفيض 45% على شاشة سامسونج 55 بوصة!"
    url: Optional[str] = "/feed"

class TriggeredNotificationResponse(BaseModel):
    id: int
    device_id: str
    alert_rule_id: Optional[int] = None
    deal_id: int
    title: str
    body: str
    icon: Optional[str] = None
    url: str
    discount_percent: float
    price: float
    store_name: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True
