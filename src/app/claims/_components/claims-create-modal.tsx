"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MyPopup from "@/components/yjg/my-pop-up";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Search, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import React, { useEffect, useMemo, useState, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "@/styles/react-calendar.css";
import AdditionalClaimItemsModal from "./additional-claim-items-modal";
import { ClaimsService } from "@/services/claims-service";

// ── 인터페이스 ─────────────────────────────────────
interface ClaimsCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedValues?: {
    claimMonth?: string;
    insuranceType?: string;
    claimClassification?: string;
    formNumber?: string;
    treatmentType?: string;
  };
  onCreated?: () => void;
}

interface FormDataState {
  appointmentDate: string; // YYYY-MM
  round: string;
  insuranceType: string;
  claimType: string;
  formNumber: string;
  treatmentType: string;
}

interface CandidatePatientRow {
  id: string;
  patientPk: number;
  patientId: string;
  patientName: string;
  birthDate: string;
  gender: string;
  treatmentDate: string;
  lastModified?: string;
  additionalClaimCount?: number;
}

// ── 컴포넌트 ───────────────────────────────────────
const ClaimsCreateModal: React.FC<ClaimsCreateModalProps> = ({
  open,
  onOpenChange,
  selectedValues,
  onCreated,
}) => {
  const getCurrentYearMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // ── 상단 폼 상태 ──────────────────────────────
  const [formData, setFormData] = useState<FormDataState>(() => ({
    appointmentDate: getCurrentYearMonth(),
    round: "1차",
    insuranceType: selectedValues?.insuranceType || "건강보험",
    claimType: selectedValues?.claimClassification || "원청구",
    formNumber: selectedValues?.formNumber || "H010",
    treatmentType: selectedValues?.treatmentType || "외래",
  }));

  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [showCreateValidation, setShowCreateValidation] = useState(false);

  const getClaimClassificationCode = (claimType: string) => {
    if (claimType === "보완청구") return "1";
    if (claimType === "추가청구") return "2";
    return "0";
  };

  const extractNextOrder = (nextOrderResponse: unknown): string => {
    if (!nextOrderResponse || typeof nextOrderResponse !== "object") return "1";

    const response = nextOrderResponse as {
      nextOrder?: unknown;
      data?: { nextOrder?: unknown };
    };

    if (
      typeof response.nextOrder === "string" ||
      typeof response.nextOrder === "number"
    ) {
      return String(response.nextOrder);
    }

    if (
      typeof response.data?.nextOrder === "string" ||
      typeof response.data?.nextOrder === "number"
    ) {
      return String(response.data.nextOrder);
    }

    return "1";
  };

  const loadNextOrder = async (nextFormData: FormDataState) => {
    try {
      const treatmentYearMonth = nextFormData.appointmentDate
        ? nextFormData.appointmentDate.slice(0, 7).replace(/-/g, "")
        : "";
      const treatmentType = nextFormData.treatmentType === "입원" ? "1" : "2";
      const claimClassification = getClaimClassificationCode(nextFormData.claimType);

      const nextOrderResponse = await ClaimsService.getNextOrder({
        treatmentYearMonth,
        formNumber: nextFormData.formNumber,
        treatmentType,
        claimClassification,
      });
      const nextOrder = extractNextOrder(nextOrderResponse);
      setFormData((prev) => ({ ...prev, round: `${nextOrder}차` }));
    } catch {
      setFormData((prev) => ({ ...prev, round: "1차" }));
    }
  };

  // 캘린더 상태
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 캘린더 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // selectedValues 동기화
  useEffect(() => {
    if (selectedValues) {
      setFormData((prev) => ({
        ...prev,
        insuranceType: selectedValues.insuranceType || prev.insuranceType,
        claimType: selectedValues.claimClassification || prev.claimType,
        formNumber: selectedValues.formNumber || prev.formNumber,
        treatmentType: selectedValues.treatmentType || prev.treatmentType,
      }));
    }
  }, [selectedValues]);

  // 모달 초기화
  useEffect(() => {
    if (open) {
      const appointmentDate = getCurrentYearMonth();
      const nextFormData: FormDataState = {
        ...formData,
        appointmentDate,
      };

      setFormData((prev) => ({ ...prev, appointmentDate }));
      void loadNextOrder(nextFormData);
      setHasSearched(false);
      setPatients([]);
      setSelectedPatients(new Set());
      setShowCreateValidation(false);
    } else {
      setHasSearched(false);
      setPatients([]);
      setSelectedPatients(new Set());
      setSearchTerm("");
      setShowCreateValidation(false);
    }
  }, [open]);

  // 보험/서식 연동
  const handleInsuranceTypeChange = (insuranceType: string) => {
    const nextFormData: FormDataState = {
      ...formData,
      insuranceType,
      formNumber: insuranceType === "의료급여" ? "H011" : "H010",
    };

    setFormData(nextFormData);
    void loadNextOrder(nextFormData);
    setHasSearched(false);
    setSelectedPatients(new Set());
    setAdditionalItemsMap({});
  };

  const handleClaimTypeChange = (claimType: string) => {
    const nextFormData: FormDataState = { ...formData, claimType };

    setFormData(nextFormData);
    void loadNextOrder(nextFormData);

    // 청구구분 변경 시 추가청구 항목 선택 초기화
    setAdditionalItemsMap({});
    setSelectedPatients(new Set());
    setHasSearched(false);
  };

  // ── 환자 리스트 (mock) ──────────────────────────
  const [excludeClaimed, setExcludeClaimed] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(
    new Set()
  );
  const [patients, setPatients] = useState<CandidatePatientRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // ── 추가청구 항목 선택 팝업 상태 ───────────────
  const [isAdditionalItemsOpen, setIsAdditionalItemsOpen] = useState(false);
  const [additionalItemsTargetPatient, setAdditionalItemsTargetPatient] =
    useState<CandidatePatientRow | null>(null);
  // 환자별 선택된 추가청구 항목 ID 맵
  const [additionalItemsMap, setAdditionalItemsMap] = useState<
    Record<string, Set<string>>
  >({});

  const isAdditionalClaim = formData.claimType === "추가청구";

  // ── 검색 필터 ─────────────────────────────────
  const filteredPatients = useMemo(() => {
    return patients.filter(
      (p) =>
        p.patientName.includes(searchTerm) || p.patientId.includes(searchTerm)
    );
  }, [patients, searchTerm]);

  const isAllSelected =
    filteredPatients.length > 0 &&
    filteredPatients.every((p) => selectedPatients.has(p.id));
  const isIndeterminate =
    filteredPatients.some((p) => selectedPatients.has(p.id)) && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    // 추가청구에서는 전체선택 불가 (개별 항목 선택 필요)
    if (isAdditionalClaim) return;

    if (checked)
      setSelectedPatients(new Set(filteredPatients.map((p) => p.id)));
    else setSelectedPatients(new Set());
    setShowCreateValidation(false);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (isAdditionalClaim && checked) {
      // 추가청구일 때 체크하면 항목 선택 팝업 열기
      const targetPatient = filteredPatients.find((p) => p.id === id) ?? null;
      setAdditionalItemsTargetPatient(targetPatient);
      setIsAdditionalItemsOpen(true);
      return;
    }

    setSelectedPatients((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    setShowCreateValidation(false);

    // 추가청구에서 체크 해제 시 항목 맵에서도 제거
    if (isAdditionalClaim && !checked) {
      setAdditionalItemsMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  // 추가청구 항목 선택 완료 핸들러
  const handleAdditionalItemsConfirm = (selectedItemIds: Set<string>) => {
    if (!additionalItemsTargetPatient) return;

    const patientId = additionalItemsTargetPatient.id;

    // 환자를 선택 상태로 추가
    setSelectedPatients((prev) => {
      const next = new Set(prev);
      next.add(patientId);
      return next;
    });

    // 선택된 항목 저장
    setAdditionalItemsMap((prev) => ({
      ...prev,
      [patientId]: selectedItemIds,
    }));
  };

  // ── 조회 핸들러 ─────────────────────────
  const handleSearch = async () => {
    setHasSearched(true);
    setShowCreateValidation(false);
    setIsLoadingPatients(true);

    try {
      const treatmentYearMonth = formData.appointmentDate
        ? formData.appointmentDate.slice(0, 7).replace(/-/g, "")
        : "";
      const treatmentType = formData.treatmentType === "입원" ? "1" : "2";
      const claimClassification = getClaimClassificationCode(formData.claimType);
      const nextOrderResponse = await ClaimsService.getNextOrder({
        treatmentYearMonth,
        formNumber: formData.formNumber,
        treatmentType,
        claimClassification,
      });
      const nextOrder = extractNextOrder(nextOrderResponse);
      setFormData((prev) => ({ ...prev, round: `${nextOrder}차` }));

      const patientResponse = await ClaimsService.getCandidatePatients({
        treatmentYearMonth,
        formNumber: formData.formNumber,
        treatmentType,
        claimClassification,
        excludeClaimed,
        keyword: searchTerm || undefined,
      });

      const candidateRows: CandidatePatientRow[] = (patientResponse?.data ?? []).map(
        (row: any) => ({
          id: String(row.id),
          patientPk: Number(row.patientPk),
          patientId: row.patientId,
          patientName: row.patientName,
          birthDate: row.birthDate,
          gender: row.gender,
          treatmentDate: row.treatmentDate,
          lastModified: row.lastModified,
          additionalClaimCount: row.additionalClaimCount ?? 0,
        }),
      );
      setPatients(candidateRows);
      setSelectedPatients(new Set());
    } catch {
      setFormData((prev) => ({ ...prev, round: "1차" }));
      setPatients([]);
    }
    setIsLoadingPatients(false);
  };

  // ── 생성 핸들러 ─────────────────────────
  const handleCreate = async () => {
    if (submitting) return;
    if (!hasSearched) {
      setShowCreateValidation(true);
      return;
    }
    if (selectedPatients.size === 0) {
      setShowCreateValidation(true);
      return;
    }

    setSubmitting(true);
    setShowCreateValidation(false);

    const claimClassificationCode = getClaimClassificationCode(formData.claimType);

    const treatmentYearMonth = formData.appointmentDate
      ? formData.appointmentDate.slice(0, 7).replace(/-/g, "")
      : "";

    const treatType = formData.treatmentType === "입원" ? "1" : "2";

    const payload = {
      formNumber: formData.formNumber,
      claimClassification: claimClassificationCode,
      treatmentType: treatType,
      treatmentYearMonth,
      claimOrder: formData.round.replace("차", "") || "1",
      patientIds: Array.from(selectedPatients)
        .map((id) => patients.find((patient) => patient.id === id)?.patientPk)
        .filter((id): id is number => typeof id === "number"),
      additionalOrderIdsByPatient: Object.fromEntries(
        Object.entries(additionalItemsMap).map(([patientId, itemSet]) => [
          String(patients.find((patient) => patient.id === patientId)?.patientPk ?? patientId),
          Array.from(itemSet),
        ]),
      ),
    };

    try {
      await ClaimsService.generateClaim(payload);
      onCreated?.();
      onOpenChange(false);
    } catch {
      alert("청구 생성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── 모달 닫힐 때 리셋 ─────────────────────────
  useEffect(() => {
    if (!open) {
      setHasSearched(false);
      setPatients([]);
      setSelectedPatients(new Set());
      setSearchTerm("");
      setIsLoadingPatients(false);
      setAdditionalItemsMap({});
      setAdditionalItemsTargetPatient(null);
      setShowCreateValidation(false);
    }
  }, [open]);

  return (
  <>
    <MyPopup
      isOpen={open}
      onCloseAction={() => onOpenChange(false)}
      width="1000px"
      height="800px"
      title="명세서 생성"
      className="!border-0"
    >
      <div className="flex flex-col flex-1 min-h-0">
        {/* ── 조건 선택 영역 ── */}
        <div className="px-5 pt-4 pb-3 space-y-3">
          {/* 필터 카드 */}
          <div className="bg-[var(--bg-1)] rounded-[6px] p-3 flex items-center justify-between">
            <div className="flex gap-10 items-center">
              {/* 예약일 */}
              <div className="flex items-center gap-3 relative">
                <span className="text-[12px] font-bold text-[var(--gray-300)]">
                  예약일
                </span>
                <button
                  ref={buttonRef}
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className="h-8 w-[130px] text-[13px] border border-[var(--border-2)] rounded-[6px] px-2 bg-[var(--bg-main)] hover:bg-[var(--bg-1)] flex items-center justify-between transition-colors"
                >
                  <span className="text-[var(--gray-200)]">
                    {formData.appointmentDate || "년월 선택"}
                  </span>
                  <CalendarIcon className="w-3.5 h-3.5 text-[var(--gray-400)]" />
                </button>
                {isCalendarOpen && (
                  <div
                    ref={calendarRef}
                    className="absolute top-full left-0 mt-1 bg-[var(--bg-main)] border border-[var(--border-1)] rounded-md shadow-lg z-50"
                    style={{ left: "80px" }}
                  >
                    <div className="relative w-80">
                      <Calendar
                        onChange={(value: any) => {
                          if (value instanceof Date) {
                            const year = value.getFullYear();
                            const month = String(value.getMonth() + 1).padStart(2, "0");
                            const nextFormData: FormDataState = {
                              ...formData,
                              appointmentDate: `${year}-${month}`,
                            };

                            setFormData(nextFormData);
                            void loadNextOrder(nextFormData);
                            setIsCalendarOpen(false);
                          }
                        }}
                        value={
                          formData.appointmentDate
                            ? new Date(`${formData.appointmentDate}-01`)
                            : null
                        }
                        locale="ko-KR"
                        calendarType="gregory"
                        minDetail="year"
                        maxDetail="year"
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
                            const nextFormData: FormDataState = {
                              ...formData,
                              appointmentDate: getCurrentYearMonth(),
                            };

                            setFormData(nextFormData);
                            void loadNextOrder(nextFormData);
                            setIsCalendarOpen(false);
                          }}
                          className="w-full py-2 text-sm text-[var(--gray-200)] border border-[var(--border-1)] hover:bg-[var(--bg-hover)] rounded transition-colors font-medium"
                        >
                          이번 달
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 보험구분 */}
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-[var(--gray-300)]">
                  보험구분
                </span>
                <RadioGroup
                  value={formData.insuranceType}
                  onValueChange={handleInsuranceTypeChange}
                  className="flex gap-2 items-center h-8"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="건강보험" id="insurance-health" />
                    <label
                      htmlFor="insurance-health"
                      className="text-[13px] text-[var(--gray-300)] cursor-pointer"
                    >
                      건강보험
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="의료급여" id="insurance-medical" />
                    <label
                      htmlFor="insurance-medical"
                      className="text-[13px] text-[var(--gray-300)] cursor-pointer"
                    >
                      의료급여
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* 청구구분 */}
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-[var(--gray-300)]">
                  청구구분
                </span>
                <RadioGroup
                  value={formData.claimType}
                  onValueChange={handleClaimTypeChange}
                  className="flex gap-2 items-center h-8"
                >
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="원청구" id="claim-original" />
                    <label
                      htmlFor="claim-original"
                      className="text-[13px] text-[var(--gray-300)] cursor-pointer"
                    >
                      원청구
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="보완청구" id="claim-supplement" />
                    <label
                      htmlFor="claim-supplement"
                      className="text-[13px] text-[var(--gray-300)] cursor-pointer"
                    >
                      보완청구
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="추가청구" id="claim-additional" />
                    <label
                      htmlFor="claim-additional"
                      className="text-[13px] text-[var(--gray-300)] cursor-pointer"
                    >
                      추가청구
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* 차수 */}
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-bold text-[var(--gray-300)]">
                  차수
                </span>
                <span className="text-[13px] text-[var(--gray-500)]">
                  {formData.round}
                </span>
              </div>
            </div>

            {/* 조회 버튼 */}
            <Button
              className="bg-[var(--main-color)] hover:bg-[var(--main-color-hover)] text-white text-[13px] font-medium h-8 px-4 rounded-[4px]"
              onClick={handleSearch}
              disabled={!formData.appointmentDate}
            >
              {isLoadingPatients ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "조회"
              )}
            </Button>
          </div>

          {/* 에러/안내 메시지 */}
          {!hasSearched && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-[var(--negative)]" />
              <span className="text-[13px] text-[var(--negative)]">
                생성조건을 선택 후 조회를 눌러주세요
              </span>
            </div>
          )}

          {/* 대상환자 목록 헤더 */}
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold text-[var(--gray-100)]">
              대상환자 목록
            </span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[13px] text-[var(--gray-300)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={excludeClaimed}
                  onChange={(e) => setExcludeClaimed(e.target.checked)}
                  className="rounded border-[var(--border-2)]"
                />
                이미 청구한 진료기록 제외
              </label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-500)]" />
                <Input
                  placeholder="환자 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-[300px] pl-8 text-[13px] border-[var(--border-2)] rounded-[6px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 환자 테이블 ── */}
        <div className="flex-1 overflow-auto mx-5 mb-3 rounded-[6px]">
          <Table className="[&_tr]:border-0 [&_thead]:border-0 [&_th]:border-0 [&_tbody]:border-0 [&_th]:align-middle [&_td]:align-middle">
            <TableHeader className="!border-0">
              <TableRow className="bg-[var(--bg-2)] hover:bg-[var(--bg-2)] !border-b-0">
                <TableHead className="w-10 text-center h-[28px] py-0 rounded-tl-[6px]">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-[var(--border-2)]"
                  />
                </TableHead>
                <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                  차트번호
                </TableHead>
                <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                  환자명
                </TableHead>
                <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                  생년월일
                </TableHead>
                <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                  성별
                </TableHead>
                <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                  진료일
                </TableHead>
                <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0">
                  최종수정일
                </TableHead>
                <TableHead className="text-center text-[12px] font-medium text-[var(--gray-200)] h-[28px] py-0 rounded-tr-[6px]">
                  추가항목 건수
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!hasSearched ? (
                <TableRow className="border-b-0">
                  <TableCell
                    colSpan={8}
                    className="text-center py-20 text-[14px] text-[var(--gray-500)] rounded-b-[6px]"
                  >
                    검색된 환자가 없습니다.
                  </TableCell>
                </TableRow>
              ) : isLoadingPatients ? (
                <TableRow className="border-b-0">
                  <TableCell colSpan={8} className="text-center py-8 rounded-b-[6px]">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--gray-400)]" />
                      <span className="text-[13px] text-[var(--gray-400)]">
                        데이터를 불러오는 중...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-20 text-[14px] text-[var(--gray-500)] rounded-b-[6px]"
                  >
                    검색된 환자가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((row, index) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-[var(--bg-1)] h-[28px] border-b-0"
                  >
                    <TableCell className={`text-center py-0 ${index === filteredPatients.length - 1 ? 'rounded-bl-[6px]' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedPatients.has(row.id)}
                        onChange={(e) =>
                          handleSelectOne(row.id, e.target.checked)
                        }
                        className="rounded border-[var(--border-2)]"
                      />
                    </TableCell>
                    <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                      {row.patientId}
                    </TableCell>
                    <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                      {row.patientName}
                    </TableCell>
                    <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                      {row.birthDate}
                    </TableCell>
                    <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                      {row.gender}
                    </TableCell>
                    <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                      {row.treatmentDate}
                    </TableCell>
                    <TableCell className="text-center text-[13px] text-[var(--gray-200)] py-0">
                      {row.lastModified?.slice(0, 10) ?? "-"}
                    </TableCell>
                    <TableCell className={`text-center text-[13px] text-[var(--gray-200)] py-0 ${index === filteredPatients.length - 1 ? 'rounded-br-[6px]' : ''}`}>
                      {isAdditionalClaim && additionalItemsMap[row.id]
                        ? `${additionalItemsMap[row.id]?.size}건`
                        : row.additionalClaimCount
                          ? `${row.additionalClaimCount}건`
                          : ""}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── 하단 버튼 ── */}
        <div className="flex items-center justify-end gap-2 px-6 py-4">
          {showCreateValidation && (
            <div className="mr-auto flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-[var(--negative)]" />
              <span className="text-[13px] text-[var(--negative)]">
                조회 후 생성할 환자를 선택해 주세요.
              </span>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-[13px] px-4 border-[var(--border-2)] rounded-[4px]"
          >
            취소
          </Button>
          <Button
            onClick={handleCreate}
            disabled={submitting}
            className="bg-[var(--main-color)] hover:bg-[var(--main-color-hover)] text-white text-[13px] font-medium h-8 px-4 rounded-[4px]"
          >
            {submitting ? "생성 중..." : "생성"}
          </Button>
        </div>
      </div>
    </MyPopup>

    {/* ── 추가청구 항목 선택 팝업 (부모 MyPopup 바깥에서 렌더링) ── */}
    <AdditionalClaimItemsModal
      open={isAdditionalItemsOpen}
      onOpenChange={setIsAdditionalItemsOpen}
      patient={additionalItemsTargetPatient}
      queryParams={{
        treatmentYearMonth: formData.appointmentDate
          ? formData.appointmentDate.slice(0, 7).replace(/-/g, "")
          : "",
        formNumber: formData.formNumber,
        treatmentType: formData.treatmentType === "입원" ? "1" : "2",
        claimClassification: getClaimClassificationCode(formData.claimType),
      }}
      onConfirm={handleAdditionalItemsConfirm}
    />
  </>
  );
};

export default ClaimsCreateModal;
