'use client';

import { useResumeStore } from '@/store/resumeStore';

export default function PersonalInfoForm() {
  const { personalInfo, updatePersonalInfo } = useResumeStore();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Personal Information</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            value={personalInfo.name}
            onChange={(e) => updatePersonalInfo({ name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={personalInfo.email}
            onChange={(e) => updatePersonalInfo({ email: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="john@example.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="tel"
            value={personalInfo.phone}
            onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="+1 234 567 8900"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">LinkedIn</label>
          <input
            type="url"
            value={personalInfo.linkedin || ''}
            onChange={(e) => updatePersonalInfo({ linkedin: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="https://linkedin.com/in/johndoe"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">GitHub</label>
          <input
            type="url"
            value={personalInfo.github || ''}
            onChange={(e) => updatePersonalInfo({ github: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="https://github.com/johndoe"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Website</label>
          <input
            type="url"
            value={personalInfo.website || ''}
            onChange={(e) => updatePersonalInfo({ website: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="https://johndoe.com"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          type="text"
          value={personalInfo.address || ''}
          onChange={(e) => updatePersonalInfo({ address: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="City, Country"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Summary</label>
        <textarea
          value={personalInfo.summary || ''}
          onChange={(e) => updatePersonalInfo({ summary: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg h-32"
          placeholder="Brief professional summary..."
        />
      </div>
    </div>
  );
}
