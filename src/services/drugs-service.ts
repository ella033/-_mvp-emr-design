import { ApiClient } from "@/lib/api/api-client";
import { drugsApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  Drug,
  DrugApprovalDetails,
  DrugApprovals,
  DrugIngredientDetails,
} from "@/types/drug-types";

export class DrugsService {
  static async getDrug(id: string): Promise<Drug> {
    const validatedId = validateId(id, "drugId");
    try {
      return await ApiClient.get<Drug>(drugsApi.detail(validatedId));
    } catch (error: any) {
      throw new Error("약품 조회 실패", error.status);
    }
  }
  static async getDrugApprovalDetails(
    id: string
  ): Promise<DrugApprovalDetails> {
    const validatedId = validateId(id, "drugId");
    try {
      return await ApiClient.get<DrugApprovalDetails>(
        drugsApi.approvalDetails(validatedId)
      );
    } catch (error: any) {
      throw new Error("허가받은 의약품 상세 조회 실패", error.status);
    }
  }
  static async getDrugApprovals(id: string): Promise<DrugApprovals> {
    const validatedId = validateId(id, "drugId");
    try {
      return await ApiClient.get<DrugApprovals>(
        drugsApi.listApprovals(validatedId)
      );
    } catch (error: any) {
      throw new Error("허가받은 의약품 목록 조회 실패", error.status);
    }
  }
  static async getDrugIngredientDetails(
    id: string
  ): Promise<DrugIngredientDetails> {
    const validatedId = validateId(id, "drugId");
    try {
      return await ApiClient.get<DrugIngredientDetails>(
        drugsApi.ingredientDetails(validatedId)
      );
    } catch (error: any) {
      throw new Error("약품 성분 상세 조회 실패", error.status);
    }
  }
}
