"""Blueprint para endpoints de médicos."""
from flask import Blueprint, request, jsonify

from services.medico_service import (
    obtener_medicos_recomendados,
    obtener_todos_medicos,
    obtener_perfil_medico,
    actualizar_perfil_medico
)
from utils.security import mensaje_error_seguro
from utils.jwt_utils import requerir_auth, obtener_usuario_desde_request

medicos_bp = Blueprint('medicos', __name__)


def init_medicos_bp(limiter):
    """Registra las rutas del blueprint con rate limiting."""

    @medicos_bp.route('/recomendados', methods=['POST'])
    @limiter.limit("60 per minute")
    def recomendados():
        try:
            data = request.json or {}
            perfil_riesgo = data.get('perfil_riesgo', {})
            resultado = obtener_medicos_recomendados(perfil_riesgo)
            return jsonify(resultado)
        except Exception as e:
            return jsonify({'error': mensaje_error_seguro(e)}), 400

    @medicos_bp.route('/todos', methods=['GET'])
    def todos():
        try:
            page = max(1, int(request.args.get('page', 1)))
            per_page = min(1000, max(1, int(request.args.get('per_page', 10))))
            resultado = obtener_todos_medicos(page=page, per_page=per_page)
            return jsonify(resultado)
        except ValueError:
            return jsonify({'error': 'Parámetros page y per_page deben ser números'}), 400
        except Exception as e:
            return jsonify({'error': mensaje_error_seguro(e)}), 400

    @medicos_bp.route('/perfil', methods=['GET'])
    @requerir_auth(roles_permitidos=['medico'])
    def perfil_get():
        try:
            payload = request.current_user
            medico_id = payload.get('medico_id')
            if not medico_id:
                return jsonify({'error': 'No asociado a un médico'}), 403
            resultado = obtener_perfil_medico(int(medico_id))
            return jsonify(resultado)
        except ValueError as e:
            return jsonify({'error': str(e)}), 404
        except Exception as e:
            return jsonify({'error': mensaje_error_seguro(e)}), 400

    @medicos_bp.route('/perfil', methods=['PUT'])
    @requerir_auth(roles_permitidos=['medico'])
    def perfil_put():
        try:
            payload = request.current_user
            medico_id = payload.get('medico_id')
            if not medico_id:
                return jsonify({'error': 'No asociado a un médico'}), 403
            data = request.json or {}
            resultado = actualizar_perfil_medico(int(medico_id), data)
            return jsonify(resultado)
        except ValueError as e:
            return jsonify({'error': str(e)}), 404
        except Exception as e:
            return jsonify({'error': mensaje_error_seguro(e)}), 400
