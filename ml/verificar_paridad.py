# -*- coding: utf-8 -*-
"""
Comprueba, sin scikit-learn ni numpy (solo la biblioteca estandar), que
frontend/src/ml/modelo.json reproduce las salidas guardadas en ml/referencia.json.

Uso, desde la raiz del repositorio:
    python ml/verificar_paridad.py

Criterios: diferencia maxima 0 en los arboles (RF y arbol de decision), menor que 1e-9
en la SVM, y etiquetas identicas en los tres modelos. Sale con codigo 1 si alguno falla.
Sirve tambien de referencia para la inferencia en JavaScript.
"""
import json
import math
import os
import struct
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def f32(x):
    """Redondeo a float32, igual que Math.fround en JavaScript."""
    return struct.unpack("<f", struct.pack("<f", x))[0]


def prob_arbol(arbol, x, usar_f32=True):
    f, t, l, r = arbol["f"], arbol["t"], arbol["l"], arbol["r"]
    n = 0
    while l[n] != -1:
        v = f32(x[f[n]]) if usar_f32 else x[f[n]]
        n = l[n] if v <= t[n] else r[n]
    return arbol["p"][n]


def prob_rf(m, x, usar_f32=True):
    s = 0.0
    for arbol in m["rf"]["arboles"]:
        s += prob_arbol(arbol, x, usar_f32)
    return s / len(m["rf"]["arboles"])


def prob_dt(m, x, usar_f32=True):
    return prob_arbol(m["dt"], x, usar_f32)


def decision_svm(m, x):
    """Decision interna de libsvm (el negativo de decision_function de scikit-learn)."""
    s = m["svm"]
    z = [(x[i] - s["mean"][i]) / s["scale"][i] for i in range(len(x))]
    total = 0.0
    for sv, c in zip(s["sv"], s["coef"]):
        d2 = 0.0
        for zi, vi in zip(z, sv):
            d = zi - vi
            d2 += d * d
        total += c * math.exp(-s["gamma"] * d2)
    return total + s["b"]


def multiclass_probability(k, r):
    """Copia de multiclass_probability de libsvm (sklearn/svm/src/libsvm/svm.cpp)."""
    max_iter = max(100, k)
    eps = 0.005 / k
    p = [1.0 / k] * k
    Q = [[0.0] * k for _ in range(k)]
    Qp = [0.0] * k
    for t in range(k):
        Q[t][t] = 0.0
        for j in range(t):
            Q[t][t] += r[j][t] * r[j][t]
            Q[t][j] = Q[j][t]
        for j in range(t + 1, k):
            Q[t][t] += r[j][t] * r[j][t]
            Q[t][j] = -r[j][t] * r[t][j]
    for _ in range(max_iter):
        pQp = 0.0
        for t in range(k):
            Qp[t] = 0.0
            for j in range(k):
                Qp[t] += Q[t][j] * p[j]
            pQp += p[t] * Qp[t]
        max_error = 0.0
        for t in range(k):
            error = abs(Qp[t] - pQp)
            if error > max_error:
                max_error = error
        if max_error < eps:
            break
        for t in range(k):
            diff = (-Qp[t] + pQp) / Q[t][t]
            p[t] += diff
            pQp = (pQp + diff * (diff * Q[t][t] + 2 * Qp[t])) / (1 + diff) / (1 + diff)
            for j in range(k):
                Qp[j] = (Qp[j] + diff * Q[t][j]) / (1 + diff)
                p[j] /= (1 + diff)
    return p


def probabilidades_svm(m, x):
    """Devuelve (riesgo = p[1], 1 - p[0], dec)."""
    s = m["svm"]
    dec = decision_svm(m, x)
    fApB = dec * s["probA"] + s["probB"]
    if fApB >= 0:
        q = math.exp(-fApB) / (1.0 + math.exp(-fApB))
    else:
        q = 1.0 / (1 + math.exp(fApB))
    q = min(max(q, 1e-7), 1 - 1e-7)
    p = multiclass_probability(2, [[0.0, q], [1 - q, 0.0]])
    return p[1], 1.0 - p[0], dec


