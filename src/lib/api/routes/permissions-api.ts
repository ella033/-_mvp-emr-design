export const permissionsApi = {
  roles: "/permissions/roles",
  roleDetail: (roleId: string) => `/permissions/roles/${roleId}`,
  rolePermissions: (roleId: string) =>
    `/permissions/roles/${roleId}/permissions`,
  roleUsers: (roleId: string) => `/permissions/roles/${roleId}/users`,
  userRole: "/permissions/users/role",
};
