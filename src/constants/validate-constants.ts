/**
 * 검증(Validation) 관련 메시지 상수 모음
 * - 화면/도메인 전반에서 재사용되는 검증 메시지는 이 파일로 모아 관리합니다.
 */
export const VALIDATE_MSG = {
  RECEPTION: {
    NAME_REQUIRED: "이름을 입력해주세요.",
    RRN_REQUIRED: "주민등록번호를 입력해주세요.",
    FACILITY_REQUIRED: "진료실을 선택해주세요.",
  },
  APPOINTMENT: {
    NAME_REQUIRED: "환자명을 입력해주세요.",
    PATIENT_REQUIRED: "환자를 선택 해주세요.",
    APPOINTMENT_INFO_REQUIRED: "예약 정보를 입력해주세요.",
    TIME_REQUIRED: "예약시간을 설정하지 않았습니다.",
    ROOM_REQUIRED: "예약실을 선택해주세요.",
    PHONE_REQUIRED: "전화번호를 입력해주세요.",
    PHONE_INVALID: "전화번호를 형식에 맞게 입력해주세요.",
    BIRTHDATE_INVALID: "생년월일을 형식에 맞게 입력해주세요.",
  },
} as const;


