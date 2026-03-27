import type {
  MedicalBillReceiptResponseDto,
  PaymentAmountDto,
  BasicItemsDto,
  ElectiveItemsDto,
  HospitalizationRoomDto,
  SummaryDto,
  PaymentDto,
  ItemsDto,
} from "@/types/receipt/medical-bill-receipt-types";
import type {
  DetailedStatementResponse,
  DetailedStatementSummaryAmounts,
} from "@/types/document/detailed-statement-types";
import { formatDate } from "@/lib/date-utils";

// ─── 공통 헬퍼 ──────────────────────────────────────────────

const ZERO_PAYMENT_AMOUNT: PaymentAmountDto = {
  insuredCopay: 0,
  insuredFullPay: 0,
  insurerPayment: 0,
  uninsured: 0,
};

const ZERO_STATEMENT_SUMMARY: DetailedStatementSummaryAmounts = {
  totalAmount: 0,
  insuredCopay: 0,
  insuredFullPay: 0,
  insurerPay: 0,
  uninsured: 0,
};

function addPaymentAmounts(
  a: PaymentAmountDto | undefined,
  b: PaymentAmountDto | undefined
): PaymentAmountDto {
  const safeA = a ?? ZERO_PAYMENT_AMOUNT;
  const safeB = b ?? ZERO_PAYMENT_AMOUNT;
  return {
    insuredCopay: safeA.insuredCopay + safeB.insuredCopay,
    insuredFullPay: safeA.insuredFullPay + safeB.insuredFullPay,
    insurerPayment: safeA.insurerPayment + safeB.insurerPayment,
    uninsured: safeA.uninsured + safeB.uninsured,
  };
}

function addStatementSummaryAmounts(
  a: DetailedStatementSummaryAmounts,
  b: DetailedStatementSummaryAmounts
): DetailedStatementSummaryAmounts {
  return {
    totalAmount: a.totalAmount + b.totalAmount,
    insuredCopay: a.insuredCopay + b.insuredCopay,
    insuredFullPay: a.insuredFullPay + b.insuredFullPay,
    insurerPay: a.insurerPay + b.insurerPay,
    uninsured: a.uninsured + b.uninsured,
  };
}

/** 날짜 문자열 배열에서 가장 이른 날짜를 반환 */
function getEarliestDate(dates: string[]): string {
  const valid = dates.filter(Boolean);
  if (valid.length === 0) return "";
  return valid.sort()[0]!;
}

/** 날짜 문자열 배열에서 가장 늦은 날짜를 반환 */
function getLatestDate(dates: string[]): string {
  const valid = dates.filter(Boolean);
  if (valid.length === 0) return "";
  return valid.sort().at(-1)!;
}

// ─── 영수증 병합 ──────────────────────────────────────────────

function addHospitalizationRooms(
  a: HospitalizationRoomDto | undefined,
  b: HospitalizationRoomDto | undefined
): HospitalizationRoomDto {
  return {
    singleRoom: addPaymentAmounts(a?.singleRoom, b?.singleRoom),
    twoThreePersonRoom: addPaymentAmounts(a?.twoThreePersonRoom, b?.twoThreePersonRoom),
    fourPlusPersonRoom: addPaymentAmounts(a?.fourPlusPersonRoom, b?.fourPlusPersonRoom),
  };
}

function addBasicItems(
  a: BasicItemsDto | undefined,
  b: BasicItemsDto | undefined
): BasicItemsDto {
  return {
    consultation: addPaymentAmounts(a?.consultation, b?.consultation),
    hospitalization: addHospitalizationRooms(a?.hospitalization, b?.hospitalization),
    meals: addPaymentAmounts(a?.meals, b?.meals),
    medicationService: addPaymentAmounts(a?.medicationService, b?.medicationService),
    medicationDrug: addPaymentAmounts(a?.medicationDrug, b?.medicationDrug),
    injectionService: addPaymentAmounts(a?.injectionService, b?.injectionService),
    injectionDrug: addPaymentAmounts(a?.injectionDrug, b?.injectionDrug),
    anesthesia: addPaymentAmounts(a?.anesthesia, b?.anesthesia),
    procedureSurgery: addPaymentAmounts(a?.procedureSurgery, b?.procedureSurgery),
    labTest: addPaymentAmounts(a?.labTest, b?.labTest),
    imaging: addPaymentAmounts(a?.imaging, b?.imaging),
    radiationTherapy: addPaymentAmounts(a?.radiationTherapy, b?.radiationTherapy),
    medicalSupplies: addPaymentAmounts(a?.medicalSupplies, b?.medicalSupplies),
    rehabilitation: addPaymentAmounts(a?.rehabilitation, b?.rehabilitation),
    mentalHealth: addPaymentAmounts(a?.mentalHealth, b?.mentalHealth),
    bloodProducts: addPaymentAmounts(a?.bloodProducts, b?.bloodProducts),
  };
}

function addElectiveItems(
  a: ElectiveItemsDto | undefined,
  b: ElectiveItemsDto | undefined
): ElectiveItemsDto {
  return {
    ct: addPaymentAmounts(a?.ct, b?.ct),
    mri: addPaymentAmounts(a?.mri, b?.mri),
    pet: addPaymentAmounts(a?.pet, b?.pet),
    ultrasound: addPaymentAmounts(a?.ultrasound, b?.ultrasound),
    prostheticsOrthodontics: addPaymentAmounts(a?.prostheticsOrthodontics, b?.prostheticsOrthodontics),
    certificates: addPaymentAmounts(a?.certificates, b?.certificates),
    selectiveCoverage: addPaymentAmounts(a?.selectiveCoverage, b?.selectiveCoverage),
    seniorFixedRate: addPaymentAmounts(a?.seniorFixedRate, b?.seniorFixedRate),
    longTermCareFixed: addPaymentAmounts(a?.longTermCareFixed, b?.longTermCareFixed),
    palliativeCareFixed: addPaymentAmounts(a?.palliativeCareFixed, b?.palliativeCareFixed),
    drgPackage: addPaymentAmounts(a?.drgPackage, b?.drgPackage),
    other: addPaymentAmounts(a?.other, b?.other),
  };
}

