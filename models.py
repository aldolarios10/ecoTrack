import sqlite3
from flask import g

DATABASE = 'ecotrack.db'

def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row  # Permite acceder a las columnas por nombre
    return db

def init_db():
    db = get_db()
    cursor = db.cursor()

    # 1. Tabla de Usuarios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            username TEXT,
            points INTEGER DEFAULT 0,
            co2_saved REAL DEFAULT 0.0
        )
    ''')

    # 2. Tabla de Hábitos (Registros de acciones)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS habits (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            action TEXT NOT NULL,
            notes TEXT,
            co2_impact REAL NOT NULL,
            points_awarded INTEGER NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # 3. Tabla de Retos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS challenges (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            reward_points INTEGER NOT NULL,
            target_type TEXT NOT NULL,
            target_value INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL
        )
    ''')

    # 4. Tabla de Progreso de Retos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_challenges (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            challenge_id INTEGER,
            progress_value INTEGER DEFAULT 0,
            completed INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (challenge_id) REFERENCES challenges (id),
            UNIQUE(user_id, challenge_id)
        )
    ''')

    db.commit()

def init_challenges():
    from datetime import datetime, timedelta
    db = get_db()
    cursor = db.cursor()

    # Insertar retos iniciales (Mock data)
    today = datetime.now()
    next_week = today + timedelta(days=7)

    initial_challenges = [
        ("Recicla 3 veces esta semana", "Registra 3 acciones de reciclaje.", 50, "Reciclar plástico", 3, today.strftime('%Y-%m-%d'), next_week.strftime('%Y-%m-%d')),
        ("Transporte ecológico x5", "Usa transporte no contaminante (bici/caminata) 5 días.", 80, "Usar bicicleta", 5, today.strftime('%Y-%m-%d'), next_week.strftime('%Y-%m-%d')),
        ("Compra Local", "Registra 2 compras a granel o locales.", 30, "Comprar a granel", 2, today.strftime('%Y-%m-%d'), next_week.strftime('%Y-%m-%d')),
    ]

    # Verificar si hay retos para evitar duplicados
    cursor.execute('SELECT COUNT(*) FROM challenges')
    if cursor.fetchone()[0] == 0:
        cursor.executemany('''
            INSERT INTO challenges (title, description, reward_points, target_type, target_value, start_date, end_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', initial_challenges)

    db.commit()