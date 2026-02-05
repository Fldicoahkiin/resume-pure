'use client';

import { useResumeStore } from '@/store/resumeStore';
import { User } from 'lucide-react';

export function PersonalInfoEditor() {
  const { resume, hasHydrated, updatePersonalInfo } = useResumeStore();

  if (!hasHydrated) {
    return (
      <div className="rounded-lg bg-white p-6 shadow animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const { personalInfo } = resume;

  return (
    <section className="rounded-lg bg-white p-6 shadow">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">个人信息</h2>
      </div>

      {/* 表单 */}
      <div className="grid grid-cols-6 gap-3">
        <label className="col-span-full text-sm font-medium text-gray-700">
          姓名
          <input
            type="text"
            value={personalInfo.name}
            onChange={(e) => updatePersonalInfo({ name: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
            placeholder=""
          />
        </label>

        <label className="col-span-full text-sm font-medium text-gray-700">
          职位
          <input
            type="text"
            value={personalInfo.title || ''}
            onChange={(e) => updatePersonalInfo({ title: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
            placeholder=""
          />
        </label>

        <label className="col-span-full text-sm font-medium text-gray-700">
          个人简介
          <textarea
            value={personalInfo.summary}
            onChange={(e) => updatePersonalInfo({ summary: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal resize-none"
            rows={3}
            placeholder=""
          />
        </label>

        <label className="col-span-4 text-sm font-medium text-gray-700">
          邮箱
          <input
            type="email"
            value={personalInfo.email}
            onChange={(e) => updatePersonalInfo({ email: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
            placeholder=""
          />
        </label>

        <label className="col-span-2 text-sm font-medium text-gray-700">
          电话
          <input
            type="tel"
            value={personalInfo.phone}
            onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
            placeholder=""
          />
        </label>

        <label className="col-span-4 text-sm font-medium text-gray-700">
          个人网站
          <input
            type="url"
            value={personalInfo.website || ''}
            onChange={(e) => updatePersonalInfo({ website: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
            placeholder=""
          />
        </label>

        <label className="col-span-2 text-sm font-medium text-gray-700">
          地点
          <input
            type="text"
            value={personalInfo.location}
            onChange={(e) => updatePersonalInfo({ location: e.target.value })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
            placeholder=""
          />
        </label>
      </div>
    </section>
  );
}
