// CRM 발신번호 생성 요청 DTO
export interface CreateCrmSenderDto {
  senderNumber: string;
  isMain?: boolean;
}

// CRM 발신번호 수정 요청 DTO
export interface UpdateCrmSenderDto {
  isMain: boolean;
}

// CRM 발신번호 응답 DTO
export interface CrmSenderResponseDto {
  hospitalId: number;
  senderNumber: string;
  isMain: boolean;
  createId: number;
  createDateTime: string;
  updateId?: number;
  updateDateTime?: string;
}
