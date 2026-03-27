import { ApiClient } from "@/lib/api/api-client";
import { crmSendEventsApi } from "@/lib/api/routes/crm-send-events-api";
import type {
  CrmSendEventResponseDto,
  CrmSendEventsListResponse,
  CreateCrmSendEventDto,
  CreateCrmSendEventResponseDto,
  UpdateCrmSendEventDto,
} from "@/types/crm/send-events/crm-send-events-types";

export class CrmSendEventsService {
  static async getSendEvents(): Promise<CrmSendEventsListResponse> {
    try {
      return await ApiClient.get<CrmSendEventsListResponse>(
        crmSendEventsApi.getSendEvents
      );
    } catch (error: any) {
      throw new Error(
        "CRM 발송 이벤트 목록 조회에 실패했습니다.",
        error.status
      );
    }
  }

  static async getSendEventById(id: number): Promise<CrmSendEventResponseDto> {
    try {
      return await ApiClient.get<CrmSendEventResponseDto>(
        crmSendEventsApi.getSendEventById(id)
      );
    } catch (error: any) {
      throw new Error("CRM 발송 이벤트 조회에 실패했습니다.", error.status);
    }
  }

  static async createEvent(
    request: CreateCrmSendEventDto
  ): Promise<CreateCrmSendEventResponseDto> {
    try {
      return await ApiClient.post<CreateCrmSendEventResponseDto>(
        crmSendEventsApi.createEvent,
        request
      );
    } catch (error: any) {
      throw new Error("CRM 발송 이벤트 생성에 실패했습니다.", error.status);
    }
  }

  static async updateEvent(
    id: number,
    request: UpdateCrmSendEventDto
  ): Promise<CrmSendEventResponseDto> {
    try {
      return await ApiClient.put<CrmSendEventResponseDto>(
        crmSendEventsApi.updateEvent(id),
        request
      );
    } catch (error: any) {
      throw new Error("CRM 발송 이벤트 수정에 실패했습니다.", error.status);
    }
  }

  static async deleteEvent(id: number): Promise<void> {
    try {
      return await ApiClient.delete<void>(crmSendEventsApi.deleteEvent(id));
    } catch (error: any) {
      throw new Error("CRM 발송 이벤트 삭제에 실패했습니다.", error.status);
    }
  }
}
