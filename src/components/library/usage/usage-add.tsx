import MyInput from "@/components/yjg/my-input";
import { MySelect } from "@/components/yjg/my-select";
import { USAGE_CATEGORY_OPTIONS } from "@/constants/common/common-option";
import { useUsageCreate } from "@/hooks/usage/use-usage-create";
import { useToastHelpers } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { isTimesEnabled } from "@/app/master-data/_components/(tabs)/(usage)/usage-converter";
import { UsageCategory } from "@/constants/common/common-enum";
import { useUsages } from "@/hooks/usage/use-usage";
import { MyButton } from "@/components/yjg/my-button";
import { useState, useMemo } from "react";

interface UsageAddFormData {
  code: string;
  usage: string;
  category: number;
  times: number;
}

export default function UsageAdd({
  usage,
  allowedCategories,
  onSuccess,
}: {
  usage: string;
  allowedCategories?: UsageCategory[];
  onSuccess?: () => void;
}) {
  const { data: usages } = useUsages();
  const { error } = useToastHelpers();
  const queryClient = useQueryClient();
  const { mutate: createUsage, isPending } = useUsageCreate();

  // 초기 카테고리 결정:
  // - allowedCategories가 정확히 2개인 경우: COMMON을 제외한 나머지 하나
  // - 그 외: COMMON(1)
  const initialCategory = useMemo(() => {
    if (allowedCategories?.length === 1) {
      return allowedCategories[0] ?? UsageCategory.COMMON;
    }
    else if (allowedCategories?.length === 2) {
      const nonCommon = allowedCategories.find(
        (c) => c !== UsageCategory.COMMON
      );
      return nonCommon ?? UsageCategory.COMMON;
    }
    return UsageCategory.COMMON;
  }, [allowedCategories]);

  const [formData, setFormData] = useState<UsageAddFormData>({
    code: "",
    usage: usage,
    category: initialCategory,
    times: 0,
  });

  const handleSubmit = () => {
    if (!formData.code.trim()) {
      error("입력 오류", "코드를 입력해주세요.");
      return;
    }

    if (!formData.usage.trim()) {
      error("입력 오류", "용법을 입력해주세요.");
      return;
    }

    const isCodeExists = usages?.some((u) => u.code === formData.code);
    if (isCodeExists) {
      error("생성 실패", "이미 존재하는 코드입니다. 다른 코드를 입력해주세요.");
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
          queryClient.invalidateQueries({ queryKey: ["usages"] });
          onSuccess?.();
        },
        onError: (err) => {
          error("등록 실패", err.message);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-4 p-2 w-[350px] h-full">
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex flex-row gap-4 items-center">
          <label className="text-sm text-gray-600 dark:text-gray-400 w-[60px] shrink-0">
            코드<span className="text-red-500">*</span>
          </label>
          <MyInput
            type="text"
            value={formData.code}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, code: value }))
            }
            disabled={isPending}
            maxLength={20}
            className="flex-1"
          />
        </div>
        <div className="flex flex-row gap-4 items-center">
          <label className="text-sm text-gray-600 dark:text-gray-400 w-[60px] shrink-0">
            용법<span className="text-red-500">*</span>
          </label>
          <MyInput
            type="text"
            value={formData.usage}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, usage: value }))
            }
            disabled={isPending}
            maxLength={16}
            placeholder="최대 16글자"
            className="flex-1"
          />
        </div>
        <div className="flex flex-row gap-4 items-center">
          <label className="text-sm text-gray-600 dark:text-gray-400 w-[60px] shrink-0">
            카테고리
          </label>
          <MySelect
            options={USAGE_CATEGORY_OPTIONS}
            value={formData.category}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, category: Number(value) }))
            }
            disabled={isPending}
          />
          {isTimesEnabled(formData.category) && (
            <>
              <label className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                일투
              </label>
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
            </>
          )}
        </div>
      </div>
      <div className="flex flex-row justify-end gap-2">
        <MyButton className="px-5" onClick={handleSubmit} disabled={isPending}>
          등록
        </MyButton>
      </div>
    </div>
  );
}
