import { ApiClient } from "@/lib/api/api-client";
import { paymentsApi } from "@/lib/api/routes/payments-api";
import { CashApprovalMethod, PaymentSource, PaymentProvider, CashType, 접수상태 } from "@/constants/common/common-enum";
import { calcPaymentAmounts } from "@/lib/calc-result-data-util";
import type { Registration } from "@/types/registration-types";
import type { Patient } from "@/types/patient-types";
import type { ReceiptDetailsResponse } from "@/types/receipt/receipt-details-types";
import type { Reception } from "@/types/common/reception-types";
import type { PaymentData, PaymentsListParams, CancelPaymentRequest } from "@/types/payment-types";
import type { Encounter } from "@/types/chart/encounter-types";
import type { ReceiptAdjustmentBase } from "@/types/receipt/receipt-adjustment-types";
import type { PaymentInfoRequest } from "@/types/receipt/payments-info-types";
import type { BillingRequest, BillingSettlementRequest } from "@/types/billing-types";
import { ReceiptService } from "./receipt-service";
import { EncountersService } from "./encounters-service";
import { ReceptionService } from "./reception-service";
import { getIdentificationTypeFromApprovalMethod } from "@/lib/payments-utils";
import type { CreditCardApprovalItem } from "@/types/payment/credit-card-approval-types";
import { unformatPhoneNumber, unformatRrn } from "@/lib/patient-utils";

/** PaymentData 결정 소스 */
export type PaymentDataSource = "receipt" | "calcResult" | "default";
/** PaymentData 결정 과정에서 인지 가능한(throw 하지 않는) 이슈 */
export type PaymentDataIssue = "MISSING_ACTIVE_RECEIPT_WHEN_COMPLETED";
export interface PaymentDataResolution {
  paymentData: PaymentData;
  source: PaymentDataSource;
  issues: PaymentDataIssue[];
}

/** 수납 기본 폼데이터 타입 */
export type PaymentFormData = {
  receivedAmount: string;
  receiptMemo: string;
  isCardChecked: boolean;
  isCashChecked: boolean;
  installment: string;
  cardAmount: string;
  cashAmount: string;
  transferAmount: string;
  isCashReceiptChecked: boolean;
  cashReceiptAmount: string;
  approvalMethod: CashApprovalMethod | "";
  approvalNumber: string;
  isTerminal: boolean;
  cardApprovalNumber: string;
};

export class PaymentsServices {
  // #region API 호출 — 서버와 직접 통신하는 함수

  /** [API] 결제 목록 조회 (기간·환자 등 조건 필터) */
  static async getPayments<T = any>(params: PaymentsListParams): Promise<T> {
    const response = await ApiClient.get<any>(paymentsApi.list(params));
    return response ?? ([] as T);
  }

  /** [API] 기간별 결제 통계 조회 (일별 수납 현황 등) */
  static async getPaymentStatistics<T = any>(startDate?: string, endDate?: string): Promise<T> {
    const response = await ApiClient.get<any>(paymentsApi.statistics(startDate, endDate));
    return response ?? ([] as T);
  }

  /** [API] 개별 결제 상세 조회 (카드 승인 내역 등) */
  static async getPaymentDetail(paymentId: string): Promise<CreditCardApprovalItem> {
    try {
      const response = await ApiClient.get<any>(paymentsApi.detail(paymentId));
      if (!response) {
        throw new Error("결제 정보를 찾을 수 없습니다.");
      }
      return response;
    } catch (error: any) {
      throw new Error(error?.message || "결제 상세 조회 실패");
    }
  }

  /** [API] 결제 취소 요청 (카드·현금 취소 등) */
  static async cancelPayment(id: string, request: CancelPaymentRequest): Promise<void> {
    await ApiClient.patch<void>(paymentsApi.cancel(id), request);
  }

  /**
   * [API] patientId, encounterId 기반 "활성 영수증 상세" 조회 (서비스 단일 진입점)
   * - 활성 영수증이 없거나 상세를 불러오지 못하면 [] 반환 (throw 하지 않음)
   */
  static async getActiveReceiptDetails(
    patientId: string,
    encounterId: string
  ): Promise<ReceiptDetailsResponse[]> {
    if (!patientId || !encounterId) return [];
    return await PaymentsServices.fetchActiveReceiptDetails(patientId, encounterId);
  }

