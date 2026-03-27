import { ApiClient } from "@/lib/api/api-client";
import { accessLogsApi } from "@/lib/api/api-routes";

export class AccessLogsService {
  static async getCandidates(params: any) {
    return ApiClient.get(accessLogsApi.candidates, params);
  }

  static async destruct(body: any) {
    return ApiClient.post(accessLogsApi.destruct, body);
  }



  static async getAccessLogs(params: {
    startDate: string;
    endDate: string;
    targetUserId?: string;
    type?: "PERSONAL" | "CLINICAL";
    page?: number;
    limit?: number;
  }) {
    return ApiClient.get(accessLogsApi.accessLogs, params as any);
  }



  static async createAccessLog(data: {
    type: "PERSONAL" | "CLINICAL";
    encounterId?: string;
    menuName: string;
    patients?: any;
    action: string;
  }) {
    return ApiClient.post(accessLogsApi.base, data);
  }
}
