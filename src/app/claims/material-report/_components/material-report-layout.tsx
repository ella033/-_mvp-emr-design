"use client";

import { useEffect, useMemo, useState } from "react";
import { useToastHelpers } from "@/components/ui/toast";
import AlertModal from "@/app/claims/commons/alert-modal";
import {
  getDefaultReportDateRange,
} from "@/mocks/claims/material-report/mock-data";
import {
  PrepayType,
  SendStatus,
} from "@/app/claims/(enums)/material-report-enums";
import {
  useMaterialReportDetail,
  useMaterialReportSave,
  useMaterialReportSend,
  useMaterialReports,
} from "@/hooks/claims/use-material-report";
import {
  MaterialReportService,
  MaterialReportServiceErrors,
} from "@/services/material-report-service";
import { useUserStore } from "@/store/user-store";
import type {
  MaterialReport,
  MaterialReportItem,
  MaterialReportSavePayload,
  MaterialSearchItem,
  MaterialReportItemField,
} from "@/types/claims/material-report";
import ReportFormPanel from "./report-form-panel";
import ReportListPanel from "./report-list-panel";

type MaterialReportDraft = Partial<MaterialReportSavePayload> &
  Omit<MaterialReportSavePayload, "id"> & {
    id: string | undefined;
    createdAt?: string;
    sendStatus?: SendStatus;
    claimApiErrorCount?: number;
    claimApiErrors?: string[];
  };

const MISSING_FIELDS_MESSAGE =
  "입력되지 않은 항목이 있습니다.\n입력 후 송신을 진행해주세요.";
const SAM_PROGRAM_MESSAGE =
  "진료비청구프로그램이 설치되어 있지 않습니다.\n설치 후 송신 진행해주세요.";

