# Configuración de la aplicación Flask

import os

DATABASE_URL = os.environ.get('DATABASE_URL')
# Clave secreta para simular tokens o sesiones. En producción, usar una clave más fuerte.
SECRET_KEY = os.environ.get('SECRET_KEY', 'super_clave_secreta_ecotrack_2025')