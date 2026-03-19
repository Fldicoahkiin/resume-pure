import React from 'react';
import { parseInlineMarkdown } from '@/lib/markdown';

const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:'];

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'https://placeholder.invalid');
    return SAFE_URL_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export const MarkdownWeb: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const tokens = parseInlineMarkdown(text);
  
  return (
    <span className={className}>
      {tokens.map((token, i) => {
        const key = `${token.type}-${i}`;
        switch (token.type) {
          case 'text': return <React.Fragment key={key}>{token.content}</React.Fragment>;
          case 'bold': return <strong key={key} className="font-semibold">{token.content}</strong>;
          case 'italic': return <em key={key} className="italic">{token.content}</em>;
          case 'strike': return <del key={key} className="line-through">{token.content}</del>;
          case 'code': return (
            <code key={key} className="mx-0.5 px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded font-mono text-[0.9em] text-gray-800 dark:text-gray-200">
              {token.content}
            </code>
          );
          case 'link': {
            if (!isSafeUrl(token.url)) {
              return <span key={key}>{token.content}</span>;
            }
            return (
              <a 
                key={key} 
                href={token.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="underline hover:text-blue-600 decoration-gray-300 dark:decoration-gray-600 underline-offset-2"
                onClick={(event) => event.stopPropagation()}
              >
                {token.content}
              </a>
            );
          }
          default: return null;
        }
      })}
    </span>
  );
};
