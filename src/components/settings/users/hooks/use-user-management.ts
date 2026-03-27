import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userManagementApi } from "../api/user.api";
import { ApiUserStatus, ExtendedUser, UpdateHospitalUserStatusDto, UserStatus, type HospitalUser, type InvitationUser } from "../model";

// Map API status number to Frontend UserStatus enum
const mapStatus = (status: number): UserStatus => {
  switch (status) {
    case 1: return UserStatus.INVITING; // 초대중
    case 2: return UserStatus.ACTIVE;   // 초대완료 -> 사용중
    case 3: return UserStatus.EXPIRED;  // 초대취소 -> 만료/취소 (UI에 취소 상태가 없다면 만료로 처리)
    case 9: return UserStatus.EXPIRED;  // 초대만료
    case 10: return UserStatus.ACTIVE;  // 사용중
    case 20: return UserStatus.SUSPENDED; // 사용정지
    case 90: return UserStatus.TERMINATED; // 사용종료
    default: return UserStatus.ACTIVE;
  }
};

const mapToExtendedUser = (item: any): ExtendedUser => {
  const isInvitation = item.status === 1 || item.status === 9 || item.status === 3; // INVITING, EXPIRED, CANCELED

  const base = {
    id: item.userId || item.invitedId || Math.random(),
    email: item.email,
    name: item.name,
    roleName: item.roleName,
    uiStatus: mapStatus(item.status),
    createDateTime: item.createDateTime,
    type: (item.typeName || "일반") as any,
  };

  if (isInvitation) {
    return {
      ...base,
      kind: "INVITATION",
      invitedId: item.invitedId,
      invitationDate: item.createDateTime,
      endDate: item.expiresAt,
      statusName: item.statusName // If available
    } as InvitationUser;
  } else {
    return {
      ...base,
      kind: "HOSPITAL_USER",
      userId: item.userId || item.id,
      nameEn: item.nameEn,
      positionName: item.typeName,
      isActive: item.status === 10 || item.status === 2,
      // ... allow other fields to pass through if they exist in item
      ...item
    } as HospitalUser;
  }
};

import { useToastHelpers } from "@/components/ui/toast";

