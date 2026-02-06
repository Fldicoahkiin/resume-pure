'use client';

import { ReactNode, useState } from 'react';
import { GripVertical, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { SectionConfig } from '@/types';
import { useTranslation } from 'react-i18next';

interface DraggableSectionProps {
  section: SectionConfig;
  icon: ReactNode;
  children: ReactNode;
  title?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggleVisible: () => void;
  onTitleChange?: (title: string) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function DraggableSection({
  section,
  icon,
  children,
  title,
  isCollapsed,
  onToggleCollapse,
  onToggleVisible,
  onTitleChange,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: DraggableSectionProps) {
  const { t } = useTranslation();
  const displayTitle = title || section.title;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(displayTitle);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(displayTitle);
    setIsEditing(true);
  };

  const handleTitleBlur = () => {
    setIsEditing(false);
    if (onTitleChange && editValue.trim() !== displayTitle) {
      onTitleChange(editValue.trim() || displayTitle);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(displayTitle);
      setIsEditing(false);
    }
  };

  return (
    <section
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`rounded-lg bg-white dark:bg-gray-800 shadow transition ${
        isDragging ? 'opacity-50 ring-2 ring-blue-300' : ''
      } ${!section.visible ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700 cursor-grab select-none">
        <div className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <GripVertical size={18} />
        </div>

        <div className="flex items-center gap-2 flex-1">
          <span className="text-gray-600 dark:text-gray-400">{icon}</span>
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              className="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 outline-none px-1"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h2
              className="text-lg font-semibold text-gray-900 dark:text-white cursor-text hover:text-blue-600 dark:hover:text-blue-400"
              onClick={handleTitleClick}
              title={t('draggableSection.clickToEdit') || 'Click to edit'}
            >
              {displayTitle}
            </h2>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible();
          }}
          className={`p-1.5 rounded transition ${
            section.visible
              ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700'
          }`}
          title={section.visible ? t('draggableSection.hideSection') : t('draggableSection.showSection')}
        >
          {section.visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition"
        >
          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-6 pt-4">
          {children}
        </div>
      )}
    </section>
  );
}
