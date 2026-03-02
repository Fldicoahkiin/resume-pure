'use client';

import { useState, useEffect, useCallback } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { exportToJSON, exportToYAML, importFromJSON, importFromYAML, downloadFile } from '@/lib/export';
import { Copy, Check, Save, Download, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getRawJumpDescriptor, getRawSearchPatterns } from '@/lib/previewAnchor';
import type { RawJumpDescriptor } from '@/lib/previewAnchor';
import { RAW_SCHEMA_ERROR_MESSAGE } from '@/lib/rawData';

type Format = 'json' | 'yaml';

interface RawJumpRequest {
  id: number;
  anchor: string;
}

interface RawEditorProps {
  jumpRequest?: RawJumpRequest | null;
}

interface LineRange {
  lineNumber: number;
  selectionStart: number;
  selectionEnd: number;
}

interface TextLine {
  text: string;
  trimmed: string;
  indent: number;
  start: number;
  end: number;
}

interface JsonValueRange {
  start: number;
  end: number;
  type: 'object' | 'array' | 'primitive';
}

interface JsonObjectRange {
  start: number;
  end: number;
}

function createLineRangeFromIndex(content: string, index: number): LineRange {
  const safeIndex = Math.max(0, Math.min(index, content.length));
  const lineStart = content.lastIndexOf('\n', safeIndex - 1) + 1;
  const lineEndRaw = content.indexOf('\n', safeIndex);
  const lineEnd = lineEndRaw === -1 ? content.length : lineEndRaw;
  const lineNumber = content.slice(0, lineStart).split('\n').length;

  return {
    lineNumber,
    selectionStart: lineStart,
    selectionEnd: lineEnd,
  };
}

function buildTextLines(content: string): TextLine[] {
  const rawLines = content.split('\n');
  const lines: TextLine[] = [];
  let offset = 0;

  rawLines.forEach((line) => {
    const indentMatch = line.match(/^\s*/);
    const indent = indentMatch ? indentMatch[0].length : 0;

    lines.push({
      text: line,
      trimmed: line.trim(),
      indent,
      start: offset,
      end: offset + line.length,
    });

    offset += line.length + 1;
  });

  return lines;
}

function createLineRangeFromLine(lines: TextLine[], lineIndex: number): LineRange | null {
  const line = lines[lineIndex];
  if (!line) return null;

  return {
    lineNumber: lineIndex + 1,
    selectionStart: line.start,
    selectionEnd: line.end,
  };
}

function findMatchingBracket(
  content: string,
  startIndex: number,
  openChar: '{' | '[',
  closeChar: '}' | ']'
): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = startIndex; i < content.length; i += 1) {
    const char = content[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === openChar) {
      depth += 1;
      continue;
    }

    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

function findJsonKeyValueRange(
  content: string,
  key: string,
  scopeStart: number,
  scopeEndExclusive: number
): JsonValueRange | null {
  const pattern = `"${key}"`;
  const keyIndex = content.indexOf(pattern, scopeStart);
  if (keyIndex === -1 || keyIndex >= scopeEndExclusive) {
    return null;
  }

  const colonIndex = content.indexOf(':', keyIndex + pattern.length);
  if (colonIndex === -1 || colonIndex >= scopeEndExclusive) {
    return null;
  }

  let valueStart = colonIndex + 1;
  while (valueStart < scopeEndExclusive && /\s/.test(content[valueStart])) {
    valueStart += 1;
  }

  if (valueStart >= scopeEndExclusive) {
    return null;
  }

  const marker = content[valueStart];
  if (marker === '{') {
    const objectEnd = findMatchingBracket(content, valueStart, '{', '}');
    if (objectEnd !== -1 && objectEnd < scopeEndExclusive) {
      return {
        start: valueStart,
        end: objectEnd,
        type: 'object',
      };
    }
    return null;
  }

  if (marker === '[') {
    const arrayEnd = findMatchingBracket(content, valueStart, '[', ']');
    if (arrayEnd !== -1 && arrayEnd < scopeEndExclusive) {
      return {
        start: valueStart,
        end: arrayEnd,
        type: 'array',
      };
    }
    return null;
  }

  let valueEnd = valueStart;
  while (valueEnd < scopeEndExclusive && ![',', '\n', '}', ']'].includes(content[valueEnd])) {
    valueEnd += 1;
  }

  return {
    start: valueStart,
    end: Math.max(valueStart, valueEnd - 1),
    type: 'primitive',
  };
}

function findJsonRangeByPath(
  content: string,
  path: string[],
  scopeStart: number = 0,
  scopeEndExclusive: number = content.length
): JsonValueRange | null {
  if (path.length === 0) return null;

  let currentScopeStart = scopeStart;
  let currentScopeEndExclusive = scopeEndExclusive;
  let currentRange: JsonValueRange | null = null;

  for (const key of path) {
    currentRange = findJsonKeyValueRange(content, key, currentScopeStart, currentScopeEndExclusive);
    if (!currentRange) {
      return null;
    }

    currentScopeStart = currentRange.start;
    currentScopeEndExclusive = currentRange.end + 1;
  }

  return currentRange;
}

function findJsonNthObjectRange(
  content: string,
  arrayStart: number,
  arrayEnd: number,
  itemIndex: number
): JsonObjectRange | null {
  let depth = 0;
  let inString = false;
  let escaped = false;
  let currentItemIndex = -1;
  let currentItemStart = -1;

  for (let i = arrayStart + 1; i < arrayEnd; i += 1) {
    const char = content[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) {
        currentItemIndex += 1;
        if (currentItemIndex === itemIndex) {
          currentItemStart = i;
        }
      }
      depth += 1;
      continue;
    }

    if (char === '[') {
      depth += 1;
      continue;
    }

    if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0 && currentItemStart !== -1 && currentItemIndex === itemIndex && char === '}') {
        return {
          start: currentItemStart,
          end: i,
        };
      }
    }
  }

  return null;
}

