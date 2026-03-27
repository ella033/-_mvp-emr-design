"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import CardPrinter from "./card_printer";
import { useHospitalStore } from "@/store/hospital-store";
import { useAgentPresence, useSocket } from "@/contexts/SocketContext";
import { AgentBinding } from "@/lib/agent/agent-binding";
import { usePrinterList } from "../../hooks/use-printer-list";
import { SectionLayout } from "@/components/settings/commons/section-layout";

export default function AvailablePrintersPanel() {
  const hospital = useHospitalStore((state) => state.hospital);
  const { isOnline, isOffline } = useAgentPresence();
  const { socket } = useSocket();
  const hasRequestedAgentRef = useRef(false);

  const { printers, isRefreshing, refreshPrinters } = usePrinterList();

  // Agent wake-up logic (kept here for now as it depends on HospitalStore/Agent presence context)
  useEffect(() => {
    console.log("[AvailablePrintersPanel] agent presence", { isOnline, isOffline });
    if (isOffline && hospital && hospital.number && !hasRequestedAgentRef.current) {
      hasRequestedAgentRef.current = true;
      AgentBinding.ensureWake(hospital.id);
    }
  }, [isOnline, isOffline, hospital?.id, hospital?.number]);

  // 토스트 알림은 GlobalSocketListener에서 requestedBy 필터와 함께 처리
  // (card_printer.tsx 참고: "토스트 알림은 GlobalSocketListener에서 처리하므로 여기서는 상태만 변경")

  const handleRefresh = async () => {
    await refreshPrinters();
  };

  return (
    <div className="w-1/3 !min-w-[460px] h-full">
      <SectionLayout
        className="bg-background h-full"
        header={
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-foreground text-base font-bold font-['Pretendard'] leading-snug">
                사용 가능한 프린터
              </span>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              {isRefreshing ? "동기화 중..." : "새로고침"}
            </Button>
          </div>
        }
        body={
          <div className="flex flex-col gap-3">
            {printers.length > 0 ? (
              printers.map((printer) => <CardPrinter key={printer.id} printer={printer} />)
            ) : (
              <div className="text-xs text-muted-foreground">등록된 프린터가 없습니다.</div>
            )}
          </div>
        }
      />
    </div>
  );
}
