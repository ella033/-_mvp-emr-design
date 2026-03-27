# Bundle Category Selector Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cascading category selector to bundle detail form so users can assign bundles to categories.

**Architecture:** Add `list` endpoint to existing API routes, add `getCategories()` to existing service, create a React Query hook, build a `BundleCategorySelector` component using `MySelect`, and integrate it into `BundleDetailContent`.

**Tech Stack:** React 19, TypeScript, TanStack React Query, MySelect component

**Spec:** `docs/superpowers/specs/2026-03-17-bundle-category-selector-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/api/routes/bundle-categories-api.ts` | Modify | Add `list` endpoint |
| `src/services/master-data/bundle-categories-service.ts` | Modify | Add `getCategories()` method |
| `src/hooks/master-data/use-get-bundle-categories.ts` | Create | React Query hook for fetching categories |
| `src/app/master-data/_components/(tabs)/(bundle)/(bundle-detail)/bundle-category-selector.tsx` | Create | Cascading category selector UI component |
| `src/app/master-data/_components/(tabs)/(bundle)/(bundle-detail)/bundle-detail-content.tsx` | Modify | Integrate selector into form |

---

## Chunk 1: Data Layer (API Route + Service + Hook)

### Task 1: Add `list` endpoint to API routes

**Files:**
- Modify: `src/lib/api/routes/bundle-categories-api.ts`

- [ ] **Step 1: Add `list` to `bundleCategoriesApi`**

Open `src/lib/api/routes/bundle-categories-api.ts`. Add `list` as the first property:

```typescript
export const bundleCategoriesApi = {
  list: "/bundle-categories",
  create: "/bundle-categories",
  update: (id: number) => `/bundle-categories/${id}`,
  move: (id: number) => `/bundle-categories/${id}/move`,
  delete: (id: number) => `/bundle-categories/${id}`,
};
```

- [ ] **Step 2: Verify no type errors**

Run: `cd C:\GIT\NextEMR\react-frontend && pnpm run check-types`
Expected: PASS (no new errors introduced)

---

### Task 2: Add `getCategories()` to service

**Files:**
- Modify: `src/services/master-data/bundle-categories-service.ts`

- [ ] **Step 1: Add `getCategories` static method**

Add this method at the top of the `BundleCategoriesService` class (before `createCategory`):

```typescript
static async getCategories(): Promise<BundleCategory[]> {
  return await ApiClient.get<BundleCategory[]>(bundleCategoriesApi.list);
}
```

The full file becomes:

```typescript
import { ApiClient } from "@/lib/api/api-client";
import { bundleCategoriesApi } from "@/lib/api/routes/bundle-categories-api";
import type {
  BundleCategory,
  BundleCategoryInsert,
} from "@/types/master-data/bundle/bundle-category-type";

export class BundleCategoriesService {
  static async getCategories(): Promise<BundleCategory[]> {
    return await ApiClient.get<BundleCategory[]>(bundleCategoriesApi.list);
  }

  static async createCategory(
    category: BundleCategoryInsert
  ): Promise<BundleCategory> {
    return await ApiClient.post<BundleCategory>(
      bundleCategoriesApi.create,
      category
    );
  }

  // ... rest unchanged
}
```

- [ ] **Step 2: Verify no type errors**

Run: `cd C:\GIT\NextEMR\react-frontend && pnpm run check-types`
Expected: PASS

---

### Task 3: Create React Query hook

**Files:**
- Create: `src/hooks/master-data/use-get-bundle-categories.ts`

- [ ] **Step 1: Create the hook file**

