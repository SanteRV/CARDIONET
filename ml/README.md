# ml/ — modelos de la versión estática de CARDIONET

Los tres modelos (Random Forest, árbol de decisión y SVM) se entrenan en Python y se exportan a JSON.
La página los evalúa en el navegador: sin servidor, sin base de datos y sin guardar datos de nadie.

## Reentrenar y regenerar los JSON

Desde la raíz del repositorio:

```
"C:/Users/ROG STRIG/anaconda3/python.exe" ml/entrenar.py
```

Usa scikit-learn (entrenado con 1.6.1), numpy, pandas y joblib. Tarda un minuto y medio más o menos.
Todo usa `random_state=42`, así que se obtienen los mismos modelos en cada ejecución; en `metricas.json`
solo cambia la fecha. Al terminar ejecuta `ml/verificar_paridad.py` y, si la comprobación falla, sale con error.

Para verificar sin reentrenar (no necesita scikit-learn ni numpy):

```
"C:/Users/ROG STRIG/anaconda3/python.exe" ml/verificar_paridad.py
```

## Datos

`data/uci/processed.cleveland.data`: UCI Heart Disease, subconjunto Cleveland. Licencia CC BY 4.0; hay que citarlo:

> Janosi, A., Steinbrunn, W., Pfisterer, M., & Detrano, R. (1989). Heart Disease [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C52P4X.

- 303 filas. Se descartan las 6 que tienen valores faltantes (`?`: 4 en `ca` y 2 en `thal`) y quedan 297:
  160 sin enfermedad y 137 con enfermedad.
- Objetivo: clase 1 si `num > 0`. El riesgo que muestra la app es la probabilidad de la clase 1.
- Las 13 variables van en el orden de UCI y con su codificación original, sin recodificar.
- No usar `data/heart_disease_sample.csv`: tiene la etiqueta invertida y otra codificación.

## Archivos

| Archivo | Contenido |
|---|---|
| `ml/entrenar.py` | Lee los datos, elige la configuración de cada modelo con validación cruzada anidada, calcula las métricas, entrena los modelos finales con las 297 filas y escribe los tres JSON. |
| `ml/verificar_paridad.py` | Inferencia en Python puro a partir de `modelo.json`. Comprueba que reproduce `referencia.json`: diferencia 0 en los árboles, menos de 1e-9 en la SVM y etiquetas idénticas. Sirve de guía para la versión en JavaScript. |
| `ml/referencia.json` | 597 entradas con la salida de scikit-learn: 297 filas del dataset y 300 aleatorias dentro de sus rangos (varias puestas a propósito en cortes de árbol). Incluye la probabilidad de clase 1 (`ref.rf`, `ref.dt`, `ref.svm`), `predict()` (`ref.pred_*`) y `decision_function()` de la SVM. |
| `frontend/src/ml/modelo.json` | Los tres modelos. Árboles como arreglos `f`, `t`, `l`, `r`, `p`. SVM con vectores soporte ya escalados, `coef`, `b`, `gamma` efectivo, `probA`, `probB` y la media y escala del `StandardScaler`. El campo `formato` describe paso a paso cómo evaluarlos. |
| `frontend/src/ml/metricas.json` | Fuente y cita, filas usadas y descartadas, variables con etiquetas, códigos y rangos, método de validación, métricas por modelo (media, desviación, mínimo y máximo), matriz de confusión agregada, importancias del Random Forest, comprobación de sentido, dos ejemplos reales, fecha y versiones. |

## Detalles que la inferencia en JavaScript debe respetar

- **Árboles:** hay que comparar `Math.fround(x) <= t`, porque scikit-learn pasa las entradas a float32. Cada umbral
  se guarda como el decimal más corto que da el mismo resultado que el umbral original para cualquier float32.
  Sin `Math.fround`, 8 de las 597 filas de referencia dan otra probabilidad en el Random Forest.
- **Random Forest:** sumar la `p` de cada árbol en el orden del arreglo y dividir entre el número de árboles.
- **SVM:** la probabilidad pasa por `multiclass_probability` de libsvm también con 2 clases. Frente a scikit-learn
  quedan diferencias del orden de 1e-15, por el orden de las sumas.
- **Etiquetas:** en los tres modelos, clase 1 si la probabilidad es mayor que 0,5. En el Random Forest y el árbol
  coincide con `predict()`. En la SVM no se usa `predict()`: libsvm decide con el signo de la función de decisión y
  la probabilidad sale de la calibración de Platt, así que cerca de 0,5 pueden dar clases distintas y la app mostraría
  un grupo que contradice el porcentaje. `referencia.json` guarda las dos: `ref.pred_svm` (probabilidad > 0,5, la que
  usa la app y las métricas) y `ref.pred_svm_libsvm` (`predict()`).
- **Decimales:** las métricas y las importancias se guardan con 6 decimales, para que el redondeo a 1 decimal en
  porcentaje de la app dé lo mismo que redondear el valor completo. Las probabilidades de los ejemplos y la
  comprobación de sentido van con 4.
