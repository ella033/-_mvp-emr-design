'use client';

import type { ReactNode } from 'react';

/**
 * print-html-test 전용 레이아웃.
 * 부모 (document-dev)/layout.tsx의 FieldEditor 레이아웃을 오버라이드하여
 * HiddenRenderer / PrintableDocument 측정에 간섭이 없는 깨끗한 환경을 제공합니다.
 */
export default function PrintHtmlTestLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
