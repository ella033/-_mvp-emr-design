export const formsApi = {
  hierarchy: () => `/forms/hierarchy`,
  favorites: () => `/forms/favorites`,
  favorite: (formId: number | string) => `/forms/favorites/${formId}`,
  search: () => `/forms/search`,
  form: (formId: number | string) => `/forms/${formId}`,
  formWithPatient: (formId: number | string, patientId: number | string) =>
    `/forms/${formId}/${patientId}`,
  fields: () => `/forms/fields`,
  // FIXME: 임시로 ForAdmin API 사용 중이며, 추후 삭제 예정
  fieldsForAdmin: () => `/forms/fields/admin`,
};