def main():
    ruta_modelo = os.path.join(RAIZ, "frontend", "src", "ml", "modelo.json")
    ruta_ref = os.path.join(RAIZ, "ml", "referencia.json")
    with open(ruta_modelo, encoding="utf-8") as fh:
        M = json.load(fh)
    with open(ruta_ref, encoding="utf-8") as fh:
        R = json.load(fh)
    if M["features"] != R["features"]:
        print("Las variables de modelo.json y referencia.json no coinciden")
        return 1

    X, ref = R["X"], R["ref"]
    grupos = dict(R["grupos"], total=[0, len(X)])
    calc = {k: [] for k in ("rf", "dt", "svm", "svm_1menos", "dec", "rf_sin_f32", "dt_sin_f32")}
    for x in X:
        calc["rf"].append(prob_rf(M, x))
        calc["dt"].append(prob_dt(M, x))
        riesgo, uno_menos, dec = probabilidades_svm(M, x)
        calc["svm"].append(riesgo)
        calc["svm_1menos"].append(uno_menos)
        calc["dec"].append(dec)
        calc["rf_sin_f32"].append(prob_rf(M, x, usar_f32=False))
        calc["dt_sin_f32"].append(prob_dt(M, x, usar_f32=False))

    # Misma regla en los tres modelos: clase 1 si la probabilidad es mayor que 0,5.
    etiquetas = {
        "rf": [1 if p > 0.5 else 0 for p in calc["rf"]],
        "dt": [1 if p > 0.5 else 0 for p in calc["dt"]],
        "svm": [1 if p > 0.5 else 0 for p in calc["svm"]],
    }
    # Solo informativo: predict() de libsvm (signo de la decision) frente a la regla usada.
    signo_svm = [0 if d > 0 else 1 for d in calc["dec"]]

    def dif_max(a, b, i0, i1):
        return max(abs(a[i] - b[i]) for i in range(i0, i1))

    def iguales(a, b, i0, i1):
        return sum(1 for i in range(i0, i1) if a[i] == b[i])

    ok = True
    for nombre, (i0, i1) in grupos.items():
        n = i1 - i0
        print(f"-- {nombre} ({n} filas)")
        for k in ("rf", "dt", "svm"):
            d = dif_max(calc[k], ref[k], i0, i1)
            ig = iguales(calc[k], ref[k], i0, i1)
            et = iguales(etiquetas[k], ref["pred_" + k], i0, i1)
            print(f"   {k.upper():<3} dif. máx. prob. {d:.3e}  idénticas {ig}/{n}  etiquetas iguales {et}/{n}")
            limite_ok = (d == 0.0) if k in ("rf", "dt") else (d < 1e-9)
            ok = ok and limite_ok and et == n
        d_dec = max(abs(calc["dec"][i] + ref["decision_svm"][i]) for i in range(i0, i1))
        d_alt = dif_max(calc["svm_1menos"], ref["svm"], i0, i1)
        print(f"   SVM dec. interna vs -decision_function: dif. máx. {d_dec:.3e};  si riesgo = 1 - p[0]: dif. máx. {d_alt:.3e}")
        if "pred_svm_libsvm" in ref:
            et_signo = iguales(signo_svm, ref["pred_svm_libsvm"], i0, i1)
            distintas = n - iguales(signo_svm, etiquetas["svm"], i0, i1)
            print(f"   SVM signo de la decisión vs predict() de libsvm: iguales {et_signo}/{n};"
                  f"  filas donde el signo da otra clase que 'probabilidad > 0,5': {distintas}")
            ok = ok and et_signo == n
        for k in ("rf", "dt"):
            distintas = sum(1 for i in range(i0, i1) if calc[k + "_sin_f32"][i] != ref[k][i])
            print(f"   {k.upper()} comparando sin float32 (sin Math.fround): {distintas}/{n} filas con otra probabilidad")
        cerca = sum(1 for i in range(i0, i1) if abs(calc["rf"][i] - 0.5) < 1e-9)
        if cerca:
            print(f"   RF con riesgo a menos de 1e-9 de 0,5: {cerca} filas")
    print("RESULTADO:", "OK" if ok else "FALLA")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
