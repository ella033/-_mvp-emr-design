"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClaims } from "@/hooks/claims/use-claims";
import { Calendar, ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { monthsKo, FormNumber, TreatmentType, ClaimClassification, formNumberToInsuranceType, treatmentTypeToLabel, claimClassificationToLabel } from "../(enums)/claims-enums";

const ClaimsTransmission = () => {
  // 필터 상태
  const today = new Date();
  const defaultYearMonth = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}`;
  type Filters = {
    progressStatus: string;
    formNumber: "ALL" | FormNumber;
    treatmentYearMonth: string;
    treatmentType: "ALL" | TreatmentType;
    claimClassification: "ALL" | ClaimClassification;
    page: number;
    limit: number;
  };

  const [filters, setFilters] = useState<Filters>({
    progressStatus: "COMPLETED",
    formNumber: "ALL",
    treatmentYearMonth: defaultYearMonth,
    treatmentType: "ALL",
    claimClassification: "ALL",
    page: 1,
    limit: 10,
  });

  // Month picker state
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(() => Number(filters.treatmentYearMonth.slice(0, 4)) || new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState<number>(() => Number(filters.treatmentYearMonth.slice(4, 6)) || (new Date().getMonth() + 1));
  const monthPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // sync picker state when filter changes externally
    const y = Number(filters.treatmentYearMonth.slice(0, 4));
    const m = Number(filters.treatmentYearMonth.slice(4, 6));
    if (y) setPickerYear(y);
    if (m) setPickerMonth(m);
  }, [filters.treatmentYearMonth]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (isMonthPickerOpen && monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [isMonthPickerOpen]);

  const { data: claimsData, isLoading, error } = useClaims(filters);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  };

  const handleSearch = () => {
    // useQuery re-runs on filters change
  };

  // URL <-> 필터 동기화 (초기 로드 시 URL 값을 상태로 반영)
  useEffect(() => {
    const params = searchParams;
    if (!params) return;
    setFilters(prev => {
      const fn = params.get("formNumber");
      const tt = params.get("treatmentType");
      const cc = params.get("claimClassification");
      return {
        ...prev,
        formNumber:
          fn === "ALL" ? "ALL" : fn === FormNumber.H010 ? FormNumber.H010 : fn === FormNumber.H011 ? FormNumber.H011 : prev.formNumber,
        treatmentYearMonth: params.get("treatmentYearMonth") ?? prev.treatmentYearMonth,
        treatmentType:
          tt === "ALL"
            ? "ALL"
            : tt === TreatmentType.INPATIENT
            ? TreatmentType.INPATIENT
            : tt === TreatmentType.OUTPATIENT
            ? TreatmentType.OUTPATIENT
            : prev.treatmentType,
        claimClassification:
          cc === "ALL"
            ? "ALL"
            : cc === ClaimClassification.ORIGINAL
            ? ClaimClassification.ORIGINAL
            : cc === ClaimClassification.SUPPLEMENT
            ? ClaimClassification.SUPPLEMENT
            : cc === ClaimClassification.ADDITIONAL
            ? ClaimClassification.ADDITIONAL
            : prev.claimClassification,
        page: params.get("page") ? Number(params.get("page")) : prev.page,
        limit: params.get("limit") ? Number(params.get("limit")) : prev.limit,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 필터 변경 시 URL에 반영 (상태 보존)
  useEffect(() => {
    const sp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
    });
    const url = `${pathname}?${sp.toString()}`;
    window.history.replaceState(null, "", url);
  }, [filters, pathname]);

  // 매핑 함수들
  const getInsuranceType = (formNumber: string) => formNumberToInsuranceType(formNumber);
  const getTreatmentType = (treatmentType: string) => treatmentTypeToLabel(treatmentType);
  const getClaimClassification = (claimClassification: string) => claimClassificationToLabel(claimClassification);
  const formatAmount = (amount: string) => {
    const num = parseInt(amount, 10);
    if (Number.isNaN(num)) return "0";
    return num.toLocaleString();
  };

  const months = monthsKo;
  const formattedFilterMonth = `${filters.treatmentYearMonth.slice(0,4)}-${filters.treatmentYearMonth.slice(4,6)}`;
  const pickMonth = (monthNumber: number) => {
    const mm = String(monthNumber).padStart(2, "0");
    handleFilterChange("treatmentYearMonth", `${pickerYear}${mm}`);
    setIsMonthPickerOpen(false);
  };

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">송신 현황</h2>
          </div>
          {/* 일괄 송신은 완료 목록 페이지에서는 비활성화/제거 */}
        </div>

        {/* 필터 섹션 */}
        <Card className="border-border shadow-sm rounded-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 flex-wrap mb-6">
              {/* 청구월: Month picker */}
              <div className="flex items-center gap-2 relative" ref={monthPickerRef}>
                <label className="text-sm font-medium text-foreground">청구월:</label>
                <div className="relative">
                  <input
                    readOnly
                    value={formattedFilterMonth}
                    onClick={() => setIsMonthPickerOpen(v => !v)}
                    className="w-32 cursor-pointer bg-background border border-border rounded px-3 py-2 text-sm"
                  />
                  <Calendar className="h-4 w-4 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {isMonthPickerOpen && (
                  <div className="absolute z-50 top-10 left-0 bg-background border border-border rounded-sm shadow-lg p-3 w-64">
                    <div className="flex items-center justify-between mb-2">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPickerYear(y => y - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">{pickerYear}년</span>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPickerYear(y => y + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((mLabel, idx) => (
                        <Button
                          key={idx}
                          variant="ghost"
                          size="sm"
                          className={`h-8 text-xs ${pickerMonth === idx + 1 && pickerYear === Number(filters.treatmentYearMonth.slice(0,4)) && (idx + 1) === Number(filters.treatmentYearMonth.slice(4,6)) ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                          onClick={() => pickMonth(idx + 1)}
                        >
                          {mLabel}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">보험구분:</label>
                <Select 
                  value={filters.formNumber}
                  onValueChange={(value) => handleFilterChange("formNumber", value as Filters["formNumber"])}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value={FormNumber.H010}>건강보험</SelectItem>
                    <SelectItem value={FormNumber.H011}>의료급여</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">진료형태:</label>
                <Select 
                  value={filters.treatmentType}
                  onValueChange={(value) => handleFilterChange("treatmentType", value as Filters["treatmentType"])}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value={TreatmentType.INPATIENT}>입원</SelectItem>
                    <SelectItem value={TreatmentType.OUTPATIENT}>외래</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">청구구분:</label>
                <Select 
                  value={filters.claimClassification}
                  onValueChange={(value) => handleFilterChange("claimClassification", value as Filters["claimClassification"])}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value={ClaimClassification.ORIGINAL}>원청구</SelectItem>
                    <SelectItem value={ClaimClassification.SUPPLEMENT}>보완청구</SelectItem>
                    <SelectItem value={ClaimClassification.ADDITIONAL}>추가청구</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="outline" 
                className="border-border"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                조회
              </Button>
            </div>

            {/* 데이터 테이블 */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center text-foreground"></TableHead>
                    <TableHead className="text-center text-foreground">청구월</TableHead>
                    <TableHead className="text-center text-foreground">보험구분</TableHead>
                    <TableHead className="text-center text-foreground">진료형태</TableHead>
                    <TableHead className="text-center text-foreground">청구구분</TableHead>
                    <TableHead className="text-center text-foreground">차수</TableHead>
                    <TableHead className="text-center text-foreground">총건수</TableHead>
                    <TableHead className="text-center text-foreground">오류</TableHead>
                    <TableHead className="text-center text-foreground">심사</TableHead>
                    <TableHead className="text-right text-foreground">요양급여비용총액1</TableHead>
                    <TableHead className="text-right text-foreground">청구액</TableHead>
                    <TableHead className="text-right text-foreground">본인부담금</TableHead>
                    <TableHead className="text-center text-foreground">송신여부</TableHead>
                    <TableHead className="text-center text-foreground">송신일</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>데이터를 불러오는 중...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-8 text-destructive">
                        데이터를 불러오는 중 오류가 발생했습니다.
                      </TableCell>
                    </TableRow>
                  ) : claimsData?.data && claimsData.data.length > 0 ? (
                    claimsData.data.map((claim: any) => (
                      <TableRow
                        key={claim.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => router.push(`/claims/${claim.id}`)}
                      >
                        <TableCell className="text-center"></TableCell>
                        <TableCell className="text-center">{claim.treatmentYearMonth}</TableCell>
                        <TableCell className="text-center">{getInsuranceType(claim.formNumber)}</TableCell>
                        <TableCell className="text-center">{getTreatmentType(claim.treatmentType)}</TableCell>
                        <TableCell className="text-center">{getClaimClassification(claim.claimClassification)}</TableCell>
                        <TableCell className="text-center">{claim.claimOrder || "1차"}</TableCell>
                        <TableCell className="text-center">{claim.count || 0}건</TableCell>
                        <TableCell className="text-center">
                          <span className={(claim.errorCount || 0) > 0 ? "text-destructive font-semibold" : ""}>{claim.errorCount || 0}건</span>
                        </TableCell>
                        <TableCell className="text-center">{(claim.reviewCompletedCount || 0)}/{claim.count || 0}</TableCell>
                        <TableCell className="text-right">{formatAmount(claim.totalMedicalBenefitAmount1 || "0")}</TableCell>
                        <TableCell className="text-right">{formatAmount(claim.claimAmount || "0")}</TableCell>
                        <TableCell className="text-right">{formatAmount(claim.patientCoPayment || "0")}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">완료</Badge>
                        </TableCell>
                        <TableCell className="text-center">{claim.claimDate || "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                        데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClaimsTransmission; 