"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, ExternalLink, HelpCircle, InfoIcon, Loader2 } from "lucide-react";

import { useAgentPresence, useSocket } from "@/contexts/SocketContext";
import { MySwitch } from "@/components/yjg/my-switch";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import { SectionLayout } from "@/components/settings/commons/section-layout";
import { SettingPageHeader } from "@/components/settings/commons/setting-page-header";
import { Button } from "@/components/ui/button";
import { useToastHelpers } from "@/components/ui/toast";
import { useExternalPlatformList } from "@/hooks/external-platform/use-external-platform";
import { useCreateExternalPlatform, useSetExternalPlatformActive } from "@/hooks/external-platform/use-update-external-platform";

// 상단 SocketStatusIndicator와 동일한 규칙: green=소켓+에이전트 연결, yellow=소켓만, red=미연결
function useConnectionStatus() {
  const { socket } = useSocket();
  const { isOnline: agentOnline } = useAgentPresence();
  const socketConnected = !!socket && socket.connected;

  if (socketConnected && agentOnline) {
    return { status: "success" as const, label: "연결 성공", className: "border border-[#14AE5C] bg-[#14AE5C] text-white hover:opacity-90" };
  }
  if (socketConnected && !agentOnline) {
    return { status: "partial" as const, label: "에이전트 미연결", className: "border border-yellow-500 bg-yellow-500 text-slate-900 hover:bg-yellow-600 hover:border-yellow-600" };
  }
  return { status: "failed" as const, label: "연결 실패", className: "border border-red-500 bg-red-500 text-white hover:bg-red-600 hover:border-red-600" };
}

const AGENT_DOWNLOAD_URL = "/api/agents/download/latest";
const AGENT_DOWNLOAD_FILENAME = "NextEmrAgent_Setup.exe";

const DDOC_PLATFORM_CODE = "ddocdoc";

