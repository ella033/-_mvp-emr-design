"use client";

import React, { useState } from "react";
import { DdocdocStatusBadge } from "@/components/ddocdoc-status-badge";
import { useDdocDocJobs } from "@/hooks/ddocdoc/use-ddocdoc-jobs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { formatDateTime } from "@/lib/date-utils";
import type { DdocDocJob } from "@/services/ddocdoc-service";
import { DdocDocService } from "@/services/ddocdoc-service";
import { useQueryClient } from "@tanstack/react-query";
import { useHospitalServiceEnabled } from "@/hooks/hospital/use-hospital-service-enabled";
import { ApiError } from "@/lib/api/api-proxy";
import { Button } from "@/components/ui/button";
import { useCreateHospitalServiceEnabled } from "@/hooks/hospital/use-update-hospital-service-enabled";

type JobState =
  | "CONFIRM"
  | "REJECT"
  | "CANCEL"
  | "VISIT"
  | "PENDING"
  | "COMPLETE";

const STATE_OPTIONS: { value: JobState; label: string }[] = [
  { value: "CONFIRM", label: "확정" },
  { value: "REJECT", label: "거부" },
  { value: "CANCEL", label: "취소" },
  { value: "VISIT", label: "내원" },
  { value: "PENDING", label: "가접수" },
  { value: "COMPLETE", label: "완료" },
];

interface DdocdocSettingsProps {
  hospital: any;
  setHospital: (hospital: any) => void;
  hasChanges: boolean;
  setHasChanges: (hasChanges: boolean) => void;
  toastHelpers: any;
  onSave: () => void;
  onCancel: () => void;
  fetchHospitalData: () => Promise<void>;
}

