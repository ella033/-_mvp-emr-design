import { useEffect, useState } from "react";
import {
  MasterDataDetailContainer,
  MasterDataDetailContentContainer,
  MasterDataDetailEmpty,
} from "../../(common)/common-controls";
import { MyButton } from "@/components/yjg/my-button";
import MyInput from "@/components/yjg/my-input";
import { BoxContainer, Box } from "../../(common)/common-controls";
import { MySelect } from "@/components/yjg/my-select";
import { USAGE_CATEGORY_OPTIONS } from "@/constants/common/common-option";
import type { UsageCode } from "@/types/usage-code-types";
import { useUsageCreate } from "@/hooks/usage/use-usage-create";
import { useUsageUpdate } from "@/hooks/usage/use-usage-update";
import { useUsages } from "@/hooks/usage/use-usage";
import { useToastHelpers } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { isTimesEnabled } from "./usage-converter";
import { useUsageDelete } from "@/hooks/usage/use-usage-delete";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";

interface UsageDetailProps {
  selectedUsage: UsageCode | null;
  setSelectedUsage: (usage: UsageCode | null) => void;
}

interface UsageFormData {
  code: string;
  usage: string;
  category: number | null;
  times: number;
}

const initialFormData: UsageFormData = {
  code: "",
  usage: "",
  category: null,
  times: 0,
};

export default function UsageDetail({
  selectedUsage,
  setSelectedUsage,
}: UsageDetailProps) {
  const [isNewMode, setIsNewMode] = useState(false);
  const [formData, setFormData] = useState<UsageFormData>(initialFormData);
  const { data: usages } = useUsages();
  const { success, error } = useToastHelpers();
  const queryClient = useQueryClient();

  const { mutate: createUsage, isPending: isCreating } = useUsageCreate();
  const { mutate: updateUsage, isPending: isUpdating } = useUsageUpdate();
  const { mutate: deleteUsage, isPending: isDeleting } = useUsageDelete();

  const isPending = isCreating || isUpdating || isDeleting;

  // 선택된 용법이 변경되면 폼 데이터 업데이트
  useEffect(() => {
    if (selectedUsage) {
      setFormData({
        code: selectedUsage.code,
        usage: selectedUsage.usage,
        category: selectedUsage.category,
        times: selectedUsage.times,
      });
      setIsNewMode(false);
    }
  }, [selectedUsage]);

  const handleNewRegister = () => {
    setIsNewMode(true);
    setSelectedUsage(null);
    setFormData(initialFormData);
  };

  const handleDelete = () => {
    if (selectedUsage) {
      deleteUsage(selectedUsage.id, {
        onSuccess: () => {
          success("용법이 삭제되었습니다.");
          queryClient.invalidateQueries({ queryKey: ["usages"] });
          setSelectedUsage(null);
          setFormData(initialFormData);
        },
        onError: (err) => {
          error("삭제 실패", err.message);
        },
      });
    }
  };

  const handleCancel = () => {
    if (isNewMode) {
      setIsNewMode(false);
      setFormData(initialFormData);
    } else if (selectedUsage) {
      // 수정 취소 시 원래 데이터로 복원
      setFormData({
        code: selectedUsage.code,
        usage: selectedUsage.usage,
        category: selectedUsage.category,
        times: selectedUsage.times,
      });
    }
  };

  const handleSubmit = () => {
    if (!formData.code.trim()) {
      error("입력 오류", "코드를 입력해주세요.");
      return;
    }

    if (formData.category === null) {
      error("입력 오류", "카테고리를 선택해주세요.");
      return;
    }

    if (!formData.usage.trim()) {
      error("입력 오류", "용법을 입력해주세요.");
      return;
    }

    if (isNewMode) {
      // 새로 생성
      const isCodeExists = usages?.some(
        (usage) => usage.code === formData.code
      );
      if (isCodeExists) {
        error(
          "생성 실패",
          "이미 존재하는 코드입니다. 다른 코드를 입력해주세요."
        );
        return;
      }

      createUsage(
        {
          code: formData.code,
          usage: formData.usage,
          category: formData.category,
          times: formData.times,
        },
        {
          onSuccess: () => {
            success("등록 완료", "용법이 등록되었습니다.");
            setIsNewMode(false);
            setFormData(initialFormData);
            queryClient.invalidateQueries({ queryKey: ["usages"] });
          },
          onError: (err) => {
            error("등록 실패", err.message);
          },
        }
      );
    } else if (selectedUsage) {
      // 수정
      updateUsage(
        {
          id: selectedUsage.id,
          code: formData.code,
          usage: formData.usage,
          category: formData.category,
          times: formData.times,
        },
        {
          onSuccess: () => {
            success("수정 완료", "용법이 수정되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["usages"] });
          },
          onError: (err) => {
            error("수정 실패", err.message);
          },
        }
      );
    }
  };

  // 선택된 용법도 없고 새로작성 모드도 아닌 경우
  if (!selectedUsage && !isNewMode) {
    return (
      <MasterDataDetailContainer>
        <UsageDetailHeader onNewRegister={handleNewRegister} />
        <MasterDataDetailEmpty message="용법을 선택하거나 새로작성 버튼을 클릭하여 입력해주세요." />
      </MasterDataDetailContainer>
    );
  }

  return (
    <MasterDataDetailContainer>
      <UsageDetailHeader onNewRegister={handleNewRegister} />
      <MasterDataDetailContentContainer>
        <BoxContainer>
          <Box title="코드" isRequired>
            <MyInput
              type="text"
              value={formData.code}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, code: value }))
              }
              disabled={isPending}
              maxLength={20}
            />
          </Box>
          <Box title="카테고리" isRequired isWidthFit>
            <MySelect
              options={USAGE_CATEGORY_OPTIONS}
              value={formData.category ?? undefined}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, category: Number(value) }))
              }
              disabled={isPending}
            />
          </Box>
          {formData.category !== null && isTimesEnabled(formData.category) && (
            <Box title="일투" isWidthFit>
              <MyInput
                type="text-number"
                value={formData.times}
                min={0}
                max={99}
                pointPos={0}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, times: Number(value) }))
                }
                disabled={isPending}
                className="w-[3rem]"
              />
            </Box>
          )}
        </BoxContainer>
        <BoxContainer>
          <Box title="용법" isRequired>
            <MyInput
              type="text"
              value={formData.usage}
              maxLength={16}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, usage: value }))
              }
              disabled={isPending}
              placeholder="최대 16글자까지 입력할 수 있습니다."
            />
          </Box>
        </BoxContainer>
      </MasterDataDetailContentContainer>
      <UsageDetailFooter
        isNewMode={isNewMode}
        isPending={isPending}
        onDelete={handleDelete}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </MasterDataDetailContainer>
  );
}

