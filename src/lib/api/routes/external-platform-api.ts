export const externalPlatformApi = {
  list: "/external-platform",
  one: (platformCode: string) => `/external-platform/${platformCode}`,
  create: "/external-platform",
  update: (platformCode: string) => `/external-platform/${platformCode}`,
  remove: (platformCode: string) => `/external-platform/${platformCode}`,
};
