'use client';

import { useState } from 'react';
import {
  Mail, Phone, MapPin, Globe, Linkedin, Github,
  Twitter, Instagram, Facebook, Youtube, Dribbble,
  Link, User, Briefcase, Calendar, MessageCircle, AtSign,
  ChevronDown,
} from 'lucide-react';
import { ContactIconType } from '@/types';

interface IconOption {
  type: ContactIconType;
  icon: React.ReactNode;
  label: string;
}

const iconOptions: IconOption[] = [
  { type: 'mail', icon: <Mail size={16} />, label: '邮箱' },
  { type: 'phone', icon: <Phone size={16} />, label: '电话' },
  { type: 'map-pin', icon: <MapPin size={16} />, label: '地点' },
  { type: 'globe', icon: <Globe size={16} />, label: '网站' },
  { type: 'linkedin', icon: <Linkedin size={16} />, label: 'LinkedIn' },
  { type: 'github', icon: <Github size={16} />, label: 'GitHub' },
  { type: 'twitter', icon: <Twitter size={16} />, label: 'Twitter' },
  { type: 'instagram', icon: <Instagram size={16} />, label: 'Instagram' },
  { type: 'facebook', icon: <Facebook size={16} />, label: 'Facebook' },
  { type: 'youtube', icon: <Youtube size={16} />, label: 'YouTube' },
  { type: 'dribbble', icon: <Dribbble size={16} />, label: 'Dribbble' },
  { type: 'link', icon: <Link size={16} />, label: '链接' },
  { type: 'user', icon: <User size={16} />, label: '用户' },
  { type: 'briefcase', icon: <Briefcase size={16} />, label: '工作' },
  { type: 'calendar', icon: <Calendar size={16} />, label: '日期' },
  { type: 'message-circle', icon: <MessageCircle size={16} />, label: '消息' },
  { type: 'at-sign', icon: <AtSign size={16} />, label: '@' },
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
  const [isOpen, setIsOpen] = useState(false);
  const selected = iconOptions.find(o => o.type === value) || iconOptions[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition"
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
          <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-20 grid grid-cols-6 gap-1 w-[200px]">
            {iconOptions.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => {
                  onChange(option.type);
                  setIsOpen(false);
                }}
                className={`p-2 rounded hover:bg-gray-100 transition flex items-center justify-center ${
                  value === option.type ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                }`}
                title={option.label}
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
