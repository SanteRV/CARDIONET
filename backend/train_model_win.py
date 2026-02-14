# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_score, recall_score, f1_score
import joblib
import os
import sys

# Configurar encoding para Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("=" * 80)
print("CARDIONET - Entrenamiento de Modelos de Prediccion de Cardiopatias")
print("=" * 80)

# Cargar dataset (compatible con ejecución local y Docker)
print("\n[1] Cargando dataset...")
script_dir = os.path.dirname(os.path.abspath(__file__))
candidates = [
    os.path.join(script_dir, '..', 'data', 'heart_disease_sample.csv'),
    os.path.join(script_dir, 'data_external', 'heart_disease_sample.csv'),
]
data_path = None
for p in candidates:
    if os.path.exists(p):
        data_path = p
        break

if not data_path:
    print(f"Error: No se encontro heart_disease_sample.csv")
    print("Rutas probadas:", candidates)
    print("En Docker, asegurate de montar ./data en el backend (ej: /app/data_external)")
    exit(1)

df = pd.read_csv(data_path)
print(f"[OK] Dataset cargado exitosamente: {df.shape[0]} filas, {df.shape[1]} columnas")

# Exploración básica
print("\n[2] Resumen del dataset:")
print(df.head(10))
print("\nInformacion del dataset:")
print(df.info())
print("\nEstadisticas descriptivas:")
print(df.describe())

# Verificar valores nulos
print("\n[3] Verificando valores nulos:")
nulls = df.isnull().sum()
if nulls.sum() == 0:
    print("[OK] No se encontraron valores nulos en el dataset")
else:
    print(nulls)

# Separar características y variable objetivo
print("\n[4] Preparando datos para entrenamiento...")
X = df.drop('target', axis=1)
y = df['target']

print(f"Caracteristicas (X): {X.shape}")
print(f"Variable objetivo (y): {y.shape}")
print(f"\nDistribucion de clases:")
print(f"  - Sin enfermedad cardiaca (0): {(y == 0).sum()} pacientes ({(y == 0).sum() / len(y) * 100:.2f}%)")
print(f"  - Con enfermedad cardiaca (1): {(y == 1).sum()} pacientes ({(y == 1).sum() / len(y) * 100:.2f}%)")

# División del dataset en 80% entrenamiento y 20% prueba
print("\n[5] Dividiendo dataset en 80% entrenamiento y 20% prueba...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=1, stratify=y
)

print(f"[OK] Conjunto de entrenamiento: {X_train.shape[0]} muestras ({X_train.shape[0] / len(X) * 100:.1f}%)")
print(f"[OK] Conjunto de prueba: {X_test.shape[0]} muestras ({X_test.shape[0] / len(X) * 100:.1f}%)")

# No usar StandardScaler para mantener consistencia con MATLAB
print("\n[6] Preparando datos (sin normalizacion para consistencia con modelo MATLAB)...")
X_train_data = X_train.values
X_test_data = X_test.values
y_train_data = y_train.values
y_test_data = y_test.values

# ============================================
# MODELO: BOSQUE ALEATORIO (RANDOM FOREST)
# Equivalente al TreeBagger de MATLAB
# ============================================
print("\n" + "=" * 80)
print("ENTRENAMIENTO DEL BOSQUE ALEATORIO (RANDOM FOREST)")
print("=" * 80)

print("\n[7] Configurando modelo Random Forest (equivalente a TreeBagger)...")
print("    - Numero de arboles: 100")
print("    - Metodo: Clasificacion")
print("    - OOB Prediction: Activado")
print("    - Semilla aleatoria: 1 (para reproducibilidad)")

# Entrenamiento del Bosque Aleatorio
rf_model = RandomForestClassifier(
    n_estimators=100,          # Número de árboles en el bosque
    criterion='gini',          # Función de división
    max_features='sqrt',       # Máximo de características por división
    bootstrap=True,            # Bootstrap sampling
    oob_score=True,            # Calcular OOB score
    random_state=1,            # Semilla para reproducibilidad (rng(1) en MATLAB)
    n_jobs=-1,                 # Usar todos los procesadores
    verbose=0
)

print("\n[8] Entrenando Random Forest...")
rf_model.fit(X_train_data, y_train_data)
print("[OK] Modelo Random Forest entrenado exitosamente")
print(f"[OK] OOB Score: {rf_model.oob_score_ * 100:.2f}%")

# Predicciones
print("\n[9] Realizando predicciones en conjunto de prueba...")
y_pred_rf = rf_model.predict(X_test_data)

