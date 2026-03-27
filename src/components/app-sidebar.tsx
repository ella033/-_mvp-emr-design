// 이 파일은 앱의 좌측 사이드바(AppSidebar) 컴포넌트와 관련된 UI 및 메뉴 로직을 정의합니다.

"use client";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import React, { useMemo, useState, useEffect } from "react";
import {
  safeLocalStorage,
  safeJsonParse,
} from "@/components/yjg/common/util/ui-util";
import { SettingsModal } from "@/components/settings/settings-modal";
import { MyTooltip } from "@/components/yjg/my-tooltip";

import { MenuItem, VisibilityContext } from "@/config/menu-config";
import { useSidebarMenus } from "@/hooks/use-sidebar-menus";
import { useReceptionStore } from "@/store/common/reception-store";

// 로고 섹션 컴포넌트: 사이드바 상단에 로고를 표시합니다.
import { useHospitalStore } from "@/store/hospital-store";

function LogoSection() {
  const hospitalName = useHospitalStore((state) => state.hospital?.name);
  const { state } = useSidebar();
  return (
    <div
      className={cn(
        "min-w-0 flex-1 flex items-center",
        state === "collapsed" && "hidden overflow-hidden"
      )}
    >
      <Link href="/reception/management" className="min-w-0 truncate leading-none text-[var(--gray-100)] font-[700] text-[14px] whitespace-nowrap">
        {hospitalName}
      </Link>
    </div>
  );
}

interface SidebarMenuSectionProps {
  items: MenuItem[];
  children?: React.ReactNode;
}

