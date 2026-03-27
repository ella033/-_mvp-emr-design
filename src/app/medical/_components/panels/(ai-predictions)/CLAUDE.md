# (ai-predictions) 패널 — 아키텍처 가이드

## 디렉토리 구조 & 역할

```
(ai-predictions)/
├── _logic/          # 비즈니스 로직 (hooks, utils, types)
├── _ui/             # 순수 UI 컴포넌트 (store/service/hook import 없음)
├── *-card.tsx       # Container (hook → view 연결, ~10줄)
├── ai-predictions-panel.tsx  # 메인 Container
├── timeline-icon.tsx         # 공유 아이콘 설정
└── timeline-node.tsx         # 미사용
```

## Headless Hook + Presenter 패턴

이 폴더는 **로직(`_logic/`)과 UI(`_ui/`)가 의도적으로 분리**되어 있습니다.

- `_logic/types.ts`의 `*ViewProps` 인터페이스가 두 레이어 간의 **계약**입니다
- Container(`*-card.tsx`)가 hook의 반환값을 view에 props로 전달합니다
- **이 패턴을 깨지 마세요** — 새 기능 추가 시에도 hook → types → view → container 순서를 따르세요

## `_ui/` 파일 규칙

`_ui/` 안의 파일은 **순수 프레젠테이션** 컴포넌트입니다:

- store(`@/store/*`), service(`@/services/*`), hook(`@/hooks/*`)을 **import하지 마세요**
- 허용 import: `@/lib/utils`, `@/components/ui/*`, lucide-react, `../_logic/types`, `../timeline-icon`
- 새 데이터가 필요하면 `_logic/types.ts`에 prop을 추가하고 hook에서 공급하세요

## 수정 가이드

| 변경 종류 | 수정 파일 |
|-----------|----------|
| UI 스타일/레이아웃 | `_ui/*.tsx` |
| 비즈니스 로직 | `_logic/hooks/*.ts`, `_logic/utils/*.ts` |
| 로직↔UI 계약 변경 | `_logic/types.ts` + hook + view 동시 수정 |
| 새 카드 추가 | `_logic/hooks/` + `_logic/types.ts` + `_ui/` + container |
