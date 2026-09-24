import datetime
import logging
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.deal import Deal
from app.models.alert import AlertRule, PushSubscription, TriggeredNotification
from app.services.push_service import push_service

logger = logging.getLogger("services.alert_evaluator")

class AlertEvaluatorService:
    async def evaluate_deals(self, deals: List[Deal], db: AsyncSession):
        """
        Evaluates deals against active Alert Rules with 24-hour cooldown protection.
        Generates in-app notifications and sends WebPush alerts.
        """
        if not deals:
            return

        stmt_rules = select(AlertRule).where(AlertRule.is_active == True)
        res_rules = await db.execute(stmt_rules)
        active_rules = res_rules.scalars().all()

        if not active_rules:
            return

        now = datetime.datetime.utcnow()
        cooldown_threshold = now - datetime.timedelta(hours=24)

        for deal in deals:
            for rule in active_rules:
                if not self._match_deal_to_rule(deal, rule):
                    continue

                # Check 24h cooldown: has this device received a notification for this deal recently?
                stmt_recent = select(TriggeredNotification).where(
                    and_(
                        TriggeredNotification.device_id == rule.device_id,
                        TriggeredNotification.deal_id == deal.id,
                        TriggeredNotification.created_at >= cooldown_threshold
                    )
                )
                res_recent = await db.execute(stmt_recent)
                if res_recent.scalar_one_or_none():
                    # Cooldown active; skip duplicate alert
                    continue

                # Create notification payload
                notif_title = f"🔥 {deal.discount_percent:.0f}% OFF on {deal.brand or deal.store_name}!"
                notif_body = f"{deal.title[:80]} is now only {deal.current_price:,.0f} EGP (was {deal.original_price:,.0f} EGP) on {deal.store_name}."
                if deal.is_all_time_low:
                    notif_body += " ⚡ All-time lowest price recorded!"

                # Save to in-app notification center
                notif_record = TriggeredNotification(
                    device_id=rule.device_id,
                    alert_rule_id=rule.id,
                    deal_id=deal.id,
                    title=notif_title,
                    body=notif_body,
                    icon=deal.image_url,
                    url=deal.url,
                    discount_percent=deal.discount_percent,
                    price=deal.current_price,
                    store_name=deal.store_name,
                    is_read=False,
                    created_at=now
                )
                db.add(notif_record)

                rule.last_triggered_at = now

                # Dispatch native WebPush notification if subscription exists
                stmt_sub = select(PushSubscription).where(
                    and_(
                        PushSubscription.device_id == rule.device_id,
                        PushSubscription.is_active == True
                    )
                )
                res_sub = await db.execute(stmt_sub)
                subscriptions = res_sub.scalars().all()

                for sub in subscriptions:
                    push_payload = {
                        "title": notif_title,
                        "body": notif_body,
                        "icon": deal.image_url or "/icons/icon-192.png",
                        "badge": "/icons/badge-72.png",
                        "data": {
                            "dealId": deal.id,
                            "url": deal.url,
                            "discount": deal.discount_percent,
                            "price": deal.current_price
                        }
                    }
                    push_service.send_notification(
                        subscription_info={
                            "endpoint": sub.endpoint,
                            "p256dh": sub.p256dh,
                            "auth": sub.auth
                        },
                        payload=push_payload
                    )

        await db.commit()

    def _match_deal_to_rule(self, deal: Deal, rule: AlertRule) -> bool:
        """Checks if a deal meets the criteria of an alert rule."""
        # 1. Discount % check
        if deal.discount_percent < rule.min_discount:
            return False

        # 2. Max price check
        if rule.max_price is not None and deal.current_price > rule.max_price:
            return False

        # 3. Min price check
        if rule.min_price is not None and deal.current_price < rule.min_price:
            return False

        # 4. Stores check
        if rule.stores and len(rule.stores) > 0:
            if deal.store_name not in rule.stores:
                return False

        # 5. Category check
        if rule.category and rule.category.lower() != "all":
            if deal.category.lower() != rule.category.lower():
                return False

        # 6. Brand check
        if rule.brand:
            if not deal.brand or rule.brand.lower() not in deal.brand.lower():
                return False

        # 7. Keyword query text check
        if rule.query_text:
            q = rule.query_text.lower().strip()
            title_en = (deal.title or "").lower()
            title_ar = (deal.title_ar or "").lower()
            if q not in title_en and q not in title_ar:
                return False

        return True

alert_evaluator = AlertEvaluatorService()
