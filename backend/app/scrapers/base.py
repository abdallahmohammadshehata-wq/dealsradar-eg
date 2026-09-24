import re
import random
import logging
from typing import Optional, Tuple, Dict, Any
import httpx
from bs4 import BeautifulSoup
from app.core.config import settings

logger = logging.getLogger("scrapers.base")

class BaseScraper:
    """
    Base scraper class implementing:
    - User-agent rotation
    - Circuit breaker pattern to fail gracefully on DOM shifts
    - Egyptian Pound (EGP / ج.م) price extraction & normalization
    - Discount percentage math
    """
    
    def __init__(self, name: str, domain: str):
        self.name = name
        self.domain = domain
        self.error_count = 0
        self.max_consecutive_errors = 5
        self.is_circuit_open = False

    def get_random_user_agent(self) -> str:
        return random.choice(settings.SCRAPER_USER_AGENTS)

    def get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": self.get_random_user_agent(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
        }

    async def fetch_html(self, url: str, timeout: float = 12.0) -> Optional[str]:
        """Fetches webpage HTML with circuit breaker protection."""
        if self.is_circuit_open:
            logger.warning(f"Circuit breaker is OPEN for {self.name}. Skipping live fetch.")
            return None

        try:
            async with httpx.AsyncClient(headers=self.get_headers(), follow_redirects=True, timeout=timeout) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    self.error_count = 0
                    return response.text
                elif response.status_code in (403, 429, 503):
                    logger.warning(f"{self.name} returned HTTP {response.status_code}")
                    self._record_error()
                    return None
                else:
                    logger.warning(f"{self.name} fetch failed with HTTP {response.status_code}")
                    return None
        except Exception as e:
            logger.error(f"Network error fetching {url} for {self.name}: {str(e)}")
            self._record_error()
            return None

    def _record_error(self):
        self.error_count += 1
        if self.error_count >= self.max_consecutive_errors:
            self.is_circuit_open = True
            logger.error(f"Circuit breaker tripped for {self.name} after {self.error_count} errors.")

    def reset_circuit(self):
        self.error_count = 0
        self.is_circuit_open = False

    @staticmethod
    def parse_egp_price(price_str: Optional[str]) -> Optional[float]:
        """
        Extracts clean numeric float from Egyptian price strings.
        Handles formats like:
        - "EGP 1,499.00"
        - "1,499 ج.م"
        - "جنيه 2,350.50"
        - "1499.00"
        - "EGP 15.200,00" / Arabic digits: "١٬٤٩٩"
        """
        if not price_str:
            return None
        
        # Convert Arabic numerals (٠-٩) and Arabic separators (٬ ٫) to Western
        arabic_digits = "٠١٢٣٤٥٦٧٨٩٬٫"
        western_digits = "0123456789,."
        trans_table = str.maketrans(arabic_digits, western_digits)
        cleaned = price_str.translate(trans_table)

        # Remove currency words
        cleaned = re.sub(r"(?i)(egp|le|ج\.م|جنيه|مصري|ج|l\.e)", "", cleaned)
        cleaned = cleaned.strip()

        # Find numbers, commas, and dots
        match = re.search(r"[\d,\.]+", cleaned)
        if not match:
            return None
        
        num_part = match.group(0)
        # Handle comma as thousands separator or decimal
        if "," in num_part and "." in num_part:
            if num_part.find(",") < num_part.find("."):
                num_part = num_part.replace(",", "")
            else:
                num_part = num_part.replace(".", "").replace(",", ".")
        elif "," in num_part:
            # If 2 decimals after comma (e.g. 50,00) or thousands (1,500)
            parts = num_part.split(",")
            if len(parts) == 2 and len(parts[1]) == 2:
                num_part = f"{parts[0]}.{parts[1]}"
            else:
                num_part = num_part.replace(",", "")
        
        try:
            val = float(num_part)
            return round(val, 2) if val > 0 else None
        except ValueError:
            return None

    @staticmethod
    def calculate_discount(current_price: float, original_price: float) -> float:
        """
        Calculates exact discount percentage:
        Discount % = ((Original - Current) / Original) * 100
        """
        if not original_price or original_price <= current_price or original_price <= 0:
            return 0.0
        disc = ((original_price - current_price) / original_price) * 100.0
        return round(disc, 1)
