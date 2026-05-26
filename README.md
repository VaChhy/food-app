# 🍽️ Telegram Food Order Mini App

A full-stack food ordering system built as a Telegram Mini App. Users can browse the menu, add items to cart, and place orders — all inside Telegram. Admins receive real-time notifications via a Telegram bot and can accept/reject orders.

---

## 📁 Project Structure

```
telegram-food-app/
│
├── app.py                  ← Flask web server (main entry)
├── bot.py                  ← Telegram Bot (run separately)
├── requirements.txt
├── .env.example
├── README.md
│
├── routes/
│   └── api.py              ← All REST API endpoints
│
├── controllers/
│   ├── menu_controller.py  ← Menu business logic
│   └── order_controller.py ← Order business logic
│
├── utils/
│   ├── helpers.py          ← JSON file helpers, utilities
│   └── validators.py       ← Input validation
│
├── telegram/
│   └── notifier.py         ← Sends Telegram messages
│
├── templates/
│   ├── index.html          ← Mini App (main frontend)
│   ├── admin.html          ← Admin dashboard
│   └── admin_login.html    ← Admin login page
│
├── static/
│   ├── css/
│   │   ├── app.css         ← Mini App styles
│   │   └── admin.css       ← Admin panel styles
│   ├── js/
│   │   ├── app.js          ← Mini App JavaScript
│   │   ├── admin.js        ← Admin dashboard JavaScript
│   │   └── lang.js         ← i18n language module
│   └── images/
│       └── placeholder-food.jpg
│
├── uploads/                ← User-uploaded food images
│
└── data/
    ├── menu.json           ← Menu items
    ├── orders.json         ← Orders
    └── users.json          ← Telegram users
```

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies

```bash
git clone <your-repo>
cd telegram-food-app

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Install requirements
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
BOT_TOKEN=your_telegram_bot_token
ADMIN_GROUP_ID=-1001234567890
WEBAPP_URL=https://yourdomain.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
SECRET_KEY=random_secret_key_here
```

### 3. Start the Flask Server

```bash
python app.py
```

Server runs at: `http://localhost:5000`

### 4. Start the Telegram Bot (separate terminal)

```bash
python bot.py
```

---

## 🤖 Telegram Bot Setup

### Step 1: Create Your Bot

1. Open Telegram → search **@BotFather**
2. Send `/newbot`
3. Choose a name: e.g. `Food Order Bot`
4. Choose username: e.g. `myfoodorder_bot`
5. Copy the **API Token** → paste into `.env` as `BOT_TOKEN`

### Step 2: Enable Mini App (WebApp)

1. In BotFather → `/mybots` → select your bot
2. Go to **Bot Settings** → **Menu Button**
3. Set URL to your deployed web app URL
4. Or use `/newapp` to create a proper Mini App

### Step 3: Get Admin Group ID

1. Create a Telegram group for admin notifications
2. Add your bot to the group
3. Send a message in the group
4. Visit: `https://api.telegram.org/bot<TOKEN>/getUpdates`
5. Find `"chat":{"id":-100XXXXXXXXX}` → copy this as `ADMIN_GROUP_ID`

### Step 4: Set Bot Commands (Optional)

In BotFather → `/setcommands`:
```
start - Open the food ordering app
help - Get help and support info
menu - Browse our menu
```

---

## 🌐 Deployment (Production)

### Option A: Using ngrok (Local Testing)

```bash
# Install ngrok: https://ngrok.com
ngrok http 5000

# Copy the HTTPS URL → paste into .env as WEBAPP_URL
# Restart bot.py
```

### Option B: Deploy to a VPS (Ubuntu)

```bash
# Install dependencies
sudo apt update && sudo apt install python3-pip nginx certbot -y

# Clone your project
git clone <repo> /var/www/food-app
cd /var/www/food-app
pip3 install -r requirements.txt

# Set up Gunicorn service
sudo nano /etc/systemd/system/foodapp.service
```

