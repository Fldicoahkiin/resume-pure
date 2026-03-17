export interface MarkdownASTNode {
  type: 'text' | 'link';
  content: string;
  url?: string;
}

export function parseMarkdownLinks(text: string): MarkdownASTNode[] {
  if (!text) return [];
  
  // 匹配形式 [显示文本](URL)
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const result: MarkdownASTNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    result.push({ type: 'link', content: match[1], url: match[2] });
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    result.push({ type: 'text', content: text.substring(lastIndex) });
  }
  
  return result;
}
