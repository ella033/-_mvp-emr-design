import { ApiClient } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-proxy";
import { printersApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  Printer,
  CreatePrinterRequest,
  CreatePrinterResponse,
  UpdatePrinterRequest,
  UpdatePrinterResponse,
  DeletePrinterResponse,
  SyncPrintersRequest,
  SyncPrintersResponse,
  PrinterRecord,
} from "@/types/printer-types";
import type {
  PrinterSettingsResponse,
  PrinterSettingItemDto,
  UpdatePrinterDefaultsResponse,
  PrinterWorkstationOverrideRecord,
  CreatePrinterWorkstationOverrideDto,
  UpdatePrinterWorkstationOverrideDto,
  DeletePrinterWorkstationOverrideResponse,
} from "@/types/printer-settings";

export class PrintersService {
  static async getPrintersByHospital(hospitalId: number): Promise<PrinterRecord[]> {
    const validatedId = validateId(hospitalId, "Hospital ID");
    try {
      return await ApiClient.get<PrinterRecord[]>(
        printersApi.listByHospital(validatedId)
      );
    } catch (error: any) {
      throw new Error("프린터 목록 조회 실패", error.status);
    }
  }

  // 기본 프린터 목록 조회 (특정 병원에 연결된 경우)
  static async getPrinters(params?: { availableOnly?: boolean; includeAgents?: boolean }): Promise<PrinterRecord[]> {
    try {
      const url = params ? `${printersApi.list}?availableOnly=${!!params.availableOnly}&includeAgents=${!!params.includeAgents}` : printersApi.list;
      return await ApiClient.get<PrinterRecord[]>(url);
    } catch (error: any) {
      throw new Error("프린터 목록 조회 실패", error.status);
    }
  }

  // id 없이 기본 프린터 목록을 조회하는 경우 에이전트가 사용 가능한 경우
  static async getPrinter(): Promise<Printer> {
    try {
      return await ApiClient.get<Printer>(`${printersApi.detail("me")}`);
    } catch (error: any) {
      throw new Error("프린터 조회 실패", error.status);
    }
  }

  static async createPrinter(
    data: CreatePrinterRequest
  ): Promise<CreatePrinterResponse> {
    try {
      return await ApiClient.post<CreatePrinterResponse>(
        printersApi.create,
        data
      );
    } catch (error: any) {
      throw new Error("프린터 생성 실패", error.status);
    }
  }

