import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import { closingsService } from "@/services/closing/closings-service";
import type {
  DailyClosing,
  DailyClosingPatient,
  DailyClosingSummary,
} from "@/types/closings/closings-daily-types";
import { 보험구분상세Label } from "@/constants/common/common-enum";
import { useGridExport } from "@/components/yjg/my-grid/use-grid-export";
import { createAutoSummaryConfig } from "@/components/yjg/my-grid/use-grid-summary";
import { formatDate, convertUTCtoKST } from "@/lib/date-utils";
import { usePrintPdfBlob } from "@/hooks/print/use-print-pdf-blob";
import { OutputTypeCode } from "@/types/printer-types";
import { PdfExportMode } from "@/constants/common/common-enum";
import { getInitialHeaders, saveHeaders } from "@/components/yjg/my-grid/my-grid-util";
import { useSettingsStore } from "@/store/settings-store";

const LS_DAILY_RECEIPT_HEADERS_KEY = "reception.daily-receipt.headers";

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

export const gridHeaders: MyGridHeaderType[] = [
  {
    key: "patientNo",
    name: "차트번호",
    width: 60,
    minWidth: 0,
    readonly: true,
    visible: true,
    isFixedLeft: true,
  },
  {
    key: "patientName",
    name: "이름",
    align: "center",
    width: 80,
    minWidth: 0,
    readonly: true,
    visible: true,
    isFixedLeft: true,
  },
  {
    key: "receptionTime",
    name: "접수시간",
    width: 60,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "receiptTime",
    name: "수납시간",
    width: 60,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "insuranceType",
    name: "보험구분",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "cardAmount",
    name: "카드",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "cashAmount",
    name: "현금",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "transferAmount",
    name: "이체",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "receiveAmount",
    name: "영수액합계",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "totalMedicalFee",
    name: "총진료비",
    width: 90,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "insuranceTotalAmount",
    name: "급여총액",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "insuranceClaim",
    name: "청구액",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "totalCopay",
    name: "본인부담금",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "nonInsuranceCopay",
    name: "비급여",
    width: 80,
    minWidth: 0,  
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "discount",
    name: "감액",
    width: 70,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "grantAmount",
    name: "지원금",
    width: 60,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "healthMaintenanceFee",
    name: "건생비",
    width: 60,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "receivableIssueAmount",
    name: "미수발생",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "receivableCollectionAmount",
    name: "미수수납",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "refundIssueAmount",
    name: "환불발생",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "refundCompleteAmount",
    name: "환불완료",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "cutPrice",
    name: "절사액",
    width: 50,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
];

const defaultClosingSummary: DailyClosingSummary = {
  totalPatients: 0,
  healthInsurance: 0,
  medicalBenefit: 0,
  general: 0,
  unpaid: 0,
};

const convertToGridRows = (
  data: DailyClosingPatient[],
  headers: MyGridHeaderType[]
): MyGridRowType[] => {
  // insuranceType의 인덱스 찾기
  const insuranceTypeIndex = headers.findIndex(
    (header) => header.key === "insuranceType"
  );

  return data.map((item, index) => ({
    rowIndex: index,
    key: item.patientId,
    cells: headers.map((header, headerIndex) => {
      const value = item[header.key as keyof DailyClosingPatient];

      // insuranceType인 경우 보험구분상세Label로 변환
      let cellValue: string | number | boolean | null | undefined;
      if (header.key === "insuranceType") {
        cellValue = value != null
          ? 보험구분상세Label[value as keyof typeof 보험구분상세Label] || String(value)
          : null;
      } else if (header.key === "receptionTime" || header.key === "receiptTime") {
        // receptionTime과 receiptTime은 UTC ISO 8601 문자열을 KST로 변환하여 HH:mm 형식으로 표시
        cellValue = value != null && typeof value === "string"
          ? convertUTCtoKST(value, "HH:mm")
          : null;
      } else {
        // 배열인 경우 문자열로 변환
        if (Array.isArray(value)) {
          cellValue = value.join(", ");
        } else {
          cellValue = (value as string | number | boolean | null | undefined) ?? null;
        }
      }

      const cell: any = {
        headerKey: header.key,
        value: cellValue,
        orgData: item,
      };

      // receptionTime과 receiptTime은 텍스트로 처리 (HH:mm 형식)
      if (header.key === "receptionTime" || header.key === "receiptTime") {
        cell.inputType = "text";
      }
      // insuranceType 이후의 모든 헤더에 textNumber 타입 설정
      else if (insuranceTypeIndex !== -1 && headerIndex > insuranceTypeIndex) {
        cell.inputType = "textNumber";
        cell.textNumberOption = {
          showComma: true,
        };
        cell.align = "right";
      }
      return cell;
    }),
  }));
};

export function useDailyReceipt(): {
  selectedDate: string;
  setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
  gridHeaders: MyGridHeaderType[];
  setGridHeaders: React.Dispatch<React.SetStateAction<MyGridHeaderType[]>>;
  gridRows: MyGridRowType[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  summaryStats: Array<{ label: string; value: number; isCritical?: boolean }>;
  summaryConfig: ReturnType<typeof createAutoSummaryConfig>;
  onSummaryCalculated: (data: Record<string, number | string>) => void;
  handleExportToExcel: () => Promise<void>;
  handleExportPdf: (mode: PdfExportMode) => Promise<void>;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
} {
  const [selectedDate, setSelectedDate] = useState(() => formatDateInput(new Date()));
  const [dailyClosing, setDailyClosing] = useState<DailyClosing | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded: isSettingsLoaded } = useSettingsStore();
  const [gridHeadersState, setGridHeaders] = useState<MyGridHeaderType[]>(gridHeaders);

  // Excel Export용 summaryData 상태
  const [summaryData, setSummaryData] = useState<Record<string, number | string>>({});

  // Settings가 로드된 후 저장된 헤더 설정 적용
  useEffect(() => {
    if (isSettingsLoaded) {
      const initialHeaders = getInitialHeaders(LS_DAILY_RECEIPT_HEADERS_KEY, gridHeaders);
      setGridHeaders(initialHeaders);
    }
  }, [isSettingsLoaded]);

  // 헤더 변경 시 저장
  useEffect(() => {
    if (isSettingsLoaded && gridHeadersState.length > 0) {
      saveHeaders(LS_DAILY_RECEIPT_HEADERS_KEY, gridHeadersState);
    }
  }, [gridHeadersState, isSettingsLoaded]);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await closingsService.getDailyClosings(selectedDate);
        if (isCancelled) return;
        setDailyClosing(response);
      } catch (err) {
        if (isCancelled) return;
        console.error("일별 수납 내역 조회 실패:", err);
        setError("데이터를 불러오는데 실패했습니다.");
        setDailyClosing(null);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [selectedDate]);

  const patients = dailyClosing?.patients ?? [];

  // gridRows를 useMemo로 메모이제이션하여 무한 루프 방지
  const gridRows = useMemo(
    () => convertToGridRows(patients, gridHeadersState),
    [patients, gridHeadersState]
  );
  const totalCount = patients.length;

  // Summary Config 생성
  const summaryConfig = useMemo(() =>
    createAutoSummaryConfig(gridHeadersState, gridRows, {
      aggregationType: "sum",
      label: "수납 합계",
      align: "center",
      mergeNonNumericColumns: true,
    }),
    [gridRows, gridHeadersState]
  );

  // Export 훅
  const { exportToExcel, exportToPdf } = useGridExport({
    headers: gridHeadersState,
    data: gridRows,
    summaryData,
  });

  // 그리드 컨테이너 ref (PDF 출력용)
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // PDF blob 업로드 및 프린트 요청 통합 mutation
  const printPdfMutation = usePrintPdfBlob();

  const currentSummary = dailyClosing?.statistics ?? defaultClosingSummary;

  // Export 핸들러
  const handleExportToExcel = useCallback(async () => {
    const fileName = `${selectedDate} 일별수납내역`;
    const sheetName = selectedDate;
    await exportToExcel({
      fileName,
      sheetName,
      includeSummary: true,
      summaryPosition: "top",
      extraRows: [
        {
          type: "inline",
          data: [
            { label: "조회일자", value: formatDate(selectedDate, "-") },
          ]
        },
        {
          type: "grid",
          data: [
            { label: "총환자수", value: currentSummary.totalPatients },
            { label: "건강보험", value: currentSummary.healthInsurance },
            { label: "의료급여", value: currentSummary.medicalBenefit },
            { label: "일반", value: currentSummary.general },
            { label: "수납미처리", value: currentSummary.unpaid },
          ]
        }
      ],
    });
  }, [exportToExcel, selectedDate, currentSummary]);

  // PDF 생성 핸들러 (blob 반환)
  const handleGeneratePdf = useCallback(async (): Promise<{ blob: Blob; fileName: string } | null> => {
    try {
      const fileName = `${selectedDate} 일별수납내역`;

      // PDF blob 생성
      const pdfBlob = await exportToPdf({
        fileName,
        margin: 10,
        extraRows: [
          {
            type: "inline",
            data: [
              { label: "조회일자", value: formatDate(selectedDate, "-") },
            ]
          },
          {
            type: "grid",
            data: [
              { label: "총환자수", value: currentSummary.totalPatients },
              { label: "건강보험", value: currentSummary.healthInsurance },
              { label: "의료급여", value: currentSummary.medicalBenefit },
              { label: "일반", value: currentSummary.general },
              { label: "수납미처리", value: currentSummary.unpaid },
            ]
          }
        ],
        includeSummary: true,
        summaryPosition: "bottom",
        returnBlob: true,
      });

      if (!pdfBlob) {
        throw new Error("PDF 생성 실패");
      }

      return { blob: pdfBlob, fileName };
    } catch (error) {
      console.error("PDF 생성 오류:", error);
      return null;
    }
  }, [exportToPdf, selectedDate, currentSummary]);

  // PDF 출력 핸들러 (blob과 fileName을 받아서 출력 처리)
  const handlePrintPdf = useCallback(async (blob: Blob, fileName: string) => {
    try {
      await printPdfMutation.mutateAsync({
        blob,
        fileName,
        category: "general",
        outputTypeCode: OutputTypeCode.ETC,
      });
    } catch (error) {
      console.error("PDF 출력 오류:", error);
      throw error;
    }
  }, [printPdfMutation]);

  // PDF 다운로드 핸들러
  const handleDownloadPdf = useCallback((blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // PDF 미리보기 핸들러
  const handlePreviewPdf = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }, []);

  // PDF 생성 후 옵션에 따라 다운로드/미리보기/출력 처리하는 통합 핸들러
  const handleExportPdf = useCallback(async (mode: PdfExportMode = PdfExportMode.PREVIEW) => {
    const result = await handleGeneratePdf();
    if (!result) return;

    switch (mode) {
      case PdfExportMode.DOWNLOAD:
        handleDownloadPdf(result.blob, result.fileName);
        break;
      case PdfExportMode.PREVIEW:
        handlePreviewPdf(result.blob);
        break;
      case PdfExportMode.PRINT:
        await handlePrintPdf(result.blob, result.fileName);
        break;
    }
  }, [handleGeneratePdf, handleDownloadPdf, handlePreviewPdf, handlePrintPdf]);

  const summaryStats = [
    { label: "총환자수", value: currentSummary.totalPatients },
    { label: "건강보험", value: currentSummary.healthInsurance },
    { label: "의료급여", value: currentSummary.medicalBenefit },
    { label: "일반", value: currentSummary.general },
    { label: "수납미처리", value: currentSummary.unpaid, isCritical: true },
  ];

  return {
    selectedDate,
    setSelectedDate,
    gridHeaders: gridHeadersState,
    setGridHeaders,
    gridRows,
    totalCount,
    isLoading,
    error,
    summaryStats,
    summaryConfig,
    onSummaryCalculated: setSummaryData,
    handleExportToExcel,
    handleExportPdf,
    gridContainerRef,
  };
}

