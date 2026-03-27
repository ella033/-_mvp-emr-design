import { CashType, PaymentSource, PaymentProvider } from "@/constants/common/common-enum";
import { CashReceiptTypes, type IdentificationTypes } from "@/services/pay-bridge/pay-bridge-enum";

export interface DetailBase {
  /**
     * @description 카드번호
     * @example 1234-****-****-5678
     */
  cardNumber?: string | null;
  /**
   * @description 발급사 코드
   * @example 01
   */
  issuerCode?: string | null;
  /**
   * @description 발급사명
   * @example 신한카드
   */
  issuerName?: string | null;
  /**
   * @description 할부 개월수
   * @example 0
   */
  installmentMonths?: number | null;
  /**
   * @description 매입사 코드
   * @example 01
   */
  acquirerCode?: string | null;
  /**
   * @description 매입사명
   * @example 신한카드
   */
  acquirerName?: string | null;
  /**
   * @description 승인번호
   * @example 12345678
   */
  approvalNo?: string | null;
  /**
   * @description 승인일자
   * @example 2025-01-15T09:30:00.000Z
   */
  approvalDate?: Date | null;
  /**
   * @description VAN 타입
   * @example KIS
   */
  vanType?: string | null;
  /**
   * @description VAN 거래번호
   * @example TXN123456
   */
  vanTransactionNo?: string | null;
  /**
   * @description CAT ID
   * @example CAT001
   */
  catId?: string | null;
  /**
     * @description 현금/계좌 구분
     * @example CASH
     * @enum {string}
     */
  cashType?: CashType | null;
  /**
   * @description 현금영수증 타입
   * @example 소득공제
   * @enum {string}
   */
  receiptType?: CashReceiptTypes | null;
  /**
   * @description 식별번호 타입 (ENUM: CashApprovalMethod)
   * @example phone
   * @example card
   * @example business
   * @example self
   * @enum {string}
   */
  identificationType?: IdentificationTypes | null;
  /**
   * @description 식별번호 (휴대폰번호/사업자번호)
   * @example 010-1234-5678
   */
  identificationNumber?: string | null;
  /**
   * @description 거래번호
   * @example TXN123456
   */
  transactionNo?: string | null;
  /**
   * @description 받은 현금
   * @example 20000
   */
  cashReceived?: number | null;
  /**
   * @description 거스름돈
   * @example 0
   */
  cashChange?: number | null;
  /**
   * @description 은행 코드
   * @example 001
   */
  bankCode?: string | null;
  /**
   * @description 은행명
   * @example 신한은행
   */
  bankName?: string | null;
  /**
   * @description 계좌번호
   * @example 110-123-456789
   */
  accountNumber?: string | null;
  /**
   * @description 입금자명
   * @example 홍길동
   */
  depositorName?: string | null;
  /**
   * Format: date-time
   * @description 이체 일시
   * @example 2025-01-15T09:30:00.000Z
   */
  transferDateTime?: string | null;
  catVersion?: string | null;
}

export interface CardDetailBase {
  /**
     * @description 카드번호
     * @example 1234-****-****-5678
     */
  cardNumber?: string;
  /**
   * @description 발급사 코드
   * @example 01
   */
  issuerCode?: string;
  /**
   * @description 발급사명
   * @example 신한카드
   */
  issuerName: string;
  /**
   * @description 할부 개월수
   * @example 0
   */
  installmentMonths: number;
  /**
   * @description 매입사 코드
   * @example 01
   */
  acquirerCode?: string;
  /**
   * @description 매입사명
   * @example 신한카드
   */
  acquirerName?: string;
  /**
   * @description 승인번호
   * @example 12345678
   */
  approvalNo?: string;
  /**
   * @description 승인일자
   * @example 2025-01-15T09:30:00.000Z
   */
  approvalDate?: Date;
  /**
   * @description VAN 타입
   * @example KIS
   */
  vanType?: string;
  /**
   * @description VAN 거래번호
   * @example TXN123456
   */
  vanTransactionNo?: string;
  /**
   * @description CAT ID
   * @example CAT001
   */
  catId?: string;
}
export interface CashDetailBase {
  /**
     * @description 현금/계좌 구분
     * @example CASH
     * @enum {string}
     */
  cashType: CashType;
  /**
   * @description 현금영수증 타입
   * @example 소득공제
   * @enum {string}
   */
  receiptType?: CashReceiptTypes;
  /**
   * @description 식별번호 (휴대폰번호/사업자번호)
   * @example 010-1234-5678
   */
  identificationNumber?: string;
  /**
 * @description 승인번호
 * @example 12345678
 */
  approvalNo?: string;
  /**
   * @description 승인일자
   * @example 2025-01-15T09:30:00.000Z
   */
  approvalDate?: Date;
  /**
   * @description 거래번호
   * @example TXN123456
   */
  transactionNo?: string;
  /**
   * @description 받은 현금
   * @example 20000
   */
  cashReceived?: number;
  /**
   * @description 거스름돈
   * @example 0
   */
  cashChange?: number;
  /**
   * @description 은행 코드
   * @example 001
   */
  bankCode?: string;
  /**
   * @description 은행명
   * @example 신한은행
   */
  bankName?: string;
  /**
   * @description 계좌번호
   * @example 110-123-456789
   */
  accountNumber?: string;
  /**
   * @description 입금자명
   * @example 홍길동
   */
  depositorName?: string;
  /**
   * Format: date-time
   * @description 이체 일시
   * @example 2025-01-15T09:30:00.000Z
   */
  transferDateTime?: string;
  /**
   * @description VAN 거래번호
   * @example TXN123456
   */
  vanTransactionNo?: string;
  /**
   * @description CAT ID
   * @example CAT001
   */
  catId?: string;
  catVersion?: string;
}

export interface CardDetail extends CardDetailBase {
  /**
   * @description 결제 ID
   * @example 1
   */
  paymentId: string;

}

export interface CashDetail extends CashDetailBase {
  /**
   * @description 결제 ID
   * @example 1
   */
  paymentId: string;

}


export interface PaymentInfoBase {
  /**
     * @description 결제 원천
     * @example CARD
     */
  paymentSource: PaymentSource;
  /**
   * @description 결제 방법
   * @example DIRECT
   */
  paymentMethod: PaymentProvider;
  /**
   * @description 결제 금액
   * @example 20000
   */
  paymentAmount: number;

}

export interface PaymentInfo extends PaymentInfoBase, DetailBase {
  paymentId: string;
}

export interface PaymentInfoRequest extends PaymentInfoBase, DetailBase {
}

