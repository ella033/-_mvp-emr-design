import { DepartmentWithPositionsType } from "@/types/department-types";
import { DepartmentPositionType } from "@/types/department-position-types";
import { create } from "zustand";

// 부서 정보 전역 상태 관리 - hospital_id 기반 통합 관리

type DepartmentState = {
  // hospital_id별로 관리되는 통합 데이터
  departmentsByHospital: Record<string, DepartmentWithPositionsType[]>;

  // 통합된 데이터 설정 (hospital_id 기반)
  setDepartmentsByHospital: (
    hospitalId: string,
    departments: DepartmentWithPositionsType[]
  ) => void;

  // 개별 부서 추가/수정/삭제
  addDepartment: (
    hospitalId: string,
    department: DepartmentWithPositionsType
  ) => void;
  updateDepartment: (
    hospitalId: string,
    departmentId: number,
    department: DepartmentWithPositionsType
  ) => void;
  removeDepartment: (hospitalId: string, departmentId: number) => void;

  // 개별 직급 추가/수정/삭제
  addDepartmentPosition: (
    hospitalId: string,
    departmentId: number,
    position: DepartmentPositionType
  ) => void;
  updateDepartmentPosition: (
    hospitalId: string,
    departmentId: number,
    positionId: number,
    position: DepartmentPositionType
  ) => void;
  removeDepartmentPosition: (
    hospitalId: string,
    departmentId: number,
    positionId: number
  ) => void;

  // 데이터 조회 헬퍼
  getDepartmentsByHospital: (
    hospitalId: string
  ) => DepartmentWithPositionsType[];
  getDepartment: (
    hospitalId: string,
    departmentId: number
  ) => DepartmentWithPositionsType | undefined;
};

export const useDepartmentStore = create<DepartmentState>((set, get) => ({
  // hospital_id별 통합 데이터
  departmentsByHospital: {},

  // 통합된 데이터 설정 (ID 기준 정렬)
  setDepartmentsByHospital: (hospitalId, departments) =>
    set((state) => ({
      departmentsByHospital: {
        ...state.departmentsByHospital,
        [hospitalId]: departments.sort((a, b) => a.department.id - b.department.id)
      }
    })),

  // 개별 부서 관리
  addDepartment: (hospitalId, department) =>
    set((state) => {
      const currentDepartments = state.departmentsByHospital[hospitalId] || [];
      return {
        departmentsByHospital: {
          ...state.departmentsByHospital,
          [hospitalId]: [...currentDepartments, department].sort((a, b) => a.department.id - b.department.id)
        }
      };
    }),

  updateDepartment: (hospitalId, departmentId, updatedDepartment) =>
    set((state) => {
      const currentDepartments = state.departmentsByHospital[hospitalId] || [];
      const updatedDepartments = currentDepartments.map((dept) =>
        dept.department.id === departmentId ? updatedDepartment : dept
      );
      return {
        departmentsByHospital: {
          ...state.departmentsByHospital,
          [hospitalId]: updatedDepartments,
        },
      };
    }),

  removeDepartment: (hospitalId, departmentId) =>
    set((state) => {
      const currentDepartments = state.departmentsByHospital[hospitalId] || [];
      const filteredDepartments = currentDepartments.filter(
        (dept) => dept.department.id !== departmentId
      );
      return {
        departmentsByHospital: {
          ...state.departmentsByHospital,
          [hospitalId]: filteredDepartments,
        },
      };
    }),

  // 개별 직급 관리
  addDepartmentPosition: (hospitalId, departmentId, position) =>
    set((state) => {
      const currentDepartments = state.departmentsByHospital[hospitalId] || [];
      const updatedDepartments = currentDepartments.map((dept) =>
        dept.department.id === departmentId
          ? { ...dept, positions: [...dept.positions, position] }
          : dept
      );
      return {
        departmentsByHospital: {
          ...state.departmentsByHospital,
          [hospitalId]: updatedDepartments,
        },
      };
    }),

  updateDepartmentPosition: (
    hospitalId,
    departmentId,
    positionId,
    updatedPosition
  ) =>
    set((state) => {
      const currentDepartments = state.departmentsByHospital[hospitalId] || [];
      const updatedDepartments = currentDepartments.map((dept) =>
        dept.department.id === departmentId
          ? {
              ...dept,
              positions: dept.positions.map((pos) =>
                pos.id === positionId ? updatedPosition : pos
              ),
            }
          : dept
      );
      return {
        departmentsByHospital: {
          ...state.departmentsByHospital,
          [hospitalId]: updatedDepartments,
        },
      };
    }),

  removeDepartmentPosition: (hospitalId, departmentId, positionId) =>
    set((state) => {
      const currentDepartments = state.departmentsByHospital[hospitalId] || [];
      const updatedDepartments = currentDepartments.map((dept) =>
        dept.department.id === departmentId
          ? {
              ...dept,
              positions: dept.positions.filter((pos) => pos.id !== positionId),
            }
          : dept
      );
      return {
        departmentsByHospital: {
          ...state.departmentsByHospital,
          [hospitalId]: updatedDepartments,
        },
      };
    }),

  // 데이터 조회 헬퍼
  getDepartmentsByHospital: (hospitalId) => {
    const state = get();
    return state.departmentsByHospital[hospitalId] || [];
  },

  getDepartment: (hospitalId, departmentId) => {
    const state = get();
    const departments = state.departmentsByHospital[hospitalId] || [];
    return departments.find((dept) => dept.department.id === departmentId);
  },
}));
