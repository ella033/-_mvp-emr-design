// ================================ 용법코드 기본 ================================
export interface UsageCodeBase {
  hospitalId: number;
  code: string;
  usage: string;
  category: number;
  times: number;
}

// ================================ 용법코드 정보 ================================
export interface UsageCode extends UsageCodeBase {
  id: number;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
}

// ================================ 용법코드 생성 ================================
export interface CreateUsageCodeRequest extends UsageCodeBase {}
export interface CreateUsageCodeResponse {
  id: number;
}

// ================================ 용법코드 수정 ================================
export interface UpdateUsageCodeRequest extends Partial<UsageCodeBase> {}
export interface UpdateUsageCodeResponse extends UsageCode {}

// ================================ 용법코드 삭제 ================================
export interface DeleteUsageCodeRequest {}
export interface DeleteUsageCodeResponse {
  id: number;
}
