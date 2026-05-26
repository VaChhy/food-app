"""
controllers/order_controller.py
Business logic for order processing
"""
from utils.helpers import (
    get_orders, save_orders, create_order,
    update_order_status, get_timestamp, generate_order_id
)


def validate_order(data):
    """Validate order data before processing."""
    errors = []

    if not data.get('items') or len(data['items']) == 0:
        errors.append('Cart is empty')

    if not data.get('phone', '').strip():
        errors.append('Phone number is required')

    if not data.get('delivery_address', '').strip():
        errors.append('Delivery address is required')

    # Validate items structure
    for item in data.get('items', []):
        if not item.get('id'):
            errors.append('Invalid item in cart')
            break
        if not isinstance(item.get('quantity'), int) or item['quantity'] < 1:
            errors.append('Invalid item quantity')
            break
        if not isinstance(item.get('price'), (int, float)) or item['price'] < 0:
            errors.append('Invalid item price')
            break

    return errors


def process_new_order(data):
    """Validate and create a new order."""
    errors = validate_order(data)
    if errors:
        return None, errors[0]

    # Recalculate total server-side for security
    calculated_total = sum(
        float(item.get('price', 0)) * int(item.get('quantity', 1))
        for item in data.get('items', [])
    )
    data['total'] = round(calculated_total, 2)

    order = create_order(data)
    return order, None


def get_orders_by_status(status=None):
    """Get orders optionally filtered by status."""
    orders = get_orders()
    if status:
        orders = [o for o in orders if o.get('status') == status]
    return sorted(orders, key=lambda x: x.get('created_at', ''), reverse=True)


def get_orders_by_user(telegram_id):
    """Get all orders for a specific user."""
    orders = get_orders()
    user_orders = [o for o in orders if o.get('telegram_id') == str(telegram_id)]
    return sorted(user_orders, key=lambda x: x.get('created_at', ''), reverse=True)
