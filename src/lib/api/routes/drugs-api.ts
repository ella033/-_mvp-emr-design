export const drugsApi = {
  detail: (id: string) => `/drugs/${id}`,
  approvalDetails: (id: string) => `/drugs/${id}/approval-details`,
  listApprovals: (id: string) => `/drugs/${id}/approvals`,
  ingredientDetails: (id: string) => `/drugs/${id}/ingredient-details`,
};
