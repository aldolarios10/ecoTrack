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

# Inicializar base de datos
with app.app_context():
    init_db()
    init_challenges()

# --- Ejecución de la aplicación ---
if __name__ == '__main__':
    print(f"Backend Flask iniciado. Accede a http://127.0.0.1:5000/")
    app.run(debug=True)
