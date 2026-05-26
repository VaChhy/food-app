"""
controllers/menu_controller.py
Business logic for menu operations (separated from routes for clean architecture)
"""
import os
import uuid
from utils.helpers import get_menu, save_menu, get_timestamp

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def handle_image_upload(file):
    """Save uploaded image and return its URL path."""
    if file and allowed_file(file.filename):
        ext = file.filename.rsplit('.', 1)[1].lower()
        filename = f"{uuid.uuid4()}.{ext}"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        file.save(filepath)
        return f'/uploads/{filename}'
    return None


def add_item(form_data, image_file=None):
    """Add a new menu item."""
    menu = get_menu()

    image_path = '/static/images/placeholder-food.jpg'
    if image_file:
        uploaded = handle_image_upload(image_file)
        if uploaded:
            image_path = uploaded

    item = {
        'id': str(uuid.uuid4())[:8],
        'name_en': form_data.get('name_en', '').strip(),
        'name_km': form_data.get('name_km', '').strip(),
        'description_en': form_data.get('description_en', '').strip(),
        'description_km': form_data.get('description_km', '').strip(),
        'price': float(form_data.get('price', 0)),
        'category': form_data.get('category', 'main'),
        'image': image_path,
        'available': form_data.get('available', 'true').lower() == 'true',
        'created_at': get_timestamp()
    }

    if not item['name_en']:
        return None, 'Name (English) is required'

    menu.append(item)
    save_menu(menu)
    return item, None


def edit_item(item_id, form_data, image_file=None):
    """Edit an existing menu item."""
    menu = get_menu()

    for i, item in enumerate(menu):
        if item['id'] == str(item_id):
            if image_file:
                uploaded = handle_image_upload(image_file)
                if uploaded:
                    menu[i]['image'] = uploaded

            menu[i]['name_en'] = form_data.get('name_en', item['name_en']).strip()
            menu[i]['name_km'] = form_data.get('name_km', item.get('name_km', '')).strip()
            menu[i]['description_en'] = form_data.get('description_en', item.get('description_en', '')).strip()
            menu[i]['description_km'] = form_data.get('description_km', item.get('description_km', '')).strip()
            menu[i]['price'] = float(form_data.get('price', item['price']))
            menu[i]['category'] = form_data.get('category', item['category'])
            menu[i]['available'] = form_data.get('available', str(item['available'])).lower() == 'true'
            menu[i]['updated_at'] = get_timestamp()

            save_menu(menu)
            return menu[i], None

    return None, 'Item not found'


def remove_item(item_id):
    """Remove a menu item."""
    menu = get_menu()
    original_len = len(menu)
    menu = [item for item in menu if item['id'] != str(item_id)]
    save_menu(menu)
    return len(menu) < original_len


def toggle_availability(item_id):
    """Toggle item availability and return new status."""
    menu = get_menu()
    for i, item in enumerate(menu):
        if item['id'] == str(item_id):
            menu[i]['available'] = not item.get('available', True)
            save_menu(menu)
            return menu[i]['available']
    return None
