'use client';

import { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { SkillGroup } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

export default function SkillsForm() {
  const { skills, addSkillGroup, updateSkillGroup, removeSkillGroup } = useResumeStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newSkill, setNewSkill] = useState<Partial<SkillGroup>>({
    name: '',
    skills: [],
  });
  const [skillInput, setSkillInput] = useState('');

  const handleAdd = () => {
    if (newSkill.name && newSkill.skills && newSkill.skills.length > 0) {
      addSkillGroup({
        ...newSkill as SkillGroup,
        id: crypto.randomUUID(),
      } as SkillGroup);
      setNewSkill({ name: '', skills: [] });
      setSkillInput('');
      setIsAdding(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setNewSkill({
        ...newSkill,
        skills: [...(newSkill.skills || []), skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Skills</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {isAdding && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <input
            type="text"
            placeholder="Category Name (e.g., Programming Languages)"
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add a skill"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              onClick={handleAddSkill}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {newSkill.skills?.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                {skill}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewSkill({ name: '', skills: [] });
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {skills.map((skill) => (
          <div key={skill.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold">{skill.name}</h3>
              <button
                onClick={() => removeSkillGroup(skill.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skill.skills.map((s, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 rounded">
                  {s}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
