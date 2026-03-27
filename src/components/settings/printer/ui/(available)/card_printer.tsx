"use client";

import type { PrinterRecord } from "@/types/printer-types";
import { useHospitalStore } from "@/store/hospital-store";
import { useAgentPresence, useSocket } from "@/contexts/SocketContext";
import { useEffect, useMemo, useState } from "react";
import { PrintersService } from "@/services/printers-service";
import { useToastHelpers } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { usePrintersStore } from "@/store/printers-store";

const STATUS_LABELS = {
  available: "온라인",
  offline: "오프라인",
  unknown: "상태 미확인",
};

export default function CardPrinter({ printer }: { printer: PrinterRecord }) {
  const hospital = useHospitalStore((state) => state.hospital);
  const { currentAgentId, isOnline } = useAgentPresence();
  const { socket, connectedAgentIds } = useSocket();
  const { success, error } = useToastHelpers();
  const updatePrinter = usePrintersStore((state) => state.updatePrinter);
  const [editingAlias, setEditingAlias] = useState(false);
  const [aliasValue, setAliasValue] = useState(printer.displayName ?? "");
  const [localDisplayName, setLocalDisplayName] = useState<string | null | undefined>(
    printer.displayName
  );
  const [isTesting, setIsTesting] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);

  useEffect(() => {
    setLocalDisplayName(printer.displayName);
    if (!editingAlias) {
      setAliasValue(printer.displayName ?? "");
    }
  }, [printer.displayName, editingAlias]);

  const handleTestPrint = async () => {
    if (!hospital?.number) {
      console.warn("병원 번호가 없습니다.");
      return;
    }
    if (!printer.id) {
      console.warn("프린터 ID가 없습니다.");
      return;
    }
    try {
      setIsTesting(true);
      const { id: jobId } = await PrintersService.createTestJob(printer.id, {
        message: "EMR Test Print",
        copies: 1,
        options: {},
        targetAgentId: currentAgentId || undefined,
      });
      setPendingJobId(jobId);
    } catch (err) {
      console.error("테스트 출력 생성 실패", err);
      setIsTesting(false);
      setPendingJobId(null);
      error("테스트 출력 실패", <p>테스트 작업을 시작하지 못했습니다.</p>);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const onJobUpdated = (payload: any) => {
      const events = Array.isArray(payload) ? payload : payload ? [payload] : [];
      if (events.length === 0) return;

      for (const evt of events) {
        // 내가 보낸 테스트 인쇄 작업인지 확인
        if (!pendingJobId || evt?.jobId !== pendingJobId) continue;

        const status = evt?.status;
        setIsTesting(false);
        setPendingJobId(null);

        // 토스트 알림은 GlobalSocketListener에서 처리하므로 여기서는 상태만 변경하고 종료
        console.log("[CardPrinter] Test print finished:", status);
      }
    };

    socket.on("printer.job.updated", onJobUpdated);
    return () => {
      socket.off("printer.job.updated", onJobUpdated);
    };
  }, [socket, pendingJobId]);

  const handleAliasSubmit = async () => {
    if (!printer.id) return;
    try {
      await PrintersService.updatePrinterDisplayName(printer.id, aliasValue);
      setLocalDisplayName(aliasValue);
      updatePrinter(printer.id, { displayName: aliasValue });
      setEditingAlias(false);
      success("별칭이 저장됐어요", <p>입력하신 별칭을 저장했습니다.</p>);
    } catch (err) {
      console.error("별칭 저장 실패", err);
      error("별칭 저장 실패", <p>별칭을 저장할 수 없었습니다.</p>);
    }
  };

  const handleAliasCancel = () => {
    setAliasValue(localDisplayName ?? "");
    setEditingAlias(false);
  };

  const handleRemovePrinter = async () => {
    if (!printer.id) return;
    try {
      await PrintersService.deletePrinterById(printer.id);
      window.dispatchEvent(new CustomEvent("printers:list:refresh"));
    } catch (err) {
      console.error("프린터 삭제 실패", err);
      error("삭제 실패", <p>프린터를 삭제하지 못했습니다.</p>);
    }
  };

  const isPrinterOnline = useMemo(() => {
    if (!isOnline) return false;
    if (!printer.agents || printer.agents.length === 0) {
      return !!printer.available;
    }
    return printer.agents.some(agentId => connectedAgentIds.has(agentId));
  }, [isOnline, printer.agents, printer.available, connectedAgentIds]);

  const availabilityLabel = useMemo(() => {
    if (isPrinterOnline) return STATUS_LABELS.available;
    return STATUS_LABELS.offline;
  }, [isPrinterOnline]);

  return (
    <div className="animate-blue-glow self-stretch bg-card rounded-md outline outline-1 outline-offset-[-1px] outline-border inline-flex flex-col justify-start items-start overflow-hidden transition-all duration-200 hover:shadow-md hover:outline-border hover:bg-accent">
      <div className="self-stretch px-3 py-1.5 bg-muted inline-flex justify-start items-center gap-2">
        <div className="flex-1 h-6 flex justify-between items-center">
          <div className="size- flex justify-start items-center gap-2">
            <div data-svg-wrapper className="relative">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_5244_22314)">
                  <path d="M10.7776 10.7783H11.8886C12.1833 10.7783 12.4659 10.6612 12.6743 10.4529C12.8827 10.2445 12.9997 9.9619 12.9997 9.66723V7.44507C12.9997 7.15039 12.8827 6.86778 12.6743 6.65941C12.4659 6.45104 12.1833 6.33398 11.8886 6.33398H4.11108C3.8164 6.33398 3.5338 6.45104 3.32543 6.65941C3.11706 6.86778 3 7.15039 3 7.44507V9.66723C3 9.9619 3.11706 10.2445 3.32543 10.4529C3.5338 10.6612 3.8164 10.7783 4.11108 10.7783H5.22216" stroke="var(--Gray-300_46474C, #46474C)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10.7781 6.33324V4.11108C10.7781 3.8164 10.661 3.5338 10.4526 3.32543C10.2443 3.11706 9.96166 3 9.66698 3H6.33374C6.03906 3 5.75645 3.11706 5.54808 3.32543C5.33972 3.5338 5.22266 3.8164 5.22266 4.11108V6.33324" stroke="var(--Gray-300_46474C, #46474C)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M5.22266 9.66772C5.22266 9.37304 5.33972 9.09044 5.54808 8.88207C5.75645 8.6737 6.03906 8.55664 6.33374 8.55664H9.66698C9.96166 8.55664 10.2443 8.6737 10.4526 8.88207C10.661 9.09044 10.7781 9.37304 10.7781 9.66772V11.8899C10.7781 12.1846 10.661 12.4672 10.4526 12.6755C10.2443 12.8839 9.96166 13.001 9.66698 13.001H6.33374C6.03906 13.001 5.75645 12.8839 5.54808 12.6755C5.33972 12.4672 5.22266 12.1846 5.22266 11.8899V9.66772Z" stroke="var(--Gray-300_46474C, #46474C)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
                <defs>
                  <clipPath id="clip0_5244_22314">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div className="justify-start text-foreground text-[13px] font-normal font-['Pretendard'] leading-none flex-1 truncate" title={printer.name}>
              {printer.name}
            </div>
            {isPrinterOnline ? (
              <div className="size- px-1.5 py-[2.50px] bg-[var(--Supporting--Lime-1,#e9fad4)] rounded-[36px] inline-flex justify-center items-center gap-0.5">
                <div className="justify-center text-[var(--Status-Positive,#00bf40)] text-xs font-medium font-['Pretendard'] leading-[15px]">
                  {availabilityLabel}
                </div>
              </div>
            ) : (
              <div className="size- inline-flex justify-start items-center gap-1">
                <div className="size- flex justify-start items-center gap-0.5">
                  <div className="size- px-1.5 py-[2.50px] bg-muted rounded-[36px] flex justify-center items-center gap-0.5">
                    <div className="justify-center text-muted-foreground text-xs font-medium font-['Pretendard'] leading-[15px]">
                      {availabilityLabel}
                    </div>
                  </div>
                </div>
                {!isPrinterOnline && (
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={handleRemovePrinter}
                    className="size- p-1 flex justify-center items-center gap-0.5"
                    title="프린터 삭제"
                  >
                    <div data-svg-wrapper className="relative">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_del)">
                          <path d="M6 3.5H10M3.5 5H12.5M5 5V12.5M8 5V12.5M11 5V12.5" stroke="var(--Gray-300_46474C, #46474C)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                        <defs>
                          <clipPath id="clip0_del">
                            <rect width="16" height="16" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                  </Button>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={handleTestPrint}
            disabled={isTesting || !isPrinterOnline}
            className="ml-[10px] flex px-1.5 py-1 justify-center items-center gap-0.5 rounded-[4px] border border-[#DBDCDF] bg-white overflow-hidden text-[#171719] text-center text-xs font-normal font-['Pretendard'] leading-[15px] tracking-[-0.12px] truncate"
          >
            {isTesting && (
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20Z" stroke="#989BA2" strokeWidth="2" opacity="0.25" />
                <path d="M22 12a10 10 0 00-10-10" stroke="#46474C" strokeWidth="2" />
              </svg>
            )}
            <div >
              {isTesting ? "출력 중..." : "테스트 출력"}
            </div>
          </Button>
        </div>
      </div>
      <div className="self-stretch p-3 flex flex-col justify-start items-start gap-2 overflow-hidden">
        <div className="self-stretch inline-flex justify-start items-start gap-2">
          <div className="size- flex justify-start items-start gap-1">
            <div className="w-[90px] justify-start text-foreground text-[13px] font-normal font-['Pretendard'] leading-none">
              별칭
            </div>
          </div>
          {!localDisplayName && !editingAlias ? (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setAliasValue("");
                setEditingAlias(true);
              }}
              className="size- inline-flex justify-center items-center gap-0.5"
            >
              <div className="size- flex justify-center items-center gap-0.5">
                <div data-svg-wrapper className="relative">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 3.5V12.5M3.5 8H12.5" stroke="var(--Status-info, #0066FF)" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="max-h-4 min-h-4 text-center justify-start text-Status-info text-[13px] font-normal font-['Pretendard'] leading-none">
                  별칭 추가
                </div>
              </div>
            </Button>
          ) : editingAlias ? (
            <div className="h-7 inline-flex justify-start items-center gap-1">
              <div className="w-[140px] h-6 inline-flex flex-col justify-start items-start gap-2">
                <div className="self-stretch flex-1 px-2 bg-background rounded-md outline outline-1 outline-offset-[-0.50px] outline-border flex flex-col justify-center items-center">
                  <div className="self-stretch flex-1 inline-flex justify-start items-center gap-2">
                    <input
                      value={aliasValue}
                      onChange={(event) => setAliasValue(event.target.value)}
                      placeholder="별칭 입력"
                      className="w-full text-muted-foreground text-[13px] font-normal font-['Pretendard'] leading-none outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={handleAliasSubmit}
                className="size- p-1 flex justify-center items-center gap-0.5"
              >
                <div data-svg-wrapper className="relative">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_alias_save)">
                      <path d="M3.5 8L6.5 11L12.5 5" stroke="var(--Gray-300_46474C, #46474C)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                      <clipPath id="clip0_alias_save">
                        <rect width="16" height="16" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={handleAliasCancel}
                className="size- p-1 flex justify-center items-center gap-0.5"
              >
                <div data-svg-wrapper className="relative">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_alias_cancel)">
                      <path d="M11 5L5 11" stroke="var(--Gray-300_46474C, #46474C)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 5L11 11" stroke="var(--Gray-300_46474C, #46474C)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                      <clipPath id="clip0_alias_cancel">
                        <rect width="16" height="16" fill="white" />
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAliasValue(localDisplayName || "");
                setEditingAlias(true);
              }}
              className="px-1 py-0 h-auto justify-center text-foreground text-[13px] font-normal font-['Pretendard'] leading-none"
            >
              {localDisplayName}
            </Button>
          )}
        </div>
        <div className="self-stretch inline-flex justify-start items-start gap-2">
          <div className="size- flex justify-start items-start gap-1">
            <div className="w-[90px] justify-start text-muted-foreground text-[13px] font-normal font-['Pretendard'] leading-none">
              네트워크 경로
            </div>
          </div>
          <div className="justify-center text-muted-foreground text-[13px] font-normal font-['Pretendard'] leading-[15px]">
            {printer.path || "-"}
          </div>
        </div>
        <div className="self-stretch inline-flex justify-start items-start gap-2">
          <div className="size- flex justify-start items-start gap-1">
            <div className="w-[90px] justify-start text-foreground text-[13px] font-normal font-['Pretendard'] leading-none">
              포트
            </div>
          </div>
          <div className="justify-center text-muted-foreground text-[13px] font-normal font-['Pretendard'] leading-none">
            {printer.portName || "-"}
          </div>
        </div>
        <div className="self-stretch inline-flex justify-start items-start gap-2">
          <div className="size- flex justify-start items-start gap-1">
            <div className="w-[90px] justify-start text-foreground text-[13px] font-normal font-['Pretendard'] leading-none">
              드라이버
            </div>
          </div>
          <div className="justify-center text-muted-foreground text-[13px] font-normal font-['Pretendard'] leading-none">
            {printer.driverName || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
