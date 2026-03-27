import { useMutation } from "@tanstack/react-query";
import { CrmMessageService } from "@/services/crm-message-service";
import type {
  CrmMessageSendRequest,
  CrmMessageSendResponse,
  CrmMessageReRegistrationResponse,
  CrmMessageResendRequest,
  CrmMessageResendResponse,
} from "@/types/crm/send-message/crm-message-types";

export function useSendMessage(options?: {
  onSuccess?: (data: CrmMessageSendResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (request: CrmMessageSendRequest) => {
      return await CrmMessageService.sendMessage(request);
    },
    ...options,
  });
}

export function useCancelMessage(options?: {
  onSuccess?: (data: CrmMessageSendResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (sendHistoryId: number) => {
      return await CrmMessageService.cancelMessage(sendHistoryId);
    },
    ...options,
  });
}

export function useReRegistrationMessage(options?: {
  onSuccess?: (data: CrmMessageReRegistrationResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (sendHistoryId: number) => {
      return await CrmMessageService.reRegistrationMessage(sendHistoryId);
    },
    ...options,
  });
}

export function useResendMessage(options?: {
  onSuccess?: (data: CrmMessageResendResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async ({
      sendHistoryId,
      request,
    }: {
      sendHistoryId: number;
      request: CrmMessageResendRequest;
    }) => {
      return await CrmMessageService.resendMessage(sendHistoryId, request);
    },
    ...options,
  });
}
