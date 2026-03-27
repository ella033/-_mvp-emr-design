export const externalLabApi = {
  getLabs: "/external-labs",
  updateLabMapping: "/external-lab-hospital-mappings",
  createLab: "/external-labs",
  createLabGrade: (id: string) => `/external-labs/${id}/grades`,
  deleteLab: (id: string) => `/external-labs/${id}`,
  deleteLabGrade: (id: string, gradeId: string) =>
    `/external-labs/${id}/grades/${gradeId}`,
  updateLabGrade: (id: string, gradeId: string) =>
    `/external-labs/${id}/grades/${gradeId}`,
  updateLab: (id: string) => `/external-labs/${id}`,
  getExaminations: (id: string) => `/external-labs/${id}/examinations`,
};

