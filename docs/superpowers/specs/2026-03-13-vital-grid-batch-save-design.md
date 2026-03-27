# Vital Grid Batch Save/Cancel Design

## Problem
VitalGrid에서 셀을 편집할 때마다 즉시 개별 API를 호출(create/update/delete)하고 있어 다음 문제 발생:
- 셀 하나 수정할 때마다 네트워크 요청 발생
- 실수로 입력한 값을 되돌리기 어려움
- 여러 셀 동시 편집 시 race condition 가능성

## Solution
모든 편집을 로컬 상태에서만 처리하고, "저장" 버튼 클릭 시 `delete-upsert-many` API 한 번에 호출. "취소" 시 원본 데이터로 복원.

## Architecture

### Data Flow
```
[API 데이터 로드] → snapshotRef에 원본 저장 + data 상태 초기화
                           ↓
[사용자 편집] → data 상태만 변경, dirtySetRef에 편집 셀 추적, isDirty = true
                           ↓
[Socket 이벤트] → vitalSignMeasurements prop 변경
               → dirtySetRef에 없는 셀만 새 데이터로 병합
               → snapshotRef도 갱신
                           ↓
[저장 클릭] → 현재 data에서 값이 있는 모든 셀 → items 배열 구성
           → deleteUpsertMany API 호출 (beginDate~endDate 범위)
           → 성공: invalidateQueries + snapshotRef 갱신 + isDirty=false + dirtySetRef clear
                           ↓
[취소 클릭] → snapshotRef에서 rows 재생성 + isDirty=false + dirtySetRef clear
```

### Socket Merge Strategy
- `dirtySetRef`: `Set<string>` (키 = `${rowKey}::${headerKey}`)
- 사용자가 편집한 셀 → 사용자 값 우선 (유지)
- 편집하지 않은 셀 → 소켓 새 값으로 갱신
- 새로운 행(다른 사용자 추가) → 추가
- 삭제된 행 → 사용자가 편집 중이면 유지

### Changed Files
| File | Change |
|------|--------|
| `vital-grid.tsx` | API 직접 호출 제거, 로컬 편집, isDirty/snapshotRef/dirtySetRef, 저장/취소 핸들러, socket 병합 |
| `vital-main.tsx` | 저장/취소 버튼 (VitalChart 하단 우측), isDirty 전달, 환자 변경 시 이탈 방지 다이얼로그 |

### API Used
```
POST /vital-sign-measurements/patients/{patientId}/delete-upsert-many
  ?beginDate={ISO}&endDate={ISO}
Body: { items: [{ id?, measurementDateTime, itemId, subItemId?, value, memo? }] }
```
- id 있는 items → 해당 레코드 update (삭제에서 보호)
- id 없는 items → 새 레코드 create
- 날짜 범위 내 items에 없는 기존 레코드 → delete

### UI Layout
```
┌─────────────────────────────────────────┐
│ [환자정보] [날짜범위] [기간] [추가][삭제][⚙]│
│ ┌─────────────────────────────────────┐ │
│ │            VitalGrid               │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │            VitalChart              │ │
│ └─────────────────────────────────────┘ │
│                          [취소] [저장]   │
└─────────────────────────────────────────┘
```

### Unsaved Changes Guard
환자 변경 시 isDirty이면 확인 다이얼로그: "저장하지 않은 변경사항이 있습니다. 저장하시겠습니까?"
- 저장 → save 실행 후 환자 변경
- 저장안함 → 변경사항 버리고 환자 변경
- 취소 → 현재 환자 유지
