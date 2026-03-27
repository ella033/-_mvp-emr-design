export interface ApiResponseBase<T> {
  statusCode: number;
  result: T;
  message: string;
}

export interface DeviceSetting {
  vanId: number;
  vanName: string;
  connectType: number;
  vanType: number;
  connectInfo: string;
}

export interface SignResult {
  isSuccess: boolean;           //성공여부
  length: number;               //데이터 길이
  data: string;                 //사인 데이터 (base64 string)
  signImgPath: string;          //사용안함 -> 추후 필요시 추가
}

export interface CashReceiptRequest {
  receiptType: 1 | 2 | 3;       // 현금영수증 타입
  identificationNumber: string; // 현금영수증 승인 번호
  identificationType: number;   // 현금영수증 승인 번호 종류
  taxAmount: number;            // 과세금액 (세금포함금액)
  vat: number;                  // 부가세
  taxFreeAmount: number;        // 비과세
  printSalesSlipType: number;   // 전표 출력 종류
  printReceiptStr: string;      // 영수증 하단 출력문구
  // callbackAction: (result: CashReceiptResult) => Promise<boolean>;
}

export interface CashReceiptResult {
  approvalDate: Date;             // 원거래 승인일자
  approvalNumber: string;         // 원거래 승인번호
  approvedAmount: number;           // 취소승인금액
  vat: number;                    // 부가세
  issuerName: string              // 발급 종류(ex-현금결제취소) 
  transactionNo: string           // 결제 번호
  catVersion?: string;            //단말기버전(나이스만)
  catId: string;                  //단말기CatId
  vanNo?: string;                 //van번호
  returnMessage?: string;         //메세지
  returnMessage2?: string;        //메세지
  receiptType: 1 | 2 | 3;        // 현금영수증 타입 
  identificationNumber: string;   // 현금영수증 승인 번호
  //cashReceiptMessage: string;     // 영수증 하단 출력문구
  unavailableAction: () => void;  // 취소불가시 호출되는 콜백함수
}

export interface CashReceiptCancelRequest {
  receiptType: 1 | 2 | 3;        // 현금영수증 타입 --> 생략시 DB 데이터 입력, 없으면 단말기에서 선택
  identificationNumber: string;   // 현금영수증 승인 번호 --> 생략시 DB 데이터 입력, 없으면 단말기에서 입력
  taxFreeAmount: number;          // 면세금액 
  taxAmount: number;              // 과세금액 (세금포함금액)
  vat: number;                    // 부가세
  approvalDate: Date;             // 원거래 승인일자
  approvalNumber: string;         // 원거래 승인번호
  cancelReason?: number;           // 취소사유 --> 생략시 단말기에서 선택
  printReceiptStr?: string;        // 영수증 하단 출력문구
  printSalesSlipType?: number;     // 전표출력종류 --> 생략시 단말기에서 선택
  unavailableAction: () => void;  // 취소불가시 호출되는 콜백함수
  //callbackAction: (result: CashReceiptCancelResult) => Promise<boolean>;
}

export interface CashReceiptCancelResult {
  cancelApprovalNumber: string;   // 취소승인번호
  cancelDateTime: string;         // 취소승인날짜
  originApprovalDate: Date;       // 원거래 승인일자
  originApprovalNumber: string;   // 원거래 승인번호
  cancelAmount: number;           // 취소승인금액
  vat: number;                    // 부가세
  receiptType: 1 | 2 | 3;        // 현금영수증 타입 
  identificationNumber: string;   // 현금영수증 승인 번호 --> 생략시 DB 데이터 입력, 없으면 단말기에서 입력
  issuerName: string              // 발급 종류(ex-현금결제취소) 
  transactionNo: string           // 결제 번호
  catId: string;                  //단말기CatId
  vanNo?: string;                 //van번호
  catVersion?: string;            //단말기버전(나이스만)
  returnMessage?: string;         //메세지
  returnMessage2?: string;        //메세지
  //cashReceiptMessage: string;     // 영수증 하단 출력문구
  unavailableAction: () => void;  // 취소불가시 호출되는 콜백함수
}

export interface PaymentRequest {
  taxFreeAmount: number;        // 면세금액
  taxAmount: number;            // 과세금액 (세금포함금액)
  vat: number;                  // 부가세
  installmentMonths: number;    // 할부개월
  useSign: boolean;             // 서명사용여부
  signData: string;             // 서명데이터
  printSalesSlipType: number;   // 전표출력여부
  printReceiptStr: string;      // 영수증 하단 출력문구
  simplePay: number;            // 간편결제수단 (0:사용안함) -> 추후 간편결제 제공 시 사용
  callbackAction: (result: PaymentResult) => Promise<boolean>;
}

