import { useCallback } from 'react';

type ToastType = 'error' | 'warning' | 'info';

let toastContainer: HTMLDivElement | null = null;

// La posición del contenedor está en index.css (#notificationContainer): arriba a la derecha
// en pantallas anchas y abajo, a todo el ancho, en pantallas estrechas.
function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'notificationContainer';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/** Cierra los mensajes abiertos, para que uno viejo no quede encima de lo que viene después. */
function cerrarNotificaciones() {
  toastContainer?.replaceChildren();
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function useNotification() {
  const notify = useCallback((message: string, type: ToastType = 'error') => {
    const container = ensureContainer();
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <span class="toast-message">${escapeHtml(message)}</span>
      <button type="button" class="toast-close" aria-label="Cerrar">&times;</button>
    `;
    const close = () => {
      toast.remove();
    };
    toast.querySelector('.toast-close')?.addEventListener('click', close);
    container.appendChild(toast);
    setTimeout(close, 5000);
  }, []);

  return { notify, cerrarNotificaciones };
}
