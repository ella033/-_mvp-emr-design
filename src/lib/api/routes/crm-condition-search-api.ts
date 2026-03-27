export const crmConditionSearchApi = {
  searchPatients: "/crm-send-target-conditions/patients",
  getConditions: "/crm-send-target-conditions",
  createCondition: "/crm-send-target-conditions",
  getConditionById: (id: number) => `/crm-send-target-conditions/${id}`,
  deleteCondition: (id: number) => `/crm-send-target-conditions/${id}`,
};
