from flask import Blueprint, request, jsonify, g, send_file, send_from_directory
from datetime import datetime, timedelta
import random
from models import get_db
from config import SECRET_KEY

api_bp = Blueprint('api', __name__)
static_bp = Blueprint('static', __name__)

# Función para obtener la conexión a la base de datos
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        from config import DATABASE
        import sqlite3
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row  # Permite acceder a las columnas por nombre
    return db

# --- Helpers de Autenticación y Autorización (Simulados) ---
# Usaremos un 'token' simple para simular la sesión.

def get_user_by_token(token):
    # Simulación de validación de token.
    try:
        user_id = int(token)
        db = get_db()
        user = db.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
        return dict(user) if user else None
    except:
        return None

def login_required(f):
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            user = get_user_by_token(token)
            if user:
                g.user = user
                return f(*args, **kwargs)
        return jsonify({'message': 'Acceso no autorizado. Se requiere token de sesión.'}), 401
    wrapper.__name__ = f.__name__
    return wrapper

# --- Rutas de Archivos Estáticos y PWA ---

@static_bp.route('/', methods=['GET'])
def serve_index():
    """Sirve la página principal HTML."""
    return send_file('index.html')

@static_bp.route('/manifest.json')
def serve_manifest():
    """Sirve el archivo manifest.json para la PWA."""
    return send_from_directory('.', 'manifest.json')

@static_bp.route('/service-worker.js')
def serve_sw():
    """Sirve el archivo service-worker.js."""
    return send_from_directory('.', 'service-worker.js')

@static_bp.route('/<path:filename>')
def serve_static_files(filename):
    """Sirve otros archivos estáticos como los iconos."""
    # Por seguridad, solo servimos archivos conocidos
    allowed_files = ['icon-192x192.png', 'icon-512x512.png']
    if filename in allowed_files:
        return send_from_directory('.', filename)
    else:
        # Devuelve 404 para cualquier otro archivo no encontrado
        return 'File not found', 404

# --- Endpoints de la API ---

