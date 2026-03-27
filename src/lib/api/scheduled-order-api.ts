export const scheduledOrderApi = {
  // 예약 처방 상세 조회
  detail: (id: number, baseDate: string) =>
    `/scheduled-orders/${id}?baseDate=${baseDate}`,
  // 환자별 예약 처방 목록 조회
  listByPatient: (patientId: number, baseDate: string) =>
    `/scheduled-orders/patients/${patientId}?baseDate=${baseDate}`,
  // 예약 처방 생성
  create: "/scheduled-orders",
  deleteUpsertMany: (patientId: number) =>
    `/scheduled-orders/patients/${patientId}/delete-upsert-many`,
  // 예약 처방 수정
  update: (id: number) => `/scheduled-orders/${id}`,
  // 예약 처방 삭제
  delete: (id: number) => `/scheduled-orders/${id}`,
};
