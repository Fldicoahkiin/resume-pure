import React from 'react';
import { parseInlineMarkdown } from '@/lib/markdown';
import { Link, Text } from './Universal';

const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

function isSafeUrl(url: string | undefined): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url, 'https://placeholder.invalid');
    return SAFE_URL_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

interface MarkdownUniversalProps {
  text: string;
  enableLinks?: boolean;
  primaryColor?: string;
}

export const MarkdownUniversal: React.FC<MarkdownUniversalProps> = ({
  text,
  enableLinks = true,
  primaryColor,
}) => {
  const tokens = parseInlineMarkdown(text);

  return (
    <>
      {tokens.map((token, index) => {
        const key = `${token.type}-${index}`;

        switch (token.type) {
          case 'text':
            return <React.Fragment key={key}>{token.content}</React.Fragment>;

          case 'bold':
            return (
              <Text key={key} inline style={{ fontWeight: 'bold' }}>
                {token.content}
              </Text>
            );

          case 'italic':
            return (
              <Text key={key} inline style={{ fontStyle: 'italic' }}>
                {token.content}
              </Text>
            );

          case 'strike':
            return (
              <Text key={key} inline style={{ textDecoration: 'line-through' }}>
                {token.content}
              </Text>
            );

          case 'code':
            return (
              <Text
                key={key}
                inline
                style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: 4,
                  color: '#1f2937',
                  fontFamily: 'Courier',
                  paddingLeft: 4,
                  paddingRight: 4,
                  paddingTop: 1,
                  paddingBottom: 1,
                }}
              >
                {token.content}
              </Text>
            );

          case 'link':
            if (!enableLinks || !isSafeUrl(token.url)) {
              return (
                <Text key={key} inline>
                  {token.content}
                </Text>
              );
            }

            return (
              <Link
                key={key}
                href={token.url}
                style={{
                  color: primaryColor || '#3b82f6',
                  textDecoration: 'none',
                }}
              >
                {token.content}
              </Link>
            );

          default:
            return null;
        }
      })}
    </>
  );
};
