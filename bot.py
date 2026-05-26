"""
bot.py - Telegram Bot for Food Order Mini App
Run this separately: python bot.py
"""
import os
import asyncio
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

load_dotenv()

BOT_TOKEN = os.environ.get('BOT_TOKEN', '')
WEBAPP_URL = os.environ.get('WEBAPP_URL', 'https://yourdomain.com')
ADMIN_GROUP_ID = os.environ.get('ADMIN_GROUP_ID', '')

# Import helpers
import sys
sys.path.insert(0, os.path.dirname(__file__))
from utils.helpers import get_order, update_order_status
from telegram.notifier import send_order_accepted_notification, send_order_rejected_notification


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command - Welcome message with Mini App button."""
    user = update.effective_user
    first_name = user.first_name if user else "Friend"
    
    welcome_text = (
        f"🍽️ <b>Welcome to Telegram Food Order!</b>\n\n"
        f"Hello {first_name}! 👋\n\n"
        f"Order delicious Khmer food right from Telegram!\n\n"
        f"✨ <b>Features:</b>\n"
        f"• Browse our full menu\n"
        f"• Add items to cart\n"
        f"• Place orders easily\n"
        f"• Track your orders\n\n"
        f"🛒 Tap the button below to start ordering!"
    )
    
    keyboard = [
        [InlineKeyboardButton(
            "🍜 Order Food Now",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )],
        [InlineKeyboardButton("📋 My Orders", callback_data="my_orders")],
        [InlineKeyboardButton("ℹ️ Help", callback_data="help")]
    ]
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_html(welcome_text, reply_markup=reply_markup)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command."""
    help_text = (
        "🆘 <b>Help & Support</b>\n\n"
        "📱 <b>How to Order:</b>\n"
        "1. Tap '🍜 Order Food Now'\n"
        "2. Browse the menu\n"
        "3. Add items to cart\n"
        "4. Fill delivery details\n"
        "5. Place your order\n\n"
        "📞 <b>Contact Us:</b>\n"
        "• Telegram: @your_support_username\n"
        "• Phone: +855 XX XXX XXXX\n\n"
        "⏰ <b>Working Hours:</b>\n"
        "7:00 AM - 10:00 PM daily\n\n"
        "🚀 <b>Commands:</b>\n"
        "/start - Open the app\n"
        "/help - Show this help\n"
        "/menu - View our menu"
    )
    
    keyboard = [[InlineKeyboardButton("🍜 Open App", web_app=WebAppInfo(url=WEBAPP_URL))]]
    await update.message.reply_html(help_text, reply_markup=InlineKeyboardMarkup(keyboard))


async def menu_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /menu command."""
    keyboard = [[InlineKeyboardButton("🍜 View Full Menu", web_app=WebAppInfo(url=WEBAPP_URL))]]
    await update.message.reply_html(
        "🍽️ <b>Our Menu</b>\n\nTap below to browse our full menu and place an order!",
        reply_markup=InlineKeyboardMarkup(keyboard)
    )


async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle inline button callbacks."""
    query = update.callback_query
    await query.answer()
    
    data = query.data
    
    if data == "help":
        await query.message.reply_html(
            "ℹ️ Tap /help for full help information!"
        )
    
    elif data == "my_orders":
        keyboard = [[InlineKeyboardButton("📋 View My Orders", web_app=WebAppInfo(url=f"{WEBAPP_URL}#orders"))]]
        await query.message.reply_html(
            "📋 <b>My Orders</b>\n\nView all your orders in the app!",
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
    
    elif data.startswith("accept_"):
        # Admin accepts order
        order_id = data.replace("accept_", "")
        order = get_order(order_id)
        
        if not order:
            await query.edit_message_text(f"❌ Order {order_id} not found.")
            return
        
        if order['status'] != 'pending':
            await query.edit_message_text(
                f"⚠️ Order {order_id} is already {order['status']}.",
                reply_markup=None
            )
            return
        
        updated_order = update_order_status(order_id, 'accepted')
        send_order_accepted_notification(updated_order)
        
        await query.edit_message_text(
            f"✅ <b>Order {order_id} ACCEPTED!</b>\n\n"
            f"Customer has been notified.\n"
            f"Total: ${updated_order.get('total', 0):.2f}",
            parse_mode='HTML',
            reply_markup=None
        )
    
    elif data.startswith("reject_"):
        # Ask for rejection reason
        order_id = data.replace("reject_", "")
        
        keyboard = [
            [InlineKeyboardButton("🚫 Out of stock", callback_data=f"rejectreason_{order_id}_Out of stock")],
            [InlineKeyboardButton("🕐 Too late to order", callback_data=f"rejectreason_{order_id}_Too late to order")],
            [InlineKeyboardButton("📍 Out of delivery range", callback_data=f"rejectreason_{order_id}_Out of delivery range")],
            [InlineKeyboardButton("⚠️ Other reason", callback_data=f"rejectreason_{order_id}_Sorry, we cannot process this order.")]
        ]
        
        await query.edit_message_reply_markup(reply_markup=InlineKeyboardMarkup(keyboard))
    
    elif data.startswith("rejectreason_"):
        # Process rejection with reason
        parts = data.split("_", 2)
        order_id = parts[1]
        reason = parts[2] if len(parts) > 2 else "Sorry, we cannot process this order."
        
        order = get_order(order_id)
        if not order:
            await query.edit_message_text(f"❌ Order {order_id} not found.")
            return
        
        updated_order = update_order_status(order_id, 'rejected', reason)
        send_order_rejected_notification(updated_order)
        
        await query.edit_message_text(
            f"❌ <b>Order {order_id} REJECTED</b>\n\n"
            f"Reason: {reason}\n"
            f"Customer has been notified.",
            parse_mode='HTML',
            reply_markup=None
        )


def main():
    """Start the Telegram bot."""
    if not BOT_TOKEN:
        print("❌ Error: BOT_TOKEN not set in .env file!")
        print("Please create a .env file with your BOT_TOKEN")
        return
    
    print("🤖 Starting Telegram Food Order Bot...")
    print(f"📱 Mini App URL: {WEBAPP_URL}")
    
    # Create application
    app = Application.builder().token(BOT_TOKEN).build()
    
    # Add handlers
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("menu", menu_command))
    app.add_handler(CallbackQueryHandler(button_callback))
    
    print("✅ Bot is running! Press Ctrl+C to stop.")
    
    # Start polling
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()
