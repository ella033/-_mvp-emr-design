import { ApiClient } from "@/lib/api/api-client";
import { crmConditionSearchApi } from "@/lib/api/routes/crm-condition-search-api";
import type {
  ConditionSearchRequest,
  ConditionSearchResponse,
} from "@/types/crm/condition-search/condition-search-types";
import type {
  ConditionListResponseDto,
  CreateConditionDto,
  CreateConditionResponseDto,
  ConditionDetailResponseDto,
  DeleteConditionResponseDto,
} from "@/types/crm/condition-search/condition-management-types";

export class CrmConditionSearchService {
  static async searchPatients(
    request: ConditionSearchRequest
  ): Promise<ConditionSearchResponse> {
    try {
      return await ApiClient.post<ConditionSearchResponse>(
        crmConditionSearchApi.searchPatients,
        request
      );
    } catch (error: any) {
      throw new Error("조건 검색에 실패했습니다.", error.status);
    }
  }

  // 조건 목록 조회
  static async getConditions(): Promise<ConditionListResponseDto[]> {
    try {
      return await ApiClient.get<ConditionListResponseDto[]>(
        crmConditionSearchApi.getConditions
      );
    } catch (error: any) {
      throw new Error("조건 목록 조회에 실패했습니다.", error.status);
    }
  }

  // 조건 생성
  static async createCondition(
    request: CreateConditionDto
  ): Promise<CreateConditionResponseDto> {
    try {
      return await ApiClient.post<CreateConditionResponseDto>(
        crmConditionSearchApi.createCondition,
        request
      );
    } catch (error: any) {
      throw new Error("조건 생성에 실패했습니다.", error.status);
    }
  }

  // 조건 ID로 조회
  static async getConditionById(
    id: number
  ): Promise<ConditionDetailResponseDto> {
    try {
      return await ApiClient.get<ConditionDetailResponseDto>(
        crmConditionSearchApi.getConditionById(id)
      );
    } catch (error: any) {
      throw new Error("조건 조회에 실패했습니다.", error.status);
    }
  }

  // 조건 삭제
  static async deleteCondition(
    id: number
  ): Promise<DeleteConditionResponseDto> {
    try {
      return await ApiClient.delete<DeleteConditionResponseDto>(
        crmConditionSearchApi.deleteCondition(id)
      );
    } catch (error: any) {
      throw new Error("조건 삭제에 실패했습니다.", error.status);
    }
  }
}
