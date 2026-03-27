export const documentsApi = {
  externalPrescription: (
    encounterId: string,
    options?: { isInpatientInjectionsExcluded?: boolean }
  ) => {
    const basePath = `/documents/encounters/${encounterId}/external-prescription`;
    const queryParams = new URLSearchParams();

    if (options?.isInpatientInjectionsExcluded !== undefined) {
      queryParams.set(
        "isInpatientInjectionsExcluded",
        options.isInpatientInjectionsExcluded ? "true" : "false"
      );
    }

    const queryString = queryParams.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  },
  detailedStatement: (encounterId: string) =>
    `/v1/documents/encounters/${encounterId}/detailed-statement`,
  medicalBillReceipt: (encounterId: string) =>
    `/v1/documents/encounters/${encounterId}/medical-bill-receipt`,
  medicalRecord: (encounterId: string) =>
    `/documents/encounters/${encounterId}/medical-record`,
};

