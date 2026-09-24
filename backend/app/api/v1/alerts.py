from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc, update
from app.db.session import get_db
from app.models.alert import AlertRule, PushSubscription, TriggeredNotification
from app.schemas.alert import (
    AlertRuleCreate,
    AlertRuleResponse,
    PushSubscriptionCreate,
    PushTestRequest,
    TriggeredNotificationResponse
)
from app.services.push_service import push_service

router = APIRouter()

@router.get("", response_model=List[AlertRuleResponse])
async def list_alert_rules(
    device_id: str = Query("default-device", description="Device / Client ID"),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all persistent background alert rules created for a user device."""
    stmt = select(AlertRule).where(AlertRule.device_id == device_id).order_by(desc(AlertRule.created_at))
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=AlertRuleResponse, status_code=status.HTTP_201_CREATED)
async def create_alert_rule(payload: AlertRuleCreate, db: AsyncSession = Depends(get_db)):
    """
    Creates a persistent background alert rule (decoupled from the transient feed filter).
    E.g. "Notify me when Coffee Machines drop > 40% under 2,500 EGP on Amazon or Noon".
    """
    name = payload.name
    if not name:
        parts = []
        if payload.query_text:
            parts.append(f"'{payload.query_text}'")
        elif payload.category:
            parts.append(payload.category)
        if payload.min_discount:
            parts.append(f">={payload.min_discount:.0f}% off")
        if payload.max_price:
            parts.append(f"<={payload.max_price:,.0f} EGP")
        name = " ".join(parts) if parts else "Custom Alert Rule"

    new_rule = AlertRule(
        device_id=payload.device_id,
        name=name,
        query_text=payload.query_text,
        category=payload.category,
        brand=payload.brand,
        min_discount=payload.min_discount,
        max_price=payload.max_price,
        min_price=payload.min_price,
        stores=payload.stores,
        is_active=True
    )
    db.add(new_rule)
    await db.commit()
    await db.refresh(new_rule)
    return new_rule

@router.delete("/{rule_id}")
async def delete_alert_rule(rule_id: int, db: AsyncSession = Depends(get_db)):
    """Deletes an alert rule."""
    stmt = select(AlertRule).where(AlertRule.id == rule_id)
    res = await db.execute(stmt)
    rule = res.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")

    await db.delete(rule)
    await db.commit()
    return {"success": True, "message": f"Alert rule {rule_id} deleted."}

@router.post("/subscribe")
async def subscribe_to_web_push(payload: PushSubscriptionCreate, db: AsyncSession = Depends(get_db)):
    """Registers a browser Web Push API subscription endpoint and public keys."""
    stmt = select(PushSubscription).where(PushSubscription.endpoint == payload.endpoint)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()

    if existing:
        existing.device_id = payload.device_id
        existing.p256dh = payload.keys.p256dh
        existing.auth = payload.keys.auth
        existing.is_active = True
    else:
        new_sub = PushSubscription(
            device_id=payload.device_id,
            endpoint=payload.endpoint,
            p256dh=payload.keys.p256dh,
            auth=payload.keys.auth,
            is_active=True
        )
        db.add(new_sub)

    await db.commit()
    return {"success": True, "message": "Push notification subscription registered."}

@router.post("/test-push")
async def send_test_push_notification(payload: PushTestRequest, db: AsyncSession = Depends(get_db)):
    """Dispatches an immediate test push notification to verify the device's WebPush setup."""
    stmt = select(PushSubscription).where(
        PushSubscription.device_id == payload.device_id,
        PushSubscription.is_active == True
    )
    res = await db.execute(stmt)
    subscriptions = res.scalars().all()

    # Also save an in-app test notification
    test_notif = TriggeredNotification(
        device_id=payload.device_id,
        deal_id=1,
        title=payload.title,
        body=payload.body,
        icon="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=300&q=80",
        url=payload.url or "/feed",
        discount_percent=45.0,
        price=14999.0,
        store_name="Amazon EG",
        is_read=False
    )
    db.add(test_notif)
    await db.commit()

    if not subscriptions:
        return {
            "success": True,
            "webpush_dispatched": False,
            "message": "Saved to in-app notification center. (Enable Browser Push Notifications for background OS alerts)."
        }

    sent_count = 0
    for sub in subscriptions:
        ok = push_service.send_notification(
            subscription_info={
                "endpoint": sub.endpoint,
                "p256dh": sub.p256dh,
                "auth": sub.auth
            },
            payload={
                "title": payload.title,
                "body": payload.body,
                "icon": "/icons/icon-192.png",
                "badge": "/icons/badge-72.png",
                "data": {"url": payload.url}
            }
        )
        if ok:
            sent_count += 1

    return {
        "success": True,
        "webpush_dispatched": True,
        "active_devices_notified": sent_count,
        "message": f"Push notification dispatched to {sent_count} active device(s)."
    }

@router.get("/notifications", response_model=List[TriggeredNotificationResponse])
async def get_in_app_notifications(
    device_id: str = Query("default-device"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Fetches the in-app notification center history for a device."""
    stmt = (
        select(TriggeredNotification)
        .where(TriggeredNotification.device_id == device_id)
        .order_by(desc(TriggeredNotification.created_at))
        .limit(limit)
    )
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/notifications/{notification_id}/read")
async def mark_notification_as_read(notification_id: int, db: AsyncSession = Depends(get_db)):
    """Marks a single notification as read."""
    stmt = (
        update(TriggeredNotification)
        .where(TriggeredNotification.id == notification_id)
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()
    return {"success": True}

@router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(device_id: str = Query("default-device"), db: AsyncSession = Depends(get_db)):
    """Marks all notifications as read for a device."""
    stmt = (
        update(TriggeredNotification)
        .where(TriggeredNotification.device_id == device_id)
        .values(is_read=True)
    )
    await db.execute(stmt)
    await db.commit()
    return {"success": True}
