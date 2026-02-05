'use client';

import { useRef } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { importFromJSON, importFromYAML } from '@/lib/export';
import { Upload } from 'lucide-react';

export function ImportButton() {
  const { importData } = useResumeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      let data;

      if (file.name.endsWith('.json')) {
        data = importFromJSON(content);
      } else if (file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
        data = importFromYAML(content);
      } else {
        alert('不支持的文件格式，请上传 JSON 或 YAML 文件');
        return;
      }

      importData(data);
      alert('导入成功！');
    } catch (error) {
      alert('导入失败：' + (error as Error).message);
    }

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.yaml,.yml"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
      >
        <Upload size={16} />
        导入数据
      </button>
    </>
  );
}
