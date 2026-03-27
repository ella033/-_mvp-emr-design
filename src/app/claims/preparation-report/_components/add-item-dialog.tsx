"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import InputDate from "@/components/ui/input-date";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PreparationType,
  PREPARATION_TYPE_OPTIONS,
  AdministrationRoute,
  ADMINISTRATION_ROUTE_OPTIONS,
  CodeCategory,
  CODE_CATEGORY_OPTIONS,
} from "@/app/claims/(enums)/preparation-report-enums";
import type {
  PreparationReportItem,
  UsedMedicine,
} from "@/types/claims/preparation-report";

type AddItemDialogProps = {
  open: boolean;
  onOpenChange: () => void;
  editingItem: PreparationReportItem | null;
  onConfirm: (item: PreparationReportItem) => void;
};

type ItemDraft = {
  preparationType: PreparationType | "";
  administrationRoute: AdministrationRoute;
  code: string;
  name: string;
  specification: string;
  unit: string;
  claimPrice: string;
  priceAppliedDate: string;
  reportDate: string;
  mainEfficacyGroup: string;
  usageMethod: string;
  efficacy: string;
};

const EMPTY_ITEM_DRAFT: ItemDraft = {
  preparationType: "",
  administrationRoute: AdministrationRoute.All,
  code: "",
  name: "",
  specification: "",
  unit: "",
  claimPrice: "",
  priceAppliedDate: "",
  reportDate: "",
  mainEfficacyGroup: "",
  usageMethod: "",
  efficacy: "",
};

