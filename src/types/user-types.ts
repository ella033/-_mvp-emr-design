import { FileInfo } from "./file-types";
import { UserType } from "@/constants/common/common-enum";

// ================================ 사용자 기본 ================================
export interface UserBase {
  hospitalId: number;
  loginId?: string;
  password?: string;
  type: UserType;
  name: string;
  email: string;
  mobile?: string;
  isActive: boolean;
  nameEn?: string | null;
  profileFileinfo?: FileInfo | null;
  hireDate?: string | null;
  birthDate?: string | null;
  licenseNo?: string | null;
  zipcoode?: string | null;
  address1?: string | null;
  address2?: string | null;
  positionId?: number;
  departmentId?: number;
}

// ================================ 사용자 관리 ================================
export interface UserManager extends UserBase {
  id: number;
  departmentName: string;
  positionName: string;
  roleId?: number | null;
  roleName?: string | null;
  status?: number | null;
  statusName?: string | null;
  userTypeName?: string | null;
  specialtyName?: string | null;
  createId?: number;
  createDateTime?: string;
  updateId?: number | null;
  updateDateTime?: string | null;
}

// ================================ 사용자 정보 ================================
export interface User extends UserBase {
  id: number;
  createId?: number;
  createDateTime?: string;
  updateId?: number | null;
  updateDateTime?: string | null;
  roleId?: number | null;
  roleName?: string | null;
  status?: number | null;
  statusName?: string | null;
  userTypeName?: string | null;
  specialtyName?: string | null;
}

// ================================ 사용자 생성 ================================
export interface CreateUserRequest extends Omit<UserBase, "hospitalId"> {
  hospitalId?: number;
  invitationId?: string;
}
export interface CreateUserResponse {
  id: number;
}

// ================================ 사용자 수정 ================================
export interface UpdateUserRequest extends Partial<UserBase> { }
export interface UpdateUserResponse extends User { }

// ================================ 병원 사용자 (간편 조회용) ================================
export interface HospitalUser {
  userId: number;
  userName: string;
}

// ================================ 사용자 삭제 ================================
export interface DeleteUserRequest { }
export interface DeleteUserResponse {
  id: number;
}
