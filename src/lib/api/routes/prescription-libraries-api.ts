export const prescriptionLibrariesApi = {
  list: (queryString: string) => `/prescription-libraries?${queryString}`,
  detail: (type: number, typePrescriptionLibraryId: number) =>
    `/prescription-libraries/${type}/${typePrescriptionLibraryId}`,
  detailById: (id: number) => `/prescription-libraries/${id}`,
};
