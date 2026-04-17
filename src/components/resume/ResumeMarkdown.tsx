import { MarkdownUniversal } from '@/components/core/MarkdownUniversal';
import type { ResumeData } from '@/types';

interface ResumeMarkdownProps {
  text: string;
  theme: ResumeData['theme'];
  enableLinks: boolean;
}

export function ResumeMarkdown({ text, theme, enableLinks }: ResumeMarkdownProps) {
  return (
    <MarkdownUniversal
      text={text}
      enableLinks={enableLinks}
      primaryColor={theme.primaryColor}
    />
  );
}
