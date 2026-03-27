export const hospitalsApi = {
  list: "/hospitals",
  detail: (id: string) => `/hospitals/${id}`,
  create: "/hospitals",
  createWithCredential: "/hospitals/create-with-credential",
  update: (id: string) => `/hospitals/${id}`,
  delete: (id: string) => `/hospitals/${id}`,
  syncHolidays: (id: string) => `/hospitals/${id}/holidays/sync`,
  syncOperatingHours: (id: string) => `/hospitals/${id}/operating-hours/sync`,
  updateInternalLabInfo: (id: string) => `/hospitals/${id}/internal-lab-info`,
};
