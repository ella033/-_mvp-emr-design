import {
  AdministrationRoute,
  CodeCategory,
  PreparationType,
} from "@/app/claims/(enums)/preparation-report-enums";
import { SendStatus } from "@/app/claims/(enums)/material-report-enums";
import { ApiClient } from "@/lib/api/api-client";
import { hospitalsApi, mixtureReportsApi } from "@/lib/api/api-routes";
import type {
  PreparationReport,
  PreparationReportItem,
  PreparationReportListItem,
  PreparationReportQueryParams,
  PreparationReportSavePayload,
  PreparationReportSaveResponse,
  PreparationReportSendResponse,
  UsedMedicine,
} from "@/types/claims/preparation-report";

const SAM_NOT_INSTALLED_ERROR = "SAM_NOT_INSTALLED";

type MixtureReportListResponse = {
  success: boolean;
  data: MixtureReportSummaryDto[];
};

type NextApplicationNumberResponse = {
  success: boolean;
  data?: {
    applicationNumber?: string;
  };
};

type MixtureReportDetailResponse = {
  success: boolean;
  data: MixtureReportDetailDto;
};

type MixtureReportSaveResponse = {
  success: boolean;
  data: MixtureReportSummaryDto;
  claimApiErrorCount?: number;
  claimApiErrors?: string[];
  message?: string;
};

type MixtureReportTransmitResponse = {
  success: boolean;
  data: MixtureReportSummaryDto;
  message?: string;
};

type MixtureReportSummaryDto = {
  id: string;
  applicationNumber: string;
  writerName: string;
  writtenAt: string | Date;
  memo: string | null;
  itemCount: number;
  transmissionStatus: string;
  medicalInstitutionCode: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  claimApiErrorCount?: number;
  claimApiErrors?: string[];
};

type MixtureReportDetailDto = MixtureReportSummaryDto & {
  reportItems?: MixtureReportItemDto[] | null;
};

type MixtureReportItemDto = {
  lineNumber: number;
  mixtureType: number;
  administrationType: number;
  majorEfficacyGroup: string;
  code: string;
  productName: string;
  reportDate: string;
  claimPrice: number;
  specification: string;
  unit: string;
  priceEffectiveDate: string;
  efficacy?: string;
  dosage?: string;
  usedDrugs?: MixtureUsedDrugDto[];
};

type MixtureUsedDrugDto = {
  supplierBizNumber: string;
  supplierName: string;
  codeType: number;
  drugCode: string;
  drugName: string;
  specification: string;
  unit: string;
  manufacturer?: string;
  purchaseDate: string;
  unitPrice: number;
  quantity: number;
  quantityUnit: string;
  quantityPrice: number;
};

type ClaimSettingsResponse = {
  claimManagerName?: string;
};

type HospitalSummaryResponse = {
  number?: string;
};

export class PreparationReportService {
  static async getNextApplicationNumber(): Promise<string> {
    try {
      const response = await ApiClient.get<NextApplicationNumberResponse>(
        mixtureReportsApi.nextApplicationNumber()
      );
      return response?.data?.applicationNumber ?? "";
    } catch {
      return "";
    }
  }

  static async getDefaultWriterName(hospitalId: number): Promise<string> {
    if (!hospitalId) return "";

    try {
      const response = await ApiClient.get<ClaimSettingsResponse>(
        `/claim-settings/${hospitalId}`
      );
      return (response?.claimManagerName ?? "").trim();
    } catch {
      return "";
    }
  }

  static async getDefaultMedicalInstitutionNumber(
    hospitalId: number
  ): Promise<string> {
    if (!hospitalId) return "";

    try {
      const response = await ApiClient.get<HospitalSummaryResponse>(
        hospitalsApi.detail(String(hospitalId))
      );
      return (response?.number ?? "").trim();
    } catch {
      return "";
    }
  }

  static async getReports(
    params: PreparationReportQueryParams
  ): Promise<PreparationReportListItem[]> {
    try {
      const response = await ApiClient.get<MixtureReportListResponse>(
        mixtureReportsApi.list(),
        {
          from: params.startDate,
          to: params.endDate,
        }
      );

      return (response.data ?? []).map((report) => toListItem(report));
    } catch (error) {
      throw mapApiError(error, "목록 조회에 실패했습니다.");
    }
  }

