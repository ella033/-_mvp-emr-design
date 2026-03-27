import { ApiClient } from "@/lib/api/api-client";
import {
  CreateUserInvitationDto,
  CreateUserInvitationResponseDto,
  GetHospitalUserDetailResponseDto,
  GetHospitalUsersResponseDto,
  GetRolesResponseDto,
  GetUserInvitationsResponseDto,
  UpdateHospitalUserStatusDto
} from '../model';

export const userManagementApi = {
  // User Invitations
  inviteUser: async (data: CreateUserInvitationDto): Promise<CreateUserInvitationResponseDto> => {
    return await ApiClient.post<CreateUserInvitationResponseDto>('/user-invitations', data);
  },

  getInvitations: async (term?: string, status?: number): Promise<GetUserInvitationsResponseDto[]> => {
    const params: any = {};
    if (term) params.term = term;
    if (status) params.status = status.toString();

    return await ApiClient.get<GetUserInvitationsResponseDto[]>('/user-invitations', params);
  },

  getInvitationDetail: async (id: number): Promise<any> => {
    return await ApiClient.get<any>(`/user-invitations/${id}`);
  },

  // Hospital Users
  getHospitalUsers: async (search?: string): Promise<GetHospitalUsersResponseDto[]> => {
    const params: any = {};
    if (search) params.search = search;

    return await ApiClient.get<GetHospitalUsersResponseDto[]>('/hospital-users', params);
  },

  getUserDetail: async (userId: number): Promise<GetHospitalUserDetailResponseDto> => {
    return await ApiClient.get<GetHospitalUserDetailResponseDto>(`/hospital-users/${userId}`);
  },

  updateUserDetail: async (userId: number, data: any): Promise<void> => {
    return await ApiClient.put(`/users/${userId}`, data);
  },

  updateUserStatus: async (userId: number, data: UpdateHospitalUserStatusDto): Promise<void> => {
    await ApiClient.patch(`/hospital-users/${userId}/status`, data);
  },

  // Roles
  getRoles: async (): Promise<GetRolesResponseDto[]> => {
    return await ApiClient.get<GetRolesResponseDto[]>('/permissions/roles');
  },

  // Invitation Actions
  resendInvitation: async (id: number): Promise<void> => {
    await ApiClient.patch(`/user-invitations/${id}/resend`);
  },

  cancelInvitation: async (id: number): Promise<void> => {
    await ApiClient.patch(`/user-invitations/${id}/cancel`);
  },

  deleteInvitation: async (id: number): Promise<void> => {
    await ApiClient.delete(`/user-invitations/${id}`);
  },

  deleteUser: async (userId: number): Promise<void> => {
    await ApiClient.delete(`/hospital-users/${userId}`);
  }
};
