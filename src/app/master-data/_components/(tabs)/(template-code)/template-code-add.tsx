import { useEffect, useState } from "react";
import { BoxContainer, Box } from "../../(common)/common-controls";
import { MyButton } from "@/components/yjg/my-button";
import { useTemplateCodeCreate } from "@/hooks/template-code/use-template-code-create";
import { useTemplateCodes } from "@/hooks/template-code/use-template-code";
import { useToastHelpers } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
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
import { stripHtmlTags } from "@/utils/template-code-utils";

interface TemplateCodeAddProps {
  initialContent?: string;
  initialType?: TemplateCodeType;
  onSuccessAction?: () => void;
  onCancelAction?: () => void;
}

interface TemplateCodeFormData {
  code: string;
  content: string;
  isQuickMenu: boolean;
  type: TemplateCodeType[];
}

export default function TemplateCodeAdd({
  initialContent = "",
  initialType,
  onSuccessAction,
  onCancelAction,
}: TemplateCodeAddProps) {
  const [formData, setFormData] = useState<TemplateCodeFormData>({
    code: "",
    content: initialContent,
    isQuickMenu: false,
    type: initialType ? [initialType] : [],
  });

  const { data: templateCodes } = useTemplateCodes();
  const { error } = useToastHelpers();
  const queryClient = useQueryClient();

  const { mutate: createTemplateCode, isPending } = useTemplateCodeCreate();

  // initialContent가 변경되면 formData 업데이트
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      content: initialContent,
      type: initialType ? [initialType] : prev.type,
    }));
  }, [initialContent, initialType]);

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

    if (!stripHtmlTags(formData.content)) {
      error("입력 오류", "내용을 입력해주세요.");
      return;
    }

    // 전체 타입 제외
    let typeToSubmit: TemplateCodeType[] = formData.type.filter(
      (t) => t !== TemplateCodeType.전체
    );

    // 타입이 없으면 전체로 설정
    if (typeToSubmit.length === 0) {
      typeToSubmit = [TemplateCodeType.전체];
    }

    // 중복 코드 체크
    const isCodeExists = templateCodes?.some((tc) => tc.code === formData.code);
    if (isCodeExists) {
      error("생성 실패", "이미 존재하는 코드입니다. 다른 코드를 입력해주세요.");
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
          queryClient.invalidateQueries({ queryKey: ["template-codes"] });
          onSuccessAction?.();
        },
        onError: (err) => {
          error("등록 실패", err.message);
        },
      }
    );
  };

  const handleCancel = () => {
    onCancelAction?.();
  };

  // 타입 옵션에서 "전체" 제외
  const typeOptions = TEMPLATE_CODE_TYPE_OPTIONS.filter(
    (option) => option.value !== TemplateCodeType.전체
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-2">
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
                  "overflow-y-auto flex-1 rounded-sm min-h-[150px]",
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
      </div>
      <div className="flex flex-row justify-end items-center py-2 px-2 gap-2 border-t border-[var(--border-1)]">
        <MyButton
          variant="outline"
          className="px-5"
          onClick={handleCancel}
          disabled={isPending}
        >
          취소
        </MyButton>
        <MyButton className="px-5" onClick={handleSubmit} disabled={isPending}>
          등록
        </MyButton>
      </div>
    </div>
  );
}
