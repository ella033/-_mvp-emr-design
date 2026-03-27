import { useEffect, useRef, useCallback } from 'react';
import { CashApprovalMethod, CashApprovalMethodLabel } from '@/constants/common/common-enum';

interface PaymentMethodProps {
  receivedAmount: string;
  isCardChecked: boolean;
  setIsCardChecked: (checked: boolean) => void;
  isCashChecked: boolean;
  setIsCashChecked: (checked: boolean) => void;
  installment: string;
  setInstallment: (value: string) => void;
  cardAmount: string;
  setCardAmount: (value: string) => void;
  cashAmount: string;
  setCashAmount: (value: string) => void;
  transferAmount: string;
  setTransferAmount: (value: string) => void;
  isCashReceiptChecked: boolean;
  setIsCashReceiptChecked: (checked: boolean) => void;
  cashReceiptAmount: string;
  setCashReceiptAmount: (value: string) => void;
  approvalMethod: CashApprovalMethod | "";
  setApprovalMethod: (value: CashApprovalMethod | "") => void;
  approvalNumber: string;
  setApprovalNumber: (value: string) => void;
  isTerminal: boolean;
  setIsTerminal: (checked: boolean) => void;
  cardApprovalNumber: string;
  setCardApprovalNumber: (value: string) => void;
  disabled?: boolean;
  patientPhone?: string; // 환자 휴대폰번호 (patient.phone1)
}