function findJsonKeyIndexInRange(content: string, key: string, rangeStart: number, rangeEndExclusive: number): number {
  const pattern = `"${key}"`;
  const keyIndex = content.indexOf(pattern, rangeStart);
  return keyIndex === -1 || keyIndex >= rangeEndExclusive ? -1 : keyIndex;
}

function findYamlBlockEnd(
  lines: TextLine[],
  startLineIndex: number,
  baseIndent: number,
  scopeEndExclusive: number
): number {
  for (let i = startLineIndex + 1; i < scopeEndExclusive; i += 1) {
    const line = lines[i];
    if (!line || line.trimmed.length === 0) {
      continue;
    }

    if (line.indent <= baseIndent) {
      return i;
    }
  }

  return scopeEndExclusive;
}

function findYamlPathLine(
  lines: TextLine[],
  path: string[],
  scopeStart: number,
  scopeEndExclusive: number,
  baseIndent: number
): number | null {
  if (path.length === 0) return null;

  let currentScopeStart = scopeStart;
  let currentScopeEndExclusive = scopeEndExclusive;
  let currentIndent = baseIndent;

  for (let i = 0; i < path.length; i += 1) {
    const key = path[i];
    let keyLineIndex = -1;

    for (let lineIndex = currentScopeStart; lineIndex < currentScopeEndExclusive; lineIndex += 1) {
      const line = lines[lineIndex];
      if (!line || line.trimmed.length === 0) continue;
      if (line.indent !== currentIndent) continue;

      if (line.trimmed === `${key}:` || line.trimmed.startsWith(`${key}: `)) {
        keyLineIndex = lineIndex;
        break;
      }
    }

    if (keyLineIndex === -1) {
      return null;
    }

    if (i === path.length - 1) {
      return keyLineIndex;
    }

    const blockEnd = findYamlBlockEnd(lines, keyLineIndex, currentIndent, currentScopeEndExclusive);
    currentScopeStart = keyLineIndex + 1;
    currentScopeEndExclusive = blockEnd;
    currentIndent += 2;
  }

  return null;
}

function findYamlArrayItemLines(
  lines: TextLine[],
  arrayLineIndex: number,
  arrayIndent: number,
  arrayEndExclusive: number
): number[] {
  const itemIndent = arrayIndent + 2;
  const result: number[] = [];

  for (let i = arrayLineIndex + 1; i < arrayEndExclusive; i += 1) {
    const line = lines[i];
    if (!line || line.trimmed.length === 0) continue;

    if (line.indent === itemIndent && line.trimmed.startsWith('- ')) {
      result.push(i);
    }
  }

  return result;
}

