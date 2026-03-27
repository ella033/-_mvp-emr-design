import { UserManager } from "@/types/user-types";

export enum UserStatus {
  INVITING = "INVITING", // 초대중
  EXPIRED = "EXPIRED", // 초대만료
  ACTIVE = "ACTIVE", // 사용중
  SUSPENDED = "SUSPENDED", // 사용정지
  TERMINATED = "TERMINATED", // 사용종료
}

// 0: 사용정지, 1: 사용중 (DB값 예시)
// 초대중, 초대만료, 사용종료는 DB의 status 컬럼 외에 다른 조건(날짜 등)으로 판단되거나 별도 상태값이 있을 수 있음.
// 프론트엔드 UI용 통합 상태 타입

// Base Interface for common fields
export interface BaseUser extends Partial<UserManager> {
  id: number; // For List Key
  email: string;
  name: string;
  roleName?: string;
  uiStatus: UserStatus;
  createDateTime: string;
  type: any; // "의사" | "간호사" ...
}

// Model 1: Invitation (초대)
// Model 1: Invitation (초대)
export interface InvitationUser extends BaseUser {
  kind: "INVITATION"; // Discriminator
  invitedId: number; // Unique Invite ID
  invitationDate: string; // Mapped from usageStartDate
  endDate?: string; // Mapped from expiresAt
  statusName?: string;
  invitedEmail?: string; // Original field from JSON
}

// Model 2: Hospital User (병원 사용자)
export interface HospitalUser extends BaseUser {
  kind: "HOSPITAL_USER"; // Discriminator
  userId: number; // Unique User ID
  nameEn?: string | null;
  mobile?: string | null;
  zipcode?: string | null; // Fixed typo zipcoode -> zipcode
  address1?: string | null;
  address2?: string | null;

  // type is in BaseUser, but here we might have typeName explicit
  typeName?: string;

  departmentId?: number;
  departmentName?: string;

  // positionId vs type? The JSON has type: 1. Let's keep positionId if it comes from elsewhere, but add type fields.
  positionId?: number;
  positionName?: string; // Mapped from typeName usually

  licenseNo?: string | null;
  birthDate?: string | null;
  hireDate?: string | null;
  resignationDate?: string | null;
  isActive: boolean;

  profileFileInfo?: { id: number; uuid: string } | null; // Note: profileFileInfo (Camel)

  // Doctor Specific
  specialty?: number | null; // ID
  specialtyName?: string | null; // Name
  specialtyCertNo?: string | null; // Was specialistNo

  // UI / Logic Specific
  isOwner?: boolean;
}

// Union Type
export type ExtendedUser = InvitationUser | HospitalUser;


export interface UserFieldConfig {
  [key: string]: {
    editable?: boolean;
    hidden?: boolean;
  };
}

export type UserFilterStatus = "ALL" | UserStatus;

export const UserStatusLabel: Record<UserStatus, string> = {
  [UserStatus.INVITING]: "초대중",
  [UserStatus.EXPIRED]: "초대만료",
  [UserStatus.ACTIVE]: "사용중",
  [UserStatus.SUSPENDED]: "사용정지",
  [UserStatus.TERMINATED]: "사용종료",
};

export const UserStatusColor: Record<UserStatus, string> = {
  [UserStatus.INVITING]: "text-green-500 bg-green-50",
  [UserStatus.EXPIRED]: "text-red-500 bg-red-50",
  [UserStatus.ACTIVE]: "text-blue-500 bg-blue-50",
  [UserStatus.SUSPENDED]: "text-orange-500 bg-orange-50",
  [UserStatus.TERMINATED]: "text-gray-500 bg-gray-50",
};