export const DdocdocSettings: React.FC<DdocdocSettingsProps> = ({}) => {
  const { data, isLoading, error } = useDdocDocJobs();
  const queryClient = useQueryClient();
  const [updatingStates, setUpdatingStates] = useState<Set<string>>(new Set());
  const [isRefetchingServiceEnabled, setIsRefetchingServiceEnabled] =
    useState(false);

  // 똑닥 연동 상태 확인
  const {
    data: serviceEnabledData,
    error: serviceEnabledError,
    isLoading: isServiceEnabledLoading,
    refetch: refetchServiceEnabled,
  } = useHospitalServiceEnabled("ddocdoc");

  // 똑닥 연동 관련 공통 핸들러
  const handleServiceEnabledSuccess = (message: string) => {
    queryClient.invalidateQueries({
      queryKey: ["hospital-service-enabled", "ddocdoc"],
    });
    alert(message);
  };

  const handleServiceEnabledError = (action: string) => (error: Error) => {
    alert(`똑닥 ${action} 실패: ${error.message}`);
  };

  // 똑닥 연동 생성 mutation
  const createServiceEnabled = useCreateHospitalServiceEnabled({
    onSuccess: () =>
      handleServiceEnabledSuccess("똑닥 연동이 활성화되었습니다."),
    onError: handleServiceEnabledError("연동 활성화"),
  });

  // 연동 없음 상태 확인 (404 에러)
  const isServiceNotFound = (() => {
    if (isServiceEnabledLoading) return false;
    if (serviceEnabledError) {
      const errorStatus =
        serviceEnabledError instanceof ApiError
          ? serviceEnabledError.status
          : (serviceEnabledError as any)?.status ||
            (serviceEnabledError as any)?.data?.statusCode ||
            (serviceEnabledError as any)?.statusCode;
      return errorStatus === 404;
    }
    return false;
  })();

  // 연동 실패 상태 확인 (enabled: false)
  const isServiceFailed = (() => {
    if (isServiceEnabledLoading) return false;
    if (serviceEnabledData) {
      return serviceEnabledData.enabled === false;
    }
    return false;
  })();

  // 똑닥 연동하기 버튼 클릭 핸들러
  const handleEnableDdocdoc = () => {
    createServiceEnabled.mutate({
      serviceName: "ddocdoc",
    });
  };

  // 똑닥 재연동 버튼 클릭 핸들러 (조회로 최신 상태 확인)
  const handleRetryDdocdoc = async () => {
    setIsRefetchingServiceEnabled(true);
    try {
      await refetchServiceEnabled();
      queryClient.invalidateQueries({
        queryKey: ["hospital-service-enabled", "ddocdoc"],
      });
    } catch (error) {
      alert(
        `똑닥 연동 상태 조회 실패: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsRefetchingServiceEnabled(false);
    }
  };

  const getGenderLabel = (gender: "M" | "F") => {
    return gender === "M" ? "남" : "여";
  };

  const getStateLabel = (state: string) => {
    // STATE_OPTIONS에서 찾기
    const option = STATE_OPTIONS.find((opt) => opt.value === state);
    if (option) return option.label;

    // 추가 상태 라벨 매핑
    const stateMap: Record<string, string> = {
      REQUEST: "요청",
      CONFIRMED: "확정",
      CANCELED: "취소",
      REJECTED: "거절",
    };

    return stateMap[state] || state;
  };

  const handleStateChange = async (
    jobId: string,
    reservationId: string,
    newState: JobState
  ) => {
    setUpdatingStates((prev) => new Set(prev).add(jobId));

    try {
      // API 호출로 상태 업데이트 (confirmDatetime은 서버에서 자동 설정)
      await DdocDocService.updateReservationState(reservationId, {
        state: newState,
      });

      // 성공 시 로컬 상태 업데이트
      queryClient.setQueryData<DdocDocJob[]>(
        ["ddocdoc", "jobs", undefined],
        (oldData) => {
          if (!oldData) return oldData;
          return oldData.map((job) =>
            job._id === jobId
              ? {
                  ...job,
                  payload: {
                    ...job.payload,
                    state: newState,
                  },
                }
              : job
          );
        }
      );
    } catch (error) {
      console.error("상태 업데이트 실패:", error);
      alert(
        `상태 업데이트 실패: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setUpdatingStates((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  return (
    <div className="flex overflow-auto flex-col h-full">
      {/* 메뉴 헤더 */}
      <div className="flex justify-between items-center pb-2 mb-4">
        <h2 className="text-lg py-1 font-bold text-[var(--main-color)]">
          똑닥 설정
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <h3 className="mb-2 text-sm font-semibold">똑닥 연동 상태</h3>
          <div className="flex items-center">
            <DdocdocStatusBadge />
          </div>
        </div>

        {/* 똑닥 연동 실패 안내 문구 (enabled: false) */}
        {isServiceFailed && (
          <div className="flex gap-3 items-start p-4 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-red-800 dark:text-red-300">
                똑닥 연동이 실패했습니다
              </h3>
              <p className="mb-3 text-sm text-red-700 dark:text-red-400">
                똑닥 서비스 연동에 문제가 발생했습니다. 아래 버튼을 눌러
                재연동을 시도해주세요.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={handleRetryDdocdoc}
                disabled={isRefetchingServiceEnabled}
                className="gap-2"
              >
                {isRefetchingServiceEnabled ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    조회 중...
                  </>
                ) : (
                  "재연동 시도"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 똑닥 연동 없음 안내 문구 (404 에러) */}
        {isServiceNotFound && (
          <div className="flex gap-3 items-start p-4 bg-yellow-50 rounded-lg border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="mb-1 font-semibold text-yellow-800 dark:text-yellow-300">
                똑닥 연동이 설정되지 않았습니다
              </h3>
              <p className="mb-3 text-sm text-yellow-700 dark:text-yellow-400">
                똑닥 서비스 연동을 설정해야 예약 목록을 조회할 수 있습니다. 먼저{" "}
                <a
                  href="https://hospital.ddocdoc.com/signin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:text-yellow-900 dark:hover:text-yellow-200"
                >
                  똑닥 어드민 페이지
                </a>
                에서 병원을 등록한 뒤, 똑닥 연동하기 버튼을 눌러 연동을
                활성화해주세요.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open("https://hospital.ddocdoc.com/signin", "_blank")
                  }
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  똑닥 어드민 페이지 열기
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEnableDdocdoc}
                  disabled={createServiceEnabled.isPending}
                  className="gap-2"
                >
                  {createServiceEnabled.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      연동 중...
                    </>
                  ) : (
                    "똑닥 연동하기"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold">똑닥 예약 목록</h3>
          <p className="mb-3 text-xs text-[var(--text-secondary)]">
            똑닥 앱을 통해 요청된 예약 목록을 조회합니다.
          </p>
        </div>

        <div className="bg-[var(--card-background)] border border-[var(--border-color)] rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>환자명</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead className="w-[100px]">성별</TableHead>
                <TableHead className="w-[120px]">생년월일</TableHead>
                <TableHead>진료과</TableHead>
                <TableHead>진료실</TableHead>
                <TableHead>의사</TableHead>
                <TableHead className="w-[120px]">상태</TableHead>
                <TableHead>증상</TableHead>
                <TableHead className="w-[180px]">요청일시</TableHead>
                <TableHead className="w-[180px]">생성일시</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-8 text-center">
                    <div className="flex gap-2 justify-center items-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>데이터를 불러오는 중...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="py-8 text-center text-red-600"
                  >
                    데이터를 불러오는 중 오류가 발생했습니다:{" "}
                    {error instanceof Error ? error.message : String(error)}
                  </TableCell>
                </TableRow>
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={12}
                    className="text-center py-8 text-[var(--text-secondary)]"
                  >
                    일감이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((job) => (
                  <TableRow key={job._id}>
                    <TableCell className="font-mono text-xs">
                      {job._id.slice(-8)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {job.payload.userName}
                    </TableCell>
                    <TableCell>{job.payload.userPhone}</TableCell>
                    <TableCell>{getGenderLabel(job.payload.gender)}</TableCell>
                    <TableCell>{job.payload.birthDate}</TableCell>
                    <TableCell>{job.payload.unitTitle}</TableCell>
                    <TableCell>{job.payload.roomTitle}</TableCell>
                    <TableCell>{job.payload.doctorTitle}</TableCell>
                    <TableCell>
                      <Select
                        value={job.payload.state}
                        onValueChange={(value) =>
                          handleStateChange(
                            job._id,
                            job.payload._id,
                            value as JobState
                          )
                        }
                        disabled={
                          updatingStates.has(job._id) ||
                          ["REJECT", "CANCEL", "COMPLETE"].includes(
                            job.payload.state
                          )
                        }
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          {updatingStates.has(job._id) ? (
                            <div className="flex gap-2 items-center">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>업데이트 중...</span>
                            </div>
                          ) : (
                            <span className="truncate">
                              {getStateLabel(job.payload.state)}
                            </span>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {STATE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell
                      className="max-w-xs truncate"
                      title={job.payload.symptomText}
                    >
                      {job.payload.symptomText || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--text-secondary)]">
                      {formatDateTime(
                        job.payload.requestDatetime || null,
                        true
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-[var(--text-secondary)]">
                      {formatDateTime(job.createdAt, true)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
