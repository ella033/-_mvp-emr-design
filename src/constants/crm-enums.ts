export enum CrmMessageType {
  문자 = 1,
  알림톡 = 2,
}

export enum CrmMessageSubType {
  SMS = 0,
  LMS = 3,
  MMS = 4,
  알림톡 = 5,
  친구톡 = 6,
  친구톡이미지 = 7,
}

export enum CrmSendType {
  자동발송 = 1,
  수동발송 = 2,
  진료실발송 = 3,
  접수실발송 = 4,
}

export enum CrmEventType {
  예약완료_변경_취소안내 = 1,
  내원전안내 = 2,
  내원후안내 = 3,
}

export enum CrmEventSendTimeType {
  예약완료시 = 1,
  예약변경시 = 2,
  예약취소시 = 3,
  상세설정 = 99,
}

export enum CrmMessageRegStatus {
  등록대기 = 0, // 등록 전 상태
  등록성공 = 1, // 등록 완료
  등록실패 = 2, // 등록 실패
  발송대기 = 3, // 발송 대기
  발송성공 = 4, // 발송 성공
  발송실패 = 5, // 발송 실패
  예약발송 = 6, // 예약 발송
  발송취소 = 7, // 발송 취소
}

export enum CrmMessageReplaceText {
  환자명 = "{환자명}",
  환자생일 = "{환자생일}",
  병원명 = "{병원명}",
  병원전화번호 = "{병원전화번호}",
  병원주소 = "{병원주소}",
  예약일 = "{예약일}",
  예약시간 = "{예약시간}",
  예약실 = "{예약실}",
  최근내원일 = "{최근내원일}",
}
