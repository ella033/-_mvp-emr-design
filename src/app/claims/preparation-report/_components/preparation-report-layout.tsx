"use client";

import { useEffect, useMemo, useState } from "react";
import { useToastHelpers } from "@/components/ui/toast";
import AlertModal from "@/app/claims/commons/alert-modal";
import {
  getDefaultReportDateRange,
} from "@/mocks/claims/preparation-report/mock-data";
import { SendStatus } from "@/app/claims/(enums)/material-report-enums";
import {
  usePreparationReportDetail,
  usePreparationReportSave,
  usePreparationReportSend,
  usePreparationReports,
} from "@/hooks/claims/use-preparation-report";
import {
  PreparationReportService,
  PreparationReportServiceErrors,
} from "@/services/preparation-report-service";
import { useUserStore } from "@/store/user-store";
import type {
  PreparationReport,
  PreparationReportItem,
  UsedMedicine,
  PreparationReportSavePayload,
} from "@/types/claims/preparation-report";
import ReportFormPanel from "./report-form-panel";
import ReportListPanel from "./report-list-panel";

type PreparationReportDraft = Partial<PreparationReportSavePayload> &
  Omit<PreparationReportSavePayload, "id"> & {
    id: string | undefined;
    createdAt?: string;
    sendStatus?: SendStatus;
    claimApiErrorCount?: number;
    claimApiErrors?: string[];
  };

const MISSING_FIELDS_MESSAGE =
  "입력되지 않은 항목이 있습니다.\n입력 후 송신을 진행해주세요.";
const MISSING_WRITER_MESSAGE = "작성자명을 입력해주세요.";
const SAM_PROGRAM_MESSAGE =
  "진료비청구프로그램이 설치되어 있지 않습니다.\n설치 후 송신 진행해주세요.";

