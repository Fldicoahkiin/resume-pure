'use client';

import { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { Education } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

export default function EducationForm() {
  const { education, addEducation, updateEducation, removeEducation } = useResumeStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newEdu, setNewEdu] = useState<Partial<Education>>({
    degree: '',
    major: '',
    university: '',
    location: '',
    startDate: '',
    endDate: '',
  });

  const handleAdd = () => {
    if (newEdu.degree && newEdu.university) {
      addEducation({
        ...newEdu as Education,
        id: crypto.randomUUID(),
      } as Education);
      setNewEdu({
        degree: '',
        major: '',
        university: '',
        location: '',
        startDate: '',
        endDate: '',
      });
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Education</h2>
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
              placeholder="Degree"
              value={newEdu.degree}
              onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Major"
              value={newEdu.major}
              onChange={(e) => setNewEdu({ ...newEdu, major: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="University"
              value={newEdu.university}
              onChange={(e) => setNewEdu({ ...newEdu, university: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Location"
              value={newEdu.location}
              onChange={(e) => setNewEdu({ ...newEdu, location: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="Start Date"
              value={newEdu.startDate}
              onChange={(e) => setNewEdu({ ...newEdu, startDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="End Date"
              value={newEdu.endDate}
              onChange={(e) => setNewEdu({ ...newEdu, endDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
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
        {education.map((edu) => (
          <div key={edu.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{edu.degree} in {edu.major}</h3>
                <p className="text-gray-600">{edu.university}</p>
                <p className="text-sm text-gray-500">{edu.location} | {edu.startDate} - {edu.endDate}</p>
              </div>
              <button
                onClick={() => removeEducation(edu.id)}
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
