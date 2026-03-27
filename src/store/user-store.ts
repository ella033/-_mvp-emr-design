// 사용자 정보 전역 상태 관리

import { AuthUserType } from "@/types/auth-types";
import type { User } from "@/types/user-types";
import { create } from "zustand";
import { syncWithBroadcast } from "@/lib/broadcast-sync";

type UserState = {
  user: AuthUserType | User;
  setUser: (user: AuthUserType | User) => void;
  setHospitalId: (hospitalId: number) => void;
};

export const useUserStore = create<UserState>()(
  syncWithBroadcast("user-store", (set) => ({
    user: {} as AuthUserType | User, // 초기값
    setUser: (user: AuthUserType | User) => set(() => ({ user: user })),
    setHospitalId: (hospitalId: number) =>
      set((state) => ({
        user: { ...state.user, hospitalId } as AuthUserType | User,
      })),
  }), {
    pick: ["user"],
  })
);
