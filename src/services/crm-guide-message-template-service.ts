import { ApiClient } from "@/lib/api/api-client";
import { crmGuideMessageTemplateApi } from "@/lib/api/routes/crm-guide-message-template-api";
import type {
  GuideFoldersResponse,
  GuideTemplatesByFolderResponse,
} from "@/types/crm/message-template/crm-guide-message-template-types";

export class CrmGuideMessageTemplateService {
  static async getFolders(messageType: number): Promise<GuideFoldersResponse> {
    try {
      return await ApiClient.get<GuideFoldersResponse>(
        crmGuideMessageTemplateApi.getFolders,
        { messageType: String(messageType) }
      );
    } catch (error: any) {
      throw new Error(
        "CRM 가이드 메시지 템플릿 폴더 목록 조회에 실패했습니다.",
        error.status
      );
    }
  }

  static async getTemplatesByFolderId(
    folderId: number
  ): Promise<GuideTemplatesByFolderResponse> {
    try {
      return await ApiClient.get<GuideTemplatesByFolderResponse>(
        crmGuideMessageTemplateApi.getTemplatesByFolderId(folderId)
      );
    } catch (error: any) {
      throw new Error(
        "CRM 가이드 메시지 템플릿 폴더별 조회에 실패했습니다.",
        error.status
      );
    }
  }
}
