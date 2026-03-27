import { ApiClient } from "@/lib/api/api-client";
import { crmSendHistoryApi } from "@/lib/api/routes/crm-send-history-api";
import type {
  CrmSendHistoryListResponse,
  CrmSendReservedHistoryListResponse,
  GetSendHistoryParams,
  GetSendReservedHistoryParams,
  GetMessageContentResponseDto,
  GetSendHistoryDetailResponseDto,
} from "@/types/crm/send-history/crm-send-history-types";

export class CrmSendHistoryService {
  static async getSendHistories(
    params: GetSendHistoryParams
  ): Promise<CrmSendHistoryListResponse> {
    try {
      return await ApiClient.get<CrmSendHistoryListResponse>(
        crmSendHistoryApi.getSendHistories(params)
      );
    } catch (error: any) {
      throw new Error(
        "CRM 발송 내역 목록 조회에 실패했습니다.",
        error.status
      );
    }
  }

  static async getSendReservedHistories(
    params: GetSendReservedHistoryParams
  ): Promise<CrmSendReservedHistoryListResponse> {
    try {
      return await ApiClient.get<CrmSendReservedHistoryListResponse>(
        crmSendHistoryApi.getSendReservedHistories(params)
      );
    } catch (error: any) {
      throw new Error(
        "CRM 예약 내역 목록 조회에 실패했습니다.",
        error.status
      );
    }
  }

  static async getMessageContent(
    ubmsMessageId: number
  ): Promise<GetMessageContentResponseDto> {
    try {
      return await ApiClient.get<GetMessageContentResponseDto>(
        crmSendHistoryApi.getMessageContent(ubmsMessageId)
      );
    } catch (error: any) {
      throw new Error("메시지 내용 조회에 실패했습니다.", error.status);
    }
  }

  static async getSendHistoryDetail(
    sendHistoryId: number
  ): Promise<GetSendHistoryDetailResponseDto> {
    try {
      return await ApiClient.get<GetSendHistoryDetailResponseDto>(
        crmSendHistoryApi.getSendHistoryDetail(sendHistoryId)
      );
    } catch (error: any) {
      throw new Error("발송 내역 상세 조회에 실패했습니다.", error.status);
    }
  }
}
