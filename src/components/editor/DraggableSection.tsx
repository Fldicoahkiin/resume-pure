'use client';

import { ReactNode } from 'react';
import { GripVertical, Eye, EyeOff, ChevronDown, ChevronUp } from 'lucide-react';
import { SectionConfig } from '@/types';

interface DraggableSectionProps {
  section: SectionConfig;
  icon: ReactNode;
  children: ReactNode;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onToggleVisible: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function DraggableSection({
  section,
  icon,
  children,
  isCollapsed,
  onToggleCollapse,
  onToggleVisible,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: DraggableSectionProps) {
  return (
    <section
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`rounded-lg bg-white shadow transition ${
        isDragging ? 'opacity-50 ring-2 ring-blue-300' : ''
      } ${!section.visible ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b cursor-grab select-none">
        <div className="text-gray-400 hover:text-gray-600">
          <GripVertical size={18} />
        </div>

        <div className="flex items-center gap-2 flex-1">
          <span className="text-gray-600">{icon}</span>
          <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible();
          }}
          className={`p-1.5 rounded transition ${
            section.visible
              ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title={section.visible ? '点击隐藏此模块' : '点击显示此模块'}
        >
          {section.visible ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="p-1.5 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
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
