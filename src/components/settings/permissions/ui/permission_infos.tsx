"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { useToastHelpers } from "@/components/ui/toast";
import { MySwitch } from "@/components/yjg/my-switch";
import {
  useHospitalUsersQuery,
  usePermissionRolesQuery,
  useRolePermissionsQuery,
} from "@/hooks/permissions/use-permission-queries";
import { PermissionsService } from "@/services/permission-service";
import type {
  PermissionAssignment,
  PermissionRolePermission,
  PermissionRoleSummary,
} from "@/types/permission-types";
import type { UserManager } from "@/types/user-types";
import { SectionLayout } from "../../commons/section-layout";
import { RoleDeleteButton } from "./role_delete_button";

type PermissionLevel = "none" | "view" | "edit";

type PermissionRow = {
  id: string;
  name: string;
  description?: string;
  level: PermissionLevel;
  subject: string;
};

type UserStatus = "active" | "disabled" | "ended" | "unknown";

type CombinedUserRow = {
  key: string;
  userId: number;
  name: string;
  englishName: string;
  title: string;
  department: string;
  statusLabel: UserStatus;
  statusText: string;
  statusCode: number | null;
  roleName: string;
  roleId: number | null;
  userTypeName: string;
  specialtyName: string;
  isAssigned: boolean;
  isOwner: boolean;
  createdAt: string;
};

const initialPermissions: PermissionRow[] = [
  {
    id: "reception",
    subject: "reception",
    name: "접수",
    description: "초진·재진 접수",
    level: "view",
  },
  {
    id: "care",
    subject: "medical",
    name: "진료",
    description: "문진, 진료 차트 조회",
    level: "view",
  },
  {
    id: "payment",
    subject: "payment",
    name: "수납",
    description: "결제·수납 관리",
    level: "edit",
  },
  {
    id: "exam",
    subject: "external-lab-orders",
    name: "외부검사",
    description: "검사 의뢰·결과 확인",
    level: "edit",
  },
  {
    id: "booking",
    subject: "reservation",
    name: "예약",
    description: "방문·시술 예약 관리",
    level: "edit",
  },
  {
    id: "crm",
    subject: "crm",
    name: "CRM",
    description: "마케팅·메시지 관리",
    level: "edit",
  },
  {
    id: "billing",
    subject: "claims",
    name: "청구",
    description: "보험 청구 관리",
    level: "edit",
  },
  {
    id: "master",
    subject: "master-data",
    name: "기초자료",
    description: "기초 코드 관리",
    level: "view",
  },
  {
    id: "settings",
    subject: "settings",
    name: "설정",
    description: "조직·계정 설정",
    level: "edit",
  },
];

const subjectToId: Record<string, PermissionRow["id"]> = {
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

const permissionColumns: { value: PermissionLevel; label: string }[] = [
  { value: "none", label: "권한없음" },
  { value: "view", label: "조회" },
  { value: "edit", label: "수정" },
];

const statusBadgeClass: Record<UserStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  disabled: "bg-rose-50 text-rose-700 ring-rose-100",
  ended: "bg-slate-100 text-slate-600 ring-slate-200",
  unknown: "bg-slate-50 text-slate-600 ring-slate-100",
};

const statusDotClass: Record<UserStatus, string> = {
  active: "bg-emerald-500",
  disabled: "bg-rose-500",
  ended: "bg-slate-400",
  unknown: "bg-slate-400",
};

const buildNameKey = (name?: string | null, nameEn?: string | null) =>
  `${name ?? ""}|${nameEn ?? ""}`.trim();

const mapUserStatus = (status?: number | null, statusName?: string | null) => {
  if (status === 10)
    return {
      label: "active" as UserStatus,
      text: statusName ?? "사용중",
      code: status,
    };
  if (status === 20)
    return {
      label: "disabled" as UserStatus,
      text: statusName ?? "사용 불가",
      code: status,
    };
  if (status === 90)
    return {
      label: "ended" as UserStatus,
      text: statusName ?? "사용 종료",
      code: status,
    };
  return {
    label: "unknown" as UserStatus,
    text: statusName ?? "상태 미확인",
    code: status ?? null,
  };
};

