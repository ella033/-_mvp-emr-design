import { ApiClient } from "@/lib/api/api-client";
import { certsApi } from "@/lib/api/api-routes";

export interface ExistingCert {
  id: string;
  orgId: string;
  alias: string;
  signMeta: {
    subject: string;
    issuer: string;
    serial: string;
    notBefore: string;
    notAfter: string;
  };
  daysToExpire: number;
}

export class CertsService {
  static async list(): Promise<ExistingCert[]> {
    try {
      return await ApiClient.get<ExistingCert[]>(certsApi.list);
    } catch (error: any) {
      throw new Error("인증서 목록 조회 실패", error.status);
    }
  }

  static async upload(formData: FormData): Promise<any> {
    return await ApiClient.post<any>(certsApi.create, formData);
  }

  static async delete(id: string): Promise<any> {
    return await ApiClient.delete<any>(certsApi.detail(id));
  }

  static async update(id: string, formData: FormData): Promise<any> {
    try {
      return await ApiClient.put<any>(certsApi.detail(id), formData);
    } catch (error: any) {
      throw new Error("인증서 갱신 실패", error.status);
    }
  }
}


