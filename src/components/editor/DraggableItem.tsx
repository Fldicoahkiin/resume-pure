'use client';

import { ReactNode, useState } from 'react';
import { GripVertical, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';

interface DraggableItemProps {
  id: string;
  title: ReactNode;
  visible: boolean;
  children: ReactNode;
  onToggleVisible: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  headerActions?: ReactNode;
  defaultCollapsed?: boolean;
}

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
  defaultCollapsed = false,
}: DraggableItemProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div
      onDragOver={onDragOver}
      className={`rounded-2xl border shadow-sm transition ${
        isDragging ? 'opacity-50 ring-2 ring-blue-300' : ''
      } ${
        visible
          ? 'border-gray-200 bg-gray-50/70 dark:border-gray-700 dark:bg-gray-900/30'
          : 'border-gray-200/60 bg-gray-100/50 opacity-60 dark:border-gray-700/60 dark:bg-gray-900/20'
      }`}
    >
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="flex items-center gap-2 px-4 py-3 cursor-grab select-none"
      >
        <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <GripVertical size={16} />
        </div>

        <div className="flex-1 min-w-0 text-sm font-medium text-gray-900 dark:text-white truncate">
          {title}
        </div>

        {headerActions}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}
          className={`p-1 rounded transition ${
            visible
              ? 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              : 'text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400'
          }`}
          title={visible ? '隐藏' : '显示'}
        >
          {visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
          className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
        >
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}
