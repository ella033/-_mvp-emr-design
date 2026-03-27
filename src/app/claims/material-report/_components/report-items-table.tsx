"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PREPAY_TYPE_OPTIONS,
  PrepayType,
} from "@/app/claims/(enums)/material-report-enums";
import type {
  MaterialReportItem,
  MaterialReportItemField,
  MaterialSearchItem,
} from "@/types/claims/material-report";
import type { MaterialClaimItemFieldKey } from "@/app/claims/_components/claim-api-field-errors";
import {
  formatNumberWithComma,
  parseNumberInput,
} from "@/lib/number-utils";
import MaterialSearchActionRow from "./material-search-action-row";

type ReportItemsTableProps = {
  items: MaterialReportItem[];
  isSentReport: boolean;
  selectedItemIds: Set<string>;
  invalidItemFields: Record<string, MaterialReportItemField[]>;
  claimApiItemFieldMessages?: Partial<Record<MaterialClaimItemFieldKey, string>>;
  onItemFieldChange: (
    itemId: string,
    field: keyof MaterialReportItem,
    value: MaterialReportItem[keyof MaterialReportItem]
  ) => void;
  onAddItem: (item: MaterialSearchItem) => void;
  onToggleItem: (itemId: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
};

export default function ReportItemsTable({
  items,
  isSentReport,
  selectedItemIds,
  invalidItemFields,
  claimApiItemFieldMessages = {},
  onItemFieldChange,
  onAddItem,
  onToggleItem,
  onToggleAll,
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
  const isEditable = !isSentReport;

  return (
    <div className="w-full overflow-x-auto rounded-t-[6px] mt-[16px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-[var(--bg-2)] hover:bg-[var(--bg-2)] border-none">
            <TableHead className="p-0" style={{ width: '28px', minWidth: '28px', maxWidth: '28px' }}>
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={headerChecked}
                  onCheckedChange={(checked) =>
                    onToggleAll(Boolean(checked))
                  }
                  disabled={!hasItems || isSentReport}
                  className="h-4 w-4 rounded-[3px] border-[var(--gray-700)] data-[state=checked]:bg-[var(--main-color)] data-[state=checked]:border-[var(--main-color)]"
                />
              </div>
            </TableHead>
            <TableHead className="w-[60px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">줄번호</TableHead>
            <TableHead className="w-[100px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">청구코드</TableHead>
            <TableHead className="min-w-[180px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">품명</TableHead>
            <TableHead className="w-[80px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">규격</TableHead>
            <TableHead className="w-[60px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">단위</TableHead>
            <TableHead className="w-[100px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">상한금액</TableHead>
            <TableHead className="w-[120px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">구입일자</TableHead>
            <TableHead className="w-[80px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">구입량</TableHead>
            <TableHead className="w-[100px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">개당단가</TableHead>
            <TableHead className="w-[120px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">총실구입가</TableHead>
            <TableHead className="w-[100px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">선납구분</TableHead>
            <TableHead className="w-[140px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">구입처 상호</TableHead>
            <TableHead className="w-[150px] text-[12px] font-semibold text-[var(--gray-200)] text-center px-2">
              구입처 사업자등록번호
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const invalidFields = invalidItemFields[item.id] ?? [];
            const isPurchaseDateInvalid =
              invalidFields.includes("purchaseDate");
            const isQuantityInvalid =
              invalidFields.includes("purchaseQuantity");
            const isUnitPriceInvalid = invalidFields.includes("unitPrice");
            const isPrepayInvalid = invalidFields.includes("prepayType");
            const isVendorNameInvalid =
              invalidFields.includes("vendorName");
            const isVendorNumberInvalid =
              invalidFields.includes("vendorBusinessNumber");
            const purchaseDateError = claimApiItemFieldMessages.purchaseDate;
            const purchaseQuantityError =
              claimApiItemFieldMessages.purchaseQuantity;
            const unitPriceError = claimApiItemFieldMessages.unitPrice;
            const claimCodeError = claimApiItemFieldMessages.claimCode;
            const nameError = claimApiItemFieldMessages.name;
            const specificationError = claimApiItemFieldMessages.specification;
            const unitError = claimApiItemFieldMessages.unit;
            const upperLimitAmountError =
              claimApiItemFieldMessages.upperLimitAmount;
            const totalAmountError = claimApiItemFieldMessages.totalAmount;
            const prepayTypeError = claimApiItemFieldMessages.prepayType;
            const vendorNameError = claimApiItemFieldMessages.vendorName;
            const vendorBusinessNumberError =
              claimApiItemFieldMessages.vendorBusinessNumber;
            const isItemSelected = selectedItemIds.has(item.id);

            return (
              <TableRow key={item.id} className="hover:bg-[var(--bg-1)] border-none">
                <TableCell className="p-0" style={{ width: '28px', minWidth: '28px', maxWidth: '28px' }}>
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isItemSelected}
                      onCheckedChange={(checked) =>
                        onToggleItem(item.id, Boolean(checked))
                      }
                      disabled={isSentReport}
                      className="h-4 w-4 rounded-[3px] border-[var(--gray-700)] data-[state=checked]:bg-[var(--main-color)] data-[state=checked]:border-[var(--main-color)]"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-[13px] text-[var(--gray-300)] text-center px-2 py-1">{item.rowNo}</TableCell>
                <TableCell className="px-2 py-1">
                  <Input
                    value={item.claimCode}
                    disabled
                    className={getReadonlyInputClassName(Boolean(claimCodeError))}
                    title={claimCodeError}
                  />
                </TableCell>
                <TableCell className="px-2 py-2">
                  <Input
                    value={item.name}
                    disabled
                    className={getReadonlyInputClassName(Boolean(nameError))}
                    title={nameError}
                  />
                </TableCell>
                <TableCell className="px-2 py-2">
                  <Input
                    value={item.specification}
                    onChange={(event) =>
                      onItemFieldChange(
                        item.id,
                        "specification",
                        event.target.value
                      )
                    }
                    className={getInputClassName(Boolean(specificationError))}
                    title={specificationError}
                  />
                </TableCell>
                <TableCell className="px-2 py-2">
                  <Input
                    value={item.unit}
                    onChange={(event) =>
                      onItemFieldChange(item.id, "unit", event.target.value)
                    }
                    className={getInputClassName(Boolean(unitError))}
                    title={unitError}
                  />
                </TableCell>
                <TableCell className="px-2 py-2">
                  <Input
                    value={formatNumberWithComma(item.upperLimitAmount)}
                    onChange={(event) =>
                      onItemFieldChange(
                        item.id,
                        "upperLimitAmount",
                        parseNumberInput(event.target.value)
                      )
                    }
                    className={getInputClassName(
                      Boolean(upperLimitAmountError),
                      true
                    )}
                    title={upperLimitAmountError}
                  />
                </TableCell>
                <TableCell className="px-2 py-2">
                  <Input
                    value={item.purchaseDate}
                    onChange={(event) =>
                      onItemFieldChange(
                        item.id,
                        "purchaseDate",
                        normalizePurchaseDateInput(event.target.value)
                      )
                    }
                    inputMode="numeric"
                    maxLength={8}
                    className={getInputClassName(
                      isPurchaseDateInvalid || Boolean(purchaseDateError)
                    )}
                    title={purchaseDateError}
                    placeholder="YYYYMMDD"
                  />
                </TableCell>
                <TableCell className="px-2 py-2">
                  <Input
                    value={formatNumberWithComma(item.purchaseQuantity)}
                    onChange={(event) =>
                      onItemFieldChange(
                        item.id,
                        "purchaseQuantity",
                        parseNumberInput(event.target.value)
                      )
                    }
                    className={getInputClassName(
                      isQuantityInvalid || Boolean(purchaseQuantityError)
                    )}
                    title={purchaseQuantityError}
                  />
                </TableCell>
                <TableCell className="px-2 py-2">
                  <Input
                    value={formatNumberWithComma(item.unitPrice)}
                    onChange={(event) =>
                      onItemFieldChange(
                        item.id,
                        "unitPrice",
                        parseNumberInput(event.target.value)
                      )
                    }
                    className={getInputClassName(
                      isUnitPriceInvalid || Boolean(unitPriceError)
                    )}
                    title={unitPriceError}
                  />
                </TableCell>
                <TableCell className="px-2 py-2">
                  <Input
                    value={formatNumberWithComma(item.totalAmount)}
                    onChange={(event) =>
                      onItemFieldChange(
                        item.id,
                        "totalAmount",
                        parseNumberInput(event.target.value)
                      )
                    }
                    className={getInputClassName(Boolean(totalAmountError), true)}
                    title={totalAmountError}
                  />
                </TableCell>
                <TableCell className="px-2 py-1">
                  <Select
                    value={item.prepayType}
                    onValueChange={(value) =>
                      onItemFieldChange(
                        item.id,
                        "prepayType",
                        value as PrepayType
                      )
                    }
                    disabled={!isEditable}
                  >
                    <SelectTrigger
                      className={
                        getInputClassName(
                          isPrepayInvalid || Boolean(prepayTypeError)
                        ) + " w-full"
                      }
                      title={prepayTypeError}
                    >
                      <SelectValue placeholder="선납구분" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {PREPAY_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="px-2 py-2">
                  <Input
                    value={item.vendorName}
                    onChange={(event) =>
                      onItemFieldChange(
                        item.id,
                        "vendorName",
                        event.target.value
                      )
                    }
                    className={getInputClassName(
                      isVendorNameInvalid || Boolean(vendorNameError)
                    )}
                    title={vendorNameError}
                    placeholder="구입처 상호"
                  />
                </TableCell>
                <TableCell className="px-2 py-2">
                  <Input
                    value={item.vendorBusinessNumber}
                    onChange={(event) =>
                      onItemFieldChange(
                        item.id,
                        "vendorBusinessNumber",
                        event.target.value
                      )
                    }
                    className={getInputClassName(
                      isVendorNumberInvalid || Boolean(vendorBusinessNumberError)
                    )}
                    title={vendorBusinessNumberError}
                    placeholder="사업자번호"
                  />
                </TableCell>
              </TableRow>
            );
          })}
          <MaterialSearchActionRow
            onAddItem={onAddItem}
            isSentReport={isSentReport}
          />
        </TableBody>
      </Table>
    </div>
  );
}

function getInputClassName(
  isInvalid: boolean,
  alignRight: boolean = false
): string {
  const baseClass = "h-[26px] text-[13px] border-[var(--border-1)] text-[var(--gray-300)] px-2 focus-visible:ring-1 focus-visible:ring-[var(--main-color)]";
  const invalidClass = isInvalid ? "border-[var(--negative)] bg-[var(--red-1)]" : "";
  const alignClass = alignRight ? "text-right" : "";
  return `${baseClass} ${invalidClass} ${alignClass}`.trim();
}

function getReadonlyInputClassName(
  isInvalid: boolean,
  alignRight: boolean = false
): string {
  const baseClass =
    "h-[26px] text-[13px] border-[var(--border-1)] bg-[var(--bg-2)] text-[var(--gray-300)] px-2";
  const invalidClass = isInvalid ? "border-[var(--negative)] bg-[var(--red-1)]" : "";
  const alignClass = alignRight ? "text-right" : "text-center";
  return `${baseClass} ${invalidClass} ${alignClass}`.trim();
}

function normalizePurchaseDateInput(rawValue: string): string {
  return rawValue.replace(/\D/g, "").slice(0, 8);
}
