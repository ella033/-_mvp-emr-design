"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelectedReception } from "@/hooks/reception/use-selected-reception";
import { useEncounter } from "@/hooks/encounter/use-encounter";
import { useReceiptDataForReception } from "./use-payment-receipt-data";
import { usePayment } from "./use-payment";
import { PaymentsServices } from "@/services/payments-services";
import {
  접수상태,
  CashApprovalMethod,
  PaymentSource,
  PaymentStatus,
  CashType,
  AdjustmentType,
} from "@/constants/common/common-enum";
import { useDiscountTypeOptions } from "@/components/reception/board-patient/(payment-info)/discount-selector";
import type { ReceiptAdjustmentBase } from "@/types/receipt/receipt-adjustment-types";
import type { Reception } from "@/types/common/reception-types";
import type {
  PaymentData,
  PaymentMethodData,
  AdjustmentValues,
} from "@/types/payment-types";
import {
  createInitialPaymentInfoViewState,
  type PaymentInfoViewState,
} from "@/types/common/reception-view-types";
import type { ReceiptDetailsResponse } from "@/types/receipt/receipt-details-types";
import { useToastHelpers } from "@/components/ui/toast";
import { useReceptionTabsStore } from "@/store/reception";
import { usePatientGroupsStore } from "@/store/patient-groups-store";
import { useBenefitsStore } from "@/store/benefits-store";
import { usePaymentMethodState } from "./use-payment-method-state";
import { normalizeRegistrationId } from "@/lib/registration-utils";
import { calculateAmountFromBenefit } from "@/components/reception/board-patient/(payment-info)/discount-selector";
import { useAlertBarHelpers } from "@/components/ui/alert-bar";
import { useUserStore } from "@/store/user-store";
import { useUsersStore } from "@/store/users-store";
import { InputSource } from "@/types/chart/order-types";
import { UserType } from "@/constants/common/common-enum";
import React from "react";
import { usePrintService } from "@/hooks/document/use-print-service";
import { OutputTypeCode } from "@/types/printer-types";
import { DocumentType } from "@/components/reception/(print-center)/print-center-types";
import { usePrintPopupStore } from "@/store/print-popup-store";

