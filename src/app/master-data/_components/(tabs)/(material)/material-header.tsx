import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";
import { HEADER_WIDTH_CODE, HEADER_WIDTH_DATE, HEADER_WIDTH_DATE_TIME, HEADER_WIDTH_DOCTOR_NAME, HEADER_WIDTH_INDEX, HEADER_WIDTH_IS_ACTIVE, HEADER_WIDTH_IS_SELF_PAY_RATE, HEADER_WIDTH_ITEM_TYPE, HEADER_WIDTH_NAME, HEADER_WIDTH_PRICE } from "../master-data-common-constant";

export const LS_MATERIAL_HEADERS_MASTER_KEY = "grid-headers-material-master";
export const LS_MATERIAL_HEADERS_USER_CODE_KEY =
  "grid-headers-material-user-code";

const materialMasterHeaders: MyGridHeaderType[] = [
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
    name: "코드",
    width: HEADER_WIDTH_CODE,
    minWidth: HEADER_WIDTH_CODE,
  },
  {
    key: "middleCategory",
    name: "중분류",
  },
  {
    key: "middleCategoryCode",
    name: "중분류코드",
  },
  {
    key: "name",
    name: "품명",
    width: HEADER_WIDTH_NAME,
  },
  {
    key: "material",
    name: "재질",
    width: HEADER_WIDTH_NAME,
  },
  {
    key: "manufacturerName",
    name: "제조회사",
  },
  {
    key: "importCompany",
    name: "제조·수입업소",
  },
  {
    key: "specification",
    name: "규격",
  },
  {
    key: "unit",
    name: "단위",
  },
  {
    key: "price",
    name: "상한금액",
    align: "right",
    width: HEADER_WIDTH_PRICE,
    minWidth: HEADER_WIDTH_PRICE,
  },
  {
    key: "isSelfPayRate50",
    name: "본인부담률 50%",
    align: "center",
    width: HEADER_WIDTH_IS_SELF_PAY_RATE,
    minWidth: HEADER_WIDTH_IS_SELF_PAY_RATE,
  },
  {
    key: "isSelfPayRate80",
    name: "본인부담률 80%",
    align: "center",
    width: HEADER_WIDTH_IS_SELF_PAY_RATE,
    minWidth: HEADER_WIDTH_IS_SELF_PAY_RATE,
  },
  {
    key: "isSelfPayRate90",
    name: "본인부담률 90%",
    align: "center",
    width: HEADER_WIDTH_IS_SELF_PAY_RATE,
    minWidth: HEADER_WIDTH_IS_SELF_PAY_RATE,
  },
  {
    key: "isDuplicateAllowed",
    name: "중복인정 여부",
    align: "center",
  },
];

export const defaultMaterialMasterHeaders = materialMasterHeaders.map(
  (header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);

const materialUserCodeHeaders: MyGridHeaderType[] = [
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
    key: "middleCategory",
    name: "중분류",
  },
  {
    key: "middleCategoryCode",
    name: "중분류코드",
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
    key: "material",
    name: "재질",
  },
  {
    key: "manufacturerName",
    name: "제조회사",
  },
  {
    key: "importCompany",
    name: "제조·수입업소",
  },
  {
    key: "specification",
    name: "규격",
  },
  {
    key: "unit",
    name: "단위",
  },
  {
    key: "dose",
    name: "투여량(용량)",
  },
  {
    key: "price",
    name: "상한금액",
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
    key: "actualPrice",
    name: "실거래가",
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
  },
  {
    key: "isSelfPayRate50",
    name: "본인부담률 50%",
    align: "center",
    width: HEADER_WIDTH_IS_SELF_PAY_RATE,
    minWidth: HEADER_WIDTH_IS_SELF_PAY_RATE,
  },
  {
    key: "isSelfPayRate80",
    name: "본인부담률 80%",
    align: "center",
    width: HEADER_WIDTH_IS_SELF_PAY_RATE,
    minWidth: HEADER_WIDTH_IS_SELF_PAY_RATE,
  },
  {
    key: "isSelfPayRate90",
    name: "본인부담률 90%",
    align: "center",
    width: HEADER_WIDTH_IS_SELF_PAY_RATE,
    minWidth: HEADER_WIDTH_IS_SELF_PAY_RATE,
  },
  {
    key: "isDuplicateAllowed",
    name: "중복인정 여부",
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

export const defaultMaterialUserCodeHeaders = materialUserCodeHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);
