import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";
import { HEADER_WIDTH_CODE, HEADER_WIDTH_DATE, HEADER_WIDTH_DATE_TIME, HEADER_WIDTH_DOCTOR_NAME, HEADER_WIDTH_INDEX, HEADER_WIDTH_IS_ACTIVE, HEADER_WIDTH_IS_SELF_PAY_RATE, HEADER_WIDTH_NAME, HEADER_WIDTH_PRICE } from "../master-data-common-constant";

export const LS_MEDICAL_EXAMINE_HEADERS_MASTER_KEY =
  "grid-headers-medical-examine-master";
export const LS_EXTERNAL_LAB_EXAMINATION_HEADERS_KEY =
  "grid-headers-external-lab-examination";
export const LS_MEDICAL_EXAMINE_HEADERS_USER_CODE_KEY =
  "grid-headers-medical-examine-user-code";

const medicalExamineMasterHeaders: MyGridHeaderType[] = [
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

export const defaultMedicalExamineMasterHeaders =
  medicalExamineMasterHeaders.map((header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  }));

const externalLabExaminationHeaders: MyGridHeaderType[] = [
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
    key: "examinationCode",
    name: "검사코드",
    width: HEADER_WIDTH_CODE,
    minWidth: HEADER_WIDTH_CODE,
  },
  {
    key: "ubCode",
    name: "표준코드",
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
    key: "name",
    name: "한글명",
    width: HEADER_WIDTH_NAME,
    minWidth: HEADER_WIDTH_NAME,
  },
  {
    key: "ename",
    name: "영문명",
    width: HEADER_WIDTH_NAME,
    minWidth: HEADER_WIDTH_NAME,
  },
  {
    key: "type",
    name: "타입",
  },
  {
    key: "spcName",
    name: "검체명",
  },
  {
    key: "libraryName",
    name: "수탁기관",
  },
  {
    key: "prescriptionLibraryName",
    name: "처방라이브러리명",
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
];

export const defaultExternalLabExaminationHeaders =
  externalLabExaminationHeaders.map((header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  }));


const medicalExamineUserCodeHeaders: MyGridHeaderType[] = [
  {
    key: "index",
    name: "순번",
    width: HEADER_WIDTH_INDEX,
    minWidth: HEADER_WIDTH_INDEX,
  },
  {
    key: "isActive",
    name: "사용여부",
    align: "center",
    width: HEADER_WIDTH_IS_ACTIVE,
    minWidth: HEADER_WIDTH_IS_ACTIVE,
  },
  {
    key: "code",
    name: "사용자코드",
    width: HEADER_WIDTH_CODE,
    minWidth: HEADER_WIDTH_CODE,
  },
  {
    key: "applyDate",
    name: "적용일자",
    width: HEADER_WIDTH_DATE,
    minWidth: HEADER_WIDTH_DATE,
  },
  {
    key: "externalLabName",
    name: "수탁기관",
  },
  {
    key: "externalLabExaminationCode",
    name: "수탁사코드",
  },
  {
    key: "claimCode",
    name: "청구코드",
    width: HEADER_WIDTH_CODE,
    minWidth: HEADER_WIDTH_CODE,
  },
  {
    key: "externalLabUbCode",
    name: "표준코드",
    width: HEADER_WIDTH_CODE,
    minWidth: HEADER_WIDTH_CODE,
  },
  {
    key: "krName",
    name: "검사명(한)",
    width: HEADER_WIDTH_NAME,
  },
  {
    key: "enName",
    name: "검사명(영)",
    width: HEADER_WIDTH_NAME,
  },
  {
    key: "examinationType",
    name: "검사타입",
  },
  {
    key: "specimenName",
    name: "검체 명칭",
  },
  {
    key: "priceApplyDate",
    name: "가격적용일자",
    width: HEADER_WIDTH_DATE,
    minWidth: HEADER_WIDTH_DATE,
  },
  {
    key: "price",
    name: "수가",
    align: "right",
    width: HEADER_WIDTH_PRICE,
    minWidth: HEADER_WIDTH_PRICE,
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

export const defaultMedicalExamineUserCodeHeaders =
  medicalExamineUserCodeHeaders.map((header, index) => ({
    ...header,
    visible: true,
    sortable: false,
    sortNumber: index,
  }));
