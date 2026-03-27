/**
 * VAN 사별 단말기 종류를 구분하는 열거형
 */
export enum VanTypes {
  /** 나이스정보통신 CAT 단말기 (차세대 EMR 사용) */
  NICE_CAT = 1,
  /** KSNET_CAT 단말기 */
  KSNET_CAT = 2,
  /** SMARTRO_CAT 단말기 */
  SMARTRO_CAT = 3,
  /** 기타 VAN사 단말기 */
  ETC = 999,
}

/**
 * 현금영수증 발행시 고객 식별 방법
 */
export enum IdentificationTypes {
  /** 휴대폰번호 */
  Phone = 1,
  /** 사업자등록번호 */
  Business = 2,
  /** 주민등록번호 */
  Resident = 3,
  /** 카드번호 */
  CardNumber = 4,
  /** 기타 식별 수단 */
  Other = 99,
}

/**
 * 현금영수증 발행 용도
 */
export enum CashReceiptTypes {
  /** 소비자용 */
  CONSUMER = 1,
  /** 사업자용 */
  BUSINESS = 2,
  /** 자진발급 */
  SELF = 3,
}

/**
 * 현재 작업 진행 상태
 */
export enum VanStatus {
  /** 준비됨 */
  Ready = 30,
  /** 사용불가능 */
  NotReady = 35,
  /** 서명 요청 진행 중 */
  Signing = 40,
  /** 바코드 스캔 요청 진행 중 */
  RequestBarcode = 41,
  /** 프린트 요청 진행 중 */
  RequestPrint = 42,
  /** catID 요청 진행 중 */
  RequestVanCatID = 43,
  /** 결제 요청 진행 중 */
  RequestApproval = 50,
  /** 결제 취소 요청 진행 중 */
  CancelRequestApproval = 51,
  /** 요청 중지 진행 중 */
  RequestStop = 60,
  /** 오류발생 */
  Error = 999,
}

/**
 * VAN 연동 종류
 */
export enum VanConnectType {
  /** Serial */
  Serial = 0,
  /** TcpIp */
  TcpIp = 1,
  /** 기타 */
  ETC = 99,
}

/**
 * 전표 출력 타입
 */
export enum SalesSlipType {
  /** 미출력 */
  None = 0,
  /** 고객용 전표만 출력 */
  CustomerOnly = 1,
  /** 고객+가맹점 전표 출력 */
  CustomerAndMerchant = 2,
}

/**
 * 현금영수증 취소 사유
 */
export enum CancelReason {
  /** 없음 */
  None = 0,
  /** 거래취소 */
  TransactionCancel = 1,
  /** 에러 */
  Error = 2,
  /** 기타 */
  Other = 3,
}

