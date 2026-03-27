# Bundle Category Selector Design

## 개요

bundle-detail-content.tsx의 상단 BoxContainer에 cascading category selector를 추가하여, 묶음의 소속 카테고리를 지정할 수 있도록 한다.

## 요구사항

- 묶음 상세 화면에서 묶음이 어떤 카테고리 하위에 위치할지 선택
- 최상위 카테고리 select → 선택 시 하위 카테고리 select 추가 (최대 2-depth, BE 제한)
- 하위 카테고리가 없으면 해당 레벨에서 종료
- 모든 레벨에 "선택안함" 옵션 존재
- "선택안함" 선택 시 → 상위 카테고리에 직접 소속 (최상위에서 선택안함 = root, categoryId=null)
- 최종 categoryId = 마지막으로 선택한 카테고리의 id (전부 선택안함이면 null)
- 저장은 selectedBundle.categoryId 변경 → 기존 upsert API

## 데이터 소스

### BE API (이미 존재)
- **Endpoint**: `GET /bundle-categories` (hospital-scoped via JWT auth context)
- **Controller**: `BundleCategoriesController.findAll()`
- **응답**: `BundleCategory[]` 플랫 리스트 (parentId, sortNumber 순 정렬, 정렬 보장)
- **계층**: 프론트엔드에서 parentId 기반으로 그룹핑 (BE는 최대 2-depth 강제)
- **Hospital scoping**: BE에서 JWT의 hospitalId로 자동 필터링, FE에서 별도 파라미터 불필요

### TypeScript 타입
- **사용할 타입**: `BundleCategory` from `src/types/master-data/bundle/bundle-category-type.ts`
  - 기존 `BundleCategoriesService`가 이미 이 타입을 import하고 있음
  - 필드가 optional이므로 컴포넌트에서 `id`, `parentId`, `name` 접근 시 적절한 fallback 사용

### FE API 라우트 (현재 상태)
`bundleCategoriesApi` (in `src/lib/api/routes/bundle-categories-api.ts`):
- create, update, move, delete 만 존재
- **list 없음 → 추가 필요**

## 구현 범위

### 1. API 라우트 추가

**파일**: `src/lib/api/routes/bundle-categories-api.ts`

`list` 엔드포인트 추가:
```typescript
list: "/bundle-categories",
```

### 2. Service 메서드 추가

**파일**: `src/services/master-data/bundle-categories-service.ts` (기존 파일에 메서드 추가)

```typescript
static async getCategories(): Promise<BundleCategory[]> {
  return await ApiClient.get(bundleCategoriesApi.list);
}
```

### 3. Hook 추가

**파일**: `src/hooks/master-data/use-get-bundle-categories.ts` (신규)

```typescript
export function useGetBundleCategories() {
  return useQuery({
    queryKey: ["bundle-categories"],
    queryFn: () => BundleCategoriesService.getCategories(),
    staleTime: 5 * 60 * 1000, // 카테고리는 마스터 데이터 → 5분 캐싱
  });
}
```

### 4. UI 컴포넌트

**파일**: `src/app/master-data/_components/(tabs)/(bundle)/(bundle-detail)/bundle-category-selector.tsx` (신규)

**Props**:
- `categories: BundleCategory[]` — 전체 카테고리 플랫 리스트
- `selectedCategoryId: number | null` — 현재 선택된 카테고리 ID
- `onChange: (categoryId: number | null) => void` — 변경 콜백
- `loading?: boolean` — 로딩 상태

**"선택안함" 구현**:
- MySelect의 onChange는 `(value: string | number) => void` 시그니처
- "선택안함"을 sentinel value `{ value: -1, label: "선택안함" }` 옵션으로 options 배열 앞에 추가
- 선택 시 value === -1 이면 내부적으로 null로 변환하여 처리

