import type { Metadata } from 'next';
import PrintPageClient from './PrintPageClient';

export const metadata: Metadata = {
  title: 'Resume Print - Resume Pure',
  description: 'Unified browser-rendered export surface for PDF and PNG',
};

export default function PrintPage() {
  return <PrintPageClient />;
}