function findYamlItemBlockEnd(
  lines: TextLine[],
  itemStartLine: number,
  itemIndent: number,
  scopeEndExclusive: number
): number {
  for (let i = itemStartLine + 1; i < scopeEndExclusive; i += 1) {
    const line = lines[i];
    if (!line || line.trimmed.length === 0) continue;

    if (line.indent < itemIndent) {
      return i;
    }

    if (line.indent === itemIndent && line.trimmed.startsWith('- ')) {
      return i;
    }
  }

  return scopeEndExclusive;
}

function findYamlItemFocusLine(
  lines: TextLine[],
  itemStartLine: number,
  itemEndExclusive: number,
  itemIndent: number,
  focusKey?: string,
  fallbackFocusKey?: string
): number {
  const tryFind = (key: string): number => {
    const firstLine = lines[itemStartLine];
    if (firstLine && firstLine.trimmed.startsWith(`- ${key}:`)) {
      return itemStartLine;
    }

    for (let i = itemStartLine + 1; i < itemEndExclusive; i += 1) {
      const line = lines[i];
      if (!line || line.trimmed.length === 0) continue;
      if (line.indent !== itemIndent + 2) continue;

      if (line.trimmed === `${key}:` || line.trimmed.startsWith(`${key}: `)) {
        return i;
      }
    }

    return -1;
  };

  if (focusKey) {
    const lineIndex = tryFind(focusKey);
    if (lineIndex !== -1) return lineIndex;
  }

  if (fallbackFocusKey) {
    const lineIndex = tryFind(fallbackFocusKey);
    if (lineIndex !== -1) return lineIndex;
  }

  return itemStartLine;
}

function findStructuredJsonLineRange(content: string, descriptor: RawJumpDescriptor): LineRange | null {
  if (descriptor.fieldPath && descriptor.fieldPath.length > 0) {
    if (descriptor.fieldPath.length === 1) {
      const rootKeyIndex = findJsonKeyIndexInRange(content, descriptor.fieldPath[0], 0, content.length);
      if (rootKeyIndex !== -1) {
        return createLineRangeFromIndex(content, rootKeyIndex);
      }
      return null;
    }

    const parentPath = descriptor.fieldPath.slice(0, -1);
    const fieldKey = descriptor.fieldPath[descriptor.fieldPath.length - 1];
    const parentRange = findJsonRangeByPath(content, parentPath);
    if (!parentRange || parentRange.type !== 'object') {
      return null;
    }

    const fieldKeyIndex = findJsonKeyIndexInRange(content, fieldKey, parentRange.start, parentRange.end + 1);
    if (fieldKeyIndex === -1) {
      return null;
    }

    return createLineRangeFromIndex(content, fieldKeyIndex);
  }

  if (!descriptor.arrayPath || typeof descriptor.itemIndex !== 'number') {
    return null;
  }

  const arrayRange = findJsonRangeByPath(content, descriptor.arrayPath);
  if (!arrayRange || arrayRange.type !== 'array') {
    return null;
  }

  let targetRange = findJsonNthObjectRange(content, arrayRange.start, arrayRange.end, descriptor.itemIndex);
  if (!targetRange) {
    return null;
  }

  if (descriptor.nestedArrayPath && typeof descriptor.nestedItemIndex === 'number') {
    const nestedArrayRange = findJsonRangeByPath(
      content,
      descriptor.nestedArrayPath,
      targetRange.start,
      targetRange.end + 1
    );

    if (!nestedArrayRange || nestedArrayRange.type !== 'array') {
      return null;
    }

    const nestedItemRange = findJsonNthObjectRange(content, nestedArrayRange.start, nestedArrayRange.end, descriptor.nestedItemIndex);
    if (!nestedItemRange) {
      return null;
    }

    targetRange = nestedItemRange;
  }

  const focusKeys = [descriptor.focusKey, descriptor.fallbackFocusKey].filter(
    (key): key is string => Boolean(key)
  );

  for (const key of focusKeys) {
    const keyIndex = findJsonKeyIndexInRange(content, key, targetRange.start, targetRange.end + 1);
    if (keyIndex !== -1) {
      return createLineRangeFromIndex(content, keyIndex);
    }
  }

  return createLineRangeFromIndex(content, targetRange.start);
}

