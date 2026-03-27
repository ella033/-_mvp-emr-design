export const appointmentsApi = {
  listByHospital: (hospitalId: string, beginDate: string, endDate: string) =>
    `/v2/appointments/hospitals/${hospitalId}?beginDate=${beginDate}&endDate=${endDate}`,
  listByPatient: (patientId: string, beginDate: string, endDate: string) =>
    `/v2/appointments/patients/${patientId}?beginDate=${beginDate}&endDate=${endDate}`,
  detail: (id: string) => `/v2/appointments/${id}`,
  create: "/v2/appointments",
  update: (id: string) => `/v2/appointments/${id}`,
  updateStatus: (id: string) => `/v2/appointments/${id}/status`,
  delete: (id: string) => `/v2/appointments/${id}`,
  checkHolidayConflicts: "/v2/appointments/check-holiday-conflicts",
  checkOperatingHoursConflicts: "/v2/appointments/check-operating-hours-conflicts",
  listHistoryByPatient: (patientId: string) =>
    `/v2/appointments/patients/${patientId}/history`,
};
