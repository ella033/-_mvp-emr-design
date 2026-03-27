"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PreparationTypeLabel } from "@/app/claims/(enums)/preparation-report-enums";
import { AdministrationRouteLabel } from "@/app/claims/(enums)/preparation-report-enums";
import type { PreparationReportItem } from "@/types/claims/preparation-report";
import type { PreparationClaimItemFieldKey } from "@/app/claims/_components/claim-api-field-errors";
import { formatNumberWithComma } from "@/lib/number-utils";

type ReportItemsTableProps = {
  items: PreparationReportItem[];
  isSentReport: boolean;
  selectedItemIds: Set<string>;
  claimApiItemFieldMessages?: Partial<
    Record<PreparationClaimItemFieldKey, string>
  >;
  onToggleItem: (itemId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onEditItem: (item: PreparationReportItem) => void;
};

export default function ReportItemsTable({
  items,
  isSentReport,
  selectedItemIds,
  claimApiItemFieldMessages = {},
  onToggleItem,
  onToggleAll,
  onEditItem,
}: ReportItemsTableProps) {
  const totalItems = items.length;
  const selectedCount = selectedItemIds.size;
  const hasItems = totalItems > 0;
  const isAllSelected = hasItems && selectedCount === totalItems;
  const isIndeterminate = hasItems && selectedCount > 0 && !isAllSelected;
  const headerChecked = isAllSelected
    ? true
    : isIndeterminate
      ? "indeterminate"
      : false;

  return (
    <div className="w-full overflow-x-auto rounded-[6px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[#F4F4F5] hover:bg-[#F4F4F5] border-none">
            <TableHead className="w-[40px] px-[8px]">
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={headerChecked}
                  onCheckedChange={(checked) => onToggleAll(Boolean(checked))}
                  disabled={!hasItems || isSentReport}
                  className="h-4 w-4 rounded-[3px] border-[#C2C4C8] data-[state=checked]:bg-[#180F38] data-[state=checked]:border-[#180F38]"
                />
              </div>
            </TableHead>
            <TableHead className="w-[50px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              번호
            </TableHead>
            <TableHead className="w-[70px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              조제/제제
            </TableHead>
            <TableHead className="w-[80px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              투여형태
            </TableHead>
            <TableHead className="w-[90px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              조제/제제코드
            </TableHead>
            <TableHead className="min-w-[160px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              품명
            </TableHead>
            <TableHead className="w-[60px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              규격
            </TableHead>
            <TableHead className="w-[60px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              단위
            </TableHead>
            <TableHead className="w-[80px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              청구가
            </TableHead>
            <TableHead className="w-[100px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              가격적용일
            </TableHead>
            <TableHead className="w-[100px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              신고일
            </TableHead>
            <TableHead className="w-[100px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              주요효능군
            </TableHead>
            <TableHead className="w-[160px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              용법/용량
            </TableHead>
            <TableHead className="w-[120px] text-[12px] font-semibold text-[#292A2D] text-center px-2">
              효능/효과
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={14}
                className="py-8 text-center text-xs text-[#989BA2]"
              >
                등록된 조제·제제약 정보가 없습니다.
              </TableCell>
            </TableRow>
          )}
          {items.map((item) => {
            const isItemSelected = selectedItemIds.has(item.id);
            const codeError = claimApiItemFieldMessages.code;
            const nameError = claimApiItemFieldMessages.name;
            const preparationTypeError = claimApiItemFieldMessages.preparationType;
            const administrationRouteError =
              claimApiItemFieldMessages.administrationRoute;
            const specificationError = claimApiItemFieldMessages.specification;
            const unitError = claimApiItemFieldMessages.unit;
            const claimPriceError = claimApiItemFieldMessages.claimPrice;
            const priceAppliedDateError =
              claimApiItemFieldMessages.priceAppliedDate;
            const reportDateError = claimApiItemFieldMessages.reportDate;
            const mainEfficacyGroupError =
              claimApiItemFieldMessages.mainEfficacyGroup;
            const usageMethodError = claimApiItemFieldMessages.usageMethod;
            const efficacyError = claimApiItemFieldMessages.efficacy;

            return (
              <TableRow
                key={item.id}
                className="hover:bg-[#F8F8F9] border-none cursor-pointer"
                onClick={() => onEditItem(item)}
              >
                <TableCell className="px-[8px] py-2">
                  <div
                    className="flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isItemSelected}
                      onCheckedChange={(checked) =>
                        onToggleItem(item.id, Boolean(checked))
                      }
                      disabled={isSentReport}
                      className="h-4 w-4 rounded-[3px] border-[#C2C4C8] data-[state=checked]:bg-[#180F38] data-[state=checked]:border-[#180F38]"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] text-center px-2 py-2">
                  {item.rowNo}
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] text-center px-2 py-2">
                  <div
                    className={getErrorHighlightClassName(
                      Boolean(preparationTypeError)
                    )}
                    title={preparationTypeError}
                  >
                    {PreparationTypeLabel[item.preparationType]}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] text-center px-2 py-2">
                  <div
                    className={getErrorHighlightClassName(
                      Boolean(administrationRouteError)
                    )}
                    title={administrationRouteError}
                  >
                    {AdministrationRouteLabel[item.administrationRoute]}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] text-center px-2 py-2">
                  <div className={getErrorHighlightClassName(Boolean(codeError))} title={codeError}>
                    {item.code}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] px-2 py-2 truncate max-w-[160px]">
                  <div className={getErrorHighlightClassName(Boolean(nameError))} title={nameError}>
                    {item.name}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] text-center px-2 py-2">
                  <div
                    className={getErrorHighlightClassName(Boolean(specificationError))}
                    title={specificationError}
                  >
                    {item.specification}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] text-center px-2 py-2">
                  <div
                    className={getErrorHighlightClassName(Boolean(unitError))}
                    title={unitError}
                  >
                    {item.unit}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] text-right px-2 py-2">
                  <div className={getErrorHighlightClassName(Boolean(claimPriceError))} title={claimPriceError}>
                    {formatNumberWithComma(item.claimPrice)}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] text-center px-2 py-2">
                  <div
                    className={getErrorHighlightClassName(Boolean(priceAppliedDateError))}
                    title={priceAppliedDateError}
                  >
                    {item.priceAppliedDate}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] text-center px-2 py-2">
                  <div className={getErrorHighlightClassName(Boolean(reportDateError))} title={reportDateError}>
                    {item.reportDate}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] px-2 py-2 truncate max-w-[100px]">
                  <div
                    className={getErrorHighlightClassName(
                      Boolean(mainEfficacyGroupError)
                    )}
                    title={mainEfficacyGroupError}
                  >
                    {item.mainEfficacyGroup}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] px-2 py-2 truncate max-w-[160px]">
                  <div
                    className={getErrorHighlightClassName(Boolean(usageMethodError))}
                    title={usageMethodError}
                  >
                    {item.usageMethod}
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[#46474C] px-2 py-2 truncate max-w-[120px]">
                  <div
                    className={getErrorHighlightClassName(Boolean(efficacyError))}
                    title={efficacyError}
                  >
                    {item.efficacy}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function getErrorHighlightClassName(hasError: boolean): string {
  if (!hasError) return "";
  return "rounded-[4px] border border-[#D94848] bg-[#FFF5F5] px-1";
}
