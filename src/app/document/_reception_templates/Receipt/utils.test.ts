import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transformToReceiptData } from './utils';
import type { MedicalBillReceiptResponseDto } from '@/types/receipt/medical-bill-receipt-types';

vi.mock('@/lib/date-utils', () => ({
  formatDate: vi.fn((date: any, _separator?: string) => {
    if (!date) return '';
    if (date instanceof Date) return '2026-03-04';
    if (typeof date === 'string') return date;
    return '';
  }),
}));

vi.mock('@/lib/patient-utils', () => ({
  formatPhoneNumber: vi.fn((phone: string) => phone || ''),
}));

function makeMinimalReceiptDetail(): MedicalBillReceiptResponseDto {
  return {
    header: {
      patientNo: 'P001',
      patientName: '홍길동',
      visitType: '외래',
      isInterimBill: false,
      department: '내과',
      drgNo: '',
      roomType: '',
      patientCategory: '건강보험',
      nightVisit: false,
      holidayVisit: false,
      treatmentPeriod: { startDate: '2026-03-01', endDate: '2026-03-04' },
      receiptNo: 'R001',
    },
    items: {
      basic: {
        consultation: { insuredCopay: 5000, insurerPayment: 10000, insuredFullPay: 0, uninsured: 0 },
      },
      elective: {},
      totals: { insuredCopay: 5000, insurerPayment: 10000, insuredFullPay: 0, uninsured: 0 },
    },
    summary: {
      totalMedicalExpense: 15000,
      insurerPayment: 10000,
      patientPayment: 5000,
      previouslyPaid: 5000,
      amountDue: 0,
      ceilingExcess: 0,
    },
    payment: {
      card: 5000,
      cashReceipt: 0,
      cash: 0,
      total: 5000,
      outstanding: 0,
      cashReceiptIdentifier: null,
      cashReceiptApprovalNo: null,
    },
    issuance: {
      issueDate: '2026-03-04',
      businessRegistrationNo: '123-45-67890',
      facilityName: '테스트의원',
      address: '서울시 강남구',
      representativeName: '김의사',
      phone: '02-1234-5678',
      facilityType: '의원급',
    },
  } as unknown as MedicalBillReceiptResponseDto;
}

