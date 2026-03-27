import { ApiClient } from "@/lib/api/api-client";
import type { ClaimSettings, SaveClaimSettingsRequest } from "../model";

const BASE_PATH = "/claim-settings";

export const claimSettingsApi = {
  /** 청구 설정 조회 */
  getClaimSettings: async (hospitalId: number): Promise<ClaimSettings> => {
    return ApiClient.get(`${BASE_PATH}/${hospitalId}`);
  },

  /** 청구 설정 저장 */
  saveClaimSettings: async (
    hospitalId: number,
    data: SaveClaimSettingsRequest
  ): Promise<ClaimSettings> => {
    return ApiClient.put(`${BASE_PATH}/${hospitalId}`, data);
  },
};
