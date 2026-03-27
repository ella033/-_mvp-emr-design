export function showDrugInfo(claimCode: string | undefined) {
  if (!claimCode) return;

  // 서버 사이드에서 실행되는 경우 window 객체가 없으므로 return
  if (typeof window === "undefined") return;

  const width = 920;
  const height = Math.min(width, window.innerHeight * 0.7);
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;
  const popupFeatures = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`;
  window.open(
    `https://cp.druginfo.co.kr/ubcare/?type=BasicMonograph&uid=00000000&webFlag=1&id=${claimCode}`,
    "_blank",
    popupFeatures
  );
}
