'use client';

import { useResumeStore } from '@/store/resumeStore';
import { User, Plus, Trash2, GripVertical } from 'lucide-react';
import { IconPicker } from './IconPicker';
import { ContactIconType, ContactItem } from '@/types';
import { useState } from 'react';

export function PersonalInfoEditor() {
  const { resume, hasHydrated, updatePersonalInfo, updateIconConfig, addContact, updateContact, deleteContact, reorderContacts } = useResumeStore();
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

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
  const iconConfig = personalInfo.iconConfig || {};
  const contacts = personalInfo.contacts || [];

  const handleAddContact = () => {
    const newContact: ContactItem = {
      id: `contact-${Date.now()}`,
      type: 'link',
      value: '',
      order: contacts.length,
    };
    addContact(newContact);
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;

    const newContacts = [...contacts];
    const [removed] = newContacts.splice(draggedIdx, 1);
    newContacts.splice(idx, 0, removed);
    reorderContacts(newContacts);
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

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

        {/* 邮箱 - 带图标选择 */}
        <div className="col-span-full">
          <span className="text-sm font-medium text-gray-700">邮箱</span>
          <div className="flex items-center gap-2 mt-1">
            <IconPicker
              value={iconConfig.emailIcon || 'mail'}
              onChange={(type: ContactIconType) => updateIconConfig({ emailIcon: type })}
            />
            <input
              type="email"
              value={personalInfo.email}
              onChange={(e) => updatePersonalInfo({ email: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
              placeholder=""
            />
          </div>
        </div>

        {/* 电话 - 带图标选择 */}
        <div className="col-span-full">
          <span className="text-sm font-medium text-gray-700">电话</span>
          <div className="flex items-center gap-2 mt-1">
            <IconPicker
              value={iconConfig.phoneIcon || 'phone'}
              onChange={(type: ContactIconType) => updateIconConfig({ phoneIcon: type })}
            />
            <input
              type="tel"
              value={personalInfo.phone}
              onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
              placeholder=""
            />
          </div>
        </div>

        {/* 个人网站 - 带图标选择 */}
        <div className="col-span-full">
          <span className="text-sm font-medium text-gray-700">个人网站</span>
          <div className="flex items-center gap-2 mt-1">
            <IconPicker
              value={iconConfig.websiteIcon || 'globe'}
              onChange={(type: ContactIconType) => updateIconConfig({ websiteIcon: type })}
            />
            <input
              type="url"
              value={personalInfo.website || ''}
              onChange={(e) => updatePersonalInfo({ website: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
              placeholder=""
            />
          </div>
        </div>

        {/* 地点 - 带图标选择 */}
        <div className="col-span-full">
          <span className="text-sm font-medium text-gray-700">地点</span>
          <div className="flex items-center gap-2 mt-1">
            <IconPicker
              value={iconConfig.locationIcon || 'map-pin'}
              onChange={(type: ContactIconType) => updateIconConfig({ locationIcon: type })}
            />
            <input
              type="text"
              value={personalInfo.location}
              onChange={(e) => updatePersonalInfo({ location: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-base font-normal"
              placeholder=""
            />
          </div>
        </div>
      </div>

      {/* 自定义联系方式 */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">自定义联系方式</h3>
          <button
            type="button"
            onClick={handleAddContact}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Plus size={14} />
            添加
          </button>
        </div>

        {contacts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            点击"添加"按钮添加自定义联系方式
          </p>
        ) : (
          <div className="space-y-2">
            {contacts.map((contact, idx) => (
              <div
                key={contact.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 p-2 border rounded-md bg-gray-50 ${
                  draggedIdx === idx ? 'opacity-50' : ''
                }`}
              >
                <div className="cursor-grab text-gray-400 hover:text-gray-600">
                  <GripVertical size={16} />
                </div>

                <IconPicker
                  value={contact.type}
                  onChange={(type: ContactIconType) => updateContact(contact.id, { type })}
                />

                <input
                  type="text"
                  value={contact.value}
                  onChange={(e) => updateContact(contact.id, { value: e.target.value })}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                  placeholder="内容"
                />

                <button
                  type="button"
                  onClick={() => deleteContact(contact.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
