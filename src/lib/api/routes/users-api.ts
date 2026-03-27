export const usersApi = {
  detail: (id: string) => `/users/${id}`,
  list: (hospitalId: string) => `/users/hospitals/${hospitalId}`,
  create: "/users",
  update: (id: string) => `/users/${id}`,
  delete: (id: string) => `/users/${id}`,
};