# Cálculo de métricas (equivalente al código MATLAB)
print("\n[10] Calculando metricas de evaluacion...")
TP = np.sum((y_test_data == 1) & (y_pred_rf == 1))
TN = np.sum((y_test_data == 0) & (y_pred_rf == 0))
FP = np.sum((y_test_data == 0) & (y_pred_rf == 1))
FN = np.sum((y_test_data == 1) & (y_pred_rf == 0))

accuracy = (TP + TN) / (TP + TN + FP + FN)
precision = TP / (TP + FP) if (TP + FP) > 0 else 0
recall = TP / (TP + FN) if (TP + FN) > 0 else 0
f1score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

# Matriz de confusión
cm = confusion_matrix(y_test_data, y_pred_rf)

print("\n" + "=" * 80)
print("METRICAS DEL BOSQUE ALEATORIO:")
print("=" * 80)
print(f"Exactitud (Accuracy):       {accuracy * 100:.2f}%")
print(f"Precision (Precision):      {precision * 100:.2f}%")
print(f"Sensibilidad (Recall):      {recall * 100:.2f}%")
print(f"F1-Score:                   {f1score * 100:.2f}%")

print("\nMatriz de Confusion:")
print(f"    Predicho: 0    Predicho: 1")
print(f"Real: 0    {TN:3d}          {FP:3d}")
print(f"Real: 1    {FN:3d}          {TP:3d}")
print(f"\nVerdaderos Positivos (TP): {TP}")
print(f"Verdaderos Negativos (TN): {TN}")
print(f"Falsos Positivos (FP):     {FP}")
print(f"Falsos Negativos (FN):     {FN}")

# Reporte de clasificación detallado
print("\nReporte de Clasificacion Detallado:")
print(classification_report(y_test_data, y_pred_rf, target_names=['Sin enfermedad', 'Con enfermedad']))

# Importancia de las variables (equivalente a OOBPermutedPredictorDeltaError)
print("\n[11] Calculando importancia de variables...")
feature_importance = pd.DataFrame({
    'Variable': X.columns,
    'Importancia': rf_model.feature_importances_
}).sort_values('Importancia', ascending=False)

print("\nImportancia de las Variables en el Bosque Aleatorio:")
print("=" * 80)
for idx, row in feature_importance.iterrows():
    bar_length = int(row['Importancia'] * 100)
    bar = '#' * bar_length
    print(f"{row['Variable']:25s} | {bar} {row['Importancia']:.4f}")
print("=" * 80)

# ============================================
# MODELO ADICIONAL: ÁRBOL DE DECISIÓN
# ============================================
print("\n" + "=" * 80)
print("ENTRENAMIENTO DE ARBOL DE DECISION (DECISION TREE)")
print("=" * 80)

print("\n[12] Entrenando Arbol de Decision...")
dt_model = DecisionTreeClassifier(
    criterion='gini',
    max_depth=8,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=1
)

dt_model.fit(X_train_data, y_train_data)
print("[OK] Modelo Decision Tree entrenado exitosamente")

# Predicciones
y_pred_dt = dt_model.predict(X_test_data)

# Evaluación
accuracy_dt = accuracy_score(y_test_data, y_pred_dt)
precision_dt = precision_score(y_test_data, y_pred_dt, zero_division=0)
recall_dt = recall_score(y_test_data, y_pred_dt, zero_division=0)
f1_dt = f1_score(y_test_data, y_pred_dt, zero_division=0)

print("\nMETRICAS DEL ARBOL DE DECISION:")
print("=" * 80)
print(f"Exactitud (Accuracy):       {accuracy_dt * 100:.2f}%")
print(f"Precision (Precision):      {precision_dt * 100:.2f}%")
print(f"Sensibilidad (Recall):      {recall_dt * 100:.2f}%")
print(f"F1-Score:                   {f1_dt * 100:.2f}%")

print("\nReporte de Clasificacion:")
print(classification_report(y_test_data, y_pred_dt, target_names=['Sin enfermedad', 'Con enfermedad']))

# ============================================
# MODELO ADICIONAL: SVM (Support Vector Machine)
# ============================================
print("\n" + "=" * 80)
print("ENTRENAMIENTO DE SVM (Support Vector Machine)")
print("=" * 80)

