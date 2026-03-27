'use client';

import type { ReactNode } from 'react';
import { DocumentProvider } from '@/app/document/_contexts/DocumentContext';

export default function PdfPerfTestLayout({ children }: { children: ReactNode }) {
  return <DocumentProvider>{children}</DocumentProvider>;
}
