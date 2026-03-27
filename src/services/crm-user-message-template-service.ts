import { ApiClient } from "@/lib/api/api-client";
import { crmUserMessageTemplateApi } from "@/lib/api/routes/crm-user-message-template-api";
import type {
  TreeHierarchyResponse,
  FoldersResponse,
  TemplatesByFolderResponse,
  GetTemplateResponseDto,
  CreateTemplateDto,
  CreateTemplateResponse,
  CreateFolderDto,
  CreateFolderResponseDto,
  UpdateFolderDto,
  UpdateFolderResponseDto,
  DeleteFolderResponseDto,
  UpdateTemplateDto,
  UpdateTemplateResponseDto,
  DeleteTemplateResponseDto,
  MoveTemplateDto,
  MoveTemplateResponseDto,
  MoveFolderDto,
  MoveFolderResponseDto,
} from "@/types/crm/message-template/crm-user-message-template-types";

export class CrmUserMessageTemplateService {
  static async getHierarchy(
    messageType: number
  ): Promise<TreeHierarchyResponse> {
    try {
      return await ApiClient.get<TreeHierarchyResponse>(
        crmUserMessageTemplateApi.getHierarchy,
        { messageType: String(messageType) }
      );
    } catch (error: any) {
      throw new Error(
        "CRM 사용자 메시지 템플릿 트리 조회에 실패했습니다.",
        error.status
      );
    }
  }

  static async getFolders(messageType: number): Promise<FoldersResponse> {
    try {
      return await ApiClient.get<FoldersResponse>(
        crmUserMessageTemplateApi.getFolders,
        { messageType: String(messageType) }
      );
    } catch (error: any) {
      throw new Error(
        "CRM 사용자 메시지 템플릿 폴더 목록 조회에 실패했습니다.",
        error.status
      );
    }
  }

  static async getTemplatesByFolderId(
    folderId: number
  ): Promise<TemplatesByFolderResponse> {
    try {
      return await ApiClient.get<TemplatesByFolderResponse>(
        crmUserMessageTemplateApi.getTemplatesByFolderId(folderId)
      );
    } catch (error: any) {
      throw new Error(
        "CRM 사용자 메시지 템플릿 폴더별 조회에 실패했습니다.",
        error.status
      );
    }
  }

  static async getTemplateById(id: number): Promise<GetTemplateResponseDto> {
    try {
      return await ApiClient.get<GetTemplateResponseDto>(
        crmUserMessageTemplateApi.getTemplateById(id)
      );
    } catch (error: any) {
      throw new Error(
        "CRM 사용자 메시지 템플릿 조회에 실패했습니다.",
        error.status
      );
    }
  }

  static async createTemplate(
    data: CreateTemplateDto
  ): Promise<CreateTemplateResponse> {
    try {
      return await ApiClient.post<CreateTemplateResponse>(
        crmUserMessageTemplateApi.createTemplate,
        data
      );
    } catch (error: any) {
      throw new Error(
        "CRM 사용자 메시지 템플릿 생성에 실패했습니다.",
        error.status
      );
    }
  }

  static async createFolder(
    data: CreateFolderDto
  ): Promise<CreateFolderResponseDto> {
    try {
      return await ApiClient.post<CreateFolderResponseDto>(
        crmUserMessageTemplateApi.createFolder,
        data
      );
    } catch (error: any) {
      throw new Error(
        "CRM 사용자 메시지 템플릿 폴더 생성에 실패했습니다.",
        error.status
      );
    }
  }

  static async updateFolder(
    id: number,
    data: UpdateFolderDto
  ): Promise<UpdateFolderResponseDto> {
    try {
      return await ApiClient.put<UpdateFolderResponseDto>(
        crmUserMessageTemplateApi.updateFolder(id),
        data
      );
    } catch (error: any) {
      throw new Error(
        "CRM 사용자 메시지 템플릿 폴더 수정에 실패했습니다.",
        error.status
      );
    }
  }

  static async deleteFolder(id: number): Promise<DeleteFolderResponseDto> {
    try {
      return await ApiClient.delete<DeleteFolderResponseDto>(
        crmUserMessageTemplateApi.deleteFolder(id)
      );
    } catch (error: any) {
      throw new Error(
        "CRM 사용자 메시지 템플릿 폴더 삭제에 실패했습니다.",
        error.status
      );
    }
  }

  static async updateTemplate(
    id: number,
    data: UpdateTemplateDto
  ): Promise<UpdateTemplateResponseDto> {
    try {
      return await ApiClient.put<UpdateTemplateResponseDto>(
        crmUserMessageTemplateApi.updateTemplate(id),
        data
      );
    } catch (error: any) {
      throw new Error(
        "CRM 사용자 메시지 템플릿 수정에 실패했습니다.",
        error.status
      );
    }
  }

  static async deleteTemplate(id: number): Promise<DeleteTemplateResponseDto> {
    try {
      return await ApiClient.delete<DeleteTemplateResponseDto>(
        crmUserMessageTemplateApi.deleteTemplate(id)
      );
    } catch (error: any) {
      throw new Error(
        "CRM 사용자 메시지 템플릿 삭제에 실패했습니다.",
        error.status
      );
    }
  }

  static async moveTemplate(
    id: number,
    data: MoveTemplateDto
  ): Promise<MoveTemplateResponseDto> {
    try {
      return await ApiClient.patch<MoveTemplateResponseDto>(
        crmUserMessageTemplateApi.moveTemplate(id),
        data
      );
    } catch (error: any) {
      throw new Error(
        "CRM 사용자 메시지 템플릿 위치 이동에 실패했습니다.",
        error.status
      );
    }
  }

  static async moveFolder(
    folderId: number,
    data: MoveFolderDto
  ): Promise<MoveFolderResponseDto> {
    try {
      return await ApiClient.patch<MoveFolderResponseDto>(
        crmUserMessageTemplateApi.moveFolder(folderId),
        data
      );
    } catch (error: any) {
      throw new Error(
        "CRM 사용자 메시지 템플릿 폴더 위치 이동에 실패했습니다.",
        error.status
      );
    }
  }
}
