"""Blueprint para autenticación."""
from flask import Blueprint, request, jsonify
from datetime import datetime
from flask_limiter import Limiter

from services.auth_service import registrar_paciente, registrar_medico, login
from utils.jwt_utils import obtener_usuario_desde_request
from utils.security import mensaje_error_seguro
from database.config import SessionLocal
from database.models import Usuario, Paciente, Medico

auth_bp = Blueprint('auth', __name__)


def init_auth_bp(limiter: Limiter):
    """Registra rutas de auth con rate limiting estricto."""

    @auth_bp.route('/registro/paciente', methods=['POST'])
    @limiter.limit("5 per minute")
    def registro_paciente():
        try:
            data = request.json
            if not data or not data.get('email') or not data.get('password'):
                return jsonify({'error': 'Email y contraseña son requeridos'}), 400

            datos_paciente = {
                'apellidos_nombre': data.get('apellidos_nombre'),
                'historia_clinica': data.get('historia_clinica'),
                'dni': data.get('dni'),
                'fecha_nacimiento': data.get('fecha_nacimiento'),
                'telefono': data.get('telefono'),
                'direccion': data.get('direccion', ''),
                'provincia': data.get('provincia', 'No especificado'),
                'ciudad': data.get('ciudad', 'No especificado'),
                'distrito': data.get('distrito', 'No especificado'),
            }
            for k in ['apellidos_nombre', 'historia_clinica', 'dni', 'fecha_nacimiento']:
                if not datos_paciente.get(k):
                    return jsonify({'error': f'Campo requerido: {k}'}), 400

            datos_paciente['fecha_nacimiento'] = datetime.strptime(
                datos_paciente['fecha_nacimiento'], '%Y-%m-%d'
            ).date()

            resultado = registrar_paciente(data['email'], data['password'], datos_paciente)
            return jsonify(resultado)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            return jsonify({'error': mensaje_error_seguro(e)}), 400

    @auth_bp.route('/registro/medico', methods=['POST'])
    @limiter.limit("5 per minute")
    def registro_medico():
        try:
            data = request.json
            if not data or not data.get('email') or not data.get('password') or not data.get('medico_id'):
                return jsonify({'error': 'Email, contraseña y medico_id son requeridos'}), 400

            resultado = registrar_medico(
                data['email'],
                data['password'],
                int(data['medico_id'])
            )
            return jsonify(resultado)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            return jsonify({'error': mensaje_error_seguro(e)}), 400

    @auth_bp.route('/login', methods=['POST'])
    @limiter.limit("10 per minute")
    def login_route():
        try:
            data = request.json
            if not data or not data.get('email') or not data.get('password'):
                return jsonify({'error': 'Email y contraseña son requeridos'}), 400

            resultado = login(data['email'], data['password'])
            return jsonify(resultado)
        except ValueError as e:
            return jsonify({'error': str(e)}), 401
        except Exception as e:
            return jsonify({'error': mensaje_error_seguro(e)}), 400

    @auth_bp.route('/me', methods=['GET'])
    def me():
        try:
            payload = obtener_usuario_desde_request()
            if not payload:
                return jsonify({'error': 'No autorizado'}), 401

            db = SessionLocal()
            try:
                usuario = db.query(Usuario).filter(Usuario.id == int(payload['sub'])).first()
                if not usuario:
                    return jsonify({'error': 'Usuario no encontrado'}), 404

                resp = {
                    'usuario': {
                        'id': usuario.id,
                        'email': usuario.email,
                        'rol': usuario.rol,
                        'paciente_id': usuario.paciente_id,
                        'medico_id': usuario.medico_id
                    }
                }
                if usuario.rol == 'paciente' and usuario.paciente_id:
                    p = db.query(Paciente).filter(Paciente.id == usuario.paciente_id).first()
                    if p:
                        resp['paciente'] = {
                            'id': p.id,
                            'apellidos_nombre': p.apellidos_nombre,
                            'dni': p.dni
                        }
                if usuario.rol == 'medico' and usuario.medico_id:
                    m = db.query(Medico).filter(Medico.id == usuario.medico_id).first()
                    if m:
                        resp['medico'] = {
                            'id': m.id,
                            'nombre': m.nombre,
                            'especialidad': m.especialidad,
                            'distrito': m.distrito
                        }
                return jsonify(resp)
            finally:
                db.close()
        except Exception as e:
            return jsonify({'error': mensaje_error_seguro(e)}), 400
