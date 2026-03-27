import type { MyTreeGridHeaderType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";

export const PC_DIAGNOSIS_HEADERS = "diagnosis-headers";
export const PC_HISTORY_DIAGNOSIS_HEADERS = "history-diagnosis-headers";
export const PC_BUNDLE_DISEASE_HEADERS = "bundle-disease-headers";
export const PC_MEDICAL_BUNDLE_DISEASE_HEADERS = "medical-bundle-disease-headers";

const diseaseHeaders: MyTreeGridHeaderType[] = [
  {
    key: "code",
    name: "상병코드",
    width: 60,
    minWidth: 60,
  },
  {
    key: "name",
    name: "명칭",
    width: 200,
    minWidth: 100,
  },
  {
    key: "isSuspected",
    name: "의증",
    align: "center",
    width: 30,
    minWidth: 30,
  },
  {
    key: "isExcluded",
    name: "배제",
    align: "center",
    width: 30,
    minWidth: 30,
  },
  {
    key: "isLeftSide",
    name: "좌",
    align: "center",
    width: 20,
    minWidth: 20,
  },
  {
    key: "isRightSide",
    name: "우",
    align: "center",
    width: 20,
    minWidth: 20,
  },
  {
    key: "department",
    name: "진료과",
    width: 95,
    minWidth: 95,
  },
  {
    key: "specificSymbol",
    name: "특정기호",
    width: 50,
    minWidth: 50,
  },
  {
    key: "externalCauseCode",
    name: "상해외인",
    width: 50,
    minWidth: 50,
  },
  {
    key: "isSurgery",
    name: "수술",
    align: "center",
    width: 30,
    minWidth: 30,
  },
];

export const defaultDiseaseHeaders = diseaseHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);

const diseaseViewHeaders: MyTreeGridHeaderType[] = [
  {
    key: "name",
    name: "명칭",
    width: 300,
    minWidth: 100,
  },
];

export const defaultDiseaseViewHeaders = diseaseViewHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    sortNumber: index,
  })
);