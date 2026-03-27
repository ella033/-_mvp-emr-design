"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { AccessHistoryFilter, CLEAR_VALUE } from "./AccessHistoryFilter";
import { AccessLogsTable } from "./AccessLogsTable";
import { usePersonalAccessLogs, useMedicalAccessLogs } from "@/hooks/access-logs/use-access-logs";
import { UsersService } from "@/services/users-service";
import { useHospitalStore } from "@/store/hospital-store";

import { useAccessHistoryStore } from "@/store/access-history-store";

// ... existing imports

interface AccessHistoryPageContentProps {
  type: "PERSONAL" | "CLINICAL";
}

export function AccessHistoryPageContent({ type }: AccessHistoryPageContentProps) {
  const hospital = useHospitalStore((state) => state.hospital);
  const queryClient = useQueryClient();
  
  // Use global store for persistence
  const { startDate, endDate, userId, setStartDate, setEndDate, setUserId } = useAccessHistoryStore();
  
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  // 페이지를 벗어날 때 캐시 무효화
  useEffect(() => {
    return () => {
      queryClient.removeQueries({ queryKey: ["personal-access-logs"] });
      queryClient.removeQueries({ queryKey: ["medical-access-logs"] });
    };
  }, [queryClient]);

  useEffect(() => {
    if (hospital?.id) {
      UsersService.getHospitalUsers(hospital.id).then((data) => {
        const validUsers = data
          .filter((u) => u.userId !== undefined && u.userId !== null)
          .map((u) => ({ id: String(u.userId), name: u.userName }));
        setUsers(validUsers);
      });
    }
  }, [hospital?.id]);

  const queryParams: Record<string, any> = {
    startDate,
    endDate,
  };
  
  if (userId !== CLEAR_VALUE) {
    queryParams.targetUserId = userId;
  }

  const personalQuery = usePersonalAccessLogs({ ...queryParams, enabled: type === "PERSONAL" });
  const medicalQuery = useMedicalAccessLogs({ ...queryParams, enabled: type === "CLINICAL" });

  // type에 따라 적절한 query 선택
  const queryResult = type === "PERSONAL" ? personalQuery : medicalQuery;
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = queryResult;
  
  // Flatten data from pages
  const flatData = data?.pages?.flatMap(page => page.data) || [];
  const totalCount = data?.pages?.[0]?.meta?.total || 0;
  
  return (
    <>
      {/* Filter */}
      <AccessHistoryFilter
        startDate={startDate}
        endDate={endDate}
        onDateChange={(range) => {
          setStartDate(range.from);
          setEndDate(range.to);
        }}
        userId={userId}
        onUserChange={setUserId}
        users={users}
      />
      {/* Table */}
      <div className="flex-1 overflow-auto relative h-full">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <span className="text-sm text-slate-500">로딩 중...</span>
          </div>
        )}
        <AccessLogsTable 
          data={flatData}
          variant={type === "PERSONAL" ? "general" : "medical"}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          totalCount={totalCount}
        />
      </div>
    </>
  );
}
