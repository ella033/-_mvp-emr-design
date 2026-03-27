"use client";

import React, { useEffect, useMemo, useState } from "react";
import { getGender, makeRrnView } from "@/lib/patient-utils";
import { useExternalLabOrdersStore } from "@/store/external-lab-orders-store";

// specimenDetail 우선, 없으면 spcName 폴백
function getSpecimenName(exam: any): string {
  const specimenDetail = exam?.order?.specimenDetail;
  if (Array.isArray(specimenDetail) && specimenDetail.length > 0) {
    return specimenDetail.map((s: { name: string }) => s.name).join(", ");
  }
  return exam?.rawData?.examination?.spcName || "";
}

type SortColumn = "userCode" | "cgcode" | "examCode" | "examName" | "specimen" | "result" | "unit" | "reference" | "receivedDate" | null;
type SortDirection = "asc" | "desc";

type ColumnKey = "userCode" | "cgcode" | "examCode" | "examName" | "specimen" | "result" | "unit" | "reference" | "receivedDate";

interface ColumnDefinition {
  key: ColumnKey;
  label: string;
  width: string;
  alwaysVisible?: boolean;
}

// 미전송일 때 사용하는 컬럼 정의
const pendingColumnDefinitions: ColumnDefinition[] = [
  { key: "userCode", label: "사용자코드", width: "w-[100px]" },
  { key: "cgcode", label: "청구코드", width: "w-[100px]" },
  { key: "examCode", label: "표준코드", width: "w-[120px]" },
  { key: "examName", label: "검사명", width: "flex-1" },
  { key: "specimen", label: "검체", width: "w-[120px]" },
];

// 전송완료일 때 사용하는 컬럼 정의
const sentColumnDefinitions: ColumnDefinition[] = [
  { key: "userCode", label: "사용자코드", width: "w-[86px]" },
  { key: "cgcode", label: "청구코드", width: "w-[86px]" },
  { key: "examCode", label: "표준코드", width: "w-[100px]" },
  { key: "examName", label: "검사명", width: "w-[160px]" },
  { key: "specimen", label: "검체", width: "w-[90px]" },
  { key: "result", label: "검사결과", width: "w-[80px]" },
  { key: "unit", label: "단위", width: "w-[70px]" },
  { key: "reference", label: "참조치", width: "flex-1" },
  { key: "receivedDate", label: "결과수신일시", width: "flex-1" },
];

const mapOrderStatusToDetailStatus = (
  examinationStatus: string | undefined,
  transmissionStatus: string | undefined
): "waiting" | "cancelled" | "failed" | "completed" => {
  // 1. 전송 실패/취소 체크
  if (transmissionStatus === "FAILED") {
    return "failed";
  }
  if (transmissionStatus === "CANCELLED") {
    return "cancelled";
  }

  // 2. 내부 검사 상태가 COMPLETED면 완료
  if (examinationStatus === "COMPLETED") {
    return "completed";
  }

  // 3. 그 외에는 (전송완료, 수신완료 등 포함) 아직 결과 처리가 안된 것이므로 대기
  return "waiting";
};

