import { ApiClient } from "@/lib/api/api-client";
import { labOrdersApi, registrationsApi } from "@/lib/api/api-routes";
import { PatientsService } from "./patients-service";

export type ExternalLabOrderStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "SENT"
  | "WAITING"
  | string;

export type ExaminationStatus = "WAITING" | "COMPLETED" | "FAILED" | string;
export type TransmissionStatus = "PENDING" | "SENT" | "COMPLETED" | "FAILED" | string;

export interface ExternalLabOrderExamination {
  id: string;
  name: string;
  type: string;
  ename: string;
  ubCode: string;
  spcCode: string;
  spcName: string;
  claimCode: string;
  description: string | null;
  ubClaimCode: string;
  externalLabId: string;
  createDateTime: string;
  updateDateTime: string | null;
  examinationCode: string;
}

export interface ExternalLabOrderExternalLab {
  id: string;
  code: string;
  name: string;
  isEnabled: boolean;
  currentGrade: string | null;
  isSystemProvided: boolean;
  externalLabHospitalMappingId: string;
}

export interface ExternalLabOrderExamRawData {
  examination: ExternalLabOrderExamination;
  externalLab: ExternalLabOrderExternalLab;
  snapshotDateTime: string;
}

export interface ExternalLabOrderExam {
  id: string;
  externalLabOrderRequestId: string;
  patientId: number;
  stdCode: string;
  stdCodeName: string;
  exGubun: string;
  rtype: string;
  reqId: string;
  dup: string;
  gumjin: string;
  pcode: string;
  trcode: string;
  cgcode: string;
  subject: string;
  doctorName: string;
  enckey: string;
  scodes: string[] | null;
  rawData: ExternalLabOrderExamRawData | null;
  responseData: unknown;
  status: string;
  errorCode: string | null;
  errorMessage: string | null;
  responseDateTime: string | null;
  order?: {
    id: string;
    name: string;
    claimCode: string;
    externalLabData?: ExternalLabOrderExamRawData | null;
    [key: string]: unknown;
  };
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
  deleteId: number | null;
  deleteDateTime: string | null;
}

export interface ExternalLabOrderPatient {
  id: number;
  patientNo?: string | number | null;
  name: string;
  rrn: string;
  isTemporary: boolean;
  birthDate: string;
  gender: number;
}

export interface ExternalLabOrderDoctor {
  name: string;
}

export interface ExternalLabOrderEncounter {
  doctor: ExternalLabOrderDoctor;
  registration?: {
    id?: string;
    patientRoute?: {
      examination?: {
        has: boolean;
        status: string;
      };
    };
  };
}

export interface ExternalLabOrderOrder {
  examType: string | null;
  createDateTime: string;
}

export interface ExternalLabOrderLibrary {
  id: string;
  hospitalId: number | null;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createId: number | null;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
}

export interface ExternalLabOrderHospitalMapping {
  id: string;
  hospitalId: number;
  externalLabId: string;
  isEnabled: boolean;
  createId: number;
  createDateTime: string;
  updateId: number;
  updateDateTime: string;
  library: ExternalLabOrderLibrary;
}

export interface ExternalLabOrder {
  id: string;
  hospitalId: number;
  externalLabHospitalMappingId: string;
  orderId: string;
  encounterId: string;
  patientId: number;
  companyId: string;
  hosNum: string;
  orderDate: string;
  patientName: string;
  sex: "M" | "F" | string;
  isSystemProvided: boolean;
  requestDateTime: string | null;
  rawData: any;
  status: ExternalLabOrderStatus;
  createId: number;
  createDateTime: string;
  updateId: number;
  updateDateTime: string;
  deleteId: number | null;
  deleteDateTime: string | null;
  externalLabHospitalMapping: ExternalLabOrderHospitalMapping;
  patient: ExternalLabOrderPatient;
  exams: ExternalLabOrderExam[];
  order: ExternalLabOrderOrder;
  encounter: ExternalLabOrderEncounter;
}

