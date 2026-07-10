import type { RawJumpDescriptor } from '@/lib/previewAnchor';

/**
 * Raw 文本锚点跳转：在 JSON/YAML/Markdown 文本中定位预览锚点对应的行。
 * 纯文本扫描实现（不解析成 AST），保证与编辑器中用户看到的原文一一对应。
 */

export type Format = 'json' | 'yaml' | 'markdown';

export interface LineRange {
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

export function findStructuredLineRange(content: string, format: Format, descriptor: RawJumpDescriptor | null): LineRange | null {
  if (!descriptor) return null;

  if (format === 'json') {
    return findStructuredJsonLineRange(content, descriptor);
  }

  return findStructuredYamlLineRange(content, descriptor);
}

export function findLineRange(content: string, patterns: string[]): LineRange | null {
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