function findStructuredYamlLineRange(content: string, descriptor: RawJumpDescriptor): LineRange | null {
  const lines = buildTextLines(content);

  if (descriptor.fieldPath && descriptor.fieldPath.length > 0) {
    const fieldLine = findYamlPathLine(lines, descriptor.fieldPath, 0, lines.length, 0);
    if (fieldLine === null) return null;
    return createLineRangeFromLine(lines, fieldLine);
  }

  if (!descriptor.arrayPath || typeof descriptor.itemIndex !== 'number') {
    return null;
  }

  const arrayLine = findYamlPathLine(lines, descriptor.arrayPath, 0, lines.length, 0);
  if (arrayLine === null) {
    return null;
  }

  const arrayIndent = lines[arrayLine].indent;
  const arrayEnd = findYamlBlockEnd(lines, arrayLine, arrayIndent, lines.length);
  const arrayItems = findYamlArrayItemLines(lines, arrayLine, arrayIndent, arrayEnd);
  const itemStartLine = arrayItems[descriptor.itemIndex];

  if (typeof itemStartLine !== 'number') {
    return null;
  }

  let targetStartLine = itemStartLine;
  let targetEnd = findYamlItemBlockEnd(lines, itemStartLine, lines[itemStartLine].indent, arrayEnd);

  if (descriptor.nestedArrayPath && typeof descriptor.nestedItemIndex === 'number') {
    const nestedArrayLine = findYamlPathLine(
      lines,
      descriptor.nestedArrayPath,
      targetStartLine,
      targetEnd,
      lines[targetStartLine].indent + 2
    );

    if (nestedArrayLine === null) {
      return null;
    }

    const nestedArrayIndent = lines[nestedArrayLine].indent;
    const nestedArrayEnd = findYamlBlockEnd(lines, nestedArrayLine, nestedArrayIndent, targetEnd);
    const nestedItems = findYamlArrayItemLines(lines, nestedArrayLine, nestedArrayIndent, nestedArrayEnd);
    const nestedItemStart = nestedItems[descriptor.nestedItemIndex];

    if (typeof nestedItemStart !== 'number') {
      return null;
    }

    targetStartLine = nestedItemStart;
    targetEnd = findYamlItemBlockEnd(lines, nestedItemStart, lines[nestedItemStart].indent, nestedArrayEnd);
  }

  const focusLine = findYamlItemFocusLine(
    lines,
    targetStartLine,
    targetEnd,
    lines[targetStartLine].indent,
    descriptor.focusKey,
    descriptor.fallbackFocusKey
  );

  return createLineRangeFromLine(lines, focusLine);
}

function findStructuredLineRange(content: string, format: Format, descriptor: RawJumpDescriptor | null): LineRange | null {
  if (!descriptor) return null;

  if (format === 'json') {
    return findStructuredJsonLineRange(content, descriptor);
  }

  return findStructuredYamlLineRange(content, descriptor);
}

function findLineRange(content: string, patterns: string[]): LineRange | null {
  if (!content) return null;

  for (const pattern of patterns) {
    const index = content.indexOf(pattern);
    if (index === -1) continue;

    const lineStart = content.lastIndexOf('\n', index - 1) + 1;
    const lineEndRaw = content.indexOf('\n', index);
    const lineEnd = lineEndRaw === -1 ? content.length : lineEndRaw;
    const lineNumber = content.slice(0, lineStart).split('\n').length;

    return {
      lineNumber,
      selectionStart: lineStart,
      selectionEnd: lineEnd,
    };
  }

  return null;
}

