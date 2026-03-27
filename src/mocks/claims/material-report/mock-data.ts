import {
  PrepayType,
  SendStatus,
} from "@/app/claims/(enums)/material-report-enums";
import type {
  MaterialReport,
  MaterialSearchItem,
} from "@/types/claims/material-report";

export const MOCK_MEDICAL_INSTITUTION_NUMBER = "ys040203";
export const MOCK_WRITER_NAME = "김청구";
export const MOCK_IS_SAM_PROGRAM_INSTALLED = true;

export const MATERIAL_REPORT_DATE_RANGE_YEARS = 2;

export const MOCK_MATERIAL_SEARCH_ITEMS: MaterialSearchItem[] = [
  {
    id: "material-1",
    userCode: "M1003535",
    claimCode: "M1003535",
    name: "NEUTRACLEAR EXTENSION SET [전규격]",
    specification: "전규격",
    unit: "1EA",
    upperLimitAmount: 697,
    defaultUnitPrice: 697,
  },
  {
    id: "material-2",
    userCode: "M1003535",
    claimCode: "M1003535",
    name: "HY IV REGULATOR [전규격]",
    specification: "전규격",
    unit: "1EA",
    upperLimitAmount: 2620,
    defaultUnitPrice: 2620,
  },
  {
    id: "material-3",
    userCode: "M1003535",
    claimCode: "M1003535",
    name: "(ONE WAY VALVE) OLEFUSION [전규격]",
    specification: "전규격",
    unit: "1EA",
    upperLimitAmount: 2130,
    defaultUnitPrice: 2130,
  },
  {
    id: "material-4",
    userCode: "M1003535",
    claimCode: "M1003535",
    name: "원위제거필터 [전규격]",
    specification: "전규격",
    unit: "1EA",
    upperLimitAmount: 2130,
    defaultUnitPrice: 2130,
  },
  {
    id: "material-5",
    userCode: "M2094158",
    claimCode: "M2094158",
    name: "근준환(CONJURAN) [전규격]",
    specification: "1",
    unit: "1EA",
    upperLimitAmount: 62300,
    defaultUnitPrice: 60000,
  },
  {
    id: "material-6",
    userCode: "M2094158",
    claimCode: "M2094158",
    name: "NEUTRACLEAR EXTENSION [전규격]",
    specification: "1",
    unit: "1EA",
    upperLimitAmount: 697,
    defaultUnitPrice: 600,
  },
];

export const MOCK_REPORTS: MaterialReport[] = [
  {
    id: "report-1",
    createdAt: "2025-08-20",
    applicationNumber: "202508200001",
    writerName: MOCK_WRITER_NAME,
    memo: "선납품목 포함",
    sendStatus: SendStatus.Draft,
    reflectUnitPriceToMaster: true,
    medicalInstitutionNumber: MOCK_MEDICAL_INSTITUTION_NUMBER,
    items: [
      {
        id: "item-1",
        rowNo: 1,
        claimCode: "M2094158",
        name: "근준환(CONJURAN) [전규격]",
        specification: "1",
        unit: "1EA",
        upperLimitAmount: 62300,
        purchaseDate: "2025-01-01",
        purchaseQuantity: 50,
        unitPrice: 60000,
        totalAmount: 3000000,
        prepayType: PrepayType.OverTwoYears,
        vendorName: "PHARMARESEARCH",
        vendorBusinessNumber: "11-2222-333333",
      },
      {
        id: "item-2",
        rowNo: 2,
        claimCode: "M2094158",
        name: "NEUTRACLEAR EXTENSION [전규격]",
        specification: "1",
        unit: "1EA",
        upperLimitAmount: 697,
        purchaseDate: "2025-01-01",
        purchaseQuantity: 1000,
        unitPrice: 600,
        totalAmount: 600000,
        prepayType: PrepayType.Prepay,
        vendorName: "CAIR LGL",
        vendorBusinessNumber: "11-2222-333333",
      },
    ],
  },
  {
    id: "report-2",
    createdAt: "2025-07-01",
    applicationNumber: "202507010001",
    writerName: MOCK_WRITER_NAME,
    memo: "",
    sendStatus: SendStatus.Sent,
    reflectUnitPriceToMaster: true,
    medicalInstitutionNumber: MOCK_MEDICAL_INSTITUTION_NUMBER,
    items: [],
  },
  {
    id: "report-3",
    createdAt: "2024-12-25",
    applicationNumber: "202412250001",
    writerName: MOCK_WRITER_NAME,
    memo: "",
    sendStatus: SendStatus.Sent,
    reflectUnitPriceToMaster: false,
    medicalInstitutionNumber: MOCK_MEDICAL_INSTITUTION_NUMBER,
    items: [],
  },
];

export function getDefaultReportDateRange(): {
  startDate: string;
  endDate: string;
} {
  const now = new Date();
  const startDate = new Date(
    now.getFullYear() - MATERIAL_REPORT_DATE_RANGE_YEARS,
    0,
    1
  );

  return {
    startDate: formatDateInputValue(startDate),
    endDate: formatDateInputValue(now),
  };
}

export function createApplicationNumber(
  date: Date,
  sequence: number
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const sequenceText = String(sequence).padStart(4, "0");

  return `${year}${month}${day}${sequenceText}`;
}

export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
