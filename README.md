# CARDIONET

CARDIONET es una herramienta web de un proyecto de investigación de la Universidad Nacional Hermilio Valdizán (UNHEVAL), en colaboración con la Universidad Nacional Mayor de San Marcos (UNMSM). A partir de 13 datos clínicos estima la probabilidad de enfermedad cardíaca con tres modelos de aprendizaje automático: Random Forest, árbol de decisión y SVM. Los modelos se entrenaron con 297 pacientes del conjunto público Heart Disease de UCI (subconjunto Cleveland). El sitio también muestra cómo se comportó cada modelo en la validación.

> **Límite.** Es una herramienta educativa de investigación, **no un diagnóstico**. No reemplaza una consulta médica y una probabilidad baja no descarta una enfermedad cardíaca. Si tienes dolor de pecho, falta de aire, desmayo u otros síntomas graves, llama gratis al SAMU 106 (Ministerio de Salud, atiende las 24 horas; [fuente](https://www.gob.pe/1013-solicitar-atencion-medica-en-caso-de-emergencia-samu)) o acude a emergencias.

## Dónde verlo

Se publicará en **https://cardionet.santerv.com**.

El sitio tiene tres páginas:

| Ruta | Contenido |
|---|---|
| `/` | Presentación y cómo funciona. |
| `/evaluacion` | Formulario con los 13 datos y probabilidad estimada por el modelo principal (Random Forest). Después del resultado va el bloque «Qué hacer ahora»: consultar a un cardiólogo o al centro de salud, y llamar al SAMU 106 si hay síntomas graves. |
| `/evaluacion/comparativo` | Qué estiman los tres modelos para el mismo caso y sus métricas de validación. Junto a esas probabilidades van los mismos avisos que en el resultado («una probabilidad baja no descarta una enfermedad cardíaca») y el bloque «Qué hacer ahora». Se puede exportar a PDF en tamaño A4, en varias páginas y con esos avisos; el archivo se genera en el navegador. |

## Cómo funciona

- Los tres modelos se entrenan en Python con scikit-learn (`ml/entrenar.py`) y se exportan a JSON (`frontend/src/ml/modelo.json`).
- El navegador evalúa esos modelos con TypeScript (`frontend/src/ml/inferencia.ts`). El «riesgo» que muestra la app es la probabilidad de la clase 1 (con enfermedad).
- **No hay servidor de aplicación, base de datos ni login, y no se recogen datos.** El sitio no pide datos personales. Lo que se escribe en el formulario se calcula en el navegador y no se envía a ningún servidor. Tampoco se guarda en el navegador: la evaluación en curso solo está en la memoria de la página (estado de React, `frontend/src/context/EvaluacionActual.tsx`), no en el historial (`history.state`), `localStorage` ni `sessionStorage`. Se borra al pulsar «Nueva evaluación», al recargar la página o al cerrar la pestaña. El formulario lleva `autocomplete="off"` para que el navegador no guarde lo escrito ni lo restaure al reabrir la pestaña. Vercel solo entrega archivos estáticos.
- La página carga las hojas de estilo de Bootstrap 5.3.0 y Bootstrap Icons 1.11.0 desde `cdn.jsdelivr.net`, con comprobación de integridad (atributo `integrity`, SRI): si el archivo del CDN cambia, el navegador no lo aplica. Esas solicitudes no llevan los datos del formulario, y una línea del pie de página de la app lo dice. Los hashes y sus fuentes están comentados en `frontend/index.html`; si se cambia la versión, hay que cambiar el hash. Las librerías para exportar a PDF (html2canvas y jsPDF) vienen con el sitio y solo se cargan al exportar.
- La portada no carga los modelos: `modelo.json` y los gráficos (Chart.js) se descargan al abrir la evaluación o la comparación.

Detalles de la inferencia (están en `modelo.json`, campo `formato`, y en [`ml/README.md`](ml/README.md)):

- **Árboles:** se compara `Math.fround(x) <= umbral`, porque scikit-learn pasa las entradas a float32.
- **Random Forest:** promedio de la probabilidad de sus 150 árboles.
- **SVM:** kernel RBF sobre variables estandarizadas y probabilidad con el método de Platt de scikit-learn.
- **Grupo (clase):** en los tres modelos, clase 1 si la probabilidad es mayor que 0,5. En la SVM no se usa `predict()` de scikit-learn, que decide con el signo de la función de decisión: cerca de 0,5 puede dar la clase contraria a la probabilidad (pasa en 7 de las 297 filas), y la app mostraría un grupo que contradice el porcentaje.

## Datos

**Fuente:** [Heart Disease, UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/45/heart+disease), subconjunto Cleveland (`data/uci/processed.cleveland.data`).

**Cita:**

> Janosi, A., Steinbrunn, W., Pfisterer, M., & Detrano, R. (1989). Heart Disease [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C52P4X.

**Licencia de los datos:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). DOI: [10.24432/C52P4X](https://doi.org/10.24432/C52P4X). Quien reutilice los datos debe citarlos.

**Filas usadas:**

- El archivo tiene 303 filas: 164 sin enfermedad y 139 con enfermedad.
- 6 filas tienen valores faltantes (`?`): 4 en `ca` y 2 en `thal`. Se descartan las líneas 88, 167, 193, 267, 288 y 303.
- Quedan **297 filas**: 160 sin enfermedad (clase 0) y 137 con enfermedad (clase 1).
- Objetivo: clase 1 si `num > 0`; clase 0 si `num = 0`.

**Codificación.** Los modelos y el formulario usan la codificación original de UCI, sin recodificar. Para las variables numéricas se indican el mínimo y el máximo en las 297 filas.

| Variable | Descripción | Códigos o rango |
|---|---|---|
| `age` | Edad | 29–77 años |
| `sex` | Sexo | 0 = mujer; 1 = hombre |
| `cp` | Tipo de dolor torácico | 1 = angina típica; 2 = angina atípica; 3 = dolor no anginoso; 4 = asintomático |
| `trestbps` | Presión arterial en reposo | 94–200 mm Hg |
| `chol` | Colesterol sérico | 126–564 mg/dl |
| `fbs` | Glucosa en ayunas mayor de 120 mg/dl | 0 = no; 1 = sí |
| `restecg` | Electrocardiograma en reposo | 0 = normal; 1 = anomalía de la onda ST-T; 2 = hipertrofia ventricular izquierda probable o definida |
| `thalach` | Frecuencia cardíaca máxima alcanzada | 71–202 |
| `exang` | Angina inducida por ejercicio | 0 = no; 1 = sí |
| `oldpeak` | Depresión del ST inducida por ejercicio respecto al reposo | 0–6,2 |
| `slope` | Pendiente del ST en el pico del ejercicio | 1 = ascendente; 2 = plana; 3 = descendente |
| `ca` | Número de vasos principales coloreados por fluoroscopia | 0–3 |
| `thal` | Thal | 3 = normal; 6 = defecto fijo; 7 = defecto reversible |

> **Corrección respecto a la versión anterior.** La versión anterior (backend Flask) entrenó sus modelos con `data/heart_disease_sample.csv`. Ese archivo tiene 52 filas de Cleveland, **con la etiqueta invertida** y con otra codificación de las variables: en las 52 marca 1 donde UCI indica que no hay enfermedad y 0 donde sí la hay. Por eso ya no valen las métricas fijas que mostraba (exactitud de 82,33 %, 73,67 % y 76,67 %). Esta versión usa el archivo original de UCI y recalcula todo. No uses ese CSV para entrenar.

## Métricas

**Cómo se validaron.** Con validación cruzada anidada:

- **Externa:** 10 particiones estratificadas, repetidas 10 veces, en total 100 particiones de prueba (`RepeatedStratifiedKFold(n_splits=10, n_repeats=10, random_state=42)`).
- **Interna:** dentro de cada partición de entrenamiento se comparan las configuraciones de cada modelo con 5 particiones estratificadas (`StratifiedKFold(n_splits=5, shuffle=True, random_state=42)`). Se elige la de mayor AUC ROC media y, si empatan, la más simple. Esa configuración se entrena con la partición de entrenamiento y se mide en la de prueba.
- Las cifras miden el procedimiento completo, que es elegir la configuración y entrenar. La configuración se elige sin mirar los datos de prueba.
- **Modelo final:** la misma selección interna se aplica a las 297 filas, y el modelo elegido se entrena con las 297.
- **Regla de clase:** en los tres modelos, clase 1 si la probabilidad es mayor que 0,5.

**Resultados en las 100 particiones de prueba:** media ± desviación estándar muestral. `metricas.json` guarda 6 decimales; aquí van redondeados a 2 decimales en porcentaje (4 en el AUC ROC). Las proporciones van en porcentaje y su desviación en puntos porcentuales. El AUC ROC va entre 0 y 1.

| Modelo | Exactitud | Sensibilidad | Especificidad | Precisión | F1 | AUC ROC |
|---|---:|---:|---:|---:|---:|---:|
| Random Forest | 83,35 % ± 6,89 | 77,21 % ± 11,62 | 88,63 % ± 8,86 | 86,12 % ± 9,14 | 80,82 % ± 8,32 | 0,9071 ± 0,0579 |
| Árbol de decisión | 78,51 % ± 7,53 | 71,53 % ± 12,28 | 84,50 % ± 10,11 | 80,68 % ± 10,24 | 75,16 % ± 9,17 | 0,8368 ± 0,0790 |
| SVM (kernel RBF) | 82,64 % ± 6,98 | 79,65 % ± 11,50 | 85,19 % ± 8,78 | 82,78 % ± 8,66 | 80,68 % ± 8,20 | 0,8979 ± 0,0628 |

- **Exactitud:** proporción de pacientes clasificados correctamente.
- **Sensibilidad:** de los pacientes con enfermedad, qué proporción quedó en la clase 1.
- **Especificidad:** de los pacientes sin enfermedad, qué proporción quedó en la clase 0.
- **Precisión:** de los pacientes puestos en la clase 1, qué proporción tenía enfermedad.
- **F1:** combina precisión y sensibilidad en un solo valor.
- **AUC ROC:** qué tan bien separa la probabilidad a los dos grupos. 0,5 equivale al azar y 1, a una separación perfecta.

<details>
<summary>Mínimo y máximo en las 100 particiones</summary>

| Modelo | Exactitud | Sensibilidad | Especificidad | Precisión | F1 | AUC ROC |
|---|---:|---:|---:|---:|---:|---:|
| Random Forest | 66,67 %–100 % | 46,15 %–100 % | 56,25 %–100 % | 63,16 %–100 % | 58,33 %–100 % | 0,6652–1 |
| Árbol de decisión | 60,00 %–96,67 % | 42,86 %–100 % | 56,25 %–100 % | 56,25 %–100 % | 50,00 %–96,55 % | 0,5848–0,9978 |
| SVM (kernel RBF) | 63,33 %–96,67 % | 42,86 %–100 % | 43,75 %–100 % | 59,09 %–100 % | 52,17 %–96,55 % | 0,6786–0,9955 |

</details>

<details>
<summary>Matriz de confusión agregada</summary>

Suma de las 100 particiones de prueba. Cada paciente se cuenta 10 veces, una por repetición (297 × 10 = 2970).

| Modelo | Verdaderos negativos | Falsos positivos | Falsos negativos | Verdaderos positivos | Total |
|---|---:|---:|---:|---:|---:|
| Random Forest | 1418 | 182 | 313 | 1057 | 2970 |
| Árbol de decisión | 1352 | 248 | 390 | 980 | 2970 |
| SVM (kernel RBF) | 1363 | 237 | 279 | 1091 | 2970 |

</details>

<details>
<summary>Configuraciones comparadas y modelos finales</summary>

| Modelo | Fijo | Se comparó | Veces elegida en las 100 particiones | Modelo final |
|---|---|---|---|---|
| Random Forest | 150 árboles, `max_features="sqrt"`, `min_samples_leaf=2`, criterio Gini | `max_depth` = 4, 6 u 8 | 59 / 29 / 12 | `max_depth=6`: 8866 nodos, 4508 hojas |
| Árbol de decisión | `min_samples_leaf=5`, criterio Gini | `max_depth` = 3, 4 o 5 | 53 / 28 / 19 | `max_depth=4`: 29 nodos, 15 hojas |
| SVM | `StandardScaler`, kernel RBF, `gamma="scale"`, `probability=True` | `C` = 0,1; 1 o 10 | 69 / 31 / 0 | `C=0,1`: 235 vectores soporte |

En las particiones, el Random Forest eligió más veces `max_depth=4`. Con las 297 filas ganó `max_depth=6`, por muy poco: AUC interna de 0,901215 frente a 0,901182. Las métricas de la tabla describen el procedimiento de selección completo, no una sola configuración.

</details>

`frontend/src/ml/metricas.json` tiene todo lo anterior, las importancias de las variables en el Random Forest y dos ejemplos reales del conjunto de datos. Los JSON actuales se generaron el 2026-09-13 con Python 3.13.5, scikit-learn 1.6.1, numpy 2.1.3 y pandas 2.2.3.

## Desarrollo

### Sitio web

```bash
cd frontend
npm install
npm run dev
```

Vite abre el sitio en `http://localhost:5173`. Para compilar la versión de producción:

```bash
npm run build     # tsc -b && vite build → frontend/dist
npm run preview   # sirve frontend/dist en local
```

### Reentrenar los modelos y regenerar los JSON

Desde la raíz del repositorio, con un Python que tenga scikit-learn, numpy, pandas y joblib:

```bash
python ml/entrenar.py
```

- Lee `data/uci/processed.cleveland.data` y escribe `frontend/src/ml/modelo.json`, `frontend/src/ml/metricas.json` y `ml/referencia.json`. Tarda alrededor de un minuto y medio.
- Usa `random_state=42`. Con las mismas versiones de las librerías salen los mismos modelos, y en `metricas.json` solo cambia la fecha. Para reproducir los JSON actuales, usa scikit-learn 1.6.1.
- Al terminar ejecuta `ml/verificar_paridad.py`. Si la comprobación falla, sale con error.

Para verificar los JSON sin reentrenar (Python puro, no necesita scikit-learn ni numpy):

```bash
python ml/verificar_paridad.py
```

### Prueba de paridad de la inferencia en el navegador

Desde la raíz del repositorio:

```bash
node frontend/scripts/paridad.ts
```

- Evalúa con `frontend/src/ml/inferencia.ts` las 597 entradas de `ml/referencia.json` y compara el resultado con las salidas de scikit-learn. Son 297 filas del conjunto de datos y 300 aleatorias dentro de sus rangos.
- Pide diferencia 0 en la probabilidad del Random Forest y del árbol, menos de 1e-9 en la SVM y la misma clase en todas las filas de los tres modelos. También comprueba las probabilidades de los dos ejemplos de `metricas.json`, que los rangos y ejemplos de respaldo de `frontend/src/data/variables.ts` coinciden con `metricas.json` y que la inferencia rechaza vectores incompletos o con valores no finitos.
- Termina con `RESULTADO: OK`, o con `RESULTADO: FALLA` y código de salida 1.
- `node` ejecuta el archivo `.ts` directamente, sin compilarlo. Se probó con Node 24. Conviene correrla después de cada reentrenamiento.

### Despliegue en Vercel

1. Importar el repositorio en Vercel.
2. **Root Directory:** `frontend`.
3. Framework: Vite. Build Command: `npm run build`. Output Directory: `dist`.
4. `frontend/vercel.json` redirige a `index.html` todas las rutas menos `/assets/`. Así `/evaluacion` y `/evaluacion/comparativo` cargan también al abrirlas directamente o al recargar, y un archivo de `/assets/` que no existe da 404 en vez de devolver la página. También envía cabeceras de seguridad: `Content-Security-Policy` (scripts solo del propio sitio; estilos y fuentes del sitio y de `cdn.jsdelivr.net`; imágenes del sitio, `data:` y `blob:`; no se puede incrustar en otra página), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y `Referrer-Policy: strict-origin-when-cross-origin`. Si se agrega un recurso de otro dominio, hay que añadirlo a esa política.
5. Agregar el dominio `cardionet.santerv.com` en la configuración de dominios del proyecto y crear en el DNS el registro que indique Vercel.

El sitio no necesita variables de entorno.

## Estructura de carpetas

```text
CARDIONET/
├── frontend/                      Sitio estático (React + Vite + TypeScript). Es lo que se despliega.
│   ├── index.html
│   ├── public/                    Imagen de la portada e ícono del sitio (favicon.svg)
│   ├── scripts/paridad.ts         Prueba de paridad de la inferencia en TypeScript
│   ├── src/
│   │   ├── api/evaluacion.ts      Validación de los datos y métricas de metricas.json (sin llamadas de red)
│   │   ├── api/calculo.ts         Cálculo con modelo.json; solo lo cargan las páginas de evaluación y comparación
│   │   ├── components/            Formulario, resultado, gráficos, avisos, «Qué hacer ahora», barra y pie
│   │   ├── context/EvaluacionActual.tsx  Evaluación en curso, solo en memoria (no en el historial)
│   │   ├── data/variables.ts      Etiquetas y opciones de las 13 variables del formulario
│   │   ├── hooks/                 Notificaciones en pantalla
│   │   ├── ml/                    Inferencia en el navegador
│   │   │   ├── modelo.json        Los tres modelos exportados
│   │   │   ├── metricas.json      Fuente, validación, métricas, importancias, rangos y ejemplos
│   │   │   ├── inferencia.ts      Evaluación de los árboles, el Random Forest y la SVM
│   │   │   ├── index.ts           Punto de entrada para la interfaz
│   │   │   └── tipos.ts
│   │   ├── pages/                 Inicio, evaluación y comparación de modelos
│   │   └── utils/                 Formato de números
│   ├── vercel.json
│   └── Dockerfile, nginx.conf     De la versión anterior; Vercel no los usa
├── ml/                            Entrenamiento y verificación en Python
│   ├── entrenar.py
│   ├── verificar_paridad.py
│   ├── referencia.json            Entradas y salidas de scikit-learn para las pruebas de paridad
│   └── README.md
├── data/
│   ├── uci/processed.cleveland.data   Datos de entrenamiento (UCI, CC BY 4.0)
│   ├── heart_disease_sample.csv       Versión anterior: etiqueta invertida, no usar
│   └── *.sql, *.py                    Versión anterior: base de datos PostgreSQL y sus scripts
├── backend/                       Versión anterior (Flask + PostgreSQL). Ya no se usa.
├── ml_models/                     Versión anterior: modelos .pkl. Ya no se usan.
├── nginx_vps_config/, docker-compose.yml, deploy.sh, install_vps.sh, .env.example
│                                  Despliegue de la versión anterior con Docker. Ya no se usa.
└── README.md
```

La versión anterior se conserva como referencia y no se modificó. Tenía un backend Flask con PostgreSQL, login y un directorio de médicos. La versión estática no incluye nada de eso.

## Créditos

- Proyecto de investigación de la **Universidad Nacional Hermilio Valdizán (UNHEVAL)**, en colaboración con la **Universidad Nacional Mayor de San Marcos (UNMSM)**.
- Hecho por Luis Manuel Carbajal Herrera ([santerv.com](https://santerv.com)).
- Datos: Janosi, A., Steinbrunn, W., Pfisterer, M., & Detrano, R. (1989). Heart Disease [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C52P4X. Licencia CC BY 4.0.

## Licencia

El código de este repositorio todavía no declara una licencia: no hay archivo `LICENSE`. Los datos de UCI tienen su propia licencia, CC BY 4.0.
