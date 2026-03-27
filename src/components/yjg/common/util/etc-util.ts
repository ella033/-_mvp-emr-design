// "@/components/yjg/common/util/etc-util";

/**
 * 현재 시간을 기반으로 중복 가능성이 낮은 숫자 ID를 생성합니다.
 * @returns 13자리 숫자 문자열 (timestamp + 3자리 랜덤)
 */
export function generateUniqueId(): string {
  const timestamp = Date.now().toString(); // 13자리 timestamp
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0"); // 3자리 랜덤
  return timestamp + random;
}

/**
 * 현재 시간을 기반으로 중복 가능성이 낮은 숫자를 생성합니다.
 * @returns 16자리 숫자 (timestamp + 3자리 랜덤)
 */
export function generateUniqueNumber(): number {
  const timestamp = Date.now(); // 13자리 timestamp
  const random = Math.floor(Math.random() * 1000); // 3자리 랜덤
  return timestamp * 1000 + random; // 16자리 숫자
}

/**
 * 더 안전한 고유 ID 생성 (마이크로초 + 랜덤)
 * @returns 19자리 숫자 문자열
 */
export function generateSafeUniqueId(): string {
  const now = new Date();
  const timestamp = now.getTime().toString(); // 13자리
  const microseconds = now.getMilliseconds().toString().padStart(3, "0"); // 3자리
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0"); // 3자리
  return timestamp + microseconds + random;
}
