import re
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("services.ai_multimodal")

class MultimodalParserService:
    """
    Bilingual (Arabic / Egyptian Dialect / English) NLP & Multi-modal Search Engine.
    Parses spoken voice queries and visual image uploads into structured search and alert parameters.
    """

    CATEGORIES_MAP = {
        "electronics": ["شاشة", "تلفزيون", "موبايل", "تليفون", "ايفون", "سامسونج", "سماعة", "سماعات", "لابتوب", "كمبيوتر", "ايباد", "تابلت", "tv", "phone", "iphone", "laptop", "audio", "headphone", "earbuds", "monitor"],
        "home_kitchen": ["قلاية", "ماكينة قهوة", "اسبريسو", "عجانة", "خلاط", "ميكروويف", "غسالة", "ثلاجة", "مطبخ", "air fryer", "coffee", "espresso", "blender", "kitchen", "microwave"],
        "fashion": ["حذاء", "كوتشي", "شوز", "بنطلون", "قميص", "تيشيرت", "جاكيت", "فستان", "ملابس", "shoes", "sneakers", "pants", "shirt", "jacket", "dress", "fashion"],
        "beauty": ["عطر", "برفيوم", "سيروم", "كريم", "مكياج", "شعر", "ديور", "نيفيا", "براون", "perfume", "fragrance", "serum", "cream", "beauty", "makeup"],
        "supermarket": ["زيت", "مسحوق", "منظف", "شاي", "سكر", "نسكافيه", "سوبرماركت", "detergent", "oil", "tea", "grocery", "supermarket"]
    }

    BRANDS_MAP = {
        "samsung": ["سامسونج", "samsung"],
        "apple": ["ابل", "أبل", "ايفون", "آيفون", "apple", "iphone", "macbook", "ipad"],
        "xiaomi": ["شاومي", "ريدمي", "xiaomi", "redmi"],
        "sony": ["سوني", "sony"],
        "lg": ["ال جي", "إل جي", "lg"],
        "philips": ["فيليبس", "philips"],
        "black_decker": ["بلاك اند ديكر", "بلاك أند ديكر", "black & decker", "black and decker"],
        "tornado": ["تورنيدو", "tornado"],
        "delonghi": ["ديلونجي", "delonghi"],
        "adidas": ["اديداس", "أديداس", "adidas"],
        "nike": ["نايكي", "نايك", "nike"],
        "dior": ["ديور", "dior"],
        "braun": ["براون", "braun"],
        "nivea": ["نيفيا", "nivea"],
        "ariel": ["اريال", "أريال", "ariel"],
        "kenwood": ["كينوود", "kenwood"],
        "anker": ["انكر", "أنكر", "anker"]
    }

    STORES_MAP = {
        "Amazon EG": ["امازون", "أمازون", "amazon"],
        "Noon EG": ["نون", "noon"],
        "Jumia EG": ["جوميا", "jumia"]
    }

    ARABIC_NUMERALS_MAP = {
        "عشرة": 10, "عشرين": 20, "ثلاثين": 30, "اربعين": 40, "أربعين": 40,
        "خمسين": 50, "ستين": 60, "سبعين": 70, "ثمانين": 80, "تسعين": 90,
        "مية": 100, "مائة": 100, "الف": 1000, "ألف": 1000, "الفين": 2000, "ألفين": 2000,
        "ثلاثة الاف": 3000, "خمسة الاف": 5000, "عشرة الاف": 10000, "عشرين الف": 20000
    }

    def parse_voice_query(self, transcript: str) -> Dict[str, Any]:
        """
        Parses spoken phrase into structured query parameters.
        Example: "عايز شاشة سامسونج 55 بوصة عليها خصم أكتر من ثلاثين في المية وسعرها أقل من عشرين ألف على أمازون أو نون"
        """
        text = transcript.strip().lower()
        extracted: Dict[str, Any] = {
            "query": "",
            "category": None,
            "brand": None,
            "min_discount": None,
            "max_price": None,
            "min_price": None,
            "stores": []
        }

        # 1. Detect Category
        for cat, keywords in self.CATEGORIES_MAP.items():
            if any(k in text for k in keywords):
                if cat == "electronics":
                    extracted["category"] = "Electronics"
                elif cat == "home_kitchen":
                    extracted["category"] = "Home & Kitchen"
                elif cat == "fashion":
                    extracted["category"] = "Fashion"
                elif cat == "beauty":
                    extracted["category"] = "Beauty & Personal Care"
                elif cat == "supermarket":
                    extracted["category"] = "Supermarket"
                break

        # 2. Detect Brand
        canonical_brand_names = {
            "samsung": "Samsung",
            "apple": "Apple",
            "xiaomi": "Xiaomi",
            "sony": "Sony",
            "lg": "LG",
            "philips": "Philips",
            "black_decker": "Black & Decker",
            "tornado": "Tornado",
            "delonghi": "DeLonghi",
            "adidas": "Adidas",
            "nike": "Nike",
            "dior": "Dior",
            "braun": "Braun",
            "nivea": "Nivea",
            "ariel": "Ariel",
            "kenwood": "Kenwood",
            "anker": "Anker"
        }
        for brand_key, keywords in self.BRANDS_MAP.items():
            if any(k in text for k in keywords):
                extracted["brand"] = canonical_brand_names.get(brand_key, brand_key.title())
                break

        # 3. Detect Stores
        for store_name, keywords in self.STORES_MAP.items():
            if any(k in text for k in keywords):
                extracted["stores"].append(store_name)

        # 4. Detect Discount % (Numbers, % signs, Arabic words)
        # e.g., "خصم 30%", "خصم اكتر من ثلاثين في المية", "discount > 40%"
        discount_match = re.search(r"(?:خصم|تخفيض|discount)\s*(?:أكتر من|اكتر من|أكثر من|اكثر من|over|>)?\s*(\d+)\s*(?:%|في المية|بالمية|percent)?", text)
        if discount_match:
            extracted["min_discount"] = float(discount_match.group(1))
        else:
            # Check arabic number words
            for word, val in self.ARABIC_NUMERALS_MAP.items():
                if f"خصم {word}" in text or f"{word} في المية" in text or f"{word} بالمية" in text:
                    extracted["min_discount"] = float(val)
                    break

        # 5. Detect Price Bounds (e.g. "أقل من 2500 جنيه", "تحت 5000", "under 3000 egp")
        max_price_match = re.search(r"(?:أقل من|اقل من|تحت|سعرها أقل من|under|less than|below|max)\s*(\d+(?:,\d+)?)\s*(?:جنيه|ج\.م|egp)?", text)
        if max_price_match:
            extracted["max_price"] = float(max_price_match.group(1).replace(",", ""))
        else:
            # Check compound arabic number words (e.g. "ألفين وخمسمية" -> 2500, "عشرين ألف" -> 20000)
            if "الفين وخمسمية" in text or "ألفين وخمسمية" in text:
                extracted["max_price"] = 2500.0
            elif "عشرين الف" in text or "عشرين ألف" in text:
                extracted["max_price"] = 20000.0
            elif "عشرة الاف" in text or "عشرة آلاف" in text:
                extracted["max_price"] = 10000.0
            elif "خمسة الاف" in text or "خمسة آلاف" in text:
                extracted["max_price"] = 5000.0

        # 6. Extract core search keywords after stripping stopwords
        stopwords = [
            "عايز", "عاوز", "ابحث عن", "دور على", "هاتلي", "جبلي", "اريد", "صفقات", "عروض",
            "خصومات", "ارخص", "أرخص", "أحسن", "افضل", "أفضل", "سعر", "اسعار", "أسعار",
            "i want", "search for", "find me", "deals on", "cheap", "best"
        ]
        clean_q = text
        for sw in stopwords:
            clean_q = clean_q.replace(sw, " ")
        
        # Remove discount/price clauses
        clean_q = re.sub(r"(?:خصم|تخفيض|discount).*?(?:%|المية|بالمية|$)", " ", clean_q)
        clean_q = re.sub(r"(?:سعر|اقل من|أقل من|تحت|under|below).*?(?:جنيه|egp|$)", " ", clean_q)
        clean_q = re.sub(r"(?:على|في|من)\s*(?:أمازون|امازون|نون|جوميا)", " ", clean_q)
        clean_q = re.sub(r"\s+", " ", clean_q).strip()

        extracted["query"] = clean_q if len(clean_q) > 2 else (extracted["brand"] or extracted["category"] or "")

        return extracted

    def parse_image_upload(self, image_base64: str, filename: Optional[str] = None) -> Dict[str, Any]:
        """
        Simulates visual feature extraction & OCR detection on uploaded product photos
        (e.g., shoes, espresso machines, phones, cosmetics boxes) to identify the item.
        """
        # Heuristic analysis based on filename or data length tokens
        detected_title = "Smart Electronics / Premium Household Product"
        detected_title_ar = "منتج إلكتروني ذكي / أجهزة منزلية"
        predicted_cat = "Electronics"
        detected_brand = "Samsung"
        ocr_tokens = ["55 INCH", "4K UHD", "SMART TV", "HDR10+", "SERIES 7"]

        lower_fn = (filename or "").lower()
        if any(w in lower_fn for w in ["shoe", "sneaker", "adidas", "nike", "footwear"]):
            detected_title = "Men's Lightweight Sports Running Shoes"
            detected_title_ar = "حذاء جري رياضي للرجال خفيف الوزن"
            predicted_cat = "Fashion"
            detected_brand = "Adidas"
            ocr_tokens = ["ADIDAS", "DURAMO", "BOOST", "SIZE 43", "RUNNING"]
        elif any(w in lower_fn for w in ["coffee", "espresso", "delonghi", "philips"]):
            detected_title = "Automatic Espresso & Coffee Machine with Milk Frother"
            detected_title_ar = "ماكينة قهوة اسبريسو اوتوماتيكية مع صانع رغوة"
            predicted_cat = "Home & Kitchen"
            detected_brand = "DeLonghi"
            ocr_tokens = ["DELONGHI", "DEDICA", "15 BAR", "ESPRESSO", "STAINLESS"]
        elif any(w in lower_fn for w in ["perfume", "dior", "sauvage", "fragrance"]):
            detected_title = "Luxury Eau De Parfum Natural Vaporisateur"
            detected_title_ar = "عطر فاخر او دي بارفان بخاخ طبيعي"
            predicted_cat = "Beauty & Personal Care"
            detected_brand = "Dior"
            ocr_tokens = ["DIOR", "SAUVAGE", "100 ML", "EAU DE PARFUM"]
        elif any(w in lower_fn for w in ["phone", "iphone", "redmi", "galaxy"]):
            detected_title = "Flagship Smartphone OLED Display Dual SIM"
            detected_title_ar = "هاتف ذكي فلاجشيب شاشة اوليد شريحتين"
            predicted_cat = "Electronics"
            detected_brand = "Samsung"
            ocr_tokens = ["GALAXY", "5G", "128GB", "AMOLED", "DUAL SIM"]

        return {
            "detected_product": detected_title,
            "detected_product_ar": detected_title_ar,
            "predicted_category": predicted_cat,
            "detected_brand": detected_brand,
            "extracted_text_ocr": ocr_tokens,
            "confidence": 0.94
        }

    async def parse_with_gemini_nlp(self, transcript: str) -> Dict[str, Any]:
        """Enhanced voice query parsing powered by Google Gemini AI with heuristic fallback."""
        from app.core.config import settings
        import httpx
        import json

        base_extracted = self.parse_voice_query(transcript)
        if not settings.GEMINI_API_KEY:
            return base_extracted

        try:
            prompt = f"""You are an Arabic & Egyptian Dialect NLP engine for an Egyptian deals aggregator.
Parse this voice search into structured JSON:
User Spoken Query: "{transcript}"

Respond with ONLY valid JSON with keys:
- query: string (cleaned search keyword)
- category: string or null (one of: 'Electronics', 'Home & Kitchen', 'Fashion', 'Beauty & Personal Care', 'Supermarket')
- brand: string or null (e.g. 'Samsung', 'Apple', 'Xiaomi', 'Adidas')
- min_discount: number or null (e.g. 30 for 30%)
- max_price: number or null (in EGP)
- min_price: number or null (in EGP)
- stores: list of strings (e.g. ['Amazon EG', 'Noon EG', 'Jumia EG'])
"""
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        raw_txt = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        parsed = json.loads(raw_txt)
                        if isinstance(parsed, dict) and parsed.get("query"):
                            return {**base_extracted, **parsed}
        except Exception as e:
            logger.debug(f"Gemini voice NLP skipped: {e}")

        return base_extracted

multimodal_service = MultimodalParserService()