export default function AddItemDialog({
  open,
  onOpenChange,
  editingItem,
  onConfirm,
}: AddItemDialogProps) {
  const [draft, setDraft] = useState<ItemDraft>(EMPTY_ITEM_DRAFT);
  const [medicines, setMedicines] = useState<UsedMedicine[]>([]);
  const [selectedMedicineIds, setSelectedMedicineIds] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!open) return;
    if (editingItem) {
      setDraft({
        preparationType: editingItem.preparationType,
        administrationRoute: editingItem.administrationRoute,
        code: editingItem.code,
        name: editingItem.name,
        specification: editingItem.specification,
        unit: editingItem.unit,
        claimPrice: String(editingItem.claimPrice),
        priceAppliedDate: editingItem.priceAppliedDate,
        reportDate: editingItem.reportDate,
        mainEfficacyGroup: editingItem.mainEfficacyGroup,
        usageMethod: editingItem.usageMethod,
        efficacy: editingItem.efficacy,
      });
      setMedicines(
        editingItem.usedMedicines.map((med) => ({ ...med }))
      );
    } else {
      setDraft(EMPTY_ITEM_DRAFT);
      setMedicines([]);
    }
    setSelectedMedicineIds(new Set());
  }, [open, editingItem]);

  const handleDraftChange = <T extends keyof ItemDraft>(
    field: T,
    value: ItemDraft[T]
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddMedicine = () => {
    const newMedicine: UsedMedicine = {
      id: `med-${Date.now()}`,
      code: "",
      name: "",
      codeCategory: CodeCategory.InsuredDrug,
      specification: "",
      unit: "",
      manufacturer: "",
      purchaseDate: "",
      vendor: "",
      vendorBusinessNumber: "",
      unitPrice: 0,
      quantity: 0,
      quantityUnit: "",
      quantityPrice: 0,
    };
    setMedicines((prev) => [...prev, newMedicine]);
  };

  const handleDeleteMedicines = () => {
    setMedicines((prev) =>
      prev.filter((med) => !selectedMedicineIds.has(med.id))
    );
    setSelectedMedicineIds(new Set());
  };

  const handleMedicineFieldChange = (
    medId: string,
    field: keyof UsedMedicine,
    value: string | number
  ) => {
    setMedicines((prev) =>
      prev.map((med) => {
        if (med.id !== medId) return med;
        return { ...med, [field]: value };
      })
    );
  };

  const handleToggleMedicine = (medId: string, checked: boolean) => {
    setSelectedMedicineIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(medId);
      else next.delete(medId);
      return next;
    });
  };

  const handleToggleAllMedicines = (checked: boolean) => {
    if (!checked) {
      setSelectedMedicineIds(new Set());
    } else {
      setSelectedMedicineIds(new Set(medicines.map((med) => med.id)));
    }
  };

  const handleConfirm = () => {
    const item: PreparationReportItem = {
      id: editingItem?.id ?? `prep-item-${Date.now()}`,
      rowNo: editingItem?.rowNo ?? 0,
      preparationType: (draft.preparationType || PreparationType.Preparation) as PreparationType,
      administrationRoute: draft.administrationRoute,
      code: draft.code,
      name: draft.name,
      specification: draft.specification,
      unit: draft.unit,
      claimPrice: Number(draft.claimPrice) || 0,
      priceAppliedDate: draft.priceAppliedDate,
      reportDate: draft.reportDate,
      mainEfficacyGroup: draft.mainEfficacyGroup,
      usageMethod: draft.usageMethod,
      efficacy: draft.efficacy,
      usedMedicines: medicines,
    };
    onConfirm(item);
  };

  const hasMedicines = medicines.length > 0;
  const allMedicinesSelected =
    hasMedicines && selectedMedicineIds.size === medicines.length;
  const someMedicinesSelected =
    hasMedicines && selectedMedicineIds.size > 0 && !allMedicinesSelected;
  const medicineHeaderChecked = allMedicinesSelected
    ? true
    : someMedicinesSelected
      ? "indeterminate"
      : false;

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange()}>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] w-[90vw] h-[85vh] p-0 gap-0 flex flex-col overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#DBDCDF] bg-white shrink-0">
          <span className="text-[16px] font-bold text-[#171719]">
            조제 · 제제약 추가
          </span>
          <button
            type="button"
            onClick={onOpenChange}
            className="text-[#46474C] hover:text-[#171719]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden bg-[#F4F4F5] p-2 gap-2">
          {/* Left Panel - Item Info Form */}
          <div className="w-[364px] shrink-0 border-r border-[#DBDCDF] bg-white overflow-y-auto">
            <div className="p-4 flex flex-col gap-4">
              <span className="text-[16px] font-bold text-[#171719]">
                조제 · 제제약 정보
              </span>
              <div className="flex flex-col gap-3">
                {/* 조제,제제약 정보 */}
                <FormRow label="조제,제제약 정보">
                  <Select
                    value={draft.preparationType}
                    onValueChange={(v) =>
                      handleDraftChange(
                        "preparationType",
                        v as PreparationType
                      )
                    }
                  >
                    <SelectTrigger className="h-8 w-full text-[13px] border-[#C2C4C8]">
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREPARATION_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>

                {/* 투여형태 */}
                <FormRow label="투여형태">
                  <Select
                    value={draft.administrationRoute}
                    onValueChange={(v) =>
                      handleDraftChange(
                        "administrationRoute",
                        v as AdministrationRoute
                      )
                    }
                  >
                    <SelectTrigger className="h-8 w-full text-[13px] border-[#C2C4C8]">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      {ADMINISTRATION_ROUTE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormRow>

                {/* 코드 */}
                <FormRow label="코드">
                  <Input
                    value={draft.code}
                    onChange={(e) =>
                      handleDraftChange("code", e.target.value)
                    }
                    className="h-8 text-[13px] border-[#C2C4C8]"
                    placeholder="텍스트를 입력해 주세요"
                  />
                </FormRow>

                {/* 품명 */}
                <FormRow label="품명">
                  <Input
                    value={draft.name}
                    onChange={(e) =>
                      handleDraftChange("name", e.target.value)
                    }
                    className="h-8 text-[13px] border-[#C2C4C8]"
                    placeholder="텍스트를 입력해 주세요"
                  />
                </FormRow>

                {/* 규격 */}
                <FormRow label="규격">
                  <Input
                    value={draft.specification}
                    onChange={(e) =>
                      handleDraftChange("specification", e.target.value)
                    }
                    className="h-8 text-[13px] border-[#C2C4C8]"
                    placeholder="텍스트를 입력해 주세요"
                  />
                </FormRow>

                {/* 단위 */}
                <FormRow label="단위">
                  <Input
                    value={draft.unit}
                    onChange={(e) =>
                      handleDraftChange("unit", e.target.value)
                    }
                    className="h-8 text-[13px] border-[#C2C4C8]"
                    placeholder="텍스트를 입력해 주세요"
                  />
                </FormRow>

                {/* 청구가 */}
                <FormRow label="청구가">
                  <Input
                    value={draft.claimPrice}
                    onChange={(e) =>
                      handleDraftChange("claimPrice", e.target.value)
                    }
                    className="h-8 text-[13px] border-[#C2C4C8]"
                    placeholder="텍스트를 입력해 주세요"
                  />
                </FormRow>

                {/* 가격적용일 */}
                <FormRow label="가격적용일">
                  <InputDate
                    value={draft.priceAppliedDate}
                    onChange={(value) =>
                      handleDraftChange("priceAppliedDate", value)
                    }
                    className="h-8 text-[13px] border-[#C2C4C8]"
                    placeholder="YYYY-MM-DD"
                  />
                </FormRow>

                {/* 신고일 */}
                <FormRow label="신고일">
                  <InputDate
                    value={draft.reportDate}
                    onChange={(value) =>
                      handleDraftChange("reportDate", value)
                    }
                    className="h-8 text-[13px] border-[#C2C4C8]"
                    placeholder="YYYY-MM-DD"
                  />
                </FormRow>

                {/* 주요효능군 */}
                <FormRow label="주요효능군">
                  <Input
                    value={draft.mainEfficacyGroup}
                    onChange={(e) =>
                      handleDraftChange("mainEfficacyGroup", e.target.value)
                    }
                    className="h-8 text-[13px] border-[#C2C4C8]"
                    placeholder="텍스트를 입력해 주세요"
                  />
                </FormRow>

                {/* 용법/용량 */}
                <FormRow label="용법/용량" align="start">
                  <Textarea
                    value={draft.usageMethod}
                    onChange={(e) =>
                      handleDraftChange("usageMethod", e.target.value)
                    }
                    className="min-h-[100px] text-[13px] border-[#C2C4C8] resize-none"
                    placeholder="텍스트를 입력해 주세요"
                  />
                </FormRow>

                {/* 효능/효과 */}
                <FormRow label="효능/효과" align="start">
                  <Textarea
                    value={draft.efficacy}
                    onChange={(e) =>
                      handleDraftChange("efficacy", e.target.value)
                    }
                    className="min-h-[100px] text-[13px] border-[#C2C4C8] resize-none"
                    placeholder="텍스트를 입력해 주세요"
                  />
                </FormRow>
              </div>
            </div>
          </div>

          {/* Right Panel - Used Medicines */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="p-4 flex flex-col gap-4 flex-1 overflow-hidden">
              <div className="flex items-center justify-between shrink-0">
                <span className="text-[16px] font-bold text-[#171719]">
                  조제 · 제제약에 사용한 의약품
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-[13px] font-medium border-[#180F38] text-[#180F38] bg-white rounded-[4px] hover:bg-[#F4F4F5]"
                    onClick={handleAddMedicine}
                  >
                    추가
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-[13px] font-medium text-[#171719] border-[#DBDCDF] bg-[#FFF] rounded-[4px]"
                    onClick={handleDeleteMedicines}
                    disabled={selectedMedicineIds.size === 0}
                  >
                    삭제
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto rounded-[6px] border border-[#DBDCDF]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F4F4F5] hover:bg-[#F4F4F5] border-b border-[#DBDCDF]">
                      <TableHead className="w-[40px] px-2">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={medicineHeaderChecked}
                            onCheckedChange={(c) =>
                              handleToggleAllMedicines(Boolean(c))
                            }
                            disabled={!hasMedicines}
                            className="h-4 w-4 rounded-[3px] border-[#C2C4C8] data-[state=checked]:bg-[#180F38] data-[state=checked]:border-[#180F38]"
                          />
                        </div>
                      </TableHead>
                      <TableHead className="w-[80px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        코드
                      </TableHead>
                      <TableHead className="min-w-[120px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        품명
                      </TableHead>
                      <TableHead className="w-[80px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        코드구분
                      </TableHead>
                      <TableHead className="w-[60px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        규격
                      </TableHead>
                      <TableHead className="w-[60px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        단위
                      </TableHead>
                      <TableHead className="w-[70px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        제조사
                      </TableHead>
                      <TableHead className="w-[90px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        구입일
                      </TableHead>
                      <TableHead className="w-[70px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        구입처
                      </TableHead>
                      <TableHead className="w-[100px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        사업자등록번호
                      </TableHead>
                      <TableHead className="w-[80px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        단위당가격
                      </TableHead>
                      <TableHead className="w-[60px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        분량
                      </TableHead>
                      <TableHead className="w-[70px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        분량당단위
                      </TableHead>
                      <TableHead className="w-[80px] text-[12px] font-semibold text-[#292A2D] text-center px-1">
                        분량당가격
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {medicines.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={14}
                          className="py-8 text-center text-xs text-[#989BA2]"
                        >
                          사용한 의약품을 추가해주세요.
                        </TableCell>
                      </TableRow>
                    )}
                    {medicines.map((med) => (
                      <MedicineRow
                        key={med.id}
                        medicine={med}
                        isSelected={selectedMedicineIds.has(med.id)}
                        onToggle={handleToggleMedicine}
                        onFieldChange={handleMedicineFieldChange}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#DBDCDF] bg-white shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-[13px] font-medium tracking-[-0.13px] border-[#c2c4c8] text-[#171719] hover:bg-[#F4F4F5]"
            onClick={onOpenChange}
          >
            취소
          </Button>
          <Button
            size="sm"
            className="h-8 px-3 text-[13px] font-medium tracking-[-0.13px] bg-[#180F38] text-white hover:bg-[#180F38]/90 shadow-none"
            onClick={handleConfirm}
          >
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FormRow({
  label,
  children,
  align = "center",
}: {
  label: string;
  children: React.ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div
      className={`flex gap-3 ${align === "start" ? "items-start" : "items-center"}`}
    >
      <span className="w-[110px] shrink-0 text-[13px] text-[#171719]">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

type MedicineRowProps = {
  medicine: UsedMedicine;
  isSelected: boolean;
  onToggle: (id: string, checked: boolean) => void;
  onFieldChange: (
    id: string,
    field: keyof UsedMedicine,
    value: string | number
  ) => void;
};

function MedicineRow({
  medicine,
  isSelected,
  onToggle,
  onFieldChange,
}: MedicineRowProps) {
  const cellInputClass =
    "h-8 text-[13px] border-[#DBDCDF] text-[#46474C] px-2 text-center";

  return (
    <TableRow className="hover:bg-[#F8F8F9] border-b border-[#F1F1F3]">
      <TableCell className="px-2 py-1">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(c) => onToggle(medicine.id, Boolean(c))}
            className="h-4 w-4 rounded-[3px] border-[#C2C4C8] data-[state=checked]:bg-[#180F38] data-[state=checked]:border-[#180F38]"
          />
        </div>
      </TableCell>
      <TableCell className="px-1 py-1">
        <Input
          value={medicine.code}
          onChange={(e) =>
            onFieldChange(medicine.id, "code", e.target.value)
          }
          className={cellInputClass}
        />
      </TableCell>
      <TableCell className="px-1 py-1">
        <Input
          value={medicine.name}
          onChange={(e) =>
            onFieldChange(medicine.id, "name", e.target.value)
          }
          className={cellInputClass}
        />
      </TableCell>
      <TableCell className="px-1 py-1">
        <Select
          value={medicine.codeCategory}
          onValueChange={(v) =>
            onFieldChange(medicine.id, "codeCategory", v)
          }
        >
          <SelectTrigger className="h-8 text-[12px] border-[#DBDCDF] px-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CODE_CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="px-1 py-1">
        <Input
          value={medicine.specification}
          onChange={(e) =>
            onFieldChange(medicine.id, "specification", e.target.value)
          }
          className={cellInputClass}
        />
      </TableCell>
      <TableCell className="px-1 py-1">
        <Input
          value={medicine.unit}
          onChange={(e) =>
            onFieldChange(medicine.id, "unit", e.target.value)
          }
          className={cellInputClass}
        />
      </TableCell>
      <TableCell className="px-1 py-1">
        <Input
          value={medicine.manufacturer}
          onChange={(e) =>
            onFieldChange(medicine.id, "manufacturer", e.target.value)
          }
          className={cellInputClass}
        />
      </TableCell>
      <TableCell className="px-1 py-1">
        <Input
          value={medicine.purchaseDate}
          onChange={(e) =>
            onFieldChange(medicine.id, "purchaseDate", e.target.value)
          }
          className={cellInputClass}
          placeholder="YYYY-MM-DD"
        />
      </TableCell>
      <TableCell className="px-1 py-1">
        <Input
          value={medicine.vendor}
          onChange={(e) =>
            onFieldChange(medicine.id, "vendor", e.target.value)
          }
          className={cellInputClass}
        />
      </TableCell>
      <TableCell className="px-1 py-1">
        <Input
          value={medicine.vendorBusinessNumber}
          onChange={(e) =>
            onFieldChange(
              medicine.id,
              "vendorBusinessNumber",
              e.target.value
            )
          }
          className={cellInputClass}
        />
      </TableCell>
      <TableCell className="px-1 py-1">
        <Input
          type="number"
          value={medicine.unitPrice || ""}
          onChange={(e) =>
            onFieldChange(
              medicine.id,
              "unitPrice",
              Number(e.target.value) || 0
            )
          }
          className={cellInputClass}
        />
      </TableCell>
      <TableCell className="px-1 py-1">
        <Input
          type="number"
          value={medicine.quantity || ""}
          onChange={(e) =>
            onFieldChange(
              medicine.id,
              "quantity",
              Number(e.target.value) || 0
            )
          }
          className={cellInputClass}
        />
      </TableCell>
      <TableCell className="px-1 py-1">
        <Input
          value={medicine.quantityUnit}
          onChange={(e) =>
            onFieldChange(medicine.id, "quantityUnit", e.target.value)
          }
          className={cellInputClass}
        />
      </TableCell>
      <TableCell className="px-1 py-1">
        <Input
          type="number"
          value={medicine.quantityPrice || ""}
          onChange={(e) =>
            onFieldChange(
              medicine.id,
              "quantityPrice",
              Number(e.target.value) || 0
            )
          }
          className={cellInputClass}
        />
      </TableCell>
    </TableRow>
  );
}
