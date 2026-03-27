import type { PrepayType, SendStatus } from "@/app/claims/(enums)/material-report-enums";

export type MaterialSearchItem = {
  id: string;
  userCode: string;
  claimCode: string;
  name: string;
  specification: string;
  unit: string;
  manufacturer?: string;
  importer?: string;
  upperLimitAmount: number;
  defaultUnitPrice: number;
};

export type MaterialReportItem = {
  id: string;
  prescriptionUserCodeId?: number;
  rowNo: number;
  claimCode: string;
  name: string;
  specification: string;
  unit: string;
  manufacturer?: string;
  importer?: string;
  upperLimitAmount: number;
  purchaseDate: string;
  purchaseQuantity: number;
  unitPrice: number;
  totalAmount: number;
  prepayType: PrepayType;
  vendorName: string;
  vendorBusinessNumber: string;
};

export type MaterialReport = {
  id: string;
  createdAt: string;
  applicationNumber: string;
  writerName: string;
  memo: string;
  sendStatus: SendStatus;
  reflectUnitPriceToMaster: boolean;
  medicalInstitutionNumber: string;
  items: MaterialReportItem[];
  claimApiErrorCount?: number;
  claimApiErrors?: string[];
};

export type MaterialReportListItem = {
  id: string;
  createdAt: string;
  applicationNumber: string;
  itemCount: number;
  sendStatus: SendStatus;
  memo: string;
  claimApiErrorCount?: number;
  claimApiErrors?: string[];
};

export type MaterialReportQueryParams = {
  startDate: string;
  endDate: string;
};

export type MaterialReportSavePayload = Omit<
  MaterialReport,
  "createdAt" | "sendStatus"
> & {
  id?: string;
};

export type MaterialReportSaveResponse = MaterialReport & {
  claimApiErrorCount?: number;
  claimApiErrors?: string[];
  isClaimApiValid?: boolean;
  saveMessage?: string;
};

export type MaterialReportItemField =
  | "purchaseDate"
  | "purchaseQuantity"
  | "unitPrice"
  | "prepayType"
  | "vendorName"
  | "vendorBusinessNumber";

export type MaterialReportSendResponse = {
  id: string;
  sendStatus: SendStatus;
};

export type MaterialReportTransmitPayload = {
  id: string;
  reflectUnitPriceToMaster: boolean;
  prescriptionUserCodeIds: number[];
};
