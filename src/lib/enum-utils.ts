/**
 * Enum 유틸리티 함수들
 * C#의 GetEnumFromDescription과 유사한 기능 제공
 */

/**
 * Enum의 Description 매핑 정보를 담는 인터페이스
 */
export interface EnumDescriptionMapping<T> {
  [description: string]: T;
}

/**
 * Enum에서 Description으로 값을 가져오는 함수
 * @param mapping - Description 매핑 객체
 * @param description - 찾을 Description 값
 * @param defaultValue - 기본값 (찾지 못했을 때 반환)
 * @returns Enum 값 또는 기본값
 */
export function getEnumFromDescription<T>(
  mapping: EnumDescriptionMapping<T>,
  description: string,
  defaultValue: T
): T {
  return mapping[description] || defaultValue;
}

/**
 * Enum에서 Description으로 값을 가져오는 함수 (에러 발생)
 * @param mapping - Description 매핑 객체
 * @param description - 찾을 Description 값
 * @param enumName - Enum 이름 (에러 메시지용)
 * @returns Enum 값
 * @throws Error - Description을 찾지 못했을 때
 */
export function getEnumFromDescriptionOrThrow<T>(
  mapping: EnumDescriptionMapping<T>,
  description: string,
  enumName: string
): T {
  const result = mapping[description];
  if (result === undefined) {
    throw new Error(`Not Found - Type: ${enumName}, Description: ${description}`);
  }
  return result;
}

/**
 * Enum 값이 유효한지 확인하는 함수
 * @param mapping - Description 매핑 객체
 * @param description - 확인할 Description 값
 * @returns 유효성 여부
 */
export function isValidEnumDescription<T>(
  mapping: EnumDescriptionMapping<T>,
  description: string
): boolean {
  return description in mapping;
}

/**
 * 모든 Description 값을 배열로 반환하는 함수
 * @param mapping - Description 매핑 객체
 * @returns Description 값들의 배열
 */
export function getAllEnumDescriptions<T>(mapping: EnumDescriptionMapping<T>): string[] {
  return Object.keys(mapping);
} 