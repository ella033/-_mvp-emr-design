import { describe, it, expect, vi } from 'vitest';
import {
  transformToMedicalExpenseData,
  transformDetailedStatementToMedicalExpenseData,
} from './utils';
import type { DetailedStatementResponse } from '@/types/document';

vi.mock('@/lib/date-utils', () => ({
  formatDate: vi.fn((date: any, _separator?: string) => {
    if (!date) return '';
    if (date instanceof Date) return '2026-03-04';
    if (typeof date === 'string') return date;
    return '';
  }),
}));

describe('transformToMedicalExpenseData', () => {
  function makeEncounter(overrides: any = {}) {
    return {
      encounterDateTime: '2026-03-01',
      patient: { patientNo: 'P001', name: '홍길동' },
      calcResultData: {
        항목별내역s: [
          {
            코드: 'AA100',
            명칭: '진찰료',
            금액: 5000,
            횟수: 1,
            일수: 1,
            총액: 5000,
            본인부담금: 2000,
            공단부담금: 3000,
            전액본인부담금: 0,
            비급여금: 0,
            항목: '진찰',
          },
        ],
      },
      ...overrides,
    };
  }

  const baseHospitalInfo = { name: '테스트의원', representative: '김의사' };

  it('단일 내원이력에서 환자 정보를 올바르게 매핑한다', () => {
    const result = transformToMedicalExpenseData({
      encounters: [makeEncounter()],
      hospitalInfo: baseHospitalInfo,
    });

    expect(result.patient.patientNo).toBe('P001');
    expect(result.patient.name).toBe('홍길동');
    expect(result.patient.room).toBe('외래');
    expect(result.patient.patientType).toBe('건강보험');
  });

  it('항목별 내역을 날짜별로 그룹핑한다', () => {
    const result = transformToMedicalExpenseData({
      encounters: [makeEncounter()],
      hospitalInfo: baseHospitalInfo,
    });

    expect(Object.keys(result.itemsByDate)).toHaveLength(1);
    const items = result.itemsByDate['2026-03-01'];
    expect(items).toBeDefined();
    expect(items).toHaveLength(1);
    expect(items[0].code).toBe('AA100');
    expect(items[0].name).toBe('진찰료');
    expect(items[0].total).toBe(5000);
  });

  it('여러 내원이력의 항목을 날짜별로 합친다', () => {
    const encounters = [
      makeEncounter({ encounterDateTime: '2026-03-01' }),
      makeEncounter({
        encounterDateTime: '2026-03-02',
        calcResultData: {
          항목별내역s: [
            { 코드: 'BB200', 명칭: '주사료', 금액: 3000, 횟수: 1, 일수: 1, 총액: 3000, 본인부담금: 1000, 공단부담금: 2000, 전액본인부담금: 0, 비급여금: 0, 항목: '주사' },
          ],
        },
      }),
    ];

    const result = transformToMedicalExpenseData({
      encounters,
      hospitalInfo: baseHospitalInfo,
    });

    expect(Object.keys(result.itemsByDate)).toHaveLength(2);
    expect(result.itemsByDate['2026-03-01']).toHaveLength(1);
    expect(result.itemsByDate['2026-03-02']).toHaveLength(1);
  });

  it('합계를 올바르게 계산한다', () => {
    const result = transformToMedicalExpenseData({
      encounters: [makeEncounter()],
      hospitalInfo: baseHospitalInfo,
    });

    expect(result.totals.subtotal.total).toBe(5000);
    expect(result.totals.subtotal.insuranceCopay).toBe(2000);
    expect(result.totals.subtotal.publicInsurance).toBe(3000);
  });

  it('항목별 내역이 없는 내원이력을 처리한다', () => {
    const result = transformToMedicalExpenseData({
      encounters: [makeEncounter({ calcResultData: {} })],
      hospitalInfo: baseHospitalInfo,
    });

    const allItems = Object.values(result.itemsByDate).flat();
    expect(allItems).toHaveLength(0);
    expect(result.totals.subtotal.total).toBe(0);
  });

  it('병원 정보를 올바르게 매핑한다', () => {
    const result = transformToMedicalExpenseData({
      encounters: [makeEncounter()],
      hospitalInfo: baseHospitalInfo,
    });

    expect(result.hospital.name).toBe('테스트의원');
    expect(result.hospital.representative).toBe('김의사');
  });

  it('병원 정보가 없으면 기본값을 사용한다', () => {
    const result = transformToMedicalExpenseData({
      encounters: [makeEncounter()],
      hospitalInfo: {},
    });

    expect(result.hospital.name).toBe('(주)녹십자홀딩스 부속의원');
    expect(result.hospital.representative).toBe('허용준');
  });

  it('adjustment는 0으로 초기화된다', () => {
    const result = transformToMedicalExpenseData({
      encounters: [makeEncounter()],
      hospitalInfo: baseHospitalInfo,
    });

    expect(result.totals.adjustment.total).toBe(0);
    expect(result.totals.adjustment.insuranceCopay).toBe(0);
  });

  it('applicantRelation이 "본인"으로 설정된다', () => {
    const result = transformToMedicalExpenseData({
      encounters: [makeEncounter()],
      hospitalInfo: baseHospitalInfo,
    });

    expect(result.applicantRelation).toBe('본인');
  });
});

