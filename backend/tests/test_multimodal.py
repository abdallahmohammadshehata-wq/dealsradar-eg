import pytest
from app.services.ai_multimodal import multimodal_service

def test_parse_voice_arabic_egyptian_query():
    text = "عايز شاشة سامسونج 55 بوصة عليها خصم أكتر من ثلاثين في المية وسعرها أقل من عشرين ألف"
    res = multimodal_service.parse_voice_query(text)
    
    assert res["category"] == "Electronics"
    assert res["brand"] == "Samsung"
    assert res["min_discount"] == 30.0
    assert res["max_price"] == 20000.0

def test_parse_voice_coffee_machine_query():
    text = "دور على ماكينة قهوة ديلونجي خصم 40% تحت 3000 جنيه على أمازون"
    res = multimodal_service.parse_voice_query(text)
    
    assert res["category"] == "Home & Kitchen"
    assert res["brand"] == "DeLonghi"
    assert res["min_discount"] == 40.0
    assert res["max_price"] == 3000.0
    assert "Amazon EG" in res["stores"]

def test_parse_image_upload():
    res = multimodal_service.parse_image_upload(
        image_base64="data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        filename="adidas_shoes_running.jpg"
    )
    assert res["predicted_category"] == "Fashion"
    assert res["detected_brand"] == "Adidas"
    assert "ADIDAS" in res["extracted_text_ocr"]