  /**
   * [API] 활성 영수증 상세 조회의 실제 구현 (내부용)
   * - 영수증 목록 → 활성 ID 필터 → 개별 상세 조회 (병렬)
   * - 실패 건은 200ms 후 1회 재시도 (서버 eventual consistency 대응)
   */
  private static async fetchActiveReceiptDetails(
    patientId: string,
    encounterId: string
  ): Promise<ReceiptDetailsResponse[]> {
    const receiptList = (await ReceiptService.getReceiptList(
      patientId,
      encounterId,
      "",
      "",
      ""
    )) as any[];

    const activeReceiptIds = PaymentsServices.getActiveReceiptIds(receiptList as any);
    if (activeReceiptIds.length === 0) {
      return [];
    }

    const settledReceipts = await Promise.allSettled(
      activeReceiptIds.map((receiptId) => ReceiptService.getReceipt(receiptId))
    );
    const fulfilled = settledReceipts
      .filter(
        (result): result is PromiseFulfilledResult<ReceiptDetailsResponse> =>
          result.status === "fulfilled"
      )
      .map((result) => result.value);

    const rejectedIds = settledReceipts
      .map((r, idx) => ({ r, receiptId: activeReceiptIds[idx] }))
      .filter(({ r }) => r.status === "rejected")
      .map(({ receiptId }) => receiptId)
      .filter((id): id is string => Boolean(id));

    if (rejectedIds.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const retrySettled = await Promise.allSettled(
        rejectedIds.map((receiptId) => ReceiptService.getReceipt(receiptId))
      );
      const retriedFulfilled = retrySettled
        .filter(
          (result): result is PromiseFulfilledResult<ReceiptDetailsResponse> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);

      const merged = [...fulfilled, ...retriedFulfilled];
      const byId = new Map<string, ReceiptDetailsResponse>();
      for (const r of merged) {
        if (r?.id) byId.set(String(r.id), r);
      }
      return Array.from(byId.values());
    }

    return fulfilled;
  }

  /**
   * [API] Registration 기반 Encounter 조회
   * - use-payment-index.ts의 useEncounter(encounterId) 흐름을 서비스로 제공
   */
  static async getReceptionEncounterFromRegistration(
    registration: Registration
  ): Promise<Encounter | null> {
    if (!registration) return null;
    const encounterId = registration.encounters?.[0]?.id ?? null;
    if (!encounterId) return null;
    return await EncountersService.getEncounter(encounterId);
  }

  // #endregion

  // #region 보조 유틸 — 데이터 추출 · 변환 · 기본값

  /**
   * encounters 배열에서 "최신" encounter를 선택 (encounterDateTime 기준 내림차순)
   * - 배열 순서가 보장되지 않는 케이스가 있어 [0] 직접 사용 금지
   * - encounterDateTime이 없으면 id 존재 여부 기준으로 fallback
   */
  static getLatestEncounter<T extends { id?: string | null; encounterDateTime?: any }>(
    encounters?: T[] | null
  ): T | null {
    if (!encounters || encounters.length === 0) return null;

    const withId = encounters.filter((e) => e && e.id);
    if (withId.length === 0) return null;

    const sorted = [...withId].sort((a, b) => {
      const aT = new Date((a as any)?.encounterDateTime ?? 0).getTime();
      const bT = new Date((b as any)?.encounterDateTime ?? 0).getTime();
      return bT - aT;
    });

    return sorted[0] ?? null;
  }

  /** getLatestEncounter의 id만 반환하는 단축 메서드 */
  static getLatestEncounterId<T extends { id?: string | null; encounterDateTime?: any }>(
    encounters?: T[] | null
  ): string | null {
    const latest = PaymentsServices.getLatestEncounter(encounters);
    return latest?.id ? String(latest.id) : null;
  }