  static async getReportById(id: string): Promise<PreparationReport | null> {
    try {
      const response = await ApiClient.get<MixtureReportDetailResponse>(
        mixtureReportsApi.detail(id)
      );
      if (!response?.data) return null;
      return toPreparationReport(response.data);
    } catch (error) {
      throw mapApiError(error, "상세 조회에 실패했습니다.");
    }
  }

  static async saveReport(
    payload: PreparationReportSavePayload
  ): Promise<PreparationReportSaveResponse> {
    try {
      const response = await ApiClient.post<MixtureReportSaveResponse>(
        mixtureReportsApi.save(),
        toSaveRequest(payload)
      );
      const savedId = response?.data?.id;
      if (!savedId) {
        throw new Error("저장 결과에 ID가 없습니다.");
      }

      const savedDetail = await this.getReportById(savedId);
      if (!savedDetail) {
        throw new Error("저장 후 상세 조회에 실패했습니다.");
      }
      return {
        ...savedDetail,
        claimApiErrorCount: Number(response?.claimApiErrorCount ?? 0),
        claimApiErrors: response?.claimApiErrors ?? [],
        isClaimApiValid: Boolean(response?.success),
        saveMessage: response?.message,
      };
    } catch (error) {
      throw mapApiError(error, "저장에 실패했습니다.");
    }
  }

  static async sendReport(id: string): Promise<PreparationReportSendResponse> {
    try {
      const response = await ApiClient.post<MixtureReportTransmitResponse>(
        mixtureReportsApi.transmit(id),
        {}
      );
      return {
        id,
        sendStatus: toSendStatus(response?.data?.transmissionStatus),
      };
    } catch (error) {
      throw mapApiError(error, "송신에 실패했습니다.");
    }
  }
}

export const PreparationReportServiceErrors = {
  SAM_NOT_INSTALLED: SAM_NOT_INSTALLED_ERROR,
};

function toListItem(report: MixtureReportSummaryDto): PreparationReportListItem {
  return {
    id: report.id,
    createdAt: toDateString(report.writtenAt || report.createdAt),
    applicationNumber: report.applicationNumber ?? "",
    itemCount: Number(report.itemCount ?? 0),
    sendStatus: toSendStatus(report.transmissionStatus),
    memo: report.memo ?? "",
    claimApiErrorCount: Number(report.claimApiErrorCount ?? 0),
    claimApiErrors: report.claimApiErrors ?? [],
  };
}

function toPreparationReport(report: MixtureReportDetailDto): PreparationReport {
  const reportItems = Array.isArray(report.reportItems) ? report.reportItems : [];

  return {
    id: report.id,
    createdAt: toDateString(report.writtenAt || report.createdAt),
    applicationNumber: report.applicationNumber ?? "",
    writerName: report.writerName ?? "",
    memo: report.memo ?? "",
    sendStatus: toSendStatus(report.transmissionStatus),
    medicalInstitutionNumber: report.medicalInstitutionCode ?? "",
    items: reportItems.map((item, index) => toPreparationReportItem(item, index)),
    claimApiErrorCount: Number(report.claimApiErrorCount ?? 0),
    claimApiErrors: report.claimApiErrors ?? [],
  };
}

function toPreparationReportItem(
  item: MixtureReportItemDto,
  index: number
): PreparationReportItem {
  const usedDrugs = Array.isArray(item.usedDrugs) ? item.usedDrugs : [];
  const rowNo = Number(item.lineNumber ?? index + 1) || index + 1;
  const itemId = `prep-item-${rowNo}-${index}`;

  return {
    id: itemId,
    rowNo,
    preparationType: toPreparationType(item.mixtureType),
    administrationRoute: toAdministrationRoute(item.administrationType),
    code: item.code ?? "",
    name: item.productName ?? "",
    specification: item.specification ?? "",
    unit: item.unit ?? "",
    claimPrice: Number(item.claimPrice ?? 0),
    priceAppliedDate: item.priceEffectiveDate ?? "",
    reportDate: item.reportDate ?? "",
    mainEfficacyGroup: item.majorEfficacyGroup ?? "",
    usageMethod: item.dosage ?? "",
    efficacy: item.efficacy ?? "",
    usedMedicines: usedDrugs.map((drug, usedDrugIndex) =>
      toUsedMedicine(drug, itemId, usedDrugIndex)
    ),
  };
}

