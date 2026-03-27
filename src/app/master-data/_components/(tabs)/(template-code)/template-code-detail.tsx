import { useEffect, useState } from "react";
import {
  MasterDataDetailContainer,
  MasterDataDetailContentContainer,
  MasterDataDetailEmpty,
} from "../../(common)/common-controls";
import { MyButton } from "@/components/yjg/my-button";
import { BoxContainer, Box } from "../../(common)/common-controls";
import type { TemplateCode } from "@/types/template-code-types";
import { useTemplateCodeCreate } from "@/hooks/template-code/use-template-code-create";
import { useTemplateCodeUpdate } from "@/hooks/template-code/use-template-code-update";
import { useTemplateCodes } from "@/hooks/template-code/use-template-code";
import { useToastHelpers } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTemplateCodeDelete } from "@/hooks/template-code/use-template-code-delete";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { TemplateCodeType } from "@/constants/common/common-enum";
import { TEMPLATE_CODE_TYPE_OPTIONS } from "@/constants/common/common-option";
import MyCheckbox from "@/components/yjg/my-checkbox";
import MyTiptapEditor from "@/components/yjg/my-tiptap-editor/my-tiptap-editor";
import {
  INPUT_COMMON_CLASS,
  INPUT_FOCUS_CLASS,
  SEARCH_INPUT_CLASS,
} from "@/components/yjg/common/constant/class-constants";
import { cn } from "@/lib/utils";

interface TemplateCodeDetailProps {
  selectedTemplateCode: TemplateCode | null;
  setSelectedTemplateCode: (templateCode: TemplateCode | null) => void;
}

interface TemplateCodeFormData {
  code: string;
  content: string;
  isQuickMenu: boolean;
  type: TemplateCodeType[];
}

const initialFormData: TemplateCodeFormData = {
  code: "",
  content: "",
  isQuickMenu: false,
  type: [],
};

