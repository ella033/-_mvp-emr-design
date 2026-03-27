import React, { useEffect } from 'react';

interface CertificateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  onCheck?: () => void;
  recentCheckDate?: string | null;
  identityOptional?: boolean;
  certificateModalSource?: 'qualification' | 'identity';
}

const CertificateForm: React.FC<CertificateFormProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  onCheck,
  recentCheckDate = "",
  identityOptional = false,
  certificateModalSource = 'qualification'
}) => {
  if (!isOpen) return null;
  const expirationDate = recentCheckDate ? (() => {
    const checkDate = new Date(recentCheckDate);
    const expiration = new Date(checkDate);
    expiration.setMonth(expiration.getMonth() + 6);
    return expiration.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  })() : "";

  // 엔터 키를 누르면 신분증확인 버튼 클릭
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 모달이 닫혔으면 실행하지 않음
      if (!isOpen) return;

      if (event.key === 'Enter' && !event.isComposing) {
        event.preventDefault();
        event.stopPropagation(); // 이벤트 전파 방지

        // 신분증확인 버튼에 해당하는 핸들러 호출
        if (certificateModalSource === 'identity') {
          // 본인확인 버튼을 통해 들어온 경우:
          // - 본인확인예외(identityOptional=true)면 확인 버튼만 존재 -> onCheck 사용(기존 동작 유지)
          // - 그 외에는 "신분증확인"이 핵심 액션 -> onConfirm 실행
          if (identityOptional) {
            if (onCheck && isOpen) onCheck();
          } else {
            if (onConfirm && isOpen) onConfirm();
          }
          return;
        }

        // 자격조회 버튼을 통해 들어온 경우 (일반적인 경우와 본인확인예외 모두)
        if (onConfirm && isOpen) {
          onConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // capture phase에서 처리
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, certificateModalSource, identityOptional, onCheck, onConfirm]);

  return (
    <div className="flex flex-col gap-4 min-w-[300px] min-h-[100px]">
      {/* 메인 패널 */}
      <div className="flex-1 p-4 bg-[var(--bg-1)] border border-[var(--border-1)] rounded-md">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--gray-100)] min-w-[80px]">
              최근확인일
            </span>
            <span className="text-sm text-[var(--text-primary)]">
              {recentCheckDate || "-"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--gray-100)] min-w-[80px]">
              만료일
            </span>
            <span className="text-sm text-[var(--text-primary)]">
              {identityOptional ? "본인확인예외" : expirationDate || "-"}
            </span>
          </div>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex justify-end gap-3">
        {certificateModalSource === 'identity' ? (
          // 본인확인 버튼을 통해 들어온 경우
          identityOptional ? (
            // 본인확인예외인 경우 확인 버튼만 표시
            <button
              type="button"
              onClick={onCheck}
              className="px-6 py-2 text-sm bg-[var(--main-color)] text-white rounded hover:opacity-90 transition-opacity"
            >
              확인
            </button>
          ) : (
            // 본인확인필요인 경우 기존 버튼 유지
            <>
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-1)] rounded hover:bg-[var(--bg-hover)] transition-colors"
              >
                확인안함
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-6 py-2 text-sm bg-[var(--main-color)] text-white rounded hover:opacity-90 transition-opacity"
              >
                신분증확인
              </button>
            </>
          )
        ) : (
          // 자격조회 버튼을 통해 들어온 경우 (기존 로직)
          identityOptional ? (
            // 본인확인예외인 경우 확인 버튼만 표시
            <button
              type="button"
              onClick={onConfirm}
              className="px-6 py-2 text-sm bg-[var(--main-color)] text-white rounded hover:opacity-90 transition-opacity"
            >
              확인
            </button>
          ) : (
            // 일반적인 경우 두 버튼 모두 표시
            <>
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-1)] rounded hover:bg-[var(--bg-hover)] transition-colors"
              >
                확인안함
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-6 py-2 text-sm bg-[var(--main-color)] text-white rounded hover:opacity-90 transition-opacity"
              >
                신분증확인
              </button>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default CertificateForm; 