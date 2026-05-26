"""
app.py - Main Flask Application for Telegram Food Order Mini App
Run: python app.py
"""
import os
from flask import Flask, render_template, send_from_directory, session
from dotenv import load_dotenv
from datetime import timedelta

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'change-this-secret-key-in-production')
app.permanent_session_lifetime = timedelta(days=7)

# Upload folder configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Register API blueprint
from routes.api import api
app.register_blueprint(api, url_prefix='/api')


# ─── SERVE UPLOADED FILES ────────────────────────────────────────────────────

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded images."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# ─── FRONTEND ROUTES ─────────────────────────────────────────────────────────

@app.route('/')
def index():
    """Main Mini App page."""
    return render_template('index.html')


@app.route('/admin')
def admin_panel():
    """Admin dashboard."""
    return render_template('admin.html')


@app.route('/admin/login')
def admin_login_page():
    """Admin login page."""
    return render_template('admin_login.html')


# ─── ERROR HANDLERS ───────────────────────────────────────────────────────────

@app.errorhandler(404)
def not_found(e):
    return {'error': 'Not found'}, 404


@app.errorhandler(500)
def server_error(e):
    return {'error': 'Server error'}, 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development') == 'development'
    
    print("🍽️ Telegram Food Order App Starting...")
    print(f"🌐 Running on: http://localhost:{port}")
    print(f"👤 Admin Panel: http://localhost:{port}/admin")
    
    app.run(host='0.0.0.0', port=port, debug=debug)
