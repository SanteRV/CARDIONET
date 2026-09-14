# -*- coding: utf-8 -*-
"""
CARDIONET - entrenamiento de los tres modelos para la version estatica.

Uso, desde la raiz del repositorio:
    "C:/Users/ROG STRIG/anaconda3/python.exe" ml/entrenar.py

Lee
    data/uci/processed.cleveland.data   (UCI Heart Disease, subconjunto Cleveland)
Escribe
    frontend/src/ml/modelo.json     los 3 modelos exportados para la inferencia en el navegador
    frontend/src/ml/metricas.json   fuente, validacion, metricas, importancias, rangos y ejemplos
    ml/referencia.json              entradas + salidas de scikit-learn para pruebas de paridad
Al final ejecuta ml/verificar_paridad.py (Python puro, sin scikit-learn) sobre esos JSON.

Todo es reproducible con random_state=42. Lo unico que cambia entre ejecuciones es la
fecha de entrenamiento guardada en metricas.json.
"""
from __future__ import annotations

import datetime
import json
import os
import platform
import random
import subprocess
import sys
import time
from collections import Counter
from decimal import ROUND_CEILING, ROUND_HALF_EVEN, Decimal

import numpy as np
import pandas as pd
import sklearn
from joblib import Parallel, delayed
from sklearn.base import clone
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import GridSearchCV, RepeatedStratifiedKFold, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

SEMILLA = 42
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARCHIVO_DATOS = os.path.join(RAIZ, "data", "uci", "processed.cleveland.data")
DIR_FRONT = os.path.join(RAIZ, "frontend", "src", "ml")
DIR_ML = os.path.join(RAIZ, "ml")

COLUMNAS = ["age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
            "thalach", "exang", "oldpeak", "slope", "ca", "thal", "num"]
VARIABLES = COLUMNAS[:-1]

# Codificacion original de UCI (no se recodifica nada).
META = {
    "age": {"etiqueta": "Edad", "etiqueta_corta": "Edad", "tipo": "numérica", "unidad": "años"},
    "sex": {"etiqueta": "Sexo", "etiqueta_corta": "Sexo", "tipo": "categórica",
            "codigos": {1: "Hombre", 0: "Mujer"}},
    "cp": {"etiqueta": "Tipo de dolor torácico", "etiqueta_corta": "Dolor torácico", "tipo": "categórica",
           "codigos": {1: "Angina típica", 2: "Angina atípica", 3: "Dolor no anginoso", 4: "Asintomático"}},
    "trestbps": {"etiqueta": "Presión arterial en reposo", "etiqueta_corta": "Presión arterial",
                 "tipo": "numérica", "unidad": "mm Hg"},
    "chol": {"etiqueta": "Colesterol sérico", "etiqueta_corta": "Colesterol", "tipo": "numérica",
             "unidad": "mg/dl"},
    "fbs": {"etiqueta": "Glucosa en ayunas mayor de 120 mg/dl", "etiqueta_corta": "Glucosa en ayunas",
            "tipo": "categórica", "codigos": {1: "Sí", 0: "No"}},
    "restecg": {"etiqueta": "Electrocardiograma en reposo", "etiqueta_corta": "ECG en reposo",
                "tipo": "categórica",
                "codigos": {0: "Normal", 1: "Anomalía de la onda ST-T",
                            2: "Hipertrofia ventricular izquierda probable o definida"}},
    "thalach": {"etiqueta": "Frecuencia cardíaca máxima alcanzada", "etiqueta_corta": "Frecuencia cardíaca máxima",
                "tipo": "numérica"},
    "exang": {"etiqueta": "Angina inducida por ejercicio", "etiqueta_corta": "Angina por ejercicio",
              "tipo": "categórica", "codigos": {1: "Sí", 0: "No"}},
    "oldpeak": {"etiqueta": "Depresión del ST inducida por ejercicio respecto al reposo",
                "etiqueta_corta": "Depresión del ST", "tipo": "numérica"},
    "slope": {"etiqueta": "Pendiente del ST en el pico del ejercicio", "etiqueta_corta": "Pendiente del ST",
              "tipo": "categórica", "codigos": {1: "Ascendente", 2: "Plana", 3: "Descendente"}},
    "ca": {"etiqueta": "Número de vasos principales coloreados por fluoroscopia",
           "etiqueta_corta": "Vasos coloreados", "tipo": "numérica"},
    "thal": {"etiqueta": "Thal", "etiqueta_corta": "Thal", "tipo": "categórica",
             "codigos": {3: "Normal", 6: "Defecto fijo", 7: "Defecto reversible"}},
}

