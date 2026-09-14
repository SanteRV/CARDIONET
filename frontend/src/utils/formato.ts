const CON_DECIMALES = [1, 2, 3, 4].map(
  (decimales) => new Intl.NumberFormat('es', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
);
const UN_DECIMAL = CON_DECIMALES[0];
const DOS_DECIMALES = CON_DECIMALES[1];

/** Los tres modelos ubican el caso en el grupo con enfermedad si la probabilidad es mayor que 0,5 (src/ml/inferencia.ts). */
const UMBRAL_CLASE = 0.5;

/** 0,632 → «63,2 %» */
export function porcentaje(proporcion: number): string {
  return `${UN_DECIMAL.format(proporcion * 100)} %`;
}

/**
 * Probabilidad estimada para un caso: 0,632 → «63,2 %».
 * Con un decimal, 0,50017 (grupo con enfermedad) y 0,49988 (grupo sin enfermedad) se verían
 * los dos como «50,0 %». Si el valor no es exactamente 0,5, se agregan decimales hasta que se
 * vea de qué lado del 50 % está: «50,02 %» y «49,99 %».
 */
export function porcentajeProbabilidad(proporcion: number): string {
  if (proporcion === UMBRAL_CLASE) return porcentaje(proporcion);
  for (const formato of CON_DECIMALES) {
    const texto = formato.format(proporcion * 100);
    if (texto !== formato.format(UMBRAL_CLASE * 100)) return `${texto} %`;
  }
  return proporcion > UMBRAL_CLASE ? 'apenas más de 50 %' : 'apenas menos de 50 %';
}

/** 0,632 → 63.2 (para gráficos) */
export function aPorcentaje(proporcion: number): number {
  return Number((proporcion * 100).toFixed(1));
}

/** 0,9123 → «0,91» */
export function dosDecimales(valor: number): string {
  return DOS_DECIMALES.format(valor);
}
