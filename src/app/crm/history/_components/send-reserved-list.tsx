"use client";

import React, { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import InputDateRange from "@/components/ui/input-date-range";
import { Badge } from "@/components/ui/badge";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import Image from "next/image";
import { Clock, CircleMinus } from "lucide-react";
import { useSendReservedHistoryList } from "@/hooks/crm/use-send-reserved-history-list";

import { CrmMessageRegStatus, CrmSendType } from "@/constants/crm-enums";
import { MyPopupYesNo, MyPopupMsg } from "@/components/yjg/my-pop-up";
import { useCancelMessage } from "@/hooks/crm/use-send-message";
import { useToastHelpers } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

interface SendReservedListProps {
  onRowClick?: (sendHistoryId: number) => void;
}

export const SendReservedList = ({ onRowClick }: SendReservedListProps) => {
  // 날짜 상태 관리
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>("1개월");
  const [selectedFilter, setSelectedFilter] = useState<string>("전체");

  // 예약 취소 팝업 상태 관리
  const [isCancelPopupOpen, setIsCancelPopupOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);
  const [cancelTargetSendDateTime, setCancelTargetSendDateTime] = useState<
    string | null
  >(null);

  // 알림 팝업 상태 관리
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTitle, setAlertTitle] = useState("");

  const { success, error: showError } = useToastHelpers();
  const queryClient = useQueryClient();

  // 알림 표시 함수
  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setIsAlertOpen(true);
  };

  // 예약 취소 mutation
  const cancelMessageMutation = useCancelMessage({
    onSuccess: () => {
      success("예약 발송이 취소되었습니다");
      setIsCancelPopupOpen(false);
      setCancelTargetId(null);
      // 리스트 리프레시
      queryClient.invalidateQueries({
        queryKey: ["crm-send-reserved-history"],
      });
    },
    onError: () => {
      showError("예약 발송 취소가 실패하였습니다");
      setIsCancelPopupOpen(false);
    },
  });

  // 컴포넌트 로드 시 최근 1개월로 초기화
  useEffect(() => {
    const today = new Date();
    const startDateStr = today.toISOString().split("T")[0]!;
    const endDateObj = new Date(today);
    endDateObj.setMonth(today.getMonth() + 1);
    const endDateStr = endDateObj.toISOString().split("T")[0]!;

    setStartDate(startDateStr);
    setEndDate(endDateStr);
  }, []);

  // 필터 상태에 따른 status 파라미터 설정 (예약내역은 예약발송/발송취소)
  const getStatusParam = (): CrmMessageRegStatus | undefined => {
    if (selectedFilter === "예약") return CrmMessageRegStatus.예약발송;
    if (selectedFilter === "취소") return CrmMessageRegStatus.발송취소;
    return undefined;
  };

  // 데이터 로딩
  const { data: reservedList, isLoading } = useSendReservedHistoryList({
    from: startDate,
    to: endDate,
    status: getStatusParam(),
  });

  const handlePeriodClick = (period: string) => {
    setSelectedPeriod(period);

    const today = new Date();
    const startDateStr = today.toISOString().split("T")[0]!;
    const endDateObj = new Date(today);

    switch (period) {
      case "1개월":
        endDateObj.setMonth(today.getMonth() + 1);
        break;
      case "3개월":
        endDateObj.setMonth(today.getMonth() + 3);
        break;
      case "6개월":
        endDateObj.setMonth(today.getMonth() + 6);
        break;
    }

    const endDateStr = endDateObj.toISOString().split("T")[0]!;
    setStartDate(startDateStr);
    setEndDate(endDateStr);
  };

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter);
  };
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: reservedList?.length ?? 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  const headerCellStyle =
    "text-sm font-medium text-[var(--gray-200)] flex items-center justify-center px-2";
  const columnCellStyle =
    "text-sm font-normal text-[var(--gray-300)] flex items-center justify-center px-2 truncate";

  const getSendTypeLabel = (sendType: CrmSendType): string => {
    const sendTypeMap = {
      [CrmSendType.자동발송]: "자동발송",
      [CrmSendType.수동발송]: "수동발송",
      [CrmSendType.진료실발송]: "진료실발송",
      [CrmSendType.접수실발송]: "접수실발송",
    };
    return sendTypeMap[sendType] || "-";
  };

  const formatSendDateTime = (dateTime: string): string => {
    try {
      const date = new Date(dateTime);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");

      const period = hours < 12 ? "오전" : "오후";
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

      return `${year}-${month}-${day} ${period} ${displayHours}:${minutes}`;
    } catch (error) {
      return dateTime;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      예약: {
        text: "예약",
        className: "bg-[var(--blue-1)] text-[var(--blue-2)] border-none",
        icon: Clock,
      },
      취소: {
        text: "취소",
        className: "bg-[var(--gray-4)] text-[var(--gray-600)] border-none",
        icon: CircleMinus,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    return (
      <Badge
        className={cn(
          "px-2 py-0.5 text-xs font-normal flex items-center gap-1",
          config.className
        )}
      >
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="bg-white flex flex-col h-full" data-testid="crm-history-reserved-list">
      {/* 필터 영역 */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Label className="text-sm font-bold text-[var(--gray-200)] whitespace-nowrap">
            조회 기간
          </Label>
          <InputDateRange
            fromValue={startDate}
            toValue={endDate}
            onChange={(value) => {
              setStartDate(value.from);
              setEndDate(value.to);
            }}
            className=""
          />
          {/* 기간 버튼 */}
          {["1개월", "3개월", "6개월"].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => handlePeriodClick(period)}
              className={cn(
                "h-9 px-3 text-sm",
                selectedPeriod === period
                  ? "bg-[var(--main-color)] text-white hover:bg-[var(--main-color-hover)]"
                  : "bg-white text-[var(--gray-300)] border-[var(--border-1)] hover:bg-[var(--bg-2)]"
              )}
            >
              {period}
            </Button>
          ))}
          <Label className="text-sm font-bold text-[var(--gray-200)] ml-3 whitespace-nowrap">
            진행 상태
          </Label>
          {/* 필터 버튼 */}
          {["전체", "예약", "취소"].map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterClick(filter)}
              className={cn(
                "h-9 px-3 text-sm",
                selectedFilter === filter
                  ? "bg-[var(--main-color)] text-white hover:bg-[var(--main-color-hover)]"
                  : "bg-white text-[var(--gray-300)] border-[var(--border-1)] hover:bg-[var(--bg-2)]"
              )}
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="flex-1 px-4 py-4 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[var(--gray-300)]">
            로딩 중...
          </div>
        ) : !reservedList || reservedList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[var(--gray-300)]">
            예약 내역이 없습니다.
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-auto">
            <div className="min-w-[1200px]">
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 bg-[var(--bg-2)] flex min-h-10 items-center rounded-t-lg">
                <div className={cn(headerCellStyle, "w-[5%] whitespace-nowrap min-w-[80px]")}>
                  발송 경로
                </div>
                <div className={cn(headerCellStyle, "w-[7%]")}>
                  발송 수단
                </div>
                <div className={cn(headerCellStyle, "w-[10%] whitespace-nowrap min-w-[155px]")}>
                  발송 일시
                </div>
                <div className={cn(headerCellStyle, "w-[7%]")}>
                  수신자
                </div>
                <div className={cn(headerCellStyle, "w-[30%]")}>
                  메시지 내용
                </div>
                <div className={cn(headerCellStyle, "w-[7%] whitespace-nowrap min-w-[95px]")}>
                  발송번호
                </div>
                <div className={cn(headerCellStyle, "w-[7%]")}>
                  발송인
                </div>
                <div className={cn(headerCellStyle, "w-[7%]")}>
                  상태
                </div>
                <div className={cn(headerCellStyle, "w-[7%]")}>
                  <div className="flex items-center">
                    <span>취소</span>
                    <MyTooltip
                      side="bottom"
                      align="start"
                      content={
                        <div className="text-sm max-w-[300px] px-2 py-1 whitespace-pre-wrap">
                          예약발송은 발송 예정 일시 5분 전까지 취소할 수 있습니다.
                        </div>
                      }
                    >
                      <Image src="/icon/ic_line_help.svg" alt="" width={16} height={16} className="ml-1" />
                    </MyTooltip>
                  </div>
                </div>
                <div className={cn(headerCellStyle, "w-[7%] whitespace-nowrap min-w-[130px]")}>
                  <div className="flex items-center">
                    <span>사용 예정 포인트</span>
                    <MyTooltip
                      side="bottom"
                      align="start"
                      content={
                        <div className="text-sm max-w-[420px] px-2 py-1 whitespace-pre-wrap">
                          예약된 메시지의 경우 실제 발송 바이트 수는 달라질 수
                          있으며, 이에 따라 사용포인트가 변경될 수 있습니다.
                        </div>
                      }
                    >
                      <Image src="/icon/ic_line_help.svg" alt="" width={16} height={16} className="ml-1" />
                    </MyTooltip>
                  </div>
                </div>
              </div>

              {/* Virtualized Body */}
              <div
                className="relative w-full"
                style={{ height: `${virtualizer.getTotalSize()}px` }}
              >
                {virtualizer.getVirtualItems().map((virtualRow) => {
                  const item = reservedList[virtualRow.index]!;
                  const messageTypeLabel =
                    item.messageType === 1 ? "문자" : "알림톡";
                  const statusText =
                    item.status === CrmMessageRegStatus.예약발송
                      ? "예약"
                      : item.status === CrmMessageRegStatus.발송취소
                        ? "취소"
                        : "";

                  return (
                    <div
                      key={item.id}
                      data-testid="crm-history-reserved-row"
                      className="absolute top-0 left-0 w-full flex items-center h-10 hover:bg-[var(--bg-1)] cursor-pointer"
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      onClick={() => onRowClick?.(item.id)}
                    >
                      <div className={cn(columnCellStyle, "w-[5%] min-w-[80px]")}>
                        {getSendTypeLabel(item.sendType)}
                      </div>
                      <div className={cn(columnCellStyle, "w-[7%]")}>
                        <label className="px-2 py-1.5 text-xs bg-[var(--bg-3)] text-[var(--gray-100)] rounded-md text-center">
                          {messageTypeLabel}
                        </label>
                      </div>
                      <div className={cn(columnCellStyle, "w-[10%] whitespace-nowrap min-w-[155px]")}>
                        {formatSendDateTime(item.sendDateTime)}
                      </div>
                      <div className={cn(columnCellStyle, "w-[7%]")}>
                        {item.recipientSummary}
                      </div>
                      <div className={cn(columnCellStyle, "w-[30%] overflow-hidden")}>
                        <div className="truncate w-full">
                          {item.messageContent}
                        </div>
                      </div>
                      <div className={cn(columnCellStyle, "w-[7%] whitespace-nowrap min-w-[95px]")}>
                        {item.senderNumber}
                      </div>
                      <div className={cn(columnCellStyle, "w-[7%]")}>
                        {item.createName || "-"}
                      </div>
                      <div className={cn(columnCellStyle, "w-[7%]")}>
                        {getStatusBadge(statusText)}
                      </div>
                      <div className={cn(columnCellStyle, "w-[7%]")}>
                        {item.canCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancelTargetId(item.id);
                              setCancelTargetSendDateTime(item.sendDateTime);
                              setIsCancelPopupOpen(true);
                            }}
                          >
                            예약 취소
                          </Button>
                        )}
                      </div>
                      <div className={cn(columnCellStyle, "w-[7%] whitespace-nowrap min-w-[130px]")}>
                        {item.expectedPoints}P
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 예약 취소 확인 팝업 */}
      <MyPopupYesNo
        isOpen={isCancelPopupOpen}
        onCloseAction={() => {
          setIsCancelPopupOpen(false);
          setCancelTargetId(null);
          setCancelTargetSendDateTime(null);
        }}
        onConfirmAction={() => {
          if (cancelTargetId !== null && cancelTargetSendDateTime !== null) {
            // 발송 예정 일시가 현재 시간으로부터 5분 이내인지 체크
            const sendDateTime = new Date(cancelTargetSendDateTime);
            const now = new Date();
            const diffInMinutes =
              (sendDateTime.getTime() - now.getTime()) / (1000 * 60);

            if (diffInMinutes < 5) {
              setIsCancelPopupOpen(false);
              setCancelTargetId(null);
              setCancelTargetSendDateTime(null);
              showAlert(
                "예약발송을 취소할 수 없습니다.",
                "발송 예정 일시 5분 전까지만 취소가 가능합니다."
              );
              return;
            }

            cancelMessageMutation.mutate(cancelTargetId);
          }
        }}
        title="예약발송을 취소하시겠습니까?"
        message="취소 시 고객에게 메시지가 발송되지 않습니다. 취소된 예약은 복구할 수 없습니다."
        confirmText="예약 취소"
        cancelText="취소"
      />

      {/* 알림 팝업 */}
      <MyPopupMsg
        isOpen={isAlertOpen}
        onCloseAction={() => setIsAlertOpen(false)}
        title={alertTitle}
        msgType="warning"
        message={alertMessage}
        confirmText="확인"
      />
    </div>
  );
};
