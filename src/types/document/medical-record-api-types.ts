/**
 * 진료기록부 조회 API 응답 (백엔드 MedicalRecordResponseDto 한글 필드명)
 */
export interface MedicalRecordApiResponse {
  출력일시: string;
  교부번호: string;
  환자: {
    번호: number;
    성별: string;
    성명: string;
    나이: number;
    주민등록번호: string | null;
    조회용주민번호: string | null;
  };
  의사: {
    이름: string;
  };
  처방목록: Array<{
    입력구분: number; // InputType: 0=일반, 1=지시오더, 2=구분선, 3=묶음헤더
    처방구분: number; // PrescriptionType: 1=수가, 2=약가, 3=재료대
    항목구분: string; // 항목 분류 코드
    란구분: number; // ColumnType: 0=없음, 1=1란(내복약), 2=2란(외용약/주사제)
    원내외구분: number; // InOut: 1=원내, 2=원외, 3=수탁
    명칭: string;
    용량: string;
    일투: string;
    일수: string;
    용법: string;
    청구여부: boolean;
  }>;
}
