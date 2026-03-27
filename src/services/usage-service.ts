import { ApiClient } from "@/lib/api/api-client";
import { usageApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  CreateUsageCodeRequest,
  CreateUsageCodeResponse,
  DeleteUsageCodeResponse,
  UpdateUsageCodeResponse,
  UsageCode,
} from "@/types/usage-code-types";

export class UsageService {
  static async getUsages(): Promise<UsageCode[]> {
    try {
      return await ApiClient.get<UsageCode[]>(usageApi.list());
    } catch (error: any) {
      throw new Error("병원별 사용 코드 목록 조회 실패", error.status);
    }
  }

  static async createUsage(
    usage: CreateUsageCodeRequest
  ): Promise<CreateUsageCodeResponse> {
    try {
      return await ApiClient.post<CreateUsageCodeResponse>(
        usageApi.create,
        usage
      );
    } catch (error: any) {
      throw new Error("사용 코드 생성 실패", error.status);
    }
  }

  static async updateUsage(
    id: number,
    data: any
  ): Promise<UpdateUsageCodeResponse> {
    const validatedId = validateId(id, "usageId");
    try {
      return await ApiClient.put<UpdateUsageCodeResponse>(
        usageApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("사용 코드 수정 실패", error.status);
    }
  }

  static async deleteUsage(id: number): Promise<DeleteUsageCodeResponse> {
    const validatedId = validateId(id, "usageId");
    try {
      return await ApiClient.delete<DeleteUsageCodeResponse>(
        usageApi.delete(validatedId)
      );
    } catch (error: any) {
      throw new Error("사용 코드 삭제 실패", error.status);
    }
  }
}
