import { ApiClient } from "@/lib/api/api-client";
import { registrationsApi } from "@/lib/api/api-routes";
import type { RegistrationListOptions } from "@/lib/api/routes/registrations-api";
import { comparePositionString } from "@/lib/sort-position";
import { validateId } from "@/lib/validation";
import type {
  CreateRegistrationRequest,
  CreateRegistrationResponse,
  DeleteRegistrationResponse,
  Registration,
  UpdateRegistrationRequest,
  UpdateRegistrationResponse,
} from "@/types/registration-types";

export class RegistrationsService {
  static async getRegistration(id: string): Promise<Registration> {
    const validatedId = validateId(id, "registrationId");
    try {
      return await ApiClient.get<Registration>(`/registrations/${validatedId}`);
    } catch (error: any) {
      throw new Error("등록 조회 실패", error.status);
    }
  }

  static async getRegistrationCharts(id: string): Promise<any> {
    const validatedId = validateId(id, "registrationId");
    try {
      return await ApiClient.get<any>(registrationsApi.charts(validatedId));
    } catch (error: any) {
      throw new Error("등록 차트 조회 실패", error.status);
    }
  }

  static async getRegistrationsByHospital(
    hospitalId: string,
    beginDate: string,
    endDate: string,
    options?: RegistrationListOptions
  ): Promise<Registration[]> {
    const validatedHospitalId = validateId(hospitalId, "hospitalId");
    try {
      const list = await ApiClient.get<Registration[]>(
        registrationsApi.listByHospital(validatedHospitalId, beginDate, endDate, options)
      );
      return [...list].sort((a, b) =>
        comparePositionString(a.position ?? "", b.position ?? "")
      );
    } catch (error: any) {
      throw new Error("병원별 등록 목록 조회 실패", error.status);
    }
  }

  static async getRegistrationsByPatient(
    patientId: string,
    beginDate: string,
    endDate: string
  ): Promise<Registration[]> {
    const validatedPatientId = validateId(patientId, "patientId");
    try {
      return await ApiClient.get<Registration[]>(
        registrationsApi.listByPatient(validatedPatientId, beginDate, endDate)
      );
    } catch (error: any) {
      throw new Error("환자별 접수 목록 조회 실패", error.status);
    }
  }

  static async createRegistration(
    registration: CreateRegistrationRequest
  ): Promise<CreateRegistrationResponse> {
    try {
      return await ApiClient.post<CreateRegistrationResponse>(
        registrationsApi.create,
        registration
      );
    } catch (error: any) {
      throw new Error("접수 생성 실패", error.status);
    }
  }

  static async updateRegistration(
    id: string,
    registration: UpdateRegistrationRequest
  ): Promise<UpdateRegistrationResponse> {
    const validatedId = validateId(id, "registrationId");
    try {
      return await ApiClient.put<UpdateRegistrationResponse>(
        registrationsApi.update(validatedId),
        registration
      );
    } catch (error: any) {
      throw new Error("접수 수정 실패", error.status);
    }
  }

  static async deleteRegistration(
    id: string
  ): Promise<DeleteRegistrationResponse> {
    const validatedId = validateId(id, "registrationId");
    try {
      return await ApiClient.delete<DeleteRegistrationResponse>(
        registrationsApi.delete(validatedId)
      );
    } catch (error: any) {
      // 원본 에러를 그대로 전달
      throw error;
    }
  }

  static async getLatestRegistration(
    patientId: string,
    baseDate?: string
  ): Promise<Registration> {
    const validatedPatientId = validateId(patientId, "patientId");

    try {
      return await ApiClient.get<Registration>(
        registrationsApi.latestRegistration(validatedPatientId, baseDate)
      );
    } catch (error: any) {
      throw new Error("최근 접수 조회 실패", error.status);
    }
  }

  static async moveRegistrationPosition(body: any) {
    try {
      return await ApiClient.put<any>(registrationsApi.movePosition(), body);
    } catch (error: any) {
      throw new Error("접수 순서 변경 실패", error.status);
    }
  }

  static async getRegistrationPatientPrintAvailability(patientId: string, beginDate: string, endDate: string): Promise<any> {
    const validatedPatientId = validateId(patientId, "patientId");
    try {
      return await ApiClient.get<any>(registrationsApi.listPatientPrintAvailability(validatedPatientId, beginDate, endDate));
    } catch (error: any) {
      throw new Error("환자 출력 가능 여부 조회 실패", error.status);
    }
  }
}