export default function MaterialReportLayout() {
  const toastHelpers = useToastHelpers();
  const user = useUserStore((state) => state.user);
  const defaultRange = useMemo(() => getDefaultReportDateRange(), []);
  const [dateRange, setDateRange] = useState(defaultRange);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [checkedReportIds, setCheckedReportIds] = useState<Set<string>>(
    new Set()
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draftReport, setDraftReport] = useState<MaterialReportDraft>(
    createEmptyDraftReport()
  );
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set()
  );
  const [invalidItemFields, setInvalidItemFields] = useState<
    Record<string, MaterialReportItemField[]>
  >({});
  const [missingFieldAlertOpen, setMissingFieldAlertOpen] = useState(false);
  const [samProgramAlertOpen, setSamProgramAlertOpen] = useState(false);

  const {
    data: reports = [],
    isLoading: isReportsLoading,
  } = useMaterialReports(dateRange);
  const { data: selectedReport } = useMaterialReportDetail(selectedReportId);
  const saveReportMutation = useMaterialReportSave();
  const sendReportMutation = useMaterialReportSend();

  useEffect(
    function hydrateDefaultDraftMetaFromSettings() {
      const hospitalId = Number((user as { hospitalId?: number })?.hospitalId);
      if (!hospitalId) return;
      if (selectedReportId) return;
      if (draftReport.id) return;

      const hasWriterName = draftReport.writerName.trim().length > 0;
      const hasMedicalInstitutionNumber =
        draftReport.medicalInstitutionNumber.trim().length > 0;
      const hasApplicationNumber = draftReport.applicationNumber.trim().length > 0;
      if (
        hasWriterName &&
        hasMedicalInstitutionNumber &&
        hasApplicationNumber
      ) {
        return;
      }

      let isCancelled = false;
      const fetchDefaultDraftMeta = async () => {
        const userHospitalNumber =
          (user as { hospitalNumber?: string })?.hospitalNumber?.trim() ?? "";
        const [defaultWriterName, hospitalNumberFromApi, nextApplicationNumber] =
          await Promise.all([
            hasWriterName
              ? Promise.resolve("")
              : MaterialReportService.getDefaultWriterName(hospitalId),
            hasMedicalInstitutionNumber
              ? Promise.resolve("")
              : userHospitalNumber
                ? Promise.resolve(userHospitalNumber)
                : MaterialReportService.getDefaultMedicalInstitutionNumber(
                    hospitalId
                  ),
            hasApplicationNumber
              ? Promise.resolve("")
              : MaterialReportService.getNextApplicationNumber(),
          ]);

        if (isCancelled) return;
        setDraftReport((prev) => ({
          ...prev,
          writerName:
            prev.writerName.trim().length > 0
              ? prev.writerName
              : defaultWriterName,
          medicalInstitutionNumber:
            prev.medicalInstitutionNumber.trim().length > 0
              ? prev.medicalInstitutionNumber
              : hospitalNumberFromApi,
          applicationNumber:
            prev.applicationNumber.trim().length > 0
              ? prev.applicationNumber
              : nextApplicationNumber,
        }));
      };

      void fetchDefaultDraftMeta();
      return () => {
        isCancelled = true;
      };
    },
    [
      user,
      selectedReportId,
      draftReport.id,
      draftReport.writerName,
      draftReport.medicalInstitutionNumber,
      draftReport.applicationNumber,
    ]
  );

  useEffect(function syncDraftFromSelection() {
    const hasSelectedReport = Boolean(selectedReportId) && Boolean(selectedReport);
    if (!hasSelectedReport) return;
    const selectedReportSummary = reports.find(
      (report) => report.id === selectedReportId
    );
    setDraftReport((prev) =>
      toDraftReport(
        selectedReport as MaterialReport,
        selectedReportSummary?.claimApiErrors ?? prev.claimApiErrors ?? [],
        selectedReportSummary?.claimApiErrorCount
      )
    );
    setSelectedItemIds(new Set());
    setInvalidItemFields({});
    setIsCreatingNew(false);
  }, [selectedReportId, selectedReport?.id, reports]);

  useEffect(function syncSelectionFromList() {
    if (!reports) return;
    const hasReports = reports.length > 0;
    const hasSelectedId = selectedReportId !== null;
    const selectedExists = hasSelectedId
      ? reports.some((report) => report.id === selectedReportId)
      : false;
    const shouldSelectFirst =
      hasReports && !selectedExists && !isCreatingNew;

    if (shouldSelectFirst && reports[0]) {
      setSelectedReportId(reports[0].id);
    }
  }, [reports, selectedReportId, isCreatingNew]);

  const isSentReport = draftReport.sendStatus === SendStatus.Sent;

  const handleDateRangeChange = (
    field: "startDate" | "endDate",
    value: string
  ) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReportId(reportId);
    setIsCreatingNew(false);
  };

  const handleToggleReport = (reportId: string, checked: boolean) => {
    setCheckedReportIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(reportId);
      } else {
        next.delete(reportId);
      }
      return next;
    });
  };

  const handleToggleAllReports = (checked: boolean) => {
    setCheckedReportIds(() => {
      if (!checked) return new Set();
      return new Set(reports.map((report) => report.id));
    });
  };

  const handleCreateNew = async () => {
    const nextApplicationNumber =
      await MaterialReportService.getNextApplicationNumber();
    setIsCreatingNew(true);
    setSelectedReportId(null);
    setDraftReport(
      createEmptyDraftReport({
        applicationNumber: nextApplicationNumber,
      })
    );
    setSelectedItemIds(new Set());
    setInvalidItemFields({});
  };

  const handleDraftFieldChange = <T extends keyof MaterialReportDraft>(
    field: T,
    value: MaterialReportDraft[T]
  ) => {
    setDraftReport((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddItemFromSearch = (item: MaterialSearchItem) => {
    setDraftReport((prev) => {
      const nextItem = createReportItemFromSearch(item, prev.items.length + 1);
      return {
        ...prev,
        items: [...prev.items, nextItem],
      };
    });
  };

  const handleItemFieldChange = (
    itemId: string,
    field: keyof MaterialReportItem,
    value: MaterialReportItem[keyof MaterialReportItem]
  ) => {
    setDraftReport((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) return item;
        const nextItem = { ...item, [field]: value } as MaterialReportItem;
        const shouldUpdateTotal =
          field === "purchaseQuantity" || field === "unitPrice";
        if (shouldUpdateTotal) {
          nextItem.totalAmount =
            nextItem.purchaseQuantity * nextItem.unitPrice;
        }
        return nextItem;
      }),
    }));
  };

  const handleToggleItem = (itemId: string, checked: boolean) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  };

  const handleToggleAll = (checked: boolean) => {
    setSelectedItemIds(() => {
      if (!checked) return new Set();
      return new Set(draftReport.items.map((item) => item.id));
    });
  };

  const handleDeleteItems = () => {
    const hasSelectedItems = selectedItemIds.size > 0;
    if (!hasSelectedItems) return;
    if (isSentReport) {
      toastHelpers.info("송신 완료된 신고서는 삭제할 수 없습니다.");
      return;
    }

    setDraftReport((prev) => {
      const remainingItems = prev.items.filter(
        (item) => !selectedItemIds.has(item.id)
      );
      const resequencedItems = remainingItems.map((item, index) => ({
        ...item,
        rowNo: index + 1,
      }));
      return { ...prev, items: resequencedItems };
    });
    setSelectedItemIds(new Set());
  };

  const handleSave = async () => {
    const payload = toSavePayload(draftReport);
    try {
      const saved = await saveReportMutation.mutateAsync(payload);
      setDraftReport(toDraftReport(saved));
      setSelectedReportId(saved.id);
      setIsCreatingNew(false);
      setInvalidItemFields({});

      const claimApiErrorCount = Number(saved.claimApiErrorCount ?? 0);
      const claimApiErrors = saved.claimApiErrors ?? [];
      if (claimApiErrorCount > 0) {
        const errorMessage =
          claimApiErrors.length > 0
            ? claimApiErrors.join("\n")
            : `검증 오류 ${claimApiErrorCount}건이 있습니다.`;
        toastHelpers.error(errorMessage);
        return;
      }

      toastHelpers.success("저장되었습니다.");
    } catch (error) {
      toastHelpers.error("저장에 실패했습니다.");
    }
  };

  const handleSend = async () => {
    const isAlreadySent = draftReport.sendStatus === SendStatus.Sent;
    if (isAlreadySent) {
      toastHelpers.info("이미 송신된 신고서입니다.");
      return;
    }

    const validation = validateDraftReport(draftReport);
    setInvalidItemFields(validation.invalidItemFields);

    if (validation.hasMissingFields) {
      setMissingFieldAlertOpen(true);
      return;
    }

    try {
      const shouldSaveBeforeSend = !draftReport.id;
      const savedReport = shouldSaveBeforeSend
        ? await saveReportMutation.mutateAsync(toSavePayload(draftReport))
        : draftReport;
      const prescriptionUserCodeIds = Array.from(
        new Set(
          savedReport.items
            .map((item) => Number(item.prescriptionUserCodeId ?? 0))
            .filter((prescriptionUserCodeId) => prescriptionUserCodeId > 0)
        )
      );

      await sendReportMutation.mutateAsync({
        id: savedReport.id!,
        reflectUnitPriceToMaster: Boolean(savedReport.reflectUnitPriceToMaster),
        prescriptionUserCodeIds,
      });
      setDraftReport((prev) => ({
        ...prev,
        id: savedReport.id,
        sendStatus: SendStatus.Sent,
      }));
      toastHelpers.success("송신되었습니다.");
    } catch (error) {
      const isSamProgramError =
        error instanceof Error &&
        error.message === MaterialReportServiceErrors.SAM_NOT_INSTALLED;
      if (isSamProgramError) {
        setSamProgramAlertOpen(true);
        return;
      }
      toastHelpers.error("송신에 실패했습니다.");
    }
  };

  return (
    <div className="h-full w-full bg-[var(--page-background)]">
      <div className="flex h-full">
        <ReportListPanel
          reports={reports}
          selectedReportId={selectedReportId}
          checkedReportIds={checkedReportIds}
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onDateRangeChange={handleDateRangeChange}
          onSelectReport={handleSelectReport}
          onToggleReport={handleToggleReport}
          onToggleAllReports={handleToggleAllReports}
          isLoading={isReportsLoading}
        />
        <ReportFormPanel
          report={draftReport}
          isSentReport={isSentReport}
          selectedItemIds={selectedItemIds}
          invalidItemFields={invalidItemFields}
          onDraftFieldChange={handleDraftFieldChange}
          onItemFieldChange={handleItemFieldChange}
          onAddItemFromSearch={handleAddItemFromSearch}
          onToggleItem={handleToggleItem}
          onToggleAll={handleToggleAll}
          onDeleteItems={handleDeleteItems}
          onCreateNew={handleCreateNew}
          onSave={handleSave}
          onSend={handleSend}
          isSaving={saveReportMutation.isPending}
          isSending={sendReportMutation.isPending}
        />
      </div>

      <AlertModal
        open={missingFieldAlertOpen}
        onOpenChange={setMissingFieldAlertOpen}
        message={MISSING_FIELDS_MESSAGE}
        showCancel={false}
        confirmText="확인"
      />
      <AlertModal
        open={samProgramAlertOpen}
        onOpenChange={setSamProgramAlertOpen}
        message={SAM_PROGRAM_MESSAGE}
        showCancel={false}
        confirmText="확인"
      />
    </div>
  );
}

