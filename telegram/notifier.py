"""
telegram/notifier.py - Send Telegram notifications for orders
"""
import os
import asyncio
import requests

BOT_TOKEN = os.environ.get('BOT_TOKEN', '')
ADMIN_GROUP_ID = os.environ.get('ADMIN_GROUP_ID', '')
WEBAPP_URL = os.environ.get('WEBAPP_URL', 'https://yourdomain.com')


def send_telegram_message(chat_id, text, reply_markup=None):
    """Send a message via Telegram Bot API using requests (sync)."""
    if not BOT_TOKEN or not chat_id:
        print("⚠️ BOT_TOKEN or chat_id not configured")
        return False
    
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    
    if reply_markup:
        import json
        payload['reply_markup'] = json.dumps(reply_markup)
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        return response.status_code == 200
    except Exception as e:
        print(f"Telegram send error: {e}")
        return False


def format_order_items(items):
    """Format order items for Telegram message."""
    lines = []
    for item in items:
        lines.append(f"  • {item.get('name_en', 'Item')} x{item.get('quantity', 1)} = ${item.get('subtotal', 0):.2f}")
    return '\n'.join(lines)


def send_new_order_notification(order):
    """Send new order notification to admin group."""
    if not ADMIN_GROUP_ID:
        print("⚠️ ADMIN_GROUP_ID not configured")
        return
    
    items_text = format_order_items(order.get('items', []))
    
    message = (
        f"🍽️ <b>NEW ORDER RECEIVED!</b>\n\n"
        f"📋 <b>Order ID:</b> {order['id']}\n"
        f"👤 <b>Customer:</b> {order.get('user_name', 'Guest')}\n"
        f"📱 <b>Phone:</b> {order.get('phone', 'N/A')}\n"
        f"📍 <b>Address:</b> {order.get('delivery_address', 'N/A')}\n\n"
        f"🛒 <b>Items:</b>\n{items_text}\n\n"
        f"💰 <b>Total:</b> ${order.get('total', 0):.2f}\n"
        f"📝 <b>Note:</b> {order.get('note', 'None')}\n"
        f"⏰ <b>Time:</b> {order.get('created_at', '')}"
    )
    
    # Add accept/reject inline buttons
    reply_markup = {
        'inline_keyboard': [[
            {'text': '✅ Accept', 'callback_data': f"accept_{order['id']}"},
            {'text': '❌ Reject', 'callback_data': f"reject_{order['id']}"}
        ]]
    }
    
    send_telegram_message(ADMIN_GROUP_ID, message, reply_markup)
    
    # Also notify the user
    if order.get('telegram_id'):
        user_message = (
            f"✅ <b>Order Placed Successfully!</b>\n\n"
            f"📋 <b>Order ID:</b> {order['id']}\n"
            f"⏳ <b>Status:</b> Pending\n\n"
            f"Your order is being reviewed. We'll notify you when it's accepted!\n\n"
            f"🍽️ Thank you for ordering with us! 🙏"
        )
        send_telegram_message(order['telegram_id'], user_message)


def send_order_accepted_notification(order):
    """Send order accepted notification to user and group."""
    items_text = format_order_items(order.get('items', []))
    
    # Notify admin group
    if ADMIN_GROUP_ID:
        group_message = (
            f"✅ <b>ORDER ACCEPTED</b>\n\n"
            f"📋 Order ID: {order['id']}\n"
            f"👤 Customer: {order.get('user_name', 'Guest')}\n"
            f"💰 Total: ${order.get('total', 0):.2f}\n"
            f"🕐 Updated: {order.get('updated_at', '')}"
        )
        send_telegram_message(ADMIN_GROUP_ID, group_message)
    
    # Notify user
    if order.get('telegram_id'):
        user_message = (
            f"🎉 <b>Your order has been ACCEPTED!</b>\n\n"
            f"📋 <b>Order ID:</b> {order['id']}\n"
            f"✅ <b>Status:</b> Accepted\n\n"
            f"<b>Your items:</b>\n{items_text}\n\n"
            f"💰 <b>Total:</b> ${order.get('total', 0):.2f}\n\n"
            f"🚀 Your food is being prepared! We'll deliver it to you soon.\n"
            f"🍽️ Thank you for your patience! 🙏"
        )
        send_telegram_message(order['telegram_id'], user_message)


def send_order_rejected_notification(order):
    """Send order rejected notification to user and group."""
    reason = order.get('reject_reason', 'Sorry, we cannot process this order.')
    
    # Notify admin group
    if ADMIN_GROUP_ID:
        group_message = (
            f"❌ <b>ORDER REJECTED</b>\n\n"
            f"📋 Order ID: {order['id']}\n"
            f"👤 Customer: {order.get('user_name', 'Guest')}\n"
            f"💬 Reason: {reason}\n"
            f"🕐 Updated: {order.get('updated_at', '')}"
        )
        send_telegram_message(ADMIN_GROUP_ID, group_message)
    
    # Notify user
    if order.get('telegram_id'):
        user_message = (
            f"😔 <b>Your order has been rejected.</b>\n\n"
            f"📋 <b>Order ID:</b> {order['id']}\n"
            f"❌ <b>Status:</b> Rejected\n\n"
            f"💬 <b>Reason:</b> {reason}\n\n"
            f"We're sorry for the inconvenience. Please try again or contact us for help."
        )
        send_telegram_message(order['telegram_id'], user_message)
