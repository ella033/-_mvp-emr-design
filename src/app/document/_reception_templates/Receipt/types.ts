import { MedicalBillReceiptResponseDto } from '@/types/receipt/medical-bill-receipt-types';

export type ReceiptItemData = {
  name: string;
  insuranceCopay: number;      // 급여 본인부담금
  insurerPayment: number;      // 급여 공단부담금
  insuranceFullCopay: number;  // 급여 전액본인부담
  nonInsuranceCopay: number;   // 비급여 본인부담금
};

export type ReceiptData = {
  /** 제목부: 외래/입원, 퇴원/중간 */
  title: {
    visitCategory: string;   // '외래' | '입원'
    isInterimBill: boolean; // 중간 청구 여부 (true: 중간, false: 퇴원)
  };
  patient: {
    patientNo: string; // 환자등록번호
    name: string;              // 성명
    visitPeriod: string;        // 진료기간
    visitType: string;         // 야간(공휴일)진료 여부
    department: string;        // 진료과목
    drgNumber: string;         // 질병군(DRG)번호
    room: string;              // 병실
    patientType: string;       // 환자구분
  };
  fees: {
    items: ReceiptItemData[];
    totals: {
      insuranceCopay: number;
      insurerPayment: number;
      insuranceFullCopay: number;
      nonInsuranceCopay: number;
      selectiveCopay: number;
    };
  };
  summary: {
    totalMedicalFee: number;    // 진료비 총액 (①+②+③+④)
    insurerPayment: number;     // 공단부담 총액 (②+⑤)
    patientTotalPay: number;    // 환자부담총액 (①+②+④)
    paidAmount: number;         // 수납금액
    remainingAmount: number;    // 미수금
    excessAmount: number;       // 상한액 초과금 (⑤)
  };
  payment: {
    card: number;
    cashReceipt: number;
    cash: number;
    total: number;
    outstanding: number;
    cashReceiptIdentifier: string | null;
    cashReceiptApprovalNo: string | null;
  };
  hospital: {
    businessNumber: string;     // 사업자등록번호
    name: string;               // 상호
    address: string;            // 소재지
    representative: string;     // 대표자
    phone: string;              // 전화번호
    facilityType: string;       // 요양기관 종류
  };
  receiptDate: string;          // 발행일
  receiptNumber: string;        // 발행번호
};

export interface ReceiptProps {
  receiptDetail: MedicalBillReceiptResponseDto;
  margin?: number;
  onPageCountChange?: (count: number) => void;
}
