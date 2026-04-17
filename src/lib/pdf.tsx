import React from 'react';
import { Document, Page, StyleSheet } from '@react-pdf/renderer';
import { ResumeData, PDFTranslations } from '@/types';
import { ResumeLayout, ResumeSelectableBlockProps } from '@/components/resume/ResumeLayout';
import { PdfContext, View } from '@/components/core/Universal';
import { getPDFFontFamily, registerCJKHyphenation } from '@/lib/pdfFonts';

registerCJKHyphenation();
import { getPaperPointSize } from '@/lib/paper';
import { toDataUrl, TRANSPARENT_PX } from '@/lib/image';

const defaultTranslations: PDFTranslations = {
  summary: '个人简介',
  experience: '工作经历',
  education: '教育背景',
  projects: '项目经验',
  skills: '技能专长',
  technologies: '技术栈',
  contributions: '贡献记录',
  present: '至今',
  customSection: '自定义模块',
  skillLevel: {
    core: '核心',
    proficient: '熟练',
    familiar: '了解',
  },
};

const PdfSelectableBlock = ({ children, className, style }: ResumeSelectableBlockProps) => (
  <View className={className} style={style}>
    {children}
  </View>
);

interface ResumePDFDocumentProps {
  data: ResumeData;
  translations: PDFTranslations;
}

interface SavePickerWritable {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
}

interface SavePickerFileHandle {
  createWritable: () => Promise<SavePickerWritable>;
}

interface WindowWithSavePicker extends Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: Array<{
      description: string;
      accept: Record<string, string[]>;
    }>;
  }) => Promise<SavePickerFileHandle>;
}

type ImageField = 'repoAvatarUrl' | 'customLogo' | 'logo';
type ImageCarrier = Partial<Record<ImageField, string>>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function collectPdfImageTargets(
  value: unknown,
  targets: Array<{ carrier: ImageCarrier; key: ImageField }>
): void {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectPdfImageTargets(entry, targets));
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  (['repoAvatarUrl', 'customLogo', 'logo'] as const).forEach((key) => {
    const nextValue = value[key];
    if (typeof nextValue === 'string' && nextValue.length > 0) {
      targets.push({ carrier: value as ImageCarrier, key });
    }
  });

  Object.values(value).forEach((entry) => {
    if (Array.isArray(entry) || isRecord(entry)) {
      collectPdfImageTargets(entry, targets);
    }
  });
}

// PDF 文档组件
const ResumePDFDocument: React.FC<ResumePDFDocumentProps> = ({ data, translations }) => {
  const theme = data.theme;
  const fontFamily = getPDFFontFamily(theme.fontFamily);
  const paperPointSize = getPaperPointSize(theme.paperSize);

  const styles = StyleSheet.create({
    page: {
      fontSize: theme.fontSize,
      fontFamily,
      backgroundColor: '#ffffff',
    },
  });

  return (
    <Document>
      <Page size={paperPointSize} style={styles.page}>
        <PdfContext.Provider value={{ isPdf: true }}>
          <ResumeLayout
            data={data}
            translations={translations}
            SelectableBlock={PdfSelectableBlock}
          />
        </PdfContext.Provider>
      </Page>
    </Document>
  );
};

export async function exportToPDF(
  data: ResumeData,
  filename: string = 'resume.pdf',
  translations: PDFTranslations = defaultTranslations
): Promise<void> {
  try {
    let fileHandle: SavePickerFileHandle | null = null;
    const pickerWindow = window as WindowWithSavePicker;

    if (typeof pickerWindow.showSaveFilePicker === 'function') {
      try {
        fileHandle = await pickerWindow.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'PDF Document',
              accept: { 'application/pdf': ['.pdf'] },
            },
          ],
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        console.warn('showSaveFilePicker failed, falling back to blob download', error);
      }
    }

    // 预转换头像 URL 为 data URL，避免 react-pdf 的 CORS 问题
    const processedData = JSON.parse(JSON.stringify(data)) as ResumeData;
    const imageTargets: Array<{ carrier: ImageCarrier; key: ImageField }> = [];
    collectPdfImageTargets(processedData.projects, imageTargets);
    collectPdfImageTargets(processedData.customSections, imageTargets);
    collectPdfImageTargets(processedData.skills, imageTargets);

    await Promise.all(
      imageTargets.map(async ({ carrier, key }) => {
        const url = carrier[key];
        if (url && !url.startsWith('data:')) {
          try {
            const dataUrl = await toDataUrl(url);
            if (dataUrl === TRANSPARENT_PX) {
              carrier[key] = '';
            } else {
              carrier[key] = dataUrl;
            }
          } catch {
            carrier[key] = '';
          }
        }
      })
    );

    const { pdf } = await import('@react-pdf/renderer');

    const blob = await pdf(<ResumePDFDocument data={processedData} translations={translations} />).toBlob();

    if (fileHandle) {
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    } else {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  } catch (error) {
    console.error('PDF 导出失败:', error);
    throw new Error('PDF export failed');
  }
}