Create `src/hooks/master-data/use-get-bundle-categories.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { BundleCategoriesService } from "@/services/master-data/bundle-categories-service";

export function useGetBundleCategories() {
  return useQuery({
    queryKey: ["bundle-categories"],
    queryFn: () => BundleCategoriesService.getCategories(),
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 2: Verify no type errors**

Run: `cd C:\GIT\NextEMR\react-frontend && pnpm run check-types`
Expected: PASS

- [ ] **Step 3: Commit data layer**

```bash
git add src/lib/api/routes/bundle-categories-api.ts src/services/master-data/bundle-categories-service.ts src/hooks/master-data/use-get-bundle-categories.ts
git commit -m "feat: 묶음 카테고리 목록 조회 데이터 레이어 추가"
```

---

## Chunk 2: BundleCategorySelector Component

### Task 4: Create `BundleCategorySelector` component

**Files:**
- Create: `src/app/master-data/_components/(tabs)/(bundle)/(bundle-detail)/bundle-category-selector.tsx`

- [ ] **Step 1: Create the component file**

Create `src/app/master-data/_components/(tabs)/(bundle)/(bundle-detail)/bundle-category-selector.tsx`:

```tsx
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
    // selections = [...chain, null] (마지막에 null 추가하여 "이 레벨에서 선택안함" 표현)
    // 단, 마지막 카테고리에 하위가 있으면 null 추가, 없으면 추가하지 않음
    const lastId = chain[chain.length - 1];
    const hasChildren = childrenByParentId.has(lastId);
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
        finalCategoryId = newSelections[i];
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
        const alreadyExists = options.some(
          (o) => o.value === selectedCat.id
        );
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
```

**Key decisions documented:**
- `NO_SELECTION_VALUE = -1`: sentinel for "선택안함" since MySelect doesn't support null values
- `isActive === false` filtered out of options; inactive but currently-referenced categories shown as disabled
- `selections` array tracks each level; re-derived via `useEffect` when `selectedCategoryId` prop changes
- `onChange` emits the last non-null value in the selections chain

- [ ] **Step 2: Verify no type errors**

Run: `cd C:\GIT\NextEMR\react-frontend && pnpm run check-types`
Expected: PASS

- [ ] **Step 3: Commit component**

```bash
git add "src/app/master-data/_components/(tabs)/(bundle)/(bundle-detail)/bundle-category-selector.tsx"
git commit -m "feat: BundleCategorySelector 컴포넌트 생성"
```

---

## Chunk 3: Integration into BundleDetailContent

### Task 5: Integrate `BundleCategorySelector` into `bundle-detail-content.tsx`

**Files:**
- Modify: `src/app/master-data/_components/(tabs)/(bundle)/(bundle-detail)/bundle-detail-content.tsx`

- [ ] **Step 1: Add imports**

Add these imports to the top of the file (after existing imports):

```typescript
import BundleCategorySelector from "./bundle-category-selector";
import { useGetBundleCategories } from "@/hooks/master-data/use-get-bundle-categories";
```

- [ ] **Step 2: Add hook call and handler inside the component**

Inside the `BundleDetailContent` function, after the existing `useEncounterStore()` line (~line 61), add:

```typescript
const { data: categories, isLoading: categoriesLoading } =
  useGetBundleCategories();

const handleCategoryChange = (categoryId: number | null) => {
  setSelectedBundle({
    ...selectedBundle,
    categoryId: categoryId,
  } as Bundle);
};
```

- [ ] **Step 3: Add `BundleCategorySelector` to JSX**

In the `return` JSX, inside `<BoxContainer>`, add the selector **before** the "묶음코드" `<Box>` (before line 246 in the current file):

```tsx
<BoxContainer>
  <BundleCategorySelector
    categories={categories ?? []}
    selectedCategoryId={selectedBundle.categoryId ?? null}
    onChange={handleCategoryChange}
    loading={categoriesLoading}
  />
  <Box
    title="묶음코드"
    className="min-w-[8rem] max-w-[15rem]"
    isRequired={true}
  >
    {/* ... existing code unchanged ... */}
  </Box>
  {/* ... rest of BoxContainer unchanged ... */}
</BoxContainer>
```

- [ ] **Step 4: Verify no type errors**

Run: `cd C:\GIT\NextEMR\react-frontend && pnpm run check-types`
Expected: PASS

- [ ] **Step 5: Manual verification**

Start dev server: `cd C:\GIT\NextEMR\react-frontend && pnpm run dev`

Test checklist:
1. 마스터 데이터 → 묶음 탭 → 묶음 선택 → 카테고리 select가 묶음코드 앞에 표시됨
2. 카테고리가 없으면 → "선택안함"만 표시
3. 최상위 카테고리 선택 → 하위 카테고리 select 동적 추가
4. 하위에서 "선택안함" → 하위 select 사라짐
5. 기존 묶음의 categoryId가 있으면 → 선택 체인 자동 복원
6. 다른 묶음 클릭 → selections 자동 재계산
7. 저장 후 → categoryId 정상 반영

- [ ] **Step 6: Commit integration**

```bash
git add "src/app/master-data/_components/(tabs)/(bundle)/(bundle-detail)/bundle-detail-content.tsx"
git commit -m "feat: BundleDetailContent에 카테고리 셀렉터 통합"
```
