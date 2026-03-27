export const crmUserMessageTemplateApi = {
  getHierarchy: "/crm-user-message-templates/hierarchy",
  getFolders: "/crm-user-message-templates/folders",
  getTemplatesByFolderId: (folderId: number) =>
    `/crm-user-message-templates/folder/${folderId}/templates`,
  getTemplateById: (id: number) => `/crm-user-message-templates/${id}`,
  createTemplate: "/crm-user-message-templates",
  createFolder: "/crm-user-message-templates/folders",
  updateFolder: (id: number) => `/crm-user-message-templates/folder/${id}`,
  deleteFolder: (id: number) => `/crm-user-message-templates/folder/${id}`,
  updateTemplate: (id: number) => `/crm-user-message-templates/${id}`,
  deleteTemplate: (id: number) => `/crm-user-message-templates/${id}`,
  moveTemplate: (id: number) => `/crm-user-message-templates/${id}/move`,
  moveFolder: (folderId: number) =>
    `/crm-user-message-templates/folder/${folderId}/move`,
};
