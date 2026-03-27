'use client';

import { usePathname } from 'next/navigation';
import FieldEditorHeader from './_components/FieldEditorHeader';
import FieldEditorSidebar from './_components/FieldEditorSidebar';
import FieldEditorDetailPanel from './_components/FieldEditorDetailPanel';
import { FieldEditorProvider } from './_contexts/FieldEditorContext';

function DocumentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSimplePage =
    pathname?.includes('/field-render') ||
    pathname?.includes('/print-html-test') ||
    pathname?.includes('/pdf-perf-test') ||
    pathname?.includes('/print-benchmark');

  // 단순 레이아웃 페이지 (GNB, LNB, RNB 없음)
  if (isSimplePage) {
    return (
      <div className="w-full h-screen bg-gray-100">
        {children}
      </div>
    );
  }

  // 편집 페이지는 전체 레이아웃 제공
  return (
    <FieldEditorProvider>
      <div className="w-full h-full flex flex-col bg-gray-100">
        {/* GNB: 상단 네비게이션 */}
        <FieldEditorHeader />

        {/* 하단 영역: LNB + 작업공간 + RNB */}
        <div className="flex-1 flex min-h-0">
          {/* LNB: 왼쪽 네비게이션 (데이터 리스트) */}
          <FieldEditorSidebar />

          {/* 작업공간: 가운데 (PDF 뷰어 + Konva 오버레이) */}
          <div id="document-workspace" className="flex flex-1 overflow-auto bg-gray-100 m-5">
            {children}
          </div>

          {/* RNB: 오른쪽 네비게이션 (상세정보) */}
          <FieldEditorDetailPanel />
        </div>
      </div>
    </FieldEditorProvider>
  );
}

export default DocumentLayout;
