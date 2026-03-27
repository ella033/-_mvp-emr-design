import { useMemo } from "react";
import { usePermissionStore } from "@/store/permission-store";
import { baseMenus, VisibilityContext } from "@/config/menu-config";

export function useSidebarMenus(visibilityContext: VisibilityContext) {
  const { hasPermission, isOwner, permissions } = usePermissionStore();

  const menus = useMemo(() => {
    return baseMenus
      .filter((item) => {
        // 1. 기존 visibleWhen 체크
        if (item.visibleWhen && !item.visibleWhen(visibilityContext)) return false;
        // 2. 권한 체크 (subject가 있으면 read 권한 필요)
        if (item.subject && !hasPermission(item.subject, "read")) return false;
        return true;
      })
      .map((item) => {
        if (!item.subMenus) return item;
        const filteredSubMenus = item.subMenus.filter((sub) => {
          // SubMenu는 현재 permission check가 없지만 필요한 경우 추가 가능
          return sub.visibleWhen ? sub.visibleWhen(visibilityContext) : true;
        });

        // 권한 정보에서 title 가져오기 (권한이 있으면 덮어쓰기)
        let title = item.title;
        if (item.subject) {
          const permission = permissions?.find(
            (p) => p.subject === item.subject
          );
          if (permission?.name) {
            title = permission.name;
          }
        }

        return { ...item, title, subMenus: filteredSubMenus };
      });
  }, [visibilityContext, hasPermission, isOwner, permissions]);

  return menus;
}
