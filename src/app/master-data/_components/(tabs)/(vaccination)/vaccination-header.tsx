import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";

export const LS_VACCINATION_HEADERS_MASTER_KEY =
  "grid-headers-vaccination-master";
export const LS_VACCINATION_HEADERS_USER_CODE_KEY =
  "grid-headers-vaccination-user-code";

const vaccinationMasterHeaders: MyGridHeaderType[] = [
  {
    key: "index",
    name: "순번",
    width: 50,
    minWidth: 50,
    maxWidth: 50,
  },
  {
    key: "code",
    name: "코드",
  },
  {
    key: "name",
    name: "명칭",
    width: 300,
  },
];

export const defaultVaccinationMasterHeaders = vaccinationMasterHeaders.map(
  (header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);

const vaccinationUserCodeHeaders: MyGridHeaderType[] = [
  {
    key: "index",
    name: "순번",
    width: 50,
    minWidth: 50,
    maxWidth: 50,
  },
  {
    key: "code",
    name: "코드",
  },
  {
    key: "name",
    name: "명칭",
    width: 300,
  },
  {
    key: "price",
    name: "가격",
  },
  {
    key: "isActive",
    name: "사용",
  },
];

export const defaultVaccinationUserCodeHeaders = vaccinationUserCodeHeaders.map(
  (header, index) => ({
    ...header,
    visible: true,
    readonly: true,
    sortable: false,
    sortNumber: index,
  })
);
