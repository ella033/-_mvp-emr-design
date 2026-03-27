import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { permissionsApi } from "../api/permissions.api";
import { useToastHelpers } from "@/components/ui/toast";
import type {
  PermissionRoleSummary,
  PermissionRow,
  PermissionLevel,
  PermissionAssignment,
  CombinedUserRow,
  UserStatus,
  PermissionRolePermission,
} from "../model";

// --- Constants (moved from permission_infos.tsx) ---
const initialPermissions: PermissionRow[] = [
  { id: "reception", subject: "reception", name: "접수", description: "초진·재진 접수", level: "view" },
  { id: "care", subject: "medical", name: "진료", description: "문진, 진료 차트 조회", level: "view" },
  { id: "payment", subject: "payment", name: "수납", description: "결제·수납 관리", level: "edit" },
  { id: "exam", subject: "external-lab-orders", name: "외부검사", description: "검사 의뢰·결과 확인", level: "edit" },
  { id: "booking", subject: "reservation", name: "예약", description: "방문·시술 예약 관리", level: "edit" },
  { id: "crm", subject: "crm", name: "CRM", description: "마케팅·메시지 관리", level: "edit" },
  { id: "billing", subject: "claims", name: "청구", description: "보험 청구 관리", level: "edit" },
  { id: "master", subject: "master-data", name: "기초자료", description: "기초 코드 관리", level: "view" },
  { id: "settings", subject: "settings", name: "설정", description: "조직·계정 설정", level: "edit" },
];

const subjectToId: Record<string, string> = {
  reception: "reception",
  medical: "care",
  payment: "payment",
  "external-lab-orders": "exam",
  reservation: "booking",
  crm: "crm",
  claims: "billing",
  "master-data": "master",
  settings: "settings",
};

const actionToLevel: Record<string, PermissionLevel> = {
  manage: "edit",
  read: "view",
};

const levelToAction: Record<PermissionLevel, PermissionAssignment["action"] | null> = {
  none: null,
  view: "read",
  edit: "manage",
};

// --- Helpers ---
const buildNameKey = (name?: string | null, nameEn?: string | null) =>
  `${name ?? ""}|${nameEn ?? ""}`.trim();

const mapUserStatus = (status?: number | null, statusName?: string | null) => {
  if (status === 10) return { label: "active" as UserStatus, text: statusName ?? "사용중", code: status };
  if (status === 20) return { label: "disabled" as UserStatus, text: statusName ?? "사용 불가", code: status };
  if (status === 90) return { label: "ended" as UserStatus, text: statusName ?? "사용 종료", code: status };
  return { label: "unknown" as UserStatus, text: statusName ?? "상태 미확인", code: status ?? null };
};

const buildPermissionsFromResponse = (
  permissionResponse: PermissionRolePermission[]
): PermissionRow[] => {
  const levelMap: Record<string, PermissionLevel> = {};
  permissionResponse.forEach((item) => {
    const mappedId = subjectToId[item.subject];
    if (!mappedId) return;
    levelMap[mappedId] = actionToLevel[item.action] ?? "none";
  });
  return initialPermissions.map((row) => ({
    ...row,
    level: levelMap[row.id] ?? "none",
  }));
};

const buildAssignmentsFromPermissions = (source: PermissionRow[]): PermissionAssignment[] =>
  source
    .map((row) => ({
      subject: row.subject,
      action: levelToAction[row.level],
    }))
    .filter((item): item is PermissionAssignment => Boolean(item.action && item.subject));