function createEmptyDraftReport(
  options?: {
    applicationNumber?: string;
    writerName?: string;
    medicalInstitutionNumber?: string;
  }
): MaterialReportDraft {
  return {
    id: undefined,
    applicationNumber: options?.applicationNumber ?? "",
    writerName: options?.writerName ?? "",
    memo: "",
    reflectUnitPriceToMaster: true,
    medicalInstitutionNumber: options?.medicalInstitutionNumber ?? "",
    items: [],
    claimApiErrorCount: 0,
    claimApiErrors: [],
  };
}

function toDraftReport(
  report: MaterialReport,
  fallbackClaimApiErrors: string[] = [],
  fallbackClaimApiErrorCount?: number
): MaterialReportDraft {
  const claimApiErrors =
    report.claimApiErrors && report.claimApiErrors.length > 0
      ? report.claimApiErrors
      : fallbackClaimApiErrors;
  const claimApiErrorCount =
    report.claimApiErrorCount ?? fallbackClaimApiErrorCount ?? claimApiErrors.length;

  return {
    id: report.id,
    createdAt: report.createdAt,
    sendStatus: report.sendStatus,
    applicationNumber: report.applicationNumber,
    writerName: report.writerName,
    memo: report.memo,
    reflectUnitPriceToMaster: report.reflectUnitPriceToMaster,
    medicalInstitutionNumber: report.medicalInstitutionNumber,
    items: report.items.map((item) => ({ ...item })),
    claimApiErrorCount,
    claimApiErrors,
  };
}