  static async updatePrinter(
    id: number,
    data: UpdatePrinterRequest
  ): Promise<UpdatePrinterResponse> {
    const validatedId = validateId(id, "Printer ID");
    try {
      return await ApiClient.put<UpdatePrinterResponse>(
        printersApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("프린터 수정 실패", error.status);
    }
  }

  // displayName 업데이트 (에이전트가 변경한 경우 가능)
  static async updatePrinterDisplayName(printerId: string, displayName: string): Promise<void> {
    try {
      await ApiClient.post(printersApi.updateDisplayName(printerId), { displayName });
    } catch (error: any) {
      throw new Error("프린터 별명 업데이트 실패", error.status);
    }
  }

  static async deletePrinter(id: number): Promise<DeletePrinterResponse> {
    const validatedId = validateId(id, "Printer ID");
    try {
      return await ApiClient.delete<DeletePrinterResponse>(
        printersApi.delete(validatedId)
      );
    } catch (error: any) {
      throw new Error("프린터 삭제 실패", error.status);
    }
  }

  // string id로 삭제 (PrinterRecord.id가 string인 경우)
  static async deletePrinterById(printerId: string): Promise<void> {
    try {
      await ApiClient.delete(printersApi.delete(printerId));
    } catch (error: any) {
      throw new Error("프린터 삭제 실패", error.status);
    }
  }

  // Windows에서 스캔된 프린터 목록을 동기화하는 경우
  static async syncPrinters(data: SyncPrintersRequest): Promise<SyncPrintersResponse> {
    try {
      return await ApiClient.post<SyncPrintersResponse>(printersApi.sync, data);
    } catch (error: any) {
      throw new Error("프린터 동기화 실패", error.status);
    }
  }

  // 동기화 요청 (모든 에이전트에서 스캔 가능)
  static async triggerRefresh(): Promise<import("@/types/printer-types").RefreshPrintersAcceptedResponse> {
    try {
      return await ApiClient.post(printersApi.refresh, {});
    } catch (error: any) {
      throw new Error("프린터 새로고침 요청 실패", error.status);
    }
  }

  // 새로고침 상태 조회 (로딩 중일 경우 대기)
  static async getRefreshStatus(operationId: string): Promise<import("@/types/printer-types").RefreshPrintersStatusResponse> {
    try {
      return await ApiClient.get(printersApi.refreshStatus(operationId));
    } catch (error: any) {
      throw new Error("프린터 새로고침 상태 조회 실패", error.status);
    }
  }

  // v2: 테스트 프린터 출력물 생성 (에이전트가 생성 가능 및 Kafka 전송)
  static async createTestJob(printerId: string, payload: {
    message?: string;
    copies?: number;
    options?: Record<string, any>;
    targetAgentId?: string;
  }): Promise<{ id: string }> {
    try {
      return await ApiClient.post(printersApi.test(printerId), payload);
    } catch (error: any) {
      if (error instanceof ApiError) {
        const userMessage = PrintersService.PRINT_ERROR_MESSAGES[error.message]
          ?? `테스트 출력 실패: ${error.message}`;
        throw new ApiError(userMessage, error.status, error.code, error.data);
      }
      throw error;
    }
  }
  static async getPrinterSettings(): Promise<PrinterSettingsResponse> {
    try {
      return await ApiClient.get<PrinterSettingsResponse>(printersApi.settings);
    } catch (error: any) {
      throw new Error("Failed to load printer settings", error.status);
    }
  }

  static async updatePrinterDefaults(
    items: PrinterSettingItemDto[]
  ): Promise<UpdatePrinterDefaultsResponse> {
    try {
      return await ApiClient.put<UpdatePrinterDefaultsResponse>(
        printersApi.settingsDefaults,
        { items }
      );
    } catch (error: any) {
      throw new Error("Failed to update printer defaults", error.status);
    }
  }

  static async createPrinterOverride(
    payload: CreatePrinterWorkstationOverrideDto
  ): Promise<PrinterWorkstationOverrideRecord> {
    try {
      return await ApiClient.post<PrinterWorkstationOverrideRecord>(
        printersApi.settingsOverrides,
        payload
      );
    } catch (error: any) {
      throw new Error("Failed to create printer override", error.status);
    }
  }

  static async updatePrinterOverride(
    overrideId: string,
    payload: UpdatePrinterWorkstationOverrideDto
  ): Promise<PrinterWorkstationOverrideRecord> {
    try {
      return await ApiClient.put<PrinterWorkstationOverrideRecord>(
        printersApi.settingsOverride(overrideId),
        payload
      );
    } catch (error: any) {
      throw new Error("Failed to update printer override", error.status);
    }
  }

  static async deletePrinterOverride(
    overrideId: string
  ): Promise<DeletePrinterWorkstationOverrideResponse> {
    try {
      return await ApiClient.delete<DeletePrinterWorkstationOverrideResponse>(
        printersApi.settingsOverride(overrideId)
      );
    } catch (error: any) {
      throw new Error("Failed to delete printer override", error.status);
    }
  }

  static async getAgents(): Promise<Array<{
    id: string;
    pcName: string;
    status: string;
    lastSeenAt: string;
    printerCount: number;
  }>> {
    try {
      return await ApiClient.get<Array<{
        id: string;
        pcName: string;
        status: string;
        lastSeenAt: string;
        printerCount: number;
      }>>("/agents");
    } catch (error: any) {
      throw new Error("PC 목록 조회 실패", error.status);
    }
  }

  static async getAgentDevices(agentId: string): Promise<{
    printers: Array<{
      id: string;
      hospitalId: number;
      name: string;
      displayName: string | null;
      deviceId: string;
      path: string | null;
      portName: string | null;
      driverName: string | null;
      location: string | null;
      isDefault: boolean;
      status: string;
      capabilities: {
        bins: string[];
        color: boolean;
        duplex: boolean;
        collate: boolean;
        paperSizes: string[];
      };
      lastSeenAt: string;
    }>;
  }> {
    try {
      return await ApiClient.get<{
        printers: Array<{
          id: string;
          hospitalId: number;
          name: string;
          displayName: string | null;
          deviceId: string;
          path: string | null;
          portName: string | null;
          driverName: string | null;
          location: string | null;
          isDefault: boolean;
          status: string;
          capabilities: {
            bins: string[];
            color: boolean;
            duplex: boolean;
            collate: boolean;
            paperSizes: string[];
          };
          lastSeenAt: string;
        }>;
      }>(`/agents/${agentId}/devices`);
    } catch (error: any) {
      throw new Error("프린터 목록 조회 실패", error.status);
    }
  }

  private static readonly PRINT_ERROR_MESSAGES: Record<string, string> = {
    PRINTER_NOT_CONFIGURED: "해당 출력 종류에 대한 프린터가 설정되지 않았습니다. [설정 > 프린터]에서 프린터를 지정해주세요.",
    OUTPUT_TYPE_NOT_FOUND: "지원하지 않는 출력 종류입니다.",
    AGENT_NOT_FOUND: "프린터에 연결된 에이전트를 찾을 수 없습니다. 에이전트 실행 상태를 확인해주세요.",
    CONTENT_REQUIRED: "출력할 내용이 없습니다.",
  };

  static async print(payload: {
    outputTypeCode: string;
    agentId?: string;
    pcName?: string;
    contentType: string;
    fileName: string;
    contentBase64?: string;
    contentUrl?: string;
    copies?: number;
    options?: Record<string, any>;
  }): Promise<{ id: string; message: string }> {
    try {
      return await ApiClient.post<{ id: string; message: string }>(
        printersApi.print,
        payload
      );
    } catch (error: any) {
      if (error instanceof ApiError) {
        const userMessage = PrintersService.PRINT_ERROR_MESSAGES[error.message]
          ?? `출력 작업 실패: ${error.message}`;
        throw new ApiError(userMessage, error.status, error.code, error.data);
      }
      throw error;
    }
  }

  static async createPrintJob(
    printerId: string,
    payload: {
      contentType: string;
      fileName?: string;
      contentBase64?: string;
      contentUrl?: string;
      copies?: number;
      options?: Record<string, unknown>;
      targetAgentId?: string;
    }
  ): Promise<{ id: string }> {
    try {
      return await ApiClient.post<{ id: string }>(
        printersApi.createPrintJob(printerId),
        payload
      );
    } catch (error: any) {
      if (error instanceof ApiError) {
        const userMessage = PrintersService.PRINT_ERROR_MESSAGES[error.message]
          ?? `출력 작업 실패: ${error.message}`;
        throw new ApiError(userMessage, error.status, error.code, error.data);
      }
      throw error;
    }
  }
}