export const usePermissionDetails = (
  selectedRole: PermissionRoleSummary | null,
  onRoleCreated?: (roleName: string, roleId: number | null) => void,
  onSaved?: () => void
) => {
  const queryClient = useQueryClient();
  const toast = useToastHelpers();

  const [roleName, setRoleName] = useState("새 권한 그룹");
  const [baseRole, setBaseRole] = useState("");
  const [permissions, setPermissions] = useState<PermissionRow[]>(initialPermissions);
  const [pendingUserIds, setPendingUserIds] = useState<number[]>([]);
  const [userKeyword, setUserKeyword] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);
  const [confirmMoveModal, setConfirmMoveModal] = useState<{ open: boolean; targets: CombinedUserRow[] }>({ open: false, targets: [] });
  const [isSaving, setIsSaving] = useState(false);

  const selectedRoleId = selectedRole?.id ?? null;
  const isSystemRole = selectedRole?.isSystem ?? false;

  // 1. Fetch Selected Role Permissions
  const { data: selectedRolePermissions, isLoading: isPermissionsLoading } = useQuery({
    queryKey: ["permissions", "role", selectedRoleId, "permissions"],
    queryFn: () => permissionsApi.getRolePermissions(selectedRoleId!),
    enabled: !!selectedRoleId,
    staleTime: 30_000,
  });

  // 2. Fetch Users (Hardcoded hospital 1 as per original code)
  const { data: hospitalUsers = [], isLoading: isUsersLoading } = useQuery({
    queryKey: ["users", "hospital", 1],
    queryFn: () => permissionsApi.getHospitalUsers(1),
    staleTime: 60_000,
  });

  // 3. Fetch Base Role Permissions (if selected)
  const baseRoleId = baseRole ? Number(baseRole) : null;
  const { data: baseRolePermissions } = useQuery({
    queryKey: ["permissions", "role", baseRoleId, "permissions"],
    queryFn: () => permissionsApi.getRolePermissions(baseRoleId!),
    enabled: !!baseRoleId && !selectedRoleId && !isSystemRole,
    staleTime: 0,
  });

  // --- Effects ---

  // Sync state with selected role
  useEffect(() => {
    if (selectedRoleId) {
      setRoleName(selectedRole.name ?? "권한");
      setPendingUserIds([]);
      setBaseRole("");
    } else {
      setRoleName("새 권한 그룹");
      setPermissions(initialPermissions);
      setPendingUserIds([]);
      setBaseRole("");
    }
  }, [selectedRoleId, selectedRole]);

  // Apply permissions from fetched data
  useEffect(() => {
    if (selectedRoleId && selectedRolePermissions) {
      setPermissions(buildPermissionsFromResponse(selectedRolePermissions));
    }
  }, [selectedRoleId, selectedRolePermissions]);

  useEffect(() => {
    if (baseRoleId && baseRolePermissions) {
      setPermissions(buildPermissionsFromResponse(baseRolePermissions));
    }
  }, [baseRoleId, baseRolePermissions]);

  // --- Derived State: Users ---
  const combinedUsers: CombinedUserRow[] = useMemo(() => {
    const rows = new Map<string, CombinedUserRow>();
    hospitalUsers.forEach((user) => {
      const key = buildNameKey(user.name, user.nameEn) || `user-${user.id}`;
      const { label, text, code } = mapUserStatus(user.status, user.statusName);
      const isAssignedToSelectedRole = selectedRoleId
        ? user.roleId === selectedRoleId ||
        (selectedRole?.name && (user.roleName ?? "").trim() === selectedRole.name.trim())
        : false;
      const isPendingAssignment = pendingUserIds.includes(user.id);

      const row: CombinedUserRow = {
        key,
        userId: user.id,
        name: user.name,
        englishName: user.nameEn ?? "",
        title: user.userTypeName ?? user.positionName ?? "-",
        department: user.specialtyName ?? user.departmentName ?? "-",
        statusLabel: label,
        statusText: text,
        statusCode: code,
        roleName: user.roleName ?? "",
        roleId: user.roleId ?? null,
        userTypeName: user.userTypeName ?? "",
        specialtyName: user.specialtyName ?? "",
        isAssigned: isAssignedToSelectedRole || isPendingAssignment,
        isOwner: (user as any).isOwner ?? false,
        createdAt: user.createDateTime ?? "",
      };
      rows.set(key, row);
    });

    return Array.from(rows.values()).sort(
      (a, b) => Number(b.isAssigned) - Number(a.isAssigned) || a.name.localeCompare(b.name)
    );
  }, [hospitalUsers, pendingUserIds, selectedRoleId, selectedRole]);

  const filteredUsers = useMemo(() => {
    const term = userKeyword.trim().toLowerCase();
    return combinedUsers.filter((user) => {
      const matchesKeyword =
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.englishName.toLowerCase().includes(term) ||
        user.department.toLowerCase().includes(term) ||
        user.title.toLowerCase().includes(term) ||
        user.roleName.toLowerCase().includes(term) ||
        user.userTypeName.toLowerCase().includes(term) ||
        user.specialtyName.toLowerCase().includes(term) ||
        user.statusText.toLowerCase().includes(term);
      const matchesActive = onlyActive ? user.statusCode === 10 : true;
      return matchesKeyword && matchesActive;
    });
  }, [combinedUsers, onlyActive, userKeyword]);

  const assignedUsers = useMemo(() => filteredUsers.filter((u) => u.isAssigned), [filteredUsers]);

  const suggestionUsers = useMemo(() => {
    const term = userKeyword.trim().toLowerCase();
    if (!term) return [];
    return combinedUsers
      .filter((user) => {
        if (user.isAssigned) return false;
        return (
          user.name.toLowerCase().includes(term) ||
          user.englishName.toLowerCase().includes(term) ||
          user.department.toLowerCase().includes(term) ||
          user.title.toLowerCase().includes(term) ||
          user.roleName.toLowerCase().includes(term) ||
          user.userTypeName.toLowerCase().includes(term) ||
          user.specialtyName.toLowerCase().includes(term)
        );
      })
      .slice(0, 8);
  }, [combinedUsers, userKeyword]);


  // --- Actions ---
  const handleLevelChange = (id: string, level: PermissionLevel) => {
    if (isSystemRole) return;
    setPermissions((prev) =>
      prev.map((row) => (row.id === id ? { ...row, level } : row))
    );
  };

  const handleAddUserToRole = (userId: number) => {
    setPendingUserIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    setUserKeyword("");
  };

  const persistUsers = async (roleId: number, userIds: number[]) => {
    if (!roleId || userIds.length === 0) return;
    try {
      await Promise.all(userIds.map((userId) => permissionsApi.updateUserRole({ userId, roleId })));
      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ["users", "hospital", 1] });
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const handleSave = async (confirmedTargets?: CombinedUserRow[]) => {
    // If confirmation logic required outside, we might need a way to pass it. 
    // Here we handle the pre-check mostly.

    // Check for user movement
    if (selectedRoleId && pendingUserIds.length > 0 && !confirmedTargets) {
      const targets = combinedUsers.filter((user) => pendingUserIds.includes(user.userId));
      const moveTargets = targets.filter((user) => user.roleId && user.roleId !== selectedRoleId);
      if (moveTargets.length > 0) {
        setConfirmMoveModal({ open: true, targets: moveTargets });
        return;
      }
    }

    const trimmedName = roleName.trim();
    if (!trimmedName) {
      toast.warning("권한명을 입력해 주세요.");
      return;
    }

    setIsSaving(true);
    try {
      let permissionsSnapshot = permissions;
      // Fetch base role permissions if new role and base role selected
      if (!selectedRoleId && baseRoleId && !baseRolePermissions) {
        // Logic to fetch one-off if not automatically valid/present?
        // Actually baseRolePermissions should be present due to the hook.
      }

      const assignments = buildAssignmentsFromPermissions(permissionsSnapshot);
      let roleIdToUse = selectedRoleId;

      if (selectedRoleId) {
        if (!isSystemRole) {
          await permissionsApi.updateRole(selectedRoleId, { name: trimmedName, permissions: assignments });
        }
      } else {
        const createdRole = await permissionsApi.createRole({ name: trimmedName, permissions: assignments });
        roleIdToUse = createdRole?.id ?? null;
        onRoleCreated?.(trimmedName, roleIdToUse);
      }

      if (pendingUserIds.length > 0 && roleIdToUse) {
        await persistUsers(roleIdToUse, pendingUserIds);
      }

      // Invalidation
      if (roleIdToUse) {
        await queryClient.invalidateQueries({ queryKey: ["permissions", "role", roleIdToUse, "permissions"] });
      }
      await queryClient.invalidateQueries({ queryKey: ["permissions", "roles"] });

      // Also invalidate users to reflect new roles
      await queryClient.invalidateQueries({ queryKey: ["users", "hospital", 1] });


      toast.success(selectedRoleId ? "권한이 저장되었습니다." : "권한을 생성했어요.");
      onSaved?.();
      setPendingUserIds([]);
    } catch (error) {
      console.error(error);
      toast.error(selectedRoleId ? "권한 저장에 실패했습니다." : "권한 생성에 실패했습니다.");
    } finally {
      setIsSaving(false);
      setConfirmMoveModal({ open: false, targets: [] });
    }
  };


  return {
    roleName,
    setRoleName,
    baseRole,
    setBaseRole,
    permissions,
    handleLevelChange,
    hospitalUsers,
    combinedUsers,
    filteredUsers,
    assignedUsers,
    suggestionUsers,
    userKeyword,
    setUserKeyword,
    onlyActive,
    setOnlyActive,
    handleAddUserToRole,
    pendingUserIds,
    handleSave,
    isSaving,
    isPermissionsLoading,
    isUsersLoading,
    confirmMoveModal,
    setConfirmMoveModal,
    isSystemRole
  };
};
