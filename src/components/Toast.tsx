'use client';

import { create } from 'zustand';
import { CheckCircle2, XCircle } from 'lucide-react';

type ToastKind = 'error' | 'success';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastStore {
  toasts: ToastItem[];
  push: (kind: ToastKind, message: string) => void;
  dismiss: (id: number) => void;
}

const TOAST_DURATION_MS = 4000;
let nextToastId = 1;

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (kind, message) => {
    const id = nextToastId;
    nextToastId += 1;
    set((state) => ({ toasts: [...state.toasts, { id, kind, message }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
    }, TOAST_DURATION_MS);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** 从任意位置（含非组件代码）触发一条应用内提示 */
export function showToast(kind: ToastKind, message: string) {
  useToastStore.getState().push(kind, message);
}

export function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => dismiss(toast.id)}
          className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm shadow-lg transition ${
            toast.kind === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
          }`}
        >
          {toast.kind === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toast.message}</span>
        </button>
      ))}
    </div>
  );
}
