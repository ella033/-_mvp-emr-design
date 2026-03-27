import { ApiClient } from "@/lib/api/api-client";
import { specificDetailCodesApi } from "@/lib/api/routes/specific-detail-codes-api";
import type { SpecificDetailCode } from "@/types/chart/specific-detail-code-type";

export interface SpecificDetailCodesSearchParams {
  baseDate: string;
}

export class SpecificDetailCodesService {
  /**
   * 특정내역 코드 목록 조회
   */
  static async getSpecificDetailCodes(
    params: SpecificDetailCodesSearchParams
  ): Promise<SpecificDetailCode[]> {
    try {
      const queryString = this.buildQueryString(params);
      return await ApiClient.get<SpecificDetailCode[]>(
        specificDetailCodesApi.list(queryString)
      );
    } catch (error: any) {
      throw new Error("특정내역 코드 목록 조회 실패", error.status);
    }
  }

  /**
   * 특정내역 코드 상세 조회
   */
  static async getSpecificDetailCodeByCode(
    code: string
  ): Promise<SpecificDetailCode> {
    try {
      return await ApiClient.get<SpecificDetailCode>(
        specificDetailCodesApi.detail(code)
      );
    } catch (error: any) {
      throw new Error("특정내역 코드 상세 조회 실패", error.status);
    }
  }

  /**
   * 특정내역 코드 생성
   */
  static async createSpecificDetailCode(
    data: Omit<
      SpecificDetailCode,
      "id" | "createId" | "createDateTime" | "updateId" | "updateDateTime"
    >
  ): Promise<SpecificDetailCode> {
    try {
      return await ApiClient.post<SpecificDetailCode>(
        specificDetailCodesApi.create(),
        data
      );
    } catch (error: any) {
      throw new Error("특정내역 코드 생성 실패", error.status);
    }
  }

  /**
   * 특정내역 코드 수정
   */
  static async updateSpecificDetailCode(
    id: number,
    data: Partial<SpecificDetailCode>
  ): Promise<SpecificDetailCode> {
    try {
      return await ApiClient.patch<SpecificDetailCode>(
        specificDetailCodesApi.update(id),
        data
      );
    } catch (error: any) {
      throw new Error("특정내역 코드 수정 실패", error.status);
    }
  }

  /**
   * 특정내역 코드 삭제
   */
  static async deleteSpecificDetailCode(id: number): Promise<void> {
    try {
      await ApiClient.delete(specificDetailCodesApi.delete(id));
    } catch (error: any) {
      throw new Error("특정내역 코드 삭제 실패", error.status);
    }
  }

  private static buildQueryString(
    params?: SpecificDetailCodesSearchParams
  ): string {
    if (!params) return "";

    const searchParams = new URLSearchParams();

    if (params.baseDate !== undefined) {
      searchParams.append("baseDate", params.baseDate);
    }

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }
}
