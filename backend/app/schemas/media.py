from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class VoiceParseRequest(BaseModel):
    transcript: Optional[str] = Field(None, description="Spoken transcript in Arabic or English")
    audio_base64: Optional[str] = Field(None, description="Optional raw audio base64 payload")

class VoiceParseResponse(BaseModel):
    recognized_transcript: str
    detected_language: str
    parsed_filters: Dict[str, Any] = Field(
        ...,
        description="Extracted filter parameters: category, brand, query, min_discount, max_price, store"
    )
    confidence: float = 0.95
    suggested_action: str

class ImageParseRequest(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image string (JPEG/PNG/WEBP)")
    filename: Optional[str] = None

class ImageParseResponse(BaseModel):
    detected_product: str
    detected_product_ar: Optional[str] = None
    predicted_category: str
    detected_brand: Optional[str] = None
    extracted_text_ocr: List[str] = []
    confidence: float = 0.92
    matched_deal_ids: List[int] = []
