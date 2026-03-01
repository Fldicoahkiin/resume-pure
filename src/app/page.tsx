import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: 'Resume Pure',
  description: 'Free online resume editor with live preview and PDF export',
};

export default function HomePage() {
  return <HomePageClient />;
}
