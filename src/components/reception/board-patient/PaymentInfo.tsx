import type { ExternalReception } from "./types";
import PaymentInfoPanel from "./(payment-info)/payment-index";
import { AlertBarProvider } from "@/components/ui/alert-bar";
import { useReceptionViewState } from "@/hooks/reception/use-reception-view-state";
import { ReceptionInitialTab } from "@/constants/common/common-enum";
import {
  createInitialPaymentInfoViewState,
  type PaymentInfoViewState,
} from "@/types/common/reception-view-types";
import { useMemo, useCallback } from "react";

export interface PaymentInfoProps {
  reception: ExternalReception | null;
  receptionId?: string | null;
  isDisabled?: boolean;
  onChange?: (updates: Partial<ExternalReception>) => void;
  onOpenDetail?: () => void;
}

/**
 * 수납 정보 탭 (기존 BoardPaymentInfo 대체용 공용 컴포넌트)
 */
export function PaymentInfo({
  reception,
  receptionId,
  isDisabled,
  onOpenDetail,
}: PaymentInfoProps) {
  const resolvedReceptionId =
    receptionId ?? reception?.originalRegistrationId ?? undefined;
  const { tabState, updateTabState } = useReceptionViewState({
    receptionId: resolvedReceptionId,
    tab: ReceptionInitialTab.수납정보,
  });

  const fallbackPaymentState = useMemo(
    () => createInitialPaymentInfoViewState(),
    []
  );

  const isDefaultPaymentState = useMemo(() => {
    if (!tabState) return true;
    return JSON.stringify(tabState) === JSON.stringify(fallbackPaymentState);
  }, [tabState, fallbackPaymentState]);

  const initialPaymentUIState = useMemo(() => {
    if (!tabState || isDefaultPaymentState) {
      return undefined;
    }
    return tabState;
  }, [isDefaultPaymentState, tabState]);

  const handlePaymentUIStateChange = useCallback(
    (updates: Partial<PaymentInfoViewState>) => {
      updateTabState(updates);
    },
    [updateTabState]
  );

  const handlePayment = () => {
    // 수납 완료 후 상위에서 추가로 하고 싶은 일이 있으면 onOpenDetail 등을 사용할 수 있음
    onOpenDetail?.();
  };

  return (
    <div className="flex flex-col w-full h-full" data-testid="reception-payment-panel">
      <AlertBarProvider>
        <PaymentInfoPanel
          className="flex w-full h-full"
          onPayment={handlePayment}
          reception={reception ?? undefined}
          receptionId={resolvedReceptionId}
          isDisabled={isDisabled ?? false}
          initialPaymentUIState={initialPaymentUIState}
          onPaymentUIStateChange={handlePaymentUIStateChange}
        />
      </AlertBarProvider>
    </div>
  );
}
