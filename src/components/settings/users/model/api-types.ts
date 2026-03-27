
export interface CreateUserInvitationDto {
  /** 초대받는 사용자 이메일 */
  invitedEmail: string;
  /** 초대받은 사용자 가입 시 권한 ID */
  userRoleId: number;
}

export interface CreateUserInvitationResponseDto {
  success: boolean;
  // Add other fields if necessary based on actual response
}

export enum ApiUserStatus {
  INVITING = 1,       // 초대중
  ACCEPTED = 2,       // 초대완료 (가입완료)
  CANCELED = 3,       // 초대취소
  INVITE_EXPIRED = 9, // 초대만료
  ACTIVE = 10,        // 사용중
  SUSPENDED = 20,     // 사용정지
  TERMINATED = 90,    // 사용종료
}

export interface GetUserInvitationsResponseDto {
  /** 초대 ID (초대 사용자인 경우) */
  invitedId?: number;
  /** 사용자 ID (병원 사용자인 경우) */
  userId?: number;
  /** 병원 사용자 여부 */
  isHospitalUser: boolean;
  /** 초대받는 사용자 이메일 */
  email: string;
  /** 이름 (국문) */
  name: string;
  /** 이름 (영문) */
  nameEn?: string;
  /** 사용자 유형 (예: 의사) */
  typeName?: string;
  /** 사용자 상태 (1: 초대중, 2: 초대만료, 3: 사용중, 4: 사용정지, 5: 사용종료) */
  status: number;
  /** 초대 만료일시 */
  expiresAt?: string;
  /** 사용자 존재 여부 (회원가입 상태) */
  isUserExist: boolean;
  /** 권한 그룹 ID */
  roleId?: number;
  /** 권한 그룹 명 */
  roleName?: string;
}

export interface GetHospitalUsersResponseDto {
  /** 사용자 ID */
  id: number;
  /** 사용자 이름 */
  name: string;
  /** 사용자 이름(영문) */
  nameEn?: string;
  /** 이메일 */
  email: string;
  /** 전공 과목 */
  specialty?: string;
  /** 상태 */
  status: number;
  /** 사용 여부 */
  isActive: boolean;
  /** 생성자 ID */
  createId: string;
  /** 생성일시 */
  createDateTime: string;
}

export interface UpdateHospitalUserStatusDto {
  isActive?: boolean;
  hireDate?: string;
  resignationDate?: string;
  terminateImmediately?: boolean;
  roleId?: number;
}

export interface PermissionDto {
  action: string;
  subject: string;
}

export interface GetRolesResponseDto {
  /** 권한 그룹 ID */
  id: number;
  /** 권한 그룹 명 */
  name: string;
  /** 권한 그룹 설명 */
  description?: string;
  /** 시스템 제공 권한 그룹 여부 */
  isSystem: boolean;
}

export interface GetHospitalUserDetailResponseDto {
  id: number;
  name: string;
  nameEn?: string;
  email: string;
  mobile?: string; // 010-0000-0000
  zipcode?: string;
  address1?: string;
  address2?: string;
  departmentId?: number;
  departmentName?: string;
  positionId?: number;
  positionName?: string;
  roleName?: string;
  licenseNo?: string;
  birthDate?: string; // YYYYMMDD
  hireDate?: string; // YYYYMMDD
  specialty?: string;
  profileFileinfo?: {
    filename: string;
  };
  status: number;
  createDateTime: string;
}
