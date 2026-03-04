import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: 'Resume Pure',
  description: 'Local-first resume editor with live preview, raw JSON/YAML editing, and free multi-format export',
};

export default function HomePage() {
  return <HomePageClient />;
}
