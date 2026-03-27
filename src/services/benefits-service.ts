import { benefitsApi } from "@/lib/api/routes/benefits-api";
import { ApiClient } from "@/lib/api/api-client";
import type {
  Benefit,
  CreateBenefitRequest,
  UpdateBenefitRequest,
} from "@/types/benefits-types";

export class BenefitsService {
  static async getBenefits(): Promise<Benefit[]> {
    try {
      const response = await ApiClient.get<Benefit[]>(benefitsApi.list);
      return Array.isArray(response) ? response : (response as any)?.data ?? [];
    } catch (error: any) {
      throw new Error("혜택 목록 조회 실패", error.status);
    }
  }

  static async getBenefitById(id: string): Promise<Benefit> {
    try {
      const response = await ApiClient.get<Benefit>(benefitsApi.detail(id));
      return (response as any)?.data ?? response;
    } catch (error: any) {
      throw new Error("혜택 상세 조회 실패", error.status);
    }
  }

  static async createBenefit(
    data: CreateBenefitRequest
  ): Promise<Benefit> {
    try {
      const response = await ApiClient.post<Benefit>(
        benefitsApi.create,
        data
      );
      return (response as any)?.data ?? response;
    } catch (error: any) {
      throw new Error("혜택 생성 실패", error.status);
    }
  }

  static async updateBenefit(
    id: string,
    data: UpdateBenefitRequest
  ): Promise<Benefit> {
    try {
      const response = await ApiClient.put<Benefit>(
        benefitsApi.update(id),
        data
      );
      return (response as any)?.data ?? response;
    } catch (error: any) {
      throw new Error("혜택 수정 실패", error.status);
    }
  }

  static async deleteBenefit(id: string): Promise<void> {
    try {
      await ApiClient.delete(benefitsApi.delete(id));
    } catch (error: any) {
      throw new Error("혜택 삭제 실패", error.status);
    }
  }
}
