import { UserInvitationStatus } from "@/constants/user-enums";

// 초대 링크 검증 응답
export interface VerifyInvitationResponseDto {
  invitationId: string; // 초대장 ID (UUID)
  status: UserInvitationStatus; // 초대 상태 (1: 초대중, 2: 초대완료, 3: 초대취소, 9: 초대만료)
  isRegistered: boolean; // 회원 가입 여부
}

// 초대 정보 조회 응답
export interface GetInvitationResponseDto {
  invitedEmail: string; // 초대받는 사용자 이메일
}
