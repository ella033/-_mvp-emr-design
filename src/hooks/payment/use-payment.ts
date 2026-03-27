import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BillingService } from "@/services/biliing-service";
import { ReceiptService } from "@/services/receipt-service";
import type { BillingResponse } from "@/types/billing-types";
import type { Reception } from "@/types/common/reception-types";
import type { Encounter } from "@/types/chart/encounter-types";
import { 접수상태, PaymentSource, CashApprovalMethod } from "@/constants/common/common-enum";
import { useToastHelpers } from "@/components/ui/toast";
import type { PaymentInfo } from "@/types/receipt/payments-info-types";
import { useHospitalStore } from "@/store/hospital-store";
import type { UpdateRegistrationRequest } from "@/types/registration-types";
import { useUpdateRegistration } from "../registration/use-update-registration";
import type { PaymentData } from "@/types/payment-types";
import type { ReceiptCancelRequest, ReceiptDetailsResponse } from "@/types/receipt/receipt-details-types";
import { usePayBridge } from "./use-pay-bridge";
import { CashReceiptTypes, IdentificationTypes, SalesSlipType } from "@/services/pay-bridge";
import type { CashReceiptResult, PaymentResult, CancelPaymentResult, CashReceiptCancelResult } from "@/services/pay-bridge";
import { useReceptionTabsStore } from "@/store/common/reception-tabs-store";
import { convertKSTtoUTCDate } from "@/lib/date-utils";
import { getIdentificationTypeFromApprovalMethod } from "@/lib/payments-utils";
import { PaymentsServices } from "@/services/payments-services";
import { RegistrationsService } from "@/services/registrations-service";
import { useReceptionStore } from "@/store/common/reception-store";
import { ReceptionService } from "@/services/reception-service";
import { normalizeRegistrationId, REGISTRATION_ID_NEW } from "@/lib/registration-utils";
import { registrationKeys } from "@/lib/query-keys/registrations";

export interface PaymentFormData {
  // payment-amount에서
  receivedAmount: string;
  receiptMemo: string;

  // payment-method에서
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
}

interface UsePaymentOptions {
  registration?: Reception | null;
  encounter?: Encounter | null;
  paymentFormData: PaymentFormData;
  paymentData: PaymentData;
  /** 수납완료 상태일 때 사용할 영수증 정보 (취소용) */
  receiptData?: ReceiptDetailsResponse[] | null;
  onSuccess?: (response: BillingResponse) => void;
  onError?: (error: Error) => void;
}

type ExecutePaymentOverrides = Partial<
  Pick<
    UsePaymentOptions,
    | "registration"
    | "encounter"
    | "paymentFormData"
    | "paymentData"
    | "receiptData"
    | "onSuccess"
    | "onError"
  >
>;

/**
 * 수납 처리를 위한 Custom Hook
 * registration.status에 따라 다른 로직을 처리합니다.
 */
