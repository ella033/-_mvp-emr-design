export const vitalSignMeasurementsApi = {
  list: (
    patientId: string,
    beginDate?: string,
    endDate?: string,
    itemId?: number,
    pivot?: boolean
  ) => {
    const params = new URLSearchParams();
    if (beginDate) params.append("beginDate", beginDate);
    if (endDate) params.append("endDate", endDate);
    if (itemId) params.append("itemId", itemId.toString());
    if (pivot) params.append("pivot", "true");
    const queryString = params.toString();
    return `/vital-sign-measurements/patients/${patientId}${queryString ? `?${queryString}` : ""}`;
  },
  create: "/vital-sign-measurements",
  deleteUpsertMany: (patientId: string, beginDate: string, endDate: string) =>
    `/vital-sign-measurements/patients/${patientId}/delete-upsert-many?beginDate=${beginDate}&endDate=${endDate}`,
  update: (id: string) => `/vital-sign-measurements/${id}`,
  delete: (id: string) => `/vital-sign-measurements/${id}`,
  deleteByMeasurementDateTime: (patientId: string) =>
    `/vital-sign-measurements/patients/${patientId}/measurements`,
};
