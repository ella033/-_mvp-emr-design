import { TemplateCodeType } from "@/constants/common/common-enum";

// ================================ 상용구 코드 기본 ================================
export interface TemplateCodeBase {
  code: string;
  content: string;
  isQuickMenu: boolean;
  type: TemplateCodeType[];
}

// ================================ 상용구 코드 정보 ================================
export interface TemplateCode extends TemplateCodeBase {
  id: number;
  hospitalId: number;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
  deleteId: number | null;
  deleteDateTime: string | null;
}

// ================================ 상용구 코드 생성 ================================
export interface CreateTemplateCodeRequest extends TemplateCodeBase {}

export interface CreateTemplateCodeResponse {
  id: number;
}

// ================================ 상용구 코드 수정 ================================
export interface UpdateTemplateCodeRequest
  extends Partial<Omit<TemplateCodeBase, "hospitalId">> {}

export interface UpdateTemplateCodeResponse extends TemplateCode {}

// ================================ 상용구 코드 삭제 ================================
export interface DeleteTemplateCodeResponse {
  id: number;
}
