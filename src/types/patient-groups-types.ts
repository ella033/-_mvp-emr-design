/**
 * 환자 그룹 API 타입
 */
import type { BenefitPatientGroupRef } from "@/types/benefits-types";

/** 환자 그룹 목록/상세 API 응답 항목 */
export interface PatientGroup {
  id: number;
  hospitalId: number;
  name: string;
  createId: number | null;
  createDateTime: string | null;
  updateId: number | null;
  updateDateTime: string | null;
  deleteId: number | null;
  deleteDateTime: string | null;
  benefits: BenefitPatientGroupRef[];
}

/** 환자 그룹 생성 요청 (benefitId 없으면 그룹만 생성) */
export interface CreatePatientGroupRequest {
  name: string;
  benefitId?: number;
}

/** 환자 그룹 수정 요청 */
export type UpdatePatientGroupRequest = Partial<CreatePatientGroupRequest>;

/** 환자 그룹 목록 API 응답 */
export type GetPatientGroupsResponse = PatientGroup[];
