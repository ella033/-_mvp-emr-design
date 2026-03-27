import type { MyGridHeaderType } from "@/components/yjg/my-grid/my-grid-type";
import { PrescriptionType } from "@/constants/master-data-enum";

export const LS_PRICE_DETAILS_HEADERS_KEY = "grid-headers-price-details";

const DATE_WIDTH = 120;
const PRICE_WIDTH = 90;

const medicalPriceDetailsHeaders: MyGridHeaderType[] = [
  {
    key: "applyDate",
    name: "가격적용일",
    width: DATE_WIDTH,
    minWidth: DATE_WIDTH,
  },
  {
    key: "price",
    name: "보험가(상한)",
    align: "right",
    width: PRICE_WIDTH,
    minWidth: PRICE_WIDTH,
  },
  {
    key: "normalPrice",
    name: "일반가",
    align: "right",
    width: PRICE_WIDTH,
    minWidth: PRICE_WIDTH,
  },
];

const drugPriceDetailsHeaders: MyGridHeaderType[] = [
  {
    key: "applyDate",
    name: "가격적용일",
    width: DATE_WIDTH,
    minWidth: DATE_WIDTH,
  },
  {
    key: "price",
    name: "보험가(상한)",
    align: "right",
    width: PRICE_WIDTH,
    minWidth: PRICE_WIDTH,
  },
  {
    key: "additionalPrice",
    name: "가산금",
    align: "right",
    width: PRICE_WIDTH,
    minWidth: PRICE_WIDTH,
  },
  {
    key: "normalPrice",
    name: "일반가",
    align: "right",
    width: PRICE_WIDTH,
    minWidth: PRICE_WIDTH,
  },
  {
    key: "actualPrice",
    name: "실거래가",
    align: "right",
    width: PRICE_WIDTH,
    minWidth: PRICE_WIDTH,
  },
];

const materialPriceDetailsHeaders: MyGridHeaderType[] = [
  {
    key: "applyDate",
    name: "가격적용일",
    width: DATE_WIDTH,
    minWidth: DATE_WIDTH,
  },
  {
    key: "price",
    name: "보험가(상한)",
    align: "right",
    width: PRICE_WIDTH,
    minWidth: PRICE_WIDTH,
  },
  {
    key: "normalPrice",
    name: "일반가",
    align: "right",
    width: PRICE_WIDTH,
    minWidth: PRICE_WIDTH,
  },
  {
    key: "actualPrice",
    name: "실거래가",
    align: "right",
    width: PRICE_WIDTH,
    minWidth: PRICE_WIDTH,
  },
];

export const defaultMedicalPriceDetailsHeaders = medicalPriceDetailsHeaders.map(
  (header, index) => ({
    ...header,
    readonly: false,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);

export const defaultDrugPriceDetailsHeaders = drugPriceDetailsHeaders.map(
  (header, index) => ({
    ...header,
    readonly: false,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);

export const defaultMaterialPriceDetailsHeaders = materialPriceDetailsHeaders.map(
  (header, index) => ({
    ...header,
    readonly: false,
    visible: true,
    sortable: false,
    sortNumber: index,
  })
);

export const getDefaultPriceDetailsHeaders = (prescriptionType: PrescriptionType | null) => {
  if (!prescriptionType) {
    return [];
  }

  switch (prescriptionType) {
    case PrescriptionType.medical:
      return defaultMedicalPriceDetailsHeaders;
    case PrescriptionType.drug:
      return defaultDrugPriceDetailsHeaders;
    case PrescriptionType.material:
      return defaultMaterialPriceDetailsHeaders;
  }
}