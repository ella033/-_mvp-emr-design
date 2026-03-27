import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";
import { HEADER_WIDTH_CODE, HEADER_WIDTH_DATE, HEADER_WIDTH_DATE_TIME, HEADER_WIDTH_DOCTOR_NAME, HEADER_WIDTH_INDEX, HEADER_WIDTH_IS_ACTIVE, HEADER_WIDTH_IS_SELF_PAY_RATE, HEADER_WIDTH_ITEM_TYPE, HEADER_WIDTH_NAME, HEADER_WIDTH_PRICE } from "../master-data-common-constant";

export const LS_MEDICAL_ACTION_HEADERS_MASTER_KEY =
  "grid-headers-medical-action-master";
export const LS_MEDICAL_ACTION_HEADERS_USER_CODE_KEY =
  "grid-headers-medical-action-user-code";

const medicalActionMasterHeaders: MyGridHeaderType[] = [
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
    key: "itemType",
    name: "항목구분",
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
    key: "name",
    name: "한글명",
    width: HEADER_WIDTH_NAME,
  },
  {
    key: "nameEn",
    name: "영문명",
    width: HEADER_WIDTH_NAME,
  },
  {
    key: "organCategory",
    name: "장구분",
  },
  {
    key: "sectionCategory",
    name: "절구분",
  },
  {
    key: "subCategory",
    name: "세분류",
  },
  {
    key: "classificationNo",
    name: "분류번호",
  },
  {
    key: "price",
    name: "의원단가",
    align: "right",
    width: HEADER_WIDTH_PRICE,
    minWidth: HEADER_WIDTH_PRICE,
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
    key: "isSelfPayRate90",
    name: "본인부담률(90%)",
    align: "center",
    width: HEADER_WIDTH_IS_SELF_PAY_RATE,
    minWidth: HEADER_WIDTH_IS_SELF_PAY_RATE,
  },
  {
    key: "oneTwoType",
    name: "란구분",
    align: "center",
  },
  {
    key: "relativeValueScore",
    name: "상대가치점수",
    align: "right",
  },
  {
    key: "assessmentName",
    name: "산정명칭",
    align: "center",
  },
  {
    key: "surgeryType",
    name: "수술여부",
    align: "center",
  },
  {
    key: "isDuplicateAllowed",
    name: "중복인정여부",
    align: "center",
  },
];

export const defaultMedicalActionMasterHeaders = medicalActionMasterHeaders.map(
  (header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);

const medicalActionUserCodeHeaders: MyGridHeaderType[] = [
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
    name: "종료일자",
    width: HEADER_WIDTH_DATE,
    minWidth: HEADER_WIDTH_DATE,
  },
  {
    key: "itemType",
    name: "항목구분",
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
    key: "organCategory",
    name: "장구분",
  },
  {
    key: "sectionCategory",
    name: "절구분",
  },
  {
    key: "subCategory",
    name: "세분류",
  },
  {
    key: "classificationNo",
    name: "분류번호",
  },
  {
    key: "price",
    name: "의원단가",
    align: "right",
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
    key: "paymentMethod",
    name: "수납방법",
  },
  {
    key: "isNormalPrice",
    name: "일반가여부",
    align: "center",
  },
  {
    key: "isIncomeTaxDeductionExcluded",
    name: "소득세공제제외여부",
    align: "center",
  },
  {
    key: "isAgeAdditionExcluded",
    name: "나이가산제외여부",
    align: "center",
  },
  {
    key: "isNightHolidayExcluded",
    name: "야간공휴가산제외여부",
    align: "center",
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
    key: "isSelfPayRate90",
    name: "본인부담률(90%)",
    align: "center",
    width: HEADER_WIDTH_IS_SELF_PAY_RATE,
    minWidth: HEADER_WIDTH_IS_SELF_PAY_RATE,
  },
  {
    key: "oneTwoType",
    name: "란구분",
    align: "center",
  },
  {
    key: "relativeValueScore",
    name: "상대가치점수",
    align: "right",
  },
  {
    key: "assessmentName",
    name: "산정명칭",
    align: "center",
  },
  {
    key: "surgeryType",
    name: "수술여부",
    align: "center",
  },
  {
    key: "isDuplicateAllowed",
    name: "중복인정여부",
    align: "center",
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

export const defaultMedicalActionUserCodeHeaders =
  medicalActionUserCodeHeaders.map((header, index) => ({
    ...header,
    visible: true,
    sortable: false,
    sortNumber: index,
  }));
