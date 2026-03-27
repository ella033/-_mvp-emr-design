export const registrationKeys = {
  all: ["registrations"] as const,

  /**
   * 병원 + 기간(UTC) 기준 등록 목록
   * NOTE: 소켓 동기화/리패치 기준으로 가장 많이 쓰이는 키
   */
  byHospital: (
    hospitalId: string,
    beginUTC: string | null,
    endUTC: string | null,
    examHas?: unknown
  ) =>
    [
      ...registrationKeys.all,
      "hospital",
      hospitalId,
      beginUTC,
      endUTC,
      examHas ?? null,
    ] as const,

  /**
   * 환자 + 기간(UTC) 기준 등록 목록 (보험이력 등)
   */
  byPatientRange: (patientId: string, beginUTC: string | null, endUTC: string | null) =>
    [...registrationKeys.all, "patient", patientId, beginUTC, endUTC] as const,

  /**
   * 환자 + 기간(UTC) 기준 등록 목록 (출력센터 전용)
   */
  byPatientPrintRange: (
    patientId: string,
    beginUTC: string | null,
    endUTC: string | null
  ) => [...registrationKeys.all, "patient-print", patientId, beginUTC, endUTC] as const,

  /**
   * 환자 최신 등록(또는 baseDate 기준 최신)
   */
  latestByPatient: (patientId: string) =>
    [...registrationKeys.all, "latest", patientId] as const,
  latest: (patientId: string, baseDate?: string | null) =>
    [...registrationKeys.latestByPatient(patientId), baseDate ?? null] as const,
} as const;


