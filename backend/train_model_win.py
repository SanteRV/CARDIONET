# -*- coding: utf-8 -*-
import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
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

# Cargar dataset (compatible con ejecucion local y Docker)
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

# Exploracion basica
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

# Separar caracteristicas y variable objetivo
print("\n[4] Preparando datos para entrenamiento...")
X = df.drop('target', axis=1)
y = df['target']

X_mat = X.values
y_vec = y.values

print(f"Caracteristicas (X): {X.shape}")
print(f"Variable objetivo (y): {y.shape}")
print(f"\nDistribucion de clases:")
print(f"  - Sin enfermedad cardiaca (0): {(y == 0).sum()} pacientes ({(y == 0).sum() / len(y) * 100:.2f}%)")
print(f"  - Con enfermedad cardiaca (1): {(y == 1).sum()} pacientes ({(y == 1).sum() / len(y) * 100:.2f}%)")

# ============================================
# VALIDACION CRUZADA 10-FOLD
# Consistente con la validacion MATLAB
# ============================================
k = 10
print(f"\n[5] Configurando {k}-Fold Cross Validation estratificado...")
skf = StratifiedKFold(n_splits=k, shuffle=True, random_state=1)

# Metricas por fold para cada modelo
metricas_rf = {'accuracy': [], 'precision': [], 'recall': [], 'f1': []}
metricas_dt = {'accuracy': [], 'precision': [], 'recall': [], 'f1': []}
metricas_svm = {'accuracy': [], 'precision': [], 'recall': [], 'f1': []}

print(f"\n{'=' * 80}")
print(f"CROSS VALIDATION {k}-FOLD PARA LOS 3 MODELOS")
print(f"{'=' * 80}")

for fold, (train_idx, test_idx) in enumerate(skf.split(X_mat, y_vec), 1):
    X_train, X_test = X_mat[train_idx], X_mat[test_idx]
    y_train, y_test = y_vec[train_idx], y_vec[test_idx]

    print(f"\n--- Fold {fold}/{k} (Train: {len(train_idx)}, Test: {len(test_idx)}) ---")

    # ==============================
    # RANDOM FOREST
    # ==============================
    rf_model = RandomForestClassifier(
        n_estimators=100,
        criterion='gini',
        max_features='sqrt',
        bootstrap=True,
        random_state=1,
        n_jobs=-1,
    )
    rf_model.fit(X_train, y_train)
    y_pred_rf = rf_model.predict(X_test)

    TP = np.sum((y_pred_rf == 1) & (y_test == 1))
    TN = np.sum((y_pred_rf == 0) & (y_test == 0))
    FP = np.sum((y_pred_rf == 1) & (y_test == 0))
    FN = np.sum((y_pred_rf == 0) & (y_test == 1))

    acc = (TP + TN) / (TP + TN + FP + FN)
    prec = TP / (TP + FP) if (TP + FP) > 0 else 0
    rec = TP / (TP + FN) if (TP + FN) > 0 else 0
    f1 = 2 * (prec * rec) / (prec + rec) if (prec + rec) > 0 else 0

    metricas_rf['accuracy'].append(acc)
    metricas_rf['precision'].append(prec)
    metricas_rf['recall'].append(rec)
    metricas_rf['f1'].append(f1)

    print(f"  RF  -> Acc: {acc*100:.2f}%, Prec: {prec:.2f}, Rec: {rec:.2f}, F1: {f1:.2f}")

    # ==============================
    # DECISION TREE (sin restricciones, consistente con MATLAB)
    # ==============================
    dt_model = DecisionTreeClassifier(
        criterion='gini',
        random_state=1,
    )
    dt_model.fit(X_train, y_train)
    y_pred_dt = dt_model.predict(X_test)

    TP = np.sum((y_pred_dt == 1) & (y_test == 1))
    TN = np.sum((y_pred_dt == 0) & (y_test == 0))
    FP = np.sum((y_pred_dt == 1) & (y_test == 0))
    FN = np.sum((y_pred_dt == 0) & (y_test == 1))

    acc = (TP + TN) / (TP + TN + FP + FN)
    prec = TP / (TP + FP) if (TP + FP) > 0 else 0
    rec = TP / (TP + FN) if (TP + FN) > 0 else 0
    f1 = 2 * (prec * rec) / (prec + rec) if (prec + rec) > 0 else 0

    metricas_dt['accuracy'].append(acc)
    metricas_dt['precision'].append(prec)
    metricas_dt['recall'].append(rec)
    metricas_dt['f1'].append(f1)

    print(f"  DT  -> Acc: {acc*100:.2f}%, Prec: {prec:.2f}, Rec: {rec:.2f}, F1: {f1:.2f}")

    # ==============================
    # SVM (con StandardScaler por fold)
    # ==============================
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    svm_model = SVC(
        kernel='rbf',
        C=1.0,
        gamma='scale',
        probability=True,
        random_state=1,
    )
    svm_model.fit(X_train_scaled, y_train)
    y_pred_svm = svm_model.predict(X_test_scaled)

    TP = np.sum((y_pred_svm == 1) & (y_test == 1))
    TN = np.sum((y_pred_svm == 0) & (y_test == 0))
    FP = np.sum((y_pred_svm == 1) & (y_test == 0))
    FN = np.sum((y_pred_svm == 0) & (y_test == 1))

    acc = (TP + TN) / (TP + TN + FP + FN)
    prec = TP / (TP + FP) if (TP + FP) > 0 else 0
    rec = TP / (TP + FN) if (TP + FN) > 0 else 0
    f1 = 2 * (prec * rec) / (prec + rec) if (prec + rec) > 0 else 0

    metricas_svm['accuracy'].append(acc)
    metricas_svm['precision'].append(prec)
    metricas_svm['recall'].append(rec)
    metricas_svm['f1'].append(f1)

    print(f"  SVM -> Acc: {acc*100:.2f}%, Prec: {prec:.2f}, Rec: {rec:.2f}, F1: {f1:.2f}")