export const useUserManagement = (_hospitalId: number) => {
  const queryClient = useQueryClient();
  const { success, error: errorToast } = useToastHelpers();

  // Fetch Users & Invitations
  const { data: rawUsers = [], isLoading } = useQuery({
    queryKey: ["user-invitations"],
    queryFn: async () => {
      return userManagementApi.getInvitations();
    },
  });

  const users: ExtendedUser[] = rawUsers.map(mapToExtendedUser);

  // Invite User Mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ email, roleId }: { email: string; roleId: number }) => {
      return userManagementApi.inviteUser({ invitedEmail: email, userRoleId: roleId });
    },
    onSuccess: () => {
      success("사용자를 초대했습니다.");
      queryClient.invalidateQueries({ queryKey: ["user-invitations"] });
    },
    onError: (error: any) => {
      console.error("Invite failed", error);
      errorToast("초대에 실패했습니다.");
    },
  });

  // Update Status Mutation (Suspend/Terminate)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: UpdateHospitalUserStatusDto }) => {
      return userManagementApi.updateUserStatus(userId, data);
    },
    onSuccess: () => {
      success("상태가 변경되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["user-invitations"] });
    },
    onError: (error: any) => {
      console.error("Update status failed", error);
      errorToast("상태 변경에 실패했습니다.");
    },
  });

  // Resend Invite Mutation
  const resendMutation = useMutation({
    mutationFn: async (id: number) => {
      return userManagementApi.resendInvitation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-invitations"] });
      success("재초대 메일을 발송했습니다.");
    },
    onError: (error) => {
      console.error("Resend failed", error);
      errorToast("재초대 발송에 실패했습니다.");
    },
  });

  // Cancel Invite Mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      return userManagementApi.cancelInvitation(id);
    },
    onSuccess: () => {
      success("초대가 취소되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["user-invitations"] });
    },
    onError: (error) => {
      console.error("Cancel failed", error);
      errorToast("초대 취소에 실패했습니다.");
    },
  });

  // Delete Invitation Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return userManagementApi.deleteInvitation(id);
    },
    onSuccess: () => {
      success("초대가 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["user-invitations"] });
    },
    onError: (error) => {
      console.error("Delete failed", error);
      errorToast("삭제에 실패했습니다.");
    },
  });

  // Save (Update) User Detail Mutation
  // Save (Update) User Detail Mutation
  const saveUserMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: any }) => {
      // ONLY Update Status (as requested)
      const statusPayload: UpdateHospitalUserStatusDto = {
        isActive: data.isActive,
        hireDate: data.hireDate,
        resignationDate: data.resignationDate,
        terminateImmediately: data.terminateImmediately,
        roleId: data.roleId,
      };

      return userManagementApi.updateUserStatus(userId, statusPayload);
    },
    onSuccess: (_, variables) => {
      success("사용자 정보가 저장되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["user-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["user-detail", variables.userId] });
    },
    onError: (error) => {
      console.error("Save failed", error);
      errorToast("사용자 정보 저장에 실패했습니다.");
    },
  });

  // REAL user delete mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return userManagementApi.deleteUser(userId);
    },
    onSuccess: () => {
      success("사용자가 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["user-invitations"] });
    },
    onError: (error) => {
      console.error("Delete user failed", error);
      errorToast("사용자 삭제에 실패했습니다.");
    },
  });


  // Actions
  const inviteUser = (email: string, roleNameOrId: string) => {
    const roleId = Number(roleNameOrId);
    if (isNaN(roleId)) {
      console.warn("Role ID is not a number", roleNameOrId);
      return;
    }
    inviteMutation.mutate({ email, roleId });
  };

  const cancelInvite = (id: number) => {
    // If status is INVITING, use Cancel.
    // If user calls 'Cancel' on Invite.
    // Assuming button '초대 취소' calls this.
    cancelMutation.mutate(id);
  };

  const reInvite = (id: number) => {
    resendMutation.mutate(id);
  };

  const updateUserStatusAction = (userId: number, status: UserStatus) => {
    // Logic for isActive/resignationDate mapping
    const payload: UpdateHospitalUserStatusDto = {
      isActive: true, // Default
    };

    if (status === UserStatus.SUSPENDED) {
      payload.isActive = false;
    } else if (status === UserStatus.TERMINATED) {
      payload.isActive = false;
      payload.terminateImmediately = true;
      payload.resignationDate = new Date().toISOString().split('T')[0];
    } else if (status === UserStatus.ACTIVE) {
      payload.isActive = true;
    }

    updateStatusMutation.mutate({ userId, data: payload });
  };

  const updateUser = (userId: number, updates: Partial<ExtendedUser>) => {
    // Optimistic update for local editing in UserDetailPanel
    queryClient.setQueryData(["user-invitations"], (oldData: any) => {
      if (!oldData) return oldData;
      // oldData is the raw response from API (array of DTOs)
      // We need to find the item and update it.
      // But 'updates' uses ExtendedUser keys (camelCase, mapped).
      // API DTO might use different keys or same.
      // Assuming mapping is simple enough or we just update what matches.

      // Wait, 'rawUsers' in useQuery is mapped to 'users' via 'mapToExtendedUser'.
      // If we manually update cache, we should update the RAW data or result.
      // Since mapToExtendedUser is a projection, we must update the RAW data if we want 'useQuery' to return updated data.
      return oldData.map((item: any) => {
        // Match by ID. Be careful with Hospital vs Invite ID.
        // item could be Invitation or HospitalUser
        const itemId = item.userId || item.invitedId || item.id;
        if (itemId === userId) {
          // Merge updates.
          const newItem = { ...item, ...updates };

          // Handle special mapped fields backward if needed (e.g. status)
          if (updates.uiStatus !== undefined) {
            // Reverse map or just set status code if we knew it.
            // This is purely optimistic for UI.
            if (updates.uiStatus === UserStatus.SUSPENDED) newItem.status = ApiUserStatus.SUSPENDED;
            if (updates.uiStatus === UserStatus.ACTIVE) newItem.status = ApiUserStatus.ACTIVE;
            if (updates.uiStatus === UserStatus.TERMINATED) newItem.status = ApiUserStatus.TERMINATED;
          }

          return newItem;
        }
        return item;
      });
    });

    // Also update Detail Cache if it exists
    queryClient.setQueryData(["user-detail", userId], (oldDetail: any) => {
      if (!oldDetail) return oldDetail;
      // oldDetail is ExtendedUser (or DTO mapped to it) because useUserDetail queryFn returns it?
      // Wait, useUserDetail queryFn returns the mapped ExtendedUser directly!
      // So oldDetail IS ExtendedUser.
      return { ...oldDetail, ...updates };
    });
  };

  const deleteUser = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.uiStatus === UserStatus.INVITING || user.uiStatus === UserStatus.EXPIRED) {
      // Invitation -> Delete
      deleteMutation.mutate(userId);
    } else if (user.uiStatus === UserStatus.TERMINATED) {
      // Terminated -> HARD DELETE
      deleteUserMutation.mutate(userId);
    } else {
      // Active/Suspended -> Soft Delete (Terminate) using PATCH
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const resignationDate = `${yyyy}-${mm}-${dd}`;

      const payload: UpdateHospitalUserStatusDto = {
        isActive: false,
        terminateImmediately: true,
        resignationDate: resignationDate, // YYYY-MM-DD
      };
      updateStatusMutation.mutate({ userId, data: payload });
    }
  };

  const saveUser = (userId: number, data: any) => {
    saveUserMutation.mutate({ userId, data });
  };

  return {
    users,
    isLoading,
    inviteUser,
    cancelInvite,
    reInvite,
    updateUserStatus: updateUserStatusAction,
    updateUser,
    saveUser, // New action
    deleteUser,
  };
};

