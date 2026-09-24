import json
import logging
from typing import Dict, Any, List, Optional
from pywebpush import webpush, WebPushException
from app.core.config import settings

logger = logging.getLogger("services.push")

class PushNotificationService:
    def __init__(self):
        self.public_key = settings.VAPID_PUBLIC_KEY
        self.private_key = settings.VAPID_PRIVATE_KEY
        self.claim_email = settings.VAPID_CLAIM_EMAIL

    def send_notification(
        self,
        subscription_info: Dict[str, Any],
        payload: Dict[str, Any],
        ttl: int = 86400
    ) -> bool:
        """
        Sends an encrypted Web Push notification to a single client subscription endpoint.
        """
        try:
            payload_str = json.dumps(payload)
            # Normalize subscription info
            sub_data = {
                "endpoint": subscription_info["endpoint"],
                "keys": {
                    "p256dh": subscription_info.get("p256dh") or subscription_info.get("keys", {}).get("p256dh"),
                    "auth": subscription_info.get("auth") or subscription_info.get("keys", {}).get("auth")
                }
            }

            webpush(
                subscription_info=sub_data,
                data=payload_str,
                vapid_private_key=self.private_key,
                vapid_claims={"sub": self.claim_email},
                ttl=ttl
            )
            logger.info(f"Web push sent successfully to {sub_data['endpoint'][:30]}...")
            return True
        except WebPushException as ex:
            logger.warning(f"WebPush failed: {str(ex)}")
            # 404 or 410 indicates expired/unregistered subscription
            if ex.response and ex.response.status_code in (404, 410):
                logger.info("Subscription has expired or unsubscribed.")
            return False
        except Exception as e:
            logger.error(f"Unexpected error in push notification delivery: {str(e)}")
            return False

push_service = PushNotificationService()