print("\n[13] SVM requiere normalizacion. Aplicando StandardScaler...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train_data)
X_test_scaled = scaler.transform(X_test_data)

print("\n[14] Entrenando SVM (kernel RBF)...")
svm_model = SVC(
    kernel='rbf',
    C=1.0,
    gamma='scale',
    probability=True,  # Para obtener probabilidades en predict_proba
    random_state=1
)
svm_model.fit(X_train_scaled, y_train_data)
print("[OK] Modelo SVM entrenado exitosamente")

# Predicciones
y_pred_svm = svm_model.predict(X_test_scaled)

# Evaluación
accuracy_svm = accuracy_score(y_test_data, y_pred_svm)
precision_svm = precision_score(y_test_data, y_pred_svm, zero_division=0)
recall_svm = recall_score(y_test_data, y_pred_svm, zero_division=0)
f1_svm = f1_score(y_test_data, y_pred_svm, zero_division=0)

print("\nMETRICAS DEL SVM:")
print("=" * 80)
print(f"Exactitud (Accuracy):       {accuracy_svm * 100:.2f}%")
print(f"Precision (Precision):      {precision_svm * 100:.2f}%")
print(f"Sensibilidad (Recall):      {recall_svm * 100:.2f}%")
print(f"F1-Score:                   {f1_svm * 100:.2f}%")

print("\nReporte de Clasificacion:")
print(classification_report(y_test_data, y_pred_svm, target_names=['Sin enfermedad', 'Con enfermedad']))

# ============================================
# GUARDAR MODELOS ENTRENADOS
# ============================================
print("\n" + "=" * 80)
print("GUARDANDO MODELOS ENTRENADOS")
print("=" * 80)

# ml_models: ../ml_models (local) o ml_models (Docker: montado en /app/ml_models)
models_dir = os.path.join(script_dir, 'ml_models')
if not os.path.exists(models_dir):
    models_dir = os.path.join(script_dir, '..', 'ml_models')
if not os.path.exists(models_dir):
    os.makedirs(models_dir)
    print(f"[OK] Directorio creado: {models_dir}")

print("\n[15] Guardando modelos entrenados...")
joblib.dump(rf_model, os.path.join(models_dir, 'random_forest_model.pkl'))
print(f"[OK] Random Forest guardado: {os.path.join(models_dir, 'random_forest_model.pkl')}")

joblib.dump(dt_model, os.path.join(models_dir, 'decision_tree_model.pkl'))
print(f"[OK] Decision Tree guardado: {os.path.join(models_dir, 'decision_tree_model.pkl')}")

joblib.dump(svm_model, os.path.join(models_dir, 'svm_model.pkl'))
joblib.dump(scaler, os.path.join(models_dir, 'svm_scaler.pkl'))
print(f"[OK] SVM guardado: {os.path.join(models_dir, 'svm_model.pkl')}")
print(f"[OK] SVM Scaler guardado: {os.path.join(models_dir, 'svm_scaler.pkl')}")

# Guardar también la lista de características para referencia
feature_names = list(X.columns)
joblib.dump(feature_names, os.path.join(models_dir, 'feature_names.pkl'))
print(f"[OK] Nombres de caracteristicas guardados: {os.path.join(models_dir, 'feature_names.pkl')}")

# ============================================
# RESUMEN FINAL Y COMPARACIÓN
# ============================================
print("\n" + "=" * 80)
print("RESUMEN FINAL - COMPARACION DE MODELOS")
print("=" * 80)

print("\n+-----------------------------+-----------------+-----------------+-----------------+")
print("| Metrica                     | Random Forest   | Decision Tree   | SVM             |")
print("+-----------------------------+-----------------+-----------------+-----------------+")
print(f"| Exactitud (Accuracy)        |    {accuracy * 100:6.2f}%      |    {accuracy_dt * 100:6.2f}%      |    {accuracy_svm * 100:6.2f}%      |")
print(f"| Precision (Precision)       |    {precision * 100:6.2f}%      |    {precision_dt * 100:6.2f}%      |    {precision_svm * 100:6.2f}%      |")
print(f"| Sensibilidad (Recall)       |    {recall * 100:6.2f}%      |    {recall_dt * 100:6.2f}%      |    {recall_svm * 100:6.2f}%      |")
print(f"| F1-Score                    |    {f1score * 100:6.2f}%      |    {f1_dt * 100:6.2f}%      |    {f1_svm * 100:6.2f}%      |")
print("+-----------------------------+-----------------+-----------------+-----------------+")

accs = [('Random Forest', accuracy), ('Decision Tree', accuracy_dt), ('SVM', accuracy_svm)]
mejor_modelo = max(accs, key=lambda x: x[1])[0]
print(f"\n[GANADOR] Mejor modelo por Accuracy: {mejor_modelo}")

print("\n" + "=" * 80)
print("[OK] PROCESO DE ENTRENAMIENTO COMPLETADO EXITOSAMENTE")
print("=" * 80)
print("\n[INFO] Los modelos estan listos para ser utilizados en CARDIONET")
print("[INFO] El modelo Random Forest sera usado para las predicciones en produccion")
print(f"[INFO] Dataset: {df.shape[0]} pacientes, {df.shape[1] - 1} caracteristicas")
print(f"[INFO] OOB Score del Random Forest: {rf_model.oob_score_ * 100:.2f}%")
print("\n" + "=" * 80)
