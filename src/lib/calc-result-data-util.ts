import type {
  CalcResultData,
  ItemDetail,
  BillItem,
  영수증내역,
} from "@/types/chart/calc-result-data";
import { ReceiptPrintLocation } from "@/constants/common/common-enum";

export function get총진료비(calcResultData: CalcResultData) {
  if (!calcResultData) return 0;

  const 요양급여비용총액1 = calcResultData?.본인부담금액?.요양급여비용총액1 ?? 0;
  const 본인부담금총액100분의100 = calcResultData?.본인부담금액?.본인부담금총액100분의100 ?? 0;
  const 총액100분의100미만 = calcResultData?.본인부담금액?.총액100분의100미만 ?? 0;
  const 비급여총액 = calcResultData?.본인부담금액?.비급여총액 ?? 0;

  return (
    요양급여비용총액1 +
    본인부담금총액100분의100 +
    총액100분의100미만 +
    비급여총액
  );
}

export function get본인부담금(calcResultData: CalcResultData) {
  if (!calcResultData) return 0;

  const 요양급여비용본인부담금 = calcResultData?.본인부담금액?.요양급여비용본인부담금 ?? 0;
  const 본인부담금총액100분의100 = calcResultData?.본인부담금액?.본인부담금총액100분의100 ?? 0;
  const 본인일부부담금100분의100미만 = calcResultData?.본인부담금액?.본인일부부담금100분의100미만 ?? 0;
  const 비급여총액 = calcResultData?.본인부담금액?.비급여총액 ?? 0;

  return (
    요양급여비용본인부담금 +
    본인부담금총액100분의100 +
    본인일부부담금100분의100미만 +
    비급여총액
  );
}

export function get공단부담금(calcResultData: CalcResultData) {
  return get총진료비(calcResultData) - get본인부담금(calcResultData);
}

/**
 * 절삭차액(절삭 전 vs 절삭 후 차이)은 필요 시 별도 표시할 수 있습니다.
 * 본인부담.금액: 절삭 전 본인부담 금액. / 요양급여비용본인부담금은 본인부담기준에 따라 본인부담.금액을 절삭한 금액입니다.
 * 본인부담기준이 일반(8)일 때는 십원단위(-1) 절삭, 그 외(건강보험·차상위·의료급여 등)는 백원단위(-2) 절삭입니다.
 * 절삭된 금액은 공단부담금에 더해집니다. 일반(8)일 때는 절삭으로 인해 공단부담금이 생기더라도, 공단부담금이 0원이 되는 것이 맞습니다.
*/
export function get절삭차액(calcResultData: CalcResultData) {
  if (!calcResultData) return 0;

  const 본인부담금액 = calcResultData?.본인부담?.금액 ?? 0;
  const 요양급여비용본인부담금 = calcResultData?.본인부담금액?.요양급여비용본인부담금 ?? 0;
  const 절삭차액 = 본인부담금액 - 요양급여비용본인부담금;

  return 절삭차액;
}

export function get비급여(calcResultData: CalcResultData) {
  if (!calcResultData) return 0;
  return calcResultData?.본인부담금액?.비급여총액 ?? 0;
}

/**
 * 수납용 금액 계산 순수함수
 * - 총진료비 = 요양급여비용총액1 + 본인부담금총액100분의100 + 총액100분의100미만 + 비급여총액
 * - 본인부담금 = 본인부담금총액 또는 요양급여비용본인부담금 + 본인부담금총액100분의100 + 본인일부부담금100분의100미만 + 비급여총액 / "요양급여비용본인부담금" 기준(보험청구용, 절삭된 금액)
 * - 공단부담금 = 총진료비 - 본인부담금 (본인부담금이 절사되어 넘어왔기 때문에 절삭차액 제외)
 * - 절삭차액 = 본인부담.금액 - 요양급여비용본인부담금 / 본인부담기준이 일반(8)일 때는 십원단위(-1) 절삭, 그 외(건강보험·차상위·의료급여 등)는 백원단위(-2) 절삭입니다.
 */
export interface CalcPaymentAmounts {
  총진료비: number;
  본인부담금: number;
  공단부담금: number;
  비급여총액: number;
  절삭차액: number;
}

export function calcPaymentAmounts(calcResultData: CalcResultData): CalcPaymentAmounts {
  if (!calcResultData?.본인부담금액) {
    return { 총진료비: 0, 본인부담금: 0, 공단부담금: 0, 비급여총액: 0, 절삭차액: 0 };
  }

  const 총진료비 = get총진료비(calcResultData);
  const 비급여총액 = calcResultData.본인부담금액.비급여총액 ?? 0;
  const 본인부담금 = calcResultData.본인부담금액.본인부담금총액 ?? 0;
  const 공단부담금 = Math.max(0, 총진료비 - 본인부담금);
  const 절삭차액 = 0;

  return { 총진료비, 본인부담금, 공단부담금, 비급여총액, 절삭차액 };
}

/** getMedicalBillItems 반환 타입 */
export interface MedicalBillItemsResult {
  basicItems: BillItem[];
  optionalItems: BillItem[];
  otherItems: BillItem[];
  totals: {
    selfPayment: number;
    corporationPayment: number;
    fullSelfPayment: number;
    nonBenefit: number;
  };
  overLimitAmount: number;
  outOfHospitalPayment: number;
  nightHolidayDrugPayment: number;
}

const sumSelf = (items: ItemDetail[]) => items.reduce((s, i) => s + (i.본인부담금 ?? 0), 0);
const sumCorp = (items: ItemDetail[]) => items.reduce((s, i) => s + (i.공단부담금 ?? 0), 0);
const sumFull = (items: ItemDetail[]) => items.reduce((s, i) => s + (i.전액본인부담금 ?? 0), 0);
const sumNon = (items: ItemDetail[]) => items.reduce((s, i) => s + (i.비급여금 ?? 0), 0);

/** 영수증내역s를 영수증출력위치별로 합산한 맵 (같은 위치가 여러 건이면 합산) */
function getAmountsByReceiptLocation(
  receiptDetails: 영수증내역[]
): Map<ReceiptPrintLocation, { selfPayment: number; corporationPayment: number; fullSelfPayment: number; nonBenefit: number }> {
  const map = new Map<
    ReceiptPrintLocation,
    { selfPayment: number; corporationPayment: number; fullSelfPayment: number; nonBenefit: number }
  >();
  for (const r of receiptDetails) {
    const loc = r.영수증출력위치 as ReceiptPrintLocation;
    const prev = map.get(loc) ?? {
      selfPayment: 0,
      corporationPayment: 0,
      fullSelfPayment: 0,
      nonBenefit: 0,
    };
    map.set(loc, {
      selfPayment: prev.selfPayment + (r.본인부담금 ?? 0),
      corporationPayment: prev.corporationPayment + (r.공단부담금 ?? 0),
      fullSelfPayment: prev.fullSelfPayment + (r.전액본인부담금 ?? 0),
      nonBenefit: prev.nonBenefit + (r.비급여금 ?? 0),
    });
  }
  return map;
}

/** 기본/선택/기타 항목의 고정 순서(영수증출력위치 → category, subCategory) */
const BASIC_SLOTS: { location: ReceiptPrintLocation; category: string; subCategory?: string }[] = [
  { location: ReceiptPrintLocation.진찰료, category: "진찰료" },
  { location: ReceiptPrintLocation.입원료_1인실, category: "입원료", subCategory: "1인실" },
  { location: ReceiptPrintLocation.입원료_2_3인실, category: "입원료", subCategory: "2,3인실" },
  { location: ReceiptPrintLocation.입원료_4인실이상, category: "입원료", subCategory: "4인실 이상" },
  { location: ReceiptPrintLocation.식대, category: "식대" },
  { location: ReceiptPrintLocation.투약조제료_행위료, category: "투약,조제", subCategory: "행위료" },
  { location: ReceiptPrintLocation.투약조제료_약품비, category: "투약,조제", subCategory: "약품비" },
  { location: ReceiptPrintLocation.주사료_행위료, category: "주사", subCategory: "행위료" },
  { location: ReceiptPrintLocation.주사료_약품비, category: "주사", subCategory: "약품비" },
  { location: ReceiptPrintLocation.마취료, category: "마취료" },
  { location: ReceiptPrintLocation.처치및수술료, category: "처치 및 수술료" },
  { location: ReceiptPrintLocation.검사료, category: "검사료" },
  { location: ReceiptPrintLocation.영상진단료, category: "영상진단료" },
  { location: ReceiptPrintLocation.방사선치료료, category: "방사선치료료" },
  { location: ReceiptPrintLocation.치료재료대, category: "치료재료대" },
  { location: ReceiptPrintLocation.재활및물리치료료, category: "재활 및 물리치료료" },
  { location: ReceiptPrintLocation.정신요법료, category: "정신요법료" },
  { location: ReceiptPrintLocation.전혈및혈액성분제제료, category: "전혈 및 혈액성분제제료" },
];
const OPTIONAL_SLOTS: { location: ReceiptPrintLocation; category: string; subCategory?: string }[] = [
  { location: ReceiptPrintLocation.CT진단료, category: "CT진단료" },
  { location: ReceiptPrintLocation.MRI진단료, category: "MRI진단료" },
  { location: ReceiptPrintLocation.PET진단료, category: "PET진단료" },
  { location: ReceiptPrintLocation.초음파진단료, category: "초음파진단료" },
  { location: ReceiptPrintLocation.보철교정료, category: "보철, 교정료 기타" },
  { location: ReceiptPrintLocation.제증명수수료, category: "제증명수수료" },
];
const OTHER_SLOTS: { location: ReceiptPrintLocation; category: string; subCategory?: string }[] = [
  { location: ReceiptPrintLocation.선별급여, category: "선별급여" },
  { location: ReceiptPrintLocation.정액65세이상등, category: "65세 이상 등 정액" },
  { location: ReceiptPrintLocation.질병군포괄수가, category: "질병군 포괄수가" },
];

function buildBillItemsFromMap(
  slots: { location: ReceiptPrintLocation; category: string; subCategory?: string }[],
  amountsByLocation: Map<
    ReceiptPrintLocation,
    { selfPayment: number; corporationPayment: number; fullSelfPayment: number; nonBenefit: number }
  >
): BillItem[] {
  const zero = { selfPayment: 0, corporationPayment: 0, fullSelfPayment: 0, nonBenefit: 0 };
  return slots.map(({ location, category, subCategory }) => {
    const amt = amountsByLocation.get(location) ?? zero;
    return {
      category,
      ...(subCategory != null ? { subCategory } : {}),
      selfPayment: amt.selfPayment,
      corporationPayment: amt.corporationPayment,
      fullSelfPayment: amt.fullSelfPayment,
      nonBenefit: amt.nonBenefit,
    };
  });
}

/**
 * calcResultData로부터 진료비 계산용 기본/선택/기타 항목·합계·원외약가 등을 계산합니다.
 * 영수증내역s가 있으면 영수증출력위치로 위치를 잡아 사용하고, 없으면 항목별내역s 기준(항목구분)으로 계산합니다.
 */
export function getMedicalBillItems(
  calcResultData: CalcResultData | null | undefined
): MedicalBillItemsResult {
  const receiptDetails = calcResultData?.영수증내역s ?? [];

  if (receiptDetails.length > 0) {
    const amountsByLocation = getAmountsByReceiptLocation(receiptDetails);
    const basicItems = buildBillItemsFromMap(BASIC_SLOTS, amountsByLocation);
    const optionalItems = buildBillItemsFromMap(OPTIONAL_SLOTS, amountsByLocation);
    const otherItems = buildBillItemsFromMap(OTHER_SLOTS, amountsByLocation);
    const allItems = [...basicItems, ...optionalItems, ...otherItems];
    const totals = allItems.reduce(
      (acc, item) => ({
        selfPayment: acc.selfPayment + item.selfPayment,
        corporationPayment: acc.corporationPayment + item.corporationPayment,
        fullSelfPayment: acc.fullSelfPayment + item.fullSelfPayment,
        nonBenefit: acc.nonBenefit + item.nonBenefit,
      }),
      { selfPayment: 0, corporationPayment: 0, fullSelfPayment: 0, nonBenefit: 0 }
    );
    return {
      basicItems,
      optionalItems,
      otherItems,
      totals,
      overLimitAmount: 0,
      outOfHospitalPayment: calcResultData?.원외약본인부담?.금액 ?? 0,
      nightHolidayDrugPayment: 0,
    };
  }

  // fallback: 항목별내역s + 항목구분으로 위치 계산
  const items = calcResultData?.항목별내역s ?? [];

  const 진찰료 = items.filter((i) => i.항목구분.startsWith("01"));
  const 투약조제행위료 = items.filter((i) => i.항목구분.startsWith("03") && i.란구분 === 2);
  const 투약조제약품비 = items.filter((i) => i.항목구분.startsWith("03") && i.란구분 !== 2);
  const 주사행위료 = items.filter((i) => i.항목구분.startsWith("04") && i.란구분 === 2);
  const 주사약품비 = items.filter((i) => i.항목구분.startsWith("04") && i.란구분 !== 2);
  const 마취료 = items.filter((i) => i.항목구분 === "0501");
  const 처치및수술료 = items.filter((i) => i.항목구분 === "0801" || i.항목구분 === "0803");
  const 검사료 = items.filter((i) => i.항목구분.startsWith("09"));
  const 영상진단료 = items.filter((i) => i.항목구분 === "1001");
  const 방사선치료료 = items.filter((i) => i.항목구분 === "1002");
  const 재활및물리치료료 = items.filter((i) => i.항목구분 === "0601");
  const 정신요법료 = items.filter((i) => i.항목구분 === "0701");
  const 전혈및혈액성분제제료 = items.filter((i) => i.항목구분 === "0802");
  const CT진단료 = items.filter((i) => i.항목구분 === "S01");
  const MRI진단료 = items.filter((i) => i.항목구분 === "S02");
  const PET진단료 = items.filter((i) => i.항목구분 === "S03");
  const 정액내역 = items.filter((i) => i.항목구분 === "정액내역");

  const basicItems: BillItem[] = [
    {
      category: "진찰료",
      selfPayment: sumSelf(진찰료),
      corporationPayment: sumCorp(진찰료),
      fullSelfPayment: sumFull(진찰료),
      nonBenefit: sumNon(진찰료),
    },
    {
      category: "입원료",
      subCategory: "1인실",
      selfPayment: 0,
      corporationPayment: 0,
      fullSelfPayment: 0,
      nonBenefit: 0,
    },
    {
      category: "입원료",
      subCategory: "2,3인실",
      selfPayment: 0,
      corporationPayment: 0,
      fullSelfPayment: 0,
      nonBenefit: 0,
    },
    {
      category: "입원료",
      subCategory: "4인실 이상",
      selfPayment: 0,
      corporationPayment: 0,
      fullSelfPayment: 0,
      nonBenefit: 0,
    },
    {
      category: "식대",
      selfPayment: 0,
      corporationPayment: 0,
      fullSelfPayment: 0,
      nonBenefit: 0,
    },
    {
      category: "투약,조제",
      subCategory: "행위료",
      selfPayment: sumSelf(투약조제행위료),
      corporationPayment: sumCorp(투약조제행위료),
      fullSelfPayment: sumFull(투약조제행위료),
      nonBenefit: sumNon(투약조제행위료),
    },
    {
      category: "투약,조제",
      subCategory: "약품비",
      selfPayment: sumSelf(투약조제약품비),
      corporationPayment: sumCorp(투약조제약품비),
      fullSelfPayment: sumFull(투약조제약품비),
      nonBenefit: sumNon(투약조제약품비),
    },
    {
      category: "주사",
      subCategory: "행위료",
      selfPayment: sumSelf(주사행위료),
      corporationPayment: sumCorp(주사행위료),
      fullSelfPayment: sumFull(주사행위료),
      nonBenefit: sumNon(주사행위료),
    },
    {
      category: "주사",
      subCategory: "약품비",
      selfPayment: sumSelf(주사약품비),
      corporationPayment: sumCorp(주사약품비),
      fullSelfPayment: sumFull(주사약품비),
      nonBenefit: sumNon(주사약품비),
    },
    {
      category: "마취료",
      selfPayment: sumSelf(마취료),
      corporationPayment: sumCorp(마취료),
      fullSelfPayment: sumFull(마취료),
      nonBenefit: sumNon(마취료),
    },
    {
      category: "처치 및 수술료",
      selfPayment: sumSelf(처치및수술료),
      corporationPayment: sumCorp(처치및수술료),
      fullSelfPayment: sumFull(처치및수술료),
      nonBenefit: sumNon(처치및수술료),
    },
    {
      category: "검사료",
      selfPayment: sumSelf(검사료),
      corporationPayment: sumCorp(검사료),
      fullSelfPayment: sumFull(검사료),
      nonBenefit: sumNon(검사료),
    },
    {
      category: "영상진단료",
      selfPayment: sumSelf(영상진단료),
      corporationPayment: sumCorp(영상진단료),
      fullSelfPayment: sumFull(영상진단료),
      nonBenefit: sumNon(영상진단료),
    },
    {
      category: "방사선치료료",
      selfPayment: sumSelf(방사선치료료),
      corporationPayment: sumCorp(방사선치료료),
      fullSelfPayment: sumFull(방사선치료료),
      nonBenefit: sumNon(방사선치료료),
    },
    {
      category: "치료재료대",
      selfPayment: 0,
      corporationPayment: 0,
      fullSelfPayment: 0,
      nonBenefit: 0,
    },
    {
      category: "재활 및 물리치료료",
      selfPayment: sumSelf(재활및물리치료료),
      corporationPayment: sumCorp(재활및물리치료료),
      fullSelfPayment: sumFull(재활및물리치료료),
      nonBenefit: sumNon(재활및물리치료료),
    },
    {
      category: "정신요법료",
      selfPayment: sumSelf(정신요법료),
      corporationPayment: sumCorp(정신요법료),
      fullSelfPayment: sumFull(정신요법료),
      nonBenefit: sumNon(정신요법료),
    },
    {
      category: "전혈 및 혈액성분제제료",
      selfPayment: sumSelf(전혈및혈액성분제제료),
      corporationPayment: sumCorp(전혈및혈액성분제제료),
      fullSelfPayment: sumFull(전혈및혈액성분제제료),
      nonBenefit: sumNon(전혈및혈액성분제제료),
    },
  ];

  const optionalItems: BillItem[] = [
    {
      category: "CT진단료",
      selfPayment: sumSelf(CT진단료),
      corporationPayment: sumCorp(CT진단료),
      fullSelfPayment: sumFull(CT진단료),
      nonBenefit: sumNon(CT진단료),
    },
    {
      category: "MRI진단료",
      selfPayment: sumSelf(MRI진단료),
      corporationPayment: sumCorp(MRI진단료),
      fullSelfPayment: sumFull(MRI진단료),
      nonBenefit: sumNon(MRI진단료),
    },
    {
      category: "PET진단료",
      selfPayment: sumSelf(PET진단료),
      corporationPayment: sumCorp(PET진단료),
      fullSelfPayment: sumFull(PET진단료),
      nonBenefit: sumNon(PET진단료),
    },
    {
      category: "초음파진단료",
      selfPayment: 0,
      corporationPayment: 0,
      fullSelfPayment: 0,
      nonBenefit: 0,
    },
    {
      category: "보철, 교정료 기타",
      selfPayment: 0,
      corporationPayment: 0,
      fullSelfPayment: 0,
      nonBenefit: 0,
    },
    {
      category: "제증명수수료",
      selfPayment: 0,
      corporationPayment: 0,
      fullSelfPayment: 0,
      nonBenefit: 0,
    },
  ];

  const otherItems: BillItem[] = [
    {
      category: "선별급여",
      selfPayment: 0,
      corporationPayment: 0,
      fullSelfPayment: 0,
      nonBenefit: 0,
    },
    {
      category: "65세 이상 등 정액",
      selfPayment: sumSelf(정액내역),
      corporationPayment: sumCorp(정액내역),
      fullSelfPayment: 0,
      nonBenefit: 0,
    },
    {
      category: "질병군 포괄수가",
      selfPayment: 0,
      corporationPayment: 0,
      fullSelfPayment: 0,
      nonBenefit: 0,
    },
  ];

  const allItems = [...basicItems, ...optionalItems, ...otherItems];
  const totals = allItems.reduce(
    (acc, item) => ({
      selfPayment: acc.selfPayment + item.selfPayment,
      corporationPayment: acc.corporationPayment + item.corporationPayment,
      fullSelfPayment: acc.fullSelfPayment + item.fullSelfPayment,
      nonBenefit: acc.nonBenefit + item.nonBenefit,
    }),
    { selfPayment: 0, corporationPayment: 0, fullSelfPayment: 0, nonBenefit: 0 }
  );

  return {
    basicItems,
    optionalItems,
    otherItems,
    totals,
    overLimitAmount: 0,
    outOfHospitalPayment: calcResultData?.원외약본인부담?.금액 ?? 0,
    nightHolidayDrugPayment: 0,
  };
}
