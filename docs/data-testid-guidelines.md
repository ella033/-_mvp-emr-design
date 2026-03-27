# data-testid Guidelines

## 목적

`data-testid`는 모든 JSX 태그에 붙이는 속성이 아니다.

이 프로젝트에서 `data-testid`는 다음 목적에만 사용한다.

- `nextemr-admin`의 Playwright spec/TC 생성에서 안정적인 selector를 제공한다.
- UI contract 성격의 E2E 테스트에서 구조적 앵커를 제공한다.
- 접근성 selector(`role`, `label`, `name`)만으로 안정 식별이 어려운 커스텀 UI를 식별한다.

기본 원칙:

- 먼저 `role + name`
- 다음 `label`
- 다음 `text`
- 그래도 불안정하면 `data-testid`
- CSS selector는 마지막 수단

## 붙여야 하는 경우

다음 요소에는 `data-testid`를 우선 고려한다.

- 페이지 또는 주요 화면의 루트 컨테이너
- 탭, 패널, split pane, grid, table, list 같은 구조적 영역
- 모달, 다이얼로그, 드로어, sheet의 루트 컨테이너
- 동일한 텍스트가 반복되어 text selector가 충돌하는 버튼
- 커스텀 인풋, 검색 컴포넌트, 복합 셀렉터처럼 표준 label 기반 선택이 어려운 입력 UI
- row 단위 액션이 있는 반복 리스트 또는 그리드
- toast, popover, dropdown panel처럼 열림 상태를 검증해야 하는 오버레이
- 텍스트가 자주 바뀌거나 다국어 변경 가능성이 큰 UI

예시:

- `reception-main-split`
- `patient-search-input`
- `patient-create-modal`
- `patient-create-save-button`
- `claims-dx-split`

## 붙이지 않아도 되는 경우

다음 요소에는 기본적으로 `data-testid`를 붙이지 않는다.

- 단순 레이아웃용 `div`, `span`, `section`
- 텍스트와 역할이 명확한 단일 버튼
- `getByLabel()`로 안정 선택 가능한 기본 `input`
- 접근성 속성이 명확한 기본 `checkbox`, `radio`, `switch`
- purely presentational element
- 테스트에서 직접 참조하지 않는 내부 leaf node

잘못된 방향:

- 모든 JSX 태그에 일괄 부착
- 같은 컴포넌트 내부의 모든 버튼/인풋에 기계적으로 부착
- 스타일링 또는 DOM 구조 확인용으로 부착

## 부착 단위

`data-testid`는 leaf 태그보다 의미 있는 UI 단위에 둔다.

권장 단위:

- screen/page
- section/panel
- modal/dialog/drawer
- form
- field
- action button
- list/grid
- row action

비권장 단위:

- 아이콘
- 텍스트 조각
- 내부 wrapper
- 단순 정렬용 container

## 네이밍 규칙

모든 test id는 소문자 kebab-case를 사용한다.

권장 포맷:

- `{screen}-{area}`
- `{screen}-{area}-{element}`
- `{domain}-{action}-button`
- `{domain}-{action}-modal`
- `{domain}-{field}-input`
- `{domain}-{field}-select`
- `{domain}-{field}-checkbox`
- `{domain}-{list}-row-{action}`

예시:

- `reservation-calendar-panel`
- `reservation-create-modal`
- `reservation-patient-search-input`
- `reservation-save-button`
- `crm-template-list`
- `crm-template-row-edit-button`

피해야 할 이름:

- `button-1`
- `input-2`
- `modal-open`
- `temp`
- `test-button`

규칙:

- UI 모양이 아니라 도메인 의미로 이름 짓는다.
- 번역 문자열을 그대로 test id에 복사하지 않는다.
- 순번 의존 이름은 피한다.
- 재사용 컴포넌트 내부에서는 범용 이름보다 사용 위치에서 의미를 주입한다.

## Selector 우선순위

테스트 코드와 spec/TC 작성 시 selector는 아래 순서를 권장한다.

1. `getByTestId()`
2. `getByRole()` with accessible name
3. `getByLabel()`
4. `getByText()`
5. CSS selector

단, 모든 요소를 `getByTestId()`로 강제하지는 않는다.

권장 사용 방식:

- 공용 접근성 정보가 명확하면 `role` 또는 `label` 사용
- 구조적 앵커나 커스텀 UI는 `testid` 사용
- CSS는 DOM 구조 변경에 취약하므로 회피

## 컴포넌트별 기준

### 버튼

- 버튼 텍스트가 유일하고 안정적이면 `testid` 없이 사용 가능
- 동일 텍스트 버튼이 여러 개면 `testid` 부착
- 아이콘 버튼은 기본적으로 `testid` 또는 명확한 `aria-label` 필요

### 인풋

- 표준 라벨이 연결된 인풋은 우선 `label` 기반 사용
- 커스텀 검색창, 복합 입력, masked input은 `testid` 권장

### 모달/다이얼로그

- 루트 컨테이너에는 가능하면 `testid` 부착
- 내부 저장/취소 버튼은 중복 가능성이 있으면 `testid` 부착
- 모달 열림 여부 검증은 루트 `testid` 기준으로 한다

### 그리드/테이블/리스트

- 전체 컨테이너에는 `testid` 권장
- row selection 또는 row action이 중요하면 row/action 단위 `testid` 부착
- 단순 셀 텍스트는 필요할 때만 노출

### 탭/패널/스플릿 레이아웃

- 레이아웃의 안정 앵커로 쓰이므로 `testid` 권장

## 구현 원칙

- 새 화면을 만들 때 먼저 테스트 계약점이 어디인지 정한다.
- 계약점으로 쓰지 않을 요소에는 붙이지 않는다.
- 재사용 컴포넌트가 `testId` prop을 지원하면 호출부에서 의미 있는 값을 전달한다.
- 공용 UI 라이브러리 자체에 무분별하게 기본 test id를 박아두지 않는다.

## 자동 삽입 스크립트 사용 주의

`react-frontend/package.json`에는 `graph:testid` 스크립트가 있다.

이 스크립트는 누락 탐지나 초안 생성에는 유용하지만, 최종 규칙의 대체 수단은 아니다.

이유:

- 기계적으로 생성된 이름은 도메인 의미가 약할 수 있다.
- 순번 기반 이름은 유지보수에 취약하다.
- spec/TC에서 읽기 어려운 selector가 만들어질 수 있다.

따라서 자동 삽입 후에는 사람이 아래를 다시 정리해야 한다.

- 계약점이 맞는지
- 이름이 도메인 의미를 갖는지
- 불필요한 leaf-level test id가 없는지

## 리뷰 체크리스트

PR 리뷰 시 아래를 확인한다.

- 이 요소가 실제로 테스트 계약점인가
- `role` 또는 `label`로 대체 가능한가
- 이름이 화면 구조가 아니라 도메인 의미를 담고 있는가
- 같은 화면 내에서 중복되거나 모호하지 않은가
- 모달, 패널, 리스트 등 주요 구조 앵커가 빠지지 않았는가
- CSS selector 의존을 줄일 수 있는가

## 요약

`data-testid`는 전수 부착 대상이 아니다.

이 프로젝트에서는 "접근성 selector만으로 안정 식별이 어려운 UI 계약점"에만 선택적으로 부착한다.

가장 중요한 기준은 개수보다 안정성이고, 자동 생성보다 의미 있는 이름이다.
