import { ApiClient } from "@/lib/api/api-client";
import { patientsApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  CreateMedicalAidRequest,
  CreateMedicalAidResponse,
  MedicalAid,
  DeleteMedicalAidResponse,
} from "@/types/medical-aid-types";
import type { PatientChartQuery } from "@/types/chart/patient-chart-type";
import type {
  Patient,
  CreatePatientRequest,
  CreatePatientResponse,
  UpdatePatientRequest,
  UpdatePatientResponse,
  DeletePatientResponse,
} from "@/types/patient-types";
import type { PatientsListResponse } from "@/types/patient-types";
import type {
  PatientChart,
  PatientChartFilter,
} from "@/types/chart/patient-chart-type";
import { 청구 } from "@/constants/common/common-enum";

export class PatientsService {
  private static buildPatientsQueryString(query: Record<string, any>): string {
    const params = new URLSearchParams();
    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;

      if (key === "filter") {
        if (typeof value === "string") {
          params.set(key, value);
          return;
        }
        if (typeof value === "object") {
          params.set(key, JSON.stringify(value));
          return;
        }
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item === undefined || item === null || item === "") return;
          params.append(key, String(item));
        });
        return;
      }

      params.set(key, String(value));
    });
    return params.toString();
  }

  static async getPatients(query: Record<string, any>): Promise<PatientsListResponse> {
    const queryString = this.buildPatientsQueryString(query);
    try {
      return await ApiClient.get<PatientsListResponse>(patientsApi.list(queryString));
    } catch (error: any) {
      throw new Error("환자 목록 조회 실패", error.status);
    }
  }

  static async getPatient(id: number): Promise<Patient> {
    const validatedId = validateId(id, "Patient ID");
    try {
      return await ApiClient.get<Patient>(patientsApi.detail(validatedId));
    } catch (error: any) {
      throw new Error("환자 조회 실패", error.status);
    }
  }

  static async getPatientChartFilter(id: number): Promise<PatientChartFilter> {
    const validatedId = validateId(id, "Patient ID");
    try {
      return await ApiClient.get<PatientChartFilter>(
        patientsApi.chartsFilter(validatedId)
      );
    } catch (error: any) {
      throw new Error("환자 차트 필터 조회 실패", error.status);
    }
  }

  static async getPatientChart(
    query: PatientChartQuery
  ): Promise<PatientChart> {
    const validatedId = validateId(query.id, "Patient ID");
    const queryString = this.buildQueryString(query);

    try {
      return await ApiClient.get<PatientChart>(
        patientsApi.charts(validatedId, queryString)
      );
    } catch (error: any) {
      throw new Error("환자 차트 조회 실패", error.status);
    }
  }

  private static buildQueryString(query: PatientChartQuery): string {
    const params = new URLSearchParams();
    if (query.keyword) {
      params.append("keyword", query.keyword);
    }
    if (query.isFavoriteOnly) {
      params.append("isFavoriteOnly", query.isFavoriteOnly.toString());
    }
    if (query.receptionType !== undefined && query.receptionType !== null) {
      params.append("receptionType", query.receptionType.toString());
    }
    if (query.isClaim !== undefined && query.isClaim !== null) {
      params.append("isClaim", query.isClaim === 청구.청구 ? "true" : "false");
    }
    if (query.insuranceType !== undefined && query.insuranceType !== null) {
      params.append("insuranceType", query.insuranceType.toString());
    }
    query.orderFilters?.forEach((filter) => {
      params.append("orderFilters", filter.toString());
    });
    if (query.beginDate) {
      params.append("beginDate", query.beginDate);
    }
    if (query.endDate) {
      params.append("endDate", query.endDate);
    }
    if (query.limit) {
      params.append("limit", query.limit.toString());
    }
    if (query.cursor) {
      params.append("cursor", query.cursor.toString());
    }
    return params.toString();
  }

  static async createPatient(
    data: CreatePatientRequest
  ): Promise<CreatePatientResponse> {
    try {
      return await ApiClient.post<CreatePatientResponse>(
        patientsApi.create,
        data
      );
    } catch (error: any) {
      console.error("[PatientsService.createPatient] 에러:", error);
      throw error;
    }
  }

  static async updatePatient(
    id: number,
    data: UpdatePatientRequest
  ): Promise<UpdatePatientResponse> {
    const validatedId = validateId(id, "Patient ID");
    try {
      return await ApiClient.put<UpdatePatientResponse>(
        patientsApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("환자 수정 실패", error.status);
    }
  }

  static async deletePatient(id: number): Promise<DeletePatientResponse> {
    const validatedId = validateId(id, "Patient ID");
    try {
      return await ApiClient.delete<DeletePatientResponse>(
        patientsApi.delete(validatedId)
      );
    } catch (error: any) {
      throw new Error("환자 삭제 실패", error.status);
    }
  }

  static async getMedicalAidList(id: string): Promise<MedicalAid[]> {
    const validatedId = validateId(id, "Patient ID");
    try {
      return await ApiClient.get<MedicalAid[]>(
        patientsApi.medicalAidList(validatedId)
      );
    } catch (error: any) {
      throw new Error("의료급여 목록 조회 실패", error.status);
    }
  }

  static async createMedicalAid(
    id: string,
    data: CreateMedicalAidRequest
  ): Promise<CreateMedicalAidResponse> {
    const validatedId = validateId(id, "Patient ID");
    try {
      return await ApiClient.put<CreateMedicalAidResponse>(
        patientsApi.createMedicalAid(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("의료급여 생성 실패", error.status);
    }
  }

  static async deleteMedicalAid(
    medicalAidId: number
  ): Promise<DeleteMedicalAidResponse> {
    const validatedId = validateId(medicalAidId, "Medical Aid ID");
    try {
      return await ApiClient.delete<DeleteMedicalAidResponse>(
        patientsApi.deleteMedicalAid(validatedId)
      );
    } catch (error: any) {
      throw new Error("의료급여 삭제 실패", error.status);
    }
  }

  /**
   * 환자 처방 목록 조회 (환자ID + 날짜, 선택적으로 처방구분/처방상세구분)
   * date 없으면 오늘, type 없으면 전체 (1:수가, 2:약가, 3:재료대)
   * detailType 없으면 전체, 2 넣으면 검사만 (1:처치, 2:검사, 3:방사선, 4:약, 5:주사, 6:치료재료, 7:물리치료)
   */
  static async getOrdersByPatientAndDate(
    patientId: number,
    params?: { date?: string; type?: number; detailType?: number }
  ): Promise<PatientOrderRow[]> {
    const validatedId = validateId(patientId, "Patient ID");
    const url = patientsApi.orders(validatedId, params);
    return ApiClient.get<PatientOrderRow[]>(url);
  }

  static async checkPatientRrnDuplicate(
    rrn: string,
    excludePatientId?: number
  ): Promise<{ duplicate: boolean }> {
    try {
      const body: { rrn: string; excludePatientId?: number } = { rrn };
      if (excludePatientId != null) body.excludePatientId = excludePatientId;

      const result = await ApiClient.post<any>(patientsApi.checkRrnDuplicate(), body);
      if (typeof result === "boolean") return { duplicate: result };
      return result as { duplicate: boolean };
    } catch (error: any) {
      throw new Error("환자 중복 체크 실패", error.status);
    }
  }
}

/** GET /patients/:id/orders 응답 한 건 (처방) */
export interface PatientOrderRow {
  id?: string | number;
  encounterId?: string | number;
  type?: number;
  name?: string;
  specimenDetail?: Array<{ code?: string }> | null;
  externalLabData?: {
    exams?: Array<{ scodes?: string[] | null }>;
    /** 검사 정보(단일). 검체 코드는 examination.spcCode */
    examination?: { spcCode?: string; spcName?: string };
  };
  encounter?: unknown;
  [key: string]: unknown;
}
