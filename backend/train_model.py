import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler
import joblib
import os

print("=" * 80)
print("CARDIONET - Entrenamiento de Modelos de Predicción de Cardiopatías")
print("=" * 80)

# Cargar dataset
print("\n[1] Cargando dataset...")
data_path = os.path.join('..', 'data', 'heart_disease_sample.csv')

if not os.path.exists(data_path):
    print(f"Error: No se encontró el archivo {data_path}")
    print("Por favor, asegúrate de tener el dataset 'heart.csv' en la carpeta 'data'")
    exit(1)

df = pd.read_csv(data_path)
print(f"✓ Dataset cargado exitosamente: {df.shape[0]} filas, {df.shape[1]} columnas")

# Exploración básica
print("\n[2] Resumen del dataset:")
print(df.head(10))
print("\nInformación del dataset:")
print(df.info())
print("\nEstadísticas descriptivas:")
print(df.describe())

# Verificar valores nulos
print("\n[3] Verificando valores nulos:")
nulls = df.isnull().sum()
if nulls.sum() == 0:
    print("✓ No se encontraron valores nulos en el dataset")
else:
    print(nulls)

# Separar características y variable objetivo
print("\n[4] Preparando datos para entrenamiento...")
X = df.drop('target', axis=1)
y = df['target']

print(f"Características (X): {X.shape}")
print(f"Variable objetivo (y): {y.shape}")
print(f"\nDistribución de clases:")
print(f"  - Sin enfermedad cardíaca (0): {(y == 0).sum()} pacientes ({(y == 0).sum() / len(y) * 100:.2f}%)")
print(f"  - Con enfermedad cardíaca (1): {(y == 1).sum()} pacientes ({(y == 1).sum() / len(y) * 100:.2f}%)")

# División del dataset en 80% entrenamiento y 20% prueba
print("\n[5] Dividiendo dataset en 80% entrenamiento y 20% prueba...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=1, stratify=y
)

print(f"✓ Conjunto de entrenamiento: {X_train.shape[0]} muestras ({X_train.shape[0] / len(X) * 100:.1f}%)")
print(f"✓ Conjunto de prueba: {X_test.shape[0]} muestras ({X_test.shape[0] / len(X) * 100:.1f}%)")

# No usar StandardScaler para mantener consistencia con MATLAB
print("\n[6] Preparando datos (sin normalización para consistencia con modelo MATLAB)...")
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
print("    - Número de árboles: 100")
print("    - Método: Clasificación")
print("    - OOB Prediction: Activado")
print("    - Semilla aleatoria: 1 (para reproducibilidad)")

# Entrenamiento del Bosque Aleatorio
# Equivalente a: TreeBagger(100, X_train, Y_train, 'Method', 'classification',
#                           'OOBPrediction', 'on', 'OOBPredictorImportance', 'on')
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
print("✓ Modelo Random Forest entrenado exitosamente")
print(f"✓ OOB Score: {rf_model.oob_score_ * 100:.2f}%")

# Predicciones
print("\n[9] Realizando predicciones en conjunto de prueba...")
y_pred_rf = rf_model.predict(X_test_data)

# Cálculo de métricas (equivalente al código MATLAB)
print("\n[10] Calculando métricas de evaluación...")
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
print("📊 MÉTRICAS DEL BOSQUE ALEATORIO:")
print("=" * 80)
print(f"Exactitud (Accuracy):       {accuracy * 100:.2f}%")
print(f"Precisión (Precision):      {precision * 100:.2f}%")
print(f"Sensibilidad (Recall):      {recall * 100:.2f}%")
print(f"F1-Score:                   {f1score * 100:.2f}%")

print("\n📈 Matriz de Confusión:")
print(f"    Predicho: 0    Predicho: 1")
print(f"Real: 0    {TN:3d}          {FP:3d}")
print(f"Real: 1    {FN:3d}          {TP:3d}")
print(f"\nVerdaderos Positivos (TP): {TP}")
print(f"Verdaderos Negativos (TN): {TN}")
print(f"Falsos Positivos (FP):     {FP}")
print(f"Falsos Negativos (FN):     {FN}")

# Reporte de clasificación detallado
print("\n📋 Reporte de Clasificación Detallado:")
print(classification_report(y_test_data, y_pred_rf, target_names=['Sin enfermedad', 'Con enfermedad']))

# Importancia de las variables (equivalente a OOBPermutedPredictorDeltaError)
print("\n[11] Calculando importancia de variables...")
feature_importance = pd.DataFrame({
    'Variable': X.columns,
    'Importancia': rf_model.feature_importances_
}).sort_values('Importancia', ascending=False)

