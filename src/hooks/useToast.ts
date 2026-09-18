import { useState, useCallback } from 'react';
import { ToastMessage } from '../types';

let nextId = 1;
type ToastListener = (toasts: ToastMessage[]) => void;
const listeners = new Set<ToastListener>();
let currentToasts: ToastMessage[] = [];

function notify() {
  listeners.forEach((listener) => listener([...currentToasts]));
}

export const toast = {
  show(msg: Omit<ToastMessage, 'id'>) {
    const id = 'toast_' + nextId++;
    const duration = msg.duration ?? 4000;
    const toastItem: ToastMessage = { ...msg, id };

    currentToasts = [...currentToasts, toastItem];
    notify();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
  },

  success(message: string, title?: string) {
    this.show({ type: 'success', message, title });
  },

  info(message: string, title?: string) {
    this.show({ type: 'info', message, title });
  },

  warning(message: string, title?: string) {
    this.show({ type: 'warning', message, title });
  },

  error(message: string, title?: string) {
    this.show({ type: 'error', message, title, duration: 6000 });
  },

  dismiss(id: string) {
    currentToasts = currentToasts.filter((t) => t.id !== id);
    notify();
  },
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useCallback(() => {
    // Initial sync
    setToasts([...currentToasts]);
  }, []);

  useState(() => {
    const unsubscribe = (newToasts: ToastMessage[]) => {
      setToasts(newToasts);
    };
    listeners.add(unsubscribe);
    return () => {
      listeners.delete(unsubscribe);
    };
  });

  return {
    toasts,
    dismiss: toast.dismiss,
    toast,
  };
}
