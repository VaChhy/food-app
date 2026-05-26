"""
utils/helpers.py - Utility functions for the Food Order App
"""
import json
import os
import uuid
from datetime import datetime

# File paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
MENU_FILE = os.path.join(DATA_DIR, 'menu.json')
ORDERS_FILE = os.path.join(DATA_DIR, 'orders.json')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')


def read_json(filepath):
    """Read JSON file and return data."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def write_json(filepath, data):
    """Write data to JSON file."""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_menu():
    """Get all menu items."""
    return read_json(MENU_FILE)


def get_menu_item(item_id):
    """Get a single menu item by ID."""
    menu = get_menu()
    for item in menu:
        if item['id'] == str(item_id):
            return item
    return None


def save_menu(menu):
    """Save menu data."""
    write_json(MENU_FILE, menu)


def get_orders():
    """Get all orders."""
    return read_json(ORDERS_FILE)


def get_order(order_id):
    """Get a single order by ID."""
    orders = get_orders()
    for order in orders:
        if order['id'] == str(order_id):
            return order
    return None


def save_orders(orders):
    """Save orders data."""
    write_json(ORDERS_FILE, orders)


def get_users():
    """Get all users."""
    return read_json(USERS_FILE)


def save_users(users):
    """Save users data."""
    write_json(USERS_FILE, users)


def generate_order_id():
    """Generate a unique order ID like ORD-20240101-XXXX."""
    date_str = datetime.now().strftime('%Y%m%d')
    unique = str(uuid.uuid4())[:4].upper()
    return f"ORD-{date_str}-{unique}"


def get_timestamp():
    """Get current timestamp as string."""
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def save_user(telegram_user):
    """Save or update a Telegram user."""
    users = get_users()
    user_id = str(telegram_user.get('id', ''))
    
    # Check if user already exists
    for i, user in enumerate(users):
        if user.get('telegram_id') == user_id:
            # Update existing user
            users[i]['last_seen'] = get_timestamp()
            users[i]['first_name'] = telegram_user.get('first_name', '')
            users[i]['last_name'] = telegram_user.get('last_name', '')
            users[i]['username'] = telegram_user.get('username', '')
            save_users(users)
            return users[i]
    
    # New user
    new_user = {
        'telegram_id': user_id,
        'first_name': telegram_user.get('first_name', ''),
        'last_name': telegram_user.get('last_name', ''),
        'username': telegram_user.get('username', ''),
        'joined': get_timestamp(),
        'last_seen': get_timestamp()
    }
    users.append(new_user)
    save_users(users)
    return new_user


def create_order(order_data):
    """Create a new order and save it."""
    orders = get_orders()
    
    order = {
        'id': generate_order_id(),
        'telegram_id': str(order_data.get('telegram_id', '')),
        'user_name': order_data.get('user_name', 'Guest'),
        'items': order_data.get('items', []),
        'total': order_data.get('total', 0),
        'delivery_address': order_data.get('delivery_address', ''),
        'phone': order_data.get('phone', ''),
        'note': order_data.get('note', ''),
        'status': 'pending',  # pending, accepted, rejected, delivered
        'reject_reason': '',
        'created_at': get_timestamp(),
        'updated_at': get_timestamp()
    }
    
    orders.append(order)
    save_orders(orders)
    return order


def update_order_status(order_id, status, reason=''):
    """Update order status."""
    orders = get_orders()
    
    for i, order in enumerate(orders):
        if order['id'] == str(order_id):
            orders[i]['status'] = status
            orders[i]['reject_reason'] = reason
            orders[i]['updated_at'] = get_timestamp()
            save_orders(orders)
            return orders[i]
    
    return None


def get_stats():
    """Get dashboard statistics."""
    orders = get_orders()
    menu = get_menu()
    users = get_users()
    
    total_orders = len(orders)
    pending_orders = len([o for o in orders if o['status'] == 'pending'])
    accepted_orders = len([o for o in orders if o['status'] == 'accepted'])
    rejected_orders = len([o for o in orders if o['status'] == 'rejected'])
    total_revenue = sum(o.get('total', 0) for o in orders if o['status'] == 'accepted')
    
    return {
        'total_orders': total_orders,
        'pending_orders': pending_orders,
        'accepted_orders': accepted_orders,
        'rejected_orders': rejected_orders,
        'total_revenue': round(total_revenue, 2),
        'total_menu_items': len(menu),
        'available_items': len([m for m in menu if m.get('available', True)]),
        'total_customers': len(users),
        'recent_orders': sorted(orders, key=lambda x: x.get('created_at', ''), reverse=True)[:5]
    }