# ============================================
# RESULTADOS PROMEDIO DEL CROSS VALIDATION
# ============================================
print(f"\n{'=' * 80}")
print(f"RESULTADOS PROMEDIO - {k}-FOLD CROSS VALIDATION")
print(f"{'=' * 80}")

print("\nRANDOM FOREST:")
print(f"  Exactitud promedio:     {np.mean(metricas_rf['accuracy'])*100:.2f}%")
print(f"  Precision promedio:     {np.mean(metricas_rf['precision']):.2f}")
print(f"  Sensibilidad promedio:  {np.mean(metricas_rf['recall']):.2f}")
print(f"  F1-score promedio:      {np.mean(metricas_rf['f1']):.2f}")

print("\nDECISION TREE:")
print(f"  Exactitud promedio:     {np.mean(metricas_dt['accuracy'])*100:.2f}%")
print(f"  Precision promedio:     {np.mean(metricas_dt['precision']):.2f}")
print(f"  Sensibilidad promedio:  {np.mean(metricas_dt['recall']):.2f}")
print(f"  F1-score promedio:      {np.mean(metricas_dt['f1']):.2f}")

print("\nSVM:")
print(f"  Exactitud promedio:     {np.mean(metricas_svm['accuracy'])*100:.2f}%")
print(f"  Precision promedio:     {np.mean(metricas_svm['precision']):.2f}")
print(f"  Sensibilidad promedio:  {np.mean(metricas_svm['recall']):.2f}")
print(f"  F1-score promedio:      {np.mean(metricas_svm['f1']):.2f}")

# Tabla comparativa
print(f"\n{'=' * 80}")
print("TABLA COMPARATIVA")
print(f"{'=' * 80}")

rf_acc = np.mean(metricas_rf['accuracy']) * 100
rf_prec = np.mean(metricas_rf['precision']) * 100
rf_rec = np.mean(metricas_rf['recall']) * 100
rf_f1 = np.mean(metricas_rf['f1']) * 100

dt_acc = np.mean(metricas_dt['accuracy']) * 100
dt_prec = np.mean(metricas_dt['precision']) * 100
dt_rec = np.mean(metricas_dt['recall']) * 100
dt_f1 = np.mean(metricas_dt['f1']) * 100

svm_acc = np.mean(metricas_svm['accuracy']) * 100
svm_prec = np.mean(metricas_svm['precision']) * 100
svm_rec = np.mean(metricas_svm['recall']) * 100
svm_f1 = np.mean(metricas_svm['f1']) * 100

print(f"\n+-----------------------------+-----------------+-----------------+-----------------+")
print(f"| Metrica                     | Random Forest   | Decision Tree   | SVM             |")
print(f"+-----------------------------+-----------------+-----------------+-----------------+")
print(f"| Exactitud (Accuracy)        |    {rf_acc:6.2f}%      |    {dt_acc:6.2f}%      |    {svm_acc:6.2f}%      |")
print(f"| Precision (Precision)       |    {rf_prec:6.2f}%      |    {dt_prec:6.2f}%      |    {svm_prec:6.2f}%      |")
print(f"| Sensibilidad (Recall)       |    {rf_rec:6.2f}%      |    {dt_rec:6.2f}%      |    {svm_rec:6.2f}%      |")
print(f"| F1-Score                    |    {rf_f1:6.2f}%      |    {dt_f1:6.2f}%      |    {svm_f1:6.2f}%      |")
print(f"+-----------------------------+-----------------+-----------------+-----------------+")

accs = [('Random Forest', rf_acc), ('Decision Tree', dt_acc), ('SVM', svm_acc)]
mejor_modelo = max(accs, key=lambda x: x[1])[0]
print(f"\n[GANADOR] Mejor modelo por Accuracy: {mejor_modelo}")

# ============================================
# ENTRENAR MODELOS FINALES CON TODOS LOS DATOS
# (Para produccion: usar 100% del dataset)
# ============================================
print(f"\n{'=' * 80}")
print("ENTRENAMIENTO FINAL - MODELOS DE PRODUCCION (100% datos)")
print(f"{'=' * 80}")

