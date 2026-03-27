"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import InputDateRange from "@/components/ui/input-date-range";
import { useQueryClient } from "@tanstack/react-query";
import { useDestructionLogs } from "@/hooks/claims/use-destruction";
import { PrinterIcon } from "lucide-react";
import moment from "moment";
import { useState, useEffect } from "react";
import {
  FilterContainer,
  FilterItem,
  FilterLabel,
  FilterRow
} from "./commons/filter-components";
import { DestructionHistoryTable } from "./DestructionHistoryTable";

interface DestructionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DestructionHistoryModal({
  open,
  onOpenChange,
}: DestructionHistoryModalProps) {
    const queryClient = useQueryClient();
    const [startDate, setStartDate] = useState(moment().subtract(1, "year").format("YYYY-MM-DD"));
    const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD"));

    const { data: response, isLoading } = useDestructionLogs({
        startDate: startDate.replace(/-/g, ""),
        endDate: endDate.replace(/-/g, ""),
    });

    const logs = (response as any)?.data || [];

    // 모달이 닫힐 때 캐시 무효화
    useEffect(() => {
        if (!open) {
            queryClient.removeQueries({ queryKey: ["destruction-logs"] });
        }
    }, [open, queryClient]);

    const handleDateChange = (range: { from: string; to: string }) => {
        setStartDate(range.from);
        setEndDate(range.to);
    };

    const handlePrint = () => {
        alert("Print Preview functionality is not implemented yet.");
    };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[1000px] h-[800px] flex flex-col p-6">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-slate-100">
          <DialogTitle className="text-xl font-bold">개인정보 파기 내역</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 flex-1 overflow-hidden">
            <FilterContainer>
              <FilterRow className="justify-between">
                <FilterItem className="flex-1">
                  <FilterLabel>조회 기간</FilterLabel>
                  <InputDateRange 
                      fromValue={startDate} 
                      toValue={endDate} 
                      onChange={handleDateChange}
                      className="w-[300px]"
                  />
                </FilterItem>
                <Button             
                  className="h-8 bg-[#1e1b4b] hover:bg-[#1e1b4b]/90 text-white text-[12px] px-4 rounded"
                  onClick={handlePrint}>
                    <PrinterIcon className="w-3.5 h-3.5" />
                    내역 출력
                </Button>
              </FilterRow>
            </FilterContainer>

            {/* Content */}
            <div className="flex-1 overflow-auto relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                        <span className="text-sm text-slate-500">로딩 중...</span>
                    </div>
                )}
                 <DestructionHistoryTable 
                    data={logs} 
                />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
