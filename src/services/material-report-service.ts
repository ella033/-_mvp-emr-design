import { PrepayType, SendStatus } from "@/app/claims/(enums)/material-report-enums";
import { ApiClient } from "@/lib/api/api-client";
import { hospitalsApi, materialReportsApi } from "@/lib/api/api-routes";
import { PrescriptionUserCodeService } from "@/services/master-data/prescription-user-code-service";
import type {
  MaterialReport,
  MaterialReportListItem,
  MaterialReportQueryParams,
  MaterialReportSavePayload,
  MaterialReportSaveResponse,
  MaterialReportSendResponse,
  MaterialReportTransmitPayload,
  MaterialSearchItem,
} from "@/types/claims/material-report";
import type { PrescriptionUserCodeType } from "@/types/master-data/prescription-user-codes/prescription-user-code-type";

const SAM_NOT_INSTALLED_ERROR = "SAM_NOT_INSTALLED";

type MaterialReportListResponse = {
  success: boolean;
  data: MaterialReportSummaryDto[];
};

type MaterialReportDetailResponse = {
  success: boolean;
  data: MaterialReportDetailDto;
};

type MaterialReportSaveApiResponse = {
  success: boolean;
  data: MaterialReportSummaryDto;
  claimApiErrorCount?: number;
  claimApiErrors?: string[];
  message?: string;
};

type MaterialReportTransmitResponse = {
  success: boolean;
  data: MaterialReportSummaryDto;
  message?: string;
};

type NextApplicationNumberResponse = {
  success: boolean;
  data?: {
    applicationNumber?: string;
  };
};