@api_bp.route('/api/register', methods=['POST'])
def register():
    """Endpoint para el registro de nuevos usuarios."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Faltan campos (email, password)'}), 400

    db = get_db()
    try:
        cursor = db.execute('INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
                              (email, password, email.split('@')[0]))
        db.commit()
        user_id = cursor.lastrowid
        return jsonify({'message': 'Registro exitoso', 'token': str(user_id)}), 201
    except sqlite3.IntegrityError:
        return jsonify({'message': 'El correo electrónico ya está registrado.'}), 409
    except Exception as e:
        return jsonify({'message': 'Error al registrar usuario: ' + str(e)}), 500

@api_bp.route('/api/login', methods=['POST'])
def login():
    """Endpoint para el inicio de sesión."""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'message': 'Faltan campos (email, password)'}), 400

    db = get_db()
    user = db.execute('SELECT * FROM users WHERE email = ? AND password = ?', (email, password)).fetchone()

    if user:
        user_id = dict(user)['id']
        return jsonify({'message': 'Inicio de sesión exitoso', 'token': str(user_id)}), 200
    else:
        return jsonify({'message': 'Credenciales inválidas.'}), 401

@api_bp.route('/api/dashboard', methods=['GET'])
@login_required
def dashboard():
    """Endpoint para obtener los datos del Panel de Usuario."""
    user = g.user
    user_id = user['id']
    db = get_db()

    # 1. Resumen de Hábitos
    habits_count = db.execute('SELECT COUNT(*) FROM habits WHERE user_id = ?', (user_id,)).fetchone()[0]

    # 2. Logros recientes (mock data)
    achievements = [
        {"name": "Bici Novato", "desc": "Primer uso de transporte ecológico.", "icon": "🚴"},
        {"name": "Reciclador Activo", "desc": "5 registros de reciclaje.", "icon": "♻️"}
    ]

    # 3. Datos de Progreso Semanal (Mock data)
    weekly_progress = []
    today = datetime.now()
    for i in range(7):
        date = today - timedelta(days=i)
        weekly_progress.append({
            "day": date.strftime('%a'),
            "co2": round(random.uniform(0.5, 3.0), 2),
            "points": random.randint(10, 50)
        })
    weekly_progress.reverse()

    return jsonify({
        'user': {
            'username': user['username'],
            'email': user['email'],
            'points': user['points'],
            'co2_saved': round(user['co2_saved'], 2),
        },
        'summary': {
            'actions': habits_count,
            'points': user['points'],
            'co2_saved': round(user['co2_saved'], 2)
        },
        'progress_chart': weekly_progress,
        'achievements': achievements
    })

@api_bp.route('/api/habits', methods=['POST'])
@login_required
def register_habit():
    """Endpoint para registrar un nuevo hábito ecológico."""
    user = g.user
    user_id = user['id']
    data = request.get_json()
    action = data.get('action')
    notes = data.get('notes', '')
    date = data.get('date', datetime.now().strftime('%Y-%m-%d'))

    if not action:
        return jsonify({'message': 'La acción ecológica es obligatoria.'}), 400

    # Simulación de impacto:
    impacts = {
        "Reciclar plástico": {"co2": 0.5, "points": 10},
        "Usar bicicleta": {"co2": 1.5, "points": 25},
        "Ahorro de agua": {"co2": 0.3, "points": 5},
        "Comprar a granel": {"co2": 0.8, "points": 15},
        "Apagar luces": {"co2": 0.2, "points": 4},
        "Otro": {"co2": 0.1, "points": 2},
    }

    impact = impacts.get(action, impacts['Otro'])
    co2_impact = impact['co2']
    points_awarded = impact['points']

    db = get_db()
    try:
        # 1. Insertar el nuevo hábito
        db.execute('INSERT INTO habits (user_id, action, notes, co2_impact, points_awarded, date) VALUES (?, ?, ?, ?, ?, ?)',
                    (user_id, action, notes, co2_impact, points_awarded, date))

        # 2. Actualizar puntos y CO2 del usuario
        db.execute('UPDATE users SET points = points + ?, co2_saved = co2_saved + ? WHERE id = ?',
                    (points_awarded, co2_impact, user_id))

        # 3. Actualizar progreso de Retos
        challenges_to_update = db.execute('''
            SELECT c.id FROM challenges c
            LEFT JOIN user_challenges uc ON c.id = uc.challenge_id AND uc.user_id = ?
            WHERE c.target_type = ? AND (uc.completed IS NULL OR uc.completed = 0)
        ''', (user_id, action)).fetchall()

        for challenge in challenges_to_update:
            challenge_id = challenge['id']
            db.execute('''
                INSERT INTO user_challenges (user_id, challenge_id, progress_value)
                VALUES (?, ?, 1)
                ON CONFLICT(user_id, challenge_id) DO UPDATE SET progress_value = progress_value + 1
            ''', (user_id, challenge_id))

        db.commit()

        return jsonify({'message': 'Hábito registrado con éxito', 'points': points_awarded, 'co2': co2_impact}), 201

    except Exception as e:
        db.rollback()
        return jsonify({'message': 'Error al registrar hábito: ' + str(e)}), 500

@api_bp.route('/api/challenges', methods=['GET'])
@login_required
def get_challenges():
    """Endpoint para obtener los retos semanales del usuario."""
    user_id = g.user['id']
    db = get_db()

    active_challenges = db.execute('SELECT * FROM challenges').fetchall()

    challenges_data = []
    for challenge in active_challenges:
        challenge_dict = dict(challenge)

        progress = db.execute('SELECT progress_value, completed FROM user_challenges WHERE user_id = ? AND challenge_id = ?',
                              (user_id, challenge_dict['id'])).fetchone()

        if progress:
            challenge_dict['progress'] = progress['progress_value']
            challenge_dict['completed'] = progress['completed']
        else:
            challenge_dict['progress'] = 0
            challenge_dict['completed'] = 0

        target = challenge_dict['target_value']
        current = challenge_dict['progress']
        challenge_dict['percentage'] = min(100, int((current / target) * 100))

        challenges_data.append(challenge_dict)

    return jsonify(challenges_data)

@api_bp.route('/api/challenges/complete', methods=['POST'])
@login_required
def complete_challenge():
    """Endpoint para marcar un reto como completado manualmente."""
    user = g.user
    user_id = user['id']
    data = request.get_json()
    challenge_id = data.get('challenge_id')

    db = get_db()

    challenge_data = db.execute('SELECT reward_points, target_value FROM challenges WHERE id = ?', (challenge_id,)).fetchone()
    user_progress = db.execute('SELECT progress_value, completed FROM user_challenges WHERE user_id = ? AND challenge_id = ?',
                                (user_id, challenge_id)).fetchone()

    if not challenge_data:
        return jsonify({'message': 'Reto no encontrado.'}), 404

    if not user_progress or user_progress['progress_value'] < challenge_data['target_value']:
        return jsonify({'message': 'Aún no has completado el objetivo de este reto.'}), 400

    if user_progress['completed'] == 1:
        return jsonify({'message': 'Este reto ya ha sido completado y la recompensa otorgada.'}), 400

    try:
        reward = challenge_data['reward_points']

        db.execute('UPDATE users SET points = points + ? WHERE id = ?', (reward, user_id))

        db.execute('UPDATE user_challenges SET completed = 1 WHERE user_id = ? AND challenge_id = ?', (user_id, challenge_id))

        db.commit()

        return jsonify({'message': '¡Reto completado! Has ganado {} puntos verdes.'.format(reward), 'points': reward}), 200

    except Exception as e:
        db.rollback()
        return jsonify({'message': 'Error al completar el reto: ' + str(e)}), 500

@api_bp.route('/api/ranking', methods=['GET'])
@login_required
def get_ranking():
    """Endpoint para obtener el ranking comunitario."""
    db = get_db()

    ranking = db.execute('SELECT username, points, co2_saved FROM users ORDER BY points DESC LIMIT 100').fetchall()

    ranking_list = []
    for i, user in enumerate(ranking):
        ranking_list.append({
            'position': i + 1,
            'username': user['username'],
            'points': user['points'],
            'co2_saved': round(user['co2_saved'], 2)
        })

    user_id = g.user['id']
    user_rank_query = db.execute('''
        SELECT
            T1.rank,
            T1.username,
            T1.points
        FROM (
            SELECT
                username,
                points,
                ROW_NUMBER() OVER(ORDER BY points DESC) as rank
            FROM users
        ) AS T1
        WHERE T1.username = ?
    ''', (g.user['username'],)).fetchone()

    personal_ranking = dict(user_rank_query) if user_rank_query else None

    return jsonify({
        'ranking': ranking_list,
        'personal_rank': personal_ranking
    })