function addItems(a: ItemsDto, b: ItemsDto): ItemsDto {
  return {
    basic: addBasicItems(a.basic, b.basic),
    elective: addElectiveItems(a.elective, b.elective),
    totals: addPaymentAmounts(a.totals, b.totals),
  };
}

function addSummary(a: SummaryDto, b: SummaryDto): SummaryDto {
  return {
    totalMedicalExpense: a.totalMedicalExpense + b.totalMedicalExpense,
    insurerPayment: a.insurerPayment + b.insurerPayment,
    patientPayment: a.patientPayment + b.patientPayment,
    ceilingExcess: a.ceilingExcess + b.ceilingExcess,
    previouslyPaid: a.previouslyPaid + b.previouslyPaid,
    amountDue: a.amountDue + b.amountDue,
  };
}

function addPayment(a: PaymentDto, b: PaymentDto): PaymentDto {
  return {
    card: a.card + b.card,
    cashReceipt: a.cashReceipt + b.cashReceipt,
    cash: a.cash + b.cash,
    total: a.total + b.total,
    outstanding: a.outstanding + b.outstanding,
    cashReceiptIdentifier: a.cashReceiptIdentifier,
    cashReceiptApprovalNo: a.cashReceiptApprovalNo,
  };
}

/**
 * 여러 영수증(MedicalBillReceiptResponseDto)을 하나로 병합합니다.
 * - 항목별 금액: 모두 합산
 * - 환자 정보: 첫 번째 영수증 기준
 * - 진료기간: 가장 이른 시작일 ~ 가장 늦은 종료일
 */
export function mergeMedicalBillReceipts(
  receipts: MedicalBillReceiptResponseDto[]
): MedicalBillReceiptResponseDto {
  if (receipts.length === 0) {
    throw new Error("병합할 영수증 데이터가 없습니다.");
  }

  if (receipts.length === 1) {
    return receipts[0]!;
  }

  const first = receipts[0]!;

  // 진료기간 계산: 전체 중 가장 이른 startDate ~ 가장 늦은 endDate
  const allStartDates = receipts.map((r) => r.header.treatmentPeriod.startDate);
  const allEndDates = receipts.map((r) => r.header.treatmentPeriod.endDate);
  const mergedTreatmentPeriod = {
    startDate: getEarliestDate(allStartDates),
    endDate: getLatestDate(allEndDates),
  };

  // items, summary, payment 합산
  const mergedItems = receipts.slice(1).reduce(
    (acc, receipt) => addItems(acc, receipt.items),
    first.items
  );

  const mergedSummary = receipts.slice(1).reduce(
    (acc, receipt) => addSummary(acc, receipt.summary),
    first.summary
  );

  const mergedPayment = receipts.slice(1).reduce(
    (acc, receipt) => addPayment(acc, receipt.payment),
    first.payment
  );

  return {
    header: {
      ...first.header,
      treatmentPeriod: mergedTreatmentPeriod,
      receiptNo: "",
    },
    items: mergedItems,
    summary: mergedSummary,
    payment: mergedPayment,
    issuance: {
      ...first.issuance,
      issueDate: formatDate(new Date(), "-"),
    },
  };
}

// ─── 진료비내역서 병합 ──────────────────────────────────────────

/**
 * 여러 진료비내역서(DetailedStatementResponse)를 하나로 병합합니다.
 * - 항목 리스트: 모두 이어 붙인 후 serviceDate 기준 오름차순 정렬
 * - 합계: 모두 합산
 * - 환자 정보: 첫 번째 내역서 기준
 * - 진료기간: 가장 이른 시작일 ~ 가장 늦은 종료일
 */
export function mergeDetailedStatements(
  statements: DetailedStatementResponse[]
): DetailedStatementResponse {
  if (statements.length === 0) {
    throw new Error("병합할 진료비내역서 데이터가 없습니다.");
  }

  if (statements.length === 1) {
    return statements[0]!;
  }

  const first = statements[0]!;

  // 진료기간 계산
  const allStartDates = statements.map((s) => s.header.treatmentPeriod.startDate);
  const allEndDates = statements.map((s) => s.header.treatmentPeriod.endDate);
  const mergedTreatmentPeriod = {
    startDate: getEarliestDate(allStartDates),
    endDate: getLatestDate(allEndDates),
  };

  // 항목 리스트: 이어 붙인 후 serviceDate 기준 오름차순 정렬
  const mergedItems = statements
    .flatMap((s) => s.items ?? [])
    .sort((a, b) => a.serviceDate.localeCompare(b.serviceDate));

  // summary 합산
  const mergedSummary = statements.slice(1).reduce(
    (acc, statement) => ({
      subtotal: addStatementSummaryAmounts(acc.subtotal, statement.summary.subtotal),
      adjustment: addStatementSummaryAmounts(acc.adjustment, statement.summary.adjustment),
      grandTotal: addStatementSummaryAmounts(acc.grandTotal, statement.summary.grandTotal),
    }),
    { ...first.summary }
  );

  return {
    header: {
      ...first.header,
      treatmentPeriod: mergedTreatmentPeriod,
    },
    items: mergedItems,
    summary: mergedSummary,
    issuance: {
      ...first.issuance,
      issueDate: formatDate(new Date(), "-"),
    },
  };
}