print("\n📊 Importancia de las Variables en el Bosque Aleatorio:")
print("=" * 80)
for idx, row in feature_importance.iterrows():
    bar_length = int(row['Importancia'] * 100)
    bar = '█' * bar_length
    print(f"{row['Variable']:25s} │ {bar} {row['Importancia']:.4f}")
print("=" * 80)

# ============================================
# MODELO ADICIONAL: ÁRBOL DE DECISIÓN
# ============================================
print("\n" + "=" * 80)
print("ENTRENAMIENTO DE ÁRBOL DE DECISIÓN (DECISION TREE)")
print("=" * 80)

print("\n[12] Entrenando Árbol de Decisión...")
dt_model = DecisionTreeClassifier(
    criterion='gini',
    max_depth=8,
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=1
)

dt_model.fit(X_train_data, y_train_data)
print("✓ Modelo Decision Tree entrenado exitosamente")

# Predicciones
y_pred_dt = dt_model.predict(X_test_data)

# Evaluación
accuracy_dt = accuracy_score(y_test_data, y_pred_dt)
precision_dt = precision_score(y_test_data, y_pred_dt, zero_division=0)
recall_dt = recall_score(y_test_data, y_pred_dt, zero_division=0)
f1_dt = f1_score(y_test_data, y_pred_dt, zero_division=0)

print("\n📊 MÉTRICAS DEL ÁRBOL DE DECISIÓN:")
print("=" * 80)
print(f"Exactitud (Accuracy):       {accuracy_dt * 100:.2f}%")
print(f"Precisión (Precision):      {precision_dt * 100:.2f}%")
print(f"Sensibilidad (Recall):      {recall_dt * 100:.2f}%")
print(f"F1-Score:                   {f1_dt * 100:.2f}%")

print("\n📋 Reporte de Clasificación:")
print(classification_report(y_test_data, y_pred_dt, target_names=['Sin enfermedad', 'Con enfermedad']))

# ============================================
# GUARDAR MODELOS ENTRENADOS
# ============================================
print("\n" + "=" * 80)
print("GUARDANDO MODELOS ENTRENADOS")
print("=" * 80)

models_dir = os.path.join('..', 'ml_models')
if not os.path.exists(models_dir):
    os.makedirs(models_dir)
    print(f"✓ Directorio creado: {models_dir}")

print("\n[13] Guardando modelos entrenados...")
joblib.dump(rf_model, os.path.join(models_dir, 'random_forest_model.pkl'))
print(f"✓ Random Forest guardado: {os.path.join(models_dir, 'random_forest_model.pkl')}")

joblib.dump(dt_model, os.path.join(models_dir, 'decision_tree_model.pkl'))
print(f"✓ Decision Tree guardado: {os.path.join(models_dir, 'decision_tree_model.pkl')}")

# Guardar también la lista de características para referencia
feature_names = list(X.columns)
joblib.dump(feature_names, os.path.join(models_dir, 'feature_names.pkl'))
print(f"✓ Nombres de características guardados: {os.path.join(models_dir, 'feature_names.pkl')}")

# ============================================
# RESUMEN FINAL Y COMPARACIÓN
# ============================================
print("\n" + "=" * 80)
print("RESUMEN FINAL - COMPARACIÓN DE MODELOS")
print("=" * 80)

print("\n┌─────────────────────────────┬─────────────────┬─────────────────┐")
print("│ Métrica                     │ Random Forest   │ Decision Tree   │")
print("├─────────────────────────────┼─────────────────┼─────────────────┤")
print(f"│ Exactitud (Accuracy)        │    {accuracy * 100:6.2f}%      │    {accuracy_dt * 100:6.2f}%      │")
print(f"│ Precisión (Precision)       │    {precision * 100:6.2f}%      │    {precision_dt * 100:6.2f}%      │")
print(f"│ Sensibilidad (Recall)       │    {recall * 100:6.2f}%      │    {recall_dt * 100:6.2f}%      │")
print(f"│ F1-Score                    │    {f1score * 100:6.2f}%      │    {f1_dt * 100:6.2f}%      │")
print("└─────────────────────────────┴─────────────────┴─────────────────┘")

mejor_modelo = 'Random Forest' if accuracy > accuracy_dt else 'Decision Tree'
print(f"\n🏆 Mejor modelo por Accuracy: {mejor_modelo}")

print("\n" + "=" * 80)
print("✓ PROCESO DE ENTRENAMIENTO COMPLETADO EXITOSAMENTE")
print("=" * 80)
print("\n📌 Los modelos están listos para ser utilizados en CARDIONET")
print("📌 El modelo Random Forest será usado para las predicciones en producción")
print(f"📌 Dataset: {df.shape[0]} pacientes, {df.shape[1] - 1} características")
print(f"📌 OOB Score del Random Forest: {rf_model.oob_score_ * 100:.2f}%")
print("\n" + "=" * 80)
