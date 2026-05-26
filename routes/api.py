"""
routes/api.py - REST API endpoints for the Food Order App
"""
import os
import uuid
from flask import Blueprint, request, jsonify, session
from werkzeug.utils import secure_filename
from utils.helpers import (
    get_menu, get_menu_item, save_menu, get_orders, get_order,
    create_order, update_order_status, save_user, get_stats, get_timestamp
)

api = Blueprint('api', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ─── MENU ROUTES ────────────────────────────────────────────────────────────

@api.route('/menu', methods=['GET'])
def get_menu_items():
    """Get all menu items. Filter by category if provided."""
    menu = get_menu()
    category = request.args.get('category')
    available_only = request.args.get('available') == 'true'
    
    if category and category != 'all':
        menu = [item for item in menu if item.get('category') == category]
    
    if available_only:
        menu = [item for item in menu if item.get('available', True)]
    
    return jsonify({'success': True, 'data': menu})


@api.route('/menu/<item_id>', methods=['GET'])
def get_single_menu_item(item_id):
    """Get a single menu item."""
    item = get_menu_item(item_id)
    if not item:
        return jsonify({'success': False, 'message': 'Item not found'}), 404
    return jsonify({'success': True, 'data': item})


@api.route('/menu', methods=['POST'])
def add_menu_item():
    """Add a new menu item (Admin only)."""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    menu = get_menu()
    
    # Handle image upload
    image_path = '/static/images/placeholder-food.jpg'
    if 'image' in request.files:
        file = request.files['image']
        if file and allowed_file(file.filename):
            filename = str(uuid.uuid4()) + '.' + file.filename.rsplit('.', 1)[1].lower()
            file.save(os.path.join(UPLOAD_FOLDER, filename))
            image_path = f'/uploads/{filename}'
    
    new_item = {
        'id': str(uuid.uuid4())[:8],
        'name_en': request.form.get('name_en', ''),
        'name_km': request.form.get('name_km', ''),
        'description_en': request.form.get('description_en', ''),
        'description_km': request.form.get('description_km', ''),
        'price': float(request.form.get('price', 0)),
        'category': request.form.get('category', 'main'),
        'image': image_path,
        'available': request.form.get('available', 'true') == 'true'
    }
    
    menu.append(new_item)
    save_menu(menu)
    
    return jsonify({'success': True, 'data': new_item, 'message': 'Menu item added successfully'})


@api.route('/menu/<item_id>', methods=['PUT'])
def update_menu_item(item_id):
    """Update a menu item (Admin only)."""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    menu = get_menu()
    
    for i, item in enumerate(menu):
        if item['id'] == str(item_id):
            # Handle image upload
            if 'image' in request.files:
                file = request.files['image']
                if file and allowed_file(file.filename):
                    filename = str(uuid.uuid4()) + '.' + file.filename.rsplit('.', 1)[1].lower()
                    file.save(os.path.join(UPLOAD_FOLDER, filename))
                    menu[i]['image'] = f'/uploads/{filename}'
            
            menu[i]['name_en'] = request.form.get('name_en', item['name_en'])
            menu[i]['name_km'] = request.form.get('name_km', item['name_km'])
            menu[i]['description_en'] = request.form.get('description_en', item['description_en'])
            menu[i]['description_km'] = request.form.get('description_km', item['description_km'])
            menu[i]['price'] = float(request.form.get('price', item['price']))
            menu[i]['category'] = request.form.get('category', item['category'])
            menu[i]['available'] = request.form.get('available', str(item['available'])).lower() == 'true'
            
            save_menu(menu)
            return jsonify({'success': True, 'data': menu[i], 'message': 'Updated successfully'})
    
    return jsonify({'success': False, 'message': 'Item not found'}), 404


@api.route('/menu/<item_id>', methods=['DELETE'])
def delete_menu_item(item_id):
    """Delete a menu item (Admin only)."""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    menu = get_menu()
    menu = [item for item in menu if item['id'] != str(item_id)]
    save_menu(menu)
    
    return jsonify({'success': True, 'message': 'Item deleted successfully'})


@api.route('/menu/<item_id>/toggle', methods=['POST'])
def toggle_menu_item(item_id):
    """Toggle menu item availability."""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    menu = get_menu()
    for i, item in enumerate(menu):
        if item['id'] == str(item_id):
            menu[i]['available'] = not item.get('available', True)
            save_menu(menu)
            return jsonify({'success': True, 'available': menu[i]['available']})
    
    return jsonify({'success': False, 'message': 'Item not found'}), 404


# ─── ORDER ROUTES ────────────────────────────────────────────────────────────

@api.route('/orders', methods=['GET'])
def get_all_orders():
    """Get all orders (Admin only)."""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    orders = get_orders()
    status = request.args.get('status')
    
    if status:
        orders = [o for o in orders if o.get('status') == status]
    
    # Sort by created_at descending
    orders = sorted(orders, key=lambda x: x.get('created_at', ''), reverse=True)
    
    return jsonify({'success': True, 'data': orders})


@api.route('/orders/user/<telegram_id>', methods=['GET'])
def get_user_orders(telegram_id):
    """Get orders for a specific user."""
    orders = get_orders()
    user_orders = [o for o in orders if o.get('telegram_id') == str(telegram_id)]
    user_orders = sorted(user_orders, key=lambda x: x.get('created_at', ''), reverse=True)
    
    return jsonify({'success': True, 'data': user_orders})


@api.route('/orders', methods=['POST'])
def place_order():
    """Place a new order."""
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'message': 'No data provided'}), 400
    
    # Validate required fields
    if not data.get('items') or len(data['items']) == 0:
        return jsonify({'success': False, 'message': 'No items in order'}), 400
    
    if not data.get('phone'):
        return jsonify({'success': False, 'message': 'Phone number required'}), 400
    
    # Save user if telegram_id provided
    if data.get('telegram_id') and data.get('user_info'):
        save_user(data['user_info'])
    
    # Create order
    order = create_order(data)
    
    # Send Telegram notification (import here to avoid circular imports)
    try:
        from telegram.notifier import send_new_order_notification
        send_new_order_notification(order)
    except Exception as e:
        print(f"Telegram notification error: {e}")
    
    return jsonify({
        'success': True,
        'data': order,
        'message': 'Order placed successfully!'
    })


