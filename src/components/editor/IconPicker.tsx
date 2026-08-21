'use client';

import { useState } from 'react';
import {
  Mail, Phone, MapPin, Globe,
  Link, User, Briefcase, Calendar, MessageCircle, AtSign,
  ChevronDown,
} from 'lucide-react';
import { siDribbble, siFacebook, siGithub, siInstagram, siX, siYoutube } from 'simple-icons';
import { BrandIcon } from '@/components/BrandIcon';
import { ContactIconType } from '@/types';
import { useTranslation } from 'react-i18next';

const LINKEDIN_ICON_PATH = 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 110-4 2 2 0 010 4z';

interface IconOption {
  type: ContactIconType;
  icon: React.ReactNode;
  labelKey: string;
}

const iconOptions: IconOption[] = [
  { type: 'mail', icon: <Mail size={16} />, labelKey: 'iconPicker.email' },
  { type: 'phone', icon: <Phone size={16} />, labelKey: 'iconPicker.phone' },
  { type: 'map-pin', icon: <MapPin size={16} />, labelKey: 'iconPicker.location' },
  { type: 'globe', icon: <Globe size={16} />, labelKey: 'iconPicker.website' },
  { type: 'linkedin', icon: <BrandIcon path={LINKEDIN_ICON_PATH} />, labelKey: 'LinkedIn' },
  { type: 'github', icon: <BrandIcon path={siGithub.path} />, labelKey: 'GitHub' },
  { type: 'twitter', icon: <BrandIcon path={siX.path} />, labelKey: 'Twitter' },
  { type: 'instagram', icon: <BrandIcon path={siInstagram.path} />, labelKey: 'Instagram' },
  { type: 'facebook', icon: <BrandIcon path={siFacebook.path} />, labelKey: 'Facebook' },
  { type: 'youtube', icon: <BrandIcon path={siYoutube.path} />, labelKey: 'YouTube' },
  { type: 'dribbble', icon: <BrandIcon path={siDribbble.path} />, labelKey: 'Dribbble' },
  { type: 'link', icon: <Link size={16} />, labelKey: 'iconPicker.link' },
  { type: 'user', icon: <User size={16} />, labelKey: 'iconPicker.user' },
  { type: 'briefcase', icon: <Briefcase size={16} />, labelKey: 'iconPicker.work' },
  { type: 'calendar', icon: <Calendar size={16} />, labelKey: 'iconPicker.date' },
  { type: 'message-circle', icon: <MessageCircle size={16} />, labelKey: 'iconPicker.message' },
  { type: 'at-sign', icon: <AtSign size={16} />, labelKey: '@' },
];

interface IconPickerProps {
  value: ContactIconType;
  onChange: (type: ContactIconType) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const selected = iconOptions.find(o => o.type === value) || iconOptions[0];

  const getLabel = (labelKey: string) => {
    // For social media platforms, use the label directly (no translation needed)
    if (!labelKey.includes('.')) {
      return labelKey;
    }
    return t(labelKey);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700"
      >
        {selected.icon}
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-label="close icon picker"
          />
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 grid grid-cols-6 gap-1 w-[200px]">
            {iconOptions.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => {
                  onChange(option.type);
                  setIsOpen(false);
                }}
                className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-center ${
                  value === option.type ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`}
                title={getLabel(option.labelKey)}
              >
                {option.icon}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
