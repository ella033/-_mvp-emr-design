"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar as CalendarIcon } from "lucide-react";
import ClaimsCreateModal from "./claims-create-modal";
import {
  claimClassificationToLabel,
  formNumberToInsuranceType,
  treatmentTypeToLabel,
  FormNumber,
} from "../(enums)/claims-enums";
import AlertModal from "@/app/claims/commons/alert-modal";
import { useConfirm } from "@/app/claims/commons/confirm-provider";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "@/styles/react-calendar.css";
import { ClaimStatusBadge } from "./claim-status-badge";
import { ClaimsService } from "@/services/claims-service";
import { useRouter } from "next/navigation";

// ── 날짜 유틸 ──────────────────────────────────────
const formatDateToYYYYMMDD = (date: Date): string =>
  date.toISOString().split("T")[0] ?? "";

const getDefaultDateRange = () => {
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  return {
    from: formatDateToYYYYMMDD(threeMonthsAgo),
    to: formatDateToYYYYMMDD(today),
  };
};

const formatYearMonth = (ym: string) => {
  if (!ym || ym.length < 6) return ym;
  return `${ym.slice(0, 4)}-${ym.slice(4, 6)}`;
};

const formatAmount = (amount: string) => {
  const num = parseInt(amount, 10);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString();
};