CV_INTERNA = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEMILLA)

# Configuraciones comparadas. Van de la mas simple a la mas compleja: si dos empatan en
# AUC, GridSearchCV se queda con la primera (la mas simple).
MODELOS = {
    "rf": {
        "nombre": "Random Forest",
        "base": RandomForestClassifier(n_estimators=150, max_features="sqrt", min_samples_leaf=2,
                                       random_state=SEMILLA, n_jobs=1),
        "fijos": {"n_estimators": 150, "max_features": "sqrt", "min_samples_leaf": 2, "criterion": "gini"},
        "rejilla": {"max_depth": [4, 6, 8]},
        "por_que": ("150 árboles con profundidad acotada para que el modelo exportado pese poco; "
                    "min_samples_leaf=2 evita hojas de un solo paciente. La profundidad máxima "
                    "(4, 6 u 8) se elige con validación cruzada interna."),
    },
    "dt": {
        "nombre": "Árbol de decisión",
        "base": DecisionTreeClassifier(min_samples_leaf=5, random_state=SEMILLA),
        "fijos": {"min_samples_leaf": 5, "criterion": "gini"},
        "rejilla": {"max_depth": [3, 4, 5]},
        "por_que": ("Profundidad máxima baja y al menos 5 pacientes por hoja para que el árbol se "
                    "pueda leer. La profundidad (3, 4 o 5) se elige con validación cruzada interna."),
    },
    "svm": {
        "nombre": "SVM (kernel RBF)",
        "base": Pipeline([("escalador", StandardScaler()),
                          ("svc", SVC(kernel="rbf", gamma="scale", probability=True, random_state=SEMILLA))]),
        "fijos": {"escalado": "StandardScaler", "kernel": "rbf", "gamma": "scale", "probability": True},
        "rejilla": {"svc__C": [0.1, 1.0, 10.0]},
        "por_que": ("Kernel RBF sobre variables estandarizadas, con gamma='scale'. C (0,1; 1 o 10) se "
                    "elige con validación cruzada interna. probability=True calcula la probabilidad "
                    "con el método de Platt de scikit-learn."),
    },
}


# --------------------------------------------------------------------------- datos
def cargar():
    df = pd.read_csv(ARCHIVO_DATOS, header=None, names=COLUMNAS, na_values="?")
    if len(df) != 303:
        raise SystemExit(f"Se esperaban 303 filas y hay {len(df)}")
    con_faltantes = df[df.isna().any(axis=1)]
    descartadas = [{
        "linea_archivo": int(i) + 1,
        "variables_faltantes": [c for c in COLUMNAS if pd.isna(df.loc[i, c])],
        "num": int(df.loc[i, "num"]),
    } for i in con_faltantes.index]
    limpio = df.dropna()
    X = limpio[VARIABLES].to_numpy(dtype=np.float64)
    y = (limpio["num"].to_numpy() > 0).astype(np.int64)
    return df, limpio, X, y, limpio.index.to_numpy(), descartadas


def decimales(valores):
    maximo = 0
    for v in valores:
        s = repr(float(v))
        if "." in s:
            parte = s.split(".")[1].rstrip("0")
            maximo = max(maximo, len(parte))
    return maximo


def describir_variables(limpio, df):
    salida = []
    for c in VARIABLES:
        m = META[c]
        col = limpio[c]
        d = {"codigo": c, "etiqueta": m["etiqueta"], "etiqueta_corta": m["etiqueta_corta"], "tipo": m["tipo"]}
        if "unidad" in m:
            d["unidad"] = m["unidad"]
        if m["tipo"] == "numérica":
            d["min"] = entero_si_puede(col.min())
            d["max"] = entero_si_puede(col.max())
            d["decimales"] = decimales(col)
        else:
            observados = sorted(int(v) for v in col.unique())
            if set(observados) != set(m["codigos"]):
                raise SystemExit(f"{c}: valores observados {observados} distintos de la codificación {list(m['codigos'])}")
            d["valores"] = [{"valor": k, "etiqueta": m["codigos"][k]} for k in sorted(m["codigos"])]
        # rango en el archivo completo (303 filas), para dejar constancia si cambia
        completo = df[c].dropna()
        if float(completo.min()) != float(col.min()) or float(completo.max()) != float(col.max()):
            d["rango_en_303_filas"] = [entero_si_puede(completo.min()), entero_si_puede(completo.max())]
        salida.append(d)
    return salida


def entero_si_puede(v):
    v = float(v)
    return int(v) if v.is_integer() else v


