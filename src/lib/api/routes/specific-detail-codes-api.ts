export const specificDetailCodesApi = {
  list: (queryString: string) => `/specific-detail-codes/${queryString}`,
  detail: (code: string) => `/specific-detail-codes/codes/${code}`,
  create: () => `/specific-detail-codes`,
  update: (id: number) => `/specific-detail-codes/${id}`,
  delete: (id: number) => `/specific-detail-codes/${id}`,
};