export function IntegrationsPage() {
  const connectionStatus = useConnectionStatus();
  const [isDownloading, setIsDownloading] = useState(false);
  const [uirangKioskEnabled, setUirangKioskEnabled] = useState(false);
  const { success: toastSuccess, error: toastError } = useToastHelpers();

  const { data: ddocList, isLoading: isDdocLoading } = useExternalPlatformList({
    platformCode: DDOC_PLATFORM_CODE,
  });
  const ddocPlatform = ddocList?.[0] ?? null;

  const createDdoc = useCreateExternalPlatform({
    onSuccess: () => toastSuccess("똑닥 연동이 시작되었습니다."),
    onError: (err: Error) => toastError("똑닥 연동 시작 실패", err.message),
  });

  const setDdocActive = useSetExternalPlatformActive(DDOC_PLATFORM_CODE, {
    platformName: "똑닥",
    onSuccess: () => toastSuccess("똑닥 연동 설정이 저장되었습니다."),
    onError: (err: Error) => toastError("똑닥 연동 설정 저장 실패", err.message),
  });

  const ddocEnabled = ddocPlatform?.isActive ?? false;

  const handleDdocToggle = (checked: boolean) => {
    setDdocActive.mutate(checked);
  };

  const handleDdocStart = () => {
    createDdoc.mutate({ platformCode: DDOC_PLATFORM_CODE, platformName: "똑닥" });
  };

  const handleAgentDownload = () => {
    setIsDownloading(true);
    const link = document.createElement("a");
    link.href = AGENT_DOWNLOAD_URL;
    link.download = AGENT_DOWNLOAD_FILENAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloading(false), 1000);
  };

  const sections = [
    { title: "외부 플랫폼 연동" },
    { title: "장비 연동" },
    { title: "에이전트" },
  ] as const;

  return (
    <div className="flex flex-col gap-4 p-4 w-full h-full min-h-0">
      <SettingPageHeader
        title="연동 관리"
      />
      <div className="grid flex-1 grid-cols-3 gap-4 w-full min-h-0">
        {sections.map(({ title }) => (
          <SectionLayout
            key={title}
            className="min-h-0"
            header={
              <div
                className={`flex w-full items-center gap-2 ${title === "에이전트" ? "justify-between" : ""}`}
              >
                <div className="flex gap-2 items-center">
                  <h3 className="text-base font-semibold font-pretendard text-slate-800">
                    {title}
                  </h3>
                  <MyTooltip
                    content={
                      title === "외부 플랫폼 연동"
                        ? "외부 플랫폼과 EMR을 연동하여 병원 업무를 함께 사용할 수 있습니다. 플랫폼별 연동 사용 여부를 설정하고, 관리자 페이지로 이동할 수 있습니다."
                        : title === "장비 연동"
                          ? "의료장비와 EMR 간의 연동을 관리하기 위한 기능입니다. 현재는 준비 단계입니다."
                          : "EMR 사용을 위해 필요한 에이전트 설치 파일을 다운로드할 수 있습니다. 설치 후 에이전트 연결 상태를 확인할 수 있습니다."
                    }
                    side="bottom"
                    delayDuration={0}
                    className="max-w-md bg-[#e6e6e6] px-3 py-2 text-slate-800 border-none"
                  >
                    <span className="inline-flex cursor-help rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label="도움말">
                      <HelpCircle className="w-5 h-5 shrink-0" />
                    </span>
                  </MyTooltip>
                </div>
                {title === "에이전트" && (
                  <div className="flex items-center gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2 py-0 rounded-2xl"
                    >
                      새로고침
                    </Button>
                    <span
                      role="status"
                      aria-label={connectionStatus.label}
                      className={`inline-flex items-center rounded-2xl px-2 py-0 text-sm font-medium ${connectionStatus.className} pointer-events-none select-none`}
                    >
                      {connectionStatus.label}
                    </span>
                  </div>
                )}
              </div>
            }
            body={
              title === "외부 플랫폼 연동" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-4 justify-between items-center px-4 py-5 rounded-lg border border-slate-200">
                    <div className="flex gap-2 items-center">
                      <Image
                        src="/icon/ic_ddocdoc.svg"
                        alt="똑닥"
                        width={24}
                        height={24}
                        className="w-6 h-6 shrink-0"
                      />
                      <span className="text-sm font-bold font-pretendard text-slate-800">
                        똑닥
                      </span>
                      {ddocPlatform != null ? (
                        <div
                          role="presentation"
                          className="inline-flex"
                          onPointerDownCapture={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (isDdocLoading || setDdocActive.isPending) return;
                            handleDdocToggle(!ddocEnabled);
                          }}
                          onClickCapture={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <MySwitch
                            checked={ddocEnabled}
                            onCheckedChange={() => { }}
                            disabled={isDdocLoading || setDdocActive.isPending}
                          />
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ddocPlatform == null ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isDdocLoading || createDdoc.isPending}
                          onClick={handleDdocStart}
                          className="px-5 py-2 rounded-lg border-[#14AE5C] text-[#14AE5C] hover:bg-green-50 hover:border-[#14AE5C] hover:text-[#14AE5C]"
                        >
                          {createDdoc.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                              연동 중...
                            </>
                          ) : (
                            "연동 시작"
                          )}
                        </Button>
                      ) : null}
                      <Button variant="outline" size="sm" asChild className="px-5 py-2 rounded-lg border-[#14AE5C] text-[#14AE5C] hover:bg-green-50 hover:border-[#14AE5C] hover:text-[#14AE5C]">
                        <Link
                          href="https://testhospital.ddocdoc.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5"
                        >
                          똑닥 병원 어드민
                          <ExternalLink className="w-4 h-4 shrink-0" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-4 justify-between items-center px-4 py-5 rounded-lg border border-slate-200">
                    <div className="flex gap-2 items-center">
                      <span className="text-sm font-bold font-pretendard text-slate-800">
                        의사랑 키오스크
                      </span>
                      <MySwitch
                        checked={uirangKioskEnabled}
                        onCheckedChange={setUirangKioskEnabled}
                        disabled
                      />
                    </div>
                    <Button variant="outline" size="sm" disabled className="rounded-lg shrink-0 px-5 py-2 inline-flex items-center gap-1.5 bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed">
                      키오스크 설정
                      <ExternalLink className="w-4 h-4 shrink-0" />
                    </Button>
                  </div>
                </div>
              ) : title === "장비 연동" ? (
                <div className="flex flex-1 gap-2 justify-center items-center min-h-0">
                  <InfoIcon className="w-6 h-6 shrink-0 text-slate-500" />
                  <span className="font-pretendard text-[13px] font-medium not-italic leading-[150%] text-slate-600">
                    연동 가능한 장비가 없습니다.
                  </span>
                </div>
              ) : title === "에이전트" ? (
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isDownloading}
                    onClick={handleAgentDownload}
                    className="px-5 py-2 w-full text-[#14AE5C] rounded-xl border-[#14AE5C] hover:bg-green-50 hover:border-green-600 hover:text-green-600 disabled:opacity-70"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        다운로드 중...
                      </>
                    ) : (
                      <>
                        다운로드
                        <Download className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              ) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
