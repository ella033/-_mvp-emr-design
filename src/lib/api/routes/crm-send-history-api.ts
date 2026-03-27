import type {
  GetSendHistoryParams,
  GetSendReservedHistoryParams,
} from "@/types/crm/send-history/crm-send-history-types";

export const crmSendHistoryApi = {
  getSendHistories: (params: GetSendHistoryParams) => {
    const searchParams = new URLSearchParams();
    searchParams.append("from", params.from);
    searchParams.append("to", params.to);
    if (params.status !== undefined) {
      searchParams.append("status", params.status.toString());
    }
    return `/crm-send-history?${searchParams.toString()}`;
  },
  getSendReservedHistories: (params: GetSendReservedHistoryParams) => {
    const searchParams = new URLSearchParams();
    searchParams.append("from", params.from);
    searchParams.append("to", params.to);
    if (params.status !== undefined) {
      searchParams.append("status", params.status.toString());
    }
    return `/crm-send-history/reserved?${searchParams.toString()}`;
  },
  getMessageContent: (ubmsMessageId: number) =>
    `/crm-send-history/message-content/${ubmsMessageId}`,
  getSendHistoryDetail: (sendHistoryId: number) =>
    `/crm-send-history/${sendHistoryId}`,
};
