'use client';

import { useState } from 'react';
import {
  Mail, Phone, MapPin, Globe, Linkedin, Github,
  Twitter, Instagram, Facebook, Youtube, Dribbble,
  Link, User, Briefcase, Calendar, MessageCircle, AtSign,
  ChevronDown,
} from 'lucide-react';
import { ContactIconType } from '@/types';
import { useTranslation } from 'react-i18next';

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
  { type: 'linkedin', icon: <Linkedin size={16} />, labelKey: 'LinkedIn' },
  { type: 'github', icon: <Github size={16} />, labelKey: 'GitHub' },
  { type: 'twitter', icon: <Twitter size={16} />, labelKey: 'Twitter' },
  { type: 'instagram', icon: <Instagram size={16} />, labelKey: 'Instagram' },
  { type: 'facebook', icon: <Facebook size={16} />, labelKey: 'Facebook' },
  { type: 'youtube', icon: <Youtube size={16} />, labelKey: 'YouTube' },
  { type: 'dribbble', icon: <Dribbble size={16} />, labelKey: 'Dribbble' },
  { type: 'link', icon: <Link size={16} />, labelKey: 'iconPicker.link' },
  { type: 'user', icon: <User size={16} />, labelKey: 'iconPicker.user' },
  { type: 'briefcase', icon: <Briefcase size={16} />, labelKey: 'iconPicker.work' },
  { type: 'calendar', icon: <Calendar size={16} />, labelKey: 'iconPicker.date' },
  { type: 'message-circle', icon: <MessageCircle size={16} />, labelKey: 'iconPicker.message' },
  { type: 'at-sign', icon: <AtSign size={16} />, labelKey: '@' },
];

export function getIconComponent(type: ContactIconType, className?: string) {
  const iconClass = className || "w-3 h-3 text-gray-500";
  switch (type) {
    case 'mail': return <Mail className={iconClass} />;
    case 'phone': return <Phone className={iconClass} />;
    case 'map-pin': return <MapPin className={iconClass} />;
    case 'globe': return <Globe className={iconClass} />;
    case 'linkedin': return <Linkedin className={iconClass} />;
    case 'github': return <Github className={iconClass} />;
    case 'twitter': return <Twitter className={iconClass} />;
    case 'instagram': return <Instagram className={iconClass} />;
    case 'facebook': return <Facebook className={iconClass} />;
    case 'youtube': return <Youtube className={iconClass} />;
    case 'dribbble': return <Dribbble className={iconClass} />;
    case 'link': return <Link className={iconClass} />;
    case 'user': return <User className={iconClass} />;
    case 'briefcase': return <Briefcase className={iconClass} />;
    case 'calendar': return <Calendar className={iconClass} />;
    case 'message-circle': return <MessageCircle className={iconClass} />;
    case 'at-sign': return <AtSign className={iconClass} />;
    default: return <Globe className={iconClass} />;
  }
}

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
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
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
