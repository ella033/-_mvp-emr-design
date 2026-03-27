export const appointmentTypesApi = {
  list: "/v1/appointment-types",
  detail: (id: string) => `/v1/appointment-types/${id}`,
  create: "/v1/appointment-types",
  update: (id: string) => `/v1/appointment-types/${id}`,
  delete: (id: string) => `/v1/appointment-types/${id}`,
  connect: (id: string, roomId: string) => `/v1/appointment-types/${id}/rooms/${roomId}/connect`,
  disconnect: (id: string, roomId: string) => `/v1/appointment-types/${id}/rooms/${roomId}/disconnect`,

};
