export const invitationsApi = {
  verifyInvitation: (invitationId: string) =>
    `/invitations/verify/${invitationId}`,
  getInvitation: (invitationId: string) => `/invitations/${invitationId}`,
};

