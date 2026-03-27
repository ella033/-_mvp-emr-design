export const hospitalChatsApi = {
  rooms: '/v1/hospital-chats/rooms',
  createRoom: '/v1/hospital-chats/rooms',
  room: (roomId: number) => `/v1/hospital-chats/rooms/${roomId}`,
  updateRoom: (roomId: number) => `/v1/hospital-chats/rooms/${roomId}`,
  deleteRoom: (roomId: number) => `/v1/hospital-chats/rooms/${roomId}`,
  addMembers: (roomId: number) => `/v1/hospital-chats/rooms/${roomId}/members`,
  removeMember: (roomId: number, userId: number) =>
    `/v1/hospital-chats/rooms/${roomId}/members/${userId}`,
  messages: (roomId: number) => `/v1/hospital-chats/rooms/${roomId}/messages`,
  createMessage: (roomId: number) =>
    `/v1/hospital-chats/rooms/${roomId}/messages`,
  updateMessage: (roomId: number, msgId: number) =>
    `/v1/hospital-chats/rooms/${roomId}/messages/${msgId}`,
  deleteMessage: (roomId: number, msgId: number) =>
    `/v1/hospital-chats/rooms/${roomId}/messages/${msgId}`,
  pinnedMessages: (roomId: number) =>
    `/v1/hospital-chats/rooms/${roomId}/pinned`,
  togglePin: (roomId: number, msgId: number) =>
    `/v1/hospital-chats/rooms/${roomId}/messages/${msgId}/pin`,
  markAsRead: (roomId: number) => `/v1/hospital-chats/rooms/${roomId}/read`,
  mentionPatients: '/v1/hospital-chats/mention-patients',
};
