import { ApiClient } from "@/lib/api/api-client";
import { vitalSignMeasurementsApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import { convertToUTCISOStart, convertToUTCISOEnd } from "@/lib/date-utils";
import type {
  CreateVitalSignMeasurementRequest,
  CreateVitalSignMeasurementResponse,
  DeleteUpsertManyVitalSignMeasurementsRequest,
  DeleteUpsertManyVitalSignMeasurementsResponse,
  DeleteVitalSignMeasurementResponse,
  DeleteVitalSignMeasurementsByMeasurementDateTimeRequest,
  UpdateVitalSignMeasurementRequest,
  UpdateVitalSignMeasurementResponse,
  VitalSignMeasurement,
  VitalSignMeasurementPivotResponse,
} from "@/types/vital/vital-sign-measurement-types";

export class VitalSignMeasurementsService {
  static async getVitalSignMeasurements(
    patientId: number,
    beginDate?: string,
    endDate?: string,
    itemId?: number
  ): Promise<VitalSignMeasurement[]> {
    const validatedPatientId = validateId(patientId, "patientId");
    const beginDateISO = beginDate
      ? convertToUTCISOStart(beginDate)
      : undefined;
    const endDateISO = endDate ? convertToUTCISOEnd(endDate) : undefined;
    try {
      return await ApiClient.get<VitalSignMeasurement[]>(
        vitalSignMeasurementsApi.list(
          validatedPatientId,
          beginDateISO,
          endDateISO,
          itemId,
          false
        )
      );
    } catch (error: any) {
      throw new Error(
        "병원별 환자별 바이탈 사인 측정 목록 조회 실패",
        error.status
      );
    }
  }

  static async getVitalSignMeasurementsPivot(
    patientId: number,
    beginDate?: string, // YYYY-MM-DD
    endDate?: string // YYYY-MM-DD
  ): Promise<VitalSignMeasurementPivotResponse> {
    const validatedPatientId = validateId(patientId, "patientId");
    const beginDateISO = beginDate
      ? convertToUTCISOStart(beginDate)
      : undefined;
    const endDateISO = endDate ? convertToUTCISOEnd(endDate) : undefined;
    try {
      return await ApiClient.get<VitalSignMeasurementPivotResponse>(
        vitalSignMeasurementsApi.list(
          validatedPatientId,
          beginDateISO,
          endDateISO,
          undefined,
          true
        )
      );
    } catch (error: any) {
      throw new Error(
        "병원별 환자별 바이탈 사인 측정 목록 조회 실패",
        error.status
      );
    }
  }

  static async createVitalSignMeasurement(
    data: CreateVitalSignMeasurementRequest
  ): Promise<CreateVitalSignMeasurementResponse> {
    try {
      return await ApiClient.post<CreateVitalSignMeasurementResponse>(
        vitalSignMeasurementsApi.create,
        data
      );
    } catch (error: any) {
      throw new Error("바이탈 사인 측정 생성 실패", error.status);
    }
  }
  static async deleteUpsertManyVitalSignMeasurements(
    patientId: number,
    beginDate: string,
    endDate: string,
    data: DeleteUpsertManyVitalSignMeasurementsRequest
  ): Promise<DeleteUpsertManyVitalSignMeasurementsResponse> {
    const validatedPatientId = validateId(patientId, "patientId");
    const beginDateISO = convertToUTCISOStart(beginDate);
    const endDateISO = convertToUTCISOEnd(endDate);
    try {
      return await ApiClient.post<DeleteUpsertManyVitalSignMeasurementsResponse>(
        vitalSignMeasurementsApi.deleteUpsertMany(
          validatedPatientId,
          beginDateISO,
          endDateISO
        ),
        data
      );
    } catch (error: any) {
      throw new Error(
        "병원별 환자별 바이탈 사인 측정 삭제 및 업데이트 실패",
        error.status
      );
    }
  }
  static async updateVitalSignMeasurement(
    id: string,
    data: UpdateVitalSignMeasurementRequest
  ): Promise<UpdateVitalSignMeasurementResponse> {
    const validatedId = validateId(id, "vitalSignMeasurementId");
    try {
      return await ApiClient.put<UpdateVitalSignMeasurementResponse>(
        vitalSignMeasurementsApi.update(validatedId),
        data
      );
    } catch (error: any) {
      throw new Error("바이탈 사인 측정 수정 실패", error.status);
    }
  }
  static async deleteVitalSignMeasurement(
    id: string
  ): Promise<DeleteVitalSignMeasurementResponse> {
    const validatedId = validateId(id, "vitalSignMeasurementId");
    try {
      return await ApiClient.delete<DeleteVitalSignMeasurementResponse>(
        vitalSignMeasurementsApi.delete(validatedId)
      );
    } catch (error: any) {
      throw new Error("바이탈 사인 측정 삭제 실패", error.status);
    }
  }
  static async deleteVitalSignMeasurementsByMeasurementDateTime(
    patientId: number,
    data: DeleteVitalSignMeasurementsByMeasurementDateTimeRequest
  ): Promise<any> {
    const validatedPatientId = validateId(patientId, "patientId");

    try {
      return await ApiClient.delete<any>(
        vitalSignMeasurementsApi.deleteByMeasurementDateTime(
          validatedPatientId
        ),
        data
      );
    } catch (error: any) {
      throw new Error("바이탈 사인 측정 삭제 실패", error.status);
    }
  }
}