  /**
   * encounters 배열에서 calcResultData가 존재하는 가장 최신 encounter의 calcResultData를 반환
   * - 수납 금액 계산의 원천 데이터로 사용
   */
  static getLatestCalcResultDataFromEncounters<T extends { calcResultData?: any; encounterDateTime?: any }>(
    encounters?: T[] | null
  ): any | null {
    if (!encounters || encounters.length === 0) return null;
    const withCalc = encounters.filter((e) => e && (e as any).calcResultData);
    if (withCalc.length === 0) return null;

    const latest = [...withCalc].sort((a, b) => {
      const aT = new Date((a as any)?.encounterDateTime ?? 0).getTime();
      const bT = new Date((b as any)?.encounterDateTime ?? 0).getTime();
      return bT - aT;
    })[0];

    return (latest as any)?.calcResultData ?? null;
  }

  /** 모든 금액이 0인 PaymentData 기본값 (불변 원본) */
  private static readonly defaultPaymentData: PaymentData = {
    totalMedicalFee: 0,
    claimAmount: 0,
    patientCopay: 0,
    nonCovered: 0,
    receivables: 0,
    discount: 0,
    grantAmount: 0,
    healthMaintenanceFee: 0,
    deductionTotal: 0,
    cutPrice: 0,
    adjustments: [],
  };

  /** defaultPaymentData의 안전한 복사본 반환 (호출부 mutate 방지) */
  static getDefaultPaymentData(): PaymentData {
    return {
      ...PaymentsServices.defaultPaymentData,
      adjustments: [...(PaymentsServices.defaultPaymentData.adjustments ?? [])],
    };
  }

  /**
   * usePayment 훅을 항상 호출하기 위한 "빈" 폼데이터 (안전한 기본값)
   * @param isTerminal 단말기 사용 여부 (기본값: true)
   */
  static getEmptyPaymentFormData(isTerminal: boolean = true) {
    return PaymentsServices.buildDefaultPaymentFormData(PaymentSource.CARD, 0, isTerminal, null, false);
  }

  /**
   * calcResultData(진료비 산출 원시 데이터)를 PaymentData로 변환
   * - 본인부담금총액(post-절삭) 기준으로 계산
   * - 절삭차액은 cutPrice에 보존 (deductionTotal에는 포함하지 않음)
   */
  private static getPaymentDataFromCalcResultData(calcResultData: any): PaymentData | null {
    if (!calcResultData) return null;

    const result = calcPaymentAmounts(calcResultData);

    return {
      totalMedicalFee: result.총진료비,
      claimAmount: result.공단부담금,
      patientCopay: result.본인부담금 - result.비급여총액,
      nonCovered: result.비급여총액,
      receivables: 0,
      discount: 0,
      grantAmount: 0,
      healthMaintenanceFee: 0,
      deductionTotal: 0,
      cutPrice: result.절삭차액,
      adjustments: [],
    };
  }

  /** 영수증 목록에서 isActive === true인 항목의 ID만 추출 */
  private static getActiveReceiptIds(
    receipts?: Array<ReceiptDetailsResponse & { isActive?: boolean; receiptId?: string | number }> | null
  ): string[] {
    if (!receipts || receipts.length === 0) {
      return [];
    }
    return receipts
      .filter((receipt) => (receipt as any)?.isActive === true)
      .map((receipt) => String((receipt as any)?.id ?? (receipt as any)?.receiptId))
      .filter(Boolean);
  }

  /** Registration → Reception 변환 (수납 UI에서 사용하는 접수 정보 형식) */
  static getReceptionFromRegistration(registration: Registration): Reception {
    return ReceptionService.convertRegistrationToReception(registration);
  }

  /**
   * 실제 수납해야 할 금액(영수액) 계산 — 수납액 산출의 단일 기준(SSOT)
   *
   * 공식: 본인부담금 + 비급여 - 감액총액 (음수면 0)
   *
   * ※ 절삭차액(cutPrice)은 수납액에 영향을 주지 않습니다.
   *   절삭차액은 진료비 표시용이며, 서버 전송 시 cutPrice=0으로 전달합니다.
   */
  static calculatePaymentAmount(paymentData: PaymentData): number {
    return Math.max(
      0,
      (paymentData?.patientCopay ?? 0) +
      (paymentData?.nonCovered ?? 0) -
      (paymentData?.deductionTotal ?? 0)
    );
  }

