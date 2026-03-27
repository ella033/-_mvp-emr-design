export const patientsApi = {
  list: (queryString: string) => `/patients?${queryString}`,
  detail: (id: string) => `/patients/${id}`,
  charts: (id: string, queryString: string) =>
    `/patients/${id}/charts?${queryString}`,
  chartsFilter: (id: string) => `/patients/${id}/charts-filter`,
  create: "/patients",
  update: (id: string) => `/patients/${id}`,
  delete: (id: string) => `/patients/${id}`,
  medicalAidList: (id: string) => `/patients/${id}/medical-aids`,
  createMedicalAid: (id: string) => `/patients/${id}/medical-aid`,
  deleteMedicalAid: (medicalAidId: string) =>
    `/patients/medical-aid/${medicalAidId}`,
  /** 환자 처방 목록 (date 없으면 오늘, type/detailType 없으면 전체. detailType=2 이면 검사만) */
  orders: (
    id: string,
    params?: { date?: string; type?: number; detailType?: number }
  ) => {
    const search = new URLSearchParams();
    if (params?.date) search.set("date", params.date);
    if (params?.type != null) search.set("type", String(params.type));
    if (params?.detailType != null)
      search.set("detailType", String(params.detailType));
    const qs = search.toString();
    return `/patients/${id}/orders${qs ? `?${qs}` : ""}`;
  },
  checkRrnDuplicate: () => `/patients/check-rrn`,
};