const getStatusBadge = (
  status: "waiting" | "cancelled" | "failed" | "completed"
) => {
  const statusConfig = {
    waiting: {
      label: "결과대기",
      bgColor: "bg-[var(--blue-1)]",
      textColor: "text-[var(--blue-2)]",
      dotColor: "bg-[var(--blue-2)]",
      icon: null,
    },
    cancelled: {
      label: "전송취소",
      bgColor: "bg-[var(--bg-3)]",
      textColor: "text-[var(--gray-400)]",
      dotColor: "bg-[var(--gray-400)]",
      icon: null,
    },
    failed: {
      label: "전송실패",
      bgColor: "bg-[var(--red-1)]",
      textColor: "text-[var(--negative)]",
      dotColor: "bg-[var(--negative)]",
      icon: null,
    },
    completed: {
      label: "결과완료",
      bgColor: "bg-[var(--green-1)]",
      textColor: "text-[var(--positive)]",
      dotColor: "bg-[var(--positive)]",
      icon: (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.6667 3.5L5.25 9.91667L2.33334 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  };

  const config = statusConfig[status];
  return (
    <div
      className={`inline-flex items-center gap-[6px] pl-[4px] pr-[6px] py-[2.5px] rounded-full ${config.bgColor}`}
    >
      {config.icon && (
        <div className={`${config.textColor} flex items-center justify-center`}>
          {config.icon}
        </div>
      )}
      <span className={`text-[12px] font-medium ${config.textColor} leading-[1.25] tracking-[-0.12px]`}>
        {config.label}
      </span>
    </div>
  );
};

/**
 * Examination Result Detail Component
 *
 * 역할:
 * - 수신결과 및 상세화면 표시
 * - 환자 리스트에서 선택한 항목의 상세 정보 표시
 */
export default function ExaminationResultDetail() {
  const { selectedOrder } = useExternalLabOrdersStore();
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);

  // 전송 상태 확인 (SENT 또는 RECEIVED면 전송완료)
  const isTransmitted = useMemo(() => {
    if (!selectedOrder) return false;
    const status = selectedOrder.status;
    return status === "SENT" || status === "RECEIVED" || status === "COMPLETED";
  }, [selectedOrder]);

  // 전송 상태에 따라 컬럼 정의 선택
  const columnDefinitions = useMemo(() => {
    return isTransmitted ? sentColumnDefinitions : pendingColumnDefinitions;
  }, [isTransmitted]);

  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(columnDefinitions.map((col) => col.key))
  );

  // 컬럼 정의가 변경되면 visibleColumns 업데이트
  useEffect(() => {
    setVisibleColumns(new Set(columnDefinitions.map((col) => col.key)));
    setSortColumn(null);
  }, [columnDefinitions]);

  const headerInfo = useMemo(() => {
    if (!selectedOrder) {
      return null;
    }

    // 나이 계산 (birthDate 형식: "19221111")
    let ageLabel = "";
    if (selectedOrder.patient?.birthDate) {
      const birthDateStr = selectedOrder.patient.birthDate;
      if (birthDateStr.length === 8) {
        const year = parseInt(birthDateStr.substring(0, 4));
        const month = parseInt(birthDateStr.substring(4, 6));
        const day = parseInt(birthDateStr.substring(6, 8));
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        if (
          today.getMonth() < birthDate.getMonth() ||
          (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        ageLabel = `${age}`;
      }
    }

    const genderLabel = getGender(
      selectedOrder.patient?.gender === 1 ? 1 : selectedOrder.patient?.gender === 2 ? 2 : null,
      "ko"
    );

    const resolvedPatientNo =
      selectedOrder.patient?.patientNo ??
      (selectedOrder.exams?.[0] as any)?.order?.encounter?.patient?.patientNo ??
      null;
    const chartNumber = resolvedPatientNo != null ? String(resolvedPatientNo) : "-";

    const maskedRrn = selectedOrder.patient?.rrn ? makeRrnView(selectedOrder.patient.rrn) : "";

    // 검사 상태 (encounter.registration.examination.status)
    const examinationStatus = selectedOrder.encounter?.registration?.patientRoute?.examination?.status;

    // 전송 상태 (order.status 값 그대로 사용)
    const transmissionStatus = selectedOrder.status || "PENDING";

    // exams의 status 배열 추출
    const examStatuses = selectedOrder.exams.map(exam => (exam as any).status || "").filter(Boolean);

    const status = mapOrderStatusToDetailStatus(
      examinationStatus,
      transmissionStatus
    );

    // 검사구분: rawData.serviceType이 0이면 "일반", 0이 아니면 "검진"
    const examinationType = selectedOrder.rawData?.serviceType === 0 ? "일반" : "검진";

    return {
      patientName: selectedOrder.patientName ?? "이름 없음",
      ageLabel,
      genderLabel,
      chartNumber,
      residentNumber: maskedRrn,
      examinationType,
      status,
      totalExams: selectedOrder.exams.length,
    };
  }, [selectedOrder]);

  // responseData에서 결과값 추출하는 헬퍼 함수
  const extractResultData = (exam: any) => {
    const responseData = exam.responseData;
    if (!responseData || !responseData.subsets) {
      return null;
    }

    const results: Array<{
      value: string;
      unit: string;
      reference: string;
      examDate: string;
      isMultiLine?: boolean;
      isButton?: boolean;
      buttonLabel?: string;
    }> = [];

    responseData.subsets.forEach((subset: any) => {
      if (subset.results) {
        subset.results.forEach((result: any) => {
          if (result.data && result.data.length > 0) {
            result.data.forEach((dataItem: any) => {
              results.push({
                value: dataItem.value || "",
                unit: result.unit || "",
                reference: dataItem.refVal || "",
                examDate: result.examDate || "",
                isMultiLine: false,
              });
            });
          } else {
            // 데이터가 없으면 버튼으로 표시
            results.push({
              value: "",
              unit: "",
              reference: "",
              examDate: result.examDate || "",
              isButton: true,
              buttonLabel: "별지참조",
            });
          }
        });
      }
    });

    return results.length > 0 ? results : null;
  };

  const sortedExams = useMemo(() => {
    if (!selectedOrder || !sortColumn) {
      return selectedOrder?.exams || [];
    }

    const exams = [...selectedOrder.exams];

    exams.sort((a, b) => {
      let aValue: string = "";
      let bValue: string = "";

      switch (sortColumn) {
        case "userCode":
          aValue = (a as any).order?.userCode || "";
          bValue = (b as any).order?.userCode || "";
          break;
        case "cgcode":
          aValue = a?.cgcode ?? "";
          bValue = b?.cgcode ?? "";
          break;
        case "examCode":
          aValue = a?.stdCode || a.trcode || "";
          bValue = b?.stdCode || b.trcode || "";
          break;
        case "examName": {
          aValue = (a as any).order?.name || a.stdCodeName || "";
          bValue = (b as any).order?.name || b.stdCodeName || "";
          break;
        }
        case "specimen": {
          aValue = getSpecimenName(a);
          bValue = getSpecimenName(b);
          break;
        }
        case "result": {
          const aResults = extractResultData(a);
          const bResults = extractResultData(b);
          aValue = aResults && aResults[0] ? aResults[0].value : "";
          bValue = bResults && bResults[0] ? bResults[0].value : "";
          break;
        }
        case "unit": {
          const aResults = extractResultData(a);
          const bResults = extractResultData(b);
          aValue = aResults && aResults[0] ? aResults[0].unit : "";
          bValue = bResults && bResults[0] ? bResults[0].unit : "";
          break;
        }
        case "reference": {
          const aResults = extractResultData(a);
          const bResults = extractResultData(b);
          aValue = aResults && aResults[0] ? aResults[0].reference : "";
          bValue = bResults && bResults[0] ? bResults[0].reference : "";
          break;
        }
        case "receivedDate": {
          const aResults = extractResultData(a);
          const bResults = extractResultData(b);
          aValue = aResults && aResults[0] ? aResults[0].examDate : "";
          bValue = bResults && bResults[0] ? bResults[0].examDate : "";
          break;
        }
      }

      const comparison = aValue.localeCompare(bValue, "ko", { numeric: true });
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return exams;
  }, [selectedOrder, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleColumnToggle = (columnKey: ColumnKey, checked: boolean) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(columnKey);
      } else {
        next.delete(columnKey);
      }
      return next;
    });
  };

  const visibleColumnDefinitions = useMemo(() => {
    return columnDefinitions.filter((col) => visibleColumns.has(col.key));
  }, [visibleColumns]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isColumnModalOpen && !target.closest('.column-dropdown-container')) {
        setIsColumnModalOpen(false);
      }
    };

    if (isColumnModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColumnModalOpen]);

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 10.1133L7.99995 12.9992L10.9999 10.1133"
            stroke="#46474C"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11 5.88574L8.00005 2.99987L5.00011 5.88574"
            stroke="#46474C"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }

    if (sortDirection === "asc") {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 5.88574L8.00005 2.99987L5.00011 5.88574"
            stroke="#2563eb"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 10.1133L7.99995 12.9992L10.9999 10.1133"
            stroke="#9CA3AF"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    } else {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M5 10.1133L7.99995 12.9992L10.9999 10.1133"
            stroke="#2563eb"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11 5.88574L8.00005 2.99987L5.00011 5.88574"
            stroke="#9CA3AF"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
  };

  if (!selectedOrder || !headerInfo) {
    return (
      <div className="w-full h-full flex flex-col bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <p>환자 리스트에서 항목을 선택하면 상세 정보가 표시됩니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full p-2 flex flex-col bg-white rounded-md border-r border-gray-200 shadow-sm overflow-hidden"
      data-testid="external-lab-result-detail"
    >
      <div className="flex-1 flex flex-col bg-white rounded-md border border-gray-200 overflow-hidden">
        {/* 헤더: 환자 정보 */}
        <div className="h-9 px-3 py-[10px] bg-[var(--bg-1)] rounded-tl-md rounded-tr-md flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-[4px]">
            {/* 차트번호 배지 */}
            <span className="flex items-center justify-center border border-[var(--border-2)] text-[var(--gray-200)] bg-[var(--bg-main)] text-[12px] rounded-[4px] px-[6px] py-[2px] font-bold leading-none">
              {headerInfo.chartNumber}
            </span>
            {/* 환자 이름 */}
            <span className="text-[14px] font-bold text-[#171719] leading-[1.25] tracking-[-0.14px]">
              {headerInfo.patientName}
            </span>
            {/* 나이/성별 */}
            {headerInfo.ageLabel && headerInfo.genderLabel && (
              <span className="text-[12px] font-bold text-[#46474C] leading-[1.25] tracking-[-0.12px]">
                ({headerInfo.genderLabel}/{headerInfo.ageLabel})
              </span>
            )}

            {/* 주민등록번호 */}
            {headerInfo.residentNumber && (
              <span className="text-[12px] font-medium text-[#70737C] leading-[1.25] tracking-[-0.12px]">
                {headerInfo.residentNumber}
              </span>
            )}
            {/* 검사구분 배지 */}
            <span className="px-[4px] py-0 bg-white rounded-[4px] border border-[var(--border-1)] text-[11px] font-bold text-[#70737C] leading-[1.25] tracking-[-0.11px] text-center">
              {headerInfo.examinationType}
            </span>
          </div>
          <div className="w-[90px]">
            {getStatusBadge(headerInfo.status)}
          </div>
        </div>

        {/* 검사 목록 */}
        <div className="flex-1 p-4 flex flex-col gap-2 overflow-hidden">
          {/* 검사 목록 헤더 */}
          <div className="h-6 flex items-center justify-between relative">
            <div className="flex-1">
              <span className="text-sm text-[#292A2D]">총 </span>
              <span className="text-sm font-bold text-[#292A2D]">
                {headerInfo.totalExams}
              </span>
              <span className="text-sm text-[#292A2D]">건</span>
            </div>
            <div className="relative column-dropdown-container">
              <button
                onClick={() => setIsColumnModalOpen(!isColumnModalOpen)}
                className="w-4 h-4 flex items-center justify-center hover:bg-gray-100 rounded"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 4.5H12.3333"
                    stroke="#46474C"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.33337 8H10"
                    stroke="#46474C"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M4.16675 11.5H11.1667"
                    stroke="#46474C"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* 드롭다운 메뉴 */}
              {isColumnModalOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-50 min-w-[200px] max-h-[400px] overflow-y-auto">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-[#292A2D]">컬럼 선택</h3>
                  </div>
                  <div className="py-1">
                    {columnDefinitions.map((colDef) => (
                      <label
                        key={colDef.key}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(colDef.key)}
                          onChange={(e) => handleColumnToggle(colDef.key, e.target.checked)}
                          disabled={colDef.alwaysVisible}
                          className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm text-[#292A2D]">
                          {colDef.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 검사 항목 테이블 */}
          <div className="flex-1 rounded-md border border-gray-200 overflow-hidden flex flex-col">
            {/* 테이블 헤더 */}
            <div className="flex border-b border-gray-200">
              {visibleColumnDefinitions.map((colDef, index) => {
                const isLast = index === visibleColumnDefinitions.length - 1;
                const borderClass = isLast ? "" : "border-r border-gray-200";
                const roundedClass = isLast ? "rounded-br-md" : "";

                return (
                  <button
                    key={colDef.key}
                    onClick={() => handleSort(colDef.key)}
                    className={`${colDef.width} px-2 py-[6.5px] bg-gray-50 flex items-center justify-center gap-1 ${borderClass} ${roundedClass} hover:bg-gray-100 cursor-pointer transition-colors`}
                  >
                    <span className="text-xs font-medium text-[#292A2D]">{colDef.label}</span>
                    {getSortIcon(colDef.key)}
                  </button>
                );
              })}
            </div>

            {/* 테이블 바디 */}
            <div className="flex-1 overflow-auto">
              {sortedExams.map((exam) => {
                const examination = exam.rawData?.examination;

                // 전송완료 상태일 때만 responseData 처리
                if (isTransmitted) {
                  const resultData = extractResultData(exam);
                  const hasResults = resultData && resultData.length > 0;

                  // 결과가 없으면 한 행만 표시
                  if (!hasResults) {
                    return (
                      <div key={exam.id} className="flex flex-col">
                        <div className="flex border-b border-gray-200">
                          {visibleColumnDefinitions.map((colDef, index) => {
                            const isLast = index === visibleColumnDefinitions.length - 1;
                            const borderClass = isLast ? "" : "border-r border-gray-200";

                            const getCellContent = (key: ColumnKey) => {
                              switch (key) {
                                case "userCode":
                                  return <span className="text-[13px] text-[#46474C]">{(exam as any).order?.userCode || "-"}</span>;
                                case "cgcode":
                                  return <span className="text-[13px] text-[#46474C] text-center">{exam?.cgcode ?? "-"}</span>;
                                case "examCode":
                                  return <span className="text-[13px] text-[#46474C] text-center">{exam?.stdCode || exam.trcode || "-"}</span>;
                                case "examName":
                                  return <span className="text-[13px] text-[#46474C] text-center">{(exam as any).order?.name || exam.stdCodeName || examination?.name || "-"}</span>;
                                case "specimen":
                                  return <span className="text-[13px] text-[#46474C] text-center">{getSpecimenName(exam) || "-"}</span>;
                                case "result":
                                  if ((exam as any).responseData) {
                                    return (
                                      <div className="flex items-center justify-center">
                                        <button className="px-[6px] py-[4px] bg-[var(--bg-3)] rounded-[4px] text-[12px] text-[var(--primary)]">
                                          결과 보기
                                        </button>
                                      </div>
                                    );
                                  }
                                  return <span className="text-[13px] text-[#46474C] text-center">-</span>;
                                case "unit":
                                  return <span className="text-[13px] text-[#46474C] text-center">-</span>;
                                case "reference":
                                  return <span className="text-[13px] text-[#46474C] text-center">-</span>;
                                case "receivedDate":
                                  return <span className="text-[13px] text-[#46474C] text-center">-</span>;
                                default:
                                  return <span className="text-[13px] text-[#46474C] text-center">-</span>;
                              }
                            };

                            return (
                              <div
                                key={colDef.key}
                                className={`${colDef.width} px-2 py-[6px] bg-white flex items-center justify-center ${borderClass}`}
                              >
                                {getCellContent(colDef.key)}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // 결과가 있으면 각 결과마다 행 표시
                  return resultData!.map((result, resultIndex) => (
                    <div key={`${exam.id}-${resultIndex}`} className="flex flex-col">
                      <div className="flex border-b border-gray-200">
                        {visibleColumnDefinitions.map((colDef, index) => {
                          const isLast = index === visibleColumnDefinitions.length - 1;
                          const borderClass = isLast ? "" : "border-r border-gray-200";

                          const getCellContent = (key: ColumnKey) => {
                            switch (key) {
                              case "userCode":
                                return resultIndex === 0 ? (
                                  <span className="text-[13px] text-[#46474C]">{(exam as any).order?.userCode || "-"}</span>
                                ) : null;
                              case "cgcode":
                                return resultIndex === 0 ? (
                                  <span className="text-[13px] text-[#46474C] text-center">{exam?.cgcode ?? "-"}</span>
                                ) : null;
                              case "examCode":
                                return resultIndex === 0 ? (
                                  <span className="text-[13px] text-[#46474C] text-center">{exam?.stdCode || exam.trcode || "-"}</span>
                                ) : null;
                              case "examName":
                                return resultIndex === 0 ? (
                                  <span className="text-[13px] text-[#46474C] text-center">{(exam as any).order?.name || exam.stdCodeName || examination?.name || "-"}</span>
                                ) : null;
                              case "specimen":
                                return resultIndex === 0 ? (
                                  <span className="text-[13px] text-[#46474C] text-center">{getSpecimenName(exam) || "-"}</span>
                                ) : null;
                              case "result":
                                if (result.isButton) {
                                  return (
                                    <div className="flex items-center justify-center">
                                      <button className="px-[6px] py-[4px] bg-[var(--bg-3)] rounded-[4px] text-[12px] text-[var(--primary)]">
                                        {result.buttonLabel || "별지참조"}
                                      </button>
                                    </div>
                                  );
                                }
                                // 참조치와 비교하여 색상 결정
                                const refVal = result.reference;
                                let resultColor = "text-[#46474C]";
                                if (refVal && result.value) {
                                  const refMatch = refVal.match(/([\d.]+)\s*-\s*([\d.]+)/);
                                  if (refMatch && refMatch[1] && refMatch[2]) {
                                    const min = parseFloat(refMatch[1]);
                                    const max = parseFloat(refMatch[2]);
                                    const value = parseFloat(result.value);
                                    if (!isNaN(value) && !isNaN(min) && !isNaN(max)) {
                                      if (value < min) {
                                        resultColor = "text-[var(--status-info)] font-bold"; // 파란색 (낮음)
                                      } else if (value > max) {
                                        resultColor = "text-[var(--negative)] font-bold"; // 빨간색 (높음)
                                      }
                                    }
                                  }
                                }
                                // 여러 줄 결과 처리
                                if (result.value.includes("\n") || result.value.length > 20) {
                                  return (
                                    <div className="text-[13px] text-[#46474C] text-center whitespace-pre-line">
                                      {result.value.split("\n").map((line, i) => (
                                        <p key={i} className="mb-0">{line}</p>
                                      ))}
                                    </div>
                                  );
                                }
                                return <span className={`text-[13px] ${resultColor} text-center`}>{result.value || "-"}</span>;
                              case "unit":
                                return <span className="text-[13px] text-[#46474C] text-center">{result.unit || "-"}</span>;
                              case "reference":
                                return (
                                  <span className="text-[13px] text-[#46474C] text-center whitespace-pre-line">
                                    {result.reference || "-"}
                                  </span>
                                );
                              case "receivedDate":
                                // 날짜 포맷팅 (2025-12-03 -> 2025-12-03 14:15)
                                const dateStr = result.examDate || "";
                                const formattedDate = dateStr ? `${dateStr} 14:15` : "-";
                                return <span className="text-[13px] text-[#46474C] text-center">{formattedDate}</span>;
                              default:
                                return <span className="text-[13px] text-[#46474C] text-center">-</span>;
                            }
                          };

                          return (
                            <div
                              key={colDef.key}
                              className={`${colDef.width} px-2 py-[6px] bg-white flex items-center justify-center ${borderClass}`}
                            >
                              {getCellContent(colDef.key)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                } else {
                  // 미전송 상태일 때 기존 컬럼 표시
                  return (
                    <div key={exam.id} className="flex flex-col">
                      <div className="flex border-b border-gray-200">
                        {visibleColumnDefinitions.map((colDef, index) => {
                          const isLast = index === visibleColumnDefinitions.length - 1;
                          const borderClass = isLast ? "" : "border-r border-gray-200";

                          const getCellValue = (key: ColumnKey): string => {
                            switch (key) {
                              case "userCode":
                                return (exam as any).order?.userCode || "-";
                              case "cgcode":
                                return exam?.cgcode ?? "-";
                              case "examCode":
                                return exam?.stdCode || exam.trcode || "-";
                              case "examName":
                                return (exam as any).order?.name || exam.stdCodeName || examination?.name || "-";
                              case "specimen":
                                return getSpecimenName(exam) || "-";
                              default:
                                return "-";
                            }
                          };

                          return (
                            <div
                              key={colDef.key}
                              className={`${colDef.width} px-2 py-1.5 bg-white flex items-center justify-center ${borderClass}`}
                            >
                              <span className="text-[13px] text-[#46474C]">
                                {getCellValue(colDef.key)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
