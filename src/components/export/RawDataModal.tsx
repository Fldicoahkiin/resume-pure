'use client';

import { useState, useEffect } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { exportToJSON } from '@/lib/export';
import { X, Copy, Check, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RawDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RawDataModal({ isOpen, onClose }: RawDataModalProps) {
  const { t } = useTranslation();
  const { resume, importData } = useResumeStore();
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setContent(exportToJSON(resume));
      setError('');
      setCopied(false);
    }
  }, [isOpen, resume]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t('rawDataModal.copyFailed'));
    }
  };

  const handleSave = () => {
    try {
      const data = JSON.parse(content);
      importData(data);
      onClose();
    } catch {
      setError(t('rawDataModal.jsonError'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{t('rawDataModal.title')}</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setError('');
            }}
            className="w-full h-full min-h-[400px] p-3 text-sm font-mono bg-gray-50 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-gray-400"
            spellCheck={false}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-red-500">{error}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? t('rawDataModal.copied') : t('rawDataModal.copy')}
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 text-sm text-white bg-gray-900 hover:bg-gray-800 rounded transition"
            >
              <Save size={16} />
              {t('rawDataModal.saveChanges')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