// Hook for Single User Detail
export const useUserDetail = (userId: number | null, isInvitation: boolean = false) => {
  return useQuery({
    queryKey: ["user-detail", userId, isInvitation],
    queryFn: async () => {
      if (!userId) return null;

      try {
        let data: any;
        let extendedUser: ExtendedUser;

        if (isInvitation) {
          // Fetch from /user-invitations/{id}
          data = await userManagementApi.getInvitationDetail(userId);

          // Map Invitation payload to InvitationUser
          extendedUser = {
            kind: "INVITATION",
            id: data.id,
            email: data.invitedEmail,
            invitedEmail: data.invitedEmail,
            name: "-",
            roleName: data.roleName,
            uiStatus: mapStatus(data.status),
            createDateTime: data.usageStartDate,
            type: "일반" as any,

            // Specific
            invitedId: data.id,
            invitationDate: data.usageStartDate, // Mapped from usageStartDate
            endDate: data.expiresAt, // Mapped from expiresAt
            statusName: data.statusName,
          } as InvitationUser;

        } else {
          // Fetch from /users/{id} (Hospital User)
          data = await userManagementApi.getUserDetail(userId);

          // Map Hospital User payload
          extendedUser = {
            kind: "HOSPITAL_USER",
            id: (data as any).userId || data.id,
            userId: (data as any).userId || data.id,
            email: data.email,
            name: data.name,
            roleName: data.roleName,
            uiStatus: mapStatus(data.status),
            createDateTime: data.createDateTime || data.hireDate, // Fallback if createDateTime missing
            type: (data.typeName || "일반") as any,

            // Specific
            nameEn: data.nameEn,
            mobile: data.mobile,
            zipcode: data.zipcode,
            address1: data.address1,
            address2: data.address2,
            departmentId: data.departmentId,
            departmentName: data.departmentName,

            // Map typeName to positionName for UI consistency if needed
            positionName: data.typeName,

            licenseNo: data.licenseNo,
            birthDate: data.birthDate,
            hireDate: data.hireDate,
            resignationDate: data.resignationDate,

            profileFileInfo: data.profileFileInfo,

            // Doctor Specific
            specialty: data.specialty,
            specialtyName: data.specialtyName,
            specialtyCertNo: data.specialtyCertNo,

            isActive: data.status === 10 || data.status === 2,

            // New Fields Mapping
            isOwner: data.isOwner,
          } as HospitalUser;
        }

        return extendedUser;

      } catch (e) {
        console.error("Failed to fetch user detail", e);
        throw e;
      }
    },
    enabled: !!userId,
    staleTime: 0,
  });
};