function toSavePayload(report: MaterialReportDraft): MaterialReportSavePayload {
  return {
    id: report.id!,
    applicationNumber: report.applicationNumber,
    writerName: report.writerName,
    memo: report.memo,
    reflectUnitPriceToMaster: report.reflectUnitPriceToMaster,
    medicalInstitutionNumber: report.medicalInstitutionNumber,
    items: report.items.map((item, index) => ({
      ...item,
      rowNo: index + 1,
      totalAmount: item.totalAmount,
    })),
  };
}

function createReportItemFromSearch(
  item: MaterialSearchItem,
  rowNo: number
): MaterialReportItem {
  const prescriptionUserCodeId = Number(item.id || 0) || undefined;
  return {
    id: `item-${Date.now()}-${rowNo}`,
    prescriptionUserCodeId,
    rowNo,
    claimCode: item.claimCode,
    name: item.name,
    specification: item.specification,
    unit: item.unit,
    manufacturer: item.manufacturer ?? "",
    importer: item.importer ?? "",
    upperLimitAmount: item.upperLimitAmount,
    purchaseDate: "",
    purchaseQuantity: 0,
    unitPrice: item.defaultUnitPrice,
    totalAmount: 0,
    prepayType: PrepayType.None,
    vendorName: "",
    vendorBusinessNumber: "",
  };
}

function validateDraftReport(report: MaterialReportDraft): {
  invalidItemFields: Record<string, MaterialReportItemField[]>;
  hasMissingFields: boolean;
} {
  const invalidItemFields: Record<string, MaterialReportItemField[]> = {};
  const hasNoItems = report.items.length === 0;

  report.items.forEach((item) => {
    const invalidFields: MaterialReportItemField[] = [];
    const isPurchaseDateMissing = !item.purchaseDate;
    if (isPurchaseDateMissing) invalidFields.push("purchaseDate");

    const isQuantityInvalid = item.purchaseQuantity <= 0;
    if (isQuantityInvalid) invalidFields.push("purchaseQuantity");

    const isUnitPriceInvalid = item.unitPrice <= 0;
    if (isUnitPriceInvalid) invalidFields.push("unitPrice");

    const isPrepayTypeMissing = item.prepayType === PrepayType.None;
    if (isPrepayTypeMissing) invalidFields.push("prepayType");

    const isVendorNameMissing = item.vendorName.trim().length === 0;
    if (isVendorNameMissing) invalidFields.push("vendorName");

    const isVendorNumberMissing =
      item.vendorBusinessNumber.trim().length === 0;
    if (isVendorNumberMissing) invalidFields.push("vendorBusinessNumber");

    const hasInvalidFields = invalidFields.length > 0;
    if (hasInvalidFields) {
      invalidItemFields[item.id] = invalidFields;
    }
  });

  const hasInvalidItemFields = Object.keys(invalidItemFields).length > 0;
  const hasMissingFields = hasNoItems || hasInvalidItemFields;

  return { invalidItemFields, hasMissingFields };
}