  // #endregion

  // #region 도메인 로직 — 수납 비즈니스 로직

  /**
   * PaymentData 결정 정책
   * - 수납완료 && receipts 존재: receipts 합산
   * - 수납완료 && receipts 없음: "버그 인지"용 issues를 담고 calcResultData로 fallback (가능하면)
   * - 그 외: calcResultData 기반
   */
  static resolvePaymentData(params: {
    isPaymentCompleted: boolean;
    receipts?: ReceiptDetailsResponse[] | null;
    encounter?: Pick<Encounter, "calcResultData"> | null;
    calcResultData?: any;
    defaultPaymentData?: PaymentData;
  }): PaymentDataResolution {
    const issues: PaymentDataIssue[] = [];
    const defaultPaymentData =
      params.defaultPaymentData ?? PaymentsServices.getDefaultPaymentData();

    const receipts = params.receipts ?? [];
    if (params.isPaymentCompleted) {
      if (receipts.length > 0) {
        return {
          paymentData: PaymentsServices.sumPaymentDataFromReceipts(receipts),
          source: "receipt",
          issues,
        };
      }
      issues.push("MISSING_ACTIVE_RECEIPT_WHEN_COMPLETED");
    }

    const calc =
      params.calcResultData ?? params.encounter?.calcResultData ?? null;
    const fromCalc = PaymentsServices.getPaymentDataFromCalcResultData(calc);
    if (fromCalc) {
      return {
        paymentData: fromCalc,
        source: "calcResult",
        issues,
      };
    }

    return {
      paymentData: defaultPaymentData,
      source: "default",
      issues,
    };
  }

  /**
   * Registration 기반 PaymentData 계산 (use-payment-index.ts의 흐름을 서비스로 분리)
   * - 수납완료: receiptData(활성 영수증) 기반 합산
   * - 수납대기 등: encounter.calcResultData 기반 계산
   */
  static async getPaymentDataFromRegistration(
    registration: Registration
  ): Promise<PaymentData> {
    if (!registration) return PaymentsServices.defaultPaymentData;

    const encounterId = registration.encounters?.[0]?.id ?? null;
    const patientId = registration.patientId ? String(registration.patientId) : null;
    const isPaymentCompleted = registration.status === 접수상태.수납완료;

    let receipts: ReceiptDetailsResponse[] = [];
    if (isPaymentCompleted && patientId && encounterId) {
      receipts = await PaymentsServices.getActiveReceiptDetails(patientId, encounterId);
    }

    const encounter =
      registration.encounters?.[0]?.calcResultData
        ? null
        : (encounterId ? await EncountersService.getEncounter(encounterId) : null);
    const calcResultData =
      registration.encounters?.[0]?.calcResultData ?? encounter?.calcResultData ?? null;

    const resolved = PaymentsServices.resolvePaymentData({
      isPaymentCompleted,
      receipts,
      calcResultData,
      defaultPaymentData: PaymentsServices.getDefaultPaymentData(),
    });

    return resolved.paymentData;
  }

  /**
   * 추가수납 표시/계산용 PaymentData 생성
   * - 현재(calcResult 기반) 금액에서 기수납(receipts 합산) 금액을 차감한 "잔여" 값만 남김
   * - 감액/지원금/건생비/adjustments는 중복 적용 위험이 있어 기본 0으로 초기화 (TODO: 정책 확정 후 조정)
   */
  static calculateAdditionalPaymentData(
    current: PaymentData,
    alreadyPaid: PaymentData
  ): PaymentData {
    const safeSub = (a?: number, b?: number) =>
      Math.max(0, (a ?? 0) - (b ?? 0));

    const patientCopay = safeSub(current.patientCopay, alreadyPaid.patientCopay);
    const nonCovered = safeSub(current.nonCovered, alreadyPaid.nonCovered);
    const totalMedicalFee = safeSub(current.totalMedicalFee, alreadyPaid.totalMedicalFee);
    const claimAmount = safeSub(current.claimAmount, alreadyPaid.claimAmount);
    const receivables = safeSub(current.receivables, alreadyPaid.receivables);

    return {
      totalMedicalFee,
      claimAmount,
      patientCopay,
      nonCovered,
      receivables,
      discount: 0,
      grantAmount: 0,
      healthMaintenanceFee: 0,
      deductionTotal: 0,
      cutPrice: 0,
      adjustments: [],
    };
  }

