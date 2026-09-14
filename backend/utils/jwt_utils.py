"""Utilidades para JWT."""
import os
from datetime import datetime, timedelta
from functools import wraps

import jwt
from flask import request, jsonify


def _obtener_secret_key() -> str:
    """Obtiene la clave JWT. En producción es obligatoria."""
    key = os.getenv('JWT_SECRET_KEY')
    if not key or not key.strip():
        if os.getenv('FLASK_ENV') == 'production':
            raise ValueError(
                'JWT_SECRET_KEY es obligatoria en producción. '
                'Genera una con: python -c "import secrets; print(secrets.token_hex(32))"'
            )
        return 'cardionet-dev-only-do-not-use-in-production'
    return key


SECRET_KEY = None  # Se inicializa en primer uso


def get_secret_key() -> str:
    global SECRET_KEY
    if SECRET_KEY is None:
        SECRET_KEY = _obtener_secret_key()
    return SECRET_KEY


ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 horas


def crear_token(user_id: int, email: str, rol: str, paciente_id=None, medico_id=None) -> str:
    """Crea un JWT con los datos del usuario."""
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        'sub': str(user_id),
        'email': email,
        'rol': rol,
        'paciente_id': paciente_id,
        'medico_id': medico_id,
        'exp': expire,
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, get_secret_key(), algorithm=ALGORITHM)


def decodificar_token(token: str) -> dict | None:
    """Decodifica y valida un JWT. Retorna payload o None."""
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def obtener_usuario_desde_request():
    """Extrae el token del header Authorization y retorna el payload decodificado."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    return decodificar_token(token)


def requerir_auth(roles_permitidos=None):
    """Decorador para proteger rutas. roles_permitidos: lista de roles o None para cualquier autenticado."""
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            payload = obtener_usuario_desde_request()
            if not payload:
                return jsonify({'error': 'No autorizado. Token inválido o expirado.'}), 401
            if roles_permitidos and payload.get('rol') not in roles_permitidos:
                return jsonify({'error': 'Acceso denegado para este rol.'}), 403
            request.current_user = payload
            return f(*args, **kwargs)
        return wrapped
    return decorator