# --------------------------------------------------------------------------- validacion
def evaluar_particion(clave, k, idx_ent, idx_prueba, X, y):
    m = MODELOS[clave]
    busqueda = GridSearchCV(clone(m["base"]), m["rejilla"], scoring="roc_auc", cv=CV_INTERNA, n_jobs=1)
    busqueda.fit(X[idx_ent], y[idx_ent])
    est = busqueda.best_estimator_
    proba = est.predict_proba(X[idx_prueba])[:, 1]
    # Misma regla en los tres modelos: clase 1 si la probabilidad es mayor que 0,5.
    # En los arboles coincide con predict(). En la SVM, predict() usa el signo de la funcion de
    # decision, que no siempre coincide con la probabilidad de Platt cerca de 0,5.
    pred = (proba > 0.5).astype(np.int64)
    if clave != "svm":
        assert np.array_equal(pred, est.predict(X[idx_prueba]))
    return clave, k, busqueda.best_params_, proba, pred


def metricas_particion(y_real, pred, proba):
    vp = int(np.sum((y_real == 1) & (pred == 1)))
    vn = int(np.sum((y_real == 0) & (pred == 0)))
    fp = int(np.sum((y_real == 0) & (pred == 1)))
    fn = int(np.sum((y_real == 1) & (pred == 0)))
    precision = vp / (vp + fp) if vp + fp > 0 else float("nan")
    sensibilidad = vp / (vp + fn)
    f1 = (2 * precision * sensibilidad / (precision + sensibilidad)
          if vp > 0 else 0.0)
    return {
        "exactitud": (vp + vn) / len(y_real),
        "sensibilidad": sensibilidad,
        "especificidad": vn / (vn + fp),
        "auc_roc": roc_auc_score(y_real, proba),
        "precision": precision,
        "f1": f1,
    }, (vn, fp, fn, vp)


def r4(v):
    return round(float(v), 4)


def r6(v):
    # Cifras que la app vuelve a redondear (métricas e importancias): con 6 decimales el redondeo
    # a 1 decimal en porcentaje da lo mismo que redondear el valor sin recortar.
    return round(float(v), 6)


def resumen(valores):
    a = np.asarray(valores, dtype=float)
    if np.isnan(a).any():
        raise SystemExit("Hay particiones sin predicciones positivas; revisar el cálculo de precisión")
    return {"media": r6(a.mean()), "desviacion": r6(a.std(ddof=1)), "min": r6(a.min()), "max": r6(a.max())}


def texto_params(p):
    return ", ".join(f"{k.replace('svc__', '')}={v}" for k, v in p.items())


# --------------------------------------------------------------------------- exportacion
def f32_inferior(t):
    """Mayor float32 que es <= t."""
    v = np.float32(t)
    if float(v) > t:
        v = np.nextafter(v, np.float32(-np.inf), dtype=np.float32)
    return v


def redondear_sig(d: Decimal, cifras: int, modo):
    if d == 0:
        return d
    return d.quantize(Decimal(1).scaleb(d.adjusted() - cifras + 1), rounding=modo)


def umbral_compacto(t):
    """
    scikit-learn compara float32(x) <= t, con t en float64. Como float32(x) solo toma valores
    float32, eso equivale a float32(x) <= lo, con lo = mayor float32 <= t. Se guarda el decimal
    mas corto c con lo <= c < (lo + siguiente float32)/2: asi float32(x) <= c da lo mismo que
    float32(x) <= t, y ademas Math.fround(c) == lo.
    """
    lo = f32_inferior(t)
    hi = np.nextafter(lo, np.float32(np.inf), dtype=np.float32)
    lo_d, hi_d = float(lo), float(hi)
    medio = (lo_d + hi_d) / 2.0
    exacto = Decimal(lo_d)
    for cifras in range(1, 18):
        for modo in (ROUND_HALF_EVEN, ROUND_CEILING):
            c = float(redondear_sig(exacto, cifras, modo))
            if lo_d <= c < medio:
                # comprobacion: mismo resultado para los dos float32 vecinos del corte
                assert (lo_d <= t) and not (hi_d <= t)
                assert (lo_d <= c) and not (hi_d <= c)
                assert np.float32(c) == lo
                return c
    raise AssertionError(f"sin decimal compacto para {t!r}")


