// 환경설정용 사용자 정보 전역 상태 관리 - hospital_id 기반 통합 관리

import { UserManager } from "@/types/user-types";
import { create } from "zustand";

type UsersState = {
  // hospital_id별로 관리되는 통합 데이터
  usersByHospital: Record<string, UserManager[]>;

  // 통합된 데이터 설정 (hospital_id 기반)
  setUsersByHospital: (hospitalId: string, users: UserManager[]) => void;

  // 개별 사용자 추가/수정/삭제
  addUser: (hospitalId: string, user: UserManager) => void;
  updateUser: (hospitalId: string, userId: number, user: UserManager) => void;
  removeUser: (hospitalId: string, userId: number) => void;

  // 데이터 조회 헬퍼
  getUsersByHospital: (hospitalId: string) => UserManager[];
  getUserById: (hospitalId: string, userId: number) => UserManager | undefined;
};

export const useUsersStore = create<UsersState>((set, get) => ({
  // hospital_id별 통합 데이터
  usersByHospital: {},

  // 통합된 데이터 설정 (ID 기준 정렬)
  setUsersByHospital: (hospitalId, users) =>
    set((state) => ({
      usersByHospital: {
        ...state.usersByHospital,
        [hospitalId]: users.sort((a, b) => a.id - b.id)
      }
    })),

  // 개별 사용자 관리
  addUser: (hospitalId, user) =>
    set((state) => {
      const currentUsers = state.usersByHospital[hospitalId] || [];
      return {
        usersByHospital: {
          ...state.usersByHospital,
          [hospitalId]: [...currentUsers, user].sort((a, b) => a.id - b.id)
        }
      };
    }),

  updateUser: (hospitalId, userId, updatedUser) =>
    set((state) => {
      const currentUsers = state.usersByHospital[hospitalId] || [];
      const updatedUsers = currentUsers.map(user =>
        user.id === userId ? updatedUser : user
      );
      return {
        usersByHospital: {
          ...state.usersByHospital,
          [hospitalId]: updatedUsers
        }
      };
    }),

  removeUser: (hospitalId, userId) =>
    set((state) => {
      const currentUsers = state.usersByHospital[hospitalId] || [];
      const filteredUsers = currentUsers.filter(
        user => user.id !== userId
      );
      return {
        usersByHospital: {
          ...state.usersByHospital,
          [hospitalId]: filteredUsers
        }
      };
    }),

  // 데이터 조회 헬퍼
  getUsersByHospital: (hospitalId) => {
    const state = get();
    return state.usersByHospital[hospitalId] || [];
  },

  getUserById: (hospitalId, userId) => {
    const state = get();
    const users = state.usersByHospital[hospitalId] || [];
    return users.find(user => user.id === userId);
  },
})); 