type MaterialReportSummaryDto = {
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

type MaterialReportItemDto = {
  lineNumber: number;
  prescriptionUserCodeId?: number;
  noticeType?: string;
  code: string;
  productName: string;
  manufacturer?: string;
  importer?: string;
  specification: string;
  unit: string;
  supplierBizNumber: string;
  supplierName: string;
  prepayType: string;
  purchaseDate: string;
  purchaseQuantity: number;
  purchasePrice: number;
  unitPrice: number;
  upperLimitAmount?: number;
};

type MaterialReportDetailDto = MaterialReportSummaryDto & {
  reportItems?: MaterialReportItemDto[] | null;
};

type ClaimSettingsResponse = {
  claimManagerName?: string;
};

type HospitalSummaryResponse = {
  number?: string;
};

export class MaterialReportService {
  static async getNextApplicationNumber(): Promise<string> {
    try {
      const response = await ApiClient.get<NextApplicationNumberResponse>(
        materialReportsApi.nextApplicationNumber()
      );
      return response?.data?.applicationNumber ?? "";
    } catch {
      return "";
    }
  }

  static async getDefaultWriterName(hospitalId: number): Promise<string> {
    if (!hospitalId) return "";
    try {
      const response = await ApiClient.get<ClaimSettingsResponse>(`/claim-settings/${hospitalId}`);
      return (response?.claimManagerName ?? "").trim();
    } catch {
      return "";
    }
  }

  static async getDefaultMedicalInstitutionNumber(hospitalId: number): Promise<string> {
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

  static async getReports(params: MaterialReportQueryParams): Promise<MaterialReportListItem[]> {
    try {
      const response = await ApiClient.get<MaterialReportListResponse>(materialReportsApi.list(), {
        from: params.startDate,
        to: params.endDate,
      });
      return (response?.data ?? []).map((report) => toListItem(report));
    } catch (error) {
      throw mapApiError(error, "목록 조회에 실패했습니다.");
    }
  }

  static async getReportById(id: string): Promise<MaterialReport | null> {
    try {
      const response = await ApiClient.get<MaterialReportDetailResponse>(
        materialReportsApi.detail(id)
      );
      if (!response?.data) return null;
      return toMaterialReport(response.data);
    } catch (error) {
      throw mapApiError(error, "상세 조회에 실패했습니다.");
    }
  }

  static async saveReport(payload: MaterialReportSavePayload): Promise<MaterialReportSaveResponse> {
    try {
      const response = await ApiClient.post<MaterialReportSaveApiResponse>(
        materialReportsApi.save(),
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

  static async sendReport(
    payload: MaterialReportTransmitPayload
  ): Promise<MaterialReportSendResponse> {
    try {
      const response = await ApiClient.post<MaterialReportTransmitResponse>(
        materialReportsApi.transmit(payload.id),
        {
          reflectUnitPriceToMaster: payload.reflectUnitPriceToMaster,
          prescriptionUserCodeIds: payload.prescriptionUserCodeIds,
        }
      );
      return {
        id: payload.id,
        sendStatus: toSendStatus(response?.data?.transmissionStatus),
      };
    } catch (error) {
      throw mapApiError(error, "송신에 실패했습니다.");
    }
  }

  static async searchMaterials(query: string): Promise<MaterialSearchItem[]> {
    const trimmedKeyword = query.trim();
    if (!trimmedKeyword) return [];

    try {
      const response = await PrescriptionUserCodeService.getPrescriptionUserCodes({
        type: 3,
        codeType: 8,
        isActive: "true",
        keyword: trimmedKeyword,
      });
      const responseItems = getPrescriptionUserCodeItems(response);

      return responseItems
        .filter((item) => item.itemType !== "W02")
        .map((item) => toMaterialSearchItem(item));
    } catch (error) {
      throw mapApiError(error, "치료재료 검색에 실패했습니다.");
    }
  }
}

export const MaterialReportServiceErrors = {
  SAM_NOT_INSTALLED: SAM_NOT_INSTALLED_ERROR,
};

function toListItem(report: MaterialReportSummaryDto): MaterialReportListItem {
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

function toMaterialReport(report: MaterialReportDetailDto): MaterialReport {
  const reportItems = Array.isArray(report.reportItems) ? report.reportItems : [];
  return {
    id: report.id,
    createdAt: toDateString(report.writtenAt || report.createdAt),
    applicationNumber: report.applicationNumber ?? "",
    writerName: report.writerName ?? "",
    memo: report.memo ?? "",
    sendStatus: toSendStatus(report.transmissionStatus),
    reflectUnitPriceToMaster: true,
    medicalInstitutionNumber: report.medicalInstitutionCode ?? "",
    items: reportItems.map((item, index) => toMaterialReportItem(item, index)),
    claimApiErrorCount: Number(report.claimApiErrorCount ?? 0),
    claimApiErrors: report.claimApiErrors ?? [],
  };
}

function toMaterialReportItem(item: MaterialReportItemDto, index: number) {
  const rowNo = Number(item.lineNumber ?? index + 1) || index + 1;
  const itemId = `material-item-${rowNo}-${index}`;
  const purchaseQuantity = Number(item.purchaseQuantity ?? 0);
  const unitPrice = Number(item.unitPrice ?? 0);
  const totalAmount = Number(item.purchasePrice ?? 0) || purchaseQuantity * unitPrice;
  const upperLimitAmount = Number(item.upperLimitAmount ?? 0);

  return {
    id: itemId,
    prescriptionUserCodeId: Number(item.prescriptionUserCodeId ?? 0) || undefined,
    rowNo,
    claimCode: item.code ?? "",
    name: item.productName ?? "",
    specification: item.specification ?? "",
    unit: item.unit ?? "",
    manufacturer: item.manufacturer ?? "",
    importer: item.importer ?? "",
    upperLimitAmount,
    purchaseDate: item.purchaseDate ?? "",
    purchaseQuantity,
    unitPrice,
    totalAmount,
    prepayType: toPrepayType(item.prepayType),
    vendorName: item.supplierName ?? "",
    vendorBusinessNumber: item.supplierBizNumber ?? "",
  };
}

function toSaveRequest(payload: MaterialReportSavePayload): {
  id?: string;
  writerName?: string;
  memo?: string;
  items: MaterialReportItemDto[];
} {
  return {
    id: payload.id,
    writerName: payload.writerName,
    memo: payload.memo,
    items: payload.items.map((item, index) => ({
      lineNumber: index + 1,
      prescriptionUserCodeId: Number(item.prescriptionUserCodeId ?? 0) || undefined,
      noticeType: "A",
      code: item.claimCode,
      productName: item.name,
      manufacturer: item.manufacturer ?? "",
      importer: item.importer ?? "",
      specification: item.specification,
      unit: item.unit,
      supplierBizNumber: item.vendorBusinessNumber,
      supplierName: item.vendorName,
      prepayType: toPrepayCode(item.prepayType),
      purchaseDate: item.purchaseDate,
      purchaseQuantity: Number(item.purchaseQuantity || 0),
      purchasePrice: Number(item.totalAmount || 0),
      unitPrice: Number(item.unitPrice || 0),
      upperLimitAmount: Number(item.upperLimitAmount || 0),
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

function toPrepayCode(prepayType: PrepayType): string {
  if (prepayType === PrepayType.OverTwoYears) return "2";
  if (prepayType === PrepayType.Prepay) return "B";
  return "B";
}

function toPrepayType(prepayCode: string): PrepayType {
  if (prepayCode === "2") return PrepayType.OverTwoYears;
  if (prepayCode === "B") return PrepayType.Prepay;
  return PrepayType.None;
}

function toMaterialSearchItem(prescriptionUserCode: PrescriptionUserCodeType): MaterialSearchItem {
  const baseUnitPrice = Number(prescriptionUserCode.details?.[0]?.normalPrice ?? 0);
  const claimCode =
    prescriptionUserCode.library?.details?.[0]?.claimCode ??
    (prescriptionUserCode as any).claimCode ??
    "";
  const materialUserCode = prescriptionUserCode.materialUserCode;
  const materialLibrary = prescriptionUserCode.library?.materialLibrary;
  const specification =
    materialUserCode?.specification ??
    materialLibrary?.specification ??
    "";
  const unit = materialUserCode?.unit ?? materialLibrary?.unit ?? "";
  const manufacturer =
    materialUserCode?.manufacturerName ??
    materialLibrary?.manufacturerName ??
    "";
  const importer =
    materialUserCode?.importCompany ??
    materialLibrary?.importCompany ??
    "";

  return {
    id: String(prescriptionUserCode.id),
    userCode: prescriptionUserCode.code ?? "",
    claimCode,
    name: prescriptionUserCode.name ?? "",
    specification,
    unit,
    manufacturer,
    importer,
    upperLimitAmount: baseUnitPrice,
    defaultUnitPrice: baseUnitPrice,
  };
}

function getPrescriptionUserCodeItems(response: unknown): PrescriptionUserCodeType[] {
  if (!response || typeof response !== "object") {
    return [];
  }

  const directItems = (response as { items?: unknown }).items;
  if (Array.isArray(directItems)) {
    return directItems as PrescriptionUserCodeType[];
  }

  const wrappedItems = (response as { data?: { items?: unknown } }).data?.items;
  if (Array.isArray(wrappedItems)) {
    return wrappedItems as PrescriptionUserCodeType[];
  }

  return [];
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
