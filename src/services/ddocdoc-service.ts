import { ApiClient } from "@/lib/api/api-client";
import { ddocdocApi } from "@/lib/api/api-routes";
import type { components, operations } from "@/generated/api/types";

// Job Process 타입
export interface DdocDocJobProcess {
  state: string;
  createdAt: string;
  updatedAt: string;
}

// Job Payload 타입
export interface DdocDocJobPayload {
  _id: string;
  state: string;
  hospital: string;
  userId: string;
  familyMemberId: string | null;
  nationalInfo: number;
  unitKey: string;
  unitTitle: string;
  roomKey: string;
  roomTitle: string;
  doctorKey: string;
  doctorTitle: string;
  userName: string;
  parentName: string;
  userPhone: string;
  birthDate: string;
  gender: "M" | "F";
  symptomText: string;
  denyReason: string | null;
  confirmReservationDatetime: string | null;
  processes: DdocDocJobProcess[];
  newPatient: boolean;
  createdAt: string;
  updatedAt: string;
  timeUnit: number;
  visitType: string;
  prescriptionDrugStoreType: string;
  serialNumber: string;
  familyType: string;
  isAgreedPaper: boolean;
  type: string;
  requestDatetime: string;
  confirmDatetime: string | null;
  changeMessage: string | null;
  paymentType: string;
  payMethod: string | null;
  isAgreePrescription: boolean;
  isAgreeFee: boolean;
  isAgreeFeeDetail: boolean;
}

// Job 응답 타입
export interface DdocDocJob {
  _id: string;
  createdAt: string;
  updatedAt: string;
  hospital: string;
  service: string;
  operation: string;
  payload: DdocDocJobPayload;
  active: boolean;
  manual: boolean;
}

// API 응답은 배열로 반환됨
export type DdocDocJobsResponse = DdocDocJob[];

// generated 타입 사용
export type UpdateReservationStateRequest =
  components["schemas"]["UpdateReservationStateDto"];
export type ReservationState = components["schemas"]["ReservationState"];

export class DdocDocService {
  /**
   * 일감 목록 조회
   * @description /api/ddocdoc/jobs로 일감 목록을 조회합니다.
   * @param service - 서비스 타입 (기본값: "RESERVATION")
   */
  static async getJobs(service: string = "RESERVATION"): Promise<DdocDocJob[]> {
    try {
      const params = new URLSearchParams({ service });
      const url = `${ddocdocApi.jobs()}?${params.toString()}`;

      // API는 배열을 직접 반환함 (generated 타입에 응답 타입이 명시되지 않아 커스텀 타입 유지)
      return await ApiClient.get<DdocDocJob[]>(url);
    } catch (error: any) {
      throw new Error("일감 조회 실패", error.status);
    }
  }

  /**
   * 예약 상태 업데이트
   * @description /api/ddocdoc/reservations/{reservationId}로 예약 상태를 업데이트합니다.
   * @param reservationId - 예약 ID (job.payload._id)
   * @param data - 예약 상태 업데이트 데이터
   */
  /**
   * 사전문진 URL 조회
   * @param appointmentId - 예약 ID
   * @returns 사전문진 페이지 URL
   */
  static async getHealthCheckUrl(appointmentId: string): Promise<string> {
    try {
      const url = ddocdocApi.healthCheckUrl(appointmentId);
      const response = await ApiClient.get<{ url: string }>(url);
      return response.url;
    } catch (error: any) {
      throw new Error("사전문진 URL 조회 실패", error.status);
    }
  }

  static async updateReservationState(
    reservationId: string,
    data: components["schemas"]["UpdateReservationStateDto"]
  ): Promise<void> {
    try {
      const url = ddocdocApi.updateReservation(reservationId);
      await ApiClient.patch<
        operations["DdocdocApiController_updateReservationState"]["responses"]["200"]
      >(url, data);
    } catch (error: any) {
      throw new Error("예약 상태 업데이트 실패", error.status);
    }
  }
}