Paste:
```ini
[Unit]
Description=Telegram Food Order App
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/food-app
ExecStart=/usr/local/bin/gunicorn -w 2 -b 0.0.0.0:5000 app:app
Restart=always
EnvironmentFile=/var/www/food-app/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable foodapp
sudo systemctl start foodapp

# Bot service
sudo nano /etc/systemd/system/foodbot.service
```

Paste:
```ini
[Unit]
Description=Telegram Food Order Bot
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/food-app
ExecStart=/usr/bin/python3 bot.py
Restart=always
EnvironmentFile=/var/www/food-app/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable foodbot
sudo systemctl start foodbot
```

### Option C: Deploy to Railway / Render (Free)

1. Push code to GitHub
2. Connect repo to [Railway](https://railway.app) or [Render](https://render.com)
3. Set environment variables in dashboard
4. Deploy!
5. **Note:** Run `bot.py` as a separate Worker service

---

## 👤 Admin Panel

URL: `http://yourdomain.com/admin`

Default credentials:
- Username: `admin`
- Password: `admin123`

⚠️ **Change these in your `.env` file before deploying!**

### Admin Features:
- 📊 **Dashboard** — Order stats, revenue, recent activity
- 📋 **Orders** — Accept/reject with Telegram notifications
- 🍛 **Menu** — Add/edit/delete items, upload images, toggle availability
- 👥 **Customers** — View customer info and order history

---

## 📱 Mini App Features

- ✅ Telegram WebApp integration (gets user info automatically)
- ✅ Browse menu by category
- ✅ Search food items
- ✅ Add to cart with quantity control
- ✅ Checkout with delivery details
- ✅ Order history with status updates
- ✅ Dark / Light theme (saved to localStorage)
- ✅ Khmer / English language switch
- ✅ Glassmorphism UI design
- ✅ Fully mobile-optimized

---

## 🔔 Order Flow

```
User places order
      ↓
Flask API creates order (JSON)
      ↓
Telegram Bot notifies admin group
(with ✅ Accept / ❌ Reject buttons)
      ↓
Admin clicks Accept or Reject
      ↓
Bot updates order status
      ↓
User receives Telegram notification
```

---

## 📦 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get all menu items |
| GET | `/api/menu/:id` | Get single item |
| POST | `/api/menu` | Add menu item (admin) |
| PUT | `/api/menu/:id` | Update menu item (admin) |
| DELETE | `/api/menu/:id` | Delete menu item (admin) |
| POST | `/api/menu/:id/toggle` | Toggle availability (admin) |
| GET | `/api/orders` | Get all orders (admin) |
| GET | `/api/orders/user/:id` | Get user's orders |
| POST | `/api/orders` | Place new order |
| POST | `/api/orders/:id/accept` | Accept order (admin) |
| POST | `/api/orders/:id/reject` | Reject order (admin) |
| POST | `/api/admin/login` | Admin login |
| POST | `/api/admin/logout` | Admin logout |
| GET | `/api/admin/stats` | Dashboard statistics |

---

## 🔧 Customization

### Change Restaurant Name
Edit `templates/index.html` and `static/js/app.js`:
```javascript
brandName: 'Your Restaurant'
```

### Add New Category
In `static/js/app.js`, add to `CATEGORIES` array:
```javascript
{ id: 'pizza', emoji: '🍕' }
```

Add translation in `i18n` object:
```javascript
catPizza: '🍕 Pizza'  // en
catPizza: '🍕 ភីហ្សា' // km
```

### Change Colors
In `static/css/app.css`, update CSS variables:
```css
--primary: #e84545;       /* Main accent color */
--primary-dark: #c73030;  /* Darker shade */
```

---

## 🛡️ Security Notes

- Change `ADMIN_PASSWORD` and `SECRET_KEY` before deploying
- The app uses Flask session-based authentication for admin
- All admin API routes check `session['admin_logged_in']`
- File uploads are restricted to image types only
- Input is validated on both frontend and backend

---

## 📞 Support

- Khmer Unicode font: **Battambang** (Google Fonts)
- Telegram WebApp Docs: https://core.telegram.org/bots/webapps
- python-telegram-bot Docs: https://python-telegram-bot.readthedocs.io

---

Built with ❤️ for Cambodia 🇰🇭