const getClaimApiErrorCount = (claim: any): number => {
  const parsed = Number(claim?.claimApiErrorCount ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const hasClaimApiError = (claim: any): boolean => getClaimApiErrorCount(claim) > 0;

// ── 컴포넌트 ───────────────────────────────────────
const ClaimsGeneration = () => {
  const router = useRouter();
  const DATE_RANGE_STORAGE_KEY = "claims:lastDateRange";
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isProgramAlertOpen, setIsProgramAlertOpen] = useState(false);
  const { confirm } = useConfirm();
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(false);

  const fetchClaims = useCallback(async (from: string, to: string) => {
    setIsLoadingClaims(true);
    try {
      const response = await ClaimsService.getClaims({
        startDate: from.replace(/-/g, ""),
        endDate: to.replace(/-/g, ""),
      });
      setClaims(response?.data ?? []);
      setSelectedIds(new Set());
    } finally {
      setIsLoadingClaims(false);
    }
  }, []);

  // 날짜 범위 필터
  const [dateRange, setDateRange] = useState(() => {
    if (typeof window === "undefined") return getDefaultDateRange();
    const saved = window.localStorage.getItem(DATE_RANGE_STORAGE_KEY);
    if (!saved) return getDefaultDateRange();
    try {
      const parsed = JSON.parse(saved) as { from: string; to: string };
      if (parsed?.from && parsed?.to) return parsed;
    } catch {
      return getDefaultDateRange();
    }
    return getDefaultDateRange();
  });

  // 캘린더 상태
  const [isFromCalendarOpen, setIsFromCalendarOpen] = useState(false);
  const [isToCalendarOpen, setIsToCalendarOpen] = useState(false);
  const fromCalendarRef = useRef<HTMLDivElement>(null);
  const toCalendarRef = useRef<HTMLDivElement>(null);
  const fromButtonRef = useRef<HTMLButtonElement>(null);
  const toButtonRef = useRef<HTMLButtonElement>(null);

  // 캘린더 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fromCalendarRef.current &&
        !fromCalendarRef.current.contains(event.target as Node) &&
        fromButtonRef.current &&
        !fromButtonRef.current.contains(event.target as Node)
      ) {
        setIsFromCalendarOpen(false);
      }
      if (
        toCalendarRef.current &&
        !toCalendarRef.current.contains(event.target as Node) &&
        toButtonRef.current &&
        !toButtonRef.current.contains(event.target as Node)
      ) {
        setIsToCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    void fetchClaims(dateRange.from, dateRange.to);
  }, [dateRange.from, dateRange.to, fetchClaims]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(DATE_RANGE_STORAGE_KEY, JSON.stringify(dateRange));
  }, [dateRange]);

  const rows = useMemo(() => claims, [claims]);

  // ── 빠른 필터 ──────────────────────────────────
  const handleQuickFilter = (months: number) => {
    const today = new Date();
    const from = new Date(today);
    from.setMonth(today.getMonth() - months);
    setDateRange({
      from: formatDateToYYYYMMDD(from),
      to: formatDateToYYYYMMDD(today),
    });
  };

  const handleThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setDateRange({
      from: formatDateToYYYYMMDD(firstDay),
      to: formatDateToYYYYMMDD(lastDay),
    });
  };

  // ── 명세서 생성 모달 ──────────────────────────
  const handleGenerate = () => setIsCreateOpen(true);
  const handleRowClick = (claimId: string) => {
    if (!claimId) return;
    router.push(`/claims/${claimId}`);
  };

  // 생성 완료 후 mock 데이터에 추가
  const handleClaimCreated = useCallback(() => {
    void fetchClaims(dateRange.from, dateRange.to);
  }, [dateRange.from, dateRange.to, fetchClaims]);

  // ── 삭제 (mock) ───────────────────────────────
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0 || deleting) return;
    setDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => ClaimsService.deleteClaim(id))
      );
      await fetchClaims(dateRange.from, dateRange.to);
    } catch {
      alert("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // ── 송신 ───────────────────────────────
  const handleSubmitClaim = async (
    e: React.MouseEvent<HTMLButtonElement>,
    claim: any
  ) => {
    e.stopPropagation();

    if (hasClaimApiError(claim)) {
      return;
    }

    const hasError = getClaimApiErrorCount(claim) > 0;
    const year = String(claim.treatmentYearMonth).slice(0, 4);
    const month = String(claim.treatmentYearMonth).slice(4, 6);
    const insuranceType = formNumberToInsuranceType(claim.formNumber);
    const order = claim.claimOrder ?? "1";
    const message = `${hasError ? "수정되지 않은 오류가 있습니다.\n" : ""}${year}년 ${month}월 ${insuranceType} ${order}차 명세서를\n송신하시겠습니까?`;

    const ok = await confirm({
      message,
      confirmText: "확인",
      cancelText: "취소",
    });
    if (!ok) return;

    try {
      const response = await ClaimsService.transmitClaims({
        ids: [claim.id],
      });
      if (response?.data?.progress === "PROGRAM_NOT_INSTALLED") {
        setIsProgramAlertOpen(true);
      }
      await fetchClaims(dateRange.from, dateRange.to);
    } catch {
      alert("송신 처리에 실패했습니다.");
    }
  };

  const handleSubmitSelectedClaims = async () => {
    if (selectedIds.size === 0) return;
    const selectedClaims = rows.filter((claim) => selectedIds.has(claim.id));
    if (selectedClaims.some((claim) => hasClaimApiError(claim))) return;
    try {
      await ClaimsService.transmitClaims({
        ids: Array.from(selectedIds),
      });
      await fetchClaims(dateRange.from, dateRange.to);
    } catch {
      alert("일괄 송신 처리에 실패했습니다.");
    }
  };

  // ── 선택 상태 ──────────────────────────────────
  const isTransmitEnabled = (claim: any) =>
    !["COMPLETED", "TRANSFORMING"].includes(claim.progress) && !claim.claimDate;

  const selectableRows = rows.filter(
    (claim) => isTransmitEnabled(claim) && !hasClaimApiError(claim)
  );
  const selectedClaims = rows.filter((claim) => selectedIds.has(claim.id));
  const hasSelectedClaimErrors = selectedClaims.some((claim) => hasClaimApiError(claim));
  const isAllSelected =
    selectableRows.length > 0 && selectableRows.every((r) => selectedIds.has(r.id));
  const isSomeSelected = selectableRows.some((r) => selectedIds.has(r.id));

  // ── 상태 뱃지 ──────────────────────────────────
  const getStatusBadge = (claim: any) => {
    if (claim.statusLabel === "CHECK_REQUIRED") {
      return <ClaimStatusBadge status="check_required" />;
    }
    if (claim.statusLabel === "TRANSFORMING") {
      return <ClaimStatusBadge status="transforming" />;
    }
    if (claim.statusLabel === "LAUNCH_FAILED") {
      return <ClaimStatusBadge status="launch_failed" />;
    }
    if (claim.statusLabel === "PROGRAM_NOT_INSTALLED") {
      return <ClaimStatusBadge status="program_not_installed" />;
    }
    const isSent = claim.progress === "COMPLETED" || !!claim.claimDate;
    return <ClaimStatusBadge status={isSent ? "completed" : "pending"} />;
  };

  // ── 렌더 ──────────────────────────────────────
  return (
    <div className="h-full flex flex-col p-4 overflow-hidden">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[16px] font-bold text-[var(--gray-100)] leading-[1.4] tracking-[-0.16px]">
          청구현황
        </h2>
        <Button
          data-testid="claims-generate-button"
          className="bg-[var(--main-color)] hover:bg-[var(--main-color-hover)] text-white text-[13px] font-medium h-8 px-3 rounded-[4px]"
          onClick={handleGenerate}
        >
          명세서생성
        </Button>
      </div>

      {/* ── 필터 바 ── */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[12px] font-bold text-[var(--gray-200)] whitespace-nowrap">
          조회 기간
        </span>

        {/* From 날짜 선택 */}
        <div className="relative">
          <button
            ref={fromButtonRef}
            onClick={() => setIsFromCalendarOpen(!isFromCalendarOpen)}
            data-testid="claims-period-filter"
            className="h-8 w-[130px] text-[13px] border border-[var(--border-2)] rounded-[6px] px-2 bg-[var(--bg-main)] hover:bg-[var(--bg-1)] flex items-center justify-between transition-colors"
          >
            <span className="text-[var(--gray-200)]">{dateRange.from}</span>
            <CalendarIcon className="w-3.5 h-3.5 text-[var(--gray-400)]" />
          </button>
          {isFromCalendarOpen && (
            <div
              ref={fromCalendarRef}
              data-testid="claims-period-calendar"
              className="absolute top-full left-0 mt-1 bg-[var(--bg-main)] border border-[var(--border-1)] rounded-md shadow-lg z-50"
            >
              <div className="relative w-80">
                <Calendar
                  onChange={(value: any) => {
                    if (value instanceof Date) {
                      setDateRange((prev) => ({
                        ...prev,
                        from: formatDateToYYYYMMDD(value),
                      }));
                      setIsFromCalendarOpen(false);
                    }
                  }}
                  value={new Date(dateRange.from)}
                  locale="ko-KR"
                  calendarType="gregory"
                  formatDay={(_locale: any, date: Date) =>
                    date.getDate().toString()
                  }
                  showNeighboringMonth={false}
                  next2Label={null}
                  prev2Label={null}
                  className="react-calendar w-full"
                />
                <div className="p-3 border-t border-[var(--border-1)]">
                  <button
                    onClick={() => {
                      setDateRange((prev) => ({
                        ...prev,
                        from: formatDateToYYYYMMDD(new Date()),
                      }));
                      setIsFromCalendarOpen(false);
                    }}
                    className="w-full py-2 text-sm text-[var(--gray-200)] border border-[var(--border-1)] hover:bg-[var(--bg-1)] rounded transition-colors font-medium"
                  >
                    오늘
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <span className="text-[13px] text-[var(--gray-400)]">-</span>

        {/* To 날짜 선택 */}
        <div className="relative">
          <button
            ref={toButtonRef}
            onClick={() => setIsToCalendarOpen(!isToCalendarOpen)}
            className="h-8 w-[130px] text-[13px] border border-[var(--border-2)] rounded-[6px] px-2 bg-[var(--bg-main)] hover:bg-[var(--bg-1)] flex items-center justify-between transition-colors"
          >
            <span className="text-[var(--gray-200)]">{dateRange.to}</span>
            <CalendarIcon className="w-3.5 h-3.5 text-[var(--gray-400)]" />
          </button>
          {isToCalendarOpen && (
            <div
              ref={toCalendarRef}
              className="absolute top-full left-0 mt-1 bg-[var(--bg-main)] border border-[var(--border-1)] rounded-md shadow-lg z-50"
            >
              <div className="relative w-80">
                <Calendar
                  onChange={(value: any) => {
                    if (value instanceof Date) {
                      setDateRange((prev) => ({
                        ...prev,
                        to: formatDateToYYYYMMDD(value),
                      }));
                      setIsToCalendarOpen(false);
                    }
                  }}
                  value={new Date(dateRange.to)}
                  locale="ko-KR"
                  calendarType="gregory"
                  formatDay={(_locale: any, date: Date) =>
                    date.getDate().toString()
                  }
                  showNeighboringMonth={false}
                  next2Label={null}
                  prev2Label={null}
                  className="react-calendar w-full"
                />
                <div className="p-3 border-t border-[var(--border-1)]">
                  <button
                    onClick={() => {
                      setDateRange((prev) => ({
                        ...prev,
                        to: formatDateToYYYYMMDD(new Date()),
                      }));
                      setIsToCalendarOpen(false);
                    }}
                    className="w-full py-2 text-sm text-[var(--gray-200)] border border-[var(--border-1)] hover:bg-[var(--bg-1)] rounded transition-colors font-medium"
                  >
                    오늘
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSubmitSelectedClaims}
          disabled={selectedIds.size === 0 || hasSelectedClaimErrors}
          className="h-8 text-[13px] border-[var(--border-2)] rounded-[4px] px-3"
        >
          송신
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleThisMonth}
          className="h-8 text-[13px] border-[var(--border-2)] rounded-[4px] px-3"
        >
          이번달
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter(3)}
          className="h-8 text-[13px] border-[var(--border-2)] rounded-[4px] px-3"
        >
          3개월
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter(6)}
          className="h-8 text-[13px] border-[var(--border-2)] rounded-[4px] px-3"
        >
          6개월
        </Button>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (selectedIds.size > 0) setIsDeleteAlertOpen(true);
          }}
          disabled={selectedIds.size === 0}
          className="h-8 text-[13px] border-[var(--border-2)] rounded-[4px] px-3"
        >
          삭제
        </Button>
      </div>

      {/* ── 테이블 ── */}
      <div className="flex-1 overflow-auto rounded-[6px]">
        {isLoadingClaims && (
          <div className="text-[13px] text-[var(--gray-400)] py-2">데이터를 불러오는 중...</div>
        )}
        <Table
          data-testid="claims-list-table"
          className="[&_tr]:border-0 [&_thead]:border-0 [&_th]:border-0 [&_tbody]:border-0 [&_th]:align-middle [&_td]:align-middle [&_thead_tr]:!border-b-0"
        >
          <TableHeader className="!border-0">
            <TableRow className="bg-[var(--bg-2)] hover:bg-[var(--bg-2)] !border-b-0">
              <TableHead className="w-10 text-center h-[28px] py-0 rounded-bl-[6px]">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isSomeSelected && !isAllSelected;
                  }}
                  onChange={(e) => {
                    if (e.target.checked)
                      setSelectedIds(new Set(selectableRows.map((r) => r.id)));
                    else setSelectedIds(new Set());
                  }}
                  className="rounded border-[var(--border-2)]"
                />
              </TableHead>
              <TableHead data-testid="claims-header-month" className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                청구월
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                보험구분
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                진료형태
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                청구구분
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                차수
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                총건수
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                심사
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                요양급여비용총액1
              </TableHead>
              <TableHead data-testid="claims-header-amount" className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                청구액
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                본인부담금
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                오류
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                상태
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                송신
              </TableHead>
              <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0 rounded-br-[6px]">
                송신일
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length > 0 ? (
              rows.map((claim, index) => (
                <TableRow
                  key={claim.id}
                  data-testid="claims-row"
                  className="hover:bg-[var(--bg-1)] cursor-pointer h-[28px] border-b-0"
                  onClick={() => handleRowClick(claim.id)}
                >
                  <TableCell className={`text-center py-0 ${index === rows.length - 1 ? 'rounded-bl-[6px]' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(claim.id)}
                      disabled={!isTransmitEnabled(claim) || hasClaimApiError(claim)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(claim.id);
                          else next.delete(claim.id);
                          return next;
                        });
                      }}
                      className="rounded border-[var(--border-2)] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </TableCell>
                  <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                    {formatYearMonth(claim.treatmentYearMonth)}
                  </TableCell>
                  <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                    {formNumberToInsuranceType(claim.formNumber)}
                  </TableCell>
                  <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                    {treatmentTypeToLabel(claim.treatmentType)}
                  </TableCell>
                  <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                    {claimClassificationToLabel(claim.claimClassification)}
                  </TableCell>
                  <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                    {claim.claimOrder ? `${claim.claimOrder}차` : "1차"}
                  </TableCell>
                  <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                    {claim.count}건
                  </TableCell>
                  <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                    {claim.reviewCompletedCount}/{claim.count}
                  </TableCell>
                  <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                    {formatAmount(claim.totalMedicalBenefitAmount1)}
                  </TableCell>
                  <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                    {formatAmount(claim.claimAmount)}
                  </TableCell>
                  <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                    {formatAmount(claim.patientCoPayment)}
                  </TableCell>
                  <TableCell className="text-center py-0">
                    {getClaimApiErrorCount(claim) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[13px] text-[#FF4242] font-medium leading-[1.4] tracking-[-0.13px]">
                        <img
                          src="/icon/ic_line_alert-circle.svg"
                          alt="오류"
                          width={16}
                          height={16}
                        />
                        {getClaimApiErrorCount(claim)}건
                      </span>
                    ) : (
                      <span className="text-[13px] text-[var(--gray-200)]">
                        0건
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center py-0">
                    {getStatusBadge(claim)}
                  </TableCell>
                  <TableCell className="text-center py-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[12px] px-2 border-[var(--border-2)] rounded-[4px]"
                      disabled={!isTransmitEnabled(claim) || hasClaimApiError(claim)}
                      onClick={(e) => handleSubmitClaim(e, claim)}
                    >
                      송신
                    </Button>
                  </TableCell>
                  <TableCell className={`text-center text-[13px] text-[var(--gray-200)] py-0 ${index === rows.length - 1 ? 'rounded-br-[6px]' : ''}`}>
                    {claim.claimDate || "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="border-b-0">
                <TableCell
                  colSpan={15}
                  data-testid="claims-empty-state"
                  className="text-center py-8 text-[13px] text-[var(--gray-500)] rounded-b-[6px]"
                >
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── 모달 ── */}
      <ClaimsCreateModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        selectedValues={{
          formNumber: FormNumber.H010,
          insuranceType: "건강보험",
          claimClassification: "원청구",
          treatmentType: "외래",
        }}
        onCreated={handleClaimCreated}
      />

      <AlertModal
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        message="선택한 내역을 삭제하시겠습니까?"
        confirmText="확인"
        cancelText="취소"
        showCancel
        isConfirmLoading={deleting}
        onConfirm={handleDeleteSelected}
      />

      <AlertModal
        open={isProgramAlertOpen}
        onOpenChange={setIsProgramAlertOpen}
        message={"진료비청구프로그램이 설치되어 있지 않습니다.\n설치 후 송신 진행해주세요."}
        confirmText="확인"
        showCancel={false}
      />
    </div>
  );
};

export default ClaimsGeneration;