print("\n[6] Entrenando Random Forest final...")
rf_final = RandomForestClassifier(
    n_estimators=100,
    criterion='gini',
    max_features='sqrt',
    bootstrap=True,
    oob_score=True,
    random_state=1,
    n_jobs=-1,
)
rf_final.fit(X_mat, y_vec)
print(f"[OK] Random Forest entrenado con {len(y_vec)} muestras")
print(f"[OK] OOB Score: {rf_final.oob_score_ * 100:.2f}%")

print("\n[7] Entrenando Decision Tree final...")
dt_final = DecisionTreeClassifier(
    criterion='gini',
    random_state=1,
)
dt_final.fit(X_mat, y_vec)
print(f"[OK] Decision Tree entrenado con {len(y_vec)} muestras")

print("\n[8] Entrenando SVM final...")
scaler_final = StandardScaler()
X_scaled_final = scaler_final.fit_transform(X_mat)
svm_final = SVC(
    kernel='rbf',
    C=1.0,
    gamma='scale',
    probability=True,
    random_state=1,
)
svm_final.fit(X_scaled_final, y_vec)
print(f"[OK] SVM entrenado con {len(y_vec)} muestras")

# ============================================
# GUARDAR MODELOS ENTRENADOS
# ============================================
print(f"\n{'=' * 80}")
print("GUARDANDO MODELOS ENTRENADOS")
print(f"{'=' * 80}")

models_dir = os.path.join(script_dir, 'ml_models')
if not os.path.exists(models_dir):
    models_dir = os.path.join(script_dir, '..', 'ml_models')
if not os.path.exists(models_dir):
    os.makedirs(models_dir)
    print(f"[OK] Directorio creado: {models_dir}")

print("\n[9] Guardando modelos entrenados...")
joblib.dump(rf_final, os.path.join(models_dir, 'random_forest_model.pkl'))
print(f"[OK] Random Forest guardado: {os.path.join(models_dir, 'random_forest_model.pkl')}")

joblib.dump(dt_final, os.path.join(models_dir, 'decision_tree_model.pkl'))
print(f"[OK] Decision Tree guardado: {os.path.join(models_dir, 'decision_tree_model.pkl')}")

joblib.dump(svm_final, os.path.join(models_dir, 'svm_model.pkl'))
joblib.dump(scaler_final, os.path.join(models_dir, 'svm_scaler.pkl'))
print(f"[OK] SVM guardado: {os.path.join(models_dir, 'svm_model.pkl')}")
print(f"[OK] SVM Scaler guardado: {os.path.join(models_dir, 'svm_scaler.pkl')}")

feature_names = list(X.columns)
joblib.dump(feature_names, os.path.join(models_dir, 'feature_names.pkl'))
print(f"[OK] Nombres de caracteristicas guardados: {os.path.join(models_dir, 'feature_names.pkl')}")

# Importancia de variables (Random Forest final)
print(f"\n{'=' * 80}")
print("IMPORTANCIA DE VARIABLES (Random Forest)")
print(f"{'=' * 80}")

feature_importance = pd.DataFrame({
    'Variable': X.columns,
    'Importancia': rf_final.feature_importances_
}).sort_values('Importancia', ascending=False)

for idx, row in feature_importance.iterrows():
    bar_length = int(row['Importancia'] * 100)
    bar = '#' * bar_length
    print(f"{row['Variable']:25s} | {bar} {row['Importancia']:.4f}")

# Metricas para actualizar en evaluacion_bp.py
print(f"\n{'=' * 80}")
print("METRICAS PARA evaluacion_bp.py (promedios del {}-Fold CV)".format(k))
print(f"{'=' * 80}")
print(f"""
METRICAS_MODELOS = {{
    'random_forest': {{'accuracy': {rf_acc:.2f}, 'precision': {rf_prec:.2f}, 'recall': {rf_rec:.2f}, 'f1': {rf_f1:.2f}}},
    'decision_tree': {{'accuracy': {dt_acc:.2f}, 'precision': {dt_prec:.2f}, 'recall': {dt_rec:.2f}, 'f1': {dt_f1:.2f}}},
    'svm': {{'accuracy': {svm_acc:.2f}, 'precision': {svm_prec:.2f}, 'recall': {svm_rec:.2f}, 'f1': {svm_f1:.2f}}},
}}
""")

print(f"\n{'=' * 80}")
print("[OK] PROCESO DE ENTRENAMIENTO COMPLETADO EXITOSAMENTE")
print(f"{'=' * 80}")
print(f"\n[INFO] Validacion: {k}-Fold Cross Validation estratificado")
print(f"[INFO] Modelos de produccion entrenados con 100% de los datos")
print(f"[INFO] Dataset: {df.shape[0]} pacientes, {df.shape[1] - 1} caracteristicas")
print(f"[INFO] OOB Score del Random Forest: {rf_final.oob_score_ * 100:.2f}%")
print(f"\n{'=' * 80}")
