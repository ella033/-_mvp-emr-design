
import { baseMenus, MenuItem, SubMenuItem } from "@/config/menu-config";

/**
 * 주어진 경로(pathname)에 해당하는 메뉴 이름을 반환합니다.
 * @param pathname 현재 경로 (예: /reception/management)
 * @returns 메뉴 이름 (예: "접수/수납 현황") 또는 기본값
 */
export function getMenuNameFromPath(pathname: string): string {
  if (!pathname) return "Unknown Menu";

  // 1. 완전 일치하는 하위 메뉴 검색
  for (const menu of baseMenus) {
    if (menu.subMenus) {
      const subMatch = menu.subMenus.find((sub) => sub.url === pathname);
      if (subMatch) {
        return subMatch.title;
      }
    }
  }

  // 2. 완전 일치하는 상위 메뉴 검색
  const mainMatch = baseMenus.find((menu) => menu.url === pathname);
  if (mainMatch) {
    return mainMatch.title;
  }

  // 3. 경로가 포함되는 메뉴 검색 (상세 페이지 등 고려)
  // 예: /reception/management/123 -> /reception/management 매칭
  // subMenus 먼저 확인 (더 구체적인 경로)
  for (const menu of baseMenus) {
    if (menu.subMenus) {
      // URL 길이가 긴 순서대로 정렬하여 가장 구체적인 매칭 찾기
      const sortedSubMenus = [...menu.subMenus].sort((a, b) => b.url.length - a.url.length);
      
      const subMatch = sortedSubMenus.find(
        (sub) => pathname.startsWith(sub.url) && sub.url !== "/"
      );
      if (subMatch) {
        return subMatch.title;
      }
    }
  }
  
  // URL 길이가 긴 순서대로 정렬하여 가장 구체적인 매칭 찾기
  const sortedBaseMenus = [...baseMenus].sort((a, b) => (b.url?.length || 0) - (a.url?.length || 0));
  const mainPartialMatch = sortedBaseMenus.find(
    (menu) => menu.url && pathname.startsWith(menu.url) && menu.url !== "/"
  );
  if (mainPartialMatch) {
    return mainPartialMatch.title;
  }

  // 4. 루트 경로 또는 미매칭 (홈 메뉴 제거됨)
  return "상세/기타";
}
