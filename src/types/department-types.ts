import { DepartmentPositionType } from "./department-position-types";

export type DepartmentType = {
  id: number;
  hospitalId: number;
  name: string;
  createId: number;
  createDateTime: string;
  updateId: number | null;
  updateDateTime: string | null;
  isActive: boolean;
  positions?: DepartmentPositionType[]; // 부서에 속한 직급들
};

// 부서와 직급을 함께 관리하는 통합 타입
export type DepartmentWithPositionsType = {
  department: DepartmentType;
  positions: DepartmentPositionType[];
};

export type DepartmentRequestType = {
  name: string;
};

export type DepartmentUpdateRequestType = {
  name: string;
};