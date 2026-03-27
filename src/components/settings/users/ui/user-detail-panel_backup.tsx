import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MyButton } from "@/components/yjg/my-button";
import { Calendar as CalendarIcon, Camera, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionLayout } from "../../commons/section-layout";
import { ExtendedUser, UserFieldConfig, UserStatus } from "../model";
import { StatusBadge } from "./status-badge";
// import { UsersService } from "@/services/users-service"; // Removed
import { useToastHelpers } from "@/components/ui/toast";
import { usePermissionRolesQuery } from "@/hooks/permissions/use-permission-queries";

interface UserDetailPanelProps {
  user: ExtendedUser | null;
  onUpdateUser: (userId: number, updates: Partial<ExtendedUser>) => void;
  onSaveUser: (userId: number, data: any) => void;
  onUpdateStatus: (userId: number, status: UserStatus) => void;
  onDeleteUser: (userId: number) => void;
  onCancelInvite: (userId: number) => void;
  onReinvite: (userId: number) => void;
  isLoading?: boolean;
  fieldConfig?: UserFieldConfig;
  renderFooter?: (props: {
    isSaving: boolean;
    handleSave: () => void;
  }) => React.ReactNode;
}

export function UserDetailPanel({
  user,
  onUpdateUser,
  onSaveUser,
  onUpdateStatus,
  onDeleteUser,
  onCancelInvite,
  onReinvite,
  isLoading = false,
  fieldConfig = {},
  renderFooter,
}: UserDetailPanelProps) {
  const toast = useToastHelpers();
  const [isSaving, setIsSaving] = useState(false);
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const { data: roles = [] } = usePermissionRolesQuery();

  // Reset dirty fields when user changes
  useEffect(() => {
    setDirtyFields(new Set());
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background text-muted-foreground">
        사용자를 선택해주세요.
      </div>
    );
  }

  // --- Handlers ---
  const handleSuspendToggle = (checked: boolean) => {
    // Update local state: Toggle uiStatus AND isActive
    const newStatus = checked ? UserStatus.SUSPENDED : UserStatus.ACTIVE;
    onUpdateUser(user.id, {
      uiStatus: newStatus,
      isActive: !checked, // Suspended(true) -> isActive(false)
    });
    setDirtyFields((prev) => new Set(prev).add("uiStatus"));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Delegate payload construction entirely to parent
      // We pass the user object (with optimistic updates applied) and the dirty fields
      // Parent should decide what to extract and send.
      // But onSaveUser signature is (userId, data).
      // We can pass the whole 'user' object as data, or cleaner way:
      await onSaveUser(user.id, {
        ...user,
        _dirtyFields: Array.from(dirtyFields),
      });
      toast.success("저장되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const isSuspended = user.uiStatus === UserStatus.SUSPENDED;
  const isInviting = user.uiStatus === UserStatus.INVITING;
  const isExpired = user.uiStatus === UserStatus.EXPIRED;
  const isTerminated = user.uiStatus === UserStatus.TERMINATED;

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto">
      <SectionLayout
        className="!p-[16px]"
        header={
          <>
            {/* Header Section */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                사용자 정보
              </h2>
              <StatusBadge
                status={user.uiStatus}
                className="text-xs px-2 py-1"
              />
            </div>
          </>
        }
        body={
          <>
            {/* Profile Image Section */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">
                프로필 이미지 <span className="text-destructive">*</span>
              </label>
              <div className="flex items-end gap-3">
                <div className="relative group w-24 h-24">
                  <Avatar className="w-full h-full rounded-xl border border-border bg-background">
                    <AvatarImage
                      src={
                        user.profileFileinfo?.filename
                          ? `/api/files/${user.profileFileinfo.filename}`
                          : undefined
                      }
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-xl text-3xl text-muted-foreground/30">
                      +
                    </AvatarFallback>
                  </Avatar>
                  {/* Camera Icon Overlay (Mock) */}
                  <button className="absolute -bottom-2 -right-2 p-1.5 bg-background border border-border rounded-full shadow-sm text-muted-foreground hover:text-foreground">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Read-Only & Editable Fields Grid */}
            <div className="grid grid-cols-2 gap-[12px]">
              <DetailField label="이름 (국문)" value={user.name} />
              <DetailField label="이름 (영문)" value={user.nameEn || ""} />
              <DetailField label="아이디" value={user.email} />
              <DetailField label="전화번호" value={user.mobile || ""} />
              <DetailField
                label="생년월일"
                value={user.birthDate || ""}
                isDate
              />

              {/* Address (Full width) */}
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  주소
                </label>
                <div className="flex gap-2">
                  <div className="w-24 p-2 bg-muted/50 border border-border rounded text-sm text-muted-foreground">
                    {user.zipcoode || "우편번호"}
                  </div>
                  <MyButton className="h-[32px] w-24">주소검색</MyButton>
                  <div className="flex-1 p-2 bg-muted/50 border border-border rounded text-sm text-muted-foreground">
                    {user.address1 || "기본 주소"}
                  </div>
                </div>
                <div className="p-2 bg-muted/50 border border-border rounded text-sm text-muted-foreground">
                  {user.address2 || "상세 주소 입력"}
                </div>
              </div>

              {/* Editable: Permission */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  권한 <span className="text-destructive">*</span>
                </label>
                <select
                  className="w-full p-2 border border-border rounded text-sm bg-background text-foreground"
                  value={user.roleId || ""}
                  onChange={(e) => {
                    const selectedRoleId = Number(e.target.value);
                    const selectedRole = roles.find(
                      (r) => r.id === selectedRoleId
                    );
                    onUpdateUser(user.id, {
                      roleId: selectedRoleId,
                      roleName: selectedRole?.name,
                    });
                    setDirtyFields((prev) => new Set(prev).add("roleId"));
                  }}
                >
                  <option value="">권한 선택</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Read-Only: Job & License */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  직업
                </label>
                <div className="w-full p-2 bg-muted/50 border border-border rounded text-sm text-muted-foreground">
                  {user.positionName || "직업"}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  면허번호
                </label>
                <div className="w-full p-2 bg-muted/50 border border-border rounded text-sm text-muted-foreground">
                  {user.licenseNo || "0000000"}
                </div>
              </div>

              {/* Dates */}
              <DetailField
                label="사용 시작일"
                value={user.invitationDate?.split("T")[0] || ""}
                isDate
              />

              {/* Editable: End Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">
                  사용 종료일
                </label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full p-2 border border-border rounded text-sm bg-background text-foreground"
                    value={user.endDate?.split("T")[0] || ""}
                    onChange={(e) => {
                      onUpdateUser(user.id, { endDate: e.target.value });
                      setDirtyFields((prev) => new Set(prev).add("endDate"));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Suspend Toggle - Render only if configured or explicit? 
                Actually, Suspend is a "status" change. 
                If we use fieldConfig for 'uiStatus', we can decide to show/hide this toggle.
            */}
            {fieldConfig["uiStatus"]?.editable && (
              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isSuspended}
                    onChange={(e) => handleSuspendToggle(e.target.checked)}
                  />
                  <div className="w-9 h-5 bg-muted peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  <span className="ms-3 text-sm font-medium text-muted-foreground">
                    사원 정지
                  </span>
                </label>
              </div>
            )}
          </>
        }
        footer={
          renderFooter ? (
            renderFooter({ isSaving, handleSave })
          ) : (
            /* Default Footer (Admin View fallback) */
            <>
              <div className="flex justify-end gap-2 pt-4">
                {/* 1. Inviting: Cancel Invite, Re-invite */}
                {isInviting && (
                  <>
                    <MyButton
                      variant="outline"
                      className="h-[32px]"
                      onClick={() => onCancelInvite(user.id)}
                    >
                      초대 취소
                    </MyButton>
                    <MyButton
                      variant="outline"
                      className="h-[32px]"
                      onClick={() => onReinvite(user.id)}
                    >
                      다시 초대
                    </MyButton>
                  </>
                )}

                {/* 2. Expired: Delete, Re-invite */}
                {isExpired && (
                  <>
                    <MyButton
                      variant="outline"
                      className="h-[32px]"
                      onClick={() => onReinvite(user.id)}
                    >
                      다시 초대
                    </MyButton>
                    <MyButton
                      className="h-[32px]"
                      variant="danger"
                      onClick={() => onDeleteUser(user.id)}
                    >
                      삭제
                    </MyButton>
                  </>
                )}

                {/* 3. Terminated: Delete (Only active in Terminated state) */}
                {isTerminated && (
                  <MyButton
                    className="h-[32px]"
                    variant="danger"
                    onClick={() => onDeleteUser(user.id)}
                  >
                    삭제
                  </MyButton>
                )}

                {/* Common Actions for Active/Suspended (Regular Users) */}
                {!isInviting && !isExpired && !isTerminated && (
                  <>
                    {/* Delete button for Suspended users as requested */}
                    {isSuspended && (
                      <MyButton
                        className="h-[32px] mr-auto"
                        variant="danger"
                        onClick={() => onDeleteUser(user.id)}
                      >
                        삭제
                      </MyButton>
                    )}

                    <MyButton
                      variant="outline"
                      className="h-[32px]"
                      onClick={() => {
                        /* Cancel Action */
                      }}
                    >
                      취소
                    </MyButton>
                    <MyButton
                      className="h-[32px]"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "저장"
                      )}
                    </MyButton>
                  </>
                )}
              </div>
            </>
          )
        }
      ></SectionLayout>
    </div>
  );
}

function DetailField({
  label,
  value,
  isDate = false,
  editable = false,
  onChange,
}: {
  label: string;
  value: string;
  isDate?: boolean;
  editable?: boolean;
  onChange?: (val: string) => void;
}) {
  if (editable && onChange) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">
          {label}
        </label>
        <div className="relative w-full">
          <input
            type={isDate ? "date" : "text"}
            className="w-full p-2 border border-border rounded text-sm bg-background text-foreground"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-muted-foreground">
        {label}
      </label>
      <div className="relative w-full">
        <input
          type="text"
          readOnly
          value={value}
          className="w-full p-2 bg-muted/50 border border-border rounded text-sm text-foreground focus:outline-none"
        />
        {isDate && (
          <CalendarIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
}