export function usePayment({
  registration,
  encounter,
  paymentFormData,
  paymentData,
  receiptData,
  onSuccess,
  onError,
}: UsePaymentOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToastHelpers();
  const { hospital } = useHospitalStore();
  const updateRegistrationMutation = useUpdateRegistration();
  const { removeOpenedReception, updateOpenedReception } = useReceptionTabsStore();
  const { updateRegistration: updateRegistrationInStore } = useReceptionStore();
  // 단말기 연동 훅 (React Hook 규칙 준수를 위해 항상 호출)
  // 단말기 연동 사용 여부는 단말기 status 확인을 통해 동적으로 판단
  const payBridge = usePayBridge();

  /**
   * hospitalId를 전역적으로 관리하는 함수
   * store에서 hospital.id를 가져옵니다.
   */
  const getHospitalId = useCallback((): number => {
    // 먼저 store에서 hospital.id 확인
    if (hospital?.id) {
      return hospital.id;
    }
    // 기본값 (임시)
    return 1;
  }, [hospital]);


  /**
   * 수납 실행 함수
   * registration.status에 따라 다른 로직 처리
   */
  const executePayment = useCallback(async (overrides?: ExecutePaymentOverrides) => {
    const effectiveRegistration = overrides?.registration ?? registration;
    const effectiveEncounter = overrides?.encounter ?? encounter;
    const effectivePaymentFormData = overrides?.paymentFormData ?? paymentFormData;
    const effectivePaymentData = overrides?.paymentData ?? paymentData;
    const effectiveOnSuccess = overrides?.onSuccess ?? onSuccess;
    const effectiveOnError = overrides?.onError ?? onError;

    if (!effectiveRegistration) {
      toast.error("수납 실패", "Registration 정보가 없습니다.");
      return;
    }

    if (!effectiveEncounter) {
      toast.error("수납 실패", "Encounter 정보가 없습니다.");
      return;
    }

    // transferAmount가 0이면 결제 수단 선택 없이 수납 진행 가능
    const transferAmount = Number(effectivePaymentFormData.transferAmount);

    // transferAmount가 음수인 경우 카드는 사용 불가 (현금만 가능)
    if (transferAmount < 0 && effectivePaymentFormData.isCardChecked) {
      toast.error("수납 실패", "계좌이체금액이 음수인 경우 카드 결제는 불가능합니다.");
      return;
    }

    if (transferAmount !== 0) {
      // transferAmount가 0이 아닌 경우에만 결제 수단 확인
      const hasPaymentMethod =
        (effectivePaymentFormData.isCardChecked && Number(effectivePaymentFormData.cardAmount) > 0) ||
        (effectivePaymentFormData.isCashChecked && Number(effectivePaymentFormData.cashAmount) > 0) ||
        transferAmount > 0;

      if (!hasPaymentMethod) {
        toast.error("수납 실패", "결제 수단을 선택해주세요.");
        return;
      }
    }

    setIsLoading(true);

    try {
      // registration.status에 따른 분기 처리
      if (effectiveRegistration.receptionInfo?.status === 접수상태.수납대기) {
        // 단말기 연동 수납 확인
        let paymentResult: PaymentResult | undefined;
        let cashResult: CashReceiptResult | undefined;

        let isTerminalAvailable = false;
        if (effectivePaymentFormData.isTerminal && effectivePaymentFormData.receivedAmount !== '0') {
          isTerminalAvailable = await payBridge.checkTerminalConnection();
          if (!isTerminalAvailable) {
            toast.error('단말기 연결 확인 실패');
          }
        }

        if (isTerminalAvailable) {

          // 현금영수증 발행 처리
          const isCashReceiptRequested = effectivePaymentFormData.isCashChecked && effectivePaymentFormData.isCashReceiptChecked && effectivePaymentFormData.cashReceiptAmount;
          if (isCashReceiptRequested) {
            const cashAmount = Number(effectivePaymentFormData.cashAmount) + Number(effectivePaymentFormData.transferAmount) || 0;

            if (cashAmount > 0) {
              // approvalMethod를 CashReceiptTypes로 변환
              let receiptType: CashReceiptTypes;
              let identificationType: IdentificationTypes;

              if (!effectivePaymentFormData.approvalMethod) {
                throw new Error('유효하지 않은 승인방법입니다.');
              }

              identificationType = getIdentificationTypeFromApprovalMethod(effectivePaymentFormData.approvalMethod);

              if (effectivePaymentFormData.approvalMethod === CashApprovalMethod.휴대폰번호) {
                receiptType = CashReceiptTypes.CONSUMER;
              } else if (effectivePaymentFormData.approvalMethod === CashApprovalMethod.카드번호) {
                receiptType = CashReceiptTypes.CONSUMER;
              }else if (effectivePaymentFormData.approvalMethod === CashApprovalMethod.주민등록번호) {
                receiptType = CashReceiptTypes.CONSUMER;
              }
               else if (effectivePaymentFormData.approvalMethod === CashApprovalMethod.사업자등록번호) {
                receiptType = CashReceiptTypes.BUSINESS;
              } else if (effectivePaymentFormData.approvalMethod === CashApprovalMethod.자진발급번호) {
                receiptType = CashReceiptTypes.SELF;
              } else {
                throw new Error('유효하지 않은 승인방법입니다.');
              }

              try {
                // Pay Bridge SDK로 현금영수증 발행 요청
                cashResult = await payBridge.requestCashReceipt({
                  receiptType,
                  identificationNumber: effectivePaymentFormData.approvalNumber,
                  identificationType,
                  amount: cashAmount,
                  printSalesSlipType: SalesSlipType.CustomerOnly,
                  printReceiptStr: effectivePaymentFormData.receiptMemo || '',
                });
              } catch (error: any) {
                // 현금영수증 발행 실패 시 에러 메시지 표시 후 종료
                const errorMessage = error?.message || '현금영수증 발행 실패';
                toast.error(errorMessage);
                return; // 더이상 결제 진행 불가
              }
            }
          }

          // 카드 결제 처리
          if (effectivePaymentFormData.isCardChecked && Number(effectivePaymentFormData.cardAmount) > 0) {
            const cardAmount = Number(effectivePaymentFormData.cardAmount) || 0;
            const installmentMonths = Number(effectivePaymentFormData.installment) || 0;

            // 현금영수증 발행 후 카드 결제가 필요한 경우 2초 지연
            if (isCashReceiptRequested) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }

            try {
              // Pay Bridge SDK로 카드 결제 요청

              paymentResult = await payBridge.requestCardPayment({
                amount: cardAmount,
                installmentMonths,
                useSign: false,
                signData: '',
                printSalesSlipType: SalesSlipType.CustomerOnly,
                printReceiptStr: effectivePaymentFormData.receiptMemo || '',
              });
            } catch (error: any) {
              // 카드 결제 실패 시 에러 메시지 표시 후 종료
              const errorMessage = error?.message || '카드 결제 실패';
              toast.error(errorMessage);
              return; // 더이상 결제 진행 불가
            }
          }
        }

        const billingRequest = PaymentsServices.convertToBillingRequest({
          encounter: effectiveEncounter,
          paymentData: effectivePaymentData,
          paymentFormData: effectivePaymentFormData,
          isTerminalAvailable,
          hospitalId: getHospitalId(),
        });

        // 카드 결제 응답이 있으면 payments 배열의 첫 번째 카드 결제에 모든 정보 반영
        if (paymentResult && billingRequest.settlement.payments.length > 0) {
          const cardPayment = billingRequest.settlement.payments.find(
            (p) => p.paymentSource === PaymentSource.CARD
          );
          if (cardPayment) {
            cardPayment.cardNumber = paymentResult.cardNumber;
            cardPayment.issuerCode = paymentResult.issuerCode;
            cardPayment.issuerName = paymentResult.issuerName;
            cardPayment.installmentMonths = paymentResult.installmentMonths;
            cardPayment.acquirerCode = paymentResult.acquirerCode;
            cardPayment.acquirerName = paymentResult.acquirerName;
            cardPayment.approvalNo = paymentResult.approvalNumber;
            cardPayment.approvalDate = convertKSTtoUTCDate(paymentResult.approvalDate);
            cardPayment.vanTransactionNo = paymentResult.vanTransacctionNo;
            cardPayment.catId = paymentResult.catId;
          }
        }


        // 현금영수증 응답이 있으면 payments 배열의 현금 결제에 모든 정보 반영
        if (cashResult && billingRequest.settlement.payments.length > 0) {
          const cashPayments = billingRequest.settlement.payments.filter(
            (p) => p.paymentSource === PaymentSource.CASH
          );
          // 현금 결제가 여러 개일 수 있으므로, 현금영수증이 발행된 결제에만 정보 반영
          // 현금영수증이 발행된 경우는 cashAmount + transferAmount 합계와 일치하는 결제
          const cashAmount = Number(effectivePaymentFormData.cashAmount) || 0;

          for (const cashPayment of cashPayments) {
            if (cashPayment) {
              cashPayment.approvalNo = cashResult.approvalNumber;
              cashPayment.approvalDate = convertKSTtoUTCDate(cashResult.approvalDate);
              cashPayment.vanTransactionNo = cashResult.transactionNo;
              cashPayment.receiptType = cashResult.receiptType;
              // 현금영수증의 경우는 원승인번호 저장을 위해 넘겨받은 값을 저장
              if (effectivePaymentFormData.approvalMethod) {
                cashPayment.identificationType = getIdentificationTypeFromApprovalMethod(effectivePaymentFormData.approvalMethod) as any;
              }
              cashPayment.identificationNumber = effectivePaymentFormData.approvalNumber;//cashResult값은 **** 처리되어있음
              cashPayment.cashReceived = cashAmount;
              cashPayment.catId = cashResult.catId;
              cashPayment.catVersion = cashResult.catVersion;
              break; // 첫 번째 일치하는 결제에만 반영
            }
          }
        }
        const response = await BillingService.oneClickBilling(billingRequest);

        const updateRegistrationRequest: UpdateRegistrationRequest = {
          status: 접수상태.수납완료,
        };
        await updateRegistrationMutation.mutateAsync({
          id: effectiveRegistration.originalRegistrationId || "",
          data: updateRegistrationRequest,
        });

        // paymentInfo/hasReceipt 등은 registrations 리스트 API에 즉시 포함되지 않을 수 있어 1건만 재조회하여 store 동기화
        try {
          const refreshed = await RegistrationsService.getRegistration(
            effectiveRegistration.originalRegistrationId || ""
          );
          updateRegistrationInStore(refreshed.id, refreshed as any);

          // 열려있는 탭도 최신으로 업데이트
          const refreshedReception =
            ReceptionService.convertRegistrationToReception(refreshed as any);
          const normalizedId = normalizeRegistrationId(
            refreshedReception.originalRegistrationId
          );
          updateOpenedReception(
            normalizedId || REGISTRATION_ID_NEW,
            refreshedReception as any
          );

          // receipts 기반 UI(patient-card / payment-index)가 즉시 최신 금액을 보도록 activeReceiptDetails 캐시 갱신
          const patientId = refreshed.patientId ? String(refreshed.patientId) : null;
          const encounterId = (() => {
            return PaymentsServices.getLatestEncounterId(refreshed.encounters as any);
          })();
          if (patientId && encounterId) {
            const refreshedReceipts = await PaymentsServices.getActiveReceiptDetails(
              patientId,
              encounterId
            );
            queryClient.setQueryData(
              ["activeReceiptDetails", patientId, encounterId],
              refreshedReceipts
            );
          }
        } catch (e) {
          // store 동기화 실패는 치명적이지 않으므로 무시 (소켓/리프레시로 결국 수렴)
          console.warn("[use-payment] registration refresh failed:", e);
        }

        // registrations 계열 리스트/이력 화면이 즉시 최신으로 수렴하도록 캐시 무효화
        queryClient.invalidateQueries({ queryKey: registrationKeys.all });
        if (effectiveRegistration.originalRegistrationId) {
          removeOpenedReception(effectiveRegistration.originalRegistrationId);
        }
        toast.success("수납 완료", "수납이 완료되었습니다.");
        effectiveOnSuccess?.(response);
      } else if (effectiveRegistration.receptionInfo?.status === 접수상태.수납완료) {
        // 수납완료 상태: 추가 수납 또는 환불 처리
        // TODO: 향후 구현 예정
        toast.error("수납 실패", "수납완료 상태에서는 추가 수납 처리가 필요합니다.");
      } else {
        toast.error("수납 실패", `수납 가능한 상태가 아닙니다. (현재 상태: ${effectiveRegistration.receptionInfo?.status})`);
      }
    } catch (error: any) {
      const errorMessage = error?.message || "수납 처리 중 오류가 발생했습니다.";
      toast.error("수납 실패", errorMessage);
      effectiveOnError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [
    registration,
    encounter,
    paymentFormData,
    paymentData,
    getHospitalId,
    toast,
    onSuccess,
    onError,
    updateRegistrationMutation,
    payBridge,
    removeOpenedReception,
  ]);

  /**
   * 수납 취소 함수
   * registration.status가 접수상태.수납완료인 경우에만 실행 가능
   * @param cancelReason - 취소 사유
   */
  const cancelPayment = useCallback(async (cancelReason: string, overrideReceiptData?: ReceiptDetailsResponse[] | null) => {
    if (!registration) {
      toast.error("수납 취소 실패", "Registration 정보가 없습니다.");
      return;
    }

    // 수납완료 상태인지 확인
    if (registration.receptionInfo?.status !== 접수상태.수납완료) {
      toast.error(
        "수납 취소 실패",
        `수납 취소는 수납완료 상태에서만 가능합니다. (현재 상태: ${registration.receptionInfo?.status})`
      );
      return;
    }
    const effectiveReceiptData = overrideReceiptData ?? receiptData;
    // receiptData 확인
    if (!effectiveReceiptData || effectiveReceiptData.length === 0) {
      toast.error("수납 취소 실패", "영수증 정보를 찾을 수 없습니다.");
      return;
    }

    // 모든 receipt에 대해 연동 결제 여부 확인
    const hasCardIntegration = effectiveReceiptData.some((receipt) => receipt.isTerminalCardPayment === true);
    const hasCashIntegration = effectiveReceiptData.some((receipt) => receipt.isTerminalCashPayment === true);
    setIsLoading(true);

    // 취소 승인 정보를 수집할 배열
    const cancelApprovalInfoList: Array<{ paymentId: string; cancelApprovalNo?: string; cancelApprovalDate?: string }> = [];

    try {
      try {
        if (hasCardIntegration || hasCashIntegration) {
          const isTerminalAvailable = await payBridge.checkTerminalConnection();


          if (!isTerminalAvailable) {
            toast.error('단말기 연결 확인 실패');
            return;
          }
        }

        // 3-1. PayBridge 연동 취소 (현금영수증)
        if (hasCashIntegration) {
          for (const receipt of effectiveReceiptData) {
            if (!receipt.isTerminalCashPayment) continue;

            const payments: PaymentInfo[] = receipt.payments ?? [];
            const integratedCashPayments = payments.filter(
              (p) => p.paymentSource === PaymentSource.CASH && p.identificationNumber
            );

            for (const payment of integratedCashPayments) {
              const identificationNumber: string = payment.identificationNumber ?? "";
              const receiptType: CashReceiptTypes = payment.receiptType ?? CashReceiptTypes.CONSUMER;
              const approvalNumber: string | undefined = payment.approvalNo ?? undefined;
              const approvalDate: Date | undefined = payment.approvalDate ?? undefined;
              const amount = payment.paymentAmount;

              const cancelResult = await payBridge.cancelCashReceipt({
                amount,
                receiptType: receiptType!,
                identificationNumber,
                approvalNumber: approvalNumber!,
                approvalDate: approvalDate!,
              });

              // 취소 결과에서 취소 승인 정보 추출
              if (cancelResult?.result && payment.paymentId) {
                const cashCancelResult = cancelResult.result as unknown as CashReceiptCancelResult;
                cancelApprovalInfoList.push({
                  paymentId: payment.paymentId,
                  cancelApprovalNo: cashCancelResult.cancelApprovalNumber,
                  cancelApprovalDate: cashCancelResult.cancelDateTime ? convertKSTtoUTCDate(new Date(cashCancelResult.cancelDateTime)).toISOString() : undefined,
                });
              }
            }
          }
        }
        // 3-2. PayBridge 연동 취소 (카드)
        if (hasCardIntegration) {
          // 현금영수증 취소가 있는 경우 2초 지연 후 카드 취소 요청
          if (hasCashIntegration) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          for (const receipt of effectiveReceiptData) {
            if (!receipt.isTerminalCardPayment) continue;

            const payments: PaymentInfo[] = receipt.payments ?? [];
            const integratedCardPayments = payments.filter(
              (p) => p.paymentSource === PaymentSource.CARD && p.approvalNo
            );

            for (const payment of integratedCardPayments) {
              const approvalNumber = payment.approvalNo;
              const approvalDate = payment.approvalDate ?? undefined;
              const amount = payment.paymentAmount;
              const installmentMonths = payment.installmentMonths ?? 0;

              const cancelResult = await payBridge.cancelCardPayment({
                amount,
                approvalNumber: approvalNumber!,
                approvalDate: approvalDate!,
                installmentMonths,
              });

              // 취소 결과에서 취소 승인 정보 추출
              if (cancelResult?.result && payment.paymentId) {
                const cardCancelResult = cancelResult.result as unknown as CancelPaymentResult;
                cancelApprovalInfoList.push({
                  paymentId: payment.paymentId,
                  cancelApprovalNo: cardCancelResult.originApprovalNumber,
                  cancelApprovalDate: cardCancelResult.cancelApprovalDate ? convertKSTtoUTCDate(cardCancelResult.cancelApprovalDate).toISOString() : undefined,
                });
              }
            }
          }
        }
      }
      catch (error: any) {
        toast.error("연동 수납 취소 실패", error.message);
        return;
      }

      // 4. 모든 영수증 일괄 취소 (연동 내역이 없거나, 연동 취소까지 모두 성공한 경우)
      const cancelRequest: ReceiptCancelRequest = {
        cancelReason: cancelReason.trim(),
        cancelApprovalInfo: cancelApprovalInfoList.length > 0 ? cancelApprovalInfoList : undefined,
      };

      // 모든 receipt를 일괄 취소
      await Promise.all(
        effectiveReceiptData.map((receipt) => ReceiptService.cancelReceipt(receipt.id, cancelRequest))
      );

      // 수납 취소 성공 시 registration 상태를 수납대기로 변경
      const updateRegistrationRequest: UpdateRegistrationRequest = {
        status: 접수상태.수납대기,
      };
      await updateRegistrationMutation.mutateAsync({
        id: registration.originalRegistrationId || "",
        data: updateRegistrationRequest,
      });

      // 취소 직후에도 receipts 기반 UI가 즉시 갱신되도록 1건 재조회 + activeReceiptDetails 캐시 갱신
      try {
        const refreshed = await RegistrationsService.getRegistration(
          registration.originalRegistrationId || ""
        );
        updateRegistrationInStore(refreshed.id, refreshed as any);

        const patientId = refreshed.patientId ? String(refreshed.patientId) : null;
        const encounterId = (() => {
          return PaymentsServices.getLatestEncounterId(refreshed.encounters as any);
        })();
        if (patientId && encounterId) {
          const refreshedReceipts = await PaymentsServices.getActiveReceiptDetails(
            patientId,
            encounterId
          );
          queryClient.setQueryData(
            ["activeReceiptDetails", patientId, encounterId],
            refreshedReceipts
          );
        }
      } catch (e) {
        console.warn("[use-payment] cancel refresh failed:", e);
      }

      // 수납 취소 직후 registrations 계열 리스트/출력센터 등의 hasReceipt가 즉시 갱신되도록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: registrationKeys.all });

      toast.success("수납 취소 완료", "수납이 취소되었습니다.");
    } catch (error: any) {
      const errorMessage = error?.message || "수납 취소 처리 중 오류가 발생했습니다.";
      toast.error("수납 취소 실패", errorMessage);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [
    registration,
    receiptData,
    toast,
    onError,
    updateRegistrationMutation,
    payBridge,
  ]);

  /**
   * 현금 결제 취소 함수
   * PaymentInfo를 받아 현금 결제만 취소합니다.
   * @param cancelReason - 취소 사유
   * @param payment - 취소할 결제 정보
   * @param isTerminal - 단말기 연동 여부
   * @returns 취소 승인 정보
   */
  const cancelCashPayment = useCallback(
    async (
      _cancelReason: string,
      payment: PaymentInfo,
      isTerminal: boolean
    ): Promise<{ paymentId: string; cancelApprovalNo?: string; cancelApprovalDate?: string } | null> => {
      // 현금 결제인지 확인
      if (payment.paymentSource !== PaymentSource.CASH) {
        toast.error("수납 취소 실패", "현금 결제가 아닙니다.");
        return null;
      }

      // 단말기 연동이 필요한 경우 확인
      if (isTerminal && !payment.identificationNumber) {
        toast.error("수납 취소 실패", "단말기 연동 현금 결제 정보가 없습니다.");
        return null;
      }

      setIsLoading(true);

      try {
        // 단말기 연동 취소 처리
        if (isTerminal) {
          const isTerminalAvailable = await payBridge.checkTerminalConnection();

          if (!isTerminalAvailable) {
            toast.error("단말기 연결 확인 실패");
            return null;
          }

          const identificationNumber: string = payment.identificationNumber ?? "";
          const receiptType: CashReceiptTypes = payment.receiptType ?? CashReceiptTypes.CONSUMER;
          const approvalNumber: string | undefined = payment.approvalNo ?? undefined;
          const approvalDate: Date | undefined = payment.approvalDate ?? undefined;
          const amount = payment.paymentAmount;

          if (!approvalNumber || !approvalDate) {
            toast.error("수납 취소 실패", "승인번호 또는 승인일자가 없습니다.");
            return null;
          }

          const cancelResult = await payBridge.cancelCashReceipt({
            amount,
            receiptType: receiptType!,
            identificationNumber,
            approvalNumber: approvalNumber!,
            approvalDate: approvalDate!,
          });

          // 취소 결과에서 취소 승인 정보 추출
          if (cancelResult?.result && payment.paymentId) {
            const cashCancelResult = cancelResult.result as unknown as CashReceiptCancelResult;
            return {
              paymentId: payment.paymentId,
              cancelApprovalNo: cashCancelResult.cancelApprovalNumber,
              cancelApprovalDate: cashCancelResult.cancelDateTime
                ? convertKSTtoUTCDate(new Date(cashCancelResult.cancelDateTime)).toISOString()
                : undefined,
            };
          }
        }

        // 단말기 연동이 아닌 경우 취소 승인 정보 없이 반환
        return {
          paymentId: payment.paymentId,
        };
      } catch (error: any) {
        const errorMessage = error?.message || "현금 결제 취소 처리 중 오류가 발생했습니다.";
        toast.error("현금 결제 취소 실패", errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast, payBridge]
  );

  /**
   * 카드 결제 취소 함수
   * PaymentInfo를 받아 카드 결제만 취소합니다.
   * @param cancelReason - 취소 사유
   * @param payment - 취소할 결제 정보
   * @param isTerminal - 단말기 연동 여부
   * @returns 취소 승인 정보
   */
  const cancelCreditPayment = useCallback(
    async (
      _cancelReason: string,
      payment: PaymentInfo,
      isTerminal: boolean
    ): Promise<{ paymentId: string; cancelApprovalNo?: string; cancelApprovalDate?: string } | null> => {
      // 카드 결제인지 확인
      if (payment.paymentSource !== PaymentSource.CARD) {
        toast.error("수납 취소 실패", "카드 결제가 아닙니다.");
        return null;
      }

      // 단말기 연동이 필요한 경우 확인
      if (isTerminal && !payment.approvalNo) {
        toast.error("수납 취소 실패", "단말기 연동 카드 결제 정보가 없습니다.");
        return null;
      }

      setIsLoading(true);

      try {
        // 단말기 연동 취소 처리
        if (isTerminal) {
          const isTerminalAvailable = await payBridge.checkTerminalConnection();

          if (!isTerminalAvailable) {
            toast.error("단말기 연결 확인 실패");
            return null;
          }

          const approvalNumber = payment.approvalNo;
          const approvalDate = payment.approvalDate ?? undefined;
          const amount = payment.paymentAmount;
          const installmentMonths = payment.installmentMonths ?? 0;

          if (!approvalNumber || !approvalDate) {
            toast.error("수납 취소 실패", "승인번호 또는 승인일자가 없습니다.");
            return null;
          }

          const cancelResult = await payBridge.cancelCardPayment({
            amount,
            approvalNumber: approvalNumber!,
            approvalDate: approvalDate!,
            installmentMonths,
          });

          // 취소 결과에서 취소 승인 정보 추출
          if (cancelResult?.result && payment.paymentId) {
            const cardCancelResult = cancelResult.result as unknown as CancelPaymentResult;
            return {
              paymentId: payment.paymentId,
              cancelApprovalNo: cardCancelResult.originApprovalNumber,
              cancelApprovalDate: cardCancelResult.cancelApprovalDate
                ? convertKSTtoUTCDate(cardCancelResult.cancelApprovalDate).toISOString()
                : undefined,
            };
          }
        }

        // 단말기 연동이 아닌 경우 취소 승인 정보 없이 반환
        return {
          paymentId: payment.paymentId,
        };
      } catch (error: any) {
        const errorMessage = error?.message || "카드 결제 취소 처리 중 오류가 발생했습니다.";
        toast.error("카드 결제 취소 실패", errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [toast, payBridge]
  );

  return {
    executePayment,
    cancelPayment,
    cancelCashPayment,
    cancelCreditPayment,
    isLoading,
  };
}

