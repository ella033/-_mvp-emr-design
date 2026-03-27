import type { 초재진 } from "@/constants/common/common-enum";
import { ApiClient } from "@/lib/api/api-client";
import { encountersApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type { Encounter, EncounterIssuanceNumberResponse } from "@/types/chart/encounter-types";
import type {
  CreateEncounterRequest,
  CreateEncounterResponse,
  DeleteEncounterResponse,
  UpdateEncounterRequest,
  UpdateEncounterResponse,
} from "@/types/chart/encounter-types";

export class EncountersService {
  static async getEncounter(id: string): Promise<Encounter> {
    const validatedId = validateId(id, "encounterId");
    try {
      const result = await ApiClient.get<Encounter>(encountersApi.detail(validatedId));
      return result;
    } catch (error: any) {
      throw new Error("진료 기록 조회 실패", error.status);
    }
  }

  static async getEncountersByPatient(
    patientId: string,
    beginDate: string,
    endDate: string
  ): Promise<any[]> {
    const validatedPatientId = validateId(patientId, "patientId");
    try {
      return await ApiClient.get<any[]>(
        encountersApi.listByPatient(validatedPatientId, beginDate, endDate)
      );
    } catch (error: any) {
      throw new Error("환자별 진료 기록 조회 실패", error.status);
    }
  }

  static async getEncounterIssuanceNumber(
    id: string,
    isRegenerate: boolean = false
  ): Promise<EncounterIssuanceNumberResponse> {
    const validatedId = validateId(id, "encounterId");
    try {
      return await ApiClient.get<EncounterIssuanceNumberResponse>(
        encountersApi.issuanceNumber(validatedId, isRegenerate)
      );
    } catch (error: any) {
      throw new Error("진료 기록 발행 번호 조회 실패", error.status);
    }
  }

  static async getEncountersByRegistration(
    registrationId: string,
    beginDate: string,
    endDate: string
  ): Promise<Encounter[]> {
    const validatedRegistrationId = validateId(registrationId, "registrationId");
    try {
      return await ApiClient.get<Encounter[]>(
        encountersApi.listByRegistration(validatedRegistrationId, beginDate, endDate)
      );
    } catch (error: any) {
      throw new Error("등록별 진료 기록 조회 실패", error.status);
    }
  }

  static async createEncounter(data: CreateEncounterRequest): Promise<CreateEncounterResponse> {
    try {
      const result = await ApiClient.post<CreateEncounterResponse>(encountersApi.create, data);
      return result;
    } catch (error: any) {
      throw new Error("진료 기록 생성 실패", error.status);
    }
  }

  static async updateEncounter(
    id: string,
    data: UpdateEncounterRequest,
    options?: { skipClaimSync?: boolean }
  ): Promise<UpdateEncounterResponse> {
    const validatedId = validateId(id, "encounterId");
    try {
      const result = await ApiClient.put<UpdateEncounterResponse>(
        encountersApi.update(validatedId, options),
        data
      );

      return result;
    } catch (error: any) {
      throw new Error("진료 기록 수정 실패", error.status);
    }
  }

  static async syncEncounterClaimDetail(id: string): Promise<void> {
    const validatedId = validateId(id, "encounterId");
    try {
      await ApiClient.post<{ success: boolean }>(encountersApi.syncClaimDetail(validatedId), {});
    } catch (error: any) {
      throw new Error("명세서 동기화 실패", error.status);
    }
  }

  static async deleteEncounter(id: string): Promise<DeleteEncounterResponse> {
    const validatedId = validateId(id, "encounterId");
    try {
      const result = await ApiClient.delete<DeleteEncounterResponse>(
        encountersApi.delete(validatedId)
      );

      return result;
    } catch (error: any) {
      throw new Error("진료 기록 삭제 실패", error.status);
    }
  }

  static async getCheckRevisit(patientId: string, baseDate: string): Promise<초재진> {
    const validatedPatientId = validateId(patientId, "patientId");
    try {
      return await ApiClient.get<초재진>(encountersApi.checkRevisit(validatedPatientId, baseDate));
    } catch (error: any) {
      throw new Error("초재진 조회 실패", error.status);
    }
  }

  static async updateIssuanceNumber(
    id: string,
    data: { issuanceNumber: string }
  ): Promise<Encounter> {
    const validatedId = validateId(id, "encounterId");
    try {
      return await ApiClient.put<Encounter>(encountersApi.updateIssuanceNumber(validatedId), data);
    } catch (error: any) {
      throw error;
    }
  }
}
