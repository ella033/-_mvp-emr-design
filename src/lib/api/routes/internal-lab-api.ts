export const internalLabApi = {
  getGrades: "/internal-lab/quality-grades",
  createGrade: "/internal-lab/quality-grades",
  updateGrade: (id: string) => `/internal-lab/quality-grades/${id}`,
  deleteGrade: (id: string) => `/internal-lab/quality-grades/${id}`,
};

