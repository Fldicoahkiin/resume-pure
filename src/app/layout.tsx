import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ThemeProvider } from '@teispace/next-themes';
import './globals.css';
import { I18nProvider } from '@/i18n/I18nProvider';
import { DocumentTitle } from '@/components/DocumentTitle';

const assetBasePath = process.env.GITHUB_PAGES ? '/resume-pure' : '';

export const metadata: Metadata = {
  title: 'Resume Pure',
  description: 'Free online resume editor with live preview and PDF export',
  manifest: `${assetBasePath}/manifest.json`,
  icons: {
    icon: `${assetBasePath}/icon.svg`,
    shortcut: `${assetBasePath}/icon.svg`,
    apple: `${assetBasePath}/icon-192.png`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Resume Pure',
  },
};

export const viewport: Viewport = {
  themeColor: '#1f2937',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href={`${assetBasePath}/preview-fonts.css`} />
        <link rel="icon" href={`${assetBasePath}/icon.svg`} type="image/svg+xml" />
        <link rel="shortcut icon" href={`${assetBasePath}/icon.svg`} type="image/svg+xml" />
        <link rel="apple-touch-icon" href={`${assetBasePath}/icon-192.png`} />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          storage="local"
          transition={{
            type: 'circular',
            origin: 'cursor',
            duration: 500,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <I18nProvider>
            <DocumentTitle />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
