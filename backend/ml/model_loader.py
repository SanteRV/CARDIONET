"""Carga y predicción con modelos de ML."""
import os
import joblib
import numpy as np

_modelo_rf = None
_modelo_dt = None
_modelo_svm = None
_svm_scaler = None
_feature_names = None

# Mapeo de nombres del dataset a etiquetas en español
_FEATURE_LABELS = {
    'age': 'Edad',
    'sex': 'Sexo',
    'cp': 'Dolor de pecho',
    'trestbps': 'Presión arterial',
    'chol': 'Colesterol',
    'fbs': 'Glucosa',
    'restecg': 'Resultado ECG',
    'thalach': 'Frecuencia cardíaca',
    'exang': 'Angina',
    'oldpeak': 'Depresión ST',
    'slope': 'Pendiente ST',
    'ca': 'Número de vasos',
    'thal': 'Thalassemia',
}


def cargar_modelos() -> None:
    """Carga los modelos de Random Forest, Decision Tree y SVM."""
    global _modelo_rf, _modelo_dt, _modelo_svm, _svm_scaler, _feature_names
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    # Docker: ml_models montado en /app/ml_models; Local: ml_models en proyecto/
    candidates = [
        os.path.join(base_dir, 'ml_models'),
        os.path.join(base_dir, '..', 'ml_models'),
    ]
    models_dir = None
    for d in candidates:
        pkl = os.path.join(d, 'random_forest_model.pkl')
        if os.path.isfile(pkl):
            models_dir = d
            break
    if not models_dir:
        return  # Sin modelo: predecir() lanzará RuntimeError
    try:
        _modelo_rf = joblib.load(os.path.join(models_dir, 'random_forest_model.pkl'))
        _modelo_dt = joblib.load(os.path.join(models_dir, 'decision_tree_model.pkl'))
        try:
            _modelo_svm = joblib.load(os.path.join(models_dir, 'svm_model.pkl'))
            _svm_scaler = joblib.load(os.path.join(models_dir, 'svm_scaler.pkl'))
        except Exception:
            _modelo_svm = None
            _svm_scaler = None
        try:
            _feature_names = joblib.load(os.path.join(models_dir, 'feature_names.pkl'))
        except Exception:
            _feature_names = None
    except Exception:
        pass  # Sin modelo: predecir() lanzará RuntimeError


def predecir_riesgo(parametros: list) -> tuple:
    """
    Realiza predicción de riesgo cardíaco con Random Forest.
    Retorna (prediccion: int, probabilidad_riesgo: float).
    """
    if _modelo_rf is None:
        raise RuntimeError('Modelo no cargado')
    X = np.array([parametros])
    prediccion = int(_modelo_rf.predict(X)[0])
    probabilidad = float(_modelo_rf.predict_proba(X)[0][1])
    return prediccion, probabilidad


def modelo_disponible() -> bool:
    """Indica si el modelo de predicción está cargado."""
    return _modelo_rf is not None


def predecir_comparativo(parametros: list) -> dict:
    """
    Ejecuta predicción con los 3 modelos (RF, DT, SVM) para análisis comparativo.
    Retorna dict con predicciones y probabilidades por modelo.
    """
    X = np.array([parametros])
    resultado = {
        'random_forest': None,
        'decision_tree': None,
        'svm': None,
        'parametros': parametros,
    }
    if _modelo_rf is not None:
        pred = int(_modelo_rf.predict(X)[0])
        prob = float(_modelo_rf.predict_proba(X)[0][1])
        resultado['random_forest'] = {'prediccion': pred, 'probabilidad': prob}
    if _modelo_dt is not None:
        pred = int(_modelo_dt.predict(X)[0])
        prob = float(_modelo_dt.predict_proba(X)[0][1])
        resultado['decision_tree'] = {'prediccion': pred, 'probabilidad': prob}
    if _modelo_svm is not None and _svm_scaler is not None:
        X_scaled = _svm_scaler.transform(X)
        pred = int(_modelo_svm.predict(X_scaled)[0])
        prob = float(_modelo_svm.predict_proba(X_scaled)[0][1])
        resultado['svm'] = {'prediccion': pred, 'probabilidad': prob}
    return resultado


def obtener_feature_importances(limite: int = 8) -> list[dict]:
    """
    Retorna la importancia de las variables del modelo Random Forest.
    Formato: [{"nombre": str, "importancia": float}, ...] ordenado por importancia descendente.
    Si feature_names.pkl no existe, retorna lista vacía.
    """
    if _modelo_rf is None:
        return []
    importances = _modelo_rf.feature_importances_
    names = _feature_names if _feature_names is not None else []
    if len(names) != len(importances):
        names = [f'Var_{i}' for i in range(len(importances))]
    resultado = []
    for name, imp in zip(names, importances):
        label = _FEATURE_LABELS.get(str(name).lower(), name)
        resultado.append({'nombre': label, 'importancia': float(imp)})
    resultado.sort(key=lambda x: x['importancia'], reverse=True)
    return resultado[:limite]
