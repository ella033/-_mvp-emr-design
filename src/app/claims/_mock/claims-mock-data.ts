/**
 * 청구 현황 페이지 Mock 데이터
 * - 백엔드 API가 변경 예정이므로 모든 API를 mock으로 대체
 * - 추후 백엔드 API가 확정되면 실제 API로 전환 필요
 */

// ── 청구현황 리스트 Mock 데이터 ──────────────────────
export interface MockClaimRow {
  id: string;
  treatmentYearMonth: string;
  formNumber: string;
  treatmentType: string;
  claimClassification: string;
  claimOrder: string;
  count: number;
  errorCount: number;
  reviewCompletedCount: number;
  totalMedicalBenefitAmount1: string;
  claimAmount: string;
  patientCoPayment: string;
  claimDate: string;
  progress: string; // "PENDING" | "COMPLETED"
}

export const MOCK_CLAIMS: MockClaimRow[] = [
  // Row 1: 건강보험 · 외래 · 원청구 · 오류 34건 · 송신대기
  {
    id: "claim-001",
    treatmentYearMonth: "202507",
    formNumber: "H010",
    treatmentType: "2",
    claimClassification: "0",
    claimOrder: "1",
    count: 1016,
    errorCount: 34,
    reviewCompletedCount: 702,
    totalMedicalBenefitAmount1: "8490210",
    claimAmount: "5210900",
    patientCoPayment: "3279310",
    claimDate: "",
    progress: "PENDING",
  },
  // Row 2: 의료급여 · 외래 · 원청구 · 오류 0건 · 송신대기
  {
    id: "claim-002",
    treatmentYearMonth: "202507",
    formNumber: "H011",
    treatmentType: "2",
    claimClassification: "0",
    claimOrder: "1",
    count: 52,
    errorCount: 0,
    reviewCompletedCount: 0,
    totalMedicalBenefitAmount1: "490210",
    claimAmount: "400210",
    patientCoPayment: "90000",
    claimDate: "",
    progress: "PENDING",
  },
  // Row 3: 의료급여 · 외래 · 보완청구 · 심사 2/2 · 송신대기
  {
    id: "claim-003",
    treatmentYearMonth: "202507",
    formNumber: "H011",
    treatmentType: "2",
    claimClassification: "1",
    claimOrder: "1",
    count: 2,
    errorCount: 0,
    reviewCompletedCount: 2,
    totalMedicalBenefitAmount1: "80500",
    claimAmount: "79000",
    patientCoPayment: "1500",
    claimDate: "",
    progress: "PENDING",
  },
  // Row 4: 건강보험 · 외래 · 원청구 · 10,162건 · 오류 34건 · 송신대기
  {
    id: "claim-004",
    treatmentYearMonth: "202507",
    formNumber: "H010",
    treatmentType: "2",
    claimClassification: "0",
    claimOrder: "1",
    count: 10162,
    errorCount: 34,
    reviewCompletedCount: 702,
    totalMedicalBenefitAmount1: "8490210",
    claimAmount: "5210900",
    patientCoPayment: "3279310",
    claimDate: "",
    progress: "PENDING",
  },
  // Row 5: 의료급여 · 외래 · 보완청구 · 송신대기
  {
    id: "claim-005",
    treatmentYearMonth: "202507",
    formNumber: "H011",
    treatmentType: "2",
    claimClassification: "1",
    claimOrder: "1",
    count: 2,
    errorCount: 0,
    reviewCompletedCount: 0,
    totalMedicalBenefitAmount1: "490210",
    claimAmount: "400210",
    patientCoPayment: "90000",
    claimDate: "",
    progress: "PENDING",
  },
  // Row 6: 의료급여 · 외래 · 보완청구 · 송신완료 · 2025-07-31
  {
    id: "claim-006",
    treatmentYearMonth: "202507",
    formNumber: "H011",
    treatmentType: "2",
    claimClassification: "1",
    claimOrder: "1",
    count: 2,
    errorCount: 0,
    reviewCompletedCount: 0,
    totalMedicalBenefitAmount1: "490210",
    claimAmount: "400210",
    patientCoPayment: "90000",
    claimDate: "2025-07-31",
    progress: "COMPLETED",
  },
  // Row 7: 의료급여 · 외래 · 보완청구 · 송신완료 · 2025-07-31
  {
    id: "claim-007",
    treatmentYearMonth: "202507",
    formNumber: "H011",
    treatmentType: "2",
    claimClassification: "1",
    claimOrder: "1",
    count: 2,
    errorCount: 0,
    reviewCompletedCount: 0,
    totalMedicalBenefitAmount1: "490210",
    claimAmount: "400210",
    patientCoPayment: "90000",
    claimDate: "2025-07-31",
    progress: "COMPLETED",
  },
];

// ── 대상환자 목록 Mock 데이터 ────────────────────────
export interface MockPatientRow {
  id: string;
  patientId: string;
  patientName: string;
  birthDate: string;
  gender: string;
  treatmentDate: string;
  lastModifiedDate: string;
  additionalClaimCount?: number; // 추가청구 건수
}

