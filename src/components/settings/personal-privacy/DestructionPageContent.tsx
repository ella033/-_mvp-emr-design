"use client";

import { useState, useEffect } from "react";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { useToastHelpers } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useDestructionCandidates, 
  useDestroyClaimDetails, 
  useDestroyDestructionCandidatesByRange 
} from "@/hooks/claims/use-destruction";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DestructionFilter } from "./DestructionFilter";
import { DestructionTable } from "./DestructionTable";
import { DestructionHistoryModal } from "./DestructionHistoryModal";
import { DestructionAlert } from "./DestructionAlert";

export function DestructionPageContent() {
  const [startDate, setStartDate] = useState(moment().subtract(5, "years").format("YYYY-MM-DD"));
  const [endDate, setEndDate] = useState(moment().format("YYYY-MM-DD")); 
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [patientName, setPatientName] = useState("");

  const fiveYearsAgo = moment().subtract(5, "years").format("YYYY-MM-DD");

  const [documentType, setDocumentType] = useState("CLAIM");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showDestructAlert, setShowDestructAlert] = useState(false);
  const [showBulkDestructAlert, setShowBulkDestructAlert] = useState(false);

  const { success, error: errorToast } = useToastHelpers();
  const { error: errorAlert } = useToastHelpers();
  const queryClient = useQueryClient();

  // 페이지를 벗어날 때 캐시 무효화
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ["destruction-candidates"] });
    };
  }, [queryClient]);

  // Queries & Mutations
  const { data: response, isLoading } = useDestructionCandidates({
    type: documentType,
    startDate: startDate.replace(/-/g, ""),
    endDate: endDate.replace(/-/g, ""),
    patientName,
    page,
    limit,
  });

  const destructionData = (response as any)?.data || [];
  const pagination = (response as any)?.pagination || { totalCount: 0, totalPages: 0 };

  const destructMutation = useDestroyClaimDetails();
  const bulkDestructMutation = useDestroyDestructionCandidatesByRange();

  const handleDestructConfirm = async (reason: string, reasonDetail: string) => {
      if (selectedIds.length === 0) {
          errorAlert("파기할 명세서를 선택해주세요.");
          return;
      }
      
      const finalReason = reason === "기타" ? reasonDetail : reason;
      if (!finalReason.trim()) {
          errorAlert("파기 사유를 입력해주세요.");
          return;
      }

      try {
          await destructMutation.mutateAsync({
              type: documentType,
              claimDetailIds: selectedIds,
              reason: finalReason,
          });
          success("개인정보 파기가 완료되었습니다.");
          setShowDestructAlert(false);
          setSelectedIds([]);
      } catch (err) {
          errorToast("파기 중 오류가 발생했습니다.");
      }
  };

  const handleBulkDestructConfirm = async (reason: string, reasonDetail: string) => {
      const finalReason = reason === "기타" ? reasonDetail : reason;
      if (!finalReason.trim()) {
          errorAlert("파기 사유를 입력해주세요.");
          return;
      }

      try {
          await bulkDestructMutation.mutateAsync({
              type: documentType,
              startDate: startDate.replace(/-/g, ""),
              endDate: endDate.replace(/-/g, ""),
              reason: finalReason,
          });
          success("기간 내 모든 개인정보 파기가 완료되었습니다.");
          setShowBulkDestructAlert(false);
          setSelectedIds([]);
      } catch (err) {
          errorToast("기간 파기 중 오류가 발생했습니다.");
      }
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="text-[#292A2D] text-[13px] font-bold leading-[1.25] tracking-[-0.13px]">
          파기 대상 문서 조회
        </div>
      </div>

      <DestructionFilter
        startDate={startDate}
        endDate={endDate}
        onDateChange={(range) => {
            setStartDate(range.from);
            setEndDate(range.to);
            setPage(1);
        }}
        documentType={documentType}
        onDocumentTypeChange={(val) => {
            setDocumentType(val);
            setSelectedIds([]);
            setPage(1);
        }}
        fiveYearsAgo={fiveYearsAgo}
      />

      <div className="flex-1 overflow-auto relative h-full flex flex-col">
        {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
                <span className="text-sm text-slate-500">로딩 중...</span>
            </div>
        )}
        <div className="flex-1 overflow-auto">
            <DestructionTable
              data={destructionData}
              documentType={documentType}
              selectedIds={selectedIds}
              onSelectChange={setSelectedIds}
              patientName={patientName}
              onPatientNameChange={(val) => {
                setPatientName(val);
                setPage(1);
              }}
              onDestruct={() => setShowDestructAlert(true)}
              onBulkDestruct={() => setShowBulkDestructAlert(true)}
              isDestructPending={destructMutation.isPending}
              isBulkDestructPending={bulkDestructMutation.isPending}
              totalCount={pagination.totalCount}
            />
        </div>
      </div>

      <div className=" border-slate-200 flex justify-between items-center gap-2 mt-4">
        <Button 
            variant="outline" 
            onClick={() => setShowHistory(true)}
            className="gap-1 border-slate-300 text-slate-700 text-xs border-none"
        >
            <span className="text-sm leading-none pb-[1px]">+</span> 개인정보 파기 내역
        </Button>
        
      </div>

      {showDestructAlert && (
          <DestructionAlert 
            open={showDestructAlert}
            onOpenChange={setShowDestructAlert}
            count={selectedIds.length}
            onConfirm={handleDestructConfirm}
            isPending={destructMutation.isPending}
          />
      )}

      {showBulkDestructAlert && (
          <DestructionAlert 
            open={showBulkDestructAlert}
            onOpenChange={setShowBulkDestructAlert}
            count={pagination.totalCount}
            onConfirm={handleBulkDestructConfirm}
            isPending={bulkDestructMutation.isPending}
          />
      )}

      <DestructionHistoryModal 
        open={showHistory}
        onOpenChange={setShowHistory}
      />
    </>
  );
}
