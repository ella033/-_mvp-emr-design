"use client";

import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BubbleTooltip } from "@/components/ui/bubble-tooltip";
import { SendStatus } from "@/app/claims/(enums)/material-report-enums";
import {
  mapClaimApiErrorsToFieldMessages,
  mapMaterialClaimApiErrorsToItemFieldMessages,
} from "@/app/claims/_components/claim-api-field-errors";
import type {
  MaterialReportItem,
  MaterialReportSavePayload,
  MaterialSearchItem,
  MaterialReportItemField,
} from "@/types/claims/material-report";
import { formatNumberWithComma } from "@/lib/number-utils";
import ReportItemsTable from "@/app/claims/material-report/_components/report-items-table";

type ReportFormPanelReport = Partial<MaterialReportSavePayload> &
  Omit<MaterialReportSavePayload, "id"> & {
    id: string | undefined;
    createdAt?: string;
    sendStatus?: SendStatus;
    claimApiErrors?: string[];
  };

type ReportFormPanelProps = {
  report: ReportFormPanelReport;
  isSentReport: boolean;
  selectedItemIds: Set<string>;
  invalidItemFields: Record<string, MaterialReportItemField[]>;
  onDraftFieldChange: <T extends keyof ReportFormPanelReport>(
    field: T,
    value: ReportFormPanelReport[T]
  ) => void;
  onItemFieldChange: (
    itemId: string,
    field: keyof MaterialReportItem,
    value: MaterialReportItem[keyof MaterialReportItem]
  ) => void;
  onAddItemFromSearch: (item: MaterialSearchItem) => void;
  onToggleItem: (itemId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onDeleteItems: () => void;
  onCreateNew: () => void;
  onSave: () => void;
  onSend: () => void;
  isSaving: boolean;
  isSending: boolean;
};

const UNIT_PRICE_TOOLTIP =
  "작성한 구입내역 송신 시 입력한 구입단가(개당단가)가 기초자료에 반영됩니다.\n실 구입단가가 상한금액(보험가)보다 큰 경우 체크를 해제하여 주세요.";

export default function ReportFormPanel({
  report,
  isSentReport,
  selectedItemIds,
  invalidItemFields,
  onDraftFieldChange,
  onItemFieldChange,
  onAddItemFromSearch,
  onToggleItem,
  onToggleAll,
  onDeleteItems,
  onCreateNew,
  onSave,
  onSend,
  isSaving,
  isSending,
}: ReportFormPanelProps) {
  const totalItemCount = report.items.length;
  const totalItemCountLabel = `${formatNumberWithComma(totalItemCount)}`;
  const sendButtonDisabled = isSending || isSentReport;
  const saveButtonDisabled = isSaving;
  const claimApiFieldMessages = mapClaimApiErrorsToFieldMessages(
    report.claimApiErrors
  );
  const claimApiItemFieldMessages = mapMaterialClaimApiErrorsToItemFieldMessages(
    report.claimApiErrors
  );

  return (
    <div className="flex h-full flex-1 flex-col gap-3 border border-border p-3 shadow-sm bg-[#f4f4f5]">
      <div className="w-full h-full bg-white border border-[#DBDCDF] rounded-[6px] p-[16px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-bold text-[#171719]">
                치료재료대 구입정보
              </span>
              <BubbleTooltip content="미소몰 연동 준비중입니다.">
                <div className="flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-[12px] text-[#989BA2] hover:bg-transparent hover:text-[#171719]"
                    disabled
                  >
                    <img
                      src="/icon/ic_line_repeat.svg"
                      alt=""
                      className="h-4 w-4 opacity-60"
                    />
                    미소몰 구입정보 불러오기
                  </Button>
                </div>
              </BubbleTooltip>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="reflect-unit-price"
                  checked={report.reflectUnitPriceToMaster}
                  onCheckedChange={(checked) =>
                    onDraftFieldChange(
                      "reflectUnitPriceToMaster",
                      Boolean(checked)
                    )
                  }
                  className="h-4 w-4 rounded-[3px] border-[#C2C4C8] data-[state=checked]:bg-[#180F38] data-[state=checked]:border-[#180F38]"
                />
                <label
                  htmlFor="reflect-unit-price"
                  className="text-[13px] font-medium text-[#70737C] cursor-pointer"
                >
                  구입 단가 기초자료 반영
                </label>
                <BubbleTooltip content={UNIT_PRICE_TOOLTIP}>
                  <CircleHelp className="h-4 w-4 text-[#989BA2] cursor-help" />
                </BubbleTooltip>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-4 text-[13px] font-semibold border-[#DBDCDF] text-[#46474C] hover:bg-[#F4F4F5]"
                  onClick={onCreateNew}
                >
                  새로작성
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-4 text-[13px] font-semibold border-[#DBDCDF] text-[#46474C] hover:bg-[#F4F4F5]"
                  onClick={onSave}
                  disabled={saveButtonDisabled}
                >
                  {isSaving ? "저장중" : "저장"}
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-4 text-[13px] font-semibold bg-[#180F38] text-white hover:bg-[#180F38]/90 shadow-none"
                  onClick={onSend}
                  disabled={sendButtonDisabled}
                >
                  {isSending ? "송신중" : "송신"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_1fr_2fr] gap-4 rounded-[6px] bg-[#F7F7F8] p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-[#70737C]">요양기관번호</span>
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
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-[#70737C]">작성자</span>
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
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium text-[#70737C]">신청번호</span>
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
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] font-medium text-[#70737C]">메모</span>
              <Textarea
                value={report.memo}
                onChange={(event) =>
                  onDraftFieldChange("memo", event.target.value)
                }
                className={`min-h-[86px] text-[13px] text-[#989BA2] focus-visible:ring-1 resize-none ${
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

        <div className="flex items-center justify-between mt-4 text-[14px] font-normal leading-[1.25] -tracking-[0.01em] text-[#292A2D] h-[32px]">
          <span>총 <span className="font-bold">{totalItemCountLabel}</span>건</span>
          <Button
            variant="outline"
            size="sm"
            className="h-full px-3 text-[13px] font-medium leading-[125%] -tracking-[0.13px] text-[#171719] border-[#DBDCDF] bg-[#FFF] rounded-[4px]"
            onClick={onDeleteItems}
          // disabled={deleteButtonDisabled}
          >
            삭제
          </Button>
        </div>

        <ReportItemsTable
          items={report.items}
          isSentReport={isSentReport}
          selectedItemIds={selectedItemIds}
          invalidItemFields={invalidItemFields}
          claimApiItemFieldMessages={claimApiItemFieldMessages}
          onItemFieldChange={onItemFieldChange}
          onAddItem={onAddItemFromSearch}
          onToggleItem={onToggleItem}
          onToggleAll={onToggleAll}
        />
      </div>
    </div >
  );
}

