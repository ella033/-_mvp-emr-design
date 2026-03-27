/**
 * 비밀번호 만료 임박 여부를 체크하는 순수 함수
 * @param passwordChangedAt 마지막 비밀번호 변경일 (ISO string)
 * @returns { warningNeeded: boolean, daysRemaining: number }
 */
export const checkPasswordExpiry = (
  passwordChangedAt: string | null | undefined
): { warningNeeded: boolean; daysRemaining: number } => {
  if (!passwordChangedAt) {
    return { warningNeeded: false, daysRemaining: 0 };
  }

  const lastChanged = new Date(passwordChangedAt);
  const expiryDate = new Date(lastChanged);
  expiryDate.setMonth(expiryDate.getMonth() + 3);

  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 만료 2주 전 (14일) 부터 만료 당일(0일) 까지 경고
  const warningNeeded = diffDays <= 14 && diffDays >= 0;

  return { warningNeeded, daysRemaining: diffDays };
};
