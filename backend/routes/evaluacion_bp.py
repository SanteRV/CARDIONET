"""Blueprint para endpoints de evaluación de riesgo."""
from flask import Blueprint, request, jsonify
from flask_limiter import Limiter

from database.config import SessionLocal
from repositories.paciente_repo import guardar_evaluacion
from validators.evaluacion_validator import validar_datos_evaluacion
from services.evaluacion_service import ejecutar_evaluacion
from ml.model_loader import modelo_disponible, predecir_comparativo
from utils.security import mensaje_error_seguro

evaluacion_bp = Blueprint('evaluacion', __name__)

# Métricas de referencia de los modelos (del entrenamiento)
METRICAS_MODELOS = {
    'random_forest': {'accuracy': 90.91, 'precision': 83.33, 'recall': 100.0, 'f1': 90.91},
    'decision_tree': {'accuracy': 54.55, 'precision': 50.0, 'recall': 80.0, 'f1': 61.54},
    'svm': {'accuracy': 81.82, 'precision': 71.43, 'recall': 100.0, 'f1': 83.33},
}


def init_evaluacion_bp(limiter: Limiter):
    """Registra las rutas del blueprint con rate limiting."""

    @evaluacion_bp.route('/evaluacion', methods=['POST'])
    @limiter.limit("30 per minute")
    def evaluar_paciente():
        try:
            data = request.json
            validar_datos_evaluacion(data)

            if not modelo_disponible():
                return jsonify({'error': 'Modelo no cargado'}), 500

            resultado = ejecutar_evaluacion(data)
            return jsonify(resultado)

        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except RuntimeError as e:
            return jsonify({'error': str(e)}), 500
        except Exception as e:
            return jsonify({'error': mensaje_error_seguro(e)}), 400

    @evaluacion_bp.route('/evaluacion/comparativo', methods=['POST'])
    @limiter.limit("30 per minute")
    def evaluacion_comparativo():
        """Compara predicciones de RF, Decision Tree y SVM para el análisis de modelos."""
        try:
            data = request.json
            if not data or 'parametros' not in data:
                return jsonify({'error': 'Se requieren parametros (lista de 13 valores)'}), 400
            parametros = data['parametros']
            if not isinstance(parametros, list) or len(parametros) != 13:
                return jsonify({'error': 'parametros debe ser una lista de 13 números'}), 400
            parametros = [float(x) for x in parametros]

            if not modelo_disponible():
                return jsonify({'error': 'Modelo no cargado'}), 500

            comparativo = predecir_comparativo(parametros)
            comparativo['metricas_modelos'] = METRICAS_MODELOS

            # Guardar evaluación (paciente_id=None) para entrenamiento futuro de modelos
            pred_rf = comparativo.get('random_forest')
            if pred_rf is not None:
                db = SessionLocal()
                try:
                    guardar_evaluacion(db, paciente_id=None, parametros=parametros, prediccion=pred_rf['prediccion'])
                finally:
                    db.close()

            return jsonify(comparativo)

        except Exception as e:
            return jsonify({'error': mensaje_error_seguro(e)}), 400