@api.route('/orders/<order_id>/accept', methods=['POST'])
def accept_order(order_id):
    """Accept an order (Admin only)."""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    order = update_order_status(order_id, 'accepted')
    
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404
    
    # Send Telegram notification
    try:
        from telegram.notifier import send_order_accepted_notification
        send_order_accepted_notification(order)
    except Exception as e:
        print(f"Telegram notification error: {e}")
    
    return jsonify({'success': True, 'data': order, 'message': 'Order accepted!'})


@api.route('/orders/<order_id>/reject', methods=['POST'])
def reject_order(order_id):
    """Reject an order (Admin only)."""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    data = request.get_json() or {}
    reason = data.get('reason', 'Sorry, we cannot process this order.')
    
    order = update_order_status(order_id, 'rejected', reason)
    
    if not order:
        return jsonify({'success': False, 'message': 'Order not found'}), 404
    
    # Send Telegram notification
    try:
        from telegram.notifier import send_order_rejected_notification
        send_order_rejected_notification(order)
    except Exception as e:
        print(f"Telegram notification error: {e}")
    
    return jsonify({'success': True, 'data': order, 'message': 'Order rejected.'})


# ─── USER ROUTES ─────────────────────────────────────────────────────────────

@api.route('/users/register', methods=['POST'])
def register_user():
    """Register/update a Telegram user."""
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'No data'}), 400
    
    user = save_user(data)
    return jsonify({'success': True, 'data': user})


# ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

@api.route('/admin/login', methods=['POST'])
def admin_login():
    """Admin login."""
    data = request.get_json()
    
    admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123')
    
    if data.get('username') == admin_username and data.get('password') == admin_password:
        session['admin_logged_in'] = True
        session.permanent = True
        return jsonify({'success': True, 'message': 'Login successful'})
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401


@api.route('/admin/logout', methods=['POST'])
def admin_logout():
    """Admin logout."""
    session.pop('admin_logged_in', None)
    return jsonify({'success': True, 'message': 'Logged out'})


@api.route('/admin/stats', methods=['GET'])
def admin_stats():
    """Get dashboard statistics."""
    if not session.get('admin_logged_in'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 401
    
    stats = get_stats()
    return jsonify({'success': True, 'data': stats})


@api.route('/admin/check', methods=['GET'])
def check_admin():
    """Check if admin is logged in."""
    return jsonify({'logged_in': bool(session.get('admin_logged_in'))})
