'use client';

import { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { Experience } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

export default function ExperienceForm() {
  const { experience, addExperience, updateExperience, removeExperience } = useResumeStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newExp, setNewExp] = useState<Partial<Experience>>({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    description: [],
  });

  const handleAdd = () => {
    if (newExp.title && newExp.company) {
      addExperience({
        ...newExp as Experience,
        id: crypto.randomUUID(),
        description: newExp.description || [],
      } as Experience);
      setNewExp({
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        description: [],
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Experience</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Job Title"
              value={newExp.title}
              onChange={(e) => setNewExp({ ...newExp, title: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Company"
              value={newExp.company}
              onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Location"
              value={newExp.location}
              onChange={(e) => setNewExp({ ...newExp, location: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Start Date"
              value={newExp.startDate}
              onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="End Date (or 'Present')"
              value={newExp.endDate}
              onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
          <textarea
            placeholder="Description (one point per line)"
            value={newExp.description?.join('\n') || ''}
            onChange={(e) => setNewExp({ ...newExp, description: e.target.value.split('\n') })}
            className="w-full px-3 py-2 border rounded-lg h-24"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {experience.map((exp) => (
          <div key={exp.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{exp.title}</h3>
                <p className="text-gray-600">{exp.company}</p>
                <p className="text-sm text-gray-500">{exp.location} | {exp.startDate} - {exp.endDate}</p>
              </div>
              <button
                onClick={() => removeExperience(exp.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