function SidebarMenuSection({ items, children }: SidebarMenuSectionProps) {
  const { state } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  // Collapsible의 open 상태를 관리하기 위한 state
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // 초기 상태를 localStorage에서 로드
  useEffect(() => {
    const stored = safeJsonParse(
      safeLocalStorage.getItem("sidebarActiveMenus"),
      [] as string[]
    );
    const initialOpen: Record<string, boolean> = {};
    items.forEach((item) => {
      if (item.subMenus) {
        initialOpen[item.title] = stored?.includes(item.title) || false;
      }
    });
    setOpenMenus(initialOpen);
  }, [items]);

  const handleMenuClick = (menuTitle: string) => {
    const prev = safeJsonParse(
      safeLocalStorage.getItem("sidebarActiveMenus"),
      [] as string[]
    );
    let next;
    const isCurrentlyOpen = prev?.includes(menuTitle);
    if (isCurrentlyOpen) {
      next = prev.filter((t: string) => t !== menuTitle);
    } else {
      next = [...prev, menuTitle];
    }
    safeLocalStorage.setItem("sidebarActiveMenus", JSON.stringify(next));

    // React state도 업데이트하여 리렌더링 트리거
    setOpenMenus((prev) => ({
      ...prev,
      [menuTitle]: !isCurrentlyOpen,
    }));
  };

  return (
    <SidebarMenu
      className={cn(
        "gap-1 px-1",
        state === "collapsed" && "flex flex-col items-center"
      )}
    >
      {items.map((item) =>
        item.subMenus ? (
          <Collapsible
            key={item.title}
            asChild
            open={openMenus[item.title] ?? false}
            onOpenChange={(open) => {
              setOpenMenus((prev) => ({
                ...prev,
                [item.title]: open,
              }));
              const prev = safeJsonParse(
                safeLocalStorage.getItem("sidebarActiveMenus"),
                [] as string[]
              );
              let next;
              if (open) {
                next = prev?.includes(item.title)
                  ? prev
                  : [...prev, item.title];
              } else {
                next = prev?.filter((t: string) => t !== item.title) || [];
              }
              safeLocalStorage.setItem(
                "sidebarActiveMenus",
                JSON.stringify(next)
              );
            }}
            className="flex flex-col w-full rounded-md group/collapsible"
          >
            <SidebarMenuItem key={item.title}>
              {state === "collapsed" ? (
                <HoverCard openDelay={200} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <div className="w-full flex justify-center">
                      <SidebarMenuButton
                        isActive={
                          pathname === item.url ||
                          (item.subMenus?.some(
                            (sub: any) => pathname === sub.url
                          ) ??
                            false)
                        }
                        className="h-11 w-11 rounded-lg cursor-pointer justify-center"
                        onClick={() => {
                          if (item.url) router.push(item.url);
                          else if (item.subMenus?.[0]?.url)
                            router.push(item.subMenus[0].url);
                        }}
                      >
                        {item.icon}
                      </SidebarMenuButton>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="right"
                    align="start"
                    sideOffset={8}
                    className="w-48 p-1 rounded-lg border-[var(--border-1)] bg-[var(--bg-main)] shadow-md"
                  >
                    <ul className="flex flex-col gap-0.5 py-1">
                      {item.subMenus.map((subItem: any) => (
                        <li key={subItem.title}>
                          <Link
                            href={subItem.url}
                            className={cn(
                              "flex h-8 items-center rounded-md px-2 text-sm transition-colors",
                              pathname === subItem.url
                                ? "bg-[var(--violet-1)] text-[var(--violet-2)] font-medium"
                                : "text-[var(--gray-400)] hover:bg-[var(--violet-1)] hover:text-[var(--fg-main)]"
                            )}
                          >
                            {subItem.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </HoverCardContent>
                </HoverCard>
              ) : (
                <div className="relative">
                  <SidebarMenuButton
                    isActive={
                      pathname === item.url ||
                      (item.subMenus?.some(
                        (sub: any) => pathname === sub.url
                      ) ??
                        false)
                    }
                    className="h-11 px-2 py-3 cursor-pointer relative"
                    onClick={() => {
                      if (item.url) {
                        router.push(item.url);
                      } else if (
                        item.subMenus &&
                        item.subMenus.length > 0 &&
                        item.subMenus[0]?.url
                      ) {
                        router.push(item.subMenus[0].url);
                      }
                      handleMenuClick(item.title);
                    }}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  <CollapsibleTrigger asChild>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 -mr-1 text-[var(--gray-400)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuClick(item.title);
                      }}
                    >
                      <ChevronDown className="w-4 h-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                </div>
              )}
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.subMenus?.map((subItem: any) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        asChild
                        isActive={pathname === subItem.url}
                      >
                        <Link href={subItem.url}>
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ) : (
          <SidebarMenuItem key={item.title} className="w-full">
            <MyTooltip
              content={state === "collapsed" ? item.title : null}
              side="right"
              align="center"
            >
              <SidebarMenuButton
                isActive={pathname === item.url}
                className="h-11 px-2 py-3 cursor-pointer"
                asChild={!item.onClick && !item.openInNewWindow && !!item.url}
                onClick={item.onClick ?? (item.openInNewWindow ? (e: React.MouseEvent) => {
                  e.preventDefault();
                  const { currentRegistration } = useReceptionStore.getState();
                  const params = new URLSearchParams();
                  if (currentRegistration?.patientId) {
                    params.set('patientId', String(currentRegistration.patientId));
                  }
                  const query = params.toString();
                  const url = item.url + (query ? `?${query}` : '');
                  window.open(url, '_blank');
                } : undefined)}
              >
                {item.onClick || item.openInNewWindow ? (
                  <>
                    {item.icon}
                    {state !== "collapsed" && <span>{item.title}</span>}
                  </>
                ) : item.url ? (
                  <Link href={item.url}>
                    {item.icon}
                    {state !== "collapsed" && <span>{item.title}</span>}
                  </Link>
                ) : (
                  <>
                    {item.icon}
                    {state !== "collapsed" && <span>{item.title}</span>}
                  </>
                )}
              </SidebarMenuButton>
            </MyTooltip>
          </SidebarMenuItem>
        )
      )}
      {children}
    </SidebarMenu>
  );
}
// AppSidebar 컴포넌트: 전체 사이드바 UI와 메뉴, 설정, 토글 기능을 담당합니다.
export function AppSidebar() {
  // 사이드바 접기/펼치기 토글 핸들러
  const storedUser = safeJsonParse(safeLocalStorage.getItem("user"), {} as any);
  const currentHospitalId =
    storedUser?.hospitalId ??
    (storedUser?.hospitals && storedUser.hospitals[0]?.hospitalId);

  const isOwnerOfCurrentHospital = useMemo(() => {
    const hospitals = storedUser?.hospitals ?? [];
    if (!hospitals || hospitals.length === 0) return false;
    const current =
      hospitals.find((h: any) => h.hospitalId === currentHospitalId) ??
      hospitals[0];
    return Boolean(current?.isOwner);
  }, [storedUser, currentHospitalId]);

  const visibilityContext: VisibilityContext = useMemo(
    () => ({
      isOwnerOfCurrentHospital,
    }),
    [isOwnerOfCurrentHospital]
  );

  const menus = useSidebarMenus(visibilityContext);

  // auth, forbidden, tablet, did 페이지에서는 사이드바를 렌더링하지 않음
  const pathname = usePathname();
  const hideSidebar =
    pathname.includes("/auth") ||
    pathname.includes("/forbidden") ||
    pathname.includes("/tablet") ||
    pathname.includes("/did") ||
    pathname.includes("/patient-chat") ||
    pathname.includes("/popout");
  if (hideSidebar) return null;
  //

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarContent className="bg-[var(--bg-side-bar)]">
          <SidebarHeader className="flex flex-row items-center justify-between gap-[4px] px-[4px] py-[8px] group-data-[collapsible=icon]:justify-center">
            <LogoSection />
            <SidebarTrigger />
          </SidebarHeader>
          <SidebarGroup className="p-0 my-scroll">
            <SidebarGroupContent>
              <SidebarMenuSection items={menus} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SettingsModal />
    </>
  );
}
