import { ApiClient } from "@/lib/api/api-client";
import { templateCodeApi } from "@/lib/api/routes/template-code-api";
import type {
  TemplateCode,
  CreateTemplateCodeRequest,
  CreateTemplateCodeResponse,
  UpdateTemplateCodeRequest,
  UpdateTemplateCodeResponse,
  DeleteTemplateCodeResponse,
} from "@/types/template-code-types";

export class TemplateCodeService {
  // 상용구 목록 조회
  static async getTemplateCodes(): Promise<TemplateCode[]> {
    try {
      return await ApiClient.get<TemplateCode[]>(templateCodeApi.list());
    } catch (error: any) {
      throw new Error("상용구 목록 조회 실패", error.status);
    }
  }

  // 상용구 상세 조회 (코드로 조회)
  static async getTemplateCodeByCode(code: string): Promise<TemplateCode> {
    try {
      return await ApiClient.get<TemplateCode>(templateCodeApi.detail(code));
    } catch (error: any) {
      throw new Error("상용구 상세 조회 실패", error.status);
    }
  }

  // 상용구 생성
  static async createTemplateCode(
    data: CreateTemplateCodeRequest
  ): Promise<CreateTemplateCodeResponse> {
    try {
      return await ApiClient.post<CreateTemplateCodeResponse>(
        templateCodeApi.create,
        data
      );
    } catch (error: any) {
      throw new Error("상용구 생성 실패", error.status);
    }
  }

  // 상용구 수정
  static async updateTemplateCode(
    id: number,
    data: UpdateTemplateCodeRequest
  ): Promise<UpdateTemplateCodeResponse> {
    try {
      return await ApiClient.put<UpdateTemplateCodeResponse>(
        templateCodeApi.update(id),
        data
      );
    } catch (error: any) {
      throw new Error("상용구 수정 실패", error.status);
    }
  }

  // 상용구 삭제
  static async deleteTemplateCode(
    id: number
  ): Promise<DeleteTemplateCodeResponse> {
    try {
      return await ApiClient.delete<DeleteTemplateCodeResponse>(
        templateCodeApi.delete(id)
      );
    } catch (error: any) {
      throw new Error("상용구 삭제 실패", error.status);
    }
  }
}
