import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type {
  MyGridHeaderType,
  MyGridRowType,
} from "@/components/yjg/my-grid/my-grid-type";
import { MyContextMenu } from "@/components/yjg/my-context-menu";
import { useGridExport } from "@/components/yjg/my-grid/use-grid-export";
import { usePaymentsByDates } from "@/hooks/payment/use-payments-by-dates";
import { usePayment } from "@/hooks/payment/use-payment";
import { usePaymentCancel } from "@/hooks/payment/use-payment-cancel";
import { PaymentInfo } from "@/types/receipt/payments-info-types";
import type { CreditCardApprovalItem } from "@/types/payment/credit-card-approval-types";
import { PaymentsServices } from "@/services/payments-services";
import { useToastHelpers } from "@/components/ui/toast";
import { PaymentSource, PaymentProvider, CashType, PdfExportMode } from "@/constants/common/common-enum";
import { CashReceiptTypes } from "@/services/pay-bridge";
import { convertToUTCISOStart, convertToUTCISOEnd, convertUTCtoKST } from "@/lib/date-utils";
import { usePrintPdfBlob } from "@/hooks/print/use-print-pdf-blob";
import { OutputTypeCode } from "@/types/printer-types";
import { getInitialHeaders, saveHeaders } from "@/components/yjg/my-grid/my-grid-util";
import { useSettingsStore } from "@/store/settings-store";

const LS_CREDIT_CARD_APPROVAL_HEADERS_KEY = "reception.credit-card-approval.headers";

export const gridHeaders: MyGridHeaderType[] = [
  {
    key: "patientNo",
    name: "차트번호",
    width: 70,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
    isFixedLeft: true,
  },
  {
    key: "patientName",
    name: "환자명",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
    isFixedLeft: true,
  },
  {
    key: "approvalDate",
    name: "일자",
    width: 90,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "approvalTime",
    name: "시간",
    width: 60,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "approvalStatus",
    name: "구분",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "acquirerName",
    name: "카드종류",
    width: 110,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "installmentMonths",
    name: "할부",
    width: 80,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "approvalNo",
    name: "승인번호",
    width: 90,
    minWidth: 0,
    align: "center",
    readonly: true,
    visible: true,
  },
  {
    key: "paymentAmount",
    name: "승인금액",
    width: 80,
    minWidth: 0,
    align: "right",
    readonly: true,
    visible: true,
  },
];

const CANCEL_REASON = "승인취소";

const parseApprovalDate = (value: string | null): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const convertToPaymentInfo = (item: CreditCardApprovalItem): PaymentInfo => ({
  paymentId: item.paymentId,
  paymentSource: item.paymentSource as PaymentSource,
  paymentMethod: PaymentProvider.DIRECT,
  paymentAmount: item.paymentAmount ?? 0,
  cardNumber: item.cardNumber ?? undefined,
  issuerCode: item.issuerCode ?? undefined,
  issuerName: item.issuerName ?? undefined,
  installmentMonths: item.installmentMonths ?? 0,
  acquirerCode: item.acquirerCode ?? undefined,
  acquirerName: item.acquirerName ?? undefined,
  approvalNo: item.approvalNo ?? undefined,
  approvalDate: parseApprovalDate(item.approvalDate),
  vanTransactionNo: item.vanTransactionNo ?? undefined,
  catId: item.catId ?? undefined,
  catVersion: item.catVersion ?? undefined,
  receiptType:
    item.receiptType !== null && item.receiptType !== undefined
      ? (item.receiptType as CashReceiptTypes)
      : undefined,
  identificationNumber: item.identificationNumber ?? undefined,
  cashType: item.cashType ? (item.cashType as CashType) : undefined,
  cashReceived: item.cashReceived ?? undefined,
  cashChange: item.cashChange ?? undefined,
  bankCode: item.bankCode ?? undefined,
  bankName: item.bankName ?? undefined,
  accountNumber: item.accountNumber ?? undefined,
  depositorName: item.depositorName ?? undefined,
  transferDateTime: item.transferDateTime ?? undefined,
  transactionNo: item.vanTransactionNo ?? undefined,
});

const formatDateToYmd = (value: string | null | undefined) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toISOString().slice(0, 10);
};

