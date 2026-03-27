/**
 * 보험공단 정보 타입
 * C# Unions 클래스와 동일한 구조
 */
export interface Union {
  /** 보험공단 코드 */
  unionCode: string;
  /** 보험공단명 */
  unionName: string;
  /** 보험구분 */
  보험구분: string;
  /** 자보코드 */
  자보코드: string;
}

/**
 * 기본 Union 객체 생성
 */
export const createDefaultUnion = (): Union => ({
  unionCode: '',
  unionName: '',
  보험구분: '',
  자보코드: ''
});

/**
 * Union 객체가 유효한지 확인
 */
export const isValidUnion = (union: Union): boolean => {
  return union.unionCode.trim() !== '' && union.unionName.trim() !== '';
};

/**
 * Union 객체를 문자열로 변환
 */
export const unionToString = (union: Union): string => {
  if (!isValidUnion(union)) return '';
  return `${union.unionName} (${union.unionCode})`;
}; 