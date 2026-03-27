import type { SendStatus } from "@/app/claims/(enums)/material-report-enums";
import type {
  PreparationType,
  AdministrationRoute,
  CodeCategory,
} from "@/app/claims/(enums)/preparation-report-enums";

export type UsedMedicine = {
  id: string;
  code: string;
  name: string;
  codeCategory: CodeCategory;
  specification: string;
  unit: string;
  manufacturer: string;
  purchaseDate: string;
  vendor: string;
  vendorBusinessNumber: string;
  unitPrice: number;
  quantity: number;
  quantityUnit: string;
  quantityPrice: number;
};

export type PreparationReportItem = {
  id: string;
  rowNo: number;
  preparationType: PreparationType;
  administrationRoute: AdministrationRoute;
  code: string;
  name: string;
  specification: string;
  unit: string;
  claimPrice: number;
  priceAppliedDate: string;
  reportDate: string;
  mainEfficacyGroup: string;
  usageMethod: string;
  efficacy: string;
  usedMedicines: UsedMedicine[];
};

export type PreparationReport = {
  id: string;
  createdAt: string;
  applicationNumber: string;
  writerName: string;
  memo: string;
  sendStatus: SendStatus;
  medicalInstitutionNumber: string;
  items: PreparationReportItem[];
  claimApiErrorCount?: number;
  claimApiErrors?: string[];
};

export type PreparationReportListItem = {
  id: string;
  createdAt: string;
  applicationNumber: string;
  itemCount: number;
  sendStatus: SendStatus;
  memo: string;
  claimApiErrorCount?: number;
  claimApiErrors?: string[];
};

export type PreparationReportQueryParams = {
  startDate: string;
  endDate: string;
};

export type PreparationReportSavePayload = Omit<
  PreparationReport,
  "createdAt" | "sendStatus"
> & {
  id?: string;
};

export type PreparationReportSaveResponse = PreparationReport & {
  claimApiErrorCount?: number;
  claimApiErrors?: string[];
  isClaimApiValid?: boolean;
  saveMessage?: string;
};

export type PreparationReportSendResponse = {
  id: string;
  sendStatus: SendStatus;
};

export type PreparationReportItemField =
  | "preparationType"
  | "administrationRoute"
  | "code"
  | "name"
  | "claimPrice"
  | "priceAppliedDate"
  | "reportDate";