describe('transformToReceiptData', () => {
  it('기본 환자 정보를 올바르게 변환한다', () => {
    const result = transformToReceiptData({
      receiptDetail: makeMinimalReceiptDetail(),
      hospitalInfo: {},
    });

    expect(result.patient.patientNo).toBe('P001');
    expect(result.patient.name).toBe('홍길동');
    expect(result.patient.department).toBe('내과');
  });

  it('제목 정보를 올바르게 매핑한다', () => {
    const result = transformToReceiptData({
      receiptDetail: makeMinimalReceiptDetail(),
      hospitalInfo: {},
    });

    expect(result.title.visitCategory).toBe('외래');
    expect(result.title.isInterimBill).toBe(false);
  });

  describe('visitType 판별', () => {
    it('야간 진료이면 "야간"을 반환한다', () => {
      const detail = makeMinimalReceiptDetail();
      (detail.header as any).nightVisit = true;
      const result = transformToReceiptData({ receiptDetail: detail, hospitalInfo: {} });
      expect(result.patient.visitType).toBe('야간');
    });

    it('공휴일 진료이면 "공휴일"을 반환한다', () => {
      const detail = makeMinimalReceiptDetail();
      (detail.header as any).nightVisit = false;
      (detail.header as any).holidayVisit = true;
      const result = transformToReceiptData({ receiptDetail: detail, hospitalInfo: {} });
      expect(result.patient.visitType).toBe('공휴일');
    });

    it('일반 진료이면 "주간"을 반환한다', () => {
      const result = transformToReceiptData({
        receiptDetail: makeMinimalReceiptDetail(),
        hospitalInfo: {},
      });
      expect(result.patient.visitType).toBe('주간');
    });
  });

  it('수납 내역 항목들을 올바르게 생성한다', () => {
    const result = transformToReceiptData({
      receiptDetail: makeMinimalReceiptDetail(),
      hospitalInfo: {},
    });

    expect(result.fees.items.length).toBeGreaterThan(0);
    const consultation = result.fees.items.find((item) => item.name === '진찰료');
    expect(consultation).toBeDefined();
    expect(consultation!.insuranceCopay).toBe(5000);
    expect(consultation!.insurerPayment).toBe(10000);
  });

  it('합계 정보를 올바르게 매핑한다', () => {
    const result = transformToReceiptData({
      receiptDetail: makeMinimalReceiptDetail(),
      hospitalInfo: {},
    });

    expect(result.fees.totals.insuredCopay ?? result.fees.totals.insuranceCopay).toBe(5000);
  });

  it('요약 정보를 올바르게 매핑한다', () => {
    const result = transformToReceiptData({
      receiptDetail: makeMinimalReceiptDetail(),
      hospitalInfo: {},
    });

    expect(result.summary.totalMedicalFee).toBe(15000);
    expect(result.summary.insurerPayment).toBe(10000);
    expect(result.summary.patientTotalPay).toBe(5000);
    expect(result.summary.paidAmount).toBe(5000);
    expect(result.summary.remainingAmount).toBe(0);
  });

  it('결제 정보를 올바르게 매핑한다', () => {
    const result = transformToReceiptData({
      receiptDetail: makeMinimalReceiptDetail(),
      hospitalInfo: {},
    });

    expect(result.payment.card).toBe(5000);
    expect(result.payment.total).toBe(5000);
    expect(result.payment.outstanding).toBe(0);
  });

  describe('병원 정보 우선순위', () => {
    it('issuance 정보를 우선으로 사용한다', () => {
      const result = transformToReceiptData({
        receiptDetail: makeMinimalReceiptDetail(),
        hospitalInfo: { name: '폴백병원', representative: '폴백대표' },
      });

      expect(result.hospital.name).toBe('테스트의원');
      expect(result.hospital.representative).toBe('김의사');
    });

    it('issuance 정보가 없으면 hospitalInfo를 사용한다', () => {
      const detail = makeMinimalReceiptDetail();
      (detail as any).issuance = {};
      const result = transformToReceiptData({
        receiptDetail: detail,
        hospitalInfo: { name: '병원이름', representative: '대표이름' },
      });

      expect(result.hospital.name).toBe('병원이름');
      expect(result.hospital.representative).toBe('대표이름');
    });
  });

  describe('진료기간 포맷', () => {
    it('시작일과 종료일이 다르면 범위 형식으로 표시한다', () => {
      const result = transformToReceiptData({
        receiptDetail: makeMinimalReceiptDetail(),
        hospitalInfo: {},
      });

      expect(result.patient.visitPeriod).toContain('~');
    });

    it('시작일과 종료일이 같으면 단일 날짜로 표시한다', () => {
      const detail = makeMinimalReceiptDetail();
      (detail.header as any).treatmentPeriod = {
        startDate: '2026-03-04',
        endDate: '2026-03-04',
      };
      const result = transformToReceiptData({ receiptDetail: detail, hospitalInfo: {} });

      expect(result.patient.visitPeriod).not.toContain('~');
    });
  });

  it('누락된 항목은 0으로 기본값을 사용한다', () => {
    const detail = makeMinimalReceiptDetail();
    (detail as any).items = { basic: {}, elective: {}, totals: {} };
    const result = transformToReceiptData({ receiptDetail: detail, hospitalInfo: {} });

    result.fees.items.forEach((item) => {
      expect(item.insuranceCopay).toBe(0);
      expect(item.insurerPayment).toBe(0);
      expect(item.insuranceFullCopay).toBe(0);
      expect(item.nonInsuranceCopay).toBe(0);
    });
  });
});
