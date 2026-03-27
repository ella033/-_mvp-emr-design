export const settingsApi = {
  list: (queryString: string) => `/v1/settings?${queryString}`,
  createOrUpdate: () => `/v1/settings`,
  liveUpdate: () => `/v1/settings`,
  delete: (queryString: string) => `/v1/settings?${queryString}`,
};
