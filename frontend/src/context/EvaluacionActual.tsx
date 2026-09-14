import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { EvaluacionCompleta } from '../api/evaluacion';

// La evaluación en curso vive solo en la memoria de la página (estado de React), para que
// «Comparar los 3 modelos», «Volver al resultado» y el botón «Atrás» la encuentren.
// No se pone en el historial del navegador (history.state), ni en localStorage o sessionStorage:
// Chrome guarda history.state en disco con la sesión y con las pestañas cerradas recientemente,
// y así otra persona podía reabrir la pestaña y ver los datos.
// Se borra al pulsar «Nueva evaluación», al recargar la página o al cerrar la pestaña.
//
// Si la persona sale del sitio en la misma pestaña y pulsa «Atrás», el navegador puede devolver la página
// entera desde su caché (bfcache), con el resultado y lo escrito en el formulario. En ese caso
// (pageshow con persisted) la página se oculta y se recarga, así que vuelve vacía.

interface EvaluacionActual {
  evaluacion: EvaluacionCompleta | null;
  setEvaluacion: (evaluacion: EvaluacionCompleta | null) => void;
}

const Contexto = createContext<EvaluacionActual | null>(null);

export function EvaluacionActualProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [evaluacion, setEvaluacion] = useState<EvaluacionCompleta | null>(null);
  const valor = useMemo(() => ({ evaluacion, setEvaluacion }), [evaluacion]);

  useEffect(() => {
    const alVolverDeLaCache = (evento: PageTransitionEvent) => {
      if (!evento.persisted) return;
      document.body.style.visibility = 'hidden';
      window.location.reload();
    };
    window.addEventListener('pageshow', alVolverDeLaCache);
    return () => window.removeEventListener('pageshow', alVolverDeLaCache);
  }, []);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useEvaluacionActual(): EvaluacionActual {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useEvaluacionActual se usa fuera de EvaluacionActualProvider.');
  return contexto;
}
