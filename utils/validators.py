"""
utils/validators.py — Input validation utilities
"""
import re


def validate_phone(phone):
    """Basic phone number validation."""
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
    return len(cleaned) >= 8 and cleaned.isdigit()


def validate_price(price):
    """Validate price is a positive number."""
    try:
        p = float(price)
        return p >= 0
    except (TypeError, ValueError):
        return False


def validate_string(value, min_len=1, max_len=500):
    """Validate a string field."""
    if not isinstance(value, str):
        return False
    stripped = value.strip()
    return min_len <= len(stripped) <= max_len


def sanitize_string(value, max_len=500):
    """Sanitize and truncate a string."""
    if not isinstance(value, str):
        return ''
    return value.strip()[:max_len]


def validate_category(category):
    """Validate menu category."""
    allowed = {'main', 'noodle', 'dessert', 'drink', 'appetizer'}
    return category in allowed
