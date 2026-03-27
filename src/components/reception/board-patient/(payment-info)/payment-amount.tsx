import { useEffect, useRef, useState } from 'react';
import type { PaymentData } from '@/types/payment-types';
import type { Encounter } from '@/types/chart/encounter-types';
import { PaymentsServices } from '@/services/payments-services';
import { DiscountSelector } from './discount-selector';
import MedicalBillInfo from '@/app/medical/_components/panels/(medical-bill)/medical-bill-info';

interface PaymentAmountProps {
  paymentData: PaymentData;
  receiptMemo: string;
  setReceiptMemo: (value: string) => void;
  receivedAmount: string;
  setReceivedAmount: (value: string) => void;
  onDeductionDetailClick?: () => void;
  onDiscountChange?: (discountType: string, discountAmount: number) => void;
  availableForDiscount?: number;
  preserveReceivedAmount?: boolean;
  disabled?: boolean;
  encounter?: Encounter | null;
  onSaveAndTransmit?: () => void;
  onPrintAndTransmit?: () => void;
}

export default function PaymentAmount({
  paymentData,
  receiptMemo,
  setReceiptMemo,
  receivedAmount,
  setReceivedAmount,
  onDeductionDetailClick,
  onDiscountChange,
  availableForDiscount = 0,
  preserveReceivedAmount = false,
  disabled = false,
  encounter,
  onSaveAndTransmit,
  onPrintAndTransmit,
}: PaymentAmountProps) {
  const [openMedicalBillCalculator, setOpenMedicalBillCalculator] = useState(false);
  const paymentAmount = PaymentsServices.calculatePaymentAmount(paymentData);

  const isPaymentAmountNegative = paymentAmount < 0;
  const hasInitialReceivedAmountSetRef = useRef(false);
  const preserveReceivedAmountRef = useRef(preserveReceivedAmount);
  const prevPaymentAmountRef = useRef<number | null>(null);

  useEffect(() => {
    preserveReceivedAmountRef.current = preserveReceivedAmount;
  }, [preserveReceivedAmount]);

  useEffect(() => {
    if (paymentAmount === 0 && receivedAmount !== "0") {
      preserveReceivedAmountRef.current = false;
      setReceivedAmount("0");
    }
  }, [paymentAmount, receivedAmount, setReceivedAmount]);

  // 규칙 1: 최초 셋팅은 납부할 금액을 영수액에 그대로 설정한다.
  // receivedAmount가 외부에서 ''로 리셋된 경우에도 재초기화를 허용한다.
  useEffect(() => {
    if (preserveReceivedAmountRef.current) {
      return;
    }
    // 이미 초기 셋팅이 완료되었고, receivedAmount가 비어있지 않은 경우 건너뛴다.
    // (외부 초기화로 ''이 된 경우에는 재설정을 허용)
    if (hasInitialReceivedAmountSetRef.current && receivedAmount !== '') {
      return;
    }

    const currentReceived = Number(receivedAmount || 0);
    // paymentAmount가 0 이상이고, 아직 영수액이 입력되지 않은 상태일 때만 초기 셋팅
    if (paymentAmount >= 0 && currentReceived === 0 && (receivedAmount === '' || receivedAmount === '0')) {
      setReceivedAmount(String(paymentAmount));
      hasInitialReceivedAmountSetRef.current = true;
      prevPaymentAmountRef.current = paymentAmount;
    }
  }, [paymentAmount, receivedAmount, setReceivedAmount]);

  // 규칙 2, 3 보조: 납부할 금액이 변경되어 기존 영수액이 상한을 넘는 경우 보정
  // 차감내역 변경으로 인한 paymentAmount 변경 시 영수액도 자동 업데이트
  useEffect(() => {
    const currentReceived = Number(receivedAmount || 0);
    const prevPaymentAmount = prevPaymentAmountRef.current;

    // 음수인 경우는 즉시 0으로 보정하고 입력을 막는다. (규칙 3)
    if (currentReceived < 0) {
      setReceivedAmount('0');
      prevPaymentAmountRef.current = paymentAmount;
      return;
    }

    // paymentAmount가 변경된 경우 (차감내역 변경 등)
    if (prevPaymentAmount !== null && prevPaymentAmount !== paymentAmount && paymentAmount >= 0) {
      if (currentReceived === prevPaymentAmount) {
        setReceivedAmount(String(paymentAmount));
      } else if (currentReceived > paymentAmount) {
        setReceivedAmount(String(paymentAmount));
      } else if (receivedAmount === '' && paymentAmount > 0) {
        // 외부 초기화로 receivedAmount가 빈 값이 된 경우 paymentAmount로 복원
        setReceivedAmount(String(paymentAmount));
      }
      prevPaymentAmountRef.current = paymentAmount;
      return;
    }

    // preserveReceivedAmount가 false인 경우에만 일반적인 보정 로직 실행
    if (!preserveReceivedAmountRef.current) {
      // 납부할 금액이 줄어들어 기존 영수액이 더 커진 경우 상한으로 맞춘다. (규칙 2)
      if (currentReceived > paymentAmount && paymentAmount >= 0) {
        setReceivedAmount(String(paymentAmount));
      }
    } else {
      // preserveReceivedAmount가 true인 경우에도 상한 초과 시에는 보정
      if (currentReceived > paymentAmount && paymentAmount >= 0) {
        setReceivedAmount(String(paymentAmount));
      }
    }

    // paymentAmount 추적 업데이트
    if (prevPaymentAmountRef.current === null) {
      prevPaymentAmountRef.current = paymentAmount;
    } else if (prevPaymentAmountRef.current !== paymentAmount) {
      prevPaymentAmountRef.current = paymentAmount;
    }
  }, [paymentAmount, receivedAmount, setReceivedAmount]);

  return (
    <div
      className="border border-gray-300 rounded-sm flex flex-col h-full"
      data-testid="reception-payment-amount-panel"
    >
      {/* 상단 고정 영역: 제목 + 진료비 총액 */}
      <div className="pt-2.5 flex-shrink-0">
        <div className="pl-3 pr-3">
          <div className="flex flex-wrap justify-between text-[var(--gray-100)] gap-2">
            <span className="font-semibold text-[13px] min-w-[100px]">진료비 총액</span>
            <span className="flex-1 text-[13px] min-w-[85px] text-right font-semibold">{paymentData.totalMedicalFee.toLocaleString()}원</span>
          </div>

          <hr className="border-dashed border-[var(--border-1)] mt-1.5" />
        </div>
      </div>

      {/* 중간 스크롤 영역: 청구액 ~ 차감내역 */}
      <div className="flex-1 overflow-y-auto min-h-0 pl-3 pr-3">
        <div className="space-y-1.5 pt-1.5">
          <div className="flex flex-wrap justify-between text-sm text-[var(--gray-100)] gap-2">
            <span className="min-w-[100px]">청구액</span>
            <span className="flex-1 min-w-[85px] text-right font-semibold">{paymentData.claimAmount.toLocaleString()}원</span>
          </div>

          {/* {paymentData.cutPrice > 0 && (
            <div className="flex flex-wrap justify-between text-sm text-[var(--gray-80)] gap-2">
              <span className="min-w-[100px]">절삭금액</span>
              <span className="flex-1 min-w-[85px] text-right font-semibold">{paymentData.cutPrice.toLocaleString()}원</span>
            </div>
          )} */}

          <div className="flex flex-wrap justify-between text-sm text-[var(--gray-100)] gap-2">
            <span className="min-w-[100px]">ⓐ 본인부담금</span>
            <span className="flex-1 min-w-[85px] text-right font-semibold">{paymentData.patientCopay.toLocaleString()}원</span>
          </div>

          <div className="flex flex-wrap justify-between text-sm text-[var(--gray-100)] gap-2">
            <span className="min-w-[100px]">ⓑ 비급여(비과세)</span>
            <span className="flex-1 min-w-[85px] text-right font-semibold">{paymentData.nonCovered.toLocaleString()}원</span>
          </div>

          <div className="flex flex-wrap justify-between text-sm gap-2">
            <div
              className="flex items-center gap-2 min-w-[100px]"
            >
              <span>ⓒ 차감내역 합계</span>
              <button
                onClick={onDeductionDetailClick}
                disabled={disabled}
                className="px-2 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                보기
              </button>
            </div>
            <span className="text-red-600 flex-1 min-w-[85px] text-right font-semibold">{paymentData.deductionTotal.toLocaleString()}원</span>
          </div>

          {/* 감액 선택기 (들여쓰기) */}
          <div className="pl-4 flex flex-wrap justify-between text-sm gap-2">
            <DiscountSelector
              paymentData={paymentData}
              availableForDiscount={availableForDiscount}
              onDiscountChange={onDiscountChange}
              disabled={disabled}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* 하단 고정 영역: 영수증 메모 + 납부할금액 + 영수액 */}
      <div className="flex-shrink-0">
        <div className="pl-3 pr-3 pb-3 pt-3">
          <input
            type="text"
            data-testid="reception-payment-receipt-memo-input"
            placeholder="영수증 메모"
            value={receiptMemo}
            onChange={(e) => setReceiptMemo(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        <div className="bg-[var(--blue-1)] p-3 rounded text-sm w-full">
          <div
            data-testid="reception-payment-amount-summary"
            className={`flex flex-wrap justify-between font-semibold text-[var(--gray-100)] gap-2 transition-opacity ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80'
              }`}
            onClick={() => {
              if (!disabled && encounter) {
                setOpenMedicalBillCalculator(true);
              }
            }}
          >
            <div className="flex items-center gap-2 min-w-[80px]">
              <span className="font-bold" data-testid="reception-payment-amount-label">납부할금액</span>
              <span className="truncate">ⓐ+ⓑ-ⓒ</span>
            </div>
            <span
              className="font-bold flex-1 min-w-[85px] text-right"
              data-testid="reception-payment-amount-value"
            >
              {paymentAmount.toLocaleString()}원
            </span>
          </div>
        </div>

        <div className="bg-[var(--yellow-4)] pr-3 pl-3 pt-2 pb-2 rounded text-sm w-full">
          <div className="flex flex-wrap justify-between items-center font-semibold text-[var(--gray-100)] gap-2">
            <span className="min-w-[60px]" data-testid="reception-payment-received-label">영수액</span>
            <div className="flex-1 min-w-[90px] relative">
              <input
                type="text"
                data-testid="reception-payment-received-input"
                inputMode="numeric"
                pattern="[0-9]*"
                value={receivedAmount ? Number(receivedAmount).toLocaleString() : ''}
                onChange={(e) => {
                  // 숫자만 허용
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  const num = Number(raw || 0);

                  // 규칙 2: 영수액은 납부할 금액보다 크게 설정할 수 없다.
                  const maxPayable = paymentAmount >= 0 ? paymentAmount : 0;
                  const clamped = num > maxPayable ? maxPayable : num;

                  preserveReceivedAmountRef.current = false;
                  setReceivedAmount(String(clamped));
                }}
                // 규칙 3: 영수액이 음수인 경우 수정 불가 + 납부할 금액이 음수인 경우에도 수정 불가
                disabled={disabled || isPaymentAmountNegative || Number(receivedAmount || 0) < 0}
                className="w-full px-3 py-1 pr-8 text-sm border bg-[var(--bg-main)] border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">원</span>
            </div>
          </div>
        </div>
      </div>

      {encounter && (
        <MedicalBillInfo
          isOpen={openMedicalBillCalculator}
          onCloseAction={() => setOpenMedicalBillCalculator(false)}
          encounter={encounter}
          onSaveAndTransmit={onSaveAndTransmit}
          onPrintAndTransmit={onPrintAndTransmit}
          hideActionButtons={openMedicalBillCalculator}
        />
      )}
    </div>
  );
}