  /**
   * 여러 영수증(ReceiptDetailsResponse[])을 합산하여 단일 PaymentData로 집계
   * - 총진료비·본인부담금·비급여 등은 합산, 미수금은 마지막 영수증 기준
   * - adjustments(감액/지원금)는 전체 영수증에서 모아서 flat하게 반환
   */
  static sumPaymentDataFromReceipts(
    receipts: ReceiptDetailsResponse[]
  ): PaymentData {
    if (!receipts || receipts.length === 0) {
      return PaymentsServices.defaultPaymentData;
    }

    const sumBy = (selector: (receipt: ReceiptDetailsResponse) => number) =>
      receipts.reduce((acc, receipt) => acc + (selector(receipt) || 0), 0);

    const sortedById = [...receipts].sort((a, b) => {
      const aId = Number(a.id ?? 0);
      const bId = Number(b.id ?? 0);
      return aId - bId;
    });
    const lastReceipt = sortedById[sortedById.length - 1];

    const discount = sumBy((receipt) => receipt.discount ?? 0);
    const grantAmount = sumBy((receipt) => receipt.grantAmount ?? 0);
    const healthMaintenanceFee = sumBy((receipt) => receipt.cutPrice ?? 0);

    const adjustments: ReceiptAdjustmentBase[] = receipts
      .flatMap((receipt) => (receipt as any).adjustments ?? [])
      .map((adjustment: any) => ({
        adjustmentType: adjustment.adjustmentType,
        amount: adjustment.amount,
        discountType:
          adjustment.discountType != null
            ? String(adjustment.discountType)
            : undefined,
        grantType: adjustment.grantType,
        reason: adjustment.reason,
      }))
      .filter(
        (adj: any) => adj.adjustmentType !== undefined && adj.amount !== undefined
      );

    return {
      totalMedicalFee: sumBy((receipt) => receipt.totalMedicalFee ?? 0),
      claimAmount: sumBy((receipt) => receipt.insuranceClaim ?? 0),
      patientCopay: sumBy((receipt) => receipt.insuranceCopay ?? 0),
      nonCovered: sumBy(
        (receipt) =>
          (receipt.nonInsuranceCopay ?? 0) + (receipt.selectiveCopay ?? 0)
      ),
      receivables:
        (lastReceipt as any)?.receivableBalance ??
        (lastReceipt as any)?.remainingAmount ??
        0,
      discount,
      grantAmount,
      healthMaintenanceFee,
      deductionTotal: discount + grantAmount + healthMaintenanceFee,
      cutPrice: healthMaintenanceFee,
      adjustments,
    };
  }

  /**
   * registration + paymentSource로 수납 실행에 필요한 데이터(Encounter/PaymentData/FormData/Reception) 준비
   * - 실제 실행(executePayment)은 훅 계층에서 수행
   * @param isTerminal 단말기 사용 여부 (환경설정과 별개로 결제 단계에서 강제 지정 가능)
   */
  static async preparePaymentExecution(
    registration: Registration,
    paymentSource: PaymentSource,
    isTerminal?: boolean,
    isAuto: boolean = false
  ): Promise<{
    reception: Reception;
    encounter: Encounter;
    paymentData: PaymentData;
    paymentAmount: number;
    paymentFormData: PaymentFormData;
    paymentSource: PaymentSource;
  }> {
    if (!registration) {
      throw new Error("Registration 정보가 없습니다.");
    }

    const [encounter, paymentData] = await Promise.all([
      PaymentsServices.getReceptionEncounterFromRegistration(registration),
      PaymentsServices.getPaymentDataFromRegistration(registration),
    ]);

    if (!encounter) {
      throw new Error("Encounter 정보가 없습니다.");
    }

    const reception = PaymentsServices.getReceptionFromRegistration(registration);
    const paymentAmount = PaymentsServices.calculatePaymentAmount(paymentData);
    const paymentFormData = PaymentsServices.buildDefaultPaymentFormData(
      paymentSource,
      paymentAmount,
      isTerminal,
      registration.patient,
      isAuto
    );

    return {
      reception,
      encounter,
      paymentData,
      paymentAmount,
      paymentFormData,
      paymentSource,
    };
  }

