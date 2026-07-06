'use client';

import { useEffect } from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useResumeStore } from '@/store/resumeStore';

const BUTTON_CLASS =
  'p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition';

function isEditableTarget(element: Element | null) {
  if (!element) {
    return false;
  }
  const tag = element.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || (element as HTMLElement).isContentEditable;
}

export function UndoRedoButtons() {
  const { t } = useTranslation();
  const canUndo = useResumeStore((state) => state.canUndo);
  const canRedo = useResumeStore((state) => state.canRedo);
  const undo = useResumeStore((state) => state.undo);
  const redo = useResumeStore((state) => state.redo);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') {
        return;
      }
      // 输入控件内保留浏览器原生撤销，不拦截
      if (isEditableTarget(document.activeElement)) {
        return;
      }
      event.preventDefault();
      if (event.shiftKey) {
        useResumeStore.getState().redo();
      } else {
        useResumeStore.getState().undo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        title={t('builder.undo')}
        aria-label={t('builder.undo')}
        className={BUTTON_CLASS}
      >
        <Undo2 size={18} />
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        title={t('builder.redo')}
        aria-label={t('builder.redo')}
        className={BUTTON_CLASS}
      >
        <Redo2 size={18} />
      </button>
    </div>
  );
}
