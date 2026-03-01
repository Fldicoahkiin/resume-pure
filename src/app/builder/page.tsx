import type { Metadata } from 'next';
import BuilderPageClient from './BuilderPageClient';

export const metadata: Metadata = {
  title: 'Resume Builder - Resume Pure',
  description: 'Edit resume with form or raw JSON/YAML and export to PDF/PNG',
};

export default function BuilderPage() {
  return <BuilderPageClient />;
}
