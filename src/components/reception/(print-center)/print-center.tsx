"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import InputDateRangeWithMonth from "@/components/ui/input-date-range-with-month";
import MyGrid from "@/components/yjg/my-grid/my-grid";
import type {
  MyGridHeaderType,
  MyGridRowType,
  MyGridCellType,
} from "@/components/yjg/my-grid/my-grid-type";
import { getInitialHeaders, saveHeaders } from "@/components/yjg/my-grid/my-grid-util";
import MyCheckbox from "@/components/yjg/my-checkbox";
import { MyButton } from "@/components/yjg/my-button";
import { useSelectedReception } from "@/hooks/reception/use-selected-reception";
import { usePrintService } from "@/hooks/document/use-print-service";
import { usePrintPopupStore } from "@/store/print-popup-store";
import { OutputTypeCode } from "@/types/printer-types";
import { RegistrationsService } from "@/services/registrations-service";
import { ReceptionService } from "@/services/reception-service";
import { useRegistrationPatientPrint } from "@/hooks/registration/use-registration-patient-print";
import type { Reception } from "@/types/common/reception-types";
import type { ExternalReception } from "../board-patient/types";
import { registrationKeys } from "@/lib/query-keys/registrations";
import {
  보험구분상세,
  보험구분상세Label,
} from "@/constants/common/common-enum";
import { useDoctorsStore } from "@/store/doctors-store";
import { useToastHelpers } from "@/components/ui/toast";
import { useSettingsStore } from "@/store/settings-store";
import { useReceptionTabsStore } from "@/store/reception";
import { DocumentType } from "./print-center-types";

// 체크박스 상태 타입: Map<receptionId, Map<documentType, boolean>>
type CheckboxState = Map<string | number, Map<DocumentType, boolean>>;

// 출력 항목 타입 정의
interface PrintItem {
  receptionId: string | number;
  encounterId: string; // PDF 생성에 사용되는 실제 ID
  receptionDateTime?: string | Date;
  doctorName?: string;
  insuranceType?: string;
  hasReceipt?: boolean; // 영수증 존재 여부
}

interface PrintCenterProps {
  reception: ExternalReception | null;
  receptionId?: string | null;
  onPrint?: (printType: string) => void;
  isActive?: boolean;
}

