'use client';

import { List } from 'lucide-react';

interface BulletListTextareaProps {
  label: string;
  value: string[];
  showBulletPoints: boolean;
  onChange: (nextValue: string[]) => void;
  onToggleShowBulletPoints: (nextValue: boolean) => void;
  showBulletPointsLabel: string;
  hideBulletPointsLabel: string;
  placeholder?: string;
  className?: string;
}

const NORMALIZED_LINE_BREAK = '\n';

function normalizeLineBreak(value: string): string {
  return value.replace(/\r?\n/g, NORMALIZED_LINE_BREAK);
}

function getTextareaValue(lines: string[], showBulletPoints: boolean): string {
  const prefix = showBulletPoints ? '• ' : '';

  if (lines.length === 0) {
    return prefix;
  }

  return lines.map((line) => `${prefix}${line}`).join(NORMALIZED_LINE_BREAK);
}

function getLinesFromTextareaValue(textareaValue: string, showBulletPoints: boolean): string[] {
  const lines = normalizeLineBreak(textareaValue).split(NORMALIZED_LINE_BREAK);

  if (!showBulletPoints) {
    return lines;
  }

  const nonBulletOnlyLines = lines.filter((line) => line !== '•');
  const nextLines: string[] = [];

  for (const line of nonBulletOnlyLines) {
    if (line.startsWith('• ')) {
      nextLines.push(line.slice(2));
      continue;
    }

    if (line.startsWith('•')) {
      const lastIndex = nextLines.length - 1;
      if (lastIndex >= 0) {
        nextLines[lastIndex] = `${nextLines[lastIndex]}${line.slice(1)}`;
      } else {
        nextLines.push(line.slice(1));
      }
      continue;
    }

    nextLines.push(line);
  }

  return nextLines;
}

export function BulletListTextarea({
  label,
  value,
  showBulletPoints,
  onChange,
  onToggleShowBulletPoints,
  showBulletPointsLabel,
  hideBulletPointsLabel,
  placeholder,
  className,
}: BulletListTextareaProps) {
  const toggleTitle = showBulletPoints ? hideBulletPointsLabel : showBulletPointsLabel;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <span>{label}</span>
        <button
          type="button"
          onClick={() => onToggleShowBulletPoints(!showBulletPoints)}
          title={toggleTitle}
          aria-label={toggleTitle}
          aria-pressed={showBulletPoints}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
            showBulletPoints
              ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
              : 'border-gray-300 text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          <List size={16} />
        </button>
      </div>

      <textarea
        value={getTextareaValue(value, showBulletPoints)}
        onChange={(event) => {
          onChange(getLinesFromTextareaValue(event.target.value, showBulletPoints));
        }}
        className="mt-1 block w-full min-h-[96px] resize-y px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-base font-normal bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        placeholder={placeholder}
      />
    </div>
  );
}
