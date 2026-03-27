import { ApiClient } from "@/lib/api/api-client";
import { crmSenderApi } from "@/lib/api/routes/crm-sender-api";
import type { CrmSenderListResponse } from "@/types/crm/sender/crm-sender-types";
import type {
  CreateCrmSenderDto,
  UpdateCrmSenderDto,
  CrmSenderResponseDto,
} from "@/types/crm/sender/crm-sender-crud-types";

export class CrmSenderService {
  static async getSenders(): Promise<CrmSenderListResponse> {
    try {
      return await ApiClient.get<CrmSenderListResponse>(
        crmSenderApi.getSenders
      );
    } catch (error: any) {
      throw new Error("발송번호 목록 조회에 실패했습니다.", error.status);
    }
  }

  static async createSender(
    data: CreateCrmSenderDto
  ): Promise<CrmSenderResponseDto> {
    try {
      return await ApiClient.post<CrmSenderResponseDto>(
        crmSenderApi.createSender,
        data
      );
    } catch (error: any) {
      throw new Error("발신번호 등록에 실패했습니다.", error.status);
    }
  }

  static async updateSender(
    senderNumber: string,
    data: UpdateCrmSenderDto
  ): Promise<CrmSenderResponseDto> {
    try {
      return await ApiClient.put<CrmSenderResponseDto>(
        crmSenderApi.updateSender(senderNumber),
        data
      );
    } catch (error: any) {
      throw new Error("발신번호 수정에 실패했습니다.", error.status);
    }
  }

  static async deleteSender(senderNumber: string): Promise<void> {
    try {
      await ApiClient.delete(crmSenderApi.deleteSender(senderNumber));
    } catch (error: any) {
      throw new Error("발신번호 삭제에 실패했습니다.", error.status);
    }
  }
}
