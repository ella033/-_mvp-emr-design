/**
 * 백신 사용자 코드 정보
 */
export interface VaccinationUserCode {
  /** 사용자 코드 ID */
  id: number;
  /** 병원 ID */
  hospitalId: number;
  /** 백신 코드 */
  code: string;
  /** 백신 이름 */
  name: string;
  /** 백신 가격 */
  price: number;
  /** NIP(국가예방접종) 여부 */
  isNip: boolean;
  /** NIP 코드 */
  nipCode: string;
  /** 생성자 ID */
  createId: number;
  /** 생성 일시 */
  createDateTime: string;
  /** 수정자 ID */
  updateId: number | null;
  /** 수정 일시 */
  updateDateTime: string | null;
  /** 활성화 여부 */
  isActive: boolean;
}