export default function TemplateCodeDetail({
  selectedTemplateCode,
  setSelectedTemplateCode,
}: TemplateCodeDetailProps) {
  const [isNewMode, setIsNewMode] = useState(false);
  const [formData, setFormData] =
    useState<TemplateCodeFormData>(initialFormData);
  const { data: templateCodes } = useTemplateCodes();
  const { success, error } = useToastHelpers();
  const queryClient = useQueryClient();

  const { mutate: createTemplateCode, isPending: isCreating } =
    useTemplateCodeCreate();
  const { mutate: updateTemplateCode, isPending: isUpdating } =
    useTemplateCodeUpdate();
  const { mutate: deleteTemplateCode, isPending: isDeleting } =
    useTemplateCodeDelete();

  const isPending = isCreating || isUpdating || isDeleting;

  // 선택된 상용구가 변경되면 폼 데이터 업데이트
  useEffect(() => {
    if (selectedTemplateCode) {
      setFormData({
        code: selectedTemplateCode.code,
        content: selectedTemplateCode.content,
        isQuickMenu: selectedTemplateCode.isQuickMenu,
        type: selectedTemplateCode.type,
      });
      setIsNewMode(false);
    }
  }, [selectedTemplateCode]);

  const handleNewRegister = () => {
    setIsNewMode(true);
    setSelectedTemplateCode(null);
    setFormData(initialFormData);
  };

  const handleDelete = () => {
    if (selectedTemplateCode) {
      deleteTemplateCode(selectedTemplateCode.id, {
        onSuccess: () => {
          success("상용구가 삭제되었습니다.");
          queryClient.invalidateQueries({ queryKey: ["template-codes"] });
          setSelectedTemplateCode(null);
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
    } else if (selectedTemplateCode) {
      // 수정 취소 시 원래 데이터로 복원
      setFormData({
        code: selectedTemplateCode.code,
        content: selectedTemplateCode.content,
        isQuickMenu: selectedTemplateCode.isQuickMenu,
        type: selectedTemplateCode.type,
      });
    }
  };

  const handleTypeToggle = (type: TemplateCodeType) => {
    setFormData((prev) => {
      const isSelected = prev.type.includes(type);
      if (isSelected) {
        return { ...prev, type: prev.type.filter((t) => t !== type) };
      } else {
        return { ...prev, type: [...prev.type, type] };
      }
    });
  };

  const handleSubmit = () => {
    if (!formData.code.trim()) {
      error("입력 오류", "코드를 입력해주세요.");
      return;
    }

    if (!formData.content.trim()) {
      error("입력 오류", "내용을 입력해주세요.");
      return;
    }

    // "전체" 제외 후 비어있으면 "전체"로 설정 (불변성 유지)
    const filteredType = formData.type.filter(
      (t) => t !== TemplateCodeType.전체
    );
    const typeToSubmit: TemplateCodeType[] =
      filteredType.length > 0 ? filteredType : [TemplateCodeType.전체];

    if (isNewMode) {
      // 새로 생성
      const isCodeExists = templateCodes?.some(
        (tc) => tc.code === formData.code
      );
      if (isCodeExists) {
        error(
          "생성 실패",
          "이미 존재하는 코드입니다. 다른 코드를 입력해주세요."
        );
        return;
      }

      createTemplateCode(
        {
          code: formData.code,
          content: formData.content,
          isQuickMenu: formData.isQuickMenu,
          type: typeToSubmit,
        },
        {
          onSuccess: () => {
            success("등록 완료", "상용구가 등록되었습니다.");
            setIsNewMode(false);
            setFormData(initialFormData);
            queryClient.invalidateQueries({ queryKey: ["template-codes"] });
          },
          onError: (err) => {
            error("등록 실패", err.message);
          },
        }
      );
    } else if (selectedTemplateCode) {
      // 수정
      updateTemplateCode(
        {
          id: selectedTemplateCode.id,
          code: formData.code,
          content: formData.content,
          isQuickMenu: formData.isQuickMenu,
          type: typeToSubmit,
        },
        {
          onSuccess: () => {
            success("수정 완료", "상용구가 수정되었습니다.");
            queryClient.invalidateQueries({ queryKey: ["template-codes"] });
          },
          onError: (err) => {
            error("수정 실패", err.message);
          },
        }
      );
    }
  };

  // 선택된 상용구도 없고 새로작성 모드도 아닌 경우
  if (!selectedTemplateCode && !isNewMode) {
    return (
      <MasterDataDetailContainer>
        <TemplateCodeDetailHeader onNewRegister={handleNewRegister} />
        <MasterDataDetailEmpty message="상용구를 선택하거나 새로작성 버튼을 클릭하여 입력해주세요." />
      </MasterDataDetailContainer>
    );
  }

  // 타입 옵션에서 "전체" 제외
  const typeOptions = TEMPLATE_CODE_TYPE_OPTIONS.filter(
    (option) => option.value !== TemplateCodeType.전체
  );

  return (
    <MasterDataDetailContainer>
      <TemplateCodeDetailHeader onNewRegister={handleNewRegister} />
      <MasterDataDetailContentContainer>
        <BoxContainer>
          <Box title="코드" isRequired>
            <div
              className={cn(
                INPUT_COMMON_CLASS,
                INPUT_FOCUS_CLASS,
                "flex relative items-center w-full mx-[1px]"
              )}
            >
              <div className="text-[12px] text-[var(--text-secondary)] pl-[6px]">
                /
              </div>
              <input
                type="text"
                placeholder={"코드를 입력해주세요. (최대 20자)"}
                className={cn(SEARCH_INPUT_CLASS)}
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
                maxLength={20}
              />
            </div>
            <MyCheckbox
              type="button"
              checked={formData.isQuickMenu}
              onChange={(checked) =>
                setFormData((prev) => ({ ...prev, isQuickMenu: checked }))
              }
              disabled={isPending}
              label={"즐겨찾기"}
            />
          </Box>
        </BoxContainer>
        <BoxContainer>
          <Box
            title="내용"
            subTitle="(글자를 선택하면 서식을 적용할 수 있습니다.)"
            isRequired
          >
            <div className="flex flex-col h-full w-full border border-[var(--border-1)] rounded-sm">
              <div
                className={cn(
                  "overflow-y-auto flex-1 rounded-sm min-h-[200px]",
                  INPUT_FOCUS_CLASS
                )}
              >
                <MyTiptapEditor
                  placeholder="상용구 입력해주세요."
                  content={formData.content}
                  onChange={(content) => {
                    setFormData((prev) => ({ ...prev, content: content }));
                  }}
                  isUseImageUpload={true}
                  isUseTemplate={false}
                />
              </div>
            </div>
          </Box>
        </BoxContainer>
        <BoxContainer>
          <Box
            title="사용처"
            subTitle="(체크하지 않을 경우 전체에서 사용할 수 있습니다.)"
          >
            <div className="flex flex-wrap gap-1">
              {typeOptions.map((option) => (
                <MyCheckbox
                  key={option.value}
                  type="button"
                  checked={formData.type.includes(option.value)}
                  onChange={() => handleTypeToggle(option.value)}
                  disabled={isPending}
                  label={option.label}
                />
              ))}
            </div>
          </Box>
        </BoxContainer>
      </MasterDataDetailContentContainer>
      <TemplateCodeDetailFooter
        isNewMode={isNewMode}
        isPending={isPending}
        onDelete={handleDelete}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </MasterDataDetailContainer>
  );
}

function TemplateCodeDetailHeader({
  onNewRegister,
}: {
  onNewRegister: () => void;
}) {
  return (
    <div className="flex flex-row justify-between items-center px-2 py-1">
      <div className="text-base font-bold">상용구 상세정보</div>
      <div className="flex flex-row gap-4">
        <MyButton className="px-5" onClick={onNewRegister}>
          새로작성
        </MyButton>
      </div>
    </div>
  );
}

function TemplateCodeDetailFooter({
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
        message="선택된 상용구를 삭제하시겠습니까?"
        hideHeader={true}
        children={
          <div className="text-sm text-[var(--gray-500)]">
            삭제된 상용구는 복구되지 않습니다.
          </div>
        }
      />
    </div>
  );
}
