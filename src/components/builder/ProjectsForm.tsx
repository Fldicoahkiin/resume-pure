'use client';

import { useState } from 'react';
import { useResumeStore } from '@/store/resumeStore';
import { Project } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

export default function ProjectsForm() {
  const { projects, addProject, updateProject, removeProject } = useResumeStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newProj, setNewProj] = useState<Partial<Project>>({
    name: '',
    link: '',
    startDate: '',
    endDate: '',
    description: [],
  });
  const [descInput, setDescInput] = useState('');

  const handleAdd = () => {
    if (newProj.name) {
      addProject({
        ...newProj as Project,
        id: crypto.randomUUID(),
        description: newProj.description || [],
      } as Project);
      setNewProj({
        name: '',
        link: '',
        startDate: '',
        endDate: '',
        description: [],
      });
      setDescInput('');
      setIsAdding(false);
    }
  };

  const handleAddDesc = () => {
    if (descInput.trim()) {
      setNewProj({
        ...newProj,
        description: [...(newProj.description || []), descInput.trim()],
      });
      setDescInput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Projects</h2>
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
          <input
            type="text"
            placeholder="Project Name"
            value={newProj.name}
            onChange={(e) => setNewProj({ ...newProj, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <input
            type="url"
            placeholder="Project Link"
            value={newProj.link || ''}
            onChange={(e) => setNewProj({ ...newProj, link: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Start Date"
              value={newProj.startDate}
              onChange={(e) => setNewProj({ ...newProj, startDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="text"
              placeholder="End Date"
              value={newProj.endDate}
              onChange={(e) => setNewProj({ ...newProj, endDate: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add description point"
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddDesc()}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              onClick={handleAddDesc}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Add
            </button>
          </div>
          <div className="space-y-1">
            {newProj.description?.map((desc, index) => (
              <p key={index} className="text-sm text-gray-600">• {desc}</p>
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
                setNewProj({
                  name: '',
                  link: '',
                  startDate: '',
                  endDate: '',
                  description: [],
                });
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {projects.map((proj) => (
          <div key={proj.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{proj.name}</h3>
                {proj.link && (
                  <a href={proj.link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    {proj.link}
                  </a>
                )}
                <p className="text-sm text-gray-500">{proj.startDate} - {proj.endDate}</p>
              </div>
              <button
                onClick={() => removeProject(proj.id)}
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
