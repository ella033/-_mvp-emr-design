export const departmentPositionApi = {
  listByDepartment: (departmentId: string) =>
    `/department-positions/departments/${departmentId}`,
  create: "/department-positions",
  update: (id: string) => `/department-positions/${id}`,
  delete: (id: string) => `/department-positions/${id}`,
};