**isActive 필터링**:
- 카테고리 options 생성 시 `isActive !== false` 인 것만 포함
- 단, 기존 묶음의 categoryId가 비활성 카테고리를 참조하는 경우 해당 카테고리는 options에 포함하되 disabled 표시

**내부 로직**:

1. 플랫 리스트를 parentId로 그룹핑: `Map<number | null, BundleCategory[]>`
   - BE 응답이 이미 sortNumber 순 정렬이므로 프론트에서 추가 정렬 불필요
2. `selectedCategoryId` 변경 시 `useMemo`로 상위 체인 역추적하여 selections 초기값 재계산
3. 각 레벨별 state를 배열로 관리: `selections: (number | null)[]`
4. 레벨 N에서 카테고리 선택 시:
   - selections[N] = selectedId
   - selections[N+1 이후] 모두 제거 (하위 초기화)
   - 해당 카테고리의 하위 카테고리가 있으면 다음 select 렌더링
5. "선택안함" (value === -1) 선택 시:
   - selections[N] = null
   - selections[N+1 이후] 모두 제거
   - 하위 select 렌더링 안함
6. onChange 호출: selections에서 마지막 non-null 값 (없으면 null)

**로딩/에러 상태**:
- loading 시 MySelect에 `loading={true}` 전달
- 카테고리 목록이 빈 배열이면 "선택안함"만 표시

**렌더링**: selections 배열을 map하여 MySelect 동적 렌더링.

### 5. bundle-detail-content.tsx 통합

BoxContainer 내 묶음코드 Box 앞에 카테고리 셀렉터 추가:

```tsx
const { data: categories, isLoading: categoriesLoading } = useGetBundleCategories();

// ...

<BundleCategorySelector
  categories={categories ?? []}
  selectedCategoryId={selectedBundle.categoryId ?? null}
  onChange={handleCategoryChange}
  loading={categoriesLoading}
/>
```

handleCategoryChange에서 `setSelectedBundle({...selectedBundle, categoryId})` 호출.

### 6. 기존 묶음 편집 시 초기값 복원 (반응형)

BundleCategorySelector 내부에서 `useMemo`로 selectedCategoryId + categories 변경 시 자동 재계산:
1. categoryId → Map에서 해당 카테고리 조회 → parentId 체인 역추적
2. root까지의 경로: [root카테id, 하위카테id] (최대 2-depth)
3. selections 배열 초기값으로 설정
4. selectedCategoryId가 외부에서 변경될 때 (다른 묶음 선택 등) 자동으로 재계산

## UI 배치

```
BoxContainer (가로 나열):
[카테고리: [최상위▼] [하위▼]] [묶음코드: ____] [묶음명칭: ____] [묶음가: ...] ...
```

## 파일 변경 목록

| 파일 | 변경 |
|------|------|
| `src/lib/api/routes/bundle-categories-api.ts` | `list` 엔드포인트 추가 |
| `src/services/master-data/bundle-categories-service.ts` | `getCategories()` 메서드 추가 |
| `src/hooks/master-data/use-get-bundle-categories.ts` | 신규 생성 |
| `src/app/master-data/.../(bundle-detail)/bundle-category-selector.tsx` | 신규 생성 |
| `src/app/master-data/.../(bundle-detail)/bundle-detail-content.tsx` | BundleCategorySelector 통합 |

## 검증

1. 카테고리가 없는 상태에서 → 첫 번째 select에 "선택안함"만 표시
2. 카테고리 선택 → 하위 카테고리 select 동적 추가 (최대 2-depth)
3. "선택안함" 선택 → 하위 select 사라짐, 상위 카테고리에 소속
4. 기존 묶음 편집 → 카테고리 체인 자동 복원
5. 다른 묶음으로 전환 시 → selections 자동 재계산
6. 비활성 카테고리 → options에서 숨김 (기존 참조 시에는 표시)
7. 저장 → categoryId 정상 반영 확인
8. `pnpm run check-types` 통과