/**
 * UTC 시간 문자열을 KST 시간으로 변환하여 HH:MM 형식으로 반환
 */
const formatTimeToKST = (value: string | null | undefined): string => {
  if (!value) return "";
  try {
    // UTC 시간을 KST로 변환 (HH:MM 형식)
    return convertUTCtoKST(value, "HH:mm");
  } catch {
    return "";
  }
};

const formatNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value.toLocaleString();
  const asNumber = Number(value);
  return Number.isNaN(asNumber) ? String(value) : asNumber.toLocaleString();
};

const convertToGridRows = (
  data: CreditCardApprovalItem[],
  headers: MyGridHeaderType[]
): MyGridRowType[] => {
  return data.map((item, index) => ({
    rowIndex: index,
    key: item.paymentId || item.approvalNo || index.toString(),
    cells: headers.map((header) => {
      if (header.key === "approvalStatus") {
        const statusText = item.isCanceled && item.originalPaymentId != null ? "취소" :
          item.isCanceled ? "승인(취소됨)" : "승인";
        const textColorClass = item.isCanceled ? "text-[var(--negative)] text-sm" : "text-[var(--positive)] text-sm";
        return {
          headerKey: header.key,
          value: statusText,
          orgData: item,
          customRender: React.createElement(
            "span",
            { className: textColorClass },
            statusText
          ),
        };
      }

      let value: string | number | boolean | null | undefined =
        item[header.key as keyof CreditCardApprovalItem] as unknown as
          | string
          | number
          | boolean
          | null
          | undefined;
      if (header.key === "patientNo") {
        const patient = (item as any)?.pateint ?? (item as any)?.patient;
        value = patient?.patientNo != null ? String(patient.patientNo) : null;
      }
      if (header.key === "patientName") {
        const patient = (item as any)?.pateint ?? (item as any)?.patient;
        value = patient?.name != null ? String(patient.name) : "";
      }

      if (header.key === "approvalDate") {
        // cancelApprovalDate가 있으면 그것을, 없으면 approvalDate를 사용
        const displayDate = item.cancelApprovalDate !== null
          ? item.cancelApprovalDate
          : item.approvalDate;
        value = formatDateToYmd(displayDate);
      }

      if (header.key === "approvalTime") {
        // cancelApprovalDate가 있으면 그것을, 없으면 approvalDate를 사용
        const displayDate = item.cancelApprovalDate !== null && item.originalPaymentId !== null
          ? item.cancelApprovalDate
          : item.approvalDate;
        value = formatTimeToKST(displayDate);
      }

      if (header.key === "paymentAmount" || header.key === "totalMedicalFee") {
        value = formatNumber(value as number | string | null | undefined);
      }

      if (header.key === "installmentMonths") {
        value = value === 0 ? "일시불" : `할부 ${value}개월`;
      }

      return {
        headerKey: header.key,
        value: Array.isArray(value) ? value.join(", ") : value ?? null,
        orgData: item,
      };
    }),
  }));
};

const formatInputDate = (date: Date) => date.toISOString().slice(0, 10);

type CreditCardContextMenuState = {
  x: number;
  y: number;
  visible: boolean;
  row: MyGridRowType | null;
};

