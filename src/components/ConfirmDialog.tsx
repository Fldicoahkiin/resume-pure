'use client';

import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { useTranslation } from 'react-i18next';

interface ConfirmStore {
  open: boolean;
  message: string;
  resolve: ((confirmed: boolean) => void) | null;
  request: (message: string, resolve: (confirmed: boolean) => void) => void;
  settle: (confirmed: boolean) => void;
}

const useConfirmStore = create<ConfirmStore>((set, get) => ({
  open: false,
  message: '',
  resolve: null,
  request: (message, resolve) => {
    // 覆盖前先取消上一个未决请求，避免其 Promise 永远挂起
    get().resolve?.(false);
    set({ open: true, message, resolve });
  },
  settle: (confirmed) => {
    get().resolve?.(confirmed);
    set({ open: false, message: '', resolve: null });
  },
}));

/** 应用内确认框，替代 window.confirm；返回用户是否确认 */
export function confirmDialog(message: string): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirmStore.getState().request(message, resolve);
  });
}

export function ConfirmDialogHost() {
  const { t } = useTranslation();
  const open = useConfirmStore((state) => state.open);
  const message = useConfirmStore((state) => state.message);
  const settle = useConfirmStore((state) => state.settle);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    cancelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        settle(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, settle]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={() => settle(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-sm text-gray-700 dark:text-gray-200">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={() => settle(false)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => settle(true)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white transition hover:bg-red-500"
          >
            {t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