  /**
   * 수납 기본 폼데이터 생성
   * - receivedAmount에 영수액 반영
   * - paymentSource에 따라 isChecked 및 card/cashAmount 세팅
   * - 현금이고 10만원 이상이면 현금영수증 자동 체크
   * @param isTerminal 단말기 사용 여부 (기본값: true, 환경설정에서 가져올 수도 있으나 결제 단계에서 강제 지정 가능)
   * @param patient 환자 정보 (isAuto가 true일 때 approvalMethod와 approvalNumber 자동 설정에 사용)
   * @param isAuto 자동 현금영수증 설정 여부 (기본값: false, true인 경우 shouldAutoCashReceipt 조건과 함께 approvalMethod/approvalNumber 자동 설정)
   */
  static buildDefaultPaymentFormData(
    paymentSource: PaymentSource,
    receivedAmount: number,
    isTerminal: boolean = true,
    patient?: Patient | null,
    isAuto: boolean = false
  ): PaymentFormData {
    const amount = Math.max(0, receivedAmount || 0);
    const amountStr = String(amount);

    const isCard = paymentSource === PaymentSource.CARD;
    const isCash = paymentSource === PaymentSource.CASH;

    const baseShouldAutoCashReceipt = isCash && amount >= 100000;
    const shouldAutoCashReceipt = isAuto 
      ? isAuto && baseShouldAutoCashReceipt 
      : baseShouldAutoCashReceipt;
    
    let approvalMethod: CashApprovalMethod | "" = "";
    let approvalNumber: string = "";

    if (shouldAutoCashReceipt) {
      if (isAuto && patient) {
        const phone = patient.phone1?.trim();
        const isValidPhone = phone && phone.length > 0;

        if (isValidPhone) {
          approvalMethod = CashApprovalMethod.휴대폰번호;
          approvalNumber =  unformatPhoneNumber(phone);
        } else if (patient.rrn) {
          approvalMethod = CashApprovalMethod.주민등록번호;
          approvalNumber = unformatRrn(patient.rrn);
        }
      } else {
        approvalMethod = CashApprovalMethod.휴대폰번호;
        approvalNumber = "";
      }
    }
    return {
      receivedAmount: amountStr,
      receiptMemo: "",
      isCardChecked: isCard,
      isCashChecked: isCash,
      installment: "0",
      cardAmount: isCard ? amountStr : "0",
      cashAmount: isCash ? amountStr : "0",
      transferAmount: "0",
      isCashReceiptChecked: shouldAutoCashReceipt,
      cashReceiptAmount: shouldAutoCashReceipt ? amountStr : "",
      approvalMethod: approvalMethod,
      approvalNumber: approvalNumber,
      isTerminal: isTerminal,
      cardApprovalNumber: "",
    };
  } 

