// 이 파일은 상단 고정형 메뉴바(TopMenubar) 컴포넌트를 정의하며, 페이지별 타이틀, 검색바, 새 환자 등록 버튼, 사용자 정보, 테마 전환, 메시지 메뉴 등을 제공합니다.

"use client";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Sun,
  Moon,
  LogOut,
  Settings,
  User,
  Bell,
  Shield,
  FileKey,
  LayoutGrid,
  Printer,
  Loader2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useSidebar } from "./ui/sidebar";
import { menuMap } from "@/constants/menu";
import { useUserStore } from "@/store/user-store";
import { useHospitalStore } from "@/store/hospital-store";
import { Skeleton } from "./ui/skeleton";
import SocketStatusIndicator from "@/components/socket-status-indicator";
import { useHandleLogout } from "@/lib/auth-utils";
import { useUIStore } from "@/store/ui-store";
import HospitalChatTrigger from "@/components/hospital-chat/hospital-chat-trigger";
import { useSocket } from "@/contexts/SocketContext";
import { PrintersService } from "@/services/printers-service";
import { useToastHelpers } from "@/components/ui/toast";

// 상단 메뉴바 컴포넌트
import { getFileUrl } from "@/lib/file-utils";

// 상단 메뉴바 컴포넌트
export default function TopMenubar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { user } = useUserStore();
  const { hospital } = useHospitalStore();
  const { openSettingsModal } = useUIStore();
  const handleLogout = useHandleLogout();
  const { socket } = useSocket();
  const { success: toastSuccess, error: toastError } = useToastHelpers();
  const [isHtmlPrintTesting, setIsHtmlPrintTesting] = useState(false);
  const [pendingHtmlJobId, setPendingHtmlJobId] = useState<string | null>(null);

  const handleHtmlPrintTest = useCallback(async () => {
    try {
      setIsHtmlPrintTesting(true);
      const contentUrl = `${window.location.origin}/api/test-html-print`;
      const { id: jobId } = await PrintersService.print({
        outputTypeCode: "DEFAULT_PRINTER",
        contentType: "text/html",
        fileName: "html-print-test.html",
        contentUrl,
        copies: 1,
      });
      setPendingHtmlJobId(jobId);
    } catch (err: any) {
      toastError("HTML 테스트 출력 실패", <p>{err?.message ?? "작업을 시작하지 못했습니다."}</p>);
      setIsHtmlPrintTesting(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (!socket || !pendingHtmlJobId) return;

    const handleJobUpdate = (data: any) => {
      if (data?.jobId !== pendingHtmlJobId) return;
      if (data.status === "SUCCESS") {
        toastSuccess("HTML 테스트 출력 완료", <p>A4 2페이지가 정상 출력되었습니다.</p>);
      } else if (data.status === "FAILED") {
        toastError("HTML 테스트 출력 실패", <p>{data.error ?? "출력 중 오류가 발생했습니다."}</p>);
      } else {
        return;
      }
      setIsHtmlPrintTesting(false);
      setPendingHtmlJobId(null);
    };

    socket.on("printer.job.updated", handleJobUpdate);

    const timeout = setTimeout(() => {
      setIsHtmlPrintTesting(false);
      setPendingHtmlJobId(null);
    }, 30000);

    return () => {
      socket.off("printer.job.updated", handleJobUpdate);
      clearTimeout(timeout);
    };
  }, [socket, pendingHtmlJobId, toastSuccess, toastError]);

  // 병원 로고 URL 생성
  const hospitalLogoUrl = useMemo(() => {
    return getFileUrl(hospital.logoFileinfo?.uuid);
  }, [hospital.logoFileinfo]);

  // 유저 프로필 이미지 URL 생성
  const userProfileUrl = useMemo(() => {
    const currentUser = user as any;
    const uuid =
      currentUser.profileFileInfo?.uuid || currentUser.profileFileinfo?.uuid;
    return getFileUrl(uuid);
  }, [user]);

  // 현재 경로에 따른 메뉴 타이틀 반환
  const menuTitle = menuMap[pathname.split("/")[1] || ""];

  // /auth, /forbidden, /tablet, /did 경로에서는 메뉴바를 숨김
  const hideMenubar =
    pathname.includes("/auth") ||
    pathname.includes("/forbidden") ||
    pathname.includes("/tablet") ||
    pathname.includes("/did") ||
    pathname.includes("/patient-chat") ||
    pathname.includes("/popout");
  if (hideMenubar) return null;

  return (
    <header
      data-testid="top-menubar"
      className={`
        flex items-center gap-4 px-4 py-2 z-50 border-b box-border transition-all duration-300 h-12 bg-background w-full
        ${state === "expanded" ? "left-[10rem]" : "left-[3rem]"}        
      `}
    >
      <div className="font-bold text-[14px] flex-shrink-0">
        {menuTitle || "페이지 없음"}
      </div>

      <div className="flex-1 flex justify-center items-center gap-2">
        {/* ReceptionSearchBar와 RegisterPatientButton은 patients-list-header로 이동됨 */}
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {/* 로그인 상태에 따라 사용자 정보 또는 안내 문구 표시 */}

        <div className="flex gap-2 items-center">
          {/* 그룹 채팅 */}
          <HospitalChatTrigger />
          {/* HTML 인쇄 테스트 (개발 환경만) */}
          {/* {process.env.NODE_ENV === "development" && (
            <button
              onClick={handleHtmlPrintTest}
              disabled={isHtmlPrintTesting}
              className="cursor-pointer p-1.5 rounded-md hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="HTML 인쇄 테스트"
              title="HTML 인쇄 테스트 (A4 2페이지)"
            >
              {isHtmlPrintTesting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Printer className="size-4" />
              )}
            </button>
          )} */}
          {/* 소켓 연결 상태 표시 */}
          <SocketStatusIndicator />
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent/50 p-1.5 rounded-md transition-colors outline-none"
                  data-testid="top-menubar-user-menu-trigger"
                >
                  {!user.name ? (
                    <Skeleton className="rounded-full size-6" />
                  ) : (
                    <Avatar className="size-6">
                      <AvatarImage
                        src={hospitalLogoUrl || "/ubcare_logo.png"}
                      />
                      <AvatarFallback>UB</AvatarFallback>
                    </Avatar>
                  )}
                  {user.type && (
                    <div className="text-sm cursor-default">
                      {user.type === 1
                        ? "doctor"
                        : user.type === 2
                          ? "nurse"
                          : ""}
                    </div>
                  )}
                  {!user.name ? (
                    <Skeleton className="w-10 h-6" />
                  ) : (
                    <div className="text-sm cursor-default">{user.name}</div>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={userProfileUrl || "/icon/user_default.svg"}
                    />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger
                    className="cursor-pointer"
                    data-testid="top-menubar-user-settings-trigger"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>사용자 설정</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => openSettingsModal("user", "account")}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>계정 정보</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => openSettingsModal("user", "general")}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>일반 설정</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => openSettingsModal("user", "alert")}
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        <span>알림 설정</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => openSettingsModal("user", "security")}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        <span>보안 관리</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => openSettingsModal("user", "certificate")}
                      >
                        <FileKey className="mr-2 h-4 w-4" />
                        <span>인증서 관리</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                {(pathname.startsWith("/medical") ||
                  pathname.startsWith("/reception/management")) && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => {
                        const { triggerLayoutReset } = useUIStore.getState();
                        triggerLayoutReset();
                      }}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span>레이아웃 초기화</span>
                    </DropdownMenuItem>
                  )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  data-testid="top-menubar-logout-button"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>로그아웃</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* 테마 전환 버튼 */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="cursor-pointer"
          aria-label="테마 전환"
          data-testid="top-menubar-theme-toggle"
        >
          {theme === "dark" ? (
            <Sun className="size-5" />
          ) : (
            <Moon className="size-5" />
          )}
        </button>
      </div>
    </header>
  );
}
