# Personal Privacy Management (개인정보 관리 프론트엔드)

## 1. 개요
병원 내 개인정보 파기 및 접근 이력을 조회하고 관리하는 설정 페이지입니다.
다음 3가지 주요 탭으로 구성됩니다.
1. **개인정보 파기**: 보유 기간(5년)이 경과한 문서를 조회하고 파기합니다.
2. **개인정보 접근 내역**: 메뉴 및 환자 정보 접근 로그를 조회합니다.
3. **진료정보 접근 내역**: 진료 기록(차트)에 대한 생성/조회/수정/삭제 이력을 조회합니다.

## 2. 디렉토리 구조
```bash
src/app/settings/personal-privacy/
├── layout.tsx         # 탭 네비게이션 레이아웃
├── page.tsx           # 기본 리다이렉트 (-> detection)
├── destruction/       # [Tab 1] 개인정보 파기 페이지
├── access-history/    # [Tab 2] 접근 내역 페이지
└── medical-access-history/ # [Tab 3] 진료정보 접근 내역 페이지

src/components/settings/personal-privacy/
├── DestructionTab/    # 파기 탭 전용 컴포넌트
│   ├── DestructionFilter.tsx  # 검색 필터 (기간, 문서종류)
│   ├── DestructionTable.tsx   # 대상 목록 테이블
│   └── DestructionAlert.tsx   # 파기 확인 팝업
├── DestructionHistory/# 파기 이력 모달 관련
├── AccessHistoryTab/  # 접근 내역 전용 컴포넌트
└── MedicalAccessHistoryTab/ # 진료정보 접근 내역 전용 컴포넌트
```

## 3. 주요 기능 및 컴포넌트

### 3.1 개인정보 파기 (DestructionTab)
- **경로**: `/settings/personal-privacy/destruction`
- **기능**:
  - **문서 조회**: `DestructionFilter`를 통해 5년 경과 문서 조회.
  - **다중 선택 파기**: 목록에서 대상을 선택하여 파기 요청.
  - **파기 사유 입력**: `DestructionAlert`에서 사유(보유기간 경과 등) 입력 필수.
  - **이력 조회**: '개인정보 파기 내역' 버튼 클릭 시 `DestructionHistoryModal` 오픈.

### 3.2 개인정보 접근 내역 (AccessHistoryTab)
- **경로**: `/settings/personal-privacy/access-history`
- **기능**:
  - **기간 조회**: 기본 1개월 단위 조회.
  - **로그 테이블**: 수행 일시, 메뉴명, 환자명, 수행 업무(조회/생성 등), 담당자 표시.
  - **읽기 전용**: 다운로드 기능 제한.

### 3.3 진료정보 접근 내역 (MedicalAccessHistoryTab)
- **경로**: `/settings/personal-privacy/medical-access-history`
- **기능**:
  - **차트 중심 로그**: 차트 번호, 환자명 기준의 상세 작업 로그 조회.
  - **작업 유형**: 차트 생성, 조회, 수정, 삭제 작업만 필터링하여 표시.

## 4. 데이터 연동 (Query Hooks)
- 백엔드 API (`/personal-privacy/*`)와 연동됩니다.
- **사용되는 Hooks** (`src/hooks/personal-privacy/use-personal-privacy.ts`):
  - `usePersonalPrivacyCandidates`: 파기 대상 목록 조회
  - `useDestructPersonalData`: 개인정보 파기 실행 (Mutation)
  - `usePersonalPrivacyHistory`: 파기 이력 조회
  - `usePersonalAccessLogs`: 개인정보 접근 내역 조회
  - `useMedicalAccessLogs`: 진료정보 접근 내역 조회
