'use client';

import { useState, useEffect } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { exportToJSON, exportToYAML, importFromJSON, importFromYAML, downloadFile } from '@/lib/export';
import { Copy, Check, Save, Download, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

type Format = 'json' | 'yaml';

export function RawEditor() {
  const { t } = useTranslation();
  const { resume, importData } = useResumeStore();
  const [format, setFormat] = useState<Format>('json');
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 当 resume 或 format 变化时更新内容
  useEffect(() => {
    const newContent = format === 'json'
      ? exportToJSON(resume)
      : exportToYAML(resume);
    setContent(newContent);
    setHasChanges(false);
    setError('');
  }, [resume, format]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t('rawEditor.copyFailed'));
    }
  };

  const handleSave = () => {
    try {
      const data = format === 'json'
        ? importFromJSON(content)
        : importFromYAML(content);
      importData(data);
      setHasChanges(false);
      setError('');
    } catch {
      setError(format === 'json' ? t('rawEditor.jsonError') : t('rawEditor.yamlError'));
    }
  };

  const handleDownload = () => {
    const filename = format === 'json' ? 'resume.json' : 'resume.yaml';
    const type = format === 'json' ? 'application/json' : 'text/yaml';
    downloadFile(content, filename, type);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let data;

      if (file.name.endsWith('.json')) {
        data = importFromJSON(text);
        setFormat('json');
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        data = importFromYAML(text);
        setFormat('yaml');
      } else {
        setError(t('rawEditor.unsupportedFormat'));
        return;
      }

      importData(data);
      setError('');
    } catch {
      setError(t('rawEditor.parseFailed'));
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setHasChanges(true);
    setError('');
  };

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFormat('json')}
            className={`px-3 py-1 text-sm rounded ${
              format === 'json'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            JSON
          </button>
          <button
            onClick={() => setFormat('yaml')}
            className={`px-3 py-1 text-sm rounded ${
              format === 'yaml'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            YAML
          </button>
        </div>

        <div className="flex items-center gap-1">
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
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
          {hasChanges && (
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
      {error && (
        <div className="px-4 py-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
          {error}
        </div>
      )}

      {/* 编辑区 */}
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="flex-1 p-4 text-sm font-mono bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}
