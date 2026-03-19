export type InlineToken = 
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'strike'; content: string }
  | { type: 'code'; content: string }
  | { type: 'link'; content: string; url: string };

/**
 * 轻量级内联 Markdown 解析器：
 * 仅按顺序匹配行内代码、超链接、加粗、删除线、斜体。不支持层级嵌套。
 */
export function parseInlineMarkdown(text: string): InlineToken[] {
  if (!text) return [];
  
  // Regex 说明：
  // 1. `[^`]+`           -> 匹配带反引号的行内代码（最高优先级避免匹配内部符号）
  // 2. \[[^\]]+\]\([^)]+\) -> 匹配超链接 [xxx](yyy)
  // 3. \*\*.*?\*\*|__.*?__ -> 匹配加粗 **xxx** 或 __xxx__
  // 4. ~~.*?~~             -> 匹配删除线 ~~xxx~~
  // 5. \*[^*]+\*|_[^_]+_   -> 匹配斜体 *xxx* 或 _xxx_
  const regex = /(`[^`]+`|\[[^\]]+\]\([^)]+\)|\*\*.*?\*\*|__.*?__|~~.*?~~|\*[^*]+\*|_[^_]+_)/g;
  
  const tokens: InlineToken[] = [];
  let lastIndex = 0;
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    
    const matchedStr = match[0];
    if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      tokens.push({ type: 'code', content: matchedStr.slice(1, -1) });
    } else if (matchedStr.startsWith('[') && matchedStr.includes('](') && matchedStr.endsWith(')')) {
      const closeBracketIdx = matchedStr.indexOf(']');
      const content = matchedStr.slice(1, closeBracketIdx);
      const url = matchedStr.slice(closeBracketIdx + 2, -1);
      tokens.push({ type: 'link', content, url });
    } else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      tokens.push({ type: 'bold', content: matchedStr.slice(2, -2) });
    } else if (matchedStr.startsWith('__') && matchedStr.endsWith('__')) {
      tokens.push({ type: 'bold', content: matchedStr.slice(2, -2) });
    } else if (matchedStr.startsWith('~~') && matchedStr.endsWith('~~')) {
      tokens.push({ type: 'strike', content: matchedStr.slice(2, -2) });
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      tokens.push({ type: 'italic', content: matchedStr.slice(1, -1) });
    } else if (matchedStr.startsWith('_') && matchedStr.endsWith('_')) {
      tokens.push({ type: 'italic', content: matchedStr.slice(1, -1) });
    }
    
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', content: text.slice(lastIndex) });
  }
  
  return tokens;
}