def exportar_arbol(est):
    tr = est.tree_
    hoja = tr.children_left == -1
    valores = tr.value[:, 0, :]
    f, t, p = [], [], []
    for n in range(tr.node_count):
        if hoja[n]:
            v0, v1 = float(valores[n, 0]), float(valores[n, 1])
            f.append(-2)
            t.append(-2)
            p.append(v1 / (v0 + v1))  # mismo calculo que predict_proba
        else:
            f.append(int(tr.feature[n]))
            t.append(umbral_compacto(float(tr.threshold[n])))
            p.append(0)
    return {"f": f, "t": t, "l": tr.children_left.tolist(), "r": tr.children_right.tolist(), "p": p}


def compactar(o):
    if isinstance(o, float):
        return int(o) if o.is_integer() and abs(o) < 2 ** 53 else o
    if isinstance(o, dict):
        return {k: compactar(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [compactar(v) for v in o]
    return o


def escribir_json(ruta, obj, compacto):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "w", encoding="utf-8", newline="\n") as fh:
        if compacto:
            json.dump(compactar(obj), fh, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
        else:
            json.dump(obj, fh, ensure_ascii=False, indent=2, allow_nan=False)
            fh.write("\n")
    return os.path.getsize(ruta)


def estadisticas_arbol(est):
    tr = est.tree_
    return int(tr.node_count), int(tr.n_leaves), int(tr.max_depth)


# --------------------------------------------------------------------------- principal
def main():
    inicio = time.time()
    df, limpio, X, y, idx_orig, descartadas = cargar()
    n_clase = {"0": int((y == 0).sum()), "1": int((y == 1).sum())}
    n_clase_303 = {"0": int((df["num"] == 0).sum()), "1": int((df["num"] > 0).sum())}
    print(f"Filas en el archivo: {len(df)}  (clase 0: {n_clase_303['0']}, clase 1: {n_clase_303['1']})")
    print(f"Descartadas por faltantes: {len(descartadas)} -> {descartadas}")
    print(f"Filas usadas: {len(y)}  (clase 0 sin enfermedad: {n_clase['0']}, clase 1 con enfermedad: {n_clase['1']})")

    variables = describir_variables(limpio, df)

    # ---- validacion cruzada anidada
    externa = RepeatedStratifiedKFold(n_splits=10, n_repeats=10, random_state=SEMILLA)
    particiones = list(externa.split(X, y))
    tareas = [(c, k, tr, te) for c in MODELOS for k, (tr, te) in enumerate(particiones)]
    print(f"\nValidación anidada: {len(tareas)} ajustes externos ({len(particiones)} particiones x {len(MODELOS)} modelos)...")
    resultados = Parallel(n_jobs=-1)(delayed(evaluar_particion)(c, k, tr, te, X, y) for c, k, tr, te in tareas)

    evaluacion = {}
    for clave in MODELOS:
        por_metrica = {m: [] for m in ["exactitud", "sensibilidad", "especificidad", "auc_roc", "precision", "f1"]}
        matriz = np.zeros(4, dtype=np.int64)
        suma_oof = np.zeros(len(y))
        cuenta_oof = np.zeros(len(y))
        elegidas = Counter()
        for c, k, params, proba, pred in resultados:
            if c != clave:
                continue
            te = particiones[k][1]
            met, cm = metricas_particion(y[te], pred, proba)
            for nombre, valor in met.items():
                por_metrica[nombre].append(valor)
            matriz += np.array(cm)
            suma_oof[te] += proba
            cuenta_oof[te] += 1
            elegidas[texto_params(params)] += 1
        assert (cuenta_oof == 10).all()
        evaluacion[clave] = {
            "metricas": {nombre: resumen(v) for nombre, v in por_metrica.items()},
            "matriz": matriz,
            "oof": suma_oof / cuenta_oof,
            "elegidas": elegidas,
        }
        met = evaluacion[clave]["metricas"]
        print(f"  {MODELOS[clave]['nombre']:<20} exactitud {met['exactitud']['media']:.4f} ± {met['exactitud']['desviacion']:.4f}"
              f"  sens {met['sensibilidad']['media']:.4f}  esp {met['especificidad']['media']:.4f}"
              f"  AUC {met['auc_roc']['media']:.4f}  prec {met['precision']['media']:.4f}"
              f"  elegidas {dict(elegidas)}")

    # ---- modelos finales con las 297 filas
    finales, seleccion_final = {}, {}
    for clave, m in MODELOS.items():
        busqueda = GridSearchCV(clone(m["base"]), m["rejilla"], scoring="roc_auc", cv=CV_INTERNA, n_jobs=1)
        busqueda.fit(X, y)
        finales[clave] = busqueda.best_estimator_
        cvr = busqueda.cv_results_
        seleccion_final[clave] = {
            "elegida": texto_params(busqueda.best_params_),
            "auc_interno": [{"configuracion": texto_params(p), "auc_media": round(float(mu), 6),
                             "auc_desviacion": round(float(sd), 6)}
                            for p, mu, sd in zip(cvr["params"], cvr["mean_test_score"], cvr["std_test_score"])],
        }
        print(f"  final {clave}: {seleccion_final[clave]['elegida']}  {seleccion_final[clave]['auc_interno']}")

    rf, dt, svm = finales["rf"], finales["dt"], finales["svm"]
    escalador, svc = svm.named_steps["escalador"], svm.named_steps["svc"]
    for est in (rf, dt, svc):
        assert est.classes_.tolist() == [0, 1]
    # los vectores soporte son filas de entrenamiento escaladas con (x - mean) / scale
    assert np.array_equal(svc.support_vectors_, (X[svc.support_] - escalador.mean_) / escalador.scale_)

    # ---- modelo.json
    modelo = {
        "version": 2,
        "descripcion": "Modelos de CARDIONET entrenados con UCI Heart Disease (Cleveland, 297 filas). Ver ml/README.md.",
        "features": VARIABLES,
        "clases": [0, 1],
        "formato": {
            "entrada": "x = 13 números en el orden de 'features', con la codificación original de UCI.",
            "arbol": ("Nodo n empieza en 0. Mientras l[n] != -1: n = (Math.fround(x[f[n]]) <= t[n]) ? l[n] : r[n]. "
                      "En la hoja, p[n] es la probabilidad de la clase 1. En hojas f = t = -2; en nodos internos p = 0."),
            "rf": "Riesgo = suma de p de cada árbol, en orden, dividida entre el número de árboles. Etiqueta 1 si riesgo > 0,5.",
            "dt": "Riesgo = p de la hoja. Etiqueta 1 si riesgo > 0,5.",
            "svm": ("z[i] = (x[i] - mean[i]) / scale[i]. dec = suma_k coef[k] * exp(-gamma * suma_i (z[i] - sv[k][i])^2), "
                    "sumando k en orden, y luego dec + b (dec es el negativo de decision_function). "
                    "Probabilidad: f = dec*probA + probB; q = f >= 0 ? exp(-f)/(1+exp(-f)) : 1/(1+exp(f)); "
                    "q = min(max(q, 1e-7), 1 - 1e-7); r = [[0, q], [1 - q, 0]]; riesgo = p[1] de "
                    "multiclass_probability(k=2, r) de libsvm (la que trae scikit-learn usa ese método también con 2 clases). "
                    "Etiqueta 1 si riesgo > 0,5, igual que en los árboles. No se usa predict() de scikit-learn "
                    "(signo de dec), que cerca de 0,5 puede dar la clase contraria a la probabilidad."),
        },
        "rf": {"arboles": [exportar_arbol(e) for e in rf.estimators_],
               "importancias": [float(v) for v in rf.feature_importances_]},
        "dt": exportar_arbol(dt),
        "svm": {
            "gamma": float(svc._gamma),
            "sv": svc.support_vectors_.tolist(),
            "coef": svc._dual_coef_[0].tolist(),
            "b": float(svc._intercept_[0]),
            "probA": float(svc.probA_[0]),
            "probB": float(svc.probB_[0]),
            "mean": escalador.mean_.tolist(),
            "scale": escalador.scale_.tolist(),
        },
    }
    ruta_modelo = os.path.join(DIR_FRONT, "modelo.json")
    bytes_modelo = escribir_json(ruta_modelo, modelo, compacto=True)
    partes = {k: len(json.dumps(compactar(modelo[k]), separators=(",", ":"))) for k in ("rf", "dt", "svm")}
    print(f"\nmodelo.json: {bytes_modelo / 1024:.1f} KB  (rf {partes['rf'] / 1024:.1f} KB, dt {partes['dt'] / 1024:.1f} KB, svm {partes['svm'] / 1024:.1f} KB)")

    # ---- referencia.json: 297 filas reales + 300 aleatorias
    rng = random.Random(SEMILLA)
    info = {v["codigo"]: v for v in variables}

    def fila_aleatoria():
        fila = []
        for c in VARIABLES:
            v = info[c]
            if v["tipo"] == "categórica":
                fila.append(float(rng.choice([o["valor"] for o in v["valores"]])))
            elif v["decimales"] == 0:
                fila.append(float(rng.randint(int(v["min"]), int(v["max"]))))
            else:
                fila.append(round(rng.uniform(float(v["min"]), float(v["max"])), v["decimales"]))
        return fila

    i_oldpeak = VARIABLES.index("oldpeak")
    cortes_oldpeak = sorted({float(e.tree_.threshold[n]) for e in list(rf.estimators_) + [dt]
                             for n in range(e.tree_.node_count) if e.tree_.feature[n] == i_oldpeak})
    aleatorias = []
    for i in range(300):
        fila = fila_aleatoria()
        if 200 <= i < 250:
            # depresion del ST escrita con 2 decimales justo en un corte de algun arbol
            fila[i_oldpeak] = round(rng.choice(cortes_oldpeak), 2)
        elif i >= 250:
            # valor en la franja donde comparar en float64 y en float32 da resultados distintos
            t = rng.choice(cortes_oldpeak)
            lo = float(f32_inferior(t))
            hi = float(np.nextafter(np.float32(lo), np.float32(np.inf), dtype=np.float32))
            medio = (lo + hi) / 2.0
            fila[i_oldpeak] = (medio + t) / 2.0 if medio < t else float(np.nextafter(t, np.inf))
        aleatorias.append(fila)
    X_ref = np.vstack([X, np.array(aleatorias, dtype=np.float64)])
    proba_ref = {"rf": rf.predict_proba(X_ref)[:, 1], "dt": dt.predict_proba(X_ref)[:, 1],
                 "svm": svm.predict_proba(X_ref)[:, 1]}
    for clave, est in (("rf", rf), ("dt", dt)):
        assert np.array_equal((proba_ref[clave] > 0.5).astype(np.int64), est.predict(X_ref))
    pred_svm_libsvm = svm.predict(X_ref)
    pred_svm = (proba_ref["svm"] > 0.5).astype(np.int64)
    distintas_svm = np.flatnonzero(pred_svm != pred_svm_libsvm)
    print(f"SVM: la regla 'probabilidad > 0,5' y predict() (signo de la decisión) difieren en "
          f"{int((distintas_svm < len(X)).sum())} de {len(X)} filas del dataset y en "
          f"{int((distintas_svm >= len(X)).sum())} de {len(X_ref) - len(X)} aleatorias")
    ref = {
        "rf": proba_ref["rf"].tolist(),
        "dt": proba_ref["dt"].tolist(),
        "svm": proba_ref["svm"].tolist(),
        "pred_rf": rf.predict(X_ref).tolist(),
        "pred_dt": dt.predict(X_ref).tolist(),
        "pred_svm": pred_svm.tolist(),
        "pred_svm_libsvm": pred_svm_libsvm.tolist(),
        "decision_svm": svm.decision_function(X_ref).tolist(),
    }
    referencia = {
        "descripcion": ("Salidas de scikit-learn " + sklearn.__version__ + " para probar que otra implementación "
                        "reproduce los modelos de frontend/src/ml/modelo.json. Filas 0-296: dataset limpio. "
                        "Filas 297-596: aleatorias dentro de los rangos del dataset (random.Random(42)); en las "
                        "filas 497-546 la depresión del ST está en un corte de árbol redondeado a 2 decimales y en "
                        "las 547-596 cae en la franja donde comparar sin Math.fround da otro resultado. "
                        "ref.* = probabilidad de clase 1; pred_* = predict(); decision_svm = decision_function()."),
        "features": VARIABLES,
        "grupos": {"dataset": [0, len(X)], "aleatorias": [len(X), len(X_ref)]},
        "linea_archivo": [int(i) + 1 for i in idx_orig],
        "X": X_ref.tolist(),
        "ref": ref,
    }
    ruta_ref = os.path.join(DIR_ML, "referencia.json")
    print(f"referencia.json: {escribir_json(ruta_ref, referencia, compacto=True) / 1024:.1f} KB, {len(X_ref)} filas")

    # ---- comprobacion de sentido y ejemplos
    proba_final = {"rf": np.array(ref["rf"][:len(y)]), "dt": np.array(ref["dt"][:len(y)]),
                   "svm": np.array(ref["svm"][:len(y)])}
    sentido = {}
    for clave in MODELOS:
        pf, po = proba_final[clave], evaluacion[clave]["oof"]
        sentido[clave] = {
            "modelo_final_sobre_las_297_filas": {"con_enfermedad": r4(pf[y == 1].mean()), "sin_enfermedad": r4(pf[y == 0].mean())},
            "fuera_de_muestra_validacion_cruzada": {"con_enfermedad": r4(po[y == 1].mean()), "sin_enfermedad": r4(po[y == 0].mean())},
        }
        print(f"  sentido {clave}: {sentido[clave]}")
        assert pf[y == 1].mean() > pf[y == 0].mean() + 0.2 and po[y == 1].mean() > po[y == 0].mean() + 0.2

    todas = np.vstack([proba_final[c] for c in MODELOS] + [evaluacion[c]["oof"] for c in MODELOS])  # 6 x 297
    minimo, maximo = todas.min(axis=0), todas.max(axis=0)
    i_alto = int(np.flatnonzero(y == 1)[np.argmax(minimo[y == 1])])
    i_bajo = int(np.flatnonzero(y == 0)[np.argmin(maximo[y == 0])])

    def ejemplo(i):
        return {
            "linea_archivo": int(idx_orig[i]) + 1,
            "indice_fila_original": int(idx_orig[i]),
            "valores": {c: entero_si_puede(X[i, j]) for j, c in enumerate(VARIABLES)},
            "num": int(limpio["num"].iloc[i]),
            "probabilidad_modelo_final": {c: r4(proba_final[c][i]) for c in MODELOS},
            "probabilidad_media_fuera_de_muestra": {c: r4(evaluacion[c]["oof"][i]) for c in MODELOS},
        }

    ejemplos = {
        "criterio": ("Con enfermedad: la fila con num > 0 cuya menor probabilidad entre los 3 modelos finales y los "
                     "3 promedios fuera de muestra es la más alta. Sin enfermedad: la fila con num = 0 cuya mayor "
                     "probabilidad entre esos 6 valores es la más baja. indice_fila_original empieza en 0; "
                     "linea_archivo empieza en 1."),
        "con_enfermedad": ejemplo(i_alto),
        "sin_enfermedad": ejemplo(i_bajo),
    }
    print(f"  ejemplo alto: {ejemplos['con_enfermedad']}")
    print(f"  ejemplo bajo: {ejemplos['sin_enfermedad']}")

    # ---- metricas.json
    nodos_rf = [estadisticas_arbol(e) for e in rf.estimators_]
    n_dt = estadisticas_arbol(dt)
    detalle_final = {
        "rf": {"arboles": len(rf.estimators_), "nodos_totales": sum(a for a, _, _ in nodos_rf),
               "hojas_totales": sum(b for _, b, _ in nodos_rf), "profundidad_maxima": max(c for _, _, c in nodos_rf)},
        "dt": {"nodos": n_dt[0], "hojas": n_dt[1], "profundidad": n_dt[2]},
        "svm": {"vectores_soporte": int(svc.support_vectors_.shape[0]),
                "vectores_soporte_por_clase": {"0": int(svc.n_support_[0]), "1": int(svc.n_support_[1])},
                "gamma_efectivo": float(svc._gamma)},
    }
    modelos_json = {}
    for clave, m in MODELOS.items():
        ev = evaluacion[clave]
        vn, fp, fn, vp = (int(v) for v in ev["matriz"])
        comparadas = [texto_params(dict(zip(m["rejilla"], combo))) for combo in zip(*m["rejilla"].values())]
        assert set(ev["elegidas"]) <= set(comparadas)
        modelos_json[clave] = {
            "nombre": m["nombre"],
            "hiperparametros_fijos": m["fijos"],
            "configuraciones_comparadas": comparadas,
            "por_que": m["por_que"],
            "veces_elegida_en_las_100_particiones": {c: int(ev["elegidas"].get(c, 0)) for c in comparadas},
            "configuracion_final": seleccion_final[clave]["elegida"],
            "auc_interno_con_las_297_filas": seleccion_final[clave]["auc_interno"],
            "modelo_final": detalle_final[clave],
            "metricas": ev["metricas"],
            "matriz_confusion_agregada": {
                "verdaderos_negativos": vn, "falsos_positivos": fp,
                "falsos_negativos": fn, "verdaderos_positivos": vp, "total": vn + fp + fn + vp,
                "nota": "Suma de las 100 particiones de prueba: cada paciente se cuenta 10 veces, una por repetición.",
            },
        }

    importancias = sorted(
        [{"codigo": c, "etiqueta": META[c]["etiqueta"], "etiqueta_corta": META[c]["etiqueta_corta"],
          "importancia": r6(v)} for c, v in zip(VARIABLES, rf.feature_importances_)],
        key=lambda d: -d["importancia"])

    metricas = {
        "fuente": {
            "nombre": "Heart Disease (UCI Machine Learning Repository), subconjunto Cleveland",
            "archivo": "processed.cleveland.data",
            "url": "https://archive.ics.uci.edu/dataset/45/heart+disease",
            "licencia": "CC BY 4.0",
            "licencia_url": "https://creativecommons.org/licenses/by/4.0/",
            "doi": "10.24432/C52P4X",
            "autores": ["Andras Janosi", "William Steinbrunn", "Matthias Pfisterer", "Robert Detrano"],
            "cita": ("Janosi, A., Steinbrunn, W., Pfisterer, M., & Detrano, R. (1989). Heart Disease [Dataset]. "
                     "UCI Machine Learning Repository. https://doi.org/10.24432/C52P4X."),
            "cita_verificada_en": "https://archive.ics.uci.edu/dataset/45/heart+disease (formato APA de la página)",
        },
        "datos": {
            "filas_en_archivo": int(len(df)),
            "filas_en_archivo_por_clase": n_clase_303,
            "filas_descartadas": len(descartadas),
            "detalle_descartadas": descartadas,
            "n_total": int(len(y)),
            "n_por_clase": n_clase,
            "objetivo": "Clase 1 = con enfermedad (num > 0); clase 0 = sin enfermedad (num = 0). El riesgo que muestra la app es la probabilidad de la clase 1.",
        },
        "variables": variables,
        "rangos": {v["codigo"]: {"min": v["min"], "max": v["max"]} for v in variables if v["tipo"] == "numérica"},
        "rangos_nota": "Mínimo y máximo de cada variable numérica en las 297 filas usadas para entrenar.",
        "validacion": {
            "metodo": ("Validación cruzada anidada. Externa: 10 particiones estratificadas repetidas 10 veces "
                       "(100 particiones de prueba). Interna: dentro de cada partición de entrenamiento se "
                       "comparan las configuraciones de cada modelo con 5 particiones estratificadas y se elige la "
                       "de mayor AUC ROC media; si empatan, la más simple. Esa configuración se entrena con toda la "
                       "partición de entrenamiento y se mide en la de prueba. Las cifras miden el procedimiento "
                       "completo, sin elegir la configuración mirando los datos de prueba."),
            "externa": "RepeatedStratifiedKFold(n_splits=10, n_repeats=10, random_state=42)",
            "interna": "StratifiedKFold(n_splits=5, shuffle=True, random_state=42), criterio roc_auc",
            "modelo_final": "La misma selección interna se aplica a las 297 filas y el modelo elegido se entrena con las 297 filas.",
            "unidad": "Proporción entre 0 y 1, calculada en cada partición de prueba.",
            "resumen": "media, desviación estándar muestral (n-1), mínimo y máximo sobre las 100 particiones.",
            "definiciones": {
                "exactitud": "(VP + VN) / total",
                "sensibilidad": "VP / (VP + FN): proporción de pacientes con enfermedad marcados como clase 1",
                "especificidad": "VN / (VN + FP): proporción de pacientes sin enfermedad marcados como clase 0",
                "precision": "VP / (VP + FP)",
                "f1": "2 · precisión · sensibilidad / (precisión + sensibilidad)",
                "auc_roc": "Área bajo la curva ROC de la probabilidad de clase 1",
            },
            "etiqueta": ("Los tres modelos ubican los datos en el grupo con enfermedad cardíaca si la probabilidad "
                         "estimada es mayor que 50 %; si no, en el grupo sin enfermedad cardíaca."),
        },
        "modelos": modelos_json,
        "importancias": importancias,
        "importancias_nota": "Importancia por reducción de impureza (Gini) del Random Forest final; suman 1.",
        "comprobacion_sentido": sentido,
        "ejemplos": ejemplos,
        "entrenamiento": {
            "fecha": datetime.date.today().isoformat(),
            "scikit_learn": sklearn.__version__,
            "numpy": np.__version__,
            "pandas": pd.__version__,
            "python": platform.python_version(),
            "random_state": SEMILLA,
            "script": "ml/entrenar.py",
        },
    }
    ruta_metricas = os.path.join(DIR_FRONT, "metricas.json")
    print(f"metricas.json: {escribir_json(ruta_metricas, metricas, compacto=False) / 1024:.1f} KB")
    print(f"\nTiempo: {time.time() - inicio:.1f} s")

    # ---- paridad en Python puro
    print("\n== ml/verificar_paridad.py", flush=True)
    r = subprocess.run([sys.executable, os.path.join(DIR_ML, "verificar_paridad.py")])
    if r.returncode != 0:
        raise SystemExit("La verificación de paridad falló")


if __name__ == "__main__":
    main()
