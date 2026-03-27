import React, { useState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import AddDisregModal from "./add-disreg-modal";
import { getExtraQualificationStrListFromExtraQualification } from "@/lib/nhic-form-utils";
import {
  STRING_DATA_FIELD_KEYS,
  SPECIAL_TYPE_FIELD_KEYS,
  DISEASE_REGISTRATION_KEYS,
} from "@/constants/common/additional-qualification-options";

interface AddDisregProps {
  currentInsuranceInfo?: Partial<InsuranceInfo>;
  /** 변경된 extraQualification 객체를 부모로 전달 */
  onDisregChange?: (extraQualification: Record<string, any>) => void;
  isDisabled?: boolean;
}

interface DisregItem {
  id: string;
  value: string;
}

const AddDisreg: React.FC<AddDisregProps> = ({
  currentInsuranceInfo,
  onDisregChange,
  isDisabled = false,
}) => {
  // extraQualification을 기반으로 초기 데이터 설정
  const [disregItems, setDisregItems] = useState<DisregItem[]>(() => {
    if (currentInsuranceInfo?.extraQualification) {
      const extraQualificationStrList = getExtraQualificationStrListFromExtraQualification(
        currentInsuranceInfo.extraQualification
      );
      if (extraQualificationStrList.length > 0) {
        return extraQualificationStrList.map((item: string, index: number) => ({
          id: `disreg-${index}`,
          value: item
        }));
      }
    }
    return [];
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // currentInsuranceInfo가 변경될 때 disregItems 업데이트
  // extraQualification을 JSON.stringify로 직렬화하여 변경 감지 개선
  const extraQualificationStr = JSON.stringify(currentInsuranceInfo?.extraQualification);

  useEffect(() => {
    // currentInsuranceInfo가 null이거나 undefined인 경우 완전 초기화
    if (!currentInsuranceInfo) {
      setDisregItems([]);
      return;
    }

    // extraQualification이 있으면 사용
    if (currentInsuranceInfo.extraQualification) {
      const extraQualificationStrList = getExtraQualificationStrListFromExtraQualification(
        currentInsuranceInfo.extraQualification
      );

      if (extraQualificationStrList.length > 0) {
        const newItems = extraQualificationStrList.map((item: string, index: number) => ({
          id: `disreg-${index}`,
          value: item
        }));
        setDisregItems(newItems);
      } else {
        setDisregItems([]);
      }
    } else {
      setDisregItems([]);
    }
  }, [currentInsuranceInfo, extraQualificationStr]);

  // 중복 호출 방지
  const isSavingRef = useRef(false);

  // 모달에서 저장된 항목들 처리
  const handleModalSave = (extraQualification: Record<string, any>) => {
    // 중복 호출 방지
    if (isSavingRef.current) {
      return;
    }
    isSavingRef.current = true;
    // extraQualification에서 표시용 라벨 목록 생성
    const extraQualificationStrList = getExtraQualificationStrListFromExtraQualification(extraQualification);
    const newItems = extraQualificationStrList.map((item: string, index: number) => ({
      id: `disreg-${index}`,
      value: item
    }));

    setDisregItems(newItems);

    // 기존 extraQualification은 props에서 가져옴
    const existingExtraQualification =
      currentInsuranceInfo?.extraQualification || {};

    // 모든 추가자격사항 필드
    const allAdditionalQualificationKeys = new Set([
      ...DISEASE_REGISTRATION_KEYS,
      ...STRING_DATA_FIELD_KEYS,
      ...SPECIAL_TYPE_FIELD_KEYS,
    ]);

    // 새로운 extraQualification 생성
    // 1. 기존 extraQualification의 모든 필드를 복사
    const newExtraQualification: Record<string, any> = {
      ...existingExtraQualification,
    };

    // 2. 모달에서 저장된 extraQualification 처리
    // - 추가/변경된 필드는 그대로 반영
    Object.keys(extraQualification).forEach((key) => {
      if (allAdditionalQualificationKeys.has(key)) {
        // 모달에서 저장된 필드는 그대로 반영
        newExtraQualification[key] = extraQualification[key];
      }
    });

    // 3. 기존에 있던 필드 중 모달에서 제거된 필드 처리
    // (모달에서 체크 해제된 필드들은 extraQualification에 포함되지 않음)
    Object.keys(existingExtraQualification).forEach((key) => {
      if (allAdditionalQualificationKeys.has(key)) {
        // 모달에서 저장된 extraQualification에 해당 키가 없으면 삭제된 것으로 간주
        if (!(key in extraQualification)) {
          // 필드 타입에 따라 삭제 처리
          if (SPECIAL_TYPE_FIELD_KEYS.has(key)) {
            newExtraQualification[key] = {};
          } else if (DISEASE_REGISTRATION_KEYS.has(key)) {
            newExtraQualification[key] = {};
          } else if (STRING_DATA_FIELD_KEYS.has(key)) {
            delete newExtraQualification[key];
          }
        }
      }
    });

    // 저장 완료 후 플래그 해제
    setTimeout(() => {
      isSavingRef.current = false;
    }, 100);

    // 부모 컴포넌트에 변경된 extraQualification 전달
    onDisregChange?.(newExtraQualification);
  };

  // 추가 버튼 클릭 - 모달 열기
  const handleAddButtonClick = () => {
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between flex-shrink-0">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          추가자격
        </label>
        <button
          type="button"
          onClick={handleAddButtonClick}
          disabled={isDisabled}
          className={`flex items-center gap-1 px-2 text-xs rounded ${isDisabled
            ? 'text-gray-400 cursor-default'
            : 'text-[var(--main-color)] hover:bg-blue-50 cursor-pointer'
            }`}
        >
          <Plus className="w-3 h-3" />
          추가
        </button>
      </div>

      {/* 데이터 표시 영역 */}
      <div className="flex-1 min-h-0 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800">
        <div className="p-1.5">
          {/* 기존 추가자격 항목들 */}
          {disregItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-1 px-2 group"
            >
              <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">
                {item.value}
              </span>
            </div>
          ))}

          {/* 빈 상태 메시지 */}
          {disregItems.length === 0 && (
            <div className="text-center py-2 text-gray-500 dark:text-gray-400 text-sm">
              추가자격 정보 없음
              <br />
            </div>
          )}
        </div>
      </div>

      {/* 추가자격사항 모달 */}
      <AddDisregModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        extraQualification={currentInsuranceInfo?.extraQualification}
        isDisabled={isDisabled}
      />
    </div>
  );
};

export default AddDisreg;
