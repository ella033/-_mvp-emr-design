# Agent DUR Service

로컬 Agent(8488 포트)의 DUR(Drug Utilization Review) API를 호출하는 서비스입니다.

## 📁 파일 구조

```
src/
├── services/
│   ├── agent-dur-service.ts           # 핵심 서비스 로직
│   ├── agent-dur-service.example.ts   # 사용 예시 (참고용)
│   └── agent-dur-service.README.md    # 이 문서
├── hooks/
│   └── use-agent-dur.ts               # React Hook (상태 관리 포함)
└── app/
    └── lab/
        └── page.tsx                    # 테스트 페이지
```

## 🎯 주요 기능

### 1. DUR 점검 (Drug Utilization Review)

- **API**: `POST /api/dur/{hospitalCode}/Check`
- **설명**: 처방약의 복용금기, 병용금기, 용량주의 등을 종합 점검
- **사용 시점**: 처방 저장 전, 처방 수정 시

### 2. 임부금기 점검

- **API**: `POST /api/dur/{hospitalCode}/ChkPwCtdDrug`
- **설명**: 임신부에게 금기인 약물 확인
- **사용 시점**: 임신부 처방 시

### 3. 연령제한 점검

- **API**: `POST /api/dur/{hospitalCode}/CheckAgeLimit`
- **설명**: 특정 연령에게 금기인 약물 확인
- **사용 시점**: 소아/고령자 처방 시

## 🚀 사용 방법

### 방법 1: Service 직접 호출

```typescript
import { AgentDurService } from "@/services/agent-dur-service";

// DUR 점검
const result = await AgentDurService.checkDur("99350001", {
  AdminType: "M",
  JuminNo: "2211111000098",
  PatNm: "테스트",
  // ... 기타 필드
  Medicines: [
    {
      PrscType: 3,
      MedcCD: "657203130",
      // ... 기타 필드
    },
  ],
});

// 임부금기 점검
const pregnancyResult = await AgentDurService.checkPregnancy("99350001", {
  ComponentCode: "378610ATB",
  Date: "20250916",
});

// 연령제한 점검
const ageLimitResult = await AgentDurService.checkAgeLimit("99350001", {
  JuminNo: "2211111000098",
  IssueDate: "20250916",
  GnlNMCD: "378610ATB",
  MedCode: "657203130",
});
```

### 방법 2: React Hook 사용 (권장)

```typescript
import { useAgentDur } from "@/hooks/use-agent-dur";

function MyComponent() {
  const { durCheck, pregnancyCheck, ageLimitCheck } = useAgentDur();

  const handleDurCheck = async () => {
    try {
      const result = await durCheck.execute("99350001", {
        // ... 요청 데이터
      });
      console.log("점검 완료:", result);
    } catch (error) {
      console.error("점검 실패:", error);
    }
  };

  return (
    <div>
      <button
        onClick={handleDurCheck}
        disabled={durCheck.loading}
      >
        {durCheck.loading ? "점검 중..." : "DUR 점검"}
      </button>

      {durCheck.error && (
        <p className="text-red-500">
          에러: {durCheck.error.message}
        </p>
      )}

      {durCheck.data && (
        <pre>{JSON.stringify(durCheck.data, null, 2)}</pre>
      )}
    </div>
  );
}
```

## 📋 타입 정의

### DurCheckRequest

```typescript
interface DurCheckRequest {
  AdminType: string; // 관리유형 (M: 의료급여)
  JuminNo: string; // 주민등록번호
  PatNm: string; // 환자명
  InsurerType: string; // 보험자종별 (04: 건강보험)
  PrscPresDt: string; // 처방일자 (YYYYMMDD)
  PrscPresTm: string; // 처방시간 (HHMMSS)
  MprscIssueAdmin: string; // 처방기관번호
  MprscGrantNo: string; // 처방전교부번호
  PrscAdminName: string; // 처방기관명
  PrscTel: string; // 처방기관전화번호
  PrscLicType: string; // 처방의사면허종별 (AA: 의사)
  DrLicNo: string; // 의사면허번호
  PrscName: string; // 처방의사명
  PrscMdFee: string; // 진료비총액
  Dsbjt: string; // 진료과목
  MainSick: string; // 주상병코드
  PrscClCode: string; // 처방조제구분 (01: 일반)
  AppIssueAdmin: string; // 조제기관번호
  AppIssueCode: string; // 조제기관코드
  PrscYN: string; // 처방여부 (1: 예)
  OrgPrscPresDt: string; // 원처방일자
  OrgMprscGrantNo: string; // 원처방전교부번호
  Medicines: Array<{
    PrscType: number; // 처방유형 (3: 투약)
    MedcCD: string; // 약품코드
    MedcNM: string; // 약품명
    GnlNMCD: string; // 성분코드
    GnlNM: string; // 성분명
    DdMgtyFreq: number; // 1일투약횟수
    DdExecFreq: number; // 1일실시횟수
    MdcnExecFreq: number; // 투약실시횟수
    InsudmType: string; // 급여구분 (A: 급여)
    IoHsp: string; // 원내외구분 (1: 원내)
  }>;
}
```

