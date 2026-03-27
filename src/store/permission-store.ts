import { create } from "zustand";
import { Permission, PermissionAction } from "@/types/permission-types";

interface PermissionState {
  permissions: Permission[];
  isLoading: boolean;
  isOwner: boolean; // 소유자 여부 추가

  setPermissions: (permissions: Permission[]) => void;
  setOwner: (isOwner: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  clearPermissions: () => void;

  // 권한 체크 헬퍼
  hasPermission: (subject: string, action: PermissionAction) => boolean;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: [],
  isLoading: false,
  isOwner: false,

  setPermissions: (permissions) => set({ permissions }),
  setOwner: (isOwner) => set({ isOwner }),
  setLoading: (isLoading) => set({ isLoading }),
  clearPermissions: () =>
    set({ permissions: [], isOwner: false, isLoading: false }),

  hasPermission: (subject, action) => {
    const { permissions, isOwner } = get();

    // 1. 병원 소유자는 무조건 통과
    if (isOwner) return true;

    // 2. 해당 subject에 대한 권한 찾기
    const permission = permissions.find((p) => p.subject === subject);
    if (!permission) return false;

    // 3. Action 비교
    // manage 권한이 있으면 read도 가능하다고 판단
    if (permission.action === "manage") return true;

    // read 권한만 있는데 manage를 요청하면 false
    if (permission.action === "read" && action === "manage") return false;

    // read 권한이 있고 read를 요청하면 true
    if (permission.action === "read" && action === "read") return true;

    return false;
  },
}));
