'use client';

import { useResumeStore } from '@/store/resumeStore';
import { useUIStore } from '@/store/uiStore';
import PersonalInfoForm from '@/components/builder/PersonalInfoForm';
import ExperienceForm from '@/components/builder/ExperienceForm';
import EducationForm from '@/components/builder/EducationForm';
import SkillsForm from '@/components/builder/SkillsForm';
import ProjectsForm from '@/components/builder/ProjectsForm';
import ResumePreview from '@/components/resume/ResumePreview';

const sections = [
  { id: 'personal', label: 'Personal Info' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
];

export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { activeSection, setActiveSection } = useUIStore();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b p-4">
        <h1 className="text-xl font-bold">Resume Builder</h1>
      </header>
      <div className="flex-1 flex">
        <aside className="w-64 bg-gray-100 border-r p-4">
          <nav className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-2 rounded ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-200'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          {activeSection === 'personal' && <PersonalInfoForm />}
          {activeSection === 'experience' && <ExperienceForm />}
          {activeSection === 'education' && <EducationForm />}
          {activeSection === 'skills' && <SkillsForm />}
          {activeSection === 'projects' && <ProjectsForm />}
        </main>
        <aside className="w-1/2 bg-gray-50 border-l p-4 overflow-auto">
          <ResumePreview />
        </aside>
      </div>
    </div>
  );
}