export function RawEditor({ jumpRequest }: RawEditorProps) {
  const { t } = useTranslation();
  const { resume, importData } = useResumeStore();
  const [ui, setUi] = useState({
    format: 'json' as Format,
    content: '',
    copied: false,
    error: '',
    hasChanges: false,
    jumpedLine: null as number | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const handledJumpIdRef = useRef<number | null>(null);

  const updateUi = useCallback((patch: Partial<typeof ui>) => {
    setUi((prev) => ({ ...prev, ...patch }));
  }, []);

  // 当 resume 或 format 变化时更新内容
  useEffect(() => {
    const newContent = ui.format === 'json'
      ? exportToJSON(resume)
      : exportToYAML(resume);
    updateUi({
      content: newContent,
      hasChanges: false,
      error: '',
    });
  }, [resume, ui.format, updateUi]);

  useEffect(() => {
    if (!jumpRequest) {
      handledJumpIdRef.current = null;
      return;
    }

    if (handledJumpIdRef.current === jumpRequest.id) {
      return;
    }
    handledJumpIdRef.current = jumpRequest.id;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const descriptor = getRawJumpDescriptor(jumpRequest.anchor, resume);
    const structuredLineRange = findStructuredLineRange(ui.content, ui.format, descriptor);
    const patterns = getRawSearchPatterns(jumpRequest.anchor, resume);
    const lineRange = structuredLineRange || findLineRange(ui.content, patterns);

    if (!lineRange) return;

    textarea.focus();
    textarea.setSelectionRange(lineRange.selectionStart, lineRange.selectionEnd);

    const computedLineHeight = Number.parseFloat(window.getComputedStyle(textarea).lineHeight);
    const lineHeight = Number.isFinite(computedLineHeight) ? computedLineHeight : 22;
    textarea.scrollTop = Math.max(0, (lineRange.lineNumber - 3) * lineHeight);

    updateUi({ jumpedLine: lineRange.lineNumber });
    const timerId = window.setTimeout(() => {
      updateUi({ jumpedLine: null });
    }, 2200);

    return () => window.clearTimeout(timerId);
  }, [jumpRequest, resume, ui.content, ui.format, updateUi]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ui.content);
      updateUi({ copied: true });
      setTimeout(() => updateUi({ copied: false }), 2000);
    } catch {
      updateUi({ error: t('rawEditor.copyFailed') });
    }
  };

  const handleSave = () => {
    try {
      const data = ui.format === 'json'
        ? importFromJSON(ui.content)
        : importFromYAML(ui.content);
      importData(data);
      updateUi({
        hasChanges: false,
        error: '',
      });
    } catch (error) {
      if (error instanceof Error && error.message === RAW_SCHEMA_ERROR_MESSAGE) {
        updateUi({ error: t('rawEditor.schemaVersionError') });
        return;
      }

      updateUi({
        error: ui.format === 'json' ? t('rawEditor.jsonError') : t('rawEditor.yamlError'),
      });
    }
  };

  const handleDownload = () => {
    const filename = ui.format === 'json' ? 'resume.json' : 'resume.yaml';
    const type = ui.format === 'json' ? 'application/json' : 'text/yaml';
    downloadFile(ui.content, filename, type);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let data;

      if (file.name.endsWith('.json')) {
        data = importFromJSON(text);
        updateUi({ format: 'json' });
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        data = importFromYAML(text);
        updateUi({ format: 'yaml' });
      } else {
        updateUi({ error: t('rawEditor.unsupportedFormat') });
        return;
      }

      importData(data);
      updateUi({ error: '' });
    } catch (error) {
      if (error instanceof Error && error.message === RAW_SCHEMA_ERROR_MESSAGE) {
        updateUi({ error: t('rawEditor.schemaVersionError') });
        return;
      }

      updateUi({ error: t('rawEditor.parseFailed') });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContentChange = (value: string) => {
    updateUi({
      content: value,
      hasChanges: true,
      error: '',
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => updateUi({ format: 'json' })}
            className={`px-3 py-1 text-sm rounded ${
              ui.format === 'json'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            JSON
          </button>
          <button
            onClick={() => updateUi({ format: 'yaml' })}
            className={`px-3 py-1 text-sm rounded ${
              ui.format === 'yaml'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            YAML
          </button>
        </div>

        <div className="flex items-center gap-2">
          {ui.jumpedLine !== null && (
            <span className="hidden sm:inline text-xs text-blue-600 dark:text-blue-400">
              {t('rawEditor.jumpedToLine', { line: ui.jumpedLine })}
            </span>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.yaml,.yml"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title={t('rawEditor.importFile')}
          >
            <Upload size={16} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title={t('rawEditor.downloadFile')}
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title={t('rawEditor.copy')}
          >
            {ui.copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
          {ui.hasChanges && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded"
            >
              <Save size={14} />
              {t('rawEditor.save')}
            </button>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {ui.error && (
        <div className="px-4 py-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
          {ui.error}
        </div>
      )}

      {/* 编辑区 */}
      <textarea
        ref={textareaRef}
        value={ui.content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="flex-1 p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}
