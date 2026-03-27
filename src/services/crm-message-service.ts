import { ApiClient } from "@/lib/api/api-client";
import { crmMessageApi } from "@/lib/api/routes/crm-message-api";
import type {
  CrmMessageSendRequest,
  CrmMessageSendResponse,
  CrmMessageReRegistrationResponse,
  CrmMessageResendRequest,
  CrmMessageResendResponse,
  SendEligibilityCheckResponse,
} from "@/types/crm/send-message/crm-message-types";

export class CrmMessageService {
  static async sendMessage(
    request: CrmMessageSendRequest
  ): Promise<CrmMessageSendResponse> {
    try {
      const formData = new FormData();

      // 필수 필드 (발송유형, 메시지유형, 메시지내용, 발송번호, 수신자[])
      formData.append("sendType", request.sendType.toString());
      formData.append("messageType", request.messageType.toString());
      formData.append("messageContent", request.messageContent);
      formData.append("senderNumber", request.senderNumber);
      formData.append("recipients", JSON.stringify(request.recipients));

      // 예약일시(예악 발송 시), 템플릿id 등
      if (request.sendDateTime) {
        formData.append("sendDateTime", request.sendDateTime);
        formData.append("isReserved", "true");
      }
      if (request.isAdDisplayed !== undefined)
        formData.append("isAdDisplayed", request.isAdDisplayed.toString());
      if (request.messageTemplateId)
        formData.append(
          "messageTemplateId",
          request.messageTemplateId.toString()
        );

      // 첨부 이미지
      if (request.image1) formData.append("image1", request.image1);
      if (request.image2) formData.append("image2", request.image2);
      if (request.image3) formData.append("image3", request.image3);

      return await ApiClient.post<CrmMessageSendResponse>(
        crmMessageApi.send,
        formData
      );
    } catch (error: any) {
      throw new Error(error?.message, error.status);
    }
  }

  static async cancelMessage(
    sendHistoryId: number
  ): Promise<CrmMessageSendResponse> {
    try {
      return await ApiClient.post<CrmMessageSendResponse>(
        crmMessageApi.cancel(sendHistoryId),
        {}
      );
    } catch (error: any) {
      throw new Error(error?.message, error.status);
    }
  }

  static async reRegistrationMessage(
    sendHistoryId: number
  ): Promise<CrmMessageReRegistrationResponse> {
    try {
      return await ApiClient.post<CrmMessageReRegistrationResponse>(
        crmMessageApi.reRegistration(sendHistoryId),
        {}
      );
    } catch (error: any) {
      throw new Error(error?.message, error.status);
    }
  }

  static async checkSendEligibility(
    patientIds: number[]
  ): Promise<SendEligibilityCheckResponse> {
    return await ApiClient.post<SendEligibilityCheckResponse>(
      crmMessageApi.sendEligibilityCheck,
      { patientIds }
    );
  }

  static async resendMessage(
    sendHistoryId: number,
    request: CrmMessageResendRequest
  ): Promise<CrmMessageResendResponse> {
    try {
      return await ApiClient.post<CrmMessageResendResponse>(
        crmMessageApi.resend(sendHistoryId),
        request
      );
    } catch (error: any) {
      throw new Error(error?.message, error.status);
    }
  }
}
