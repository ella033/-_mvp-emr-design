/**
 * PostgreSQL ORDER BY position (C 로케일)과 동일한 문자열 정렬.
 * charCode 기준: 숫자(0-9) → 대문자(A-Z) → 소문자(a-z), 동일 접두사면 짧은 문자열 우선.
 * @example "3" < "6" < "9" < "C" < "U" < "V0" < "a" < "d"
 */
export function comparePositionString(a: string, b: string): number {
  const posA = a ?? "";
  const posB = b ?? "";
  const len = Math.min(posA.length, posB.length);

  for (let i = 0; i < len; i++) {
    const diff = posA.charCodeAt(i) - posB.charCodeAt(i);
    if (diff !== 0) return diff;
  }

  return posA.length - posB.length;
}
