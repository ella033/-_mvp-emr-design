import React, { useEffect, useRef, useState } from 'react';
import { useClear } from '@/contexts/ClearContext';
import { useComponentState } from '@/hooks/common/use-component-state';
import { useChronicInfoReception } from '@/hooks/reception/patient-info/use-chronic-info-reception';
import { Input } from '@/components/ui/input';
import type { Reception } from '@/types/common/reception-types';

interface ChronicInfoProps {
  /** 외부에서 주입할 reception 객체 (우선 사용) */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  isDisabled?: boolean;
  /** Reception 업데이트 콜백 (외부 receptionId가 있을 때 사용) */
  onUpdateReception?: (updates: Partial<Reception>) => void;
}

const ChronicInfo: React.FC<ChronicInfoProps> = ({
  reception: externalReception,
  receptionId: externalReceptionId,
  isDisabled = false,
  onUpdateReception,
}) => {
  // Hook을 통해 reception 선택 및 관리
  const {
    selectedReception: currentReception,
    activeReceptionId,
    updateChronicFlags,
    clearChronicInfo,
    markChangedOnce,
  } = useChronicInfoReception({
    reception: externalReception,
    receptionId: externalReceptionId,
    onUpdateReception,
  });

  // Local states
  const [localHypertension, setLocalHypertension] = useState<boolean>(false);
  const [localDiabetes, setLocalDiabetes] = useState<boolean>(false);
  const [localHighCholesterol, setLocalHighCholesterol] = useState<boolean>(false);

  // 초기값 refs (Dirty 감지용)
  const initialHypertensionRef = useRef<boolean>(false);
  const initialDiabetesRef = useRef<boolean>(false);
  const initialHighCholesterolRef = useRef<boolean>(false);

  // Local state 동기화 (props reception 우선) + 초기값 저장
  useEffect(() => {
    const hypertension = currentReception?.patientStatus?.chronicFlags?.hypertension || false;
    setLocalHypertension(hypertension);
    initialHypertensionRef.current = hypertension;
  }, [currentReception?.patientStatus?.chronicFlags?.hypertension]);

  useEffect(() => {
    const diabetes = currentReception?.patientStatus?.chronicFlags?.diabetes || false;
    setLocalDiabetes(diabetes);
    initialDiabetesRef.current = diabetes;
  }, [currentReception?.patientStatus?.chronicFlags?.diabetes]);

  useEffect(() => {
    const highCholesterol = currentReception?.patientStatus?.chronicFlags?.highCholesterol || false;
    setLocalHighCholesterol(highCholesterol);
    initialHighCholesterolRef.current = highCholesterol;
  }, [currentReception?.patientStatus?.chronicFlags?.highCholesterol]);

  // Clear Context 등록
  const { registerMyClear, unregisterMyClear } = useClear('chronic-info');

  // Component State 관리
  const { getContainerProps } = useComponentState();

  // Clear 함수 등록/해제
  useEffect(() => {
    registerMyClear(clearChronicInfo);
    return () => {
      unregisterMyClear();
    };
  }, [registerMyClear, unregisterMyClear, clearChronicInfo]);

  return (
    <div className="flex flex-col w-full">
      {/* 만성질환 체크박스 */}
      <div {...getContainerProps('flex flex-row flex-wrap gap-2 items-center p-2')}>
        <span className="text-md font-bold text-[var(--gray-100)] whitespace-nowrap pr-2">
          만성질환
        </span>
        <div className="flex flex-row gap-2">
          <label className="flex flex-row gap-1 text-sm text-[var(--gray-100)]">
            <Input
              type="checkbox"
              checked={localHypertension}
              onFocus={(e) => {
                e.target.setAttribute('data-previous-value', String(localHypertension));
              }}
              onChange={(e) => {
                // 포커스 상태에서만 값 변경 허용
                if (document.activeElement === e.target) {
                  const value = e.target.checked;
                  setLocalHypertension(value);
                  // 변경 감지: 한 번만 markReceptionAsChanged 호출
                  markChangedOnce();
                }
              }}
              onBlur={(e) => {
                // 최종 저장: 초기값과 다르면 updateOpenedReception 호출
                const currentValue = e.target.checked;
                if (currentValue !== initialHypertensionRef.current && currentReception) {
                  updateChronicFlags({
                    ...currentReception.patientStatus.chronicFlags,
                    hypertension: currentValue
                  });
                }
              }}
              disabled={isDisabled}
            />
            고혈압
          </label>
          <label className="flex flex-row gap-1 text-sm text-[var(--gray-100)]">
            <Input
              type="checkbox"
              checked={localDiabetes}
              onFocus={(e) => {
                e.target.setAttribute('data-previous-value', String(localDiabetes));
              }}
              onChange={(e) => {
                // 포커스 상태에서만 값 변경 허용
                if (document.activeElement === e.target) {
                  const value = e.target.checked;
                  setLocalDiabetes(value);
                  // 변경 감지: 한 번만 markReceptionAsChanged 호출
                  markChangedOnce();
                }
              }}
              onBlur={(e) => {
                // 최종 저장: 초기값과 다르면 updateOpenedReception 호출
                const currentValue = e.target.checked;
                if (currentValue !== initialDiabetesRef.current && currentReception) {
                  updateChronicFlags({
                    ...currentReception.patientStatus.chronicFlags,
                    diabetes: currentValue
                  });
                }
              }}
              disabled={isDisabled}
            />
            당뇨
          </label>
          <label className="flex flex-row gap-1 text-sm text-[var(--gray-100)]">
            <Input
              type="checkbox"
              checked={localHighCholesterol}
              onFocus={(e) => {
                e.target.setAttribute('data-previous-value', String(localHighCholesterol));
              }}
              onChange={(e) => {
                // 포커스 상태에서만 값 변경 허용
                if (document.activeElement === e.target) {
                  const value = e.target.checked;
                  setLocalHighCholesterol(value);
                  // 변경 감지: 한 번만 markReceptionAsChanged 호출
                  markChangedOnce();
                }
              }}
              onBlur={(e) => {
                // 최종 저장: 초기값과 다르면 updateOpenedReception 호출
                const currentValue = e.target.checked;
                if (currentValue !== initialHighCholesterolRef.current && currentReception) {
                  updateChronicFlags({
                    ...currentReception.patientStatus.chronicFlags,
                    highCholesterol: currentValue
                  });
                }
              }}
              disabled={isDisabled}
            />
            이상지질혈증
          </label>
        </div>
      </div>
    </div>
  );
};

export default ChronicInfo;
