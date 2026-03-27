import { SendStatus } from "@/app/claims/(enums)/material-report-enums";
import {
  PreparationType,
  AdministrationRoute,
  CodeCategory,
} from "@/app/claims/(enums)/preparation-report-enums";
import type {
  PreparationReport,
  UsedMedicine,
} from "@/types/claims/preparation-report";

export const MOCK_MEDICAL_INSTITUTION_NUMBER = "ys040203";
export const MOCK_WRITER_NAME = "김청구";
export const MOCK_IS_SAM_PROGRAM_INSTALLED = true;

export const PREPARATION_REPORT_DATE_RANGE_YEARS = 2;

const MOCK_USED_MEDICINES: UsedMedicine[] = [
  {
    id: "med-1",
    code: "M2094158",
    name: "근준환(CONJURAN)",
    codeCategory: CodeCategory.InsuredDrug,
    specification: "1",
    unit: "1EA",
    manufacturer: "제조사A",
    purchaseDate: "2025-01-01",
    vendor: "구입처A",
    vendorBusinessNumber: "123-45-67890",
    unitPrice: 60000,
    quantity: 1,
    quantityUnit: "정",
    quantityPrice: 60000,
  },
];

export const MOCK_REPORTS: PreparationReport[] = [
  {
    id: "prep-report-1",
    createdAt: "2025-08-20",
    applicationNumber: "202508200001",
    writerName: MOCK_WRITER_NAME,
    memo: "선납품목 포함",
    sendStatus: SendStatus.Draft,
    medicalInstitutionNumber: MOCK_MEDICAL_INSTITUTION_NUMBER,
    items: [
      {
        id: "prep-item-1",
        rowNo: 1,
        preparationType: PreparationType.Preparation,
        administrationRoute: AdministrationRoute.OralMedicine,
        code: "M2094158",
        name: "4비드제제(비타민제)",
        specification: "1",
        unit: "정",
        claimPrice: 7200,
        priceAppliedDate: "2025-01-01",
        reportDate: "2025-01-01",
        mainEfficacyGroup: "비타민 종합제 혼합비...",
        usageMethod: "1회 1정 매식후 30분전 경구투여디...",
        efficacy: "이 약물 제조엔 인공(약디...",
        usedMedicines: [...MOCK_USED_MEDICINES],
      },
    ],
  },
  {
    id: "prep-report-2",
    createdAt: "2025-07-01",
    applicationNumber: "202507010001",
    writerName: MOCK_WRITER_NAME,
    memo: "",
    sendStatus: SendStatus.Sent,
    medicalInstitutionNumber: MOCK_MEDICAL_INSTITUTION_NUMBER,
    items: [
      {
        id: "prep-item-2",
        rowNo: 1,
        preparationType: PreparationType.Manufacture,
        administrationRoute: AdministrationRoute.ExternalMedicine,
        code: "12345670",
        name: "외용제제약품A",
        specification: "1",
        unit: "개",
        claimPrice: 3500,
        priceAppliedDate: "2025-05-01",
        reportDate: "2025-05-01",
        mainEfficacyGroup: "항생물질제제",
        usageMethod: "1일 2회 환부도포",
        efficacy: "피부감염증",
        usedMedicines: [],
      },
    ],
  },
  {
    id: "prep-report-3",
    createdAt: "2024-12-25",
    applicationNumber: "202412250001",
    writerName: MOCK_WRITER_NAME,
    memo: "",
    sendStatus: SendStatus.Sent,
    medicalInstitutionNumber: MOCK_MEDICAL_INSTITUTION_NUMBER,
    items: [],
  },
  {
    id: "prep-report-4",
    createdAt: "2024-12-25",
    applicationNumber: "202412250002",
    writerName: MOCK_WRITER_NAME,
    memo: "",
    sendStatus: SendStatus.Sent,
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
    now.getFullYear() - PREPARATION_REPORT_DATE_RANGE_YEARS,
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