type Props = {
  selectedRole: PermissionRoleSummary | null;
  onRoleCreated?: (roleName: string, roleId: number | null) => void;
  onSaved?: () => void;
  onRoleDeleted?: () => void;
};

export default function PermissionInfos({
  selectedRole,
  onRoleCreated,
  onSaved,
  onRoleDeleted,
}: Props) {
  const toast = useToastHelpers();
  const queryClient = useQueryClient();
  const [roleName, setRoleName] = useState("새 권한 그룹");
  const [baseRole, setBaseRole] = useState("");
  const [permissions, setPermissions] =
    useState<PermissionRow[]>(initialPermissions);

  const [hospitalUsers, setHospitalUsers] = useState<UserManager[]>([]);
  const [pendingUserIds, setPendingUserIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmMoveModal, setConfirmMoveModal] = useState<{
    open: boolean;
    targets: CombinedUserRow[];
  }>({ open: false, targets: [] });

  const [userKeyword, setUserKeyword] = useState("");
  const [onlyActive, setOnlyActive] = useState(false);

  const selectedRoleId = selectedRole?.id ?? null;
  const selectedRoleName = selectedRole?.name ?? null;
  const isSystemRole = selectedRole?.isSystem ?? false;

  const { data: permissionRolesData } = usePermissionRolesQuery({
    onError: () => {
      toast.error("기본 권한 목록을 불러오지 못했어요.");
    },
  });
  const permissionRoles = permissionRolesData ?? [];

  const { data: hospitalUsersData, isLoading: isUsersLoading } =
    useHospitalUsersQuery(1, {
      onError: (error: unknown) => {
        console.error(error);
        toast.error("사용자 목록을 불러오지 못했어요.");
      },
    });

  const baseRoleId = baseRole ? Number(baseRole) : null;

  const {
    data: selectedRolePermissions,
    isFetching: isFetchingSelectedRolePermissions,
  } = useRolePermissionsQuery(selectedRoleId, {
    enabled: !!selectedRoleId,
    onError: (error: unknown) => {
      console.error(error);
      setPermissions((prev) =>
        prev.map((row) => ({
          ...row,
          level: "none",
        }))
      );
    },
  });

  const {
    data: baseRolePermissions,
    isFetching: isFetchingBaseRolePermissions,
  } = useRolePermissionsQuery(baseRoleId, {
    enabled: !!baseRoleId && !isSystemRole,
    staleTime: 0,
    cacheTime: 0,
    onError: (error: unknown) => {
      console.error(error);
      toast.error("기본 권한을 불러오지 못했어요.");
    },
  });

  const levelToAction: Record<
    PermissionLevel,
    PermissionAssignment["action"] | null
  > = {
    none: null,
    view: "read",
    edit: "manage",
  };

  const buildPermissionsFromResponse = (
    permissionResponse: PermissionRolePermission[]
  ): PermissionRow[] => {
    const levelMap: Record<PermissionRow["id"], PermissionLevel> = {};
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

  const buildAssignmentsFromPermissions = (
    source: PermissionRow[]
  ): PermissionAssignment[] =>
    source
      .map((row) => ({
        subject: row.subject,
        action: levelToAction[row.level],
      }))
      .filter((item): item is PermissionAssignment =>
        Boolean(item.action && item.subject)
      );

  const applyPermissionResponse = (
    permissionResponse: PermissionRolePermission[]
  ) => {
    setPermissions(buildPermissionsFromResponse(permissionResponse));
  };

  const baseRoleOptions = useMemo(
    () => [
      { value: "", label: "기본 권한 불러오기", roleId: 0 },
      ...permissionRoles.map((role) => ({
        value: String(role.id),
        label: role.name,
        roleId: role.id,
      })),
    ],
    [permissionRoles]
  );

  useEffect(() => {
    if (!hospitalUsersData) return;
    setHospitalUsers(hospitalUsersData);
  }, [hospitalUsersData]);

  useEffect(() => {
    if (!selectedRoleId) {
      setRoleName("새 권한 그룹");
      setPermissions(initialPermissions);
      setPendingUserIds([]);
      setBaseRole("");
      return;
    }
    setRoleName(selectedRoleName ?? "권한");
    setPendingUserIds([]);
    setBaseRole("");
  }, [selectedRoleId, selectedRoleName]);

  useEffect(() => {
    if (!selectedRoleId || !selectedRolePermissions) return;
    applyPermissionResponse(selectedRolePermissions);
  }, [selectedRoleId, selectedRolePermissions]);

  useEffect(() => {
    if (!baseRoleId || !baseRolePermissions) return;
    applyPermissionResponse(baseRolePermissions);
  }, [baseRoleId, baseRolePermissions]);

  const combinedUsers: CombinedUserRow[] = useMemo(() => {
    const rows = new Map<string, CombinedUserRow>();

    hospitalUsers.forEach((user) => {
      const key = buildNameKey(user.name, user.nameEn) || `user-${user.id}`;
      const { label, text, code } = mapUserStatus(user.status, user.statusName);
      const isAssignedToSelectedRole = selectedRoleId
        ? user.roleId === selectedRoleId ||
        (selectedRoleName &&
          (user.roleName ?? "").trim() === selectedRoleName.trim())
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
      (a, b) =>
        Number(b.isAssigned) - Number(a.isAssigned) ||
        a.name.localeCompare(b.name)
    );
  }, [hospitalUsers, pendingUserIds, selectedRoleId, selectedRoleName]);

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

  const assignedUsers = useMemo(
    () => filteredUsers.filter((user) => user.isAssigned),
    [filteredUsers]
  );

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

  const handleLevelChange = (id: string, level: PermissionLevel) => {
    if (isSystemRole) return;
    setPermissions((prev) =>
      prev.map((row) => (row.id === id ? { ...row, level } : row))
    );
  };

  const handleAddUserToRole = (userId: number) => {
    setPendingUserIds((prev) =>
      prev.includes(userId) ? prev : [...prev, userId]
    );
    setUserKeyword("");
  };

  const persistUsers = async (
    roleId: number,
    userIds: number[],
    targetRoleName: string
  ) => {
    if (!roleId || userIds.length === 0) return;

    setIsSaving(true);
    try {
      await Promise.all(
        userIds.map((userId) =>
          PermissionsService.updateUserRole({ userId, roleId })
        )
      );

      setHospitalUsers((prev) =>
        prev.map((user) =>
          userIds.includes(user.id)
            ? {
              ...user,
              roleId,
              roleName: targetRoleName ?? user.roleName,
            }
            : user
        )
      );
      setPendingUserIds([]);
      toast.success("권한이 저장되었습니다.");
      await queryClient.invalidateQueries({
        queryKey: ["users", "hospital", 1],
      });
    } catch (error) {
      console.error(error);
      toast.error("권한 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBaseRoleChange = (value: string) => {
    if (!value) {
      setBaseRole("");
      return;
    }
    const roleId = Number(value);
    if (Number.isNaN(roleId)) {
      setBaseRole("");
      return;
    }
    setBaseRole(value);
  };

  const refreshAllPermissionQueries = async () => {
    const predicate = (query: { queryKey?: unknown }) => {
      const qk = query.queryKey as any[];
      return Array.isArray(qk) && (qk[0] === "permissions" || qk[0] === "users");
    };

    await queryClient.invalidateQueries({
      predicate,
    });
    await queryClient.refetchQueries({
      predicate,
    });
  };

  const handleSave = async () => {
    const trimmedName = roleName.trim();
    if (!trimmedName) {
      toast.warning("권한명을 입력해 주세요.");
      return;
    }

    // baseRole을 선택한 직후 권한 페치가 완료되지 않았을 수 있으므로,
    // 생성 시점에 한 번 더 안전하게 권한 스냅샷을 확보한다.
    let permissionsSnapshot = permissions;
    if (!selectedRoleId && baseRoleId) {
      try {
        const basePermissions =
          baseRolePermissions ??
          (await PermissionsService.getRolePermissions(baseRoleId));
        permissionsSnapshot = buildPermissionsFromResponse(basePermissions);
      } catch (error) {
        console.error(error);
        toast.error("기본 권한을 불러오지 못했어요.");
        return;
      }
    }

    const assignments = buildAssignmentsFromPermissions(permissionsSnapshot);

    if (selectedRoleId && pendingUserIds.length > 0) {
      const targets = combinedUsers.filter((user) =>
        pendingUserIds.includes(user.userId)
      );
      const moveTargets = targets.filter(
        (user) => user.roleId && user.roleId !== selectedRoleId
      );

      if (moveTargets.length > 0) {
        setConfirmMoveModal({ open: true, targets: moveTargets });
        return;
      }
    }

    setIsSaving(true);
    try {
      let roleIdToUse = selectedRoleId;

      if (selectedRoleId) {
        await PermissionsService.updateRole(selectedRoleId, {
          name: trimmedName,
          permissions: assignments,
        });
      } else {
        const createdRole = await PermissionsService.createRole({
          name: trimmedName,
          permissions: assignments,
        });
        roleIdToUse = createdRole?.id ?? null;
        onRoleCreated?.(trimmedName, roleIdToUse);
      }

      if (pendingUserIds.length > 0 && roleIdToUse) {
        await persistUsers(roleIdToUse, pendingUserIds, trimmedName);
      }

      if (roleIdToUse) {
        await queryClient.invalidateQueries({
          queryKey: ["permissions", "role", roleIdToUse, "permissions"],
        });
      }
      await queryClient.invalidateQueries({
        queryKey: ["permissions", "roles"],
      });

      await refreshAllPermissionQueries();

      if (!selectedRoleId) {
        setPendingUserIds([]);
        toast.success("권한을 생성했어요.");
      } else {
        toast.success("권한이 저장되었습니다.");
      }

      onSaved?.();
    } catch (error) {
      console.error(error);
      toast.error(
        selectedRoleId
          ? "권한 저장에 실패했습니다."
          : "권한 생성에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleDeleted = () => {
    setRoleName("새 권한 그룹");
    setPermissions(initialPermissions);
    setPendingUserIds([]);
    setBaseRole("");
    onRoleDeleted?.();
  };

  const renderRadio = (rowId: string, level: PermissionLevel) => {
    const isChecked =
      permissions.find((row) => row.id === rowId)?.level === level;
    const isDisabled = isSystemRole;
    return (
      <label className="flex justify-center py-2">
        <input
          type="radio"
          name={`permission-${rowId}`}
          value={level}
          checked={isChecked}
          onChange={() => handleLevelChange(rowId, level)}
          disabled={isDisabled}
          className="sr-only"
        />
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${isChecked
            ? "border-muted-foreground bg-muted"
            : "border-border bg-background"
            } ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full transition ${isChecked ? "bg-foreground" : "bg-transparent"
              }`}
          />
        </span>
      </label>
    );
  };

  const isUserListLoading =
    isUsersLoading ||
    isFetchingSelectedRolePermissions ||
    isFetchingBaseRolePermissions;
  const isSaveDisabled = isSaving || !roleName.trim();

  return (
    <SectionLayout
      testId="settings-permissions-info-panel"
      header={
        <h2 className="font-pretendard text-[16px] font-bold leading-[140%] tracking-[-0.16px] text-foreground">
          권한 설정
        </h2>
      }
      body={
        <>
          <div className="flex flex-1 w-full h-full flex-row gap-[12px] overflow-hidden">
            <div className="flex flex-1 w-full h-full flex-col gap-[12px]">
              <div className="flex flex-col gap-[8.5px]">
                <div className="text-sm font-semibold text-foreground">
                  권한명 <span className="text-destructive">*</span>
                </div>
                <div className="flex flex-row gap-[8px] justify-between">
                  <div className="flex-1">
                    <input
                      type="text"
                      data-testid="settings-permissions-role-name-input"
                      value={roleName}
                      onChange={(event) => setRoleName(event.target.value)}
                      disabled={isSystemRole}
                      placeholder="권한명을 입력해 주세요"
                      className={`flex flex-col justify-center items-center self-stretch w-full h-full px-3 py-2.5 rounded-[6px] border border-border text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 ${isSystemRole ? "bg-muted text-muted-foreground" : "bg-background text-foreground"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-[120px] flex items-center gap-2 justify-end">
                    <div className="relative w-full">
                      <select
                        data-testid="settings-permissions-base-role-select"
                        value={baseRole}
                        onChange={(event) =>
                          handleBaseRoleChange(event.target.value)
                        }
                        disabled={isSystemRole}
                        className={`flex flex-col justify-center items-center self-stretch w-full h-full appearance-none px-3 pr-9 py-2.5 rounded-[6px] border border-border text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 ${isSystemRole ? "bg-muted text-muted-foreground" : "bg-background text-foreground"}`}
                      >
                        {baseRoleOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            disabled={option.value === ""}
                            className="bg-background text-foreground"
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                          aria-hidden
                        >
                          <path
                            d="M6 8l4 4 4-4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <SectionLayout
                className="!p-0"
                body={
                  <div className="">
                    <div className="grid grid-cols-[1.4fr_repeat(3,0.6fr)] items-center rounded-t-lg bg-muted/50 px-4 py-3 text-xs font-semibold text-muted-foreground">
                      <span className="text-left">모듈명</span>
                      {permissionColumns.map((column) => (
                        <span key={column.value} className="text-center">
                          {column.label}
                        </span>
                      ))}
                    </div>

                    <div className="divide-y divide-border overflow-y-auto">
                      {permissions.map((row) => (
                        <div
                          key={row.id}
                          className={`grid grid-cols-[1.4fr_repeat(3,0.6fr)] items-center px-4 py-3 text-sm text-foreground ${isSystemRole ? "bg-muted" : ""}`}
                        >
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{row.name}</span>
                          </div>
                          {permissionColumns.map((column) => (
                            <div
                              key={`${row.id}-${column.value}`}
                              className="flex justify-center"
                            >
                              {renderRadio(row.id, column.value)}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                }
              />
            </div>
            <div className="flex flex-1 w-full h-full flex-col gap-[12px]">
              <div className="flex flex-col gap-[8.5px]">
                <div className="text-sm font-semibold text-foreground">
                  대상자 검색 추가
                </div>
                <div className="flex flex-row gap-[8px] justify-between">
                  <div className="flex-2 relative">
                    <input
                      type="text"
                      data-testid="settings-permissions-user-search-input"
                      value={userKeyword}
                      onChange={(event) => setUserKeyword(event.target.value)}
                      placeholder="사용자를 검색해 주세요"
                      className="flex flex-col justify-center items-center self-stretch w-full h-full px-3 py-2.5 rounded-[6px] border border-border bg-background text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    />
                    {suggestionUsers.length > 0 && (
                      <div className="absolute left-0 right-0 z-10 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-popover shadow-md dark:shadow-none">
                        {suggestionUsers.map((user) => (
                          <button
                            key={user.key}
                            type="button"
                            onClick={() => handleAddUserToRole(user.userId)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-foreground transition hover:bg-muted"
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {user.name}
                                {user.englishName
                                  ? ` (${user.englishName})`
                                  : ""}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {user.roleName || "미할당"} ·{" "}
                                {user.title || user.userTypeName || "-"}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              추가
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-[120px] flex items-center gap-2 justify-end">
                    <MySwitch
                      checked={onlyActive}
                      onCheckedChange={() => setOnlyActive((prev) => !prev)}
                    />
                    <span className="font-pretendard text-[13px] font-normal leading-[125%] tracking-[-0.13px] text-[#989BA2]">
                      사용중인 대상자만 보기
                    </span>
                  </div>
                </div>
              </div>
              <SectionLayout
                className="!p-0"
                body={
                  <div className="">
                    <div className="grid grid-cols-[1.6fr_1.2fr_0.8fr] items-center rounded-t-lg bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700">
                      <span className="text-left">사용자명</span>
                      <span className="text-left">직업</span>
                      <span className="text-right">상태</span>
                    </div>

                    <div className="divide-y divide-slate-100 overflow-y-auto">
                      {isUserListLoading ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-500">
                          사용자 정보를 불러오는 중입니다...
                        </div>
                      ) : assignedUsers.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-slate-500">
                          조건에 맞는 사용자가 없습니다.
                        </div>
                      ) : (
                        assignedUsers.map((user) => (
                          <div
                            key={user.key}
                            className="grid grid-cols-[1.6fr_1.2fr_0.8fr] items-center px-4 py-3 text-sm text-slate-900"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold">
                                  {user.name}
                                </span>
                                {user.englishName ? (
                                  <span className="text-xs text-slate-500">
                                    ({user.englishName})
                                  </span>
                                ) : null}
                                {pendingUserIds.includes(user.userId) ? (
                                  <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">
                                    추가 예정
                                  </span>
                                ) : null}
                              </div>
                              {user.roleName ? (
                                <span className="text-xs font-medium text-slate-600">
                                  {user.roleName}
                                </span>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                              <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
                                {user.title || "-"}
                              </span>
                              <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
                                {user.department || "-"}
                              </span>
                            </div>

                            <div className="flex items-center justify-end">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold ring-1 ${statusBadgeClass[user.statusLabel]}`}
                              >
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${statusDotClass[user.statusLabel]}`}
                                  aria-hidden
                                />
                                {user.statusText}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </>
      }
      footer={
        <>
          <div className="flex flex-1 w-full h-full justify-between">
            <RoleDeleteButton
              role={selectedRole}
              onDeleted={handleRoleDeleted}
              renderTrigger={({ onClick, isDeleting, disabled }) => (
                <button
                  type="button"
                  className={`flex items-center justify-center gap-1 w-16 min-w-[64px] px-2 py-2 rounded-[4px] border overflow-hidden text-center text-ellipsis font-pretendard text-[13px] font-medium leading-[125%] tracking-[-0.13px] flex-shrink-0 ${disabled
                    ? "border-[#DBDCDF] bg-[#EAEBEC] text-[#989BA2]"
                    : "border-[#DBDCDF] bg-white text-[#171719] hover:bg-slate-50"
                    }`}
                  disabled={disabled}
                  onClick={onClick}
                >
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
              )}
            />
            <div className="flex flex-1 w-full h-full justify-end gap-2">
              <button
                type="button"
                className="flex items-center justify-center gap-1 min-w-[64px] px-2 py-2 rounded-[4px] border border-[#DBDCDF] bg-white overflow-hidden text-center text-ellipsis font-pretendard text-[13px] font-medium leading-[125%] tracking-[-0.13px] text-[#171719]"
              >
                취소
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-1 min-w-[64px] px-2 py-2 rounded-[4px] bg-[#180F38] overflow-hidden text-center text-ellipsis font-pretendard text-[13px] font-medium leading-[125%] tracking-[-0.13px] text-[#FFF] border-none"
                onClick={handleSave}
                disabled={isSaveDisabled}
                aria-disabled={isSaveDisabled}
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>

          {confirmMoveModal.open ? (
            <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 px-4">
              <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    권한 변경 확인
                  </h3>
                  <div className="space-y-2 text-sm text-slate-700">
                    {confirmMoveModal.targets.map((user) => (
                      <div
                        key={user.userId}
                        className="rounded-md border border-slate-200 px-3 py-2"
                      >
                        <div className="font-semibold text-slate-900">
                          {user.name}
                        </div>
                        <div className="text-slate-600">
                          기존 권한: {user.roleName || "미할당"}
                        </div>
                        <div className="text-slate-600">
                          변경 권한: {selectedRoleName || "선택된 권한"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="min-w-[72px] rounded-[4px] border border-[#DBDCDF] bg-white px-4 py-2 text-sm font-medium text-slate-800"
                    onClick={() =>
                      setConfirmMoveModal({ open: false, targets: [] })
                    }
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="min-w-[72px] rounded-[4px] bg-[#180F38] px-4 py-2 text-sm font-medium text-white"
                    onClick={() => {
                      const ids = confirmMoveModal.targets.map(
                        (user) => user.userId
                      );
                      setConfirmMoveModal({ open: false, targets: [] });
                      if (!selectedRoleId) return;
                      void persistUsers(
                        selectedRoleId,
                        ids,
                        selectedRoleName ?? roleName
                      );
                    }}
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </>
      }
    />
  );
}