describe('transformDetailedStatementToMedicalExpenseData', () => {
  function makeDetailedStatement(
    overrides: Partial<DetailedStatementResponse> = {}
  ): DetailedStatementResponse {
    return {
      header: {
        patientNo: 'P001',
        patientName: '홍길동',
        treatmentPeriod: { startDate: '2026-03-01', endDate: '2026-03-04' },
        roomType: '외래',
        patientCategory: '건강보험',
        patientCategoryDescription: '건강보험',
        remarks: null,
      },
      items: [
        {
          category: '진찰',
          serviceDate: '2026-03-01',
          code: 'AA100',
          name: '진찰료',
          unitPrice: 5000,
          quantity: 1,
          days: 1,
          totalAmount: 5000,
          payment: {
            insuredCopay: 2000,
            insuredFullPay: 0,
            insurerPay: 3000,
            uninsured: 0,
          },
        },
      ],
      summary: {
        subtotal: { totalAmount: 5000, insuredCopay: 2000, insuredFullPay: 0, insurerPay: 3000, uninsured: 0 },
        adjustment: { totalAmount: 0, insuredCopay: 0, insuredFullPay: 0, insurerPay: 0, uninsured: 0 },
        grandTotal: { totalAmount: 5000, insuredCopay: 2000, insuredFullPay: 0, insurerPay: 3000, uninsured: 0 },
      },
      issuance: {
        issueDate: '2026-03-04',
        applicantName: '홍길동',
        applicantRelation: '본인',
        facilityName: '테스트의원',
        representativeName: '김의사',
      },
      ...overrides,
    };
  }

  it('환자 정보를 올바르게 매핑한다', () => {
    const result = transformDetailedStatementToMedicalExpenseData(makeDetailedStatement());

    expect(result.patient.patientNo).toBe('P001');
    expect(result.patient.name).toBe('홍길동');
    expect(result.patient.room).toBe('외래');
    expect(result.patient.patientType).toBe('건강보험');
  });

  it('진료기간이 다르면 범위 형식으로 표시한다', () => {
    const result = transformDetailedStatementToMedicalExpenseData(makeDetailedStatement());
    expect(result.patient.visitPeriod).toBe('2026-03-01~2026-03-04');
  });

  it('진료기간 시작일과 종료일이 같으면 단일 날짜로 표시한다', () => {
    const stmt = makeDetailedStatement();
    stmt.header.treatmentPeriod = { startDate: '2026-03-01', endDate: '2026-03-01' };
    const result = transformDetailedStatementToMedicalExpenseData(stmt);
    expect(result.patient.visitPeriod).toBe('2026-03-01');
  });

  it('항목을 날짜별로 그룹핑한다', () => {
    const result = transformDetailedStatementToMedicalExpenseData(makeDetailedStatement());
    expect(result.itemsByDate['2026-03-01']).toBeDefined();
    expect(result.itemsByDate['2026-03-01']).toHaveLength(1);
  });

  it('항목의 금액 정보를 올바르게 변환한다', () => {
    const result = transformDetailedStatementToMedicalExpenseData(makeDetailedStatement());
    const item = result.itemsByDate['2026-03-01'][0];

    expect(item.code).toBe('AA100');
    expect(item.name).toBe('진찰료');
    expect(item.amount).toBe(5000);
    expect(item.total).toBe(5000);
    expect(item.insuranceCopay).toBe(2000);
    expect(item.publicInsurance).toBe(3000);
  });

  it('요약 정보를 올바르게 매핑한다', () => {
    const result = transformDetailedStatementToMedicalExpenseData(makeDetailedStatement());

    expect(result.totals.subtotal.total).toBe(5000);
    expect(result.totals.subtotal.insuranceCopay).toBe(2000);
    expect(result.totals.adjustment.total).toBe(0);
    expect(result.totals.grandTotal.total).toBe(5000);
  });

  it('병원 및 발급 정보를 올바르게 매핑한다', () => {
    const result = transformDetailedStatementToMedicalExpenseData(makeDetailedStatement());

    expect(result.hospital.name).toBe('테스트의원');
    expect(result.hospital.representative).toBe('김의사');
    expect(result.issuedAt).toBe('2026-03-04');
    expect(result.applicantRelation).toBe('본인');
  });

  it('항목이 빈 배열이면 fallback 날짜를 사용한다', () => {
    const stmt = makeDetailedStatement({ items: [] });
    const result = transformDetailedStatementToMedicalExpenseData(stmt);

    expect(result.itemsByDate['2026-03-01']).toBeDefined();
    expect(result.itemsByDate['2026-03-01']).toHaveLength(0);
  });

  it('items가 undefined이면 빈 배열로 처리한다', () => {
    const stmt = makeDetailedStatement();
    (stmt as any).items = undefined;
    const result = transformDetailedStatementToMedicalExpenseData(stmt);

    const allItems = Object.values(result.itemsByDate).flat();
    expect(allItems).toHaveLength(0);
  });

  it('remarks가 null이면 빈 문자열로 처리한다', () => {
    const result = transformDetailedStatementToMedicalExpenseData(makeDetailedStatement());
    expect(result.patient.remarks).toBe('');
  });

  it('applicantRelation이 없으면 "본인"으로 기본값을 사용한다', () => {
    const stmt = makeDetailedStatement();
    (stmt.issuance as any).applicantRelation = undefined;
    const result = transformDetailedStatementToMedicalExpenseData(stmt);
    expect(result.applicantRelation).toBe('본인');
  });
});
