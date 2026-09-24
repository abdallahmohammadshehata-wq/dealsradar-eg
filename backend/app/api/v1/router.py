from fastapi import APIRouter
from app.api.v1.deals import router as deals_router
from app.api.v1.stores import router as stores_router
from app.api.v1.alerts import router as alerts_router
from app.api.v1.media import router as media_router

api_router = APIRouter()

api_router.include_router(deals_router, prefix="/deals", tags=["Deals"])
api_router.include_router(stores_router, prefix="/stores", tags=["Stores"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["Alerts & Push Notifications"])
api_router.include_router(media_router, prefix="/media", tags=["Multi-Modal Search"])