function toUsedMedicine(
  drug: MixtureUsedDrugDto,
  itemId: string,
  usedDrugIndex: number
): UsedMedicine {
  return {
    id: `${itemId}-med-${usedDrugIndex + 1}`,
    code: drug.drugCode ?? "",
    name: drug.drugName ?? "",
    codeCategory: toCodeCategory(drug.codeType),
    specification: drug.specification ?? "",
    unit: drug.unit ?? "",
    manufacturer: drug.manufacturer ?? "",
    purchaseDate: drug.purchaseDate ?? "",
    vendor: drug.supplierName ?? "",
    vendorBusinessNumber: drug.supplierBizNumber ?? "",
    unitPrice: Number(drug.unitPrice ?? 0),
    quantity: Number(drug.quantity ?? 0),
    quantityUnit: drug.quantityUnit ?? "",
    quantityPrice: Number(drug.quantityPrice ?? 0),
  };
}

function toSaveRequest(payload: PreparationReportSavePayload): {
  id?: string;
  writerName?: string;
  memo?: string;
  items: MixtureReportItemDto[];
} {
  return {
    id: payload.id,
    writerName: payload.writerName,
    memo: payload.memo,
    items: payload.items.map((item, index) => ({
      lineNumber: index + 1,
      mixtureType: toMixtureType(item.preparationType),
      administrationType: toAdministrationType(item.administrationRoute),
      majorEfficacyGroup: item.mainEfficacyGroup,
      code: item.code,
      productName: item.name,
      reportDate: item.reportDate,
      claimPrice: Number(item.claimPrice || 0),
      specification: item.specification,
      unit: item.unit,
      priceEffectiveDate: item.priceAppliedDate,
      efficacy: item.efficacy,
      dosage: item.usageMethod,
      usedDrugs: item.usedMedicines.map((medicine) => ({
        supplierBizNumber: medicine.vendorBusinessNumber,
        supplierName: medicine.vendor,
        codeType: toCodeType(medicine.codeCategory),
        drugCode: medicine.code,
        drugName: medicine.name,
        specification: medicine.specification,
        unit: medicine.unit,
        manufacturer: medicine.manufacturer,
        purchaseDate: medicine.purchaseDate,
        unitPrice: Number(medicine.unitPrice || 0),
        quantity: Number(medicine.quantity || 0),
        quantityUnit: medicine.quantityUnit,
        quantityPrice: Number(medicine.quantityPrice || 0),
      })),
    })),
  };
}

function toDateString(value: string | Date | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toSendStatus(transmissionStatus?: string): SendStatus {
  if (transmissionStatus === "COMPLETED") {
    return SendStatus.Sent;
  }
  return SendStatus.Draft;
}

function toPreparationType(mixtureType: number): PreparationType {
  if (mixtureType === 2) {
    return PreparationType.Manufacture;
  }
  return PreparationType.Preparation;
}

function toMixtureType(preparationType: PreparationType): number {
  if (preparationType === PreparationType.Manufacture) {
    return 2;
  }
  return 1;
}

function toAdministrationRoute(administrationType: number): AdministrationRoute {
  if (administrationType === 2) {
    return AdministrationRoute.Injection;
  }
  if (administrationType === 3) {
    return AdministrationRoute.ExternalMedicine;
  }
  return AdministrationRoute.OralMedicine;
}

function toAdministrationType(
  administrationRoute: AdministrationRoute
): number {
  if (administrationRoute === AdministrationRoute.Injection) {
    return 2;
  }
  if (administrationRoute === AdministrationRoute.ExternalMedicine) {
    return 3;
  }
  return 1;
}

function toCodeCategory(codeType: number): CodeCategory {
  if (codeType === 4) {
    return CodeCategory.SelfPreparation;
  }
  return CodeCategory.InsuredDrug;
}

function toCodeType(codeCategory: CodeCategory): number {
  if (codeCategory === CodeCategory.SelfPreparation) {
    return 4;
  }
  return 3;
}

function mapApiError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    const normalizedMessage = error.message.toLowerCase();
    const isSamError =
      normalizedMessage.includes("sam") ||
      normalizedMessage.includes("청구프로그램") ||
      normalizedMessage.includes("설치");

    if (isSamError) {
      return new Error(SAM_NOT_INSTALLED_ERROR);
    }

    return new Error(error.message || fallbackMessage);
  }

  return new Error(fallbackMessage);
}
