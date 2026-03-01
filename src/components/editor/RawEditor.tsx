'use client';

import { useState, useEffect } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { exportToJSON, exportToYAML, importFromJSON, importFromYAML, downloadFile } from '@/lib/export';
import { Copy, Check, Save, Download, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getRawSearchPatterns } from '@/lib/previewAnchor';

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

  const updateUi = (patch: Partial<typeof ui>) => {
    setUi((prev) => ({ ...prev, ...patch }));
  };

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
  }, [resume, ui.format]);

  useEffect(() => {
    if (!jumpRequest) return;
    const textarea = textareaRef.current;
    if (!textarea) return;

    const patterns = getRawSearchPatterns(jumpRequest.anchor);
    const lineRange = findLineRange(ui.content, patterns);

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
  }, [jumpRequest?.id]);

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
    } catch {
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
    } catch {
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