export default function PaymentMethod({
  receivedAmount,
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
  disabled = false,
  patientPhone,
}: PaymentMethodProps) {
  // 전화번호에서 하이픈 제거 함수
  const removeHyphens = (phone: string | undefined): string => {
    if (!phone) return '';
    return phone.replace(/-/g, '');
  };

  // 최초 자동 입력 여부 추적 (휴대폰번호)
  const hasAutoFilledPhoneRef = useRef<boolean>(false);
  const prevApprovalMethodRef = useRef<CashApprovalMethod | "">("");

  // patientPhone이 변경되고 approvalMethod가 휴대폰번호일 때 최초 한 번만 자동 입력
  useEffect(() => {
    if (isCashChecked && approvalMethod === CashApprovalMethod.휴대폰번호 && patientPhone) {
      const phoneWithoutHyphens = removeHyphens(patientPhone);

      // 최초 설정 시에만 자동 입력 (approvalNumber가 비어있고, 이전에 자동 입력한 적이 없을 때)
      if (!hasAutoFilledPhoneRef.current && approvalNumber === '') {
        setApprovalNumber(phoneWithoutHyphens);
        hasAutoFilledPhoneRef.current = true;
      }
    }

    // approvalMethod가 변경되면 자동 입력 플래그 리셋 (다른 방법으로 변경했다가 다시 휴대폰번호로 돌아온 경우)
    if (prevApprovalMethodRef.current !== approvalMethod) {
      if (approvalMethod !== CashApprovalMethod.휴대폰번호) {
        hasAutoFilledPhoneRef.current = false;
      }
      prevApprovalMethodRef.current = approvalMethod;
    }
  }, [isCashChecked, patientPhone, approvalMethod, approvalNumber, setApprovalNumber]);

  const prevReceivedAmountRef = useRef<string>('');
  const prevCardCheckedRef = useRef<boolean>(false);
  const prevCashCheckedRef = useRef<boolean>(false);
  const prevIsCashOnlyRef = useRef<boolean>(false);
  const prevTotalCashAmountRef = useRef<number>(0);

  const isCashOnly = isCashChecked && !isCardChecked;

  // 규칙 2: 현금 체크는 현금+계좌금액 기반, 우선순위는 현금금액
  useEffect(() => {
    if (disabled) return;

    const cashNum = Number(cashAmount) || 0;
    const transferNum = Number(transferAmount) || 0;
    const hasCashAmount = cashNum > 0 || transferNum > 0;

    if (hasCashAmount && !isCashChecked) {
      setIsCashChecked(true);
    }
  }, [cashAmount, transferAmount, isCashChecked, setIsCashChecked, disabled]);

  // 규칙 1: 최초 화면 로드 시 영수액을 카드 체크 후 카드수납금액에 설정
  useEffect(() => {
    if (disabled) return;

    const numValue = Number(receivedAmount) || 0;

    // 조건:
    // 1. receivedAmount가 0보다 크고
    // 2. 모든 금액 필드가 비어있고
    // 3. 어떤 결제수단도 체크되어 있지 않을 때
    // => 기본값으로 "모든 금액을 카드"에 셋팅
    const shouldInitCard =
      numValue > 0 &&
      cardAmount === '' &&
      cashAmount === '' &&
      transferAmount === '' &&
      !isCardChecked &&
      !isCashChecked;

    if (shouldInitCard) {
      setIsCardChecked(true);
      setCardAmount(receivedAmount);
    }
  }, [receivedAmount, cardAmount, cashAmount, transferAmount, setIsCardChecked, setCardAmount, disabled]);

  useEffect(() => {
    if (disabled) return;

    const numValue = Number(receivedAmount) || 0;
    if (numValue === 0) {
      setCardAmount('');
      setCashAmount('');
      setTransferAmount('');
      prevReceivedAmountRef.current = '';
    }
  }, [receivedAmount, setCardAmount, setCashAmount, setTransferAmount, disabled]);
  const applyReceivedToPreferred = useCallback(
    (value: string) => {
      if (isCardChecked) {
        setCardAmount(value);
        setCashAmount('');
        setTransferAmount('');
        return;
      }
      if (isCashChecked) {
        setCashAmount(value);
        setCardAmount('');
        setTransferAmount('');
        return;
      }

      setIsCardChecked(true);
      setCardAmount(value);
      setCashAmount('');
      setTransferAmount('');
    },
    [
      isCardChecked,
      isCashChecked,
      setCardAmount,
      setCashAmount,
      setIsCardChecked,
      setTransferAmount,
    ]
  );

  // 규칙 5: 최초 로드 이후에 영수액 변경 시 모든 금액 초기화 후 우선순위 결제수단에 반영
  useEffect(() => {
    if (disabled) return;

    const prevValue = prevReceivedAmountRef.current;
    const numValue = Number(receivedAmount) || 0;
    const prevNumValue = Number(prevValue) || 0;

    if (!receivedAmount || numValue === 0) {
      prevReceivedAmountRef.current = '';
      return;
    }

    if (prevValue === '' && numValue > 0) {
      prevReceivedAmountRef.current = receivedAmount;
      applyReceivedToPreferred(receivedAmount);
      return;
    }

    if (
      receivedAmount !== prevValue &&
      prevNumValue > 0 &&
      numValue > 0 &&
      numValue !== prevNumValue
    ) {
      setCardAmount('');
      setCashAmount('');
      setTransferAmount('');

      applyReceivedToPreferred(receivedAmount);

      prevReceivedAmountRef.current = receivedAmount;
    }
  }, [applyReceivedToPreferred, disabled, receivedAmount]);

  // 규칙 6: 현금영수 승인금액 자동 설정 (현금 또는 계좌이체 금액 입력 시)
  // 현금금액이 0→>0 전환 시에만 자동 체크, 이후 사용자 수동 조작 존중
  useEffect(() => {
    if (disabled || isCashOnly || !isTerminal) return;

    const cashNum = Number(cashAmount) || 0;
    const transferNum = Number(transferAmount) || 0;
    const totalCashAmount = cashNum + transferNum;
    const prevTotal = prevTotalCashAmountRef.current;

    if (totalCashAmount > 0) {
      // 0에서 >0으로 전환될 때만 자동 체크
      if (prevTotal === 0) {
        setIsCashReceiptChecked(true);
      }
      // 체크되어 있을 때만 금액 동기화
      if (isCashReceiptChecked && cashReceiptAmount !== String(totalCashAmount)) {
        setCashReceiptAmount(String(totalCashAmount));
      }
    } else {
      if (isCashReceiptChecked) {
        setIsCashReceiptChecked(false);
      }
      if (cashReceiptAmount !== '') {
        setCashReceiptAmount('');
      }
    }

    prevTotalCashAmountRef.current = totalCashAmount;
  }, [
    cashAmount,
    transferAmount,
    cashReceiptAmount,
    isCashOnly,
    isTerminal,
    isCashReceiptChecked,
    setIsCashReceiptChecked,
    setCashReceiptAmount,
    disabled,
  ]);

  // 전액 현금 전환 시 현금영수증 기본 해제 및 필드 리셋
  useEffect(() => {
    if (disabled) return;
    if (isCashOnly && !prevIsCashOnlyRef.current) {
      setIsCashReceiptChecked(false);
      setCashReceiptAmount('');
      setApprovalMethod('');
      setApprovalNumber('');
      hasAutoFilledPhoneRef.current = false;
    }

    prevIsCashOnlyRef.current = isCashOnly;
  }, [
    disabled,
    isCashOnly,
    setApprovalMethod,
    setApprovalNumber,
    setCashReceiptAmount,
    setIsCashReceiptChecked,
  ]);

  // 단말기 미연동(isTerminal=false) 시 현금영수증 관련 필드 초기화
  useEffect(() => {
    if (disabled) return;
    if (!isTerminal) {
      setIsCashReceiptChecked(false);
      setCashReceiptAmount('');
      setApprovalMethod('');
      setApprovalNumber('');
      hasAutoFilledPhoneRef.current = false;
    }
  }, [isTerminal, disabled, setIsCashReceiptChecked, setCashReceiptAmount, setApprovalMethod, setApprovalNumber]);

  // 규칙 7: 결제수단 제거 시 금액 합치기, 체크 해제 후 다시 체크 시 초기화
  const handleCardCheckedChange = (checked: boolean) => {
    if (!checked && isCardChecked) {
      // 카드 체크 해제 시 카드 금액을 다른 결제수단에 합치기
      const cardNum = Number(cardAmount) || 0;
      if (cardNum > 0) {
        if (isCashChecked) {
          // 현금이 체크되어 있으면 현금에 합치기
          const cashNum = Number(cashAmount) || 0;
          setCashAmount(String(cashNum + cardNum));
        } else {
          // 현금도 없으면 현금 체크하고 현금에 넣기
          setIsCashChecked(true);
          setCashAmount(cardAmount);
        }
      }
      setCardAmount('');
    } else if (checked && !prevCardCheckedRef.current) {
      // 규칙 7: 체크 해제 후 다시 체크하는 경우
      if (!isCashChecked) {
        // 규칙 7-2: 카드만 체크되어있어서 카드금액을 수정하다가 다시 체크해제 후 체크하는 경우 -> 영수액 = 카드액
        setCardAmount(receivedAmount);
      } else {
        // 규칙 7-3: 카드, 현금 모두 체크되어있는 상태에서 카드나 현금금액을 수정하고 있었는데 둘 중 하나만 체크해제한 경우
        // 다른 곳에 기재되어있던 금액 합산을 체크 된 곳에 합쳐지게 한다. 합산 우선순위: 카드 > 현금 > 계좌
        const cashNum = Number(cashAmount) || 0;
        const transferNum = Number(transferAmount) || 0;
        const totalOtherAmount = cashNum + transferNum;
        if (totalOtherAmount > 0) {
          // 다른 곳의 금액을 카드에 합치기
          setCardAmount(String(totalOtherAmount));
          setCashAmount('');
          setTransferAmount('');
        } else {
          // 규칙 7-1: 기존값은 없애고 영수액을 체크한 곳에 그대로 기재
          setCardAmount(receivedAmount);
        }
      }
    }

    prevCardCheckedRef.current = checked;
    setIsCardChecked(checked);
  };

  const handleCashCheckedChange = (checked: boolean) => {
    if (!checked && isCashChecked) {
      // 현금 체크 해제 시 현금+계좌 금액을 다른 결제수단에 합치기
      const cashNum = Number(cashAmount) || 0;
      const transferNum = Number(transferAmount) || 0;
      const totalCashAmount = cashNum + transferNum;

      if (totalCashAmount > 0) {
        if (isCardChecked) {
          // 카드가 체크되어 있으면 카드에 합치기
          const cardNum = Number(cardAmount) || 0;
          setCardAmount(String(cardNum + totalCashAmount));
        } else {
          // 카드도 없으면 카드 체크하고 카드에 넣기
          setIsCardChecked(true);
          setCardAmount(String(totalCashAmount));
        }
      }
      setCashAmount('');
      setTransferAmount('');

      // 현금영수증 관련 필드 초기화
      setApprovalMethod('');
      setApprovalNumber('');
      setIsCashReceiptChecked(false);
      setCashReceiptAmount('');
      hasAutoFilledPhoneRef.current = false;
    } else if (checked && !prevCashCheckedRef.current) {
      // 규칙 7: 체크 해제 후 다시 체크하는 경우
      if (!isCardChecked) {
        // 규칙 7-1: 기존값은 없애고 영수액을 체크한 곳에 그대로 기재
        setCashAmount(receivedAmount);
        setTransferAmount('');
      } else {
        // 규칙 7-3: 카드, 현금 모두 체크되어있는 상태에서 카드나 현금금액을 수정하고 있었는데 둘 중 하나만 체크해제한 경우
        // 다른 곳에 기재되어있던 금액 합산을 체크 된 곳에 합쳐지게 한다. 합산 우선순위: 카드 > 현금 > 계좌
        const cardNum = Number(cardAmount) || 0;
        if (cardNum > 0) {
          // 카드 금액을 현금에 합치기
          setCashAmount(String(cardNum));
          setCardAmount('');
        } else {
          // 규칙 7-1: 기존값은 없애고 영수액을 체크한 곳에 그대로 기재
          setCashAmount(receivedAmount);
          setTransferAmount('');
        }
      }
    }

    prevCashCheckedRef.current = checked;
    setIsCashChecked(checked);
  };

  return (
    <div className="border border-gray-300 rounded-sm flex flex-col h-full">
      {/* 상단 고정 영역: 제목 + 결제수단 체크박스 */}
      <div className="pt-2.5 pb-2 pl-3 pr-3 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-[13px] text-[var(--gray-100)]">수납</h3>
          {!disabled && (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-[var(--gray-300)]">단말기 연동</span>
              <button
                type="button"
                onClick={() => setIsTerminal(!isTerminal)}
                className={`
                  relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                  ${isTerminal ? 'bg-[var(--main-color)]' : 'bg-gray-300'}
                `}
              >
                <span
                  className={`
                    inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
                    ${isTerminal ? 'translate-x-5' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-[13px] text-[var(--gray-100)] min-w-[100px]">결제수단</span>
          <div className="flex gap-2 min-w-[90px]">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={isCardChecked}
                onChange={(e) => handleCardCheckedChange(e.target.checked)}
                disabled={disabled || Number(transferAmount) < 0}
                className="w-3 h-3 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-300"
              />
              <span className="text-[13px] text-[var(--gray-300)]">카드</span>
            </label>
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={isCashChecked}
                onChange={(e) => handleCashCheckedChange(e.target.checked)}
                disabled={disabled}
                className="w-3 h-3 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-300"
              />
              <span className="text-[13px] text-[var(--gray-300)]">현금</span>
            </label>
          </div>
        </div>

        <hr className="border-dashed border-[var(--border-1)] mt-1.5" />
      </div>

      {/* 중간 스크롤 영역: 카드세트 + 현금세트 */}
      <div className="flex-1 overflow-y-auto min-h-0 pl-3 pr-3">
        <div className="space-y-2 pt-1.5 pb-2">
          {/* 카드 세트: 할부, 카드 수납금액 */}
          {isCardChecked ? (
            <>
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-sm text-[var(--gray-100)] min-w-[80px]">할부</span>
                <select
                  value={installment}
                  onChange={(e) => setInstallment(e.target.value)}
                  disabled={disabled}
                  className="flex-1 w-full px-3 py-1 border text-sm border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[100px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="0">일시불</option>
                  <option value="1">1개월</option>
                  <option value="2">2개월</option>
                  <option value="3">3개월</option>
                  <option value="4">4개월</option>
                  <option value="5">5개월</option>
                  <option value="6">6개월</option>
                </select>
              </div>

              {((!isCardChecked && !isCashChecked) || (isCardChecked && isCashChecked)) && (
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="text-sm text-[var(--gray-100)] min-w-[80px]">카드 수납금액</span>
                  <div className="flex-1 min-w-[110px] relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={cardAmount ? Number(cardAmount).toLocaleString() : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        const numValue = Number(value) || 0;
                        const cashNum = Number(cashAmount) || 0;
                        const transferNum = Number(transferAmount) || 0;
                        const receivedNum = Number(receivedAmount) || 0;

                        // 규칙 4: 카드와 현금이 모두 체크되어 있으면, 자동 조정 로직 우선 적용
                        // 합산값이 영수액과 동일할 수 있도록 각 결제수단별 간 계산
                        if (isCardChecked && isCashChecked && receivedNum > 0) {
                          // 카드 금액 변경 시: 영수액 - 카드 = 현금
                          const remainingAmount = receivedNum - numValue;
                          if (remainingAmount >= 0) {
                            setCardAmount(value);
                            setCashAmount(String(remainingAmount));
                            setTransferAmount('');
                          }
                        } else {
                          // 규칙 3: 카드수납금액 + 현금수납금액 + 계좌이체금액 <= 영수액
                          if (numValue + cashNum + transferNum <= receivedNum) {
                            setCardAmount(value);
                          }
                        }
                      }}
                      disabled={disabled}
                      className={`w-full px-3 py-0.5 pr-8  text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500
                        } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">원</span>
                  </div>
                </div>
              )}

              {/* 단말기 연동이 활성화되어 있을 때만 승인번호 입력 필드 표시 */}
              {!isTerminal && isCardChecked && (
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="text-sm text-[var(--gray-100)] min-w-[80px]">승인번호</span>
                  <div className="flex-1 min-w-[110px]">
                    <input
                      type="text"
                      placeholder="승인번호입력"
                      value={cardApprovalNumber}
                      onChange={(e) => setCardApprovalNumber(e.target.value)}
                      disabled={disabled}
                      className="w-full px-3 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* 현금 세트: 현금 수납금액, 계좌 이체금액 */}
          {isCashChecked ? (
            <>
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-sm text-[var(--gray-100)] min-w-[80px]">현금 수납금액</span>
                <div className="flex-1 min-w-[110px] relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={cashAmount ? Number(cashAmount).toLocaleString() : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      const numValue = Number(value) || 0;
                      const cardNum = Number(cardAmount) || 0;
                      const transferNum = Number(transferAmount) || 0;
                      const receivedNum = Number(receivedAmount) || 0;

                      // 규칙 4: 카드와 현금이 모두 체크되어 있으면, 자동 조정 로직 우선 적용
                      // 합산값이 영수액과 동일할 수 있도록 각 결제수단별 간 계산
                      if (isCardChecked && isCashChecked && receivedNum > 0) {
                        // 현금 금액 변경 시: 영수액 - (현금 + 계좌이체) = 카드
                        const remainingAmount = receivedNum - numValue - transferNum;
                        if (remainingAmount >= 0) {
                          setCashAmount(value);
                          setCardAmount(String(remainingAmount));
                        }
                      } else {
                        // 규칙 3: 카드수납금액 + 현금수납금액 + 계좌이체금액 <= 영수액
                        if (numValue + cardNum + transferNum <= receivedNum) {
                          setCashAmount(value);
                        }
                      }
                    }}
                    disabled={disabled || isCashOnly}
                    className={`w-full px-3 py-0.5 pr-8  text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500
                      } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">원</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-sm text-[var(--gray-100)] min-w-[80px]">계좌 이체금액</span>
                <div className="flex-1 min-w-[110px] relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={transferAmount ? Number(transferAmount).toLocaleString() : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      const numValue = Number(value) || 0;
                      const cardNum = Number(cardAmount) || 0;
                      const cashNum = Number(cashAmount) || 0;
                      const receivedNum = Number(receivedAmount) || 0;

                      // 규칙 4-1: 계좌이체금액 입력 시 특별 처리
                      if (isCashChecked && receivedNum > 0) {
                        if (cashNum > 0) {
                          // 현금에 기재된 금액이 있는 경우
                          if (isCardChecked) {
                            // 카드도 체크되어 있는 경우: 영수액 - 카드액 - 계좌금액 = 변경된 현금금액 (카드액은 건들지 않음)
                            const newCashAmount = receivedNum - cardNum - numValue;
                            if (newCashAmount >= 0 && numValue <= receivedNum - cardNum) {
                              setTransferAmount(value);
                              setCashAmount(String(newCashAmount));
                            }
                          } else {
                            // 카드가 체크되지 않았지만 현금이 있는 경우
                            // 계좌 금액 입력 시: 영수액 - 계좌금액 = 변경된 현금금액
                            const newCashAmount = receivedNum - numValue;
                            if (newCashAmount >= 0 && numValue <= receivedNum) {
                              setTransferAmount(value);
                              setCashAmount(String(newCashAmount));
                            }
                          }
                        } else {
                          // 현금금액이 0원인 경우: 영수액 - 기재한 계좌금액 = 카드액
                          if (isCardChecked && numValue <= receivedNum) {
                            const newCardAmount = receivedNum - numValue;
                            if (newCardAmount >= 0) {
                              setTransferAmount(value);
                              setCardAmount(String(newCardAmount));
                            }
                          } else {
                            // 카드가 체크되지 않은 경우는 규칙 3 검증만
                            if (numValue + cardNum <= receivedNum) {
                              setTransferAmount(value);
                            }
                          }
                        }
                      } else {
                        // 규칙 3: 카드수납금액 + 현금수납금액 + 계좌이체금액 <= 영수액
                        if (numValue + cardNum + cashNum <= receivedNum) {
                          setTransferAmount(value);
                        }
                      }
                    }}
                    disabled={disabled}
                    className={`w-full px-3 py-0.5 pr-8  text-sm border border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500
                      } disabled:bg-gray-100 disabled:cursor-not-allowed`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">원</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* 하단 고정 영역: 현금영수증 */}
      {isCashChecked && isTerminal ? (
        <div className="flex-shrink-0 pt-4">
          <div className="bg-gray-100 p-3 rounded space-y-2">
            <div className="flex flex-wrap justify-between items-center gap-2">
              <label className="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  checked={isCashReceiptChecked}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsCashReceiptChecked(checked);

                    if (checked && isCashOnly) {
                      setCashReceiptAmount(receivedAmount);
                    }
                    if (!checked) {
                      setCashReceiptAmount('');
                    }
                  }}
                  disabled={disabled}
                  className="w-4 h-4 flex-shrink-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-300"
                />
                <span className="text-sm text-[var(--gray-100)] truncate max-w-[100px]" title="현금영수증 승인금액">현금영수증 승인금액</span>
              </label>
              <div className="flex-1 min-w-[100px] relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={cashReceiptAmount ? Number(cashReceiptAmount).toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setCashReceiptAmount(value);
                  }}
                  disabled={disabled || !isCashReceiptChecked}
                  className="w-full px-3 py-1 pr-8 border bg-[var(--bg-main)] text-sm border-gray-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">원</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={approvalMethod}
                onChange={(e) => {
                  const value = e.target.value;
                  setApprovalMethod(value as CashApprovalMethod | "");

                  // cash/account 체크되어 있을 때만 approvalNumber 설정
                  if (isCashChecked) {
                    if (value === CashApprovalMethod.휴대폰번호 && patientPhone) {
                      // approvalNumber가 비어있거나 자진발급 등의 번호일 때 환자휴대폰번호 입력
                      if (approvalNumber === '' || approvalNumber === '0100001234') {
                        const phoneWithoutHyphens = patientPhone.replace(/-/g, '');
                        setApprovalNumber(phoneWithoutHyphens);
                        hasAutoFilledPhoneRef.current = true;
                      }
                    } else if (value === CashApprovalMethod.자진발급번호) {
                      // 자진발급 선택 시 승인번호 자동 입력
                      setApprovalNumber('0100001234');
                    } else if (value === '') {
                      // 승인 변경없음 선택 시 승인번호 초기화
                      setApprovalNumber('');
                      hasAutoFilledPhoneRef.current = false;
                    } else {
                      // 다른 방법 선택 시 자동 입력 플래그 리셋
                      setApprovalNumber('');
                      hasAutoFilledPhoneRef.current = false;
                    }
                  }
                }}
                disabled={disabled || !isCashReceiptChecked}
                className="flex-1 px-3 py-1 border bg-[var(--bg-main)] text-sm border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[110px] disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">승인 변경없음</option>
                <option value={CashApprovalMethod.휴대폰번호}>{CashApprovalMethodLabel[CashApprovalMethod.휴대폰번호]}</option>
                <option value={CashApprovalMethod.카드번호}>{CashApprovalMethodLabel[CashApprovalMethod.카드번호]}</option>
                <option value={CashApprovalMethod.사업자등록번호}>{CashApprovalMethodLabel[CashApprovalMethod.사업자등록번호]}</option>
                <option value={CashApprovalMethod.자진발급번호}>{CashApprovalMethodLabel[CashApprovalMethod.자진발급번호]}</option>
              </select>
              <input
                type="text"
                placeholder="승인번호"
                value={approvalNumber}
                onChange={(e) => setApprovalNumber(e.target.value)}
                disabled={disabled || !isCashReceiptChecked}
                className="flex-1 px-3 py-1 border bg-[var(--bg-main)] text-sm border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[110px] disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}