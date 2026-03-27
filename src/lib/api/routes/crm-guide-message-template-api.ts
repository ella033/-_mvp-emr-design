export const crmGuideMessageTemplateApi = {
  getFolders: "/crm-guide-message-templates/folders",
  getTemplatesByFolderId: (folderId: number) =>
    `/crm-guide-message-templates/folder/${folderId}/templates`,
};