### PregnancyCheckRequest

```typescript
interface PregnancyCheckRequest {
  ComponentCode: string; // 성분코드
  Date: string; // 점검일자 (YYYYMMDD)
}
```

### AgeLimitCheckRequest

```typescript
interface AgeLimitCheckRequest {
  JuminNo: string; // 주민등록번호
  IssueDate: string; // 발급일자 (YYYYMMDD)
  GnlNMCD: string; // 성분코드
  MedCode: string; // 약품코드
}
```

## 🔧 환경 변수

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_AGENT_BASE=http://localhost:8488
```

설정하지 않으면 기본값 `http://localhost:8488`이 사용됩니다.

## 🧪 테스트

테스트 페이지: `/lab`

1. 브라우저에서 `http://localhost:3000/lab` 접속
2. "DUR API 테스트" 섹션에서 3개 버튼 클릭
3. 결과 확인

## 📝 실제 사용 예시

### 처방 화면에서 사용

```typescript
// src/app/medical/prescription/page.tsx

import { useAgentDur } from "@/hooks/use-agent-dur";

export default function PrescriptionPage() {
  const { durCheck } = useAgentDur();
  const [prescriptionData, setPrescriptionData] = useState({});

  const handleSave = async () => {
    try {
      // 1. DUR 점검
      const durResult = await durCheck.execute(
        hospitalCode,
        convertToDurRequest(prescriptionData)
      );

      // 2. 경고 확인
      if (durResult.warnings?.length > 0) {
        const confirmed = confirm(
          `DUR 경고가 있습니다: ${durResult.warnings.join(", ")}\n계속하시겠습니까?`
        );
        if (!confirmed) return;
      }

      // 3. 처방 저장
      await savePrescription(prescriptionData);
    } catch (error) {
      console.error("처방 저장 실패:", error);
    }
  };

  return (
    <div>
      {/* 처방 폼 */}
      <button onClick={handleSave} disabled={durCheck.loading}>
        {durCheck.loading ? "DUR 점검 중..." : "처방 저장"}
      </button>
    </div>
  );
}
```

## 🎨 Hook의 장점

### 상태 관리 자동화

```typescript
const { durCheck } = useAgentDur();

// ✅ 로딩 상태
durCheck.loading; // true/false

// ✅ 에러 상태
durCheck.error; // Error | null

// ✅ 결과 데이터
durCheck.data; // 응답 데이터 | null

// ✅ 실행 함수
durCheck.execute(hospitalCode, request);
```

### UI 반응성

```tsx
<button disabled={durCheck.loading}>{durCheck.loading ? "점검 중..." : "DUR 점검"}</button>;

{
  durCheck.error && <Alert variant="destructive">{durCheck.error.message}</Alert>;
}

{
  durCheck.data && <ResultDisplay data={durCheck.data} />;
}
```

## 🛠 유지보수

### 새로운 DUR API 추가

1. `agent-dur-service.ts`에 타입 추가
2. `AgentDurService`에 메서드 추가
3. `use-agent-dur.ts`에 Hook 함수 추가
4. `agent-dur-service.example.ts`에 예시 추가

### 예시

```typescript
// 1. 타입 추가
export interface NewCheckRequest {
  field1: string;
  field2: number;
}

// 2. 서비스 메서드 추가
export const AgentDurService = {
  // ... 기존 메서드들

  async checkNew(hospitalCode: string, request: NewCheckRequest) {
    const response = await fetch(`${AGENT_BASE}/api/dur/${hospitalCode}/NewCheck`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`새로운 점검 실패: ${response.status}`);
    }

    return await response.json();
  },
};

// 3. Hook에 추가
export function useAgentDur() {
  // ... 기존 상태들

  const [newCheckState, setNewCheckState] = useState<DurState<any>>({
    data: null,
    loading: false,
    error: null,
  });

  const checkNew = useCallback(async (hospitalCode: string, request: NewCheckRequest) => {
    setNewCheckState({ data: null, loading: true, error: null });
    try {
      const data = await AgentDurService.checkNew(hospitalCode, request);
      setNewCheckState({ data, loading: false, error: null });
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setNewCheckState({ data: null, loading: false, error: err });
      throw err;
    }
  }, []);

  return {
    // ... 기존 반환값들
    newCheck: {
      ...newCheckState,
      execute: checkNew,
    },
  };
}
```

## 📚 참고 자료

- Agent API 문서: (링크 추가 필요)
- DUR 점검 가이드: (링크 추가 필요)

## 🤝 기여

새로운 기능이나 개선사항은 PR을 통해 제출해주세요.

## 📄 라이선스

(프로젝트 라이선스에 따름)
