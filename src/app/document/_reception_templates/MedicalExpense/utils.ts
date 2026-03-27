import { MedicalExpenseData, MedicalExpenseItem } from './types';
import { formatDate } from '@/lib/date-utils';
import type { DetailedStatementResponse } from '@/types/document';

export function transformToMedicalExpenseData(params: {
  encounters: any[];
  hospitalInfo: any;
}): MedicalExpenseData {
  const { encounters, hospitalInfo } = params;
  
  // 환자 정보는 첫 번째 encounter에서 가져옴 (가정)
  const firstEncounter = encounters[0];
  const patient = firstEncounter?.patient;

  const itemsByDate: Record<string, MedicalExpenseItem[]> = {};
  
  encounters.forEach(encounter => {
    const date = formatDate(encounter.encounterDateTime, '-');
    if (!itemsByDate[date]) {
      itemsByDate[date] = [];
    }

    const calcItems = encounter.calcResultData?.항목별내역s || [];
    calcItems.forEach((item: any) => {
      itemsByDate[date].push({
        date,
        code: item.코드 || '',
        name: item.명칭 || item.항목명 || '',
        amount: item.금액 || 0,
        count: item.횟수 || 1,
        days: item.일수 || 1,
        total: item.총액 || 0,
        insuranceCopay: item.본인부담금 || 0,
        publicInsurance: item.공단부담금 || 0,
        insuranceFullCopay: item.전액본인부담금 || 0,
        nonInsuranceCopay: item.비급여금 || 0,
        category: item.항목 || '',
      });
    });
  });

  // 합계 계산
  const allItems = Object.values(itemsByDate).flat();
  const computed = {
    total: allItems.reduce((sum, item) => sum + item.total, 0),
    insuranceCopay: allItems.reduce((sum, item) => sum + item.insuranceCopay, 0),
    insuranceFullCopay: allItems.reduce((sum, item) => sum + item.insuranceFullCopay, 0),
    nonInsuranceCopay: allItems.reduce((sum, item) => sum + item.nonInsuranceCopay, 0),
    publicInsurance: allItems.reduce((sum, item) => sum + item.publicInsurance, 0),
  };
  const zeroAmounts = {
    total: 0,
    insuranceCopay: 0,
    insuranceFullCopay: 0,
    nonInsuranceCopay: 0,
    publicInsurance: 0,
  };

  return {
    patient: {
      patientNo: String(patient?.patientNo ?? ''),
      name: patient?.name || '',
      visitPeriod: firstEncounter?.encounterDateTime ? formatDate(firstEncounter.encounterDateTime, '-') : '',
      room: '외래',
      patientType: '건강보험',
      remarks: '',
    },
    itemsByDate,
    totals: {
      subtotal: computed,
      adjustment: zeroAmounts,
      grandTotal: computed,
    },
    hospital: {
      name: hospitalInfo?.name || '(주)녹십자홀딩스 부속의원',
      representative: hospitalInfo?.representative || '허용준',
    },
    issuedAt: formatDate(new Date(), '-'),
    applicantRelation: '본인',
  };
}

export function transformDetailedStatementToMedicalExpenseData(
  detailedStatement: DetailedStatementResponse
): MedicalExpenseData {
  const { header, summary, issuance } = detailedStatement;
  const resolvedItems = Array.isArray(detailedStatement.items)
    ? detailedStatement.items
    : [];
  const itemsByDate: Record<string, MedicalExpenseItem[]> = {};

  resolvedItems.forEach((item) => {
    const date = item.serviceDate || header.treatmentPeriod.startDate || "";
    if (!itemsByDate[date]) {
      itemsByDate[date] = [];
    }

    itemsByDate[date].push({
      date,
      code: item.code || "",
      name: item.name || "",
      amount: Number(item.unitPrice ?? 0),
      count: Number(item.quantity ?? 0),
      days: Number(item.days ?? 0),
      total: Number(item.totalAmount ?? 0),
      insuranceCopay: Number(item.payment?.insuredCopay ?? 0),
      publicInsurance: Number(item.payment?.insurerPay ?? 0),
      insuranceFullCopay: Number(item.payment?.insuredFullPay ?? 0),
      nonInsuranceCopay: Number(item.payment?.uninsured ?? 0),
      category: item.category || "",
      isBundleChild: item.isBundleChild,
    });
  });

  if (resolvedItems.length === 0) {
    const fallbackDate = header.treatmentPeriod.startDate || "";
    itemsByDate[fallbackDate] = [];
  }

  const { startDate, endDate } = header.treatmentPeriod;
  const hasSamePeriod = startDate === endDate;
  const visitPeriod = hasSamePeriod ? startDate : `${startDate}~${endDate}`;

  const mapSummary = (s: { totalAmount: number; insuredCopay: number; insuredFullPay: number; uninsured: number; insurerPay: number }) => ({
    total: s.totalAmount,
    insuranceCopay: s.insuredCopay,
    insuranceFullCopay: s.insuredFullPay,
    nonInsuranceCopay: s.uninsured,
    publicInsurance: s.insurerPay,
  });

  return {
    patient: {
      patientNo: header.patientNo ?? '',
      name: header.patientName,
      visitPeriod,
      room: header.roomType,
      patientType: header.patientCategory,
      remarks: header.remarks ?? '',
    },
    itemsByDate,
    totals: {
      subtotal: mapSummary(summary.subtotal),
      adjustment: mapSummary(summary.adjustment),
      grandTotal: mapSummary(summary.grandTotal),
    },
    hospital: {
      name: issuance.facilityName,
      representative: issuance.representativeName,
    },
    issuedAt: issuance.issueDate,
    applicantRelation: issuance.applicantRelation ?? '본인',
  };
}
