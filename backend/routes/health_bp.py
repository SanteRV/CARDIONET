"""Blueprint para health check."""
from flask import Blueprint, jsonify

from ml.model_loader import modelo_disponible

health_bp = Blueprint('health', __name__)


@health_bp.route('/salud', methods=['GET'])
def salud():
    """Health check de la API."""
    return jsonify({
        'status': 'ok',
        'mensaje': 'API funcionando correctamente',
        'modelo_ml_cargado': modelo_disponible()
    })
