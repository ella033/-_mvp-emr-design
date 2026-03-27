import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";

export const LS_DISEASE_LINK_HEADERS_MASTER_KEY =
  "grid-headers-disease-link-master";
export const LS_DISEASE_LINK_HEADERS_REGISTERED_KEY =
  "grid-headers-disease-link-registered";

const diseaseLinkMasterHeaders: MyGridHeaderType[] = [
  {
    key: "index",
    name: "순번",
  },
  {
    key: "code",
    name: "상병코드",
  },
  {
    key: "applyDate",
    name: "적용일",
  },
  {
    key: "name",
    name: "한글명",
    width: 300,
  },
  {
    key: "nameEn",
    name: "영문명",
    width: 300,
  },
  {
    key: "isPossibleMainDisease",
    name: "주상병사용구분",
    align: "center",
  },
  {
    key: "legalInfectiousCategory",
    name: "법정감염병구분",
    align: "center",
  },
  {
    key: "gender",
    name: "성별구분",
    align: "center",
  },
  {
    key: "maxAge",
    name: "상한연령",
  },
  {
    key: "minAge",
    name: "하한연령",
  },
];

export const defaultDiseaseLinkMasterHeaders = diseaseLinkMasterHeaders.map(
  (header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);

const diseaseLinkRegisteredHeaders: MyGridHeaderType[] = [
  {
    key: "index",
    name: "순번",
  },
  {
    key: "code",
    name: "코드",
  },
  {
    key: "name",
    name: "명칭",
    width: 500,
  },
];

export const defaultDiseaseLinkRegisteredHeaders =
  diseaseLinkRegisteredHeaders.map((header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  }));