export const MOCK_PATIENTS: MockPatientRow[] = [
  {
    id: "p-001",
    patientId: "907",
    patientName: "김길동",
    birthDate: "1994-04-20",
    gender: "남",
    treatmentDate: "2025-08-10",
    lastModifiedDate: "2020-09-20",
    additionalClaimCount: 1,
  },
  {
    id: "p-002",
    patientId: "908",
    patientName: "홍길동",
    birthDate: "1994-04-20",
    gender: "남",
    treatmentDate: "2025-08-10",
    lastModifiedDate: "2020-09-20",
  },
  {
    id: "p-003",
    patientId: "909",
    patientName: "김영희",
    birthDate: "1993-11-15",
    gender: "여",
    treatmentDate: "2026-01-12",
    lastModifiedDate: "2021-05-30",
  },
  {
    id: "p-004",
    patientId: "910",
    patientName: "이철수",
    birthDate: "1988-02-28",
    gender: "남",
    treatmentDate: "2025-12-25",
    lastModifiedDate: "2019-08-15",
  },
  {
    id: "p-005",
    patientId: "911",
    patientName: "박지민",
    birthDate: "1996-07-10",
    gender: "여",
    treatmentDate: "2027-03-05",
    lastModifiedDate: "2022-11-01",
  },
];

// ── 추가청구 처방 항목 Mock 데이터 ────────────────────
export interface MockPrescriptionItem {
  id: string;
  prescriptionDate: string; // 처방일자
  userCode: string; // 사용자코드
  claimCode: string; // 청구코드
  name: string; // 명칭
  dosage: number; // 용량
  dailyDose: number; // 일투
  days: number; // 일수
}

/** 환자별 추가청구 처방 항목 mock 데이터 (patientId 기준) */
export const MOCK_PRESCRIPTION_ITEMS: Record<string, MockPrescriptionItem[]> = {
  "p-001": [
    {
      id: "rx-001",
      prescriptionDate: "2025-09-20",
      userCode: "E7660",
      claimCode: "E7660",
      name: "결장경검사",
      dosage: 1,
      dailyDose: 1,
      days: 1,
    },
    {
      id: "rx-002",
      prescriptionDate: "2025-09-20",
      userCode: "E7660",
      claimCode: "E7660",
      name: "결장경검사",
      dosage: 1,
      dailyDose: 1,
      days: 1,
    },
    {
      id: "rx-003",
      prescriptionDate: "2025-08-10",
      userCode: "E7660",
      claimCode: "E7660",
      name: "결장경검사",
      dosage: 1,
      dailyDose: 1,
      days: 1,
    },
    {
      id: "rx-004",
      prescriptionDate: "2025-08-10",
      userCode: "E7660",
      claimCode: "E7660",
      name: "결장경검사",
      dosage: 1,
      dailyDose: 1,
      days: 1,
    },
  ],
  "p-002": [
    {
      id: "rx-005",
      prescriptionDate: "2025-08-10",
      userCode: "A1234",
      claimCode: "A1234",
      name: "혈액검사",
      dosage: 1,
      dailyDose: 1,
      days: 1,
    },
    {
      id: "rx-006",
      prescriptionDate: "2025-08-10",
      userCode: "B5678",
      claimCode: "B5678",
      name: "소변검사",
      dosage: 1,
      dailyDose: 1,
      days: 1,
    },
  ],
  "p-003": [
    {
      id: "rx-007",
      prescriptionDate: "2026-01-12",
      userCode: "C9012",
      claimCode: "C9012",
      name: "흉부X선검사",
      dosage: 1,
      dailyDose: 1,
      days: 1,
    },
  ],
};

// ── Mock 비동기 함수 (API 시뮬레이션) ─────────────────
const MOCK_DELAY_MS = 300;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 환자별 추가청구 처방 항목 조회 mock */
export const mockGetPrescriptionItems = async (
  patientId: string
): Promise<MockPrescriptionItem[]> => {
  await delay(MOCK_DELAY_MS);
  return MOCK_PRESCRIPTION_ITEMS[patientId] ?? [];
};

/** 청구서 삭제 mock */
export const mockDeleteClaim = async (_id: string): Promise<void> => {
  await delay(MOCK_DELAY_MS);
  // 성공 시뮬레이션
};

/** 청구서 송신(완료) mock */
export const mockCompleteClaim = async (_id: string): Promise<void> => {
  await delay(MOCK_DELAY_MS);
  // 성공 시뮬레이션
};

/** 청구서 생성 mock */
export const mockCreateClaim = async (
  _payload: Record<string, any>
): Promise<{ id: string }> => {
  await delay(MOCK_DELAY_MS);
  return { id: `claim-new-${Date.now()}` };
};

/** 다음 차수 조회 mock */
export const mockGetNextOrder = (): string => "2";