export interface PaymentResult {
  approvalNumber: string;         //승인번호
  approvalDate: Date;             //승인날짜
  approvalAmount: number;         //승인금액
  vat: number;                    //부가세
  uniqueNo: string;               // (나이스 무카드취소 시 사용)
  installmentMonths: number;      //할부개월
  cardNumber: string;             //카드번호
  issuerCode: string;             //발급사코드
  issuerName: string;             //발급사명
  acquirerCode: string;           //매입사코드
  acquirerName: string;           //매입사명
  vanTransacctionNo: string;      //결제번호
  merchantId: string;             //가맹점번호
  catId: string;                  //단말기CatId
  signData?: string;               //사인데이터 (없으면 단말기 입력)
  simplePayCode?: string;          //간편결제코드
  simplePayName?: string;          //간편결제명
  simplePayBarcode?: string;       //간편결제바코드
  catVersion?: string;            //단말기버전(나이스만)
}

export interface SearchPaymentListRequest {
  approvalDate: Date;            //승인날짜
  payActionType?: number;        //빈값-전체조회/1-카드결제/2-현금영수증
  keyword?: string;              //검색어 - 승인번호 카드번호 조회 가능
}

export interface SearchPaymentListResult {
  isSuccess: boolean;
  vanName?: string;
  paymentId: number;
  paymentType: 'CASH' | 'CARD';
  requestType: 'APPROVE' | 'CANCEL';
  approvalNumber: string;
  approvalDate: Date;
  approvedAmount: number;
  vat: number;
  uniqueNo?: string;
  created?: string;
  canCancel: number;
}

export interface DevicesSetting {
  vanId: number;
  vanName: string;
  connectType: number;
  vanType: number;
  connectInfo: string;
}

export interface SearchPaymentResult {
  paymentId: number;
  isSuccess: boolean;
  returnMessage?: string;
  returnMessage2?: string;
  itemName?: string;
  vanType: number;
  connectInfo: string;
  vanId: string;
  vanName?: string;
  paymentType: 'CASH' | 'CARD';
  requestType: 'APPROVE' | 'CANCEL';
  approvalNumber: string;
  approvalDate: Date;
  approvedAmount: number;
  vat: number;
  originApprovalNumber: string;
  originApprovalDate: Date;
  issuerName: string;
  issuerCode: string;
  acquirerCode: string;
  acquirerName: string;
  merchantId: string;
  catId: string;
  catVersion: string;
  uniqueNo?: string;
  installmentMonths: number;
  cardNumber: string;
  vanTransactionNo: string;
  useSign?: boolean;
  signData?: string;
  simplePayCode?: string;
  simplePayName?: string;
  cardType?: string;
  transactionNo?: string;
  receiptType: number;
  identificationNumber?: string;
  cashReceiptMessage?: string;
  created?: Date;
  canCancel: number;
  originPaymentId: number;
}


export interface SearchPaymentRequest {
  approvalDate: string;            //승인날짜
  approvalNumber: string;         //승인번호
}

export interface SearchPaymentIdRequest {
  paymentId: number;
}

export interface CancelPaymentResult {
  approvalNumber: string;         //승인번호
  originApprovalNumber: string;   //원거래승인번호
  originApprovalDate?: Date;      //원거래승인날짜
  cancelApprovalDate: Date;       //취소승인날짜
  cancelApprovedAmount: number;   //취소승인번호
  vat: number;                    //부가세
  uniqueNo: string;             // (나이스만)무카드 취소시 사용
  installmentMonths: number;      //할부개월
  cardNumber: string;             //카드번호
  issuerCode: string;             //발급사코드
  issuerName: string;             //발급사명
  acquirerCode: string;           //매입사코드
  acquirerName: string;           //매입사명
  vanTransactionNo: string;       //결제번호
  merchantId: string;             //가맹점번호
  catId: string;                  //단말기CatId
  signData?: string;               //사인데이터 (없으면 단말기 입력)
  simplePayCode: string;          //간편결제코드
  simplePayName: string;          //간편결제명
  simplePayBarcode?: string;      //간편결제바코드
  cardType: string;               //카드구분자
  catVersion?: string;            //단말기버전(나이스만)
}

export interface PaymentCancelRequest {
  taxFreeAmount: number;        // 면세금액
  taxAmount: number;            // 과세금액
  vat: number;                  // 부가세
  //uniqueNo: string;             // (나이스만)무카드 취소시 사용
  installmentMonths: number     // 할부개월
  approvalDate: Date;           // 승인날짜
  approvalNumber: string;       // 승인번호
  printReceiptStr: string;      // 영수증 하단 출력 데이터
  simplePay: number;            // 간편결제수단 (0:사용안함) -> 추후 간편결제 제공 시 사용
  unavailableAction: () => void;
}


export interface PaymentCancelLastRequest {
  taxFreeAmount: number;        // 면세금액
  taxAmount: number;            // 과세금액
  vat: number;                  // 부가세
  uniqueNo: string;             // (나이스만)무카드 취소시 사용
  installmentMonths: number     // 할부개월
  approvalDate: Date;           // 승인날짜
  approvalNumber: string;       // 승인번호
  printReceiptStr: string;      // 영수증 하단 출력 데이터
  simplePay: number;            // 간편결제수단 (0:사용안함) -> 추후 간편결제 제공 시 사용
  unavailableAction: () => void;
}

export interface PaymentRequestResult {
  payResult: PaymentResult;         //승인번호
  cancelResult: CancelPaymentResult;            //승인날짜
}