function usePreviousValue<T>(value: T) {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

interface UsePaymentIndexOptions {
  externalReception?: Reception | null;
  externalReceptionId?: string | null;
  externalPaymentData?: PaymentData;
  onPayment?: () => void;
  initialUIState?: Partial<PaymentInfoViewState>;
  onUIStateChange?: (state: Partial<PaymentInfoViewState>) => void;
}

export function usePaymentIndex({
  externalReception,
  externalReceptionId,
  externalPaymentData,
  onPayment,
  initialUIState,
  onUIStateChange,
}: UsePaymentIndexOptions) {
  const discountTypeOptions = useDiscountTypeOptions();
  const patientGroups = usePatientGroupsStore((s) => s.patientGroups);
  const allBenefits = useBenefitsStore((s) => s.benefits);
  const { selectedReception: currentReception, activeReceptionId } =
    useSelectedReception({
      reception: externalReception,
      receptionId: externalReceptionId,
    });
  const openedReceptions = useReceptionTabsStore(
    (state) => state.openedReceptions
  );
  const paymentStatusFilter = useReceptionTabsStore(
    (state) => state.paymentStatusFilter
  );
  const toast = useToastHelpers();
  const prevActiveReceptionId = usePreviousValue(activeReceptionId);
  const normalizedActiveReceptionId = activeReceptionId
    ? normalizeRegistrationId(activeReceptionId)
    : null;
  const normalizedPrevActiveReceptionId = prevActiveReceptionId
    ? normalizeRegistrationId(prevActiveReceptionId)
    : null;
  const appliedInitialUIStateKeyRef = useRef<string | null>(null);
  const hasAppliedInitialUIStateRef = useRef(false);
  const lastEmittedUIStateRef = useRef<string | null>(null);
  const hasInjectedUIState = initialUIState !== undefined;
  const hasInjectedReceivedAmount = (() => {
    if (initialUIState?.receivedAmount === undefined) return false;
    const numericValue = Number(initialUIState.receivedAmount);
    return Number.isFinite(numericValue) && numericValue > 0;
  })();
  const hasInjectedAdjustmentValues =
    initialUIState?.adjustmentValues !== undefined;
  const isReceptionNewToStore = useMemo(() => {
    if (!normalizedActiveReceptionId) {
      return false;
    }

    return !openedReceptions.some(
      (opened) =>
        normalizeRegistrationId(opened.originalRegistrationId) ===
        normalizedActiveReceptionId
    );
  }, [normalizedActiveReceptionId, openedReceptions]);

  const isReceptionChanged =
    Boolean(normalizedActiveReceptionId && normalizedPrevActiveReceptionId) &&
    normalizedActiveReceptionId !== normalizedPrevActiveReceptionId;

  const isFirstActiveSelection =
    Boolean(normalizedActiveReceptionId) && !prevActiveReceptionId;

  const shouldInitialize =
    Boolean(normalizedActiveReceptionId) &&
    (isReceptionNewToStore ||
      isReceptionChanged ||
      isFirstActiveSelection);

  const prevShouldInitialize = usePreviousValue(shouldInitialize);

  // 접수 전환 시 UI 상태 초기화/송신 캐시도 초기화
  useEffect(() => {
    appliedInitialUIStateKeyRef.current = null;
    hasAppliedInitialUIStateRef.current = false;
    lastEmittedUIStateRef.current = null;
  }, [normalizedActiveReceptionId]);

  const encounterIdFromReception = useMemo(() => {
    if (!currentReception?.receptionInfo?.encounters || !activeReceptionId) {
      return null;
    }
    const encounters = currentReception.receptionInfo.encounters ?? [];
    return PaymentsServices.getLatestEncounterId(encounters) ?? encounters[0]?.id ?? null;
  }, [
    currentReception?.receptionInfo?.encounters,
    activeReceptionId,
    externalReception,
  ]);

  const { data: receptionEncounter } = useEncounter(
    encounterIdFromReception || ""
  );

  const isPaymentCompleted =
    currentReception?.receptionInfo?.status === 접수상태.수납완료;
  const hasReceipt = currentReception?.receptionInfo?.hasReceipt ?? false;

  // 수납실 리스트에서 "완료" 탭을 보고 있는지 (status=수납대기 && hasReceipt 케이스의 표시 정책을 결정)
  const isViewingPaymentCompletedTab = useMemo(() => {
    // 값이 비어있으면(초기) 기존 동작 유지: status 기반으로 판단
    if (!paymentStatusFilter || paymentStatusFilter.length === 0) return false;
    return paymentStatusFilter.includes(PaymentStatus.COMPLETED.toString());
  }, [paymentStatusFilter]);

  const patientId = useMemo(() => {
    if (!receptionEncounter?.patientId) return null;
    return String(receptionEncounter.patientId);
  }, [receptionEncounter?.patientId]);

  // 수납완료 상태로 변경될 때 체크박스 모두 해제-
  const [printPrescription, setPrintPrescription] = useState(
    initialUIState?.printPrescription ?? false
  );
  const [printReceipt, setPrintReceipt] = useState(
    initialUIState?.printReceipt ?? false
  );
  const [printStatement, setPrintStatement] = useState(
    initialUIState?.printStatement ?? false
  );

  useEffect(() => {
    if (isPaymentCompleted) {
      setPrintPrescription(false);
      setPrintReceipt(false);
      setPrintStatement(false);
    }
  }, [isPaymentCompleted]);

  const shouldFetchReceipts = !!isPaymentCompleted || !!hasReceipt;

  // status=수납대기 && hasReceipt인 경우, "완료 탭"에서는 기수납내역(영수증 합산)을 보여주기 위해 receipt 우선 모드로 처리
  const shouldUseReceiptAsCompleted =
    !!isPaymentCompleted || (!!hasReceipt && isViewingPaymentCompletedTab);

  const calcResultDataFromStore = useMemo(() => {
    const encounters = currentReception?.receptionInfo?.encounters ?? [];
    return (
      PaymentsServices.getLatestCalcResultDataFromEncounters(encounters) ??
      encounters[0]?.calcResultData ??
      null
    );
  }, [currentReception?.receptionInfo?.encounters]);

  const { receiptData, ensureReceiptDataForCancel, receiptQueryState } = useReceiptDataForReception(
    {
      patientId,
      encounterId: receptionEncounter?.id ?? null,
      isPaymentCompleted: !!isPaymentCompleted,
      shouldFetchReceipts,
    }
  );

  const paymentDataResolution = useMemo(() => {
    return PaymentsServices.resolvePaymentData({
      isPaymentCompleted: shouldUseReceiptAsCompleted,
      receipts: receiptData,
      encounter: receptionEncounter,
      calcResultData: calcResultDataFromStore,
    });
  }, [shouldUseReceiptAsCompleted, receiptData, receptionEncounter, calcResultDataFromStore]);

  // 수납대기 탭 + hasReceipt(기수납 존재)인 경우: "추가 수납분(현재 - 기수납)"만 보여주기 위한 base 데이터
  const additionalBasePaymentData = useMemo(() => {
    const isAdditionalPaymentMode = !shouldUseReceiptAsCompleted && hasReceipt;
    if (!isAdditionalPaymentMode) return null;

    // 영수증 조회가 끝났고, 유효 영수증이 있을 때만 차감 계산
    if (!receiptQueryState.isFetched || receiptQueryState.isFetching) return null;
    if (!receiptData || receiptData.length === 0) return null;

    const alreadyPaid = PaymentsServices.sumPaymentDataFromReceipts(receiptData);
    return PaymentsServices.calculateAdditionalPaymentData(
      paymentDataResolution.paymentData,
      alreadyPaid
    );
  }, [
    shouldUseReceiptAsCompleted,
    hasReceipt,
    receiptQueryState.isFetched,
    receiptQueryState.isFetching,
    receiptData,
    paymentDataResolution.paymentData,
  ]);

  const missingReceiptToastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // "영수증 누락" 경고는 receipts를 우선으로 쓰는 모드(수납완료 or 완료탭에서 hasReceipt 케이스)에서만 표시
    if (!isPaymentCompleted && !(hasReceipt && isViewingPaymentCompletedTab)) return;
    // reception/encounter 전환 직후(영수증 조회 전)에는 경고를 띄우지 않음
    if (!patientId || !receptionEncounter?.id) return;
    if (!receiptQueryState.isFetched || receiptQueryState.isFetching) return;
    if (!paymentDataResolution.issues.includes("MISSING_ACTIVE_RECEIPT_WHEN_COMPLETED")) {
      return;
    }

    const key = `${patientId ?? "no-patient"}:${receptionEncounter?.id ?? "no-encounter"}`;
    if (missingReceiptToastKeyRef.current === key) return;
    missingReceiptToastKeyRef.current = key;

    toast.warning(
      "영수증 정보 누락",
      "수납완료 상태이지만 유효 수납내역이 조회되지 않습니다. 데이터 확인이 필요합니다."
    );
  }, [
    isPaymentCompleted,
    hasReceipt,
    isViewingPaymentCompletedTab,
    patientId,
    receptionEncounter?.id,
    receiptQueryState.isFetched,
    receiptQueryState.isFetching,
    paymentDataResolution.issues,
    toast,
  ]);

  const rawBasePaymentData = useMemo(() => {
    if (externalPaymentData) return externalPaymentData;
    return additionalBasePaymentData ?? paymentDataResolution.paymentData;
  }, [externalPaymentData, additionalBasePaymentData, paymentDataResolution.paymentData]);

  const basePaymentData = useMemo(() => {
    if (shouldUseReceiptAsCompleted) return rawBasePaymentData;
    if (externalPaymentData) return rawBasePaymentData;

    const groupId = currentReception?.patientBaseInfo?.groupId;
    if (!groupId) return rawBasePaymentData;

    const patientGroup = patientGroups.find((g) => g.id === groupId);
    if (!patientGroup?.benefits?.length) return rawBasePaymentData;

    const benefitRef = patientGroup.benefits[0];
    if (!benefitRef) return rawBasePaymentData;
    const benefit = allBenefits.find((b) => b.id === benefitRef.id);
    if (!benefit) return rawBasePaymentData;

    const calculatedAmount = calculateAmountFromBenefit(benefit, rawBasePaymentData);
    if (calculatedAmount <= 0) return rawBasePaymentData;

    const maxAvailable = Math.max(
      0,
      rawBasePaymentData.patientCopay +
        rawBasePaymentData.nonCovered -
        (rawBasePaymentData.healthMaintenanceFee ?? 0) -
        (rawBasePaymentData.grantAmount ?? 0)
    );
    const discountAmount = Math.min(calculatedAmount, maxAvailable);
    if (discountAmount <= 0) return rawBasePaymentData;

    const existingAdjustments = (rawBasePaymentData.adjustments ?? []).filter(
      (a) => a.adjustmentType !== AdjustmentType.DISCOUNT
    );

    return {
      ...rawBasePaymentData,
      discount: discountAmount,
      adjustments: [
        ...existingAdjustments,
        {
          adjustmentType: AdjustmentType.DISCOUNT,
          amount: discountAmount,
          discountType: String(benefit.id),
          reason: patientGroup.name + " - " + benefit.name,
        },
      ],
    };
  }, [
    rawBasePaymentData,
    shouldUseReceiptAsCompleted,
    externalPaymentData,
    currentReception?.patientBaseInfo?.groupId,
    patientGroups,
    allBenefits,
  ]);

  const prevIsPaymentCompletedForAdjRef = useRef(isPaymentCompleted);
  const cancelledTransitionRef = useRef(false);

  const basePaymentDataAdjustmentsKey = useMemo(
    () => JSON.stringify(basePaymentData.adjustments ?? []),
    [basePaymentData.adjustments]
  );

  const normalizeAdjustments = useCallback(
    (input: any): ReceiptAdjustmentBase[] => {
      if (!input || !Array.isArray(input)) return [];
      return input
        .filter((adj: any) => adj && adj.adjustmentType !== undefined)
        .map((adj: any) => ({
          ...adj,
          discountType:
            adj.discountType != null ? String(adj.discountType) : undefined,
        }));
    },
    []
  );

  const initialAdjustmentsSource =
    paymentDataResolution.source === "receipt" &&
    (basePaymentData.adjustments?.length ?? 0) > 0
      ? basePaymentData.adjustments
      : initialUIState?.adjustmentValues?.adjustments ?? basePaymentData.adjustments;

  const [adjustmentValues, setAdjustmentValues] = useState<AdjustmentValues>({
    discount: initialUIState?.adjustmentValues?.discount ?? basePaymentData.discount,
    healthMaintenanceFee:
      initialUIState?.adjustmentValues?.healthMaintenanceFee ??
      basePaymentData.healthMaintenanceFee ??
      0,
    grantAmount: initialUIState?.adjustmentValues?.grantAmount ?? basePaymentData.grantAmount,
    adjustments: normalizeAdjustments(initialAdjustmentsSource ?? []),
  });

  // 수납완료(receipt) 기반일 때는 영수증이 기준이므로 initialUIState와 관계없이 항상 basePaymentData로 동기화
  // 수납완료→수납대기 전환(수납취소) 시:
  //   - cancelledTransitionRef를 설정하여 stale receipt 데이터 차단
  //   - encounter 기반 데이터가 도착하면 적용 후 플래그 해제
  useEffect(() => {
    const fromReceipt = paymentDataResolution.source === "receipt";

    const wasCompleted = prevIsPaymentCompletedForAdjRef.current;
    prevIsPaymentCompletedForAdjRef.current = isPaymentCompleted;

    // 수납취소 감지: isPaymentCompleted가 true→false로 전환
    if (wasCompleted && !isPaymentCompleted) {
      cancelledTransitionRef.current = true;
    }

    // 수납취소 전환 중: stale receipt 데이터는 무시, encounter 기반 데이터만 적용
    if (cancelledTransitionRef.current) {
      if (fromReceipt) {
        // 아직 receipt 기반(stale) → 무시
        return;
      }
      // encounter 기반 데이터 도착 → 적용 후 플래그 해제
      cancelledTransitionRef.current = false;
      setAdjustmentValues({
        discount: basePaymentData.discount,
        healthMaintenanceFee: basePaymentData.healthMaintenanceFee ?? 0,
        grantAmount: basePaymentData.grantAmount,
        adjustments: basePaymentData.adjustments ?? [],
      });
      return;
    }

    // 일반 동기화: receipt 기반이면 항상 동기화, 수동 수정값이 있으면 스킵
    if (hasInjectedAdjustmentValues && !fromReceipt) {
      return;
    }
    setAdjustmentValues({
      discount: basePaymentData.discount,
      healthMaintenanceFee: basePaymentData.healthMaintenanceFee ?? 0,
      grantAmount: basePaymentData.grantAmount,
      adjustments: basePaymentData.adjustments ?? [],
    });
  }, [
    basePaymentData.discount,
    basePaymentData.grantAmount,
    basePaymentData.healthMaintenanceFee,
    basePaymentDataAdjustmentsKey,
    hasInjectedAdjustmentValues,
    paymentDataResolution.source,
    isPaymentCompleted,
  ]);

  const paymentData = useMemo(() => {
    const deductionTotal =
      adjustmentValues.discount +
      adjustmentValues.healthMaintenanceFee +
      adjustmentValues.grantAmount;

    return {
      ...basePaymentData,
      discount: adjustmentValues.discount,
      healthMaintenanceFee: adjustmentValues.healthMaintenanceFee,
      grantAmount: adjustmentValues.grantAmount,
      cutPrice: basePaymentData.cutPrice,
      deductionTotal,
      adjustments: adjustmentValues.adjustments,
    };
  }, [basePaymentData, adjustmentValues]);

  const basePaymentAmount = useMemo(() => {
    const initialDeduction = basePaymentData.deductionTotal;
    return Math.max(
      0,
      basePaymentData.patientCopay +
      basePaymentData.nonCovered -
      initialDeduction
    );
  }, [basePaymentData]);

  const paymentAmount = useMemo(() => {
    return PaymentsServices.calculatePaymentAmount(paymentData);
  }, [paymentData]);

  // 감액이 사용 가능한 잔액 계산 (지원금과 건생비를 제외한 잔액)
  const availableForDiscount = useMemo(() => {
    const calculatedGrantAmount = Math.min(
      paymentData.grantAmount || 0,
      basePaymentAmount
    );
    const availableForHealthMaintenance = Math.max(
      0,
      basePaymentAmount - calculatedGrantAmount
    );
    return Math.max(
      0,
      availableForHealthMaintenance - (paymentData.healthMaintenanceFee || 0)
    );
  }, [basePaymentAmount, paymentData.grantAmount, paymentData.healthMaintenanceFee]);

  // 감액 변경 핸들러
  const handleDiscountChange = useCallback((discountType: string, discountAmount: number) => {
    setAdjustmentValues((prev) => {
      const discountReason =
        discountTypeOptions.find((option) => option.value === discountType)
          ?.label ?? "감액";

      // 기존 adjustments에서 DISCOUNT 항목 제거
      const otherAdjustments = (prev.adjustments ?? []).filter(
        (adj) => adj.adjustmentType !== AdjustmentType.DISCOUNT
      );

      // 새로운 DISCOUNT adjustment 추가 (금액이 0보다 큰 경우만)
      const newAdjustments: ReceiptAdjustmentBase[] = [...otherAdjustments];
      if (discountAmount > 0 && discountType) {
        newAdjustments.push({
          adjustmentType: AdjustmentType.DISCOUNT,
          amount: discountAmount,
          discountType: discountType,
          reason: discountReason,
        });
      }

      return {
        ...prev,
        discount: discountAmount,
        adjustments: newAdjustments,
      };
    });
  }, [discountTypeOptions]);

  const orders = useMemo(() => {
    if (receptionEncounter?.orders && receptionEncounter.orders.length > 0) {
      return receptionEncounter.orders;
    }
    return [];
  }, [receptionEncounter]);

  // AlertBar 관련 로직
  const { user } = useUserStore();
  const { getUserById } = useUsersStore();
  const alertBarHelper = useAlertBarHelpers();
  const alertBarHelperRef = useRef(alertBarHelper);
  const prevReceptionIdRef = useRef<string | null>(null);

  // 함수 참조를 ref로 저장하여 무한 루프 방지
  useEffect(() => {
    alertBarHelperRef.current = alertBarHelper;
  }, [alertBarHelper]);

  // 현재 reception ID
  const currentReceptionId = externalReception?.originalRegistrationId || null;

  // 의사인지 확인하는 함수
  const isDoctor = useMemo(() => {
    return (userId: number | null): boolean => {
      if (!userId || !user?.hospitalId) return false;
      const foundUser = getUserById(String(user.hospitalId), userId);
      return foundUser?.type === UserType.의사;
    };
  }, [user?.hospitalId, getUserById]);

  // 조건에 맞는 orders 필터링
  const ordersNeedingConfirmation = useMemo(() => {
    if (!orders || orders.length === 0) return [];

    return orders.filter((order) => {
      // 예약처방 또는 구두처방인지 확인
      const isReservationOrVerbal =
        order.inputSource === InputSource.예약처방 ||
        order.inputSource === InputSource.구두처방;

      if (!isReservationOrVerbal) return false;

      // 최종작업자Id 결정: updateId가 null이면 createId, 아니면 updateId
      const finalWorkerId = order.updateId !== null ? order.updateId : order.createId;

      // 최종작업자Id가 의사인지 확인
      // 의사라면 false (alertBar 표시 안함), 의사가 아니면 true (alertBar 표시)
      return !isDoctor(finalWorkerId);
    });
  }, [orders, isDoctor]);

  // alertBar 표시 여부 상태
  const [hasAlertBar, setHasAlertBar] = useState(false);

  // alertBar 표시/제거
  useEffect(() => {
    const hasOrdersNeedingConfirmation = !isPaymentCompleted && ordersNeedingConfirmation.length > 0;

    // reception이 없으면 처리하지 않음
    if (!currentReceptionId) {
      setHasAlertBar(false);
      return;
    }

    // reception이 변경되었으면 이전 alertBar 제거
    if (prevReceptionIdRef.current && prevReceptionIdRef.current !== currentReceptionId) {
      alertBarHelperRef.current.removeAlertBar(prevReceptionIdRef.current);
      setHasAlertBar(false);
    }

    // 조건에 맞는 orders가 있으면 alertBar 표시
    if (hasOrdersNeedingConfirmation) {
      const icon = React.createElement("img", {
        src: "/icon/ic_line_medical_report.svg",
        alt: "예약처방",
        className: "w-4 h-4",
      });
      const content = React.createElement("span", null, "진료실에서 확인이 필요한 오더가 있습니다. 잠시만 기다려 주세요.");

      // reception.originalRegistrationId를 alertBarId로 사용
      alertBarHelperRef.current.info(icon, content, {
        id: currentReceptionId,
        dismissible: false,
      });
      setHasAlertBar(true);
    } else {
      // 조건에 맞는 orders가 없으면 제거
      alertBarHelperRef.current.removeAlertBar(currentReceptionId);
      setHasAlertBar(false);
    }

    prevReceptionIdRef.current = currentReceptionId;
  }, [ordersNeedingConfirmation, currentReceptionId, isPaymentCompleted]);

  // reception이 null이 되거나 제거되면 alertBar 초기화
  useEffect(() => {
    if (!externalReception) {
      const prevId = prevReceptionIdRef.current;
      if (prevId) {
        alertBarHelperRef.current.removeAlertBar(prevId);
      }
      prevReceptionIdRef.current = null;
      setHasAlertBar(false);
    }
  }, [externalReception]);

  const [initializationSequence, setInitializationSequence] = useState(0);
  const [receiptMemo, setReceiptMemo] = useState(
    initialUIState?.receiptMemo ?? ""
  );
  const [receivedAmount, setReceivedAmount] = useState(
    initialUIState?.receivedAmount ?? ""
  );

  useEffect(() => {
    if (shouldInitialize && !prevShouldInitialize) {
      setInitializationSequence((prev) => prev + 1);
    }
  }, [shouldInitialize, prevShouldInitialize]);

  const prevPaymentAmountRef = useRef<number | null>(null);
  const isInitialLoadRef = useRef<boolean>(true);
  const receivedAmountAppliedRef = useRef<string | null>(null);

  const paymentMethodDataFromCompletedReception = useMemo<PaymentMethodData | null>(() => {
    if (!isPaymentCompleted || !currentReception?.receptionInfo?.paymentInfo?.payments) {
      return null;
    }

    const payments = currentReception.receptionInfo.paymentInfo.payments;
    let isCard = false;
    let isCash = false;
    let card = "";
    let cash = "";
    let account = "";
    let installmentValue = "일시불";
    let isCashReceipt = false;
    let cashReceipt = "";
    let approvalMethodValue: CashApprovalMethod | undefined = undefined;
    let approvalNumberValue = "";

    let cardTotal = 0;
    let cashTotal = 0;
    payments.forEach((payment) => {
      if (payment.paymentSource === PaymentSource.CARD) {
        isCard = true;
        cardTotal += Number(payment.amount ?? 0);
      } else if (payment.paymentSource === PaymentSource.CASH) {
        isCash = true;
        cashTotal += Number(payment.amount ?? 0);
      }
    });
    if (isCard) {
      card = String(cardTotal);
    }
    if (isCash) {
      cash = String(cashTotal);
    }

    // 현금영수증 정보 추출
    const extractCashReceiptInfo = (terminalCashReceipt: ReceiptDetailsResponse) => {
      if (!terminalCashReceipt.payments) {
        return null;
      }

      let totalCashAmount = 0;
      let totalAccountAmount = 0;
      let totalCashReceiptAmount = 0;
      let firstApprovalNumber = "";

      for (const payment of terminalCashReceipt.payments) {
        if (payment.paymentSource === PaymentSource.CASH) {
          const cashReceived = payment.cashReceived ?? 0;

          if (payment.cashType === CashType.CASH) {
            totalCashAmount += cashReceived;
          } else if (payment.cashType === CashType.ACCOUNT) {
            totalAccountAmount += cashReceived;
          }
          totalCashReceiptAmount += cashReceived;

          if (!firstApprovalNumber && payment.identificationNumber) {
            firstApprovalNumber = payment.identificationNumber;
          }
        }
      }

      return {
        totalCashAmount,
        totalAccountAmount,
        totalCashReceiptAmount,
        firstApprovalNumber,
      };
    };

    if (receiptData && receiptData.length > 0) {
      const terminalCashReceipt = receiptData.find(
        (receipt) => receipt.isTerminalCashPayment === true
      );

      if (terminalCashReceipt) {
        const cashReceiptInfo = extractCashReceiptInfo(terminalCashReceipt);
        if (cashReceiptInfo) {
          isCashReceipt = true;
          if (cashReceiptInfo.totalCashAmount > 0) {
            cash = String(cashReceiptInfo.totalCashAmount);
          }
          if (cashReceiptInfo.totalAccountAmount > 0) {
            account = String(cashReceiptInfo.totalAccountAmount);
          }
          if (cashReceiptInfo.totalCashReceiptAmount > 0) {
            cashReceipt = String(cashReceiptInfo.totalCashReceiptAmount);
          }
          if (cashReceiptInfo.firstApprovalNumber) {
            approvalNumberValue = cashReceiptInfo.firstApprovalNumber;
          }
        }
      }
    }

    return {
      isCardChecked: isCard,
      isCashChecked: isCash,
      cardAmount: card,
      cashAmount: cash,
      accountAmount: account,
      installment: installmentValue,
      isCashReceiptChecked: isCashReceipt,
      cashReceiptAmount: cashReceipt,
      approvalMethod: approvalMethodValue,
      approvalNumber: approvalNumberValue,
      receiptData: receiptData || undefined,
    };
  }, [isPaymentCompleted, currentReception?.receptionInfo?.paymentInfo?.payments, receiptData]);

  const paymentMethodState = usePaymentMethodState(
    isPaymentCompleted,
    paymentMethodDataFromCompletedReception
  );

  const {
    isCardChecked,
    setIsCardChecked,
    isCashChecked,
    setIsCashChecked,
    installment,
    setInstallment,
    cardAmount,
    setCardAmount,
    cashAmount,
    setCashAmount,
    transferAmount,
    setTransferAmount,
    isCashReceiptChecked,
    setIsCashReceiptChecked,
    cashReceiptAmount,
    setCashReceiptAmount,
    approvalMethod,
    setApprovalMethod,
    approvalNumber,
    setApprovalNumber,
    isTerminal,
    setIsTerminal,
    cardApprovalNumber,
    setCardApprovalNumber,
    resetPaymentMethodState,
  } = paymentMethodState;

  const resolveInitialPaymentUIState = useCallback((): PaymentInfoViewState => {
    const base = createInitialPaymentInfoViewState();
    if (!initialUIState) {
      return base;
    }
    return {
      ...base,
      ...initialUIState,
      adjustmentValues: {
        ...base.adjustmentValues,
        ...(initialUIState.adjustmentValues ?? {}),
      },
    };
  }, [initialUIState]);

  const applyPaymentUIState = useCallback(
    (state: PaymentInfoViewState) => {
      setReceiptMemo(state.receiptMemo);
      setReceivedAmount(state.receivedAmount);
      setPrintPrescription(state.printPrescription);
      setPrintReceipt(state.printReceipt);
      setPrintStatement(state.printStatement);
      setIsCardChecked(state.isCardChecked);
      setIsCashChecked(state.isCashChecked);
      setInstallment(state.installment);
      setCardAmount(state.cardAmount);
      setCashAmount(state.cashAmount);
      setTransferAmount(state.transferAmount);
      setIsCashReceiptChecked(state.isCashReceiptChecked);
      setCashReceiptAmount(state.cashReceiptAmount);
      setApprovalMethod(state.approvalMethod);
      setApprovalNumber(state.approvalNumber);
      setIsTerminal(state.isTerminal);
      setCardApprovalNumber(state.cardApprovalNumber);
      setAdjustmentValues({
        discount: state.adjustmentValues.discount ?? 0,
        healthMaintenanceFee: state.adjustmentValues.healthMaintenanceFee ?? 0,
        grantAmount: state.adjustmentValues.grantAmount ?? 0,
        adjustments: normalizeAdjustments(state.adjustmentValues.adjustments),
      });
    },
    [
      setReceiptMemo,
      setReceivedAmount,
      setPrintPrescription,
      setPrintReceipt,
      setPrintStatement,
      setIsCardChecked,
      setIsCashChecked,
      setInstallment,
      setCardAmount,
      setCashAmount,
      setTransferAmount,
      setIsCashReceiptChecked,
      setCashReceiptAmount,
      setApprovalMethod,
      setApprovalNumber,
      setIsTerminal,
      setCardApprovalNumber,
      setAdjustmentValues,
      normalizeAdjustments,
    ]
  );

  useEffect(() => {
    if (hasInjectedReceivedAmount) {
      return;
    }
    if (!isPaymentCompleted) {
      receivedAmountAppliedRef.current = null;
    }

    if (
      isPaymentCompleted &&
      currentReception?.receptionInfo?.paymentInfo?.totalAmount !== undefined
    ) {
      const newAmount = String(currentReception.receptionInfo.paymentInfo.totalAmount);
      if (receivedAmountAppliedRef.current !== newAmount) {
        setReceivedAmount(newAmount);
        receivedAmountAppliedRef.current = newAmount;
      }
      return;
    }

    if (!isPaymentCompleted && paymentAmount >= 0) {
      const targetAmount = Math.max(0, paymentAmount);
      if (prevPaymentAmountRef.current === null) {
        setReceivedAmount(String(targetAmount));
      } else if (paymentAmount !== prevPaymentAmountRef.current) {
        setReceivedAmount(String(targetAmount));
      }
      prevPaymentAmountRef.current = paymentAmount;
    }
  }, [
    hasInjectedReceivedAmount,
    isPaymentCompleted,
    currentReception?.receptionInfo?.paymentInfo?.totalAmount,
    paymentAmount,
  ]);

  useEffect(() => {
    // 수납완료 상태에서는 receipt 데이터 기반으로 결제수단이 설정되므로 건너뜀
    if (isPaymentCompleted) return;

    const numericReceived = Number(receivedAmount) || 0;
    if (numericReceived === 0) {
      if (isCardChecked) {
        setIsCardChecked(false);
      }
      if (isCashChecked) {
        setIsCashChecked(false);
      }
      if (cardAmount !== "") {
        setCardAmount("");
      }
      if (cashAmount !== "") {
        setCashAmount("");
      }
      if (transferAmount !== "") {
        setTransferAmount("");
      }
      if (isCashReceiptChecked) {
        setIsCashReceiptChecked(false);
      }
      if (cashReceiptAmount !== "") {
        setCashReceiptAmount("");
      }
      if (approvalMethod !== "") {
        setApprovalMethod("");
      }
      if (approvalNumber !== "") {
        setApprovalNumber("");
      }
      if (cardApprovalNumber !== "") {
        setCardApprovalNumber("");
      }
    }
  }, [
    receivedAmount,
    isCardChecked,
    isCashChecked,
    cardAmount,
    cashAmount,
    transferAmount,
    isCashReceiptChecked,
    cashReceiptAmount,
    approvalMethod,
    approvalNumber,
    cardApprovalNumber,
    setIsCardChecked,
    setIsCashChecked,
    setCardAmount,
    setCashAmount,
    setTransferAmount,
    setIsCashReceiptChecked,
    setCashReceiptAmount,
    setApprovalMethod,
    setApprovalNumber,
    setCardApprovalNumber,
  ]);

  // transferAmount가 음수인 경우 카드 체크 자동 해제
  useEffect(() => {
    if (isPaymentCompleted) return;

    const transferNum = Number(transferAmount) || 0;
    if (transferNum < 0 && isCardChecked) {
      setIsCardChecked(false);
      // 카드 금액이 있으면 현금으로 이동
      const cardNum = Number(cardAmount) || 0;
      if (cardNum > 0) {
        const cashNum = Number(cashAmount) || 0;
        setCashAmount(String(cashNum + cardNum));
        setCardAmount('');
      }
    }
  }, [transferAmount, isCardChecked, cardAmount, cashAmount, isPaymentCompleted, setIsCardChecked, setCardAmount, setCashAmount]);

  useEffect(() => {
    // receptionId 비교 시 외부 id가 없으면 activeReceptionId를 그대로 사용해 불필요한 reset을 방지
    const effectiveExternalId = externalReceptionId ?? activeReceptionId;
    const isSameAsActive =
      effectiveExternalId && activeReceptionId && effectiveExternalId === activeReceptionId;

    if (isSameAsActive) {
      return;
    }

    if (hasInjectedUIState) {
      return;
    }

    // 초기 UI 상태 적용 전에는 reset으로 덮어쓰지 않도록 가드
    const hasAppliedInitialUI = Boolean(appliedInitialUIStateKeyRef.current);
    if (initialUIState && !hasAppliedInitialUI) {
      return;
    }
    const shouldReset = !isPaymentCompleted;
    if (shouldReset) {
      applyPaymentUIState(resolveInitialPaymentUIState());

      isInitialLoadRef.current = true;
      prevPaymentAmountRef.current = null;
      receivedAmountAppliedRef.current = null;
    }
  }, [
    externalReception,
    externalReceptionId,
    activeReceptionId,
    hasInjectedUIState,
    isPaymentCompleted,
    applyPaymentUIState,
    resolveInitialPaymentUIState,
  ]);

  // 외부 UI 상태를 적용 (reception 전환 시 1회 적용)
  useEffect(() => {
    if (!initialUIState) return;
    if (appliedInitialUIStateKeyRef.current) return;
    const initialUIStateKey = JSON.stringify(initialUIState);
    appliedInitialUIStateKeyRef.current = initialUIStateKey;

    applyPaymentUIState(resolveInitialPaymentUIState());
  }, [
    initialUIState,
    applyPaymentUIState,
    resolveInitialPaymentUIState,
  ]);

  const lastProcessedInitSequenceRef = useRef(0);
  useEffect(() => {
    if (
      initializationSequence === 0 ||
      initializationSequence === lastProcessedInitSequenceRef.current
    ) {
      return;
    }

    // 화면 상태를 주입받는 경우 초기화는 store 흐름에 맡김
    if (hasInjectedUIState) {
      lastProcessedInitSequenceRef.current = initializationSequence;
      return;
    }

    // initialUIState가 적용된 경우, 초기화로 덮어쓰지 않도록 방지
    if (appliedInitialUIStateKeyRef.current) {
      lastProcessedInitSequenceRef.current = initializationSequence;
      return;
    }
    if (!isPaymentCompleted) {
      applyPaymentUIState(resolveInitialPaymentUIState());

      // basePaymentData의 차감 내역을 복원하여 groupId 기반 감액 등이 유실되지 않도록 함
      setAdjustmentValues({
        discount: basePaymentData.discount ?? 0,
        healthMaintenanceFee:
          basePaymentData.healthMaintenanceFee ?? basePaymentData.cutPrice ?? 0,
        grantAmount: basePaymentData.grantAmount ?? 0,
        adjustments: normalizeAdjustments(basePaymentData.adjustments ?? []),
      });

      isInitialLoadRef.current = true;
      prevPaymentAmountRef.current = null;
      receivedAmountAppliedRef.current = null;
    }

    lastProcessedInitSequenceRef.current = initializationSequence;
  }, [
    initializationSequence,
    isPaymentCompleted,
    applyPaymentUIState,
    resolveInitialPaymentUIState,
    basePaymentData,
    normalizeAdjustments,
  ]);

  const [isCancelPopupOpen, setIsCancelPopupOpen] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [pendingReceipts, setPendingReceipts] = useState<ReceiptDetailsResponse[] | null>(null);

  const finalEncounter = receptionEncounter || null;

  const { ReceptionHtmlHiddenRenderer, renderPrintCenterSelectiveContent, checkShouldPrintPrescription } = usePrintService();
  const { openPrintPopup } = usePrintPopupStore();

  // 수납 성공 후 출력 처리 함수
  const handlePrintAfterPayment = useCallback(async () => {
    if (!finalEncounter?.id) {
      return;
    }
    if (!printPrescription && !printReceipt && !printStatement) {
      return;
    }

    const encounterId = String(finalEncounter.id);
    const documentTypes: DocumentType[] = [];

    if (printPrescription) {
      try {
        const shouldPrint = await checkShouldPrintPrescription(encounterId);
        if (shouldPrint) {
          documentTypes.push(DocumentType.PATIENT_PRESCRIPTION);
        }
      } catch (error) {
        console.error("처방전 출력 여부 확인 실패:", error);
      }
    }
    if (printReceipt) documentTypes.push(DocumentType.RECEIPT);
    if (printStatement) documentTypes.push(DocumentType.STATEMENT);

    if (documentTypes.length === 0) {
      return;
    }

    openPrintPopup({
      config: {
        title: "수납 출력",
        outputTypeCode: OutputTypeCode.DEFAULT_PRINTER,
        fileNamePrefix: "payment-documents",
        outputMode: 'html',
      },
      renderContent: () =>
        renderPrintCenterSelectiveContent({
          selections: [{ encounterId, documentTypes }],
        }),
    });
  }, [printPrescription, printReceipt, printStatement, finalEncounter?.id, checkShouldPrintPrescription, openPrintPopup, renderPrintCenterSelectiveContent]);

  const { executePayment, cancelPayment, isLoading: isPaymentLoading } = usePayment({
    registration: currentReception || null,
    encounter: finalEncounter,
    paymentFormData: {
      receivedAmount,
      receiptMemo,
      isCardChecked,
      isCashChecked,
      installment,
      cardAmount,
      cashAmount,
      transferAmount,
      isCashReceiptChecked,
      cashReceiptAmount,
      approvalMethod,
      approvalNumber,
      isTerminal,
      cardApprovalNumber,
    },
    paymentData,
    receiptData: receiptData || null,
    onSuccess: (_response) => {
      if (onPayment) {
        onPayment();
      }
    },
    onError: (error) => {
      console.error("수납 실패:", error);
    },
  });

  const handlePayment = useCallback(async () => {
    try {
      // 수납 처리
      await executePayment();

      // 수납 성공 후 체크박스 상태에 따라 출력 처리
      await handlePrintAfterPayment();

      // 수납 성공 후 체크박스 모두 해제
      setPrintPrescription(false);
      setPrintReceipt(false);
      setPrintStatement(false);
    } catch (error) {
      // 수납 실패 시 에러는 usePayment의 onError에서 처리됨
      throw error;
    }
  }, [executePayment, handlePrintAfterPayment]);

  const handleCancelPayment = useCallback(async () => {
    let ensuredReceipts: ReceiptDetailsResponse[];
    try {
      ensuredReceipts = await ensureReceiptDataForCancel();
    } catch (error: any) {
      toast.error(error?.message || "영수증 정보를 불러오는 데 실패했습니다.");
      return;
    }

    if (!ensuredReceipts || ensuredReceipts.length === 0) {
      toast.warning(
        "영수증 정보가 없습니다.",
        "수납완료 상태이지만 활성 영수증이 조회되지 않아 수납취소를 진행할 수 없습니다."
      );
      return;
    }

    const hasTerminalCardPayment = ensuredReceipts.some(
      (receipt) => receipt.isTerminalCardPayment === true
    );
    const hasTerminalCashPayment = ensuredReceipts.some(
      (receipt) => receipt.isTerminalCashPayment === true
    );

    let message = "수납취소하시겠습니까?";
    if (hasTerminalCardPayment) {
      message = "수납취소 시 신용카드 승인도 취소 됩니다. 수납취소하시겠습니까?";
    } else if (hasTerminalCashPayment) {
      message = "수납취소 시 현금영수증 승인도 취소 됩니다. 수납취소하시겠습니까?";
    }

    setCancelMessage(message);
    setPendingReceipts(ensuredReceipts);
    setIsCancelPopupOpen(true);
  }, [ensureReceiptDataForCancel, toast]);

  const handleConfirmCancel = useCallback(async () => {
    if (!pendingReceipts) {
      setIsCancelPopupOpen(false);
      return;
    }

    setIsCancelPopupOpen(false);
    const receiptsToCancel = pendingReceipts;
    setPendingReceipts(null);

    try {
      const cancelReason = "-";
      await cancelPayment(cancelReason, receiptsToCancel);

      // 수납취소 후 폼을 초기 상태로 복원
      // 1) 감액 항목: sync effect의 cancelledTransitionRef가 encounter 기반 데이터로 자동 복원
      //    (여기서 setAdjustmentValues하면 stale receipt 기반 basePaymentData가 적용되므로 제거)

      // 2) 수납방법(카드/현금 체크 등) 초기화
      resetPaymentMethodState();

      // 3) 영수액·메모 초기화 (영수액은 effect에서 paymentAmount 기반으로 재설정됨)
      setReceivedAmount("");
      setReceiptMemo("");
      prevPaymentAmountRef.current = null;
      receivedAmountAppliedRef.current = null;
      isInitialLoadRef.current = true;

      if (onPayment) {
        onPayment();
      }
    } catch (error) {
      console.error("[payment-index] handleConfirmCancel error:", error);
    }
  }, [pendingReceipts, cancelPayment, onPayment, resetPaymentMethodState]);

  const closeCancelPopup = useCallback(() => {
    setIsCancelPopupOpen(false);
    setPendingReceipts(null);
  }, []);

  const [isAdjustmentPopupOpen, setIsAdjustmentPopupOpen] = useState(false);

  const handleDeductionDetailClick = useCallback(() => {
    setIsAdjustmentPopupOpen(true);
  }, []);

  const handleCloseAdjustmentPopup = useCallback(() => {
    setIsAdjustmentPopupOpen(false);
  }, []);

  const handleApplyAdjustment = useCallback((values: AdjustmentValues) => {
    setAdjustmentValues(values);
  }, []);

  // UI 상태 변경 시 상위 콜백으로 전달
  useEffect(() => {
    if (!onUIStateChange) return;
    if (initialUIState && !hasAppliedInitialUIStateRef.current) {
      return;
    }
    const snapshot = {
      adjustmentValues,
      receiptMemo,
      receivedAmount,
      printPrescription,
      printReceipt,
      printStatement,
      isCardChecked,
      isCashChecked,
      installment,
      cardAmount,
      cashAmount,
      transferAmount,
      isCashReceiptChecked,
      cashReceiptAmount,
      approvalMethod,
      approvalNumber,
      isTerminal,
      cardApprovalNumber,
    };
    const snapshotKey = JSON.stringify(snapshot);
    if (lastEmittedUIStateRef.current === snapshotKey) return;
    lastEmittedUIStateRef.current = snapshotKey;
    onUIStateChange(snapshot);
  }, [
    onUIStateChange,
    adjustmentValues,
    receiptMemo,
    receivedAmount,
    printPrescription,
    printReceipt,
    printStatement,
    isCardChecked,
    isCashChecked,
    installment,
    cardAmount,
    cashAmount,
    transferAmount,
    isCashReceiptChecked,
    cashReceiptAmount,
    approvalMethod,
    approvalNumber,
    isTerminal,
    cardApprovalNumber,
  ]);

  useEffect(() => {
    if (!initialUIState) return;
    if (hasAppliedInitialUIStateRef.current) return;

    const isHydrated =
      (initialUIState.adjustmentValues === undefined ||
        JSON.stringify(initialUIState.adjustmentValues) ===
        JSON.stringify(adjustmentValues)) &&
      (initialUIState.receiptMemo === undefined ||
        initialUIState.receiptMemo === receiptMemo) &&
      (initialUIState.receivedAmount === undefined ||
        initialUIState.receivedAmount === receivedAmount) &&
      (initialUIState.printPrescription === undefined ||
        initialUIState.printPrescription === printPrescription) &&
      (initialUIState.printReceipt === undefined ||
        initialUIState.printReceipt === printReceipt) &&
      (initialUIState.printStatement === undefined ||
        initialUIState.printStatement === printStatement) &&
      (initialUIState.isCardChecked === undefined ||
        initialUIState.isCardChecked === isCardChecked) &&
      (initialUIState.isCashChecked === undefined ||
        initialUIState.isCashChecked === isCashChecked) &&
      (initialUIState.installment === undefined ||
        initialUIState.installment === installment) &&
      (initialUIState.cardAmount === undefined ||
        initialUIState.cardAmount === cardAmount) &&
      (initialUIState.cashAmount === undefined ||
        initialUIState.cashAmount === cashAmount) &&
      (initialUIState.transferAmount === undefined ||
        initialUIState.transferAmount === transferAmount) &&
      (initialUIState.isCashReceiptChecked === undefined ||
        initialUIState.isCashReceiptChecked === isCashReceiptChecked) &&
      (initialUIState.cashReceiptAmount === undefined ||
        initialUIState.cashReceiptAmount === cashReceiptAmount) &&
      (initialUIState.approvalMethod === undefined ||
        initialUIState.approvalMethod === approvalMethod) &&
      (initialUIState.approvalNumber === undefined ||
        initialUIState.approvalNumber === approvalNumber) &&
      (initialUIState.isTerminal === undefined ||
        initialUIState.isTerminal === isTerminal) &&
      (initialUIState.cardApprovalNumber === undefined ||
        initialUIState.cardApprovalNumber === cardApprovalNumber);

    if (isHydrated) {
      hasAppliedInitialUIStateRef.current = true;
    }
  }, [
    initialUIState,
    adjustmentValues,
    receiptMemo,
    receivedAmount,
    printPrescription,
    printReceipt,
    printStatement,
    isCardChecked,
    isCashChecked,
    installment,
    cardAmount,
    cashAmount,
    transferAmount,
    isCashReceiptChecked,
    cashReceiptAmount,
    approvalMethod,
    approvalNumber,
    isTerminal,
    cardApprovalNumber,
  ]);

  return {
    currentReception,
    activeReceptionId,
    receptionEncounter,
    isPaymentCompleted,
    paymentData,
    paymentAmount,
    orders,
    receiptData,
    paymentMethodState: {
      isCardChecked,
      setIsCardChecked,
      isCashChecked,
      setIsCashChecked,
      installment,
      setInstallment,
      cardAmount,
      setCardAmount,
      cashAmount,
      setCashAmount,
      transferAmount,
      setTransferAmount,
      isCashReceiptChecked,
      setIsCashReceiptChecked,
      cashReceiptAmount,
      setCashReceiptAmount,
      approvalMethod,
      setApprovalMethod,
      approvalNumber,
      setApprovalNumber,
      isTerminal,
      setIsTerminal,
      cardApprovalNumber,
      setCardApprovalNumber,
    },
    receiptMemo,
    setReceiptMemo,
    receivedAmount,
    setReceivedAmount,
    printOptions: {
      printPrescription,
      setPrintPrescription,
      printReceipt,
      setPrintReceipt,
      printStatement,
      setPrintStatement,
    },
    isPaymentLoading,
    handlePayment,
    handleCancelPayment,
    handleConfirmCancel,
    closeCancelPopup,
    isCancelPopupOpen,
    cancelMessage,
    handleDeductionDetailClick,
    handleApplyAdjustment,
    isAdjustmentPopupOpen,
    handleCloseAdjustmentPopup,
    basePaymentAmount,
    availableForDiscount,
    handleDiscountChange,
    hasAlertBar,
    shouldUseReceiptAsCompleted,
    ReceptionHtmlHiddenRenderer,
  };
}


