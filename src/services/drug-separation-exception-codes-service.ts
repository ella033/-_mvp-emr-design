import { ApiClient } from "@/lib/api/api-client";
import { drugSeparationExceptionCodesApi } from "@/lib/api/routes/drug-separation-exception-codes-api";
import { DrugSeparationExceptionCode } from "@/types/drug-separation-exception-code-type";
import { DrugSeparationExceptionCodeType } from "@/types/drug-separation-exception-code-type";

export class DrugSeparationExceptionCodesService {
  static async getDrugSeparationExceptionCodes(
    type: DrugSeparationExceptionCodeType
  ): Promise<DrugSeparationExceptionCode[]> {
    try {
      return await ApiClient.get<DrugSeparationExceptionCode[]>(
        drugSeparationExceptionCodesApi.list(type)
      );
    } catch (error: any) {
      throw new Error("의약분업 예외코드 목록 조회 실패", error.status);
    }
  }
}
