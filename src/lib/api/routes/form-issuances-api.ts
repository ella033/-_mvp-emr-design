export const formIssuancesApi = {
  list: () => `/form-issuances`,
  detail: (issuanceId: number | string) => `/form-issuances/${issuanceId}`,
};


