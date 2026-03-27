"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";
import { SendHistoryList } from "./_components/send-history-list";
import { SendReservedList } from "./_components/send-reserved-list";
import { SendHistoryDetail } from "./_components/send-history-detail";
import { SendReservedDetail } from "./_components/send-reserved-detail";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const MessageHistoryPage = () => {
  const [selectedSendHistoryId, setSelectedSendHistoryId] = useState<
    number | null
  >(null);
  const [selectedReservedHistoryId, setSelectedReservedHistoryId] = useState<
    number | null
  >(null);
  const [activeTab, setActiveTab] = useState<string>("send");

  const handleRowClick = (sendHistoryId: number) => {
    setSelectedSendHistoryId(sendHistoryId);
  };

  const handleReservedRowClick = (sendHistoryId: number) => {
    setSelectedReservedHistoryId(sendHistoryId);
  };

  const handleBack = () => {
    setSelectedSendHistoryId(null);
    setSelectedReservedHistoryId(null);
  };

  return (
    <div className="w-full h-full bg-[var(--bg-2)] flex flex-col" data-testid="crm-history-page">
      {/* 헤더 */}
      <div className="p-4 pb-3 bg-white">
        {selectedSendHistoryId || selectedReservedHistoryId ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-md font-bold text-[var(--gray-100)] hover:text-[var(--gray-100)] cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>{selectedReservedHistoryId ? "예약 내역" : "발송 내역"}</span>
          </button>
        ) : (
          <Label className="text-md font-bold text-[var(--gray-100)]">
            발송 내역
          </Label>
        )}
      </div>

      {selectedSendHistoryId ? (
        <div className="flex-1 px-2 py-3 bg-white">
          <SendHistoryDetail sendHistoryId={selectedSendHistoryId} />
        </div>
      ) : selectedReservedHistoryId ? (
        <div className="flex-1 px-2 py-3 bg-white">
          <SendReservedDetail sendHistoryId={selectedReservedHistoryId} />
        </div>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col gap-0"
          data-testid="crm-history-tabs"
        >
          <TabsList className="w-full h-auto bg-white">
            <TabsTrigger
              value="send"
              data-testid="crm-history-send-tab"
              className={cn(
                // 기본 스타일
                "flex-1 h-12 rounded-none bg-transparent ml-5",
                // 기본 border 제거 후 하단 border만 적용
                "border-0 border-b",
                // 비활성 상태: 옅은 회색 border
                "border-[var(--border-1)]",
                "text-[var(--gray-60)]",
                // 활성 상태: primary 색상 border
                "data-[state=active]:text-[var(--gray-100)]",
                "data-[state=active]:font-bold",
                "data-[state=active]:border-b data-[state=active]:border-[var(--primary)]",
                "data-[state=active]:shadow-none"
              )}
            >
              발송내역
            </TabsTrigger>
            <TabsTrigger
              value="reserved"
              data-testid="crm-history-reserved-tab"
              className={cn(
                // 기본 스타일
                "flex-1 h-12 rounded-none bg-transparent mr-5",
                // 기본 border 제거 후 하단 border만 적용
                "border-0 border-b",
                // 비활성 상태: 옅은 회색 border
                "border-[var(--border-1)]",
                "text-[var(--gray-60)]",
                // 활성 상태: primary 색상 border
                "data-[state=active]:text-[var(--gray-100)]",
                "data-[state=active]:font-bold",
                "data-[state=active]:border-b data-[state=active]:border-[var(--primary)]",
                "data-[state=active]:shadow-none"
              )}
            >
              예약내역
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="send"
            className="flex-1 px-2 py-3 bg-white"
            data-testid="crm-history-send-panel"
          >
            <SendHistoryList onRowClick={handleRowClick} />
          </TabsContent>
          <TabsContent
            value="reserved"
            className="flex-1 px-2 py-3 bg-white"
            data-testid="crm-history-reserved-panel"
          >
            <SendReservedList onRowClick={handleReservedRowClick} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default MessageHistoryPage;
