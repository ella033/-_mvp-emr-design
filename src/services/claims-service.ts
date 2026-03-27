import type { ClaimsApiResponse } from "@/hooks/claims/use-claims";
import type { NextOrderResponse } from "@/hooks/claims/use-next-order";
import { ApiClient } from "@/lib/api/api-client";
import { claimsApi, claimDetailsApi } from "@/lib/api/api-routes";
import { destructionApi } from "@/lib/api/routes/destruction-api";

export class ClaimsService {
  static async getClaims(
    query?: Record<string, string>
  ): Promise<ClaimsApiResponse> {
    try {
      const searchParams = new URLSearchParams(query);
      // 기존 API 클라이언트 사용 (쿠키 자동 처리)
      const response = await ApiClient.get<ClaimsApiResponse>(`${claimsApi.list()}?${searchParams.toString()}`);
      
      return response;
    } catch (error: any) {
      throw new Error("청구 데이터 조회 실패", error.status);
    }
  }

  static async getClaimById(id: string): Promise<any> {
    try {
      const res = await ApiClient.get<any>(`/claims/${id}`);
      return res;
    } catch (error: any) {
      throw new Error("청구 단건 조회 실패", error?.status);
    }
  }

  static async getClaimDetails(
    claimId: string,
    query?: Record<string, string | number | boolean>
  ): Promise<any> {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(query || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null) searchParams.append(k, String(v));
      });
      const url = `${claimsApi.details(claimId)}?${searchParams.toString()}`;
      return await ApiClient.get<any>(url);
    } catch (error: any) {
      throw new Error("청구 상세(환자리스트) 조회 실패", error?.status);
    }
  }

  static async createClaim(payload: any): Promise<any> {
    try {
      const res = await ApiClient.post<any>(claimsApi.create, payload);
      return res;
    } catch (error: any) {
      throw new Error("청구 생성 실패", error?.status);
    }
  }

  static async generateClaim(payload: {
    treatmentYearMonth: string;
    formNumber: string;
    treatmentType: string;
    claimClassification: string;
    claimOrder?: string;
    patientIds: number[];
    additionalOrderIdsByPatient?: Record<string, string[]>;
  }) {
    try {
      return await ApiClient.post<any>(claimsApi.generate(), payload);
    } catch (error: any) {
      throw new Error("명세서 생성 실패", error?.status);
    }
  }

  static async transmitClaims(payload: {
    ids: string[];
    programInstalled?: boolean;
    launchFailed?: boolean;
  }) {
    try {
      return await ApiClient.post<any>(claimsApi.transmit(), payload);
    } catch (error: any) {
      throw new Error("청구 송신 실패", error?.status);
    }
  }

  static async deleteClaim(id: string) {
    try {
      return await ApiClient.delete<any>(`${claimsApi.delete(id)}`);
    } catch (error: any) {
      console.log("deleteClaim error :", error);
      throw new Error("청구 삭제 실패", error);
    }
  }

  static async updateClaim(id: string, body: any) {
    try {
      return await ApiClient.put<any>(claimsApi.update(id), body ?? {});
    } catch (error: any) {
      throw new Error("청구 수정 실패", error?.status);
    }
  }

  static async completeClaim(id: string, body?: any) {
    try {
      // body가 없는 경우 서버가 허용하면 빈 객체로 전송
      return await ApiClient.put<any>(claimsApi.completion(id), body ?? {});
    } catch (error: any) {
      throw new Error("청구 송신(완료) 실패", error?.status);
    }
  }

  static async downloadSamFile(id: string): Promise<Blob> {
    try {
      // sam-file은 바이너리 응답 예상: proxy에서 res.body를 반환하므로 fetch로 재다운로드 처리
      // 여기서는 API 경로만 반환하고, 실제 다운로드는 컴포넌트에서 window.open 방식으로 처리하는 편이 간단함
      const url = claimsApi.samFile(id);
      // ApiClient.get은 JSON/Text/body 스트림을 반환할 수 있으나, 간단히 URL만 넘겨 사용처에서 다운로드 처리
      // 필요시 별도 전용 download 메서드를 구현
      return await ApiClient.get<any>(url);
    } catch (error: any) {
      throw new Error("SAM 파일 다운로드 실패", error?.status);
    }
  }

  static async getNextOrder(
    params: {
      medicalInstitutionCode?: string;
      claimClassification?: string;
      formNumber?: string;
      treatmentYearMonth?: string;
      treatmentType?: string;
    }
  ): Promise<NextOrderResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });

      const url = `${claimsApi.nextOrder()}?${searchParams.toString()}`;
      
      const response = await ApiClient.get<NextOrderResponse>(url);
      
      return response;
    } catch (error: any) {
      throw new Error("다음 차수 조회 실패", error.status);
    }
  }

  static async getCandidatePatients(params: {
    treatmentYearMonth: string;
    formNumber: string;
    treatmentType: string;
    claimClassification: string;
    excludeClaimed: boolean;
    keyword?: string;
  }) {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const url = `${claimsApi.candidatePatients()}?${searchParams.toString()}`;
      return await ApiClient.get<any>(url);
    } catch (error: any) {
      throw new Error("대상 환자 조회 실패", error?.status);
    }
  }

  static async getAdditionalClaimOrders(
    patientId: string | number,
    params: {
      treatmentYearMonth: string;
      formNumber: string;
      treatmentType: string;
      claimClassification: string;
    },
  ) {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const url = `${claimsApi.additionalClaimOrders(patientId)}?${searchParams.toString()}`;
      return await ApiClient.get<any>(url);
    } catch (error: any) {
      throw new Error("추가청구 항목 조회 실패", error?.status);
    }
  }

  static async searchClaimDetails(
    params: Record<string, string>
  ): Promise<any> {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) searchParams.append(k, v);
      });
      const url = `${claimDetailsApi.search()}?${searchParams.toString()}`;
      const res = await ApiClient.get<any>(url);
      return res;
    } catch (error: any) {
      throw new Error("청구 상세 조회 실패", error?.status);
    }
  }

  static async updateLinkedClaimDetail(claimId: string, detailId: string, body?: any) {
    try {
      // body가 없는 경우 서버가 허용하면 빈 객체로 전송
      return await ApiClient.put<any>(claimsApi.updateLinkedClaimDetail(claimId, detailId), body ?? null);
    } catch (error: any) {
      throw new Error("청구 송신(완료) 실패", error?.status);
    }
  }

  static async reorderClaimDetails(claimId: string, detailIds: string[]) {
    try {
      return await ApiClient.put<any>(claimsApi.reorderDetails(claimId), {
        detailIds,
      });
    } catch (error: any) {
      throw new Error('명세서 순서 변경 실패', error?.status);
    }
  }

  static async getDestructionCandidates({
      type,
      startDate,
      endDate,
      medicalInstitutionCode,
      page,
      limit,
    }: any) {
    try {
      const params = {
        type: type ?? 'CLAIM',
        startDate,
        endDate,
        medicalInstitutionCode,
        page,
        limit,
      };
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) searchParams.append(k, String(v));
      });
      const url = `${destructionApi.candidates()}?${searchParams.toString()}`;
      return await ApiClient.get<any>(url);
    } catch (error: any) {
      throw new Error("파기 대상 조회 실패", error?.status);
    }
  }

  static async destroyClaimDetails(data: any) {
    try {
      const { type, ...body } = data;
      return await ApiClient.delete<any>(destructionApi.destroy(), body, {
         params: { type: type ?? 'CLAIM' }
      });
    } catch (error: any) {
      throw new Error("파기 요청 실패", error?.status);
    }
  }

  static async destroyDestructionCandidatesByRange(data: any) {
    try {
      const { type, ...body } = data;
      return await ApiClient.delete<any>(destructionApi.destroyRange(), body, {
          params: { type: type ?? 'CLAIM' }
      });
    } catch (error: any) {
      throw new Error("기간 파기 요청 실패", error?.status);
    }
  }

  static async getDestructionLogs(params: { startDate?: string; endDate?: string; page?: number; limit?: number }) {
    try {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) searchParams.append(k, String(v));
      });
      const url = `${destructionApi.logs()}?${searchParams.toString()}`;
      return await ApiClient.get<any>(url);
    } catch (error: any) {
      throw new Error("파기 이력 조회 실패", error?.status);
    }
  }
}
