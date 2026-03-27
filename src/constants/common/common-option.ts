import {
  초재진,
  초재진Label,
  보험구분상세,
  보험구분상세Label,
  보험구분상세FullLabel,
  주간야간휴일구분,
  주간야간휴일구분Label,
  청구,
  청구구분Label,
  진료결과Label,
  진료결과,
  PaymentMethod,
  SearchPeriod,
  UsageCategory,
  TemplateCodeType,
  ReceiptPrintLocation,
} from "./common-enum";

export const 초재진_OPTIONS = [
  {
    value: 초재진.초진,
    label: 초재진Label[초재진.초진],
  },
  {
    value: 초재진.재진,
    label: 초재진Label[초재진.재진],
  },
  {
    value: 초재진.보호자,
    label: 초재진Label[초재진.보호자],
  },
  {
    value: 초재진.미산정,
    label: 초재진Label[초재진.미산정],
  },
  {
    value: 초재진.물치재진,
    label: 초재진Label[초재진.물치재진],
  },
  {
    value: 초재진.촉탁의,
    label: 초재진Label[초재진.촉탁의],
  },
];

export const 청구_OPTIONS = [
  {
    value: 청구.청구,
    label: 청구구분Label[청구.청구],
  },
  {
    value: 청구.비청구,
    label: 청구구분Label[청구.비청구],
  },
];

export const 주간야간휴일구분_OPTIONS = [
  {
    value: 주간야간휴일구분.주간,
    label: 주간야간휴일구분Label[주간야간휴일구분.주간],
  },
  {
    value: 주간야간휴일구분.야간,
    label: 주간야간휴일구분Label[주간야간휴일구분.야간],
  },
  {
    value: 주간야간휴일구분.휴일,
    label: 주간야간휴일구분Label[주간야간휴일구분.휴일],
  },
  {
    value: 주간야간휴일구분.야간토요공휴,
    label: 주간야간휴일구분Label[주간야간휴일구분.야간토요공휴],
  },
];

export const 보험_OPTIONS = [
  {
    value: 보험구분상세.일반,
    label: 보험구분상세Label[보험구분상세.일반],
  },
  {
    value: 보험구분상세.직장조합,
    label: 보험구분상세Label[보험구분상세.직장조합],
  },
  {
    value: 보험구분상세.국민공단,
    label: 보험구분상세Label[보험구분상세.국민공단],
  },
  {
    value: 보험구분상세.의료급여1종,
    label: 보험구분상세Label[보험구분상세.의료급여1종],
  },
  {
    value: 보험구분상세.의료급여2종,
    label: 보험구분상세Label[보험구분상세.의료급여2종],
  },
  {
    value: 보험구분상세.의료급여2종장애,
    label: 보험구분상세Label[보험구분상세.의료급여2종장애],
  },
  {
    value: 보험구분상세.차상위1종,
    label: 보험구분상세Label[보험구분상세.차상위1종],
  },
  {
    value: 보험구분상세.차상위2종,
    label: 보험구분상세Label[보험구분상세.차상위2종],
  },
  {
    value: 보험구분상세.차상위2종장애,
    label: 보험구분상세Label[보험구분상세.차상위2종장애],
  },
  {
    value: 보험구분상세.자보,
    label: 보험구분상세Label[보험구분상세.자보],
  },
  {
    value: 보험구분상세.산재,
    label: 보험구분상세Label[보험구분상세.산재],
  },
  {
    value: 보험구분상세.재해,
    label: 보험구분상세Label[보험구분상세.재해],
  },
];

export const 보험_FULL_OPTIONS = [
  {
    value: 보험구분상세.일반,
    label: 보험구분상세FullLabel[보험구분상세.일반],
  },
  {
    value: 보험구분상세.직장조합,
    label: 보험구분상세FullLabel[보험구분상세.직장조합],
  },
  {
    value: 보험구분상세.국민공단,
    label: 보험구분상세FullLabel[보험구분상세.국민공단],
  },
  {
    value: 보험구분상세.의료급여1종,
    label: 보험구분상세FullLabel[보험구분상세.의료급여1종],
  },
  {
    value: 보험구분상세.의료급여2종,
    label: 보험구분상세FullLabel[보험구분상세.의료급여2종],
  },
  {
    value: 보험구분상세.의료급여2종장애,
    label: 보험구분상세FullLabel[보험구분상세.의료급여2종장애],
  },
  {
    value: 보험구분상세.차상위1종,
    label: 보험구분상세FullLabel[보험구분상세.차상위1종],
  },
  {
    value: 보험구분상세.차상위2종,
    label: 보험구분상세FullLabel[보험구분상세.차상위2종],
  },
  {
    value: 보험구분상세.차상위2종장애,
    label: 보험구분상세FullLabel[보험구분상세.차상위2종장애],
  },
  {
    value: 보험구분상세.자보,
    label: 보험구분상세FullLabel[보험구분상세.자보],
  },
  {
    value: 보험구분상세.산재,
    label: 보험구분상세FullLabel[보험구분상세.산재],
  },
  {
    value: 보험구분상세.재해,
    label: 보험구분상세FullLabel[보험구분상세.재해],
  },
];

export const 진료결과_OPTIONS = [
  {
    value: 진료결과.계속,
    label: 진료결과Label[진료결과.계속],
  },
  {
    value: 진료결과.이송,
    label: 진료결과Label[진료결과.이송],
  },
  {
    value: 진료결과.회송,
    label: 진료결과Label[진료결과.회송],
  },
  {
    value: 진료결과.사망,
    label: 진료결과Label[진료결과.사망],
  },
  {
    value: 진료결과.외래치료종결,
    label: 진료결과Label[진료결과.외래치료종결],
  },
];

