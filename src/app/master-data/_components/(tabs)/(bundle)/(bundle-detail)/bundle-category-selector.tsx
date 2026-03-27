import { useMemo, useState, useEffect } from "react";
import { MySelect, type MySelectOption } from "@/components/yjg/my-select";
import type { BundleCategory } from "@/types/master-data/bundle/bundle-category-type";
import { Box } from "../../../(common)/common-controls";

/** "선택안함" sentinel value — MySelect는 null을 지원하지 않으므로 -1을 사용 */
const NO_SELECTION_VALUE = -1;
const NO_SELECTION_OPTION: MySelectOption = {
  value: NO_SELECTION_VALUE,
  label: "선택안함",
};

interface BundleCategorySelectorProps {
  categories: BundleCategory[];
  selectedCategoryId: number | null;
  onChange: (categoryId: number | null) => void;
  loading?: boolean;
}

export default function BundleCategorySelector({
  categories,
  selectedCategoryId,
  onChange,
  loading = false,
}: BundleCategorySelectorProps) {
  // 1. 플랫 리스트를 parentId로 그룹핑
  const childrenByParentId = useMemo(() => {
    const map = new Map<number | null, BundleCategory[]>();
    for (const cat of categories) {
      if (cat.isActive === false) continue; // 비활성 카테고리 제외
      const parentKey = cat.parentId ?? null;
      if (!map.has(parentKey)) {
        map.set(parentKey, []);
      }
      map.get(parentKey)!.push(cat);
    }
    return map;
  }, [categories]);

  // id → BundleCategory 빠른 조회용
  const categoryById = useMemo(() => {
    const map = new Map<number, BundleCategory>();
    for (const cat of categories) {
      map.set(cat.id, cat);
    }
    return map;
  }, [categories]);

  // 2. selectedCategoryId에서 상위 체인 역추적하여 selections 초기값 계산
  const initialSelections = useMemo(() => {
    if (selectedCategoryId == null) return [null] as (number | null)[];

    // 역추적: selectedCategoryId → parent → parent → ... → root
    const chain: number[] = [];
    let currentId: number | null = selectedCategoryId;
    while (currentId != null) {
      chain.unshift(currentId);
      const cat = categoryById.get(currentId);
      currentId = cat?.parentId ?? null;
    }

    // chain = [rootCatId, childCatId, ...] (최대 2-depth)
    // 마지막 카테고리에 하위가 있으면 null 추가 (하위 select 표시용)
    const lastId = chain[chain.length - 1] as number | undefined;
    const hasChildren = lastId != null && childrenByParentId.has(lastId);
    if (hasChildren) {
      return [...chain, null] as (number | null)[];
    }
    return chain as (number | null)[];
  }, [selectedCategoryId, categoryById, childrenByParentId]);

  // 3. selections state
  const [selections, setSelections] = useState<(number | null)[]>(
    initialSelections
  );

  // selectedCategoryId가 외부에서 변경될 때 selections 재계산
  useEffect(() => {
    setSelections(initialSelections);
  }, [initialSelections]);

  // 4. 레벨 N에서 선택 변경 핸들러
  const handleSelectChange = (level: number, value: string | number) => {
    const numValue = Number(value);
    const isNoSelection = numValue === NO_SELECTION_VALUE;
    const selectedId = isNoSelection ? null : numValue;

    const newSelections = selections.slice(0, level);
    newSelections[level] = selectedId;

    // 하위 카테고리가 있고 선택을 했으면 다음 레벨에 null 추가 (하위 select 표시)
    if (selectedId != null && childrenByParentId.has(selectedId)) {
      newSelections.push(null);
    }

    setSelections(newSelections);

    // onChange: 마지막 non-null 값 (없으면 null)
    let finalCategoryId: number | null = null;
    for (let i = newSelections.length - 1; i >= 0; i--) {
      if (newSelections[i] != null) {
        finalCategoryId = newSelections[i] ?? null;
        break;
      }
    }
    onChange(finalCategoryId);
  };

  // 5. 각 레벨의 options 생성
  const getOptionsForLevel = (level: number): MySelectOption[] => {
    const parentId = level === 0 ? null : selections[level - 1];
    const children = childrenByParentId.get(parentId ?? null) ?? [];

    const options: MySelectOption[] = [
      NO_SELECTION_OPTION,
      ...children.map((cat) => ({
        value: cat.id,
        label: cat.name ?? "",
      })),
    ];

    // 비활성 카테고리이지만 현재 선택된 값인 경우 disabled로 추가
    if (selections[level] != null) {
      const selectedCat = categoryById.get(selections[level]!);
      if (selectedCat && selectedCat.isActive === false) {
        const alreadyExists = options.some((o) => o.value === selectedCat.id);
        if (!alreadyExists) {
          options.push({
            value: selectedCat.id,
            label: `${selectedCat.name ?? ""} (비활성)`,
            disabled: true,
          });
        }
      }
    }

    return options;
  };

  // 6. 렌더링할 레벨 수 계산
  const levelsToRender: number[] = [];
  for (let i = 0; i < selections.length; i++) {
    levelsToRender.push(i);
    // 현재 레벨이 null(선택안함)이면 여기까지만
    if (selections[i] === null) break;
  }

  return (
    <Box title="카테고리" isWidthFit={true}>
      <div className="flex flex-row gap-1">
        {levelsToRender.map((level) => (
          <MySelect
            key={level}
            className="w-fit"
            options={getOptionsForLevel(level)}
            value={selections[level] ?? NO_SELECTION_VALUE}
            onChange={(value) => handleSelectChange(level, value)}
            loading={loading && level === 0}
            placeholder="선택안함"
          />
        ))}
      </div>
    </Box>
  );
}
