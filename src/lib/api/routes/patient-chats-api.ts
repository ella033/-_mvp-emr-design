export const patientChatsApi = {
  list: '/v1/patient-chats',
  pinned: '/v1/patient-chats/pinned',
  create: '/v1/patient-chats',
  update: (id: number) => `/v1/patient-chats/${id}`,
  delete: (id: number) => `/v1/patient-chats/${id}`,
};