export default function PreparationReportLayout() {
  const toastHelpers = useToastHelpers();
  const user = useUserStore((state) => state.user);
  const defaultRange = useMemo(() => getDefaultReportDateRange(), []);
  const [dateRange, setDateRange] = useState(defaultRange);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [checkedReportIds, setCheckedReportIds] = useState<Set<string>>(
    new Set()
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draftReport, setDraftReport] = useState<PreparationReportDraft>(
    createEmptyDraftReport()
  );
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set()
  );
  const [missingFieldAlertOpen, setMissingFieldAlertOpen] = useState(false);
  const [samProgramAlertOpen, setSamProgramAlertOpen] = useState(false);

  const { data: reports = [], isLoading: isReportsLoading } =
    usePreparationReports(dateRange);
  const { data: selectedReport } =
    usePreparationReportDetail(selectedReportId);
  const saveReportMutation = usePreparationReportSave();
  const sendReportMutation = usePreparationReportSend();

  useEffect(
    function hydrateDefaultDraftMetaFromSettings() {
      const hospitalId = Number((user as { hospitalId?: number })?.hospitalId);
      if (!hospitalId) return;

      const hasSelectedReport = Boolean(selectedReportId);
      if (hasSelectedReport) return;

      const isExistingDraft = Boolean(draftReport.id);
      if (isExistingDraft) return;

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
              : PreparationReportService.getDefaultWriterName(hospitalId),
            hasMedicalInstitutionNumber
              ? Promise.resolve("")
              : userHospitalNumber
                ? Promise.resolve(userHospitalNumber)
                : PreparationReportService.getDefaultMedicalInstitutionNumber(
                    hospitalId
                  ),
            hasApplicationNumber
              ? Promise.resolve("")
              : PreparationReportService.getNextApplicationNumber(),
          ]);

        if (isCancelled) return;

        setDraftReport((prev) => {
          const nextWriterName =
            prev.writerName.trim().length > 0
              ? prev.writerName
              : defaultWriterName;
          const nextMedicalInstitutionNumber =
            prev.medicalInstitutionNumber.trim().length > 0
              ? prev.medicalInstitutionNumber
              : hospitalNumberFromApi;
          const nextDraftApplicationNumber =
            prev.applicationNumber.trim().length > 0
              ? prev.applicationNumber
              : nextApplicationNumber;

          return {
            ...prev,
            writerName: nextWriterName,
            medicalInstitutionNumber: nextMedicalInstitutionNumber,
            applicationNumber: nextDraftApplicationNumber,
          };
        });
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

  useEffect(
    function syncDraftFromSelection() {
      const hasSelectedReport =
        Boolean(selectedReportId) && Boolean(selectedReport);
      if (!hasSelectedReport) return;
      const selectedReportSummary = reports.find(
        (report) => report.id === selectedReportId
      );
      setDraftReport((prev) =>
        toDraftReport(
          selectedReport as PreparationReport,
          selectedReportSummary?.claimApiErrors ?? prev.claimApiErrors ?? [],
          selectedReportSummary?.claimApiErrorCount
        )
      );
      setSelectedItemIds(new Set());
      setIsCreatingNew(false);
    },
    [selectedReportId, selectedReport?.id, reports]
  );

  useEffect(
    function syncSelectionFromList() {
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
    },
    [reports, selectedReportId, isCreatingNew]
  );

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
      await PreparationReportService.getNextApplicationNumber();
    setIsCreatingNew(true);
    setSelectedReportId(null);
    setDraftReport(
      createEmptyDraftReport({
        applicationNumber: nextApplicationNumber,
      })
    );
    setSelectedItemIds(new Set());
  };

  const handleDraftFieldChange = <T extends keyof PreparationReportDraft>(
    field: T,
    value: PreparationReportDraft[T]
  ) => {
    setDraftReport((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddItem = (item: PreparationReportItem) => {
    setDraftReport((prev) => ({
      ...prev,
      items: [...prev.items, { ...item, rowNo: prev.items.length + 1 }],
    }));
  };

  const handleUpdateItem = (updatedItem: PreparationReportItem) => {
    setDraftReport((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      ),
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
      toastHelpers.info("송신 완료된 내역서는 삭제할 수 없습니다.");
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
    const validationErrorMessage = validateReportBeforeSave(draftReport);
    if (validationErrorMessage) {
      toastHelpers.info(validationErrorMessage);
      return;
    }

    const payload = toSavePayload(draftReport);
    try {
      const saved = await saveReportMutation.mutateAsync(payload);
      setDraftReport(toDraftReport(saved));
      setSelectedReportId(saved.id);
      setIsCreatingNew(false);
      const hasClaimApiErrors = (saved.claimApiErrorCount ?? 0) > 0;
      if (hasClaimApiErrors) {
        const firstClaimApiError = saved.claimApiErrors?.[0];
        const errorMessage = firstClaimApiError
          ? `검증 오류 ${saved.claimApiErrorCount}건: ${firstClaimApiError}`
          : `검증 오류 ${saved.claimApiErrorCount}건이 있습니다.`;
        toastHelpers.info(errorMessage);
      } else {
        toastHelpers.success("저장되었습니다.");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "저장에 실패했습니다.";
      toastHelpers.error(errorMessage);
    }
  };

  const handleSend = async () => {
    const isAlreadySent = draftReport.sendStatus === SendStatus.Sent;
    if (isAlreadySent) {
      toastHelpers.info("이미 송신된 내역서입니다.");
      return;
    }

    const hasNoItems = draftReport.items.length === 0;
    if (hasNoItems) {
      setMissingFieldAlertOpen(true);
      return;
    }

    const validationErrorMessage = validateReportBeforeSave(draftReport);
    if (validationErrorMessage) {
      toastHelpers.info(validationErrorMessage);
      return;
    }

    try {
      const shouldSaveBeforeSend = !draftReport.id;
      const savedReport = shouldSaveBeforeSend
        ? await saveReportMutation.mutateAsync(toSavePayload(draftReport))
        : draftReport;
      await sendReportMutation.mutateAsync(savedReport.id!);
      setDraftReport((prev) => ({
        ...prev,
        id: savedReport.id,
        sendStatus: SendStatus.Sent,
      }));
      toastHelpers.success("송신되었습니다.");
    } catch (error) {
      const isSamProgramError =
        error instanceof Error &&
        error.message === PreparationReportServiceErrors.SAM_NOT_INSTALLED;
      if (isSamProgramError) {
        setSamProgramAlertOpen(true);
        return;
      }
      const errorMessage =
        error instanceof Error && error.message
          ? error.message
          : "송신에 실패했습니다.";
      toastHelpers.error(errorMessage);
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
          onDraftFieldChange={handleDraftFieldChange}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
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
  params?: Partial<Pick<PreparationReportDraft, "applicationNumber">>
): PreparationReportDraft {
  return {
    id: undefined,
    applicationNumber: params?.applicationNumber ?? "",
    writerName: "",
    memo: "",
    medicalInstitutionNumber: "",
    items: [],
    claimApiErrorCount: 0,
    claimApiErrors: [],
  };
}

function toDraftReport(
  report: PreparationReport,
  fallbackClaimApiErrors: string[] = [],
  fallbackClaimApiErrorCount?: number
): PreparationReportDraft {
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
    medicalInstitutionNumber: report.medicalInstitutionNumber,
    items: report.items.map((item) => ({
      ...item,
      usedMedicines: item.usedMedicines.map((med) => ({ ...med })),
    })),
    claimApiErrorCount,
    claimApiErrors,
  };
}

function toSavePayload(
  report: PreparationReportDraft
): PreparationReportSavePayload {
  return {
    id: report.id!,
    applicationNumber: report.applicationNumber,
    writerName: report.writerName,
    memo: report.memo,
    medicalInstitutionNumber: report.medicalInstitutionNumber,
    items: report.items.map((item, index) => ({
      ...item,
      rowNo: index + 1,
    })),
  };
}

function validateReportBeforeSave(
  report: PreparationReportDraft
): string | null {
  if (!report.writerName.trim()) return MISSING_WRITER_MESSAGE;
  if (!report.applicationNumber.trim()) return "신청번호를 확인해주세요.";
  if (!report.medicalInstitutionNumber.trim()) return "요양기관번호를 확인해주세요.";
  if (report.items.length === 0) return "조제 · 제제약 정보를 1건 이상 등록해주세요.";

  for (const [index, item] of report.items.entries()) {
    const prefix = `${index + 1}번째 조제 · 제제약`;

    if (!item.preparationType) return `${prefix}의 조제/제제를 입력해주세요.`;
    if (!item.administrationRoute || item.administrationRoute === "ALL") {
      return `${prefix}의 투여형태를 입력해주세요.`;
    }
    if (!item.code.trim()) return `${prefix}의 코드를 입력해주세요.`;
    if (!item.name.trim()) return `${prefix}의 품명을 입력해주세요.`;
    if (!item.specification.trim()) return `${prefix}의 규격을 입력해주세요.`;
    if (!item.unit.trim()) return `${prefix}의 단위를 입력해주세요.`;
    if (item.claimPrice <= 0) return `${prefix}의 청구가를 입력해주세요.`;
    if (!item.priceAppliedDate.trim()) {
      return `${prefix}의 가격적용일을 입력해주세요.`;
    }
    if (!item.reportDate.trim()) return `${prefix}의 신고일을 입력해주세요.`;
    if (!item.mainEfficacyGroup.trim()) {
      return `${prefix}의 주요효능군을 입력해주세요.`;
    }
    const medicineValidationError = validateUsedMedicines(
      item.usedMedicines,
      prefix
    );
    if (medicineValidationError) return medicineValidationError;
  }

  return null;
}

function validateUsedMedicines(
  medicines: UsedMedicine[],
  itemPrefix: string
): string | null {
  for (const [index, medicine] of medicines.entries()) {
    const prefix = `${itemPrefix}의 사용의약품 ${index + 1}번째`;

    if (!medicine.code.trim()) return `${prefix} 코드가 비어있습니다.`;
    if (!medicine.name.trim()) return `${prefix} 품명이 비어있습니다.`;
    if (!medicine.specification.trim()) return `${prefix} 규격이 비어있습니다.`;
    if (!medicine.unit.trim()) return `${prefix} 단위가 비어있습니다.`;
    if (!medicine.purchaseDate.trim()) return `${prefix} 구입일이 비어있습니다.`;
    if (!medicine.vendor.trim()) return `${prefix} 구입처가 비어있습니다.`;
    if (!medicine.vendorBusinessNumber.trim()) {
      return `${prefix} 사업자등록번호가 비어있습니다.`;
    }
    if (!medicine.quantityUnit.trim()) {
      return `${prefix} 분량당단위가 비어있습니다.`;
    }
    if (medicine.unitPrice <= 0) return `${prefix} 단위당가격을 입력해주세요.`;
    if (medicine.quantity <= 0) return `${prefix} 분량을 입력해주세요.`;
    if (medicine.quantityPrice <= 0) {
      return `${prefix} 분량당가격을 입력해주세요.`;
    }
  }

  return null;
}
