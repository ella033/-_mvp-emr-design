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
import {
  CircleCheck,
  TriangleAlert,
  CircleDot,
} from "lucide-react";
import { useSendHistoryList } from "@/hooks/crm/use-send-history-list";
import {
  useReRegistrationMessage,
  useResendMessage,
} from "@/hooks/crm/use-send-message";

import { CrmMessageRegStatus, CrmSendType } from "@/constants/crm-enums";
import { useToastHelpers } from "@/components/ui/toast";

interface SendHistoryListProps {
  onRowClick?: (sendHistoryId: number) => void;
}

export const SendHistoryList = ({ onRowClick }: SendHistoryListProps) => {
  // 날짜 상태 관리
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>("1개월");
  const [selectedFilter, setSelectedFilter] = useState<string>("전체");

  // 컴포넌트 로드 시 최근 1개월로 초기화
  useEffect(() => {
    const today = new Date();
    const endDateStr = today.toISOString().split("T")[0]!;
    const startDateObj = new Date(today);
    startDateObj.setMonth(today.getMonth() - 1);
    const startDateStr = startDateObj.toISOString().split("T")[0]!;

    setStartDate(startDateStr);
    setEndDate(endDateStr);
  }, []);

  // 필터 상태에 따른 status 파라미터 설정
  const getStatusParam = (): CrmMessageRegStatus | undefined => {
    if (selectedFilter === "성공") return CrmMessageRegStatus.발송성공;
    if (selectedFilter === "실패") return CrmMessageRegStatus.발송실패;
    return undefined;
  };

  // 데이터 로딩
  const {
    data: historyList,
    isLoading,
    refetch,
  } = useSendHistoryList({
    from: startDate,
    to: endDate,
    status: getStatusParam(),
  });

  // Toast 헬퍼
  const { success: showSuccess, error: showError } = useToastHelpers();

  // 재등록 메시지 mutation
  const reRegistrationMutation = useReRegistrationMessage({
    onSuccess: () => {
      showSuccess("메시지를 다시 발송하였습니다");
      refetch();
    },
    onError: () => {
      showError("메시지 재발송이 실패하였습니다.");
      refetch();
    },
  });

  // 재발송 메시지 mutation
  const resendMutation = useResendMessage({
    onSuccess: () => {
      showSuccess("메시지를 다시 발송하였습니다");
      refetch();
    },
    onError: () => {
      showError("메시지 재발송이 실패하였습니다.");
      refetch();
    },
  });

  const handlePeriodClick = (period: string) => {
    setSelectedPeriod(period);

    const today = new Date();
    const endDateStr = today.toISOString().split("T")[0]!;
    const startDateObj = new Date(today);

    switch (period) {
      case "1개월":
        startDateObj.setMonth(today.getMonth() - 1);
        break;
      case "3개월":
        startDateObj.setMonth(today.getMonth() - 3);
        break;
      case "6개월":
        startDateObj.setMonth(today.getMonth() - 6);
        break;
    }

    const startDateStr = startDateObj.toISOString().split("T")[0]!;
    setStartDate(startDateStr);
    setEndDate(endDateStr);
  };

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter);
  };

  // 실패 건 재발송 핸들러
  const handleResendFailed = (
    e: React.MouseEvent,
    sendHistoryId: number,
    status: CrmMessageRegStatus
  ) => {
    e.stopPropagation(); // onRowClick 무시

    if (status === CrmMessageRegStatus.등록실패) {
      // 등록실패인 경우 재등록
      reRegistrationMutation.mutate(sendHistoryId);
    } else if (status === CrmMessageRegStatus.발송실패) {
      // 발송실패인 경우 재발송
      resendMutation.mutate({
        sendHistoryId,
        request: {},
      });
    }
  };
  const scrollRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: historyList?.length ?? 0,
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

  const getStatusBadge = (status: string, failedCount?: number) => {
    const statusConfig = {
      성공: {
        text: "성공",
        icon: CircleCheck,
        className:
          "bg-[var(--positive-tertiary)] text-[var(--positive-secondary)] border-none",
      },
      실패: {
        text: "실패",
        icon: TriangleAlert,
        className: "bg-[var(--red-1)] text-[var(--red-2)] border-none",
      },
      대기: {
        text: "대기",
        icon: CircleDot,
        className: "bg-[var(--gray-4)] text-[var(--gray-600)] border-none",
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
        {status === "실패" && failedCount !== undefined && failedCount > 0 && (
          <span>{failedCount}</span>
        )}
      </Badge>
    );
  };

  return (
    <div className="bg-white flex flex-col h-full" data-testid="crm-history-send-list">
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
          {["전체", "성공", "실패"].map((filter) => (
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
        ) : !historyList || historyList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[var(--gray-300)]">
            발송 내역이 없습니다.
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
                    <span>재발송</span>
                    <MyTooltip
                      side="bottom"
                      align="start"
                      content={
                        <div className="text-sm max-w-[300px] px-2 py-1 whitespace-pre-wrap">
                          발송에 실패한 메시지를 90일 내에 재발송할 수 있습니다.
                        </div>
                      }
                    >
                      <Image src="/icon/ic_line_help.svg" alt="" width={16} height={16} className="ml-1" />
                    </MyTooltip>
                  </div>
                </div>
                <div className={cn(headerCellStyle, "w-[7%] whitespace-nowrap min-w-[116px]")}>
                  <div className="flex items-center">
                    <span>사용포인트</span>
                    <MyTooltip
                      side="bottom"
                      align="start"
                      content={
                        <div className="text-sm max-w-[400px] px-2 py-1">
                          <ul className="list-disc list-inside mb-2 space-y-1">
                            <li>전송 성공한 건수만 포인트로 정산됩니다.</li>
                            <li>
                              메시지 유형에 따라 포인트가 다릅니다. (각 1건당,
                              사용 포인트)
                            </li>
                          </ul>
                          <table className="w-full border-collapse text-center">
                            <thead>
                              <tr>
                                <th className="border border-gray-300 px-2 py-1"></th>
                                <th className="border border-gray-300 px-2 py-1">
                                  SMS
                                </th>
                                <th className="border border-gray-300 px-2 py-1">
                                  LMS
                                </th>
                                <th className="border border-gray-300 px-2 py-1">
                                  MMS
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-gray-300 px-2 py-1">
                                  포인트
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  1P
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  2P
                                </td>
                                <td className="border border-gray-300 px-2 py-1">
                                  3P
                                </td>
                              </tr>
                            </tbody>
                          </table>
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
                  const item = historyList[virtualRow.index]!;
                  const messageTypeLabel =
                    item.messageType === 1 ? "문자" : "알림톡";
                  const statusText =
                    item.status === CrmMessageRegStatus.발송성공
                      ? "성공"
                      : item.status === CrmMessageRegStatus.등록실패 ||
                        item.status === CrmMessageRegStatus.발송실패
                        ? "실패"
                        : "대기";

                  return (
                    <div
                      key={item.id}
                      data-testid="crm-history-send-row"
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
                        {getStatusBadge(statusText, item.failedCount)}
                      </div>
                      <div className={cn(columnCellStyle, "w-[7%]")}>
                        {statusText === "실패" && (
                          <Button
                            size="sm"
                            className="text-xs px-3 bg-[var(--main-color)]"
                            onClick={(e) =>
                              handleResendFailed(e, item.id, item.status)
                            }
                          >
                            실패 건 재발송
                          </Button>
                        )}
                      </div>
                      <div className={cn(columnCellStyle, "w-[7%] min-w-[116px]")}>
                        {item.usedPoints}P
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
