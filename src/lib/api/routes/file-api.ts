export const fileApi = {
  uploadV2: "/v2/file-uploads/upload",
  downloadV2: (uuid: string) => `/v2/file-uploads/${uuid}`,
  deleteV2: (uuid: string) => `/v2/file-uploads/${uuid}`,
};