function UsageDetailHeader({ onNewRegister }: { onNewRegister: () => void }) {
  return (
    <div className="flex flex-row justify-between items-center px-2 py-1">
      <div className="text-base font-bold">용법 상세정보</div>
      <div className="flex flex-row gap-4">
        <MyButton className="px-5" onClick={onNewRegister}>
          새로작성
        </MyButton>
      </div>
    </div>
  );
}

function UsageDetailFooter({
  isNewMode,
  isPending,
  onDelete,
  onCancel,
  onSubmit,
}: {
  isNewMode: boolean;
  isPending: boolean;
  onDelete: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  return (
    <div className="flex flex-row justify-between items-center py-3 gap-2">
      <div className="flex flex-row gap-2">
        {!isNewMode && (
          <MyButton
            variant="outline"
            className="px-5"
            onClick={() => setIsDeleteConfirmOpen(true)}
            disabled={isPending}
          >
            삭제
          </MyButton>
        )}
      </div>
      <div className="flex flex-row gap-2">
        <MyButton
          variant="outline"
          className="px-5"
          onClick={onCancel}
          disabled={isPending}
        >
          취소
        </MyButton>
        <MyButton className="px-5" onClick={onSubmit} disabled={isPending}>
          {isNewMode ? "등록" : "수정"}
        </MyButton>
      </div>
      <MyPopupYesNo
        isOpen={isDeleteConfirmOpen}
        onCloseAction={() => setIsDeleteConfirmOpen(false)}
        onConfirmAction={onDelete}
        title=""
        message="선택된 용법을 삭제하시겠습니까?"
        hideHeader={true}
        children={
          <div className="text-sm text-[var(--gray-500)]">
            삭제된 용법은 복구되지 않습니다.
          </div>
        }
      />
    </div>
  );
}
