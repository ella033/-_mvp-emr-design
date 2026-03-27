'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { useDocumentContext } from '../_contexts/DocumentContext';

export function DocumentFormDirtyConfirmDialog() {
  const { pendingChange, confirmPendingChange, cancelPendingChange, formDirtyRef, setPendingChange } =
    useDocumentContext();
  const pathname = usePathname();
  const currentPathnameRef = useRef(pathname);

  const isOpen = pendingChange !== null;

  // 브라우저 닫기/새로고침 시 경고
  useEffect(function setupBeforeUnloadHandler() {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      const isDirty = formDirtyRef.current?.() ?? false;
      if (!isDirty) return;

      // 표준 방식으로 브라우저 기본 확인창 표시
      event.preventDefault();
      // 구형 브라우저 호환성
      event.returnValue = '저장되지 않은 변경사항이 있습니다. 정말 떠나시겠습니까?';
      return event.returnValue;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    return function cleanupBeforeUnloadHandler() {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formDirtyRef]);

  // 전역 링크 클릭 가로채기 (캡처 단계에서)
  useEffect(function setupLinkClickInterceptor() {
    function handleLinkClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // 외부 링크, 해시 링크, 같은 document 페이지 내 이동은 제외
      const isExternalLink = href.startsWith('http') || href.startsWith('//');
      const isHashLink = href.startsWith('#');
      const isSameDocumentPage = href.startsWith('/document');

      if (isExternalLink || isHashLink || isSameDocumentPage) return;

      const isDirty = formDirtyRef.current?.() ?? false;
      if (!isDirty) return;

      // dirty 상태에서 다른 페이지로 이동 시도 - 기본 동작 막고 확인 다이얼로그 표시
      event.preventDefault();
      event.stopPropagation();
      setPendingChange({ type: 'navigation', url: href });
    }

    // 캡처 단계에서 이벤트 가로채기
    document.addEventListener('click', handleLinkClick, true);

    return function cleanupLinkClickInterceptor() {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [formDirtyRef, setPendingChange]);

  // 뒤로가기/앞으로가기 가드
  useEffect(function setupPopStateGuard() {
    const originalPushState = window.history.pushState.bind(window.history);

    function handlePopState() {
      const isDirty = formDirtyRef.current?.() ?? false;
      if (!isDirty) return;

      // dirty 상태에서 뒤로가기 시도 시 현재 상태로 복원하고 확인 다이얼로그 표시
      const targetUrl = window.location.pathname + window.location.search;

      // 현재 위치로 다시 푸시하여 뒤로가기 취소
      originalPushState(null, '', currentPathnameRef.current);

      // 확인 다이얼로그 표시
      setPendingChange({ type: 'navigation', url: targetUrl });
    }

    window.addEventListener('popstate', handlePopState);

    return function cleanupPopStateGuard() {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [formDirtyRef, setPendingChange]);

  // 현재 pathname 추적
  useEffect(function trackCurrentPathname() {
    currentPathnameRef.current = pathname;
  }, [pathname]);

  function handleConfirm() {
    confirmPendingChange();
  }

  function handleCancel() {
    cancelPendingChange();
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>작성 중인 내용이 있습니다</AlertDialogTitle>
          <AlertDialogDescription>
            저장되지 않은 변경사항이 있습니다. 계속하면 작성 중인 내용이 삭제됩니다.
            <br />
            정말 변경하시겠습니까?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

