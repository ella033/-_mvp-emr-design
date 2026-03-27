import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";

export const LS_SPECIMEN_DETAIL_HEADERS_MASTER_KEY =
  "grid-headers-specimen-detail-master";
export const LS_SPECIMEN_DETAIL_HEADERS_REGISTERED_KEY =
  "grid-headers-specimen-detail-registered";

const specimenDetailMasterHeaders: MyGridHeaderType[] = [
  {
    key: "code",
    name: "코드",
  },
  {
    key: "name",
    name: "명칭",
    width: 450,
  },
];

export const defaultSpecimenDetailMasterHeaders =
  specimenDetailMasterHeaders.map((header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  }));

const specimenDetailRegisteredHeaders: MyGridHeaderType[] = [
  {
    key: "code",
    name: "코드",
  },
  {
    key: "name",
    name: "명칭",
    width: 450,
  },
];

export const defaultSpecimenDetailRegisteredHeaders =
  specimenDetailRegisteredHeaders.map((header, index) => ({
    ...header,
    readonly: true,
    visible: true,
    sortable: false,
    sortNumber: index,
  }));
