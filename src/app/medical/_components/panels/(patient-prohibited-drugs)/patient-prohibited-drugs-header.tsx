import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";

export const LS_PATIENT_PROHIBITED_DRUGS_HEADERS_KEY =
  "patient-prohibited-drugs-headers";

const patientProhibitedDrugsHeaders: MyGridHeaderType[] = [
  {
    key: "createDate",
    name: "등록일",
    width: 82,
    minWidth: 82,
  },
  {
    key: "name",
    name: "약품명",
    width: 200,
  },
  {
    key: "atcCode",
    name: "주성분코드",
    width: 80,
    minWidth: 80,
  },
  {
    key: "isSameIngredientProhibited",
    name: "동일성분금지",
    align: "center",
    width: 80,
    minWidth: 80,
  },
  {
    key: "isPrescriptionAllowed",
    name: "처방 허용",
    align: "center",
    width: 70,
    minWidth: 70,
  },
  {
    key: "memo",
    name: "메모",
    width: 200,
  },
];

export const defaultPatientProhibitedDrugsHeaders =
  patientProhibitedDrugsHeaders.map((header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  }));
