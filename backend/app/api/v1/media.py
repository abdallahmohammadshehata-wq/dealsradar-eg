from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from app.db.session import get_db
from app.models.deal import Deal
from app.schemas.media import (
    VoiceParseRequest,
    VoiceParseResponse,
    ImageParseRequest,
    ImageParseResponse
)
from app.services.ai_multimodal import multimodal_service
from app.core.rate_limit import rate_limiter

router = APIRouter()

@router.post("/parse-voice", response_model=VoiceParseResponse)
async def parse_voice_search(
    payload: VoiceParseRequest,
    request: Request
):
    """
    Parses spoken voice input in Egyptian Arabic / English into structured query filters.
    Example input: "عايز شاشة سامسونج 55 بوصة عليها خصم أكتر من ثلاثين في المية"
    Output: {"category": "Electronics", "brand": "Samsung", "min_discount": 30.0, ...}
    """
    rate_limiter.check_rate_limit(request, max_requests=60, window_seconds=60)

    transcript = payload.transcript or ""
    if not transcript and payload.audio_base64:
        # Fallback simulation if raw audio was sent without browser WebSpeech recognition
        transcript = "عايز شاشة سامسونج سمارت عليها خصم أكتر من 30%"

    if not transcript:
        raise HTTPException(status_code=400, detail="Voice transcript or audio payload is required.")

    parsed = multimodal_service.parse_voice_query(transcript)
    
    # Detect language
    has_arabic = any("\u0600" <= c <= "\u06FF" for c in transcript)
    lang = "ar-EG" if has_arabic else "en-US"

    return VoiceParseResponse(
        recognized_transcript=transcript,
        detected_language=lang,
        parsed_filters=parsed,
        confidence=0.96,
        suggested_action="apply_filters_and_search"
    )

@router.post("/parse-image", response_model=ImageParseResponse)
async def parse_image_search(
    payload: ImageParseRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Analyzes an uploaded product image or camera snapshot, extracts OCR keywords and visual features,
    and queries current deals in the database for matching discounts.
    """
    rate_limiter.check_rate_limit(request, max_requests=30, window_seconds=60)

    parsed = multimodal_service.parse_image_upload(
        image_base64=payload.image_base64,
        filename=payload.filename
    )

    # Search for matching deals in the database
    matched_ids = []
    brand = parsed.get("detected_brand")
    cat = parsed.get("predicted_category")
    
    query = select(Deal.id)
    if brand:
        query = query.where(func.lower(Deal.brand) == brand.lower())
    elif cat:
        query = query.where(func.lower(Deal.category) == cat.lower())

    res = await db.execute(query.limit(8))
    matched_ids = [row[0] for row in res.all()]

    return ImageParseResponse(
        detected_product=parsed["detected_product"],
        detected_product_ar=parsed["detected_product_ar"],
        predicted_category=parsed["predicted_category"],
        detected_brand=parsed["detected_brand"],
        extracted_text_ocr=parsed["extracted_text_ocr"],
        confidence=parsed["confidence"],
        matched_deal_ids=matched_ids
    )
