'use client';

import { useState, useEffect } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { exportToJSON, exportToYAML, importFromJSON, importFromYAML, downloadFile } from '@/lib/export';
import { Copy, Check, Save, Download, Upload } from 'lucide-react';
import { useRef } from 'react';

type Format = 'json' | 'yaml';

export function RawEditor() {
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
      setError('复制失败');
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
      setError(format === 'json' ? 'JSON 格式错误' : 'YAML 格式错误');
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
        setError('不支持的文件格式');
        return;
      }

      importData(data);
      setError('');
    } catch {
      setError('文件解析失败');
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
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFormat('json')}
            className={`px-3 py-1 text-sm rounded ${
              format === 'json'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            JSON
          </button>
          <button
            onClick={() => setFormat('yaml')}
            className={`px-3 py-1 text-sm rounded ${
              format === 'yaml'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-200'
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
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
            title="导入文件"
          >
            <Upload size={16} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
            title="下载文件"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
            title="复制"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
          {hasChanges && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded"
            >
              <Save size={14} />
              保存
            </button>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-2 text-sm text-red-500 bg-red-50 border-b border-red-100">
          {error}
        </div>
      )}

      {/* 编辑区 */}
      <textarea
        value={content}
        onChange={(e) => handleContentChange(e.target.value)}
        className="flex-1 p-4 text-sm font-mono bg-gray-50 resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}
