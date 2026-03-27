"use client";

/**
 * 검체 목록 아이템 컴포넌트
 *
 * 검체명과 수량 조절 Stepper를 포함합니다.
 */

import { MinusIcon, PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRINT_QUANTITY } from "@/lib/label-printer";
import type { SpecimenPrintItem } from "@/lib/label-printer";

interface SpecimenListItemProps {
  /** 검체 정보 */
  specimen: SpecimenPrintItem;
  /** 수량 변경 핸들러 */
  onQuantityChange: (specimenCode: string, quantity: number) => void;
  /** 검체 제거 핸들러 */
  onRemove: (specimenCode: string) => void;
  /** 비활성화 여부 */
  disabled?: boolean;
}

export function SpecimenListItem({
  specimen,
  onQuantityChange,
  onRemove,
  disabled = false,
}: SpecimenListItemProps) {
  const handleDecrease = () => {
    if (specimen.quantity > PRINT_QUANTITY.MIN) {
      onQuantityChange(specimen.specimenCode, specimen.quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (specimen.quantity < PRINT_QUANTITY.MAX) {
      onQuantityChange(specimen.specimenCode, specimen.quantity + 1);
    }
  };

  const handleRemove = () => {
    onRemove(specimen.specimenCode);
  };

  const isMinQuantity = specimen.quantity <= PRINT_QUANTITY.MIN;
  const isMaxQuantity = specimen.quantity >= PRINT_QUANTITY.MAX;

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2">
      {/* 검체명 */}
      <span className="flex-1 truncate text-sm font-medium">{specimen.specimenName}</span>

      {/* 수량 조절 Stepper */}
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          onClick={handleDecrease}
          disabled={disabled || isMinQuantity}
          aria-label="수량 감소"
        >
          <MinusIcon className="size-3.5" />
        </Button>

        <span className="w-6 text-center text-sm font-medium tabular-nums">
          {specimen.quantity}
        </span>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          onClick={handleIncrease}
          disabled={disabled || isMaxQuantity}
          aria-label="수량 증가"
        >
          <PlusIcon className="size-3.5" />
        </Button>
      </div>

      {/* 제거 버튼 */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground hover:text-destructive"
        onClick={handleRemove}
        disabled={disabled}
        aria-label="검체 제거"
      >
        <XIcon className="size-4" />
      </Button>
    </div>
  );
}
