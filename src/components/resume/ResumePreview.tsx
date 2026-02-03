'use client';

import { useResumeStore } from '@/store/resumeStore';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import ResumeDocument from './ResumeDocument';
import { Download } from 'lucide-react';

export default function ResumePreview() {
  const { personalInfo, experience, education, skills, projects } = useResumeStore();
  const hasData = personalInfo.name || experience.length > 0 || education.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Preview</h2>
        {hasData && (
          <PDFDownloadLink
            document={<ResumeDocument />}
            fileName="resume.pdf"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {({ loading }) => (
              <>
                <Download size={16} />
                {loading ? 'Generating...' : 'Download PDF'}
              </>
            )}
          </PDFDownloadLink>
        )}
      </div>

      {hasData ? (
        <div className="border rounded-lg overflow-hidden">
          <PDFViewer width="100%" height="600" className="border-0">
            <ResumeDocument />
          </PDFViewer>
        </div>
      ) : (
        <div className="border rounded text-center text-gray-lg p-8-500">
          <p>Start filling in your information to see the preview</p>
        </div>
      )}
    </div>
  );
}
