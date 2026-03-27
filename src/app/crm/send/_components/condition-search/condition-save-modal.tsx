"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import MyPopup from "@/components/yjg/my-pop-up";
import { useCreateCondition } from "@/hooks/crm/use-create-condition";
import { useQueryClient } from "@tanstack/react-query";
import { useToastHelpers } from "@/components/ui/toast";
import type { TargetConditionsDto } from "@/types/crm/condition-search/condition-management-types";

interface ConditionSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  conditions: TargetConditionsDto;
  onConditionSaved?: (savedConditionId: number) => void;
}

const ConditionSaveModal: React.FC<ConditionSaveModalProps> = ({
  isOpen,
  onClose,
  conditions,
  onConditionSaved,
}) => {
  const toastHelpers = useToastHelpers();
  const queryClient = useQueryClient();
  const [conditionName, setConditionName] = useState<string>("");

  // 조건 생성 mutation
  const createCondition = useCreateCondition({
    onSuccess: (data) => {
      toastHelpers.success("조건이 저장되었습니다.");
      queryClient.invalidateQueries({
        queryKey: ["crm", "conditions"],
      });
      // 저장된 조건 ID를 콜백으로 전달
      onConditionSaved?.(data.id);
      onClose();
      setConditionName("");
    },
    onError: (error) => {
      console.error("조건 생성 실패:", error.message);
      toastHelpers.error("조건 저장에 실패했습니다.");
    },
  });

  // 모달이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (isOpen) {
      setConditionName("");
    }
  }, [isOpen]);

  const handleConditionSave = () => {
    if (!conditionName.trim()) {
      toastHelpers.error("조건명을 입력해주세요.");
      return;
    }

    // 조건 저장 API 호출
    createCondition.mutate({
      name: conditionName,
      conditions: conditions,
    });
  };

  const handleCancel = () => {
    onClose();
    setConditionName("");
  };

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={handleCancel}
      title="조건 저장"
      width="400px"
      height="180px"
    >
      <div className="flex flex-col h-full px-4 py-3">
        {/* 본문 영역 */}
        <div className="flex-1 flex flex-col gap-4">
          {/* 조건명 */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="conditionName"
              className="text-sm text-[var(--gray-100)]"
            >
              조건명
            </Label>
            <Input
              id="conditionName"
              value={conditionName}
              onChange={(e) => setConditionName(e.target.value)}
              className="w-full"
              placeholder="조건명을 입력하세요"
            />
          </div>
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-1)] rounded hover:bg-[var(--bg-hover)] transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConditionSave}
            disabled={createCondition.isPending}
            className="px-6 py-2 text-sm bg-[var(--main-color)] text-white rounded hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {createCondition.isPending ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </MyPopup>
  );
};

export default ConditionSaveModal;
