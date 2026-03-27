import { ApiClient } from "@/lib/api/api-client";
import { pciApi } from "@/lib/api/api-routes";
import type {
  PciResultInfoBody,
  PciResultInfoResponse,
  PciResultGosiBody,
  PciResultGosiResponse,
} from "@/types/pci/pci-types";

export class PciApiService {
  /** 관련상병/항목 조회 (msgtyp S/O) */
  static async getResultInfo(
    body: PciResultInfoBody
  ): Promise<PciResultInfoResponse> {
    return await ApiClient.post<PciResultInfoResponse>(
      pciApi.resultInfo,
      body
    );
  }

  /** 고시정보 조회 (msgtyp G) */
  static async getResultGosi(
    body: PciResultGosiBody
  ): Promise<PciResultGosiResponse> {
    return await ApiClient.post<PciResultGosiResponse>(
      pciApi.resultGosi,
      body
    );
  }
}