export interface GetExternalLabOrdersParams {
  status?: string;
  limit?: number;
  treatmentDateFrom: string;
  treatmentDateTo: string;
  mappingId?: string;
  gumjin?: string;
}

export interface SendExternalLabOrdersParams {
  ids: number[];
}

export interface SendExternalLabOrdersResponse {
  success: boolean;
  successCount?: number;
  failCount?: number;
  failedPatients?: Array<{
    id: string;
    patientName: string;
    errorMessage?: string;
  }>;
  errorMessage?: string;
}

export interface UpdateExternalLabOrderStatusParams {
  status: "WAITING" | "COMPLETED";
}

export class LabOrdersService {
  static async getExternalLabOrders(
    params: GetExternalLabOrdersParams
  ): Promise<ExternalLabOrder[]> {
    const query: Record<string, string> = {
      treatmentDateFrom: params.treatmentDateFrom,
      treatmentDateTo: params.treatmentDateTo,
    };

    if (params.status) {
      query.status = params.status;
    }

    if (typeof params.limit === "number") {
      query.limit = String(params.limit);
    }

    if (params.mappingId) {
      query.mappingId = params.mappingId;
    }

    if (params.gumjin) {
      query.gumjin = params.gumjin;
    }

    const response = await ApiClient.get<ExternalLabOrder[]>(
      labOrdersApi.getExternalLabOrders,
      query
    );

    return response;
  }

  /**
   * 환자ID·날짜 기준 검사 처방에서 검체 코드만 중복 없이 추출 (검사 라벨 기본 선택용).
   * - 검사 정보가 있는 order만 사용: externalLabData.examination.spcCode 또는 specimenDetail[].code
   * - 반환 형태는 collectSpecimenCodesFromOrders 와 호환.
   */
  static async getExternalLabOrdersByPatientAndDate(
    patientId: number,
    date?: string
  ): Promise<Array<{ exams?: Array<{ scodes?: string[] | null }> }>> {
    const rows = await PatientsService.getOrdersByPatientAndDate(patientId, {
      date,
      detailType: 2, // 검사만 (처방상세구분.검사)
    });
    const specimenCodes = new Set<string>();
    for (const row of rows) {
      if (row.externalLabData?.examination?.spcCode != null) {
        const code = String(row.externalLabData.examination.spcCode).trim();
        if (code !== "") specimenCodes.add(code);
      }
      if (row.externalLabData?.exams?.length) {
        for (const e of row.externalLabData.exams) {
          for (const code of e.scodes ?? []) {
            if (code != null && String(code).trim() !== "") specimenCodes.add(String(code).trim());
          }
        }
      }
      if (row.specimenDetail && Array.isArray(row.specimenDetail)) {
        for (const s of row.specimenDetail) {
          if (s?.code != null && String(s.code).trim() !== "")
            specimenCodes.add(String(s.code).trim());
        }
      }
    }
    if (specimenCodes.size === 0) return [];
    return [{ exams: [{ scodes: Array.from(specimenCodes) }] }];
  }

  static async sendExternalLabOrders(
    params: SendExternalLabOrdersParams
  ): Promise<SendExternalLabOrdersResponse> {
    return await ApiClient.post<SendExternalLabOrdersResponse>(
      labOrdersApi.sendExternalLabOrders,
      params
    );
  }

  static async updateStatus(id: string, params: UpdateExternalLabOrderStatusParams): Promise<void> {
    return await ApiClient.patch<void>(labOrdersApi.updateStatus(id), params);
  }

  static async updatePatientRouteStatus(
    registrationId: string,
    examinationStatus: "WAITING" | "COMPLETED"
  ): Promise<void> {
    return await ApiClient.put<void>(registrationsApi.updatePatientRouteStatus(registrationId), {
      examination: { status: examinationStatus },
    });
  }
}
