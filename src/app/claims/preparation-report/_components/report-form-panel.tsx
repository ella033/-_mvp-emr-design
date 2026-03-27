"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendStatus } from "@/app/claims/(enums)/material-report-enums";
import {
  mapClaimApiErrorsToFieldMessages,
  mapPreparationClaimApiErrorsToItemFieldMessages,
} from "@/app/claims/_components/claim-api-field-errors";
import type {
  PreparationReportItem,
  PreparationReportSavePayload,
} from "@/types/claims/preparation-report";
import { formatNumberWithComma } from "@/lib/number-utils";
import ReportItemsTable from "./report-items-table";
import AddItemDialog from "./add-item-dialog";

type ReportFormPanelReport = Partial<PreparationReportSavePayload> &
  Omit<PreparationReportSavePayload, "id"> & {
    id: string | undefined;
    createdAt?: string;
    sendStatus?: SendStatus;
    claimApiErrors?: string[];
  };

type ReportFormPanelProps = {
  report: ReportFormPanelReport;
  isSentReport: boolean;
  selectedItemIds: Set<string>;
  onDraftFieldChange: <T extends keyof ReportFormPanelReport>(
    field: T,
    value: ReportFormPanelReport[T]
  ) => void;
  onAddItem: (item: PreparationReportItem) => void;
  onUpdateItem: (item: PreparationReportItem) => void;
  onToggleItem: (itemId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onDeleteItems: () => void;
  onCreateNew: () => void;
  onSave: () => void;
  onSend: () => void;
  isSaving: boolean;
  isSending: boolean;
};

export default function ReportFormPanel({
  report,
  isSentReport,
  selectedItemIds,
  onDraftFieldChange,
  onAddItem,
  onUpdateItem,
  onToggleItem,
  onToggleAll,
  onDeleteItems,
  onCreateNew,
  onSave,
  onSend,
  isSaving,
  isSending,
}: ReportFormPanelProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PreparationReportItem | null>(
    null
  );

  const totalItemCount = report.items.length;
  const totalItemCountLabel = formatNumberWithComma(totalItemCount);
  const sendButtonDisabled = isSending || isSentReport;
  const saveButtonDisabled = isSaving;
  const claimApiFieldMessages = mapClaimApiErrorsToFieldMessages(
    report.claimApiErrors
  );
  const claimApiItemFieldMessages =
    mapPreparationClaimApiErrorsToItemFieldMessages(report.claimApiErrors);

  const handleOpenAddDialog = () => {
    setEditingItem(null);
    setAddDialogOpen(true);
  };

  const handleEditItem = (item: PreparationReportItem) => {
    setEditingItem(item);
    setAddDialogOpen(true);
  };

  const handleDialogConfirm = (item: PreparationReportItem) => {
    const isEditing = editingItem !== null;
    if (isEditing) {
      onUpdateItem(item);
    } else {
      onAddItem(item);
    }
    setAddDialogOpen(false);
    setEditingItem(null);
  };

  const handleDialogClose = () => {
    setAddDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="flex h-full flex-1 flex-col gap-3 border border-border p-3 shadow-sm bg-[#f4f4f5]">
      <div className="w-full h-full bg-white border border-[#DBDCDF] rounded-[6px] p-[16px] flex flex-col overflow-hidden">
        <div className="flex flex-col gap-4 shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[18px] font-bold text-[#171719]">
              요양기관 자체 조제 · 제제약 정보
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-[13px] font-medium tracking-[-0.13px] border-[#c2c4c8] text-[#171719] hover:bg-[#F4F4F5]"
                onClick={onCreateNew}
              >
                새로작성
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-[13px] font-medium tracking-[-0.13px] border-[#c2c4c8] text-[#171719] hover:bg-[#F4F4F5]"
                onClick={onSave}
                disabled={saveButtonDisabled}
              >
                {isSaving ? "저장중" : "저장"}
              </Button>
              <Button
                size="sm"
                className="h-8 px-3 text-[13px] font-medium tracking-[-0.13px] bg-[#180F38] text-white hover:bg-[#180F38]/90 shadow-none"
                onClick={onSend}
                disabled={sendButtonDisabled}
              >
                {isSending ? "송신중" : "송신"}
              </Button>
            </div>
          </div>

          {/* Form Fields - single row layout */}
          <div className="rounded-[6px] bg-[#F7F7F8] p-4">
            <div className="flex gap-4">
              <div className="flex flex-col gap-1.5 flex-1">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <span className="text-[12px] font-medium text-[#70737C]">
                      요양기관번호
                    </span>
                    <Input
                      value={report.medicalInstitutionNumber}
                      disabled
                      className={`h-[32px] text-[13px] bg-[#EAEBEC] text-[#989BA2] ${
                        claimApiFieldMessages.medicalInstitutionNumber
                          ? "border-[#D94848]"
                          : "border-[#C2C4C8]"
                      }`}
                      title={claimApiFieldMessages.medicalInstitutionNumber}
                      placeholder="요양기관번호"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <span className="text-[12px] font-medium text-[#70737C]">
                      신청번호
                    </span>
                    <Input
                      value={report.applicationNumber || ""}
                      disabled
                      className={`h-[32px] text-[13px] bg-[#EAEBEC] text-[#989BA2] ${
                        claimApiFieldMessages.applicationNumber
                          ? "border-[#D94848]"
                          : "border-[#C2C4C8]"
                      }`}
                      title={claimApiFieldMessages.applicationNumber}
                      placeholder="신청번호"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <span className="text-[12px] font-medium text-[#70737C]">
                      작성자
                    </span>
                    <Input
                      value={report.writerName}
                      onChange={(event) =>
                        onDraftFieldChange("writerName", event.target.value)
                      }
                      className={`h-[32px] text-[13px] text-[#989BA2] focus-visible:ring-1 ${
                        claimApiFieldMessages.writerName
                          ? "border-[#D94848] focus-visible:ring-[#D94848]"
                          : "border-[#C2C4C8] focus-visible:ring-[#180F38]"
                      }`}
                      title={claimApiFieldMessages.writerName}
                      placeholder="작성자"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <span className="text-[12px] font-medium text-[#70737C]">
                  메모
                </span>
                <Input
                  value={report.memo}
                  onChange={(event) =>
                    onDraftFieldChange("memo", event.target.value)
                  }
                  className={`h-[32px] text-[13px] text-[#989BA2] focus-visible:ring-1 ${
                    claimApiFieldMessages.memo
                      ? "border-[#D94848] focus-visible:ring-[#D94848]"
                      : "border-[#C2C4C8] focus-visible:ring-[#180F38]"
                  }`}
                  title={claimApiFieldMessages.memo}
                  placeholder="메모입력"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Item count + action buttons */}
        <div className="flex items-center justify-between mt-4 text-[14px] font-normal leading-[1.25] -tracking-[0.01em] text-[#292A2D] h-[32px] shrink-0">
          <span>
            총 <span className="font-bold">{totalItemCountLabel}</span>건
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-full px-3 text-[13px] font-medium border-[#180F38] text-[#180F38] bg-white rounded-[4px] hover:bg-[#F4F4F5]"
              onClick={handleOpenAddDialog}
              disabled={isSentReport}
            >
              조제 · 제제약 정보 등록
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-full px-3 text-[13px] font-medium text-[#171719] border-[#DBDCDF] bg-[#FFF] rounded-[4px]"
              onClick={onDeleteItems}
              disabled={isSentReport || selectedItemIds.size === 0}
            >
              삭제
            </Button>
          </div>
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-auto mt-2">
          <ReportItemsTable
            items={report.items}
            isSentReport={isSentReport}
            selectedItemIds={selectedItemIds}
            claimApiItemFieldMessages={claimApiItemFieldMessages}
            onToggleItem={onToggleItem}
            onToggleAll={onToggleAll}
            onEditItem={handleEditItem}
          />
        </div>
      </div>

      <AddItemDialog
        open={addDialogOpen}
        onOpenChange={handleDialogClose}
        editingItem={editingItem}
        onConfirm={handleDialogConfirm}
      />
    </div>
  );
}
