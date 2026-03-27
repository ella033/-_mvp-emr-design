export enum UserLoginLogType {
  로그인성공 = 1,
  로그인실패 = 2,
  로그아웃 = 3,
  로그아웃_관리자 = 4,
  로그아웃_시스템 = 5,
  계정잠김 = 6,
  계정잠김해제 = 7,
}

export enum UserInvitationStatus {
  초대중 = 1,
  초대완료 = 2,
  초대취소 = 3,
  초대만료 = 9,
}

export enum HospitalUserStatus {
  사용중 = 10,
  사용정지 = 20,
  사용종료 = 90,
}

// 초대 상태와 사용 상태를 포함하는 상태 정의
export enum UserStatusWithInvitation {
  // 초대 상태 (UserInvitationStatus)
  초대중 = 1,
  초대완료 = 2,
  초대취소 = 3,
  초대만료 = 9,
  // 사용 상태 (HospitalUserStatus)
  사용중 = 10,
  사용정지 = 20,
  사용종료 = 90,
}
