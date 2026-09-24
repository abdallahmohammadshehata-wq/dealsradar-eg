import pytest
import pytest_asyncio
import httpx
from app.main import app
from app.db.init_db import init_db

@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    await init_db()

@pytest.mark.asyncio
async def test_alert_rules_crud_and_push():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Create alert rule
        rule_payload = {
            "device_id": "test-device-123",
            "name": "Sony Headphones Alert",
            "query_text": "Sony",
            "category": "Electronics",
            "min_discount": 30.0,
            "max_price": 25000.0,
            "stores": ["Amazon EG"]
        }
        resp = await client.post("/api/v1/alerts", json=rule_payload)
        assert resp.status_code == 201
        created_rule = resp.json()
        assert created_rule["name"] == "Sony Headphones Alert"
        rule_id = created_rule["id"]

        # List alert rules
        resp_list = await client.get("/api/v1/alerts?device_id=test-device-123")
        assert resp_list.status_code == 200
        rules = resp_list.json()
        assert any(r["id"] == rule_id for r in rules)

        # Test Push subscription registration
        sub_payload = {
            "device_id": "test-device-123",
            "endpoint": "https://fcm.googleapis.com/fcm/send/sample-token",
            "keys": {
                "p256dh": "BKVgQW1X_sample_p256dh_key",
                "auth": "sample_auth_secret_key"
            }
        }
        resp_sub = await client.post("/api/v1/alerts/subscribe", json=sub_payload)
        assert resp_sub.status_code == 200
        assert resp_sub.json()["success"] is True

        # Test Trigger test push
        resp_test_push = await client.post("/api/v1/alerts/test-push", json={
            "device_id": "test-device-123",
            "title": "Test Alert",
            "body": "Test discount body"
        })
        assert resp_test_push.status_code == 200

        # Check in-app notification center
        resp_notifs = await client.get("/api/v1/alerts/notifications?device_id=test-device-123")
        assert resp_notifs.status_code == 200
        notifs = resp_notifs.json()
        assert len(notifs) >= 1

        # Delete rule
        resp_del = await client.delete(f"/api/v1/alerts/{rule_id}")
        assert resp_del.status_code == 200