  /**
   * payment-method 폼데이터를 PaymentInfoRequest 배열로 변환
   * - 카드/현금/계좌이체 각각을 개별 PaymentInfoRequest로 분리
   */
  static convertPaymentMethodsToPaymentInfo(
    formData: {
      isCardChecked: boolean;
      cardAmount: string;
      cardApprovalNumber: string;
      installment: string;
      isCashChecked: boolean;
      cashAmount: string;
      isCashReceiptChecked: boolean;
      approvalMethod: CashApprovalMethod | "";
      cashReceiptAmount: string;
      transferAmount: string;
    },
    isTerminalAvailable: boolean = false
  ): PaymentInfoRequest[] {
    const payments: PaymentInfoRequest[] = [];

    if (formData.isCardChecked && formData.cardAmount) {
      const cardAmount = Number(formData.cardAmount) || 0;
      if (cardAmount > 0) {
        const approvalNo = !isTerminalAvailable && formData.cardApprovalNumber
          ? formData.cardApprovalNumber
          : undefined;

        payments.push({
          paymentSource: PaymentSource.CARD,
          paymentMethod: PaymentProvider.DIRECT,
          paymentAmount: cardAmount,
          installmentMonths: Number(formData.installment) || 0,
          issuerName: "",
          approvalNo,
        });
      }
    }

    if (formData.isCashChecked && formData.cashAmount) {
      const cashAmount = Number(formData.cashAmount) || 0;
      if (cashAmount > 0) {
        payments.push({
          paymentSource: PaymentSource.CASH,
          paymentMethod: PaymentProvider.DIRECT,
          paymentAmount: cashAmount,
          cashType: CashType.CASH,
          receiptType: formData.isCashReceiptChecked
            ? undefined
            : undefined,
          identificationType: formData.approvalMethod ? getIdentificationTypeFromApprovalMethod(formData.approvalMethod) : undefined,
          identificationNumber: formData.cashReceiptAmount || undefined,
          cashReceived: cashAmount,
          cashChange: 0,
        });
      }
    }

    if (formData.transferAmount) {
      const transferAmount = Number(formData.transferAmount) || 0;
      if (transferAmount > 0) {
        payments.push({
          paymentSource: PaymentSource.CASH,
          paymentMethod: PaymentProvider.DIRECT,
          paymentAmount: transferAmount,
          cashType: CashType.ACCOUNT,
        });
      }
    }

    return payments;
  }

  /**
   * Encounter + PaymentData + PaymentFormData를 서버 전송용 BillingRequest로 조립
   * - 영수증 상세(receiptDetails) + 결제수단(payments) + 정산(settlement) 구조
   * - use-payment.ts에서 수납 실행 시 호출
   */
  static convertToBillingRequest(
    input: {
      encounter: Encounter;
      paymentData: PaymentData;
      paymentFormData: PaymentFormData;
      isTerminalAvailable?: boolean;
      hospitalId: number;
    }
  ): BillingRequest {
    const isTerminalAvailable = input.isTerminalAvailable ?? false;
    const effectiveEncounter = input.encounter;
    const effectivePaymentData = input.paymentData;
    const effectivePaymentFormData = input.paymentFormData;

    if (!effectiveEncounter?.id) {
      throw new Error("Encounter ID가 필요합니다.");
    }
    const receiptDetails = {
      encounterId: effectiveEncounter.id,
      totalMedicalFee: effectivePaymentData.totalMedicalFee,
      insuranceClaim: effectivePaymentData.claimAmount,
      insuranceCopay: effectivePaymentData.patientCopay,
      nonInsuranceCopay: effectivePaymentData.nonCovered,
      selectiveCopay: 0,
      totalCopay: effectivePaymentData.patientCopay + effectivePaymentData.nonCovered,
      discount: effectivePaymentData.discount,
      grantAmount: effectivePaymentData.grantAmount,
      cutPrice: 0,
      finalAmount: PaymentsServices.calculatePaymentAmount(effectivePaymentData),
      receiptMemo: effectivePaymentFormData.receiptMemo || "",
      adjustments: effectivePaymentData.adjustments ?? [],
    };

    const payments = PaymentsServices.convertPaymentMethodsToPaymentInfo(effectivePaymentFormData, isTerminalAvailable);

    const settlement: BillingSettlementRequest = {
      hospitalId: input.hospitalId,
      receiptAllocations: [
        {
          receiptIndex: 0,
          allocatedAmount: Number(effectivePaymentFormData.receivedAmount) || 0,
        },
      ],
      creditAllocations: [{
        receiptIndex: 0,
        creditIssueAmount: 0,
        creditUseAmount: 0,
      }],
      payments,
    };

    return {
      receipts: [receiptDetails],
      settlement: settlement
    };
  }

  // #endregion
}
