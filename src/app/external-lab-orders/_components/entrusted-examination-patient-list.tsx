"use client";

import React, { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { MyLoadingSpinner } from "@/components/yjg/my-loading-spinner";
import { getGender, makeRrnView } from "@/lib/patient-utils";
import {
  LabOrdersService,
  type ExternalLabOrder,
} from "@/services/lab-orders-service";
import { ExternalLabService } from "@/services/external-lab-service";
import type { ExternalLab } from "@/app/master-data/_components/(tabs)/(medical-examine)/(external-lab-examination)/external-lab-data-type";
import { useExternalLabOrdersStore } from "@/store/external-lab-orders-store";
import AlertModal from "@/app/claims/commons/alert-modal";
import { useToastHelpers } from "@/components/ui/toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import QuickSendMessageForm from "@/app/crm/_components/message/quick-send-message-form";
import type { QuickMessageRecipient } from "@/app/crm/_components/message/quick-message-form";
import { useQuickSendEligibility } from "@/hooks/crm/use-quick-send-eligibility";
import { usePrintPopupStore } from "@/store/print-popup-store";
import { OutputTypeCode } from "@/types/printer-types";
import { useHospitalStore } from "@/store/hospital-store";
import { usePrintersStore } from "@/store/printers-store";
import { useCreatePrintJob } from "@/components/settings/printer/hooks/use-create-print-job";
import { FileService } from "@/services/file-service";
import { generateExaminationRequestPdfWithPrintable, ExaminationRequestPrintablePages } from "../(_print_modal)/generate-examination-request-pdf-printable";
import { usePathname } from "next/navigation";
import { getMenuNameFromPath } from "@/lib/utils/menu-utils";

type TabType = "unsent" | "sent";

type PatientStatus = "waiting" | "cancelled" | "failed" | "completed";

type ColumnKey =
  | "checkbox"
  | "chartNumber"
  | "patientName"
  | "residentNumber"
  | "ageGender"
  | "examinationType"
  | "doctor"
  | "labInstitution"
  | "prescriptionTime"
  | "status"
  | "transmissionStatus"
  | "resultStatus";

const columnStyles: Record<ColumnKey, React.CSSProperties> = {
  checkbox: { flexBasis: "4.75%", maxWidth: "4.75%" },
  chartNumber: { flexBasis: "9.74%", maxWidth: "9.74%" },
  patientName: { flexBasis: "9.5%", maxWidth: "9.5%" },
  residentNumber: { flexBasis: "10.69%", maxWidth: "10.69%" },
  ageGender: { flexBasis: "6.65%", maxWidth: "6.65%" },
  examinationType: { flexBasis: "6.65%", maxWidth: "6.65%" },
  doctor: { flexBasis: "8.31%", maxWidth: "8.31%" },
  labInstitution: { flexBasis: "11.88%", maxWidth: "11.88%" },
  prescriptionTime: { flexBasis: "10.93%", maxWidth: "10.93%" },
  status: { flexBasis: "10.45%", maxWidth: "10.45%" },
  transmissionStatus: { flexBasis: "10%", maxWidth: "10%" },
  resultStatus: { flexBasis: "10%", maxWidth: "10%" },
};

interface ColumnDefinition {
  key: ColumnKey;
  label: string;
  alwaysVisible?: boolean;
}

const columnDefinitions: ColumnDefinition[] = [
  { key: "checkbox", label: "체크박스", alwaysVisible: true },
  { key: "chartNumber", label: "차트번호" },
  { key: "patientName", label: "환자명" },
  { key: "residentNumber", label: "주민등록번호" },
  { key: "ageGender", label: "나이/성별" },
  { key: "examinationType", label: "검사구분" },
  { key: "doctor", label: "진료의" },
  { key: "labInstitution", label: "수탁기관" },
  { key: "prescriptionTime", label: "처방시간" },
  { key: "status", label: "상태" },
  { key: "transmissionStatus", label: "전송 상태" },
  { key: "resultStatus", label: "결과여부" },
];

// 필터 영역 컴포넌트
interface FilterSectionProps {
  selectedDate: Date;
  onDateInputChange: (value: string) => void;
  onDateShift: (days: number) => void;
  onToday: () => void;
  selectedLab: string;
  onLabChange: (lab: string) => void;
  selectedExaminationType: string;
  onExaminationTypeChange: (type: string) => void;
  labOptions: string[];
  isFetching: boolean;
}

const FilterSection = memo(
  ({
    selectedDate,
    onDateInputChange,
    onDateShift,
    onToday,
    selectedLab,
    onLabChange,
    selectedExaminationType,
    onExaminationTypeChange,
    labOptions,
    isFetching,
  }: FilterSectionProps) => {
    const formatDateForInput = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return (
      <div className="px-4 py-3 border-b border-[var(--border-1)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* 처방일 */}
            <div className="flex items-center gap-2 whitespace-nowrap">
              <div className="text-xs font-bold text-[var(--gray-200)]">
                처방일
              </div>
              <div className="flex items-center gap-1">
                <div className="relative h-8 w-[130px]">
                  <div className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 5.25C3 4.91848 3.1317 4.60054 3.36612 4.36612C3.60054 4.1317 3.91848 4 4.25 4H11.75C12.0815 4 12.3995 4.1317 12.6339 4.36612C12.8683 4.60054 13 4.91848 13 5.25V12.75C13 13.0815 12.8683 13.3995 12.6339 13.6339C12.3995 13.8683 12.0815 14 11.75 14H4.25C3.91848 14 3.60054 13.8683 3.36612 13.6339C3.1317 13.3995 3 13.0815 3 12.75V5.25Z"
                        stroke="var(--gray-300)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 2V5.5"
                        stroke="var(--gray-300)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 2V5.5"
                        stroke="var(--gray-300)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M3 8H13"
                        stroke="var(--gray-300)"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <input
                    type="date"
                    data-testid="external-lab-date-input"
                    value={formatDateForInput(selectedDate)}
                    onChange={(e) => onDateInputChange(e.target.value)}
                    className="cursor-pointer w-full h-8 pl-8 pr-2 bg-[var(--bg-main)] rounded-md border border-[var(--border-2)] text-[13px] text-[var(--gray-100)] focus:outline-none focus:ring-2 focus:ring-[var(--main-color)]"
                  />
                </div>
                <button
                  onClick={() => onDateShift(-1)}
                  className="cursor-pointer w-8 h-8 bg-[var(--bg-main)] rounded-md border border-[var(--border-1)] flex items-center justify-center hover:bg-[var(--bg-base-hover)]"
                  disabled={isFetching}
                >
                  <ChevronLeft className="w-5 h-5 text-[var(--gray-200)]" />
                </button>
                <button
                  onClick={() => onDateShift(1)}
                  className="cursor-pointer w-8 h-8 bg-[var(--bg-main)] rounded-md border border-[var(--border-1)] flex items-center justify-center hover:bg-[var(--bg-base-hover)]"
                  disabled={isFetching}
                >
                  <ChevronRight className="w-5 h-5 text-[var(--gray-200)]" />
                </button>
                <button
                  onClick={onToday}
                  className="cursor-pointer h-8 px-2 py-2 bg-[var(--main-color)] rounded-sm flex items-center justify-center hover:bg-[var(--main-color-hover)]"
                >
                  <span className="text-[13px] font-medium text-[var(--fg-invert)]">
                    오늘
                  </span>
                </button>
              </div>
            </div>

            {/* 수탁기관 */}
            <div className="flex items-center gap-2 whitespace-nowrap">
              <div className="text-xs font-bold text-[var(--gray-100)]">
                수탁기관
              </div>
              <div className="relative w-40 h-8">
                <select
                  data-testid="external-lab-entrusted-org-filter"
                  value={selectedLab}
                  onChange={(e) => onLabChange(e.target.value)}
                  className="w-full h-8 appearance-none px-2 pr-7 bg-[var(--bg-main)] rounded-md border border-[var(--border-2)] text-[13px] text-[var(--gray-500)] focus:outline-none focus:ring-2 focus:ring-[var(--main-color)]"
                >
                  {labOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.53845 6L7.53845 10L11.5385 6"
                      stroke="var(--gray-300)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* 검사기관 */}
            <div className="flex items-center gap-2 whitespace-nowrap">
              <div className="text-xs font-bold text-[var(--gray-100)]">
                검사기관
              </div>
              <div className="relative w-40 h-8">
                <select
                  data-testid="external-lab-exam-type-filter"
                  value={selectedExaminationType}
                  onChange={(e) => onExaminationTypeChange(e.target.value)}
                  className="w-full h-8 appearance-none px-2 pr-7 bg-[var(--bg-main)] rounded-md border border-[var(--border-2)] text-[13px] text-[var(--gray-500)] focus:outline-none focus:ring-2 focus:ring-[var(--main-color)]"
                >
                  <option value="전체">전체</option>
                  <option value="일반">일반</option>
                  <option value="검진">검진</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3.53845 6L7.53845 10L11.5385 6"
                      stroke="var(--gray-300)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <button className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <MoreVertical className="w-5 h-5 text-[var(--gray-400)]" />
          </button>
        </div>
      </div>
    );
  }
);

FilterSection.displayName = "FilterSection";

// 테이블 바디 컴포넌트
interface TableBodyProps {
  rows: ExternalLabGridRow[];
  visibleColumnDefinitions: ColumnDefinition[];
  selectedRowId: string | null;
  selectedPatients: Set<string>;
  onRowClick: (rowId: string) => void;
  onSelectPatient: (id: string, checked: boolean) => void;
  onStatusClick: (row: ExternalLabGridRow) => void;
  getStatusBadge: (status?: PatientStatus) => React.ReactNode;
  getTransmissionStatusLabel: (status?: string) => string;
  getResultStatusLabel: (status?: PatientStatus) => string;
  activeTab: TabType;
}

const TableBody = memo(
  ({
    rows,
    visibleColumnDefinitions,
    selectedRowId,
    selectedPatients,
    onRowClick,
    onSelectPatient,
    onStatusClick,
    getStatusBadge,
    getTransmissionStatusLabel,
    getResultStatusLabel,
    activeTab,
  }: TableBodyProps) => {
    const getCellValue = useCallback(
      (key: ColumnKey, patient: ExternalLabGridRow): string => {
        switch (key) {
          case "chartNumber":
            return patient.chartNumber;
          case "residentNumber":
            return patient.residentNumber;
          case "ageGender":
            return patient.ageGenderLabel;
          case "examinationType":
            return patient.examinationType;
          case "doctor":
            return patient.doctor;
          case "prescriptionTime":
            return patient.prescriptionTime;
          case "resultStatus":
            return getResultStatusLabel(patient.status);
          case "transmissionStatus":
            return getTransmissionStatusLabel(patient.transmissionStatus);
          default:
            return "-";
        }
      },
      [getResultStatusLabel, getTransmissionStatusLabel]
    );

    const getTransmissionStatusBadge = useCallback(
      (status?: string): React.ReactNode => {
        // 미전송 탭에서만 FAILED/CANCELLED 표시
        if (activeTab === "unsent") {
          if (status === "FAILED") {
            return (
              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--red-1)]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="7" cy="7" r="6" fill="var(--negative)" />
                  <path
                    d="M4 4L10 10M10 4L4 10"
                    stroke="white"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-medium text-[var(--negative)] leading-none">
                  전송실패
                </span>
              </div>
            );
          }
          if (status === "CANCELLED") {
            return (
              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--red-1)]">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="7" cy="7" r="6" fill="var(--negative)" />
                  <path
                    d="M4 4L10 10M10 4L4 10"
                    stroke="white"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs font-medium text-[var(--negative)] leading-none">
                  전송취소
                </span>
              </div>
            );
          }
          // 그 외에는 빈 문자열
          return null;
        }
        // 전송완료 탭에서는 기존 로직 사용
        const label = getTransmissionStatusLabel(status);
        return label ? (
          <span className="text-[13px] text-[#46474C]">{label}</span>
        ) : null;
      },
      [activeTab, getTransmissionStatusLabel]
    );

    return (
      <div className="flex flex-col">
        {rows.map((patient, i) => {
          return (
            <div
              key={patient.id + "-" + i}
              onClick={() => onRowClick(patient.id)}
              className={`flex cursor-pointer border-b border-gray-200 hover:bg-gray-50 ${selectedRowId === patient.id ? "bg-blue-50" : "bg-white"
                }`}
            >
              {visibleColumnDefinitions.map((colDef, index) => {
                const isLast = index === visibleColumnDefinitions.length - 1;
                const borderClass = isLast ? "" : "border-r border-gray-200";

                if (colDef.key === "checkbox") {
                  return (
                    <div
                      key={colDef.key}
                      style={columnStyles[colDef.key]}
                      className={`px-2 py-1.5 flex items-center justify-center ${borderClass}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPatients.has(patient.id)}
                        onChange={(e) =>
                          onSelectPatient(patient.id, e.target.checked)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4"
                      />
                    </div>
                  );
                }

                if (colDef.key === "patientName") {
                  return (
                    <div
                      key={colDef.key}
                      style={columnStyles[colDef.key]}
                      className={`px-2 py-1.5 flex items-center justify-center ${borderClass}`}
                    >
                      {patient.isDuplicate ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded-sm text-xs font-medium text-[#171719]">
                            동명
                          </span>
                          <span className="text-[13px] text-[#46474C]">
                            {patient.patientName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-[#46474C]">
                          {patient.patientName}
                        </span>
                      )}
                    </div>
                  );
                }

                if (colDef.key === "labInstitution") {
                  return (
                    <div
                      key={colDef.key}
                      style={columnStyles[colDef.key]}
                      className={`px-2 py-1.5 flex items-center justify-center ${borderClass}`}
                    >
                      {patient.isSystemProvided === false ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded-sm text-xs font-medium text-[#171719]">
                            미연동
                          </span>
                          <span className="text-[13px] text-[#46474C]">
                            {patient.labInstitution}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-[#46474C]">
                          {patient.labInstitution}
                        </span>
                      )}
                    </div>
                  );
                }

                if (colDef.key === "status") {
                  return (
                    <div
                      key={colDef.key}
                      style={columnStyles[colDef.key]}
                      className={`px-2 py-1 flex items-center justify-center ${borderClass} cursor-pointer hover:bg-gray-100 transition-colors`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusClick(patient);
                      }}
                    >
                      {getStatusBadge(patient.status)}
                    </div>
                  );
                }

                if (colDef.key === "transmissionStatus") {
                  return (
                    <div
                      key={colDef.key}
                      style={columnStyles[colDef.key]}
                      className={`px-2 py-1.5 flex items-center justify-center ${borderClass}`}
                    >
                      {getTransmissionStatusBadge(patient.transmissionStatus)}
                    </div>
                  );
                }
                if (colDef.key === "chartNumber") {
                  return (
                    <div
                      key={colDef.key}
                      style={columnStyles[colDef.key]}
                      className={`px-2 py-1.5 flex items-center justify-center ${borderClass}`}
                    >
                      {patient.chartNumber}
                    </div>
                  );
                }

                return (
                  <div
                    key={colDef.key}
                    style={columnStyles[colDef.key]}
                    className={`px-2 py-1.5 flex items-center justify-center ${borderClass}`}
                  >
                    <span className="text-[13px] text-[#46474C]">
                      {getCellValue(colDef.key, patient)}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }
);

TableBody.displayName = "TableBody";

interface ExternalLabGridRow {
  id: string;
  patientId: number;
  registrationId?: string;
  chartNumber: string;
  patientName: string;
  rrnView: string;
  residentNumber: string;
  ageGenderLabel: string;
  examinationType: string;
  doctor: string;
  labInstitution: string;
  medicalInstitution: string;
  prescriptionTime: string;
  status: PatientStatus;
  transmissionStatus?: string;
  isDuplicate?: boolean;
  isSystemProvided?: boolean;
}

interface ExternalLabGridData {
  rows: ExternalLabGridRow[];
}

interface EntrustedExaminationPatientListProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedLab: string;
  onLabChange: (lab: string) => void;
}

/**
 * Entrusted Examination Patient List Component
 *
 * 역할:
 * - 수탁의뢰 검사 환자 목록을 표시
 * - 진료를 마치고 수탁검사 처방이 있는 환자 리스트
 * - 수탁기관에 전송 및 결과 수신 기능
 * - 검색, 필터링, 정렬 기능 제공
 */
export default function EntrustedExaminationPatientList({
  selectedDate,
  onDateChange,
  selectedLab,
  onLabChange,
}: EntrustedExaminationPatientListProps) {
  const [selectedExaminationType, setSelectedExaminationType] =
    useState<string>("전체");
  const [activeTab, setActiveTab] = useState<TabType>("unsent");
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(
    new Set()
  );
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const { setSelectedOrder } = useExternalLabOrdersStore();
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(columnDefinitions.map((col) => col.key))
  );
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [isPartialFailureModalOpen, setIsPartialFailureModalOpen] =
    useState(false);
  const [failureMessage, setFailureMessage] = useState("");
  const [partialFailureData, setPartialFailureData] = useState<{
    successCount: number;
    failCount: number;
    failedPatients: Array<{
      id: string;
      patientName: string;
      errorMessage?: string;
    }>;
  } | null>(null);
  const [sendingProgress, setSendingProgress] = useState({
    current: 0,
    total: 0,
  });
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isMessageAlertOpen, setIsMessageAlertOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [messageRecipients, setMessageRecipients] = useState<
    QuickMessageRecipient[]
  >([]);
  const { checkAndPrepareQuickSend, EligibilityAlert } =
    useQuickSendEligibility();
  const queryClient = useQueryClient();
  const toastHelpers = useToastHelpers();
  const { openPrintPopup, closePrintPopup } = usePrintPopupStore();
  const { hospital } = useHospitalStore();
  const printers = usePrintersStore((state) => state.printers);
  const createPrintJobMutation = useCreatePrintJob();
  const pathname = usePathname();
  const menuName = getMenuNameFromPath(pathname);

  // 날짜 포맷팅 함수
  const formatDateForApi = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // 수탁기관 목록 조회
  const { data: externalLabs = [] } = useQuery<ExternalLab[]>({
    queryKey: ["external-labs", "enabled"],
    queryFn: async () => {
      return await ExternalLabService.getLabs({ isEnabled: "true" });
    },
    refetchOnMount: "always",
  });

  // 선택된 수탁기관의 mappingId 찾기
  const selectedLabMappingId = useMemo(() => {
    if (selectedLab === "전체") {
      return undefined;
    }
    const lab = externalLabs.find((lab) => lab.name === selectedLab);
    return lab?.externalLabHospitalMappingId;
  }, [selectedLab, externalLabs]);

  // 처방일 포맷팅
  const treatmentDate = useMemo(
    () => formatDateForApi(selectedDate),
    [selectedDate, formatDateForApi]
  );

  // 검사기관 타입에 따른 gumjin 값 매핑
  const gumjinValue = useMemo(() => {
    if (selectedExaminationType === "일반") return "0";
    if (selectedExaminationType === "검진") return "1";
    return undefined; // 전체일 경우 undefined
  }, [selectedExaminationType]);

  // 필터 값 변경 시 선택된 주문 초기화 (체크박스는 데이터 로드 후 전체 선택됨)
  const shouldAutoSelectAllRef = useRef(true);
  useEffect(() => {
    setSelectedOrder(null);
    setSelectedRowId(null);
    shouldAutoSelectAllRef.current = true;
  }, [treatmentDate, selectedLabMappingId, gumjinValue, setSelectedOrder]);

  // 외부 검사 주문 목록 조회 (필터 조건: 처방일, 수탁기관, 검사기관, 병원)
  const {
    data: externalLabOrders = [],
    isLoading: isExternalLabOrdersLoading,
    isFetching: isExternalLabOrdersFetching,
  } = useQuery<ExternalLabOrder[]>({
    queryKey: [
      "external-lab-orders",
      treatmentDate,
      selectedLabMappingId,
      gumjinValue,
      hospital?.number,
    ],
    refetchOnMount: "always",
    queryFn: async () => {
      const params: Parameters<
        typeof LabOrdersService.getExternalLabOrders
      >[0] = {
        treatmentDateFrom: treatmentDate,
        treatmentDateTo: treatmentDate,
        limit: 50,
        menuName,
      };

      if (selectedLabMappingId) {
        params.mappingId = selectedLabMappingId;
      }

      if (gumjinValue !== undefined) {
        params.gumjin = gumjinValue;
      }

      return await LabOrdersService.getExternalLabOrders(params);
    },
  });

  // status 기준으로 분류
  const { allOrders, unsentOrders, sentOrders } = useMemo(() => {
    const unsent: ExternalLabOrder[] = [];
    const sent: ExternalLabOrder[] = [];

    externalLabOrders.forEach((order) => {
      if (order.status === "SENT" || order.status === "RECEIVED") {
        sent.push(order);
      } else {
        unsent.push(order);
      }
    });

    return {
      allOrders: externalLabOrders,
      unsentOrders: unsent,
      sentOrders: sent,
    };
  }, [externalLabOrders]);

  // activeTab에 따라 표시할 orders 선택
  const displayedOrders = useMemo(() => {
    return activeTab === "unsent" ? unsentOrders : sentOrders;
  }, [activeTab, unsentOrders, sentOrders]);

  // 선택된 수탁기관으로 필터링 (이미 API에서 필터링되었지만, 추가 필터링이 필요한 경우를 위해 유지)
  const filteredExternalLabOrders = useMemo(() => {
    // API에서 이미 필터링되었으므로 그대로 사용
    return displayedOrders;
  }, [displayedOrders]);

  // 수탁기관 목록 (전체 목록에서 추출)
  const labOptionsFromOrders = useMemo(() => {
    const labNames = new Set<string>();
    allOrders.forEach((order) => {
      const labName = order.externalLabHospitalMapping?.library?.name;
      if (labName) {
        labNames.add(labName);
      }
    });
    return Array.from(labNames).sort();
  }, [allOrders]);

  // 선택된 데이터를 수탁기관별로 그룹화
  const printPagesByLab = useMemo(() => {
    const selectedOrders = allOrders.filter((order) =>
      selectedPatients.has(order.id)
    );
    const groupedByLab = new Map<string, ExternalLabOrder[]>();

    selectedOrders.forEach((order) => {
      const labName =
        order.externalLabHospitalMapping?.library?.name || "미지정";
      if (!groupedByLab.has(labName)) {
        groupedByLab.set(labName, []);
      }
      groupedByLab.get(labName)!.push(order);
    });

    return Array.from(groupedByLab.entries()).map(([labName, orders]) => ({
      labName,
      orders,
    }));
  }, [allOrders, selectedPatients]);

  const generateExaminationRequestPdf = useCallback(async () => {
    const hasPrintPages = printPagesByLab.length > 0;
    if (!hasPrintPages) {
      throw new Error("출력할 데이터가 없습니다.");
    }

    return await generateExaminationRequestPdfWithPrintable({
      labsData: printPagesByLab,
      treatmentDate,
      hospitalName: hospital?.name,
      hospitalCode: hospital?.number,
    });
  }, [hospital?.name, hospital?.number, printPagesByLab, treatmentDate]);

  const mapExaminationStatus = (
    examinationStatus: string | undefined
  ): PatientStatus => {
    // encounter.registration.examination.status로 검사 대기/완료 판단
    if (examinationStatus === "COMPLETED") {
      return "completed";
    }
    if (examinationStatus === "WAITING") {
      return "waiting";
    }
    // 기본값: 검사대기
    return "waiting";
  };

  const formatPrescriptionTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const gridRows = useMemo<ExternalLabGridRow[]>(() => {
    return filteredExternalLabOrders.map((order) => {
      // 주민등록번호
      const rrn = order.patient?.rrn || "";
      const maskedRrn = rrn ? makeRrnView(rrn) : "-";

      // 나이 계산 (birthDate 형식: "19221111")
      let ageLabel = "";
      if (order.patient?.birthDate) {
        const birthDateStr = order.patient.birthDate;
        if (birthDateStr.length === 8) {
          const year = parseInt(birthDateStr.substring(0, 4));
          const month = parseInt(birthDateStr.substring(4, 6));
          const day = parseInt(birthDateStr.substring(6, 8));
          const birthDate = new Date(year, month - 1, day);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          if (
            today.getMonth() < birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() &&
              today.getDate() < birthDate.getDate())
          ) {
            age--;
          }
          ageLabel = `${age}세`;
        }
      }

      // 성별 (gender: 1=M, 2=F 또는 sex: "M"/"F")
      const genderValue = order.patient?.gender
        ? order.patient.gender === 1
          ? 1
          : order.patient.gender === 2
            ? 2
            : null
        : order.sex === "M"
          ? 1
          : order.sex === "F"
            ? 2
            : null;
      const genderLabel = getGender(genderValue, "ko");
      const ageGenderLabel =
        [ageLabel, genderLabel].filter(Boolean).join(" ").trim() || "-";

      const resolvedPatientNo =
        order.patient?.patientNo ??
        (order.exams?.[0] as any)?.order?.encounter?.patient?.patientNo ??
        null;
      const chartNumber =
        resolvedPatientNo != null ? String(resolvedPatientNo) : "-";

      // 수탁기관 이름
      const labInstitution =
        order.externalLabHospitalMapping?.library?.name || "미지정";

      // 진료의 이름
      const doctorName = order.encounter?.doctor?.name || "담당자 미지정";

      // 처방 시간
      const prescriptionTime = formatPrescriptionTime(order.orderDate);

      // 검사 상태 (encounter.registration.examination.status)
      const examinationStatus =
        order.encounter?.registration?.patientRoute?.examination?.status;

      // 전송 상태 (order.status 값 그대로 사용)
      const transmissionStatus = order.status || "PENDING";

      // 검사구분: serviceType이 0이면 "일반", 0이 아니면 "검진"
      const examinationType =
        order.rawData?.serviceType === 0 ? "일반" : "검진";

      const registrationId =
        order.encounter?.registration?.id?.toString();

      return {
        id: order.id,
        patientId: order.patient?.id,
        registrationId,
        chartNumber,
        patientName: order.patientName ?? "이름 없음",
        rrnView: rrn || "-",
        residentNumber: maskedRrn,
        ageGenderLabel,
        examinationType,
        doctor: doctorName,
        labInstitution,
        medicalInstitution: "미지정",
        prescriptionTime,
        status: mapExaminationStatus(examinationStatus),
        transmissionStatus,
        isSystemProvided:
          order.isSystemProvided ??
          order.exams?.[0]?.rawData?.externalLab?.isSystemProvided ??
          externalLabs.find(
            (lab) =>
              lab.externalLabHospitalMappingId ===
              order.externalLabHospitalMappingId
          )?.isSystemProvided ??
          true,
      };
    });
  }, [filteredExternalLabOrders, externalLabs]);

  const gridRowsWithDuplicate = useMemo(() => {
    const counts = new Map<string, number>();
    gridRows.forEach((patient) => {
      const key = `${patient.patientName}-${patient.chartNumber}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return gridRows.map((patient) => {
      const key = `${patient.patientName}-${patient.chartNumber}`;
      return {
        ...patient,
        isDuplicate: (counts.get(key) ?? 0) > 1,
      };
    });
  }, [gridRows]);

  const patientRows = gridRowsWithDuplicate;

  const labOptions = useMemo(() => {
    // 서버 응답에서 추출한 수탁기관 목록과 API에서 가져온 목록 병합
    const allLabNames = new Set<string>();
    labOptionsFromOrders.forEach((name) => allLabNames.add(name));
    externalLabs.forEach((lab) => allLabNames.add(lab.name));
    return ["전체", ...Array.from(allLabNames).sort()];
  }, [externalLabs, labOptionsFromOrders]);

  const handleDateChange = useCallback(
    (days: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + days);
      onDateChange(newDate);
    },
    [selectedDate, onDateChange]
  );

  const handleDateInputChange = useCallback(
    (value: string) => {
      if (!value) {
        return;
      }
      const [yearStr, monthStr, dayStr] = value.split("-");
      const year = Number(yearStr);
      const month = Number(monthStr ?? "1");
      const day = Number(dayStr ?? "1");
      const nextDate = new Date(year, month - 1, day);
      onDateChange(nextDate);
    },
    [onDateChange]
  );

  const handleToday = useCallback(() => {
    onDateChange(new Date());
  }, [onDateChange]);

  const handleLabChange = useCallback(
    (lab: string) => {
      onLabChange(lab);
    },
    [onLabChange]
  );

  const handleExaminationTypeChange = useCallback((type: string) => {
    setSelectedExaminationType(type);
  }, []);

  const handleRowClick = useCallback(
    (rowId: string) => {
      setSelectedRowId((prev) => (prev === rowId ? null : rowId));

      const order = allOrders.find((order) => order.id === rowId);
      setSelectedOrder(order ?? null);
    },
    [allOrders, setSelectedOrder]
  );

  const handleSelectPatient = useCallback((id: string, checked: boolean) => {
    setSelectedPatients((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const getStatusBadge = useCallback((status?: PatientStatus) => {
    if (!status) {
      return (
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gray-100">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          <span className="text-xs font-medium text-gray-600">대기</span>
        </div>
      );
    }

    const statusConfig = {
      waiting: {
        label: "검사대기",
        bgColor: "bg-[var(--blue-1)]",
        textColor: "text-[var(--blue-2)]",
        dotColor: "bg-[var(--blue-2)]",
      },
      cancelled: {
        label: "전송취소",
        bgColor: "bg-[var(--bg-3)]",
        textColor: "text-[var(--gray-400)]",
        dotColor: "bg-[var(--gray-400)]",
      },
      failed: {
        label: "전송실패",
        bgColor: "bg-[var(--red-1)]",
        textColor: "text-[var(--negative)]",
        dotColor: "bg-[var(--negative)]",
      },
      completed: {
        label: "검사완료",
        bgColor: "bg-[var(--green-1)]",
        textColor: "text-[var(--positive)]",
        dotColor: "bg-[var(--positive)]",
      },
    };

    const config = statusConfig[status];
    return (
      <div
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full ${config.bgColor}`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
        <span className={`text-xs font-medium ${config.textColor}`}>
          {config.label}
        </span>
      </div>
    );
  }, []);

  const getTransmissionStatusLabel = useCallback((status?: string): string => {
    if (!status) return "";
    if (status === "FAILED") return "전송실패";
    if (status === "CANCELLED") return "전송취소";
    if (status === "SENT") return "전송완료";
    if (status === "COMPLETED") return "전송완료";
    if (status === "PENDING") return "미전송";
    return status; // 알 수 없는 상태는 그대로 표시
  }, []);

  const getResultStatusLabel = useCallback((status?: PatientStatus): string => {
    if (status === "completed") {
      return "결과완료";
    }
    return "대기";
  }, []);

  // status 기준으로 카운트 계산
  const unsentCount = unsentOrders.length;
  const sentCount = sentOrders.length;
  const isSentTab = activeTab === "sent";

  // activeTab에 따라 표시할 rows 선택
  // externalLabOrders가 이미 activeTab에 따라 필터링되어 있으므로 patientRows를 그대로 사용
  const rowsByTab = patientRows;

  const filteredRows = rowsByTab.filter(
    (patient) =>
      selectedLab === "전체" || patient.labInstitution === selectedLab
  );

  const gridData = useMemo<ExternalLabGridData>(
    () => ({
      rows: filteredRows,
    }),
    [filteredRows]
  );

  // 선택 가능한 모든 행 (시스템 수탁기관 여부와 관계없이)
  const selectableRows = useMemo(() => {
    return gridData.rows;
  }, [gridData.rows]);

  // 데이터 로드 시 전체 선택 (필터 변경 또는 최초 진입)
  useEffect(() => {
    if (shouldAutoSelectAllRef.current && gridData.rows.length > 0) {
      shouldAutoSelectAllRef.current = false;
      setSelectedPatients(new Set(gridData.rows.map((row) => row.id)));
    }
  }, [gridData.rows]);

  // 선택된 항목 중 시스템 수탁기관이 아닌 항목이 있는지 확인
  const hasNonSystemProvided = useMemo(() => {
    return Array.from(selectedPatients).some((id) => {
      const patient = gridData.rows.find((p) => p.id === id);
      return patient && patient.isSystemProvided === false;
    });
  }, [selectedPatients, gridData.rows]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // 모든 행 선택
      const allIds = new Set(selectableRows.map((patient) => patient.id));
      setSelectedPatients(allIds);
      return;
    }
    setSelectedPatients(new Set());
  };

  const handleColumnToggle = (columnKey: ColumnKey, checked: boolean) => {
    const column = columnDefinitions.find((col) => col.key === columnKey);
    if (column?.alwaysVisible) return;

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

  // 검사 상태(검사대기/검사완료) 토글 mutation
  const updateExaminationStatusMutation = useMutation({
    mutationFn: async ({
      registrationId,
      status,
    }: {
      registrationId: string;
      status: "WAITING" | "COMPLETED";
    }) => {
      return await LabOrdersService.updatePatientRouteStatus(
        registrationId,
        status
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-lab-orders"] });
    },
    onError: (error: any) => {
      const errorMsg =
        error?.message || "검사 상태 업데이트에 실패했습니다.";
      toastHelpers.error(errorMsg);
    },
  });

  // 전송 mutation
  const sendMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return await LabOrdersService.sendExternalLabOrders({ ids });
    },
    onSuccess: (data) => {
      setIsLoadingModalOpen(false);
      setSendingProgress({ current: 0, total: 0 });

      // 전체 실패 (successCount가 0이고 failCount가 전체인 경우)
      if ((data.successCount || 0) === 0 && (data.failCount || 0) > 0) {
        const errorMsg = data.errorMessage || "일시적인 오류가 발생했습니다.";
        setFailureMessage(errorMsg);
        setIsFailureModalOpen(true);
        return;
      }

      // 부분 실패
      if (data.failCount && data.failCount > 0) {
        setPartialFailureData({
          successCount: data.successCount || 0,
          failCount: data.failCount || 0,
          failedPatients: data.failedPatients || [],
        });
        setIsPartialFailureModalOpen(true);
        // 성공한 환자는 쿼리 무효화하여 목록 새로고침
        queryClient.invalidateQueries({ queryKey: ["external-lab-orders"] });
        return;
      }

      // 전체 성공
      const successCount = data.successCount || selectedPatients.size;
      toastHelpers.success(`${successCount}건의 검사가 전송되었습니다.`);

      // 쿼리 무효화하여 목록 새로고침
      queryClient.invalidateQueries({ queryKey: ["external-lab-orders"] });

      // 선택 초기화
      setSelectedPatients(new Set());
    },
    onError: (error: any) => {
      setIsLoadingModalOpen(false);
      setSendingProgress({ current: 0, total: 0 });
      const errorMsg = error?.message || "일시적인 오류가 발생했습니다.";
      setFailureMessage(errorMsg);
      setIsFailureModalOpen(true);
    },
  });

  // 전송 버튼 클릭 핸들러
  const handleSendClick = useCallback(() => {
    // 선택된 환자 확인
    if (selectedPatients.size === 0) {
      toastHelpers.error("선택된 환자가 없습니다.");
      return;
    }

    // 확인 알럿 표시
    setIsSendConfirmOpen(true);
  }, [selectedPatients, toastHelpers]);

  const handleCancelSelection = useCallback(() => {
    setSelectedPatients(new Set());
    setSelectedRowId(null);
  }, []);

  const allVisibleSelected =
    selectableRows.length > 0 &&
    selectableRows.every((patient) => selectedPatients.has(patient.id));

  const isActionButtonDisabled = isSentTab
    ? selectedPatients.size === 0
    : isLoadingModalOpen || hasNonSystemProvided || selectedPatients.size === 0;
  const actionButtonLabel = isSentTab ? "취소" : "전송";
  const onActionButtonClick = isSentTab
    ? handleCancelSelection
    : handleSendClick;

  // 전송 확인 알럿에서 전송 버튼 클릭
  const handleConfirmSend = useCallback(() => {
    setIsSendConfirmOpen(false);

    // 선택된 order들의 exams에 있는 모든 exam id 수집
    const selectedIds: number[] = [];
    Array.from(selectedPatients).forEach((orderId) => {
      const order = allOrders.find((o) => o.id === orderId);
      if (order && order.exams) {
        order.exams.forEach((exam) => {
          const examId = parseInt(exam.id, 10);
          if (!isNaN(examId)) {
            selectedIds.push(examId);
          }
        });
      }
    });

    if (selectedIds.length === 0) {
      toastHelpers.error("전송할 환자를 선택해주세요.");
      return;
    }

    // 로딩 모달 표시
    setSendingProgress({ current: 0, total: selectedIds.length });
    setIsLoadingModalOpen(true);

    // 진행률 애니메이션 (API 응답 대기 중)
    const progressInterval = setInterval(() => {
      setSendingProgress((prev) => {
        if (prev.current < prev.total * 0.9) {
          return { ...prev, current: prev.current + 1 };
        }
        return prev;
      });
    }, 200);

    // 전송 API 호출
    sendMutation.mutate(selectedIds, {
      onSettled: () => {
        clearInterval(progressInterval);
        // 완료 시 100%로 설정
        setSendingProgress((prev) => ({ ...prev, current: prev.total }));
      },
    });
  }, [selectedPatients, allOrders, sendMutation, toastHelpers]);

  // 선택된 order들의 exam ID를 수집하는 헬퍼
  const collectSelectedExamIds = useCallback((): number[] => {
    const selectedIds: number[] = [];
    Array.from(selectedPatients).forEach((orderId) => {
      const order = allOrders.find((o) => o.id === orderId);
      if (order && order.exams) {
        order.exams.forEach((exam) => {
          const examId = parseInt(exam.id, 10);
          if (!isNaN(examId)) {
            selectedIds.push(examId);
          }
        });
      }
    });
    return selectedIds;
  }, [selectedPatients, allOrders]);

  // 출력미리보기에서 "출력+전송" 클릭 시 전송을 실행하는 콜백
  const handleSendAfterPrint = useCallback(async () => {
    const selectedIds = collectSelectedExamIds();
    if (selectedIds.length === 0) {
      toastHelpers.error("전송할 검사가 없습니다.");
      return;
    }

    closePrintPopup();

    // 로딩 모달 표시
    setSendingProgress({ current: 0, total: selectedIds.length });
    setIsLoadingModalOpen(true);

    // 진행률 애니메이션
    const progressInterval = setInterval(() => {
      setSendingProgress((prev) => {
        if (prev.current < prev.total * 0.9) {
          return { ...prev, current: prev.current + 1 };
        }
        return prev;
      });
    }, 200);

    sendMutation.mutate(selectedIds, {
      onSettled: () => {
        clearInterval(progressInterval);
        setSendingProgress((prev) => ({ ...prev, current: prev.total }));
      },
    });
  }, [collectSelectedExamIds, closePrintPopup, sendMutation, toastHelpers]);

  // 액션바 "출력+전송" 버튼 클릭 → 확인 모달 표시
  const [isPrintAndSendConfirmOpen, setIsPrintAndSendConfirmOpen] = useState(false);
  const [isPrintAndSending, setIsPrintAndSending] = useState(false);
  const handlePrintAndSendClick = useCallback(() => {
    if (selectedPatients.size === 0) {
      toastHelpers.error("선택된 환자가 없습니다.");
      return;
    }
    setIsPrintAndSendConfirmOpen(true);
  }, [selectedPatients, toastHelpers]);

  // 확인 모달에서 확인 클릭 → PDF 생성 → 프린터 에이전트 출력 → 전송
  const handleConfirmPrintAndSend = useCallback(async () => {
    setIsPrintAndSendConfirmOpen(false);

    const selectedIds = collectSelectedExamIds();
    if (selectedIds.length === 0) {
      toastHelpers.error("전송할 검사가 없습니다.");
      return;
    }

    setIsPrintAndSending(true);
    setLoadingMessage("PDF 생성중입니다...");
    setSendingProgress({ current: 0, total: 0 });
    setIsLoadingModalOpen(true);

    try {
      // 1. PDF 생성
      const pdfResult = await generateExaminationRequestPdf();
      const pdfBlob = pdfResult instanceof Blob
        ? pdfResult
        : await fetch(pdfResult).then((res) => res.blob());

      // 2. 파일 업로드
      setLoadingMessage("출력 준비중입니다...");
      const fileName = `examination-request-${Date.now()}.pdf`;
      const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
      const uploadResult = await FileService.uploadFileV2({
        file: pdfFile,
        category: "patient_document",
        entityType: "patient",
        description: "document print",
      });

      // 3. 기본 프린터 찾기 (outputTypeCode 매칭)
      const matchedPrinter = printers.find((p) =>
        p.outputTypeCodes?.includes(OutputTypeCode.DEFAULT_PRINTER)
      );
      if (!matchedPrinter) {
        toastHelpers.error("기본 프린터가 설정되어 있지 않습니다.");
        setIsPrintAndSending(false);
        setIsLoadingModalOpen(false);
        setLoadingMessage("");
        return;
      }

      const agents = matchedPrinter.agents ?? [];
      const targetAgentId = agents.length === 1 ? agents[0] : undefined;

      // 4. 프린터 에이전트에 출력 요청
      setLoadingMessage("출력중입니다...");
      await createPrintJobMutation.mutateAsync({
        printerId: matchedPrinter.id,
        payload: {
          outputTypeCode: OutputTypeCode.DEFAULT_PRINTER,
          contentType: "application/pdf",
          fileName,
          contentUrl: uploadResult.storagePath,
          copies: 1,
          options: { paperSize: "A4" },
          ...(targetAgentId ? { targetAgentId } : {}),
        },
      });

      toastHelpers.success("출력 작업이 생성되었습니다.");
    } catch (err) {
      console.error("[출력+전송] 출력 실패", err);
      toastHelpers.error("출력 요청에 실패했습니다. 다시 시도해주세요.");
      setIsPrintAndSending(false);
      setIsLoadingModalOpen(false);
      setLoadingMessage("");
      return;
    }

    setIsPrintAndSending(false);

    // 5. 전송 실행
    setLoadingMessage("");
    setSendingProgress({ current: 0, total: selectedIds.length });

    const progressInterval = setInterval(() => {
      setSendingProgress((prev) => {
        if (prev.current < prev.total * 0.9) {
          return { ...prev, current: prev.current + 1 };
        }
        return prev;
      });
    }, 200);

    sendMutation.mutate(selectedIds, {
      onSettled: () => {
        clearInterval(progressInterval);
        setSendingProgress((prev) => ({ ...prev, current: prev.total }));
      },
    });
  }, [
    selectedPatients,
    collectSelectedExamIds,
    generateExaminationRequestPdf,
    printers,
    createPrintJobMutation,
    sendMutation,
    toastHelpers,
  ]);

  // 의뢰서 출력 버튼 클릭 → 출력 미리보기 팝업 열기 (onPrintAndSend 포함)
  const handleOpenPrintPopup = useCallback(() => {
    if (selectedPatients.size === 0) {
      toastHelpers.error("선택된 환자가 없습니다.");
      return;
    }

    openPrintPopup({
      config: {
        title: "의뢰서 출력",
        outputTypeCode: OutputTypeCode.DEFAULT_PRINTER,
        fileNamePrefix: "examination-request",
        defaultCopies: 1,
        outputMode: 'html',
      },
      renderContent: async () => ({
        content: (
          <ExaminationRequestPrintablePages
            labsData={printPagesByLab}
            treatmentDate={treatmentDate}
            hospitalName={hospital?.name}
            hospitalCode={hospital?.number}
          />
        ),
      }),
      onPrintAndSend: handleSendAfterPrint,
    });
  }, [selectedPatients, toastHelpers, openPrintPopup, printPagesByLab, treatmentDate, hospital?.name, hospital?.number, handleSendAfterPrint]);

  // 재시도 핸들러
  const handleRetry = useCallback(() => {
    setIsFailureModalOpen(false);
    setIsPartialFailureModalOpen(false);

    // 실패한 환자 ID 수집 (부분 실패인 경우)
    let idsToRetry: number[] = [];

    if (partialFailureData) {
      // 부분 실패인 경우 실패한 환자만 재시도
      // 미연동 상태가 아닌 경우만 재시도 가능 (네트워크 오류만 재시도)
      idsToRetry = partialFailureData.failedPatients
        .filter((p) => {
          // 미연동 상태가 아닌 경우만 재시도 (에러 메시지로 판단)
          const errorMsg = p.errorMessage || "";
          return !errorMsg.includes("연동") && !errorMsg.includes("미연동");
        })
        .map((p) => parseInt(p.id, 10))
        .filter((id) => !isNaN(id));

      if (idsToRetry.length === 0) {
        toastHelpers.warning(
          "재시도 가능한 환자가 없습니다. 미연동 상태의 환자는 재시도할 수 없습니다."
        );
        setPartialFailureData(null);
        return;
      }
    } else {
      // 전체 실패인 경우 모든 선택된 order들의 exams에 있는 모든 exam id 수집
      Array.from(selectedPatients).forEach((orderId) => {
        const order = allOrders.find((o) => o.id === orderId);
        if (order && order.exams) {
          order.exams.forEach((exam) => {
            const examId = parseInt(exam.id, 10);
            if (!isNaN(examId)) {
              idsToRetry.push(examId);
            }
          });
        }
      });
    }

    if (idsToRetry.length === 0) {
      toastHelpers.error("재시도할 환자가 없습니다.");
      return;
    }

    // 로딩 모달 표시
    setSendingProgress({ current: 0, total: idsToRetry.length });
    setIsLoadingModalOpen(true);

    // 진행률 애니메이션 (API 응답 대기 중)
    const progressInterval = setInterval(() => {
      setSendingProgress((prev) => {
        if (prev.current < prev.total * 0.9) {
          return { ...prev, current: prev.current + 1 };
        }
        return prev;
      });
    }, 200);

    // 전송 API 재호출
    sendMutation.mutate(idsToRetry, {
      onSettled: () => {
        clearInterval(progressInterval);
        // 완료 시 100%로 설정
        setSendingProgress((prev) => ({ ...prev, current: prev.total }));
      },
    });
  }, [
    partialFailureData,
    selectedPatients,
    allOrders,
    sendMutation,
    toastHelpers,
  ]);

  // 문자 발송 버튼 클릭 핸들러
  const handleSendMessageClick = useCallback(async () => {
    if (selectedPatients.size === 0) {
      setIsMessageAlertOpen(true);
      return;
    }

    const selectedRows = gridData.rows.filter((row) =>
      selectedPatients.has(row.id)
    );

    // 선택된 환자를 recipients로 변환 (patientId를 id로, patientName을 name으로)
    const recipients: QuickMessageRecipient[] = selectedRows.map((row) => ({
      id: row.patientId,
      name: row.patientName,
    }));

    await checkAndPrepareQuickSend(recipients, {
      onAllSendable: (r) => {
        setMessageRecipients(r);
        setIsQuickSendOpen(true);
      },
      onPartialSendable: (r) => {
        setMessageRecipients(r);
        setIsQuickSendOpen(true);
      },
      onNoneSendable: () => {},
    });
  }, [selectedPatients, gridData.rows, checkAndPrepareQuickSend]);

  // 문자 발송 대상자 삭제 핸들러
  const handleRecipientRemove = useCallback((id: number) => {
    setMessageRecipients((prev) =>
      prev.filter((recipient) => recipient.id !== id)
    );
  }, []);

  // 환자명 목록 포맷팅 (5명 초과 시 "외 N명" 표시)
  const formatPatientNames = useCallback(
    (patients: Array<{ patientName: string }>, maxCount: number = 5) => {
      if (patients.length <= maxCount) {
        return patients.map((p) => `• ${p.patientName}`).join("\n");
      }
      const shown = patients.slice(0, maxCount);
      const remaining = patients.length - maxCount;
      return (
        shown.map((p) => `• ${p.patientName}`).join("\n") +
        `\n• 환자명 외 ${remaining}명`
      );
    },
    []
  );

  // 검사 상태 클릭 핸들러 (registrations API를 사용하여 patientRoute.examination.status 토글)
  const handleStatusClick = useCallback(
    (row: ExternalLabGridRow) => {
      if (!row.registrationId) {
        toastHelpers.error("접수 정보를 찾을 수 없습니다.");
        return;
      }
      const newStatus: "WAITING" | "COMPLETED" =
        row.status === "waiting" ? "COMPLETED" : "WAITING";
      updateExaminationStatusMutation.mutate({
        registrationId: row.registrationId,
        status: newStatus,
      });
    },
    [updateExaminationStatusMutation, toastHelpers]
  );

  const adjustedVisibleColumns = useMemo(() => {
    const next = new Set(visibleColumns);

    if (activeTab === "sent") {
      next.delete("status");
      next.delete("transmissionStatus");
      next.add("resultStatus");
    } else {
      next.delete("resultStatus");
    }

    return next;
  }, [activeTab, visibleColumns]);

  const columnDefinitionsForTab = useMemo(() => {
    if (activeTab === "sent") {
      return columnDefinitions.filter(
        (col) => col.key !== "status" && col.key !== "transmissionStatus"
      );
    }
    return columnDefinitions.filter((col) => col.key !== "resultStatus");
  }, [activeTab]);

  const visibleColumnDefinitions = useMemo(() => {
    return columnDefinitionsForTab.filter((col) =>
      adjustedVisibleColumns.has(col.key)
    );
  }, [adjustedVisibleColumns, columnDefinitionsForTab]);

  // patientRows의 ID 목록을 추출하여 의존성으로 사용
  const patientRowIds = useMemo(() => {
    return patientRows
      .map((p) => p.id)
      .sort()
      .join(",");
  }, [patientRows]);

  useEffect(() => {
    setSelectedPatients((prev) => {
      const currentIds = new Set(patientRows.map((p) => p.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (currentIds.has(id)) {
          next.add(id);
        }
      });
      // 실제로 변경이 없으면 이전 상태 반환 (무한 루프 방지)
      if (
        next.size === prev.size &&
        Array.from(next).every((id) => prev.has(id))
      ) {
        return prev;
      }
      return next;
    });
  }, [patientRowIds, patientRows]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isColumnModalOpen && !target.closest(".column-dropdown-container")) {
        setIsColumnModalOpen(false);
      }
    };

    if (isColumnModalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isColumnModalOpen]);

  const isInitialLoading =
    isExternalLabOrdersLoading && patientRows.length === 0;

  if (isInitialLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <MyLoadingSpinner />
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col bg-[var(--bg-main)] shadow-sm rounded-md border border-[var(--border-1)]"
      data-testid="external-lab-patient-list"
    >
      {/* 필터 영역 */}
      <FilterSection
        selectedDate={selectedDate}
        onDateInputChange={handleDateInputChange}
        onDateShift={handleDateChange}
        onToday={handleToday}
        selectedLab={selectedLab}
        onLabChange={handleLabChange}
        selectedExaminationType={selectedExaminationType}
        onExaminationTypeChange={handleExaminationTypeChange}
        labOptions={labOptions}
        isFetching={isExternalLabOrdersFetching}
      />

      {/* 탭 및 액션 버튼 */}
      <div className="flex flex-col">
        {/* 탭 */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => {
              setActiveTab("unsent");
              setSelectedPatients(new Set());
              setSelectedOrder(null);
            }}
            className={`w-1/2 px-3 py-2.5 flex items-center justify-center ${activeTab === "unsent"
              ? "text-[#180F38] font-bold border-b-2 border-[#180F38]"
              : "text-[#292A2D] font-normal"
              }`}
          >
            <span className="text-[13px]">미전송 {unsentCount}</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("sent");
              setSelectedPatients(new Set());
              setSelectedOrder(null);
            }}
            className={`w-1/2 px-3 py-2.5 flex items-center justify-center ${activeTab === "sent"
              ? "text-[#180F38] font-bold border-b-2 border-[#180F38]"
              : "text-[#292A2D] font-normal"
              }`}
          >
            <span className="text-[13px]">전송완료 {sentCount}</span>
          </button>
        </div>

        {/* 액션 버튼 */}
        <div className="px-4 py-3 flex items-center justify-end gap-2 border-b border-gray-200 relative">
          <button
            onClick={handleSendMessageClick}
            className="cursor-pointer px-3 h-[32px] bg-white rounded-sm border border-[#180F38] text-[#180F38] text-[13px] font-medium hover:bg-blue-50"
          >
            문자 발송
          </button>
          <button className="cursor-pointer px-3 h-[32px] bg-white rounded-sm border border-[#180F38] text-[#180F38] text-[13px] font-medium hover:bg-blue-50">
            라벨 출력
          </button>
          {activeTab === "sent" ? (
            <button
              className="px-3 h-[32px] bg-white rounded-sm border border-[#180F38] text-[#180F38] text-[13px] font-medium hover:bg-blue-50"
            >
              결과값 재수신
            </button>
          ) : (
            <button
              onClick={handleOpenPrintPopup}
              className="cursor-pointer px-3 h-[32px] bg-white rounded-sm border border-[#180F38] text-[#180F38] text-[13px] font-medium hover:bg-blue-50"
            >
              의뢰서 출력
            </button>
          )}
          {activeTab !== "sent" && (
            <button
              onClick={handlePrintAndSendClick}
              disabled={isPrintAndSending || sendMutation.isPending || hasNonSystemProvided || selectedPatients.size === 0}
              className="cursor-pointer px-3 h-[32px] bg-[#180F38] rounded-sm text-white text-[13px] font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              출력+전송
            </button>
          )}
          <button
            onClick={onActionButtonClick}
            disabled={isActionButtonDisabled}
            className="cursor-pointer px-3 h-[32px] bg-[#180F38] rounded-sm text-white text-[13px] font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionButtonLabel}
          </button>
          <div className="relative ml-4 column-dropdown-container">
            <button
              onClick={() => setIsColumnModalOpen(!isColumnModalOpen)}
              className="cursor-pointer w-4 h-4 flex items-center justify-center hover:bg-gray-100 rounded"
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
                  <h3 className="text-sm font-semibold text-[#292A2D]">
                    컬럼 선택
                  </h3>
                </div>
                <div className="py-1">
                  {columnDefinitionsForTab.map((colDef) => {
                    const isEnforced =
                      colDef.alwaysVisible ||
                      (isSentTab && colDef.key === "resultStatus");

                    return (
                      <label
                        key={colDef.key}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={adjustedVisibleColumns.has(colDef.key)}
                          onChange={(e) =>
                            handleColumnToggle(colDef.key, e.target.checked)
                          }
                          disabled={isEnforced}
                          className="w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span
                          className={`text-sm ${isEnforced ? "text-gray-400" : "text-[#292A2D]"
                            }`}
                        >
                          {colDef.label}
                        </span>
                        {isEnforced && (
                          <span className="text-xs text-gray-400 ml-auto">
                            (필수)
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* 테이블 헤더 */}
          <div className="sticky top-0 bg-gray-50 border-b border-gray-200 flex">
            {visibleColumnDefinitions.map((colDef, index) => (
              <div
                key={colDef.key}
                style={columnStyles[colDef.key]}
                className={`px-2 py-1.5 flex items-center ${colDef.key === "checkbox"
                  ? "justify-center"
                  : "justify-center"
                  } ${index < visibleColumnDefinitions.length - 1
                    ? "border-r border-gray-200"
                    : ""
                  }`}
              >
                {colDef.key === "checkbox" ? (
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={allVisibleSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                ) : (
                  <span className="text-xs font-medium text-[#292A2D]">
                    {colDef.label}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 테이블 바디 */}
          <TableBody
            rows={gridData.rows}
            visibleColumnDefinitions={visibleColumnDefinitions}
            selectedRowId={selectedRowId}
            selectedPatients={selectedPatients}
            onRowClick={handleRowClick}
            onSelectPatient={handleSelectPatient}
            onStatusClick={handleStatusClick}
            getStatusBadge={getStatusBadge}
            getTransmissionStatusLabel={getTransmissionStatusLabel}
            getResultStatusLabel={getResultStatusLabel}
            activeTab={activeTab}
          />
        </div>
      </div>

      {/* 전송 확인 알럿 */}
      <AlertModal
        open={isSendConfirmOpen}
        onOpenChange={setIsSendConfirmOpen}
        title="선택한 검사를 전송하시겠습니까?"
        message={(() => {
          const selectedRows = filteredRows.filter((row) =>
            selectedPatients.has(row.id)
          );
          const patientCount = new Set(selectedRows.map((r) => r.patientName))
            .size;
          const examCount = selectedRows.length;
          return `환자 ${patientCount}명, 검사 ${examCount}건`;
        })()}
        confirmText="전송"
        cancelText="취소"
        showCancel={true}
        onConfirm={handleConfirmSend}
        confirmClassName="text-[#180F38] hover:text-blue-700"
      />

      {/* 출력+전송 확인 알럿 */}
      <AlertModal
        open={isPrintAndSendConfirmOpen}
        onOpenChange={setIsPrintAndSendConfirmOpen}
        title="선택한 검사를 출력+전송하시겠습니까?"
        message={(() => {
          const selectedRows = filteredRows.filter((row) =>
            selectedPatients.has(row.id)
          );
          const patientCount = new Set(selectedRows.map((r) => r.patientName))
            .size;
          const examCount = selectedRows.length;
          return `환자 ${patientCount}명, 검사 ${examCount}건`;
        })()}
        confirmText="출력+전송"
        cancelText="취소"
        showCancel={true}
        onConfirm={handleConfirmPrintAndSend}
        confirmClassName="text-[#180F38] hover:text-blue-700"
      />

      {/* 로딩 모달 */}
      <Dialog open={isLoadingModalOpen} onOpenChange={() => { }}>
        <DialogContent
          className="sm:max-w-[400px] p-6 gap-4"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="flex flex-col items-center gap-4">
            {loadingMessage ? (
              <>
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c2c4c8] border-t-[#180F38]" />
                <div className="text-center text-[15px] font-medium text-[#292A2D]">
                  {loadingMessage}
                </div>
              </>
            ) : (
              <>
                <div className="text-center text-[15px] font-medium text-[#292A2D]">
                  {sendingProgress.total > 1
                    ? `전송중입니다 (${sendingProgress.current}/${sendingProgress.total})`
                    : "전송중입니다"}
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#180F38] transition-all duration-300"
                    style={{
                      width:
                        sendingProgress.total > 0
                          ? `${Math.min((sendingProgress.current / sendingProgress.total) * 100, 100)}%`
                          : "0%",
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 전송 실패 알럿 (전체 실패) */}
      <AlertModal
        open={isFailureModalOpen}
        onOpenChange={setIsFailureModalOpen}
        title="전송에 실패했습니다"
        message={failureMessage}
        confirmText="재시도"
        cancelText="닫기"
        showCancel={true}
        onConfirm={handleRetry}
        onCancel={() => {
          setIsFailureModalOpen(false);
          setSelectedPatients(new Set());
        }}
        confirmClassName="text-[#180F38] hover:text-blue-700"
      />

      {/* 전송 부분 실패 알럿 */}
      <AlertModal
        open={isPartialFailureModalOpen}
        onOpenChange={setIsPartialFailureModalOpen}
        title="일부 전송에 실패했습니다"
        message={(() => {
          if (!partialFailureData) return "";
          const { successCount, failCount, failedPatients } =
            partialFailureData;
          const patientNames = formatPatientNames(failedPatients);
          return `성공: ${successCount}명\n실패: ${failCount}명\n${patientNames}`;
        })()}
        confirmText="재시도"
        cancelText="확인"
        showCancel={true}
        onConfirm={handleRetry}
        onCancel={() => {
          setIsPartialFailureModalOpen(false);
          setPartialFailureData(null);
          // 성공한 환자는 이미 전송완료 탭으로 이동했으므로 선택 초기화
          setSelectedPatients(new Set());
          // 쿼리 무효화하여 목록 새로고침
          queryClient.invalidateQueries({ queryKey: ["external-lab-orders"] });
        }}
        confirmClassName="text-[#180F38] hover:text-blue-700"
      />

      {/* 문자 발송 대상 미선택 알럿 */}
      <AlertModal
        open={isMessageAlertOpen}
        onOpenChange={setIsMessageAlertOpen}
        title="알림"
        message="문자 발송 대상 환자를 선택해주세요."
        confirmText="확인"
        onConfirm={() => setIsMessageAlertOpen(false)}
      />

      {/* 빠른 문자 발송 팝업 */}
      <QuickSendMessageForm
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        recipients={messageRecipients}
        onRecipientRemove={handleRecipientRemove}
      />
      <EligibilityAlert />
    </div>
  );
}
