import { Patient } from '@/types/patient-types';
import { Encounter } from '@/types/chart/encounter-types';

export interface MedicalExpenseItem {
  date: string;
  code: string;
  name: string;
  amount: number;
  count: number;
  days: number;
  total: number;
  insuranceCopay: number;
  publicInsurance: number;
  insuranceFullCopay: number;
  nonInsuranceCopay: number;
  category: string;
  isBundleChild?: boolean;
}

export interface MedicalExpenseSummaryAmounts {
  total: number;
  insuranceCopay: number;
  insuranceFullCopay: number;
  nonInsuranceCopay: number;
  publicInsurance: number;
}

export interface MedicalExpenseData {
  patient: {
    patientNo: string;
    name: string;
    visitPeriod: string;
    room: string;
    patientType: string;
    remarks: string;
  };
  itemsByDate: Record<string, MedicalExpenseItem[]>;
  totals: {
    subtotal: MedicalExpenseSummaryAmounts;
    adjustment: MedicalExpenseSummaryAmounts;
    grandTotal: MedicalExpenseSummaryAmounts;
  };
  hospital: {
    name: string;
    representative: string;
  };
  issuedAt: string;
  applicantRelation: string;
}

export interface MedicalExpenseProps {
  data: MedicalExpenseData;
  /** 합본 출력 모드: 날짜별 페이지 분리 없이 하나의 연속 문서로 렌더링 */
  isCombined?: boolean;
  margin?: number;
  onPageCountChange?: (count: number) => void;
}