// 날짜/시간 분리 헬퍼 함수
const formatDate = (dateTime: string | Date | undefined): string => {
  if (!dateTime) return "";
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTime = (dateTime: string | Date | undefined): string => {
  if (!dateTime) return "";
  const date = new Date(dateTime);
  return date.toTimeString().split(" ")[0]?.substring(0, 5) || "";
};

const LS_PRINT_CENTER_HEADERS_KEY = "print-center-headers";

// 헤더 정의 함수 - Figma 디자인 기준 (sortNumber: getInitialHeaders/저장 시 순서용)
const getPrintCenterHeaders = (): MyGridHeaderType[] => [
  { key: "receptionDate", name: "내원일", width: 100, minWidth: 0, visible: true, align: "center", sortNumber: 1 },
  { key: "receptionTime", name: "접수시간", width: 72, minWidth: 0, visible: true, align: "center", sortNumber: 2 },
  { key: "doctorName", name: "담당의", width: 72, minWidth: 0, visible: true, align: "center", sortNumber: 3 },
  { key: "insuranceType", name: "보험구분", width: 72, minWidth: 0, visible: true, align: "center", sortNumber: 4 },
  { key: "pharmacyPrescription", name: "약국용\n처방전", width: 80, minWidth: 0, visible: true, align: "center", sortNumber: 5 },
  { key: "patientPrescription", name: "환자용\n처방전", width: 80, minWidth: 0, visible: true, align: "center", sortNumber: 6 },
  { key: "receipt", name: "영수증", width: 60, minWidth: 0, visible: true, align: "center", sortNumber: 7 },
  { key: "statement", name: "진료비\n내역서", width: 80, minWidth: 0, visible: true, align: "center", sortNumber: 8 },
  { key: "medicalRecord", name: "진료기록\n사본", width: 80, minWidth: 0, visible: true, align: "center", sortNumber: 9 },
  { key: "testResult", name: "검사결과", width: 70, minWidth: 0, visible: true, align: "center", sortNumber: 10 },
  { key: "visitConfirmation", name: "통원\n확인서", width: 80, minWidth: 0, visible: true, align: "center", sortNumber: 11 },
];

export default function PrintCenter({
  reception: externalReception,
  receptionId: externalReceptionId,
  isActive,
}: PrintCenterProps) {
  const queryClient = useQueryClient();
  const removeOpenedReception = useReceptionTabsStore((s) => s.removeOpenedReception);
  const openedReceptionId = useReceptionTabsStore((s) => s.openedReceptionId);

  // 현재 Reception 기준으로 patientId를 가져오되,
  // props로 전달된 reception/receptionId가 있으면 우선 사용
  const { selectedReception: currentReceptionFromStore } = useSelectedReception({
    reception: externalReception ?? undefined,
    receptionId: externalReceptionId ?? undefined,
  });

  const currentReception: Reception | null =
    (externalReception as Reception | null) ??
    (currentReceptionFromStore as Reception | null) ??
    null;

  const patientId = currentReception?.patientBaseInfo?.patientId;

  const getInitialDateRange = (): { from: string; to: string } => {
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    const formatDate = (date: Date): string =>
      date.toISOString().split("T")[0] ?? "";

    return {
      from: formatDate(oneWeekAgo),
      to: formatDate(today),
    };
  };

  const [dateRange, setDateRange] = useState<{ from: string; to: string }>(
    getInitialDateRange
  );
  const [footerReceipt, setFooterReceipt] = useState(false);
  const [footerStatement, setFooterStatement] = useState(false);
  const [checkboxState, setCheckboxState] = useState<CheckboxState>(new Map());
  const {
    renderPrintCenterSelectiveContent,
  } = usePrintService();
  const { openPrintPopup } = usePrintPopupStore();

  const { doctors } = useDoctorsStore();
  const { warning: showWarning } = useToastHelpers();
  const settingsLoaded = useSettingsStore((state) => state.isLoaded);

  const [headers, setHeaders] = useState<MyGridHeaderType[]>(() =>
    getInitialHeaders(LS_PRINT_CENTER_HEADERS_KEY, getPrintCenterHeaders())
  );
  const initialHeadersLoadedRef = useRef(false);

  useEffect(() => {
    if (!settingsLoaded || initialHeadersLoadedRef.current) return;
    initialHeadersLoadedRef.current = true;
    const initialHeaders = getInitialHeaders(
      LS_PRINT_CENTER_HEADERS_KEY,
      getPrintCenterHeaders()
    );
    setHeaders(initialHeaders);
  }, [settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return;
    if (headers.length > 0) {
      saveHeaders(LS_PRINT_CENTER_HEADERS_KEY, headers);
    }
  }, [headers, settingsLoaded]);

  const doctorsById = useMemo(() => {
    const map = new Map<any, { id: any; name?: string }>();
    doctors.forEach((doctor) => {
      map.set(doctor.id, doctor);
    });
    return map;
  }, [doctors]);

  const { beginUTC, endUTC } = useMemo(() => {
    const begin = dateRange.from
      ? new Date(dateRange.from + "T00:00:00").toISOString()
      : null;
    const end = dateRange.to
      ? new Date(dateRange.to + "T23:59:59").toISOString()
      : null;
    return { beginUTC: begin, endUTC: end };
  }, [dateRange.from, dateRange.to]);

  // 등록 목록 조회 및 Reception으로 변환
  const { data: receptions = [] } = useQuery({
    queryKey: registrationKeys.byPatientPrintRange(String(patientId ?? ""), beginUTC, endUTC),
    queryFn: async (): Promise<Reception[]> => {
      if (!patientId || !beginUTC || !endUTC) return [];

      const registrations =
        await RegistrationsService.getRegistrationsByPatient(
          String(patientId),
          beginUTC,
          endUTC
        );

      return registrations.map((registration) =>
        ReceptionService.convertRegistrationToReception(registration)
      );
    },
    enabled: !!patientId && !!beginUTC && !!endUTC,
  });

  const printCenterList: PrintItem[] = useMemo(() => {
    const sortedReceptions = [...receptions].sort((a, b) => {
      const dateA = a.receptionDateTime
        ? new Date(a.receptionDateTime).getTime()
        : 0;
      const dateB = b.receptionDateTime
        ? new Date(b.receptionDateTime).getTime()
        : 0;
      return dateB - dateA;
    });

    return sortedReceptions.map((reception) => ({
      receptionId: reception.originalRegistrationId || "",
      encounterId: reception.receptionInfo.encounters?.[0]?.id || "", // 백엔드에서 항상 1개 보장
      receptionDateTime: reception.receptionDateTime,
      doctorName:
        doctorsById.get(reception.patientBaseInfo?.doctorId)?.name ?? "-",
      insuranceType:
        보험구분상세Label[reception.insuranceInfo.uDeptDetail as 보험구분상세] ||
        "-",
      hasReceipt: reception.receptionInfo.hasReceipt ?? false,
    }));
  }, [receptions, doctorsById]);

  // 환자 출력 가능 여부를 한번에 조회 (처방전/영수증 존재 여부)
  const { data: printAvailability = [], isLoading: isPrintAvailabilityLoading } =
    useRegistrationPatientPrint(
      String(patientId ?? ""),
      beginUTC ?? "",
      endUTC ?? ""
    );

  // 출력센터 탭 활성화 시 출력 가능 여부 재조회
  useEffect(() => {
    if (isActive) {
      queryClient.invalidateQueries({ queryKey: ["registration-patient-print"] });
    }
  }, [isActive, queryClient]);

  const prescriptionAvailabilityByEncounterId = useMemo(() => {
    const map = new Map<string, { hasData: boolean; isLoading: boolean; isError: boolean }>();
    if (Array.isArray(printAvailability)) {
      for (const item of printAvailability) {
        map.set(String(item.encounterId), {
          hasData: Boolean(item.hasPrescription),
          isLoading: isPrintAvailabilityLoading,
          isError: false,
        });
      }
    }
    return map;
  }, [printAvailability, isPrintAvailabilityLoading]);

  const receiptAvailabilityByEncounterId = useMemo(() => {
    const map = new Map<string, { hasData: boolean; isLoading: boolean; isError: boolean }>();
    if (Array.isArray(printAvailability)) {
      for (const item of printAvailability) {
        map.set(String(item.encounterId), {
          hasData: Boolean(item.hasReceipt),
          isLoading: isPrintAvailabilityLoading,
          isError: false,
        });
      }
    }
    return map;
  }, [printAvailability, isPrintAvailabilityLoading]);

  // receptionId -> encounterId 매핑
  const getEncounterIdByReceptionId = useCallback(
    (receptionId: string | number): string | null => {
      const item = printCenterList.find((item) => item.receptionId === receptionId);
      return item?.encounterId || null;
    },
    [printCenterList]
  );

  // 그리드 데이터 변경 핸들러 (체크박스 상태 관리)
  const handleDataChange = useCallback(
    (
      rowKey: string | number,
      columnKey: string,
      value: string | number | boolean
    ) => {
      const boolValue = Boolean(value);

      setCheckboxState((prev) => {
        const newState = new Map(prev);
        const rowState = new Map(newState.get(rowKey) ?? new Map());
        rowState.set(columnKey as DocumentType, boolValue);
        newState.set(rowKey, rowState);
        return newState;
      });
    },
    []
  );

  // 그리드 데이터 변환: headers 순서에 맞춰 cells 구성 (헤더 위치/리사이즈와 일치)
  const gridData: MyGridRowType[] = useMemo(() => {
    if (!printCenterList || printCenterList.length === 0 || headers.length === 0) {
      return [];
    }
    const visibleHeaderKeys = headers.filter((h) => h.visible).map((h) => h.key);
    return printCenterList.map((item, index) => {
      const rowCheckboxState = checkboxState.get(item.receptionId);
      const hasEncounter = Boolean(item.encounterId);
      const prescriptionState = item.encounterId
        ? prescriptionAvailabilityByEncounterId.get(item.encounterId)
        : undefined;
      const hasPrescription = Boolean(prescriptionState?.hasData);
      const isPrescriptionLoading = Boolean(prescriptionState?.isLoading);
      const receiptState = item.encounterId
        ? receiptAvailabilityByEncounterId.get(item.encounterId)
        : undefined;
      const hasActiveReceipt = Boolean(receiptState?.hasData);
      const isReceiptLoading = Boolean(receiptState?.isLoading);
      const canShowReceipt = hasEncounter && !isReceiptLoading && hasActiveReceipt;
      const isPrescriptionCheckboxDisabled =
        !hasEncounter || isPrescriptionLoading || !hasPrescription;

      const cellByKey: Record<string, MyGridRowType["cells"][0]> = {
        receptionDate: { headerKey: "receptionDate", value: formatDate(item.receptionDateTime) },
        receptionTime: { headerKey: "receptionTime", value: formatTime(item.receptionDateTime) },
        doctorName: { headerKey: "doctorName", value: item.doctorName || "-" },
        insuranceType: { headerKey: "insuranceType", value: item.insuranceType || "-" },
        [DocumentType.PHARMACY_PRESCRIPTION]: {
          headerKey: DocumentType.PHARMACY_PRESCRIPTION,
          value: hasEncounter ? (rowCheckboxState?.get(DocumentType.PHARMACY_PRESCRIPTION) ?? false) : false,
          inputType: "checkbox",
          disabled: isPrescriptionCheckboxDisabled,
        },
        [DocumentType.PATIENT_PRESCRIPTION]: {
          headerKey: DocumentType.PATIENT_PRESCRIPTION,
          value: hasEncounter ? (rowCheckboxState?.get(DocumentType.PATIENT_PRESCRIPTION) ?? false) : false,
          inputType: "checkbox",
          disabled: isPrescriptionCheckboxDisabled,
        },
        [DocumentType.RECEIPT]: {
          headerKey: DocumentType.RECEIPT,
          value: canShowReceipt ? (rowCheckboxState?.get(DocumentType.RECEIPT) ?? false) : false,
          inputType: "checkbox",
          disabled: !canShowReceipt,
        },
        [DocumentType.STATEMENT]: {
          headerKey: DocumentType.STATEMENT,
          value: hasEncounter ? (rowCheckboxState?.get(DocumentType.STATEMENT) ?? false) : false,
          inputType: "checkbox",
          disabled: !hasEncounter,
        },
        [DocumentType.MEDICAL_RECORD]: {
          headerKey: DocumentType.MEDICAL_RECORD,
          value: hasEncounter ? (rowCheckboxState?.get(DocumentType.MEDICAL_RECORD) ?? false) : false,
          inputType: "checkbox",
          disabled: !hasEncounter,
        },
        [DocumentType.TEST_RESULT]: {
          headerKey: DocumentType.TEST_RESULT,
          value: false,
          inputType: "checkbox",
          disabled: true,
        },
        [DocumentType.VISIT_CONFIRMATION]: {
          headerKey: DocumentType.VISIT_CONFIRMATION,
          value: false,
          inputType: "checkbox",
          disabled: true,
        },
        receptionId: { headerKey: "receptionId", value: item.receptionId },
      };

      const cells: MyGridRowType["cells"] = visibleHeaderKeys
        .map((key) => cellByKey[key])
        .filter((c): c is MyGridCellType => c != null);
      const receptionIdCell = cellByKey.receptionId;
      if (receptionIdCell && !visibleHeaderKeys.includes("receptionId")) {
        cells.push(receptionIdCell);
      }

      return { rowIndex: index + 1, key: item.receptionId, cells };
    });
  }, [
    headers,
    printCenterList,
    checkboxState,
    prescriptionAvailabilityByEncounterId,
    receiptAvailabilityByEncounterId,
  ]);

  // 출력 버튼 클릭 핸들러
  const handlePrint = useCallback(async () => {
    console.log("[PrintCenter] 출력 버튼 클릭");
    const startTime = performance.now();

    // 선택된 항목 수집 (receptionId -> encounterId 변환)
    const allSelections: Array<{ encounterId: string; documentType: DocumentType }> = [];

    checkboxState.forEach((rowState, receptionId) => {
      const encounterId = getEncounterIdByReceptionId(receptionId);
      if (!encounterId) {
        console.warn("[PrintCenter] encounterId를 찾을 수 없음:", receptionId);
        return;
      }

      rowState.forEach((checked, documentType) => {
        if (checked) {
          allSelections.push({
            encounterId,
            documentType,
          });
        }
      });
    });

    console.log("[PrintCenter] 선택된 항목:", allSelections.length, "개", allSelections);

    if (allSelections.length === 0) {
      console.log("[PrintCenter] 선택된 항목 없음");
      showWarning("출력할 항목을 선택해주세요.");
      return;
    }

    // ── HTML 경로 ──
    // encounter별 선택 목록을 구성한 뒤 HTML 팝업을 즉시 열고,
    // 실제 HTML 생성은 팝업 내부에서 generatePdf 콜백으로 수행합니다.

    const selectionsByEncounter = new Map<string, DocumentType[]>();
    allSelections.forEach(({ encounterId, documentType }) => {
      const types = selectionsByEncounter.get(encounterId) ?? [];
      types.push(documentType);
      selectionsByEncounter.set(encounterId, types);
    });

    const htmlSelections = Array.from(selectionsByEncounter.entries()).map(
      ([encounterId, documentTypes]) => ({ encounterId, documentTypes })
    );

    const combinedReceiptEncounterIds = footerReceipt
      ? allSelections.filter((s) => s.documentType === DocumentType.RECEIPT).map((s) => s.encounterId)
      : [];
    const combinedStatementEncounterIds = footerStatement
      ? allSelections.filter((s) => s.documentType === DocumentType.STATEMENT).map((s) => s.encounterId)
      : [];

    const receptionIdToClose = openedReceptionId;

    openPrintPopup({
      config: {
        title: "출력센터",
        outputTypeCode: OutputTypeCode.DEFAULT_PRINTER,
        fileNamePrefix: "print-center",
        outputMode: 'html',
      },
      renderContent: () =>
        renderPrintCenterSelectiveContent({
          selections: htmlSelections,
          combinedReceiptEncounterIds: combinedReceiptEncounterIds.length > 0
            ? combinedReceiptEncounterIds
            : undefined,
          combinedStatementEncounterIds: combinedStatementEncounterIds.length > 0
            ? combinedStatementEncounterIds
            : undefined,
        }),
      onPrintComplete: () => {
        if (receptionIdToClose) {
          removeOpenedReception(receptionIdToClose);
        }
      },
    });

    const durationSec = (performance.now() - startTime) / 1000;
    console.log(`[PrintCenter] HTML 출력 팝업 열기 완료: ${durationSec.toFixed(2)}초`);
  }, [checkboxState, openPrintPopup, getEncounterIdByReceptionId, footerReceipt, footerStatement, renderPrintCenterSelectiveContent, showWarning, openedReceptionId, removeOpenedReception]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* 조회 영역 - Figma: 12px gap */}
      <div className="mb-3 flex-shrink-0">
        <InputDateRangeWithMonth
          fromValue={dateRange.from}
          toValue={dateRange.to}
          toPlaceholder="YYYY-MM-DD"
          fromPlaceholder="YYYY-MM-DD"
          onChange={(value) => setDateRange(value)}
        />
      </div>

      {/* 그리드 영역 - 전체 너비 차지 */}
      <div className="flex-1 min-h-0 overflow-auto w-full">
        <MyGrid
          headers={headers}
          onHeadersChange={setHeaders}
          data={gridData}
          onDataChange={handleDataChange}
        />
      </div>

      {/* 푸터 영역 - Figma 기준 */}
      <div className="pt-3 flex-shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-[var(--gray-100)] ml-2">합본 출력</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <MyCheckbox
              checked={footerReceipt}
              onChange={setFooterReceipt}
            />
            <span className="text-sm text-[var(--gray-100)]">영수증</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <MyCheckbox
              checked={footerStatement}
              onChange={setFooterStatement}
            />
            <span className="text-sm text-[var(--gray-100)]">진료비내역서</span>
          </label>
        </div>
        <MyButton
          onClick={handlePrint}
          className="min-w-16 h-8"
        >
          출력
        </MyButton>
      </div>
    </div>
  );
}

