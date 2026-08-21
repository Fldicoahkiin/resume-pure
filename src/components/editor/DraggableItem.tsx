'use client';

import { useState, type DragEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

type DraggableItemProps = {
  id: string;
  title: ReactNode;
  visible: boolean;
  children: ReactNode;
  onToggleVisible: () => void;
  onDragStart: () => void;
  onDragOver: (event: DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  headerActions?: ReactNode;
  initialCollapsed?: boolean;
};

export function DraggableItem({
  title,
  visible,
  children,
  onToggleVisible,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  headerActions,
  initialCollapsed = false,
}: DraggableItemProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(() => initialCollapsed);

  return (
    <div
      onDragOver={onDragOver}
      className={`rounded-xl border transition-colors ${
        isDragging ? 'opacity-50 ring-2 ring-blue-300' : ''
      } ${
        visible
          ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
          : 'border-gray-200/60 bg-gray-100/50 opacity-60 dark:border-gray-700/60 dark:bg-gray-900/20'
      }`}
    >
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className={`flex cursor-grab select-none items-center gap-2 px-3 py-3 sm:px-4 ${collapsed ? '' : 'border-b border-gray-200 dark:border-gray-700'}`}
      >
        <div aria-hidden="true" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <GripVertical size={16} />
        </div>

        <div className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </div>

        {headerActions}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}
          className={`rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            visible
              ? 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              : 'text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400'
          }`}
          title={visible ? t('common.hide') : t('common.show')}
          aria-label={visible ? t('common.hide') : t('common.show')}
        >
          {visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
          className="rounded-md p-1.5 text-gray-400 transition-colors hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:text-gray-200"
          title={collapsed ? t('common.expand') : t('common.collapse')}
          aria-label={collapsed ? t('common.expand') : t('common.collapse')}
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-3 py-4 sm:px-4">
          {children}
        </div>
      )}
    </div>
  );
}
