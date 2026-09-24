import hashlib
import re
import ipaddress
from urllib.parse import urlparse, urlunparse

def canonicalize_url(url: str) -> str:
    """
    Cleans tracking query parameters (utm_*, ref, tag, etc.) and normalizes URLs
    for reliable deduplication across crawls.
    """
    if not url:
        return ""
    try:
        parsed = urlparse(url.strip())
        # Remove common tracking parameters
        clean_query = []
        if parsed.query:
            params = parsed.query.split("&")
            for p in params:
                if not any(p.lower().startswith(prefix) for prefix in ["utm_", "ref=", "ref_", "tag=", "fbclid=", "gclid="]):
                    clean_query.append(p)
        
        # Reconstruct clean url
        clean_url = urlunparse((
            parsed.scheme.lower(),
            parsed.netloc.lower(),
            parsed.path,
            parsed.params,
            "&".join(clean_query),
            "" # strip fragment
        ))
        return clean_url
    except Exception:
        return url.strip()

def hash_url(url: str) -> str:
    """Generates a SHA-256 hash of the canonical URL."""
    clean = canonicalize_url(url)
    return hashlib.sha256(clean.encode("utf-8")).hexdigest()

def is_safe_external_url(url: str) -> bool:
    """
    Validates custom store URLs against SSRF (Server-Side Request Forgery) attacks.
    Blocks localhost, private IP spaces, non-http/https protocols, and internal metadata endpoints.
    """
    if not url:
        return False
    try:
        parsed = urlparse(url.strip())
        if parsed.scheme not in ("http", "https"):
            return False
        
        hostname = parsed.hostname
        if not hostname:
            return False
        
        # Check forbidden local names
        forbidden_hosts = {"localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal", "instance-data"}
        if hostname.lower() in forbidden_hosts or hostname.endswith(".local") or hostname.endswith(".internal"):
            return False
        
        # Check IP address range
        try:
            ip = ipaddress.ip_address(hostname)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                return False
        except ValueError:
            # It's a regular domain name
            pass
            
        return True
    except Exception:
        return False

def clean_text(text: str) -> str:
    """Strips excessive whitespace and HTML artefacts from extracted text."""
    if not text:
        return ""
    # Remove HTML tags if any
    cleaned = re.sub(r"<[^>]+>", " ", text)
    # Normalize spaces
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned
