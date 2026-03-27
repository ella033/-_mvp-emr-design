import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";
import { HEADER_WIDTH_CODE, HEADER_WIDTH_DATE, HEADER_WIDTH_DATE_TIME, HEADER_WIDTH_DOCTOR_NAME, HEADER_WIDTH_INDEX, HEADER_WIDTH_IS_ACTIVE, HEADER_WIDTH_IS_SELF_PAY_RATE, HEADER_WIDTH_ITEM_TYPE, HEADER_WIDTH_NAME, HEADER_WIDTH_PRICE } from "../master-data-common-constant";

export const LS_DRUG_HEADERS_MASTER_KEY = "grid-headers-drug-master";
export const LS_DRUG_HEADERS_USER_CODE_KEY = "grid-headers-drug-user-code";

const drugMasterHeaders: MyGridHeaderType[] = [
  {
    key: "index",
    name: "순번",
    width: HEADER_WIDTH_INDEX,
    minWidth: HEADER_WIDTH_INDEX,
  },
  {
    key: "applyDate",
    name: "적용일자",
    width: HEADER_WIDTH_DATE,
    minWidth: HEADER_WIDTH_DATE,
  },
  {
    key: "administrationRoute",
    name: "투여경로",
    width: HEADER_WIDTH_ITEM_TYPE,
    minWidth: HEADER_WIDTH_ITEM_TYPE,
  },
  {
    key: "claimCode",
    name: "청구코드",
    width: HEADER_WIDTH_CODE,
    minWidth: HEADER_WIDTH_CODE,
  },
  {
    key: "drugInfo",
    name: "DI",
    align: "center",
    width: 40,
    minWidth: 40,
    maxWidth: 40,
  },
  {
    key: "activeIngredientCode",
    name: "주성분코드",
    width: 80,
    minWidth: 80,
  },
  {
    key: "name",
    name: "한글명",
    width: HEADER_WIDTH_NAME,
  },
  {
    key: "price",
    name: "상한가",
    align: "right",
    width: HEADER_WIDTH_PRICE,
    minWidth: HEADER_WIDTH_PRICE,
  },
  {
    key: "additionalPrice",
    name: "가산금",
    width: HEADER_WIDTH_PRICE,
    minWidth: HEADER_WIDTH_PRICE,
  },
  {
    key: "manufacturerName",
    name: "업소명·제조사",
    width: 100,
    minWidth: 100,
  },
  {
    key: "specification",
    name: "규격",
    align: "right",
    width: 40,
    minWidth: 40,
  },
  {
    key: "unit",
    name: "단위",
    width: 40,
    minWidth: 40,
  },
  {
    key: "isSelfPayRate30",
    name: "본인부담률(30%)",
    align: "center",
    width: HEADER_WIDTH_IS_SELF_PAY_RATE,
    minWidth: HEADER_WIDTH_IS_SELF_PAY_RATE,
  },
  {
    key: "isSelfPayRate50",
    name: "본인부담률(50%)",
    align: "center",
    width: HEADER_WIDTH_IS_SELF_PAY_RATE,
    minWidth: HEADER_WIDTH_IS_SELF_PAY_RATE,
  },
  {
    key: "isSelfPayRate80",
    name: "본인부담률(80%)",
    align: "center",
    width: HEADER_WIDTH_IS_SELF_PAY_RATE,
    minWidth: HEADER_WIDTH_IS_SELF_PAY_RATE,
  },
  {
    key: "salaryStandard",
    name: "급여기준",
  },

  {
    key: "withdrawalPrevention",
    name: "퇴장방지",
  },
  {
    key: "exceptionDrugCategory",
    name: "예외의약품구분",
  },
  {
    key: "classificationNo",
    name: "분류번호",
  },
  {
    key: "specializationType",
    name: "전문/일반",
  },
  {
    key: "drugEquivalence",
    name: "의약품동등성",
  },
  {
    key: "substituteType",
    name: "저가대체가산여부",
  },
  {
    key: "prohibitedCompounding",
    name: "임의조제불가항목",
  },
  {
    key: "sameDrugCode",
    name: "동일 의약품",
  },
  {
    key: "claimSpecification",
    name: "청구규격",
  },
];

export const defaultDrugMasterHeaders = drugMasterHeaders.map(
  (header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);

const drugUserCodeHeaders: MyGridHeaderType[] = [
  {
    key: "index",
    name: "순번",
    width: HEADER_WIDTH_INDEX,
    minWidth: HEADER_WIDTH_INDEX,
  },
  {
    key: "isActive",
    name: "사용",
    align: "center",
    width: HEADER_WIDTH_IS_ACTIVE,
    minWidth: HEADER_WIDTH_IS_ACTIVE,
  },

  {
    key: "applyDate",
    name: "적용일자",
    width: HEADER_WIDTH_DATE,
    minWidth: HEADER_WIDTH_DATE,
  },
  {
    key: "endDate",
    name: "완료일자",
    width: HEADER_WIDTH_DATE,
    minWidth: HEADER_WIDTH_DATE,
  },
  {
    key: "administrationRoute",
    name: "투여경로",
    width: HEADER_WIDTH_ITEM_TYPE,
    minWidth: HEADER_WIDTH_ITEM_TYPE,
  },
  {
    key: "code",
    name: "사용자코드",
    width: HEADER_WIDTH_CODE,
    minWidth: HEADER_WIDTH_CODE,
  },
  {
    key: "claimCode",
    name: "청구코드",
    width: HEADER_WIDTH_CODE,
    minWidth: HEADER_WIDTH_CODE,
  },
  {
    key: "drugInfo",
    name: "DI",
    align: "center",
    width: 40,
    minWidth: 40,
    maxWidth: 40,
  },
  {
    key: "krName",
    name: "한글명",
    width: HEADER_WIDTH_NAME,
  },
  {
    key: "enName",
    name: "영문명",
    width: HEADER_WIDTH_NAME,
  },
  {
    key: "manufacturerName",
    name: "업소명·제조사",
  },
  {
    key: "paymentMethod",
    name: "수납방법",
  },
  {
    key: "isNormalPrice",
    name: "일반가여부",
    align: "center",
  },
  {
    key: "price",
    name: "상한가",
    align: "right",
    width: HEADER_WIDTH_PRICE,
    minWidth: HEADER_WIDTH_PRICE,
  },
  {
    key: "additionalPrice",
    name: "가산금",
    width: HEADER_WIDTH_PRICE,
    minWidth: HEADER_WIDTH_PRICE,
  },
  {
    key: "normalPrice",
    name: "일반가",
    align: "right",
    width: HEADER_WIDTH_PRICE,
    minWidth: HEADER_WIDTH_PRICE,
  },
  {
    key: "actualPrice",
    name: "실거래가",
    align: "right",
    width: HEADER_WIDTH_PRICE,
    minWidth: HEADER_WIDTH_PRICE,
  },
  {
    key: "specification",
    name: "규격",
    align: "right",
  },
  {
    key: "unit",
    name: "단위",
  },
  {
    key: "dose",
    name: "투여량",
    align: "center",
  },
  {
    key: "decimalPoint",
    name: "투여량 소수점",
    align: "center",
  },
  {
    key: "times",
    name: "일투여횟수",
    align: "center",
  },
  {
    key: "days",
    name: "투여일수",
    align: "center",
  },
  {
    key: "usage",
    name: "용법",
    align: "center",
  },

  {
    key: "inOutType",
    name: "원내외구분",
    align: "center",
  },
  {
    key: "exceptionCode",
    name: "예외코드",
    align: "center",
  },
  {
    key: "salaryStandard",
    name: "급여기준",
    align: "center",
  },
  {
    key: "activeIngredientCode",
    name: "주성분코드",
  },
  {
    key: "withdrawalPrevention",
    name: "퇴장방지",
  },
  {
    key: "exceptionDrugCategory",
    name: "예외의약품구분",
    align: "center",
  },
  {
    key: "classificationNo",
    name: "분류번호",
  },
  {
    key: "specializationType",
    name: "전문/일반",
  },
  {
    key: "drugEquivalence",
    name: "의약품동등성",
  },
  {
    key: "substituteType",
    name: "저가대체가산여부",
  },
  {
    key: "prohibitedCompounding",
    name: "임의조제불가항목",
  },
  {
    key: "sameDrugCode",
    name: "동일 의약품",
  },
  {
    key: "claimSpecification",
    name: "청구규격",
  },
  {
    key: "createId",
    name: "생성자명",
    width: HEADER_WIDTH_DOCTOR_NAME,
    minWidth: HEADER_WIDTH_DOCTOR_NAME,
  },
  {
    key: "createDateTime",
    name: "생성일시",
    width: HEADER_WIDTH_DATE_TIME,
    minWidth: HEADER_WIDTH_DATE_TIME,
  },
  {
    key: "updateId",
    name: "수정자명",
    width: HEADER_WIDTH_DOCTOR_NAME,
    minWidth: HEADER_WIDTH_DOCTOR_NAME,
  },
  {
    key: "updateDateTime",
    name: "수정일시",
    width: HEADER_WIDTH_DATE_TIME,
    minWidth: HEADER_WIDTH_DATE_TIME,
  }
];

export const defaultDrugUserCodeHeaders = drugUserCodeHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    readonly: true,
    sortable: false,
    sortNumber: index,
  })
);