export function useCreditCardApproval(): {
  dateRange: { from: string; to: string };
  setDateRange: React.Dispatch<React.SetStateAction<{ from: string; to: string }>>;
  searchKeyword: string;
  setSearchKeyword: React.Dispatch<React.SetStateAction<string>>;
  handleSearch: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  gridHeaders: MyGridHeaderType[];
  setGridHeaders: React.Dispatch<React.SetStateAction<MyGridHeaderType[]>>;
  gridRows: MyGridRowType[];
  filteredData: CreditCardApprovalItem[];
  isLoading: boolean;
  error: unknown;
  handleContextMenu: (
    contextMenu: CreditCardContextMenuState,
    setContextMenu: React.Dispatch<React.SetStateAction<CreditCardContextMenuState>>,
    selectedRows: Set<MyGridRowType>,
    setSelectedRows: React.Dispatch<React.SetStateAction<Set<MyGridRowType>>>,
    setLastSelectedRow: React.Dispatch<React.SetStateAction<MyGridRowType | null>>
  ) => React.ReactNode;
  handleExportToExcel: () => Promise<void>;
  handleExportPdf: (mode: PdfExportMode) => Promise<void>;
  gridContainerRef: React.RefObject<HTMLDivElement | null>;
} {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const from = new Date();
    from.setMonth(today.getMonth() - 1);
    return {
      from: formatInputDate(from),
      to: formatInputDate(today),
    };
  });
  const [searchKeyword, setSearchKeyword] = useState("");
  const { isLoaded: isSettingsLoaded } = useSettingsStore();
  const [gridHeadersState, setGridHeaders] = useState<MyGridHeaderType[]>(gridHeaders);
  const toast = useToastHelpers();

  // Settings가 로드된 후 저장된 헤더 설정 적용
  useEffect(() => {
    if (isSettingsLoaded) {
      const initialHeaders = getInitialHeaders(LS_CREDIT_CARD_APPROVAL_HEADERS_KEY, gridHeaders);
      setGridHeaders(initialHeaders);
    }
  }, [isSettingsLoaded]);

  // 헤더 변경 시 저장
  useEffect(() => {
    if (isSettingsLoaded && gridHeadersState.length > 0) {
      saveHeaders(LS_CREDIT_CARD_APPROVAL_HEADERS_KEY, gridHeadersState);
    }
  }, [gridHeadersState, isSettingsLoaded]);
  const paymentOptions = useMemo(
    () => ({
      registration: null,
      encounter: null,
      paymentFormData: PaymentsServices.getEmptyPaymentFormData(),
      paymentData: PaymentsServices.getDefaultPaymentData(),
    }),
    []
  );
  const { cancelCashPayment, cancelCreditPayment } = usePayment(paymentOptions);
  const { cancelPayment } = usePaymentCancel();

  // 결제 목록 조회
  const { data, isLoading, error } = usePaymentsByDates<CreditCardApprovalItem[]>({
    startDate: dateRange.from ? convertToUTCISOStart(dateRange.from) : undefined,
    endDate: dateRange.to ? convertToUTCISOEnd(dateRange.to) : undefined,
    paymentSource: PaymentSource.CARD,
    includedCanceled: true,
  });

  // approvalDate와 cancelApprovalDate가 모두 null인 경우 필터링
  const paymentData = useMemo(() => {
    if (!data) return [];
    const filtered = data.filter(
      (item) => item.approvalDate !== null || item.cancelApprovalDate !== null
    );
    return filtered;
  }, [data]);

  // Excel Export용 summaryData 상태
  const [summaryData] = useState<Record<string, number | string>>({});

  const handleCancelApproval = useCallback(
    async (item: CreditCardApprovalItem) => {
      try {
        let targetItem = item;
        try {
          const detail = await PaymentsServices.getPaymentDetail(item.paymentId);
          if (detail) {
            targetItem = detail;
          }
        } catch (fetchError) {
          console.warn("승인 취소 - 결제 정보 재조회 실패, 기존 데이터 사용:", fetchError);
        }

        const paymentInfo = convertToPaymentInfo(targetItem);
        const isTerminal = true; //todo 단말기 연동 여부 확인
        const integrationFn =
          paymentInfo.paymentSource === PaymentSource.CASH
            ? cancelCashPayment
            : cancelCreditPayment;
        const integrationResult = await integrationFn(
          CANCEL_REASON,
          paymentInfo,
          isTerminal
        );

        if (!integrationResult) {
          return;
        }

        const { cancelApprovalNo, cancelApprovalDate } = integrationResult;

        if (!cancelApprovalNo || !cancelApprovalDate) {
          toast.error("승인취소 실패", "단말기 승인 취소 정보를 확인할 수 없습니다.");
          return;
        }

        await cancelPayment(paymentInfo.paymentId, {
          cancelApprovalNo,
          cancelApprovalDate: new Date(cancelApprovalDate),
        });

        queryClient.invalidateQueries({ queryKey: ["payments", "list"] });
      } catch (error) {
        console.error("승인 취소 중 오류:", error);
      }
    },
    [cancelCashPayment, cancelCreditPayment, cancelPayment, queryClient, toast]
  );

  // Context Menu 핸들러
  const handleContextMenu = useCallback(
    (
      contextMenu: CreditCardContextMenuState,
      setContextMenu: React.Dispatch<
        React.SetStateAction<CreditCardContextMenuState>
      >,
      selectedRows: Set<MyGridRowType>,
      _setSelectedRows: React.Dispatch<React.SetStateAction<Set<MyGridRowType>>>,
      _setLastSelectedRow: React.Dispatch<React.SetStateAction<MyGridRowType | null>>
    ) => {
      const selectedRow =
        contextMenu.row ??
        (selectedRows.size > 0 ? Array.from(selectedRows)[0] : null);

      if (!selectedRow) return null;

      const item = selectedRow.cells[0]?.orgData as CreditCardApprovalItem | undefined;
      if (!item) return null;

      const isApproved = !item.isCanceled;

      const closeContextMenu = () => {
        setContextMenu((prev) => ({
          ...prev,
          visible: false,
          row: null,
        }));
      };

      return React.createElement(
        MyContextMenu,
        {
          isOpen: contextMenu.visible,
          onCloseAction: closeContextMenu,
          position: { x: contextMenu.x, y: contextMenu.y },
          items: [
            {
              label: "승인취소",
              onClick: () => {
                handleCancelApproval(item);
                closeContextMenu();
              },
              disabled: !isApproved, // '승인' 상태가 아니면 disabled
            },
          ],
        }
      );
    },
    [handleCancelApproval]
  );

  // 검색 핸들러 (빈 값일 때 쿼리 무효화 및 재검색)
  const handleSearch = useCallback(() => {
    if (searchKeyword.trim() === "") {
      // 쿼리 무효화 후 재검색
      queryClient.invalidateQueries({
        queryKey: ["payments", "list"],
      });
    }
  }, [searchKeyword, queryClient]);

  // 엔터 키 핸들러
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch]
  );

  const filteredData = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return paymentData.filter((item) => {
      const patient = (item as any)?.pateint ?? (item as any)?.patient;
      const matchesKeyword =
        !keyword ||
        [patient?.patientNo, patient?.name, item.approvalNo]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(keyword));

      return matchesKeyword;
    });
  }, [paymentData, searchKeyword]);

  const gridRows = useMemo(
    () => convertToGridRows(filteredData, gridHeadersState),
    [filteredData, gridHeadersState]
  );

  // 그리드 컨테이너 ref (PDF 출력용)
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Export 훅
  const { exportToExcel, exportToPdf } = useGridExport({
    headers: gridHeaders,
    data: gridRows,
    summaryData,
  });

  // PDF blob 업로드 및 프린트 요청 통합 mutation
  const printPdfMutation = usePrintPdfBlob();

  // Export 핸들러
  const handleExportToExcel = useCallback(async () => {
    const dateRangeStr = dateRange.from && dateRange.to
      ? `${dateRange.from}~${dateRange.to}`
      : dateRange.from || dateRange.to || new Date().toISOString().slice(0, 10);
    const fileName = `신용카드 승인내역 ${dateRangeStr}`;
    const sheetName = dateRangeStr;
    await exportToExcel({
      fileName,
      sheetName,
      includeSummary: false,
    });
  }, [exportToExcel, dateRange]);

  // PDF 생성 핸들러 (blob 반환)
  const handleGeneratePdf = useCallback(async (): Promise<{ blob: Blob; fileName: string } | null> => {
    try {
      const dateRangeStr = dateRange.from && dateRange.to
        ? `${dateRange.from}~${dateRange.to}`
        : dateRange.from || dateRange.to || new Date().toISOString().slice(0, 10);
      const fileName = `신용카드 승인내역 ${dateRangeStr}`;

      // PDF blob 생성
      const pdfBlob = await exportToPdf({
        fileName,
        margin: 10,
        extraRows: [
          {
            type: "inline",
            data: [
              { label: "조회기간", value: dateRangeStr },
            ]
          },
        ],
        includeSummary: false,
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
  }, [exportToPdf, dateRange]);

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
    // TODO
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

  return {
    dateRange,
    setDateRange,
    searchKeyword,
    setSearchKeyword,
    handleSearch,
    handleKeyDown,
    gridHeaders: gridHeadersState,
    setGridHeaders,
    gridRows,
    filteredData,
    isLoading,
    error,
    handleContextMenu,
    handleExportToExcel,
    handleExportPdf,
    gridContainerRef,
  };
}

