"""
CARDIONET - Aplicación principal.
Sistema de predicción de riesgo cardíaco con arquitectura en capas.
"""
import os

from flask import Flask, request, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from werkzeug.middleware.proxy_fix import ProxyFix

from database.config import engine, SessionLocal
from database.models import Base
from ml.model_loader import cargar_modelos
from routes.evaluacion_bp import evaluacion_bp, init_evaluacion_bp
from routes.medicos_bp import medicos_bp, init_medicos_bp
from routes.health_bp import health_bp
from routes.auth_bp import auth_bp, init_auth_bp
from utils.security import es_produccion

# Configurar Flask
app = Flask(__name__,
            static_folder='../frontend',
            static_url_path='')

# CORS
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:8080,http://127.0.0.1:8080,http://localhost:5000').split(',')
CORS(app, origins=[o.strip() for o in cors_origins if o.strip()])

# Rate limiting - usa X-Forwarded-For cuando hay proxy (nginx)
def _key_func():
    forwarded = request.headers.get('X-Forwarded-For')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.remote_addr or '127.0.0.1'


limiter = Limiter(
    app=app,
    key_func=_key_func,
    default_limits=["100 per minute"]
)

# Proxy headers (para nginx)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)

# Base de datos
Base.metadata.create_all(bind=engine)

# Inicializar blueprints con rate limiting
init_evaluacion_bp(limiter)
init_medicos_bp(limiter)
init_auth_bp(limiter)

# Registrar blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(evaluacion_bp, url_prefix='/api')
app.register_blueprint(medicos_bp, url_prefix='/api/medicos')
app.register_blueprint(health_bp, url_prefix='/api')

# Cargar modelos ML al iniciar (garantiza carga con gunicorn/uwsgi)
cargar_modelos()

# Rutas estáticas (frontend)
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)


if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() in ('true', '1', 'yes')
    if es_produccion() and debug:
        debug = False
    app.run(debug=debug, port=port, host='0.0.0.0' if es_produccion() else '127.0.0.1')
