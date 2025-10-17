from flask import Flask
from flask_cors import CORS
from models import init_db, init_challenges
from routes import api_bp, static_bp
from config import SECRET_KEY

app = Flask(__name__)
app.config['SECRET_KEY'] = SECRET_KEY
CORS(app)  # Habilitamos CORS para permitir peticiones desde el frontend

# Registrar blueprints
app.register_blueprint(api_bp)
app.register_blueprint(static_bp)

# Inicializar base de datos solo en desarrollo local
if __name__ == '__main__':
    with app.app_context():
        init_db()
        init_challenges()

# For Vercel serverless functions, initialize DB on first request
@app.before_request
def initialize_database():
    if not hasattr(app, 'db_initialized'):
        with app.app_context():
            init_db()
            init_challenges()
        app.db_initialized = True

# --- Ejecución de la aplicación ---
if __name__ == '__main__':
    print(f"Backend Flask iniciado. Accede a http://127.0.0.1:5000/")
    app.run(debug=True)

# Vercel serverless function handler
def handler(request):
    # For Vercel deployment - return the Flask WSGI app
    return app.wsgi_app