export const SEARCH_PERIOD_OPTIONS = [
  { value: SearchPeriod.Direct, label: "직접입력" },
  { value: SearchPeriod.all, label: "전체" },
  { value: SearchPeriod.OneMonth, label: "1개월" },
  { value: SearchPeriod.TwoMonths, label: "2개월" },
  { value: SearchPeriod.ThreeMonths, label: "3개월" },
  { value: SearchPeriod.SixMonths, label: "6개월" },
  { value: SearchPeriod.OneYear, label: "1년" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: PaymentMethod.수납없음, label: "수납없음" },
  { value: PaymentMethod.보험가, label: "보험가" },
  { value: PaymentMethod.일반가, label: "일반가" },
  { value: PaymentMethod.보험가비급여, label: "보험가비급여" },
  { value: PaymentMethod.삼십대백, label: "30%" },
  { value: PaymentMethod.오십대백, label: "50%" },
  { value: PaymentMethod.팔십대백, label: "80%" },
  { value: PaymentMethod.구십대백, label: "90%" },
  { value: PaymentMethod.백대백, label: "100%" },
];

export const PAYMENT_METHOD_SHORT_OPTIONS = [
  { value: PaymentMethod.수납없음, label: "0" },
  { value: PaymentMethod.보험가, label: "보" },
  { value: PaymentMethod.일반가, label: "일" },
  { value: PaymentMethod.보험가비급여, label: "비" },
  { value: PaymentMethod.삼십대백, label: "30" },
  { value: PaymentMethod.오십대백, label: "50" },
  { value: PaymentMethod.팔십대백, label: "80" },
  { value: PaymentMethod.구십대백, label: "90" },
  { value: PaymentMethod.백대백, label: "100" },
];

export const USAGE_CATEGORY_OPTIONS = [
  { value: UsageCategory.COMMON, label: "공통" },
  { value: UsageCategory.INJECTION, label: "주사제" },
  { value: UsageCategory.EXTERNAL, label: "외용약" },
  { value: UsageCategory.INTERNAL, label: "내복약" },
  { value: UsageCategory.ETC, label: "기타" },
];

export const TEMPLATE_CODE_TYPE_OPTIONS = [
  { value: TemplateCodeType.전체, label: "전체" },
  { value: TemplateCodeType.증상, label: "증상" },
  { value: TemplateCodeType.임상메모, label: "임상메모" },
  { value: TemplateCodeType.특정내역, label: "특정내역" },
  { value: TemplateCodeType.조제시참고사항, label: "조제시참고사항" },
  { value: TemplateCodeType.지시오더, label: "지시오더" },
  { value: TemplateCodeType.예약메모, label: "예약메모" },
  { value: TemplateCodeType.환자메모, label: "환자메모" },
];

export const RECEIPT_PRINT_LOCATION_OPTIONS = [
  { value: ReceiptPrintLocation.없음, label: "없음" },
  { value: ReceiptPrintLocation.진찰료, label: "진찰료" },
  { value: ReceiptPrintLocation.입원료_1인실, label: "[입원료] 1인실" },
  { value: ReceiptPrintLocation.입원료_2_3인실, label: "[입원료] 2·3인실" },
  { value: ReceiptPrintLocation.입원료_4인실이상, label: "[입원료] 4인실 이상" },
  { value: ReceiptPrintLocation.식대, label: "식대" },
  { value: ReceiptPrintLocation.투약조제료_행위료, label: "[투약 및 조제료] 행위료" },
  { value: ReceiptPrintLocation.투약조제료_약품비, label: "[투약 및 조제료] 약품비" },
  { value: ReceiptPrintLocation.주사료_행위료, label: "[주사료] 행위료" },
  { value: ReceiptPrintLocation.주사료_약품비, label: "[주사료] 약품비" },
  { value: ReceiptPrintLocation.마취료, label: "마취료" },
  { value: ReceiptPrintLocation.처치및수술료, label: "처치 및 수술료" },
  { value: ReceiptPrintLocation.검사료, label: "검사료" },
  { value: ReceiptPrintLocation.영상진단료, label: "영상진단료" },
  { value: ReceiptPrintLocation.방사선치료료, label: "방사선치료료" },
  { value: ReceiptPrintLocation.치료재료대, label: "치료재료대" },
  { value: ReceiptPrintLocation.재활및물리치료료, label: "재활 및 물리치료료" },
  { value: ReceiptPrintLocation.정신요법료, label: "정신요법료" },
  { value: ReceiptPrintLocation.전혈및혈액성분제제료, label: "전혈 및 혈액성분제제료" },
  { value: ReceiptPrintLocation.CT진단료, label: "CT 진단료" },
  { value: ReceiptPrintLocation.MRI진단료, label: "MRI 진단료" },
  { value: ReceiptPrintLocation.PET진단료, label: "PET 진단료" },
  { value: ReceiptPrintLocation.초음파진단료, label: "초음파 진단료" },
  { value: ReceiptPrintLocation.보철교정료, label: "보철·교정료" },
  { value: ReceiptPrintLocation.제증명수수료, label: "제증명수수료" },
];

export const SEARCH_MODE_OPTIONS = [
  {
    value: "default",
    label: "일반 검색",
    tooltip: "속도는 다소 느리지만 사용자코드, 묶음의 변경사항이 실시간으로 반영됩니다.",
  },
  {
    value: "elasticsearch",
    label: "빠른 검색",
    tooltip:
      "빠른 검색이 가능하지만 사용자코드, 묶음의 추가 및 삭제가 실시간으로 반영되지 않습니다.",
  },
];
