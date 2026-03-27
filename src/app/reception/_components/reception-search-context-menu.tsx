"use client";

import React from "react";
import {
  MyContextMenu,
  type MyContextMenuItem,
} from "@/components/yjg/my-context-menu";

export type ReceptionSearchMenuAction =
  | "quickReception"
  | "addRegistration"
  | "reservation"
  | "patientChart"
  | "vaccinationOrder"
  | "vaccinationHistory"
  | "messageHistory"
  | "insuranceHistory"
  | "notPaid"
  | "consent"
  | "bst"
  | "patientLabelPrint"
  | "examinationLabelPrint"
  | "printCenter";

interface ReceptionSearchContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onSelect: (action: ReceptionSearchMenuAction) => void;
  /** 동적으로 비활성화할 액션 목록 */
  disabledActions?: Set<ReceptionSearchMenuAction>;
}

const MENU_ITEMS: Array<{
  id: ReceptionSearchMenuAction;
  label: string;
  disabled?: boolean;
}> = [
    { id: "quickReception", label: "빠른접수" },
    { id: "addRegistration", label: "추가 접수" },
    { id: "reservation", label: "예약 생성" },
    { id: "patientChart", label: "처방조회" },
    { id: "vaccinationOrder", label: "예방접종 오더", disabled: true },
    { id: "vaccinationHistory", label: "예방접종 내역조회", disabled: true },
    { id: "messageHistory", label: "문자발송 내역조회", disabled: true },
    { id: "insuranceHistory", label: "보험이력 변경" },
    { id: "notPaid", label: "미수환불 수납", disabled: true },
    { id: "consent", label: "동의서 전송" },
    { id: "bst", label: "BST", disabled: true },
    { id: "patientLabelPrint", label: "환자 라벨 출력" },
    { id: "examinationLabelPrint", label: "검사 라벨 출력" },
    { id: "printCenter", label: "출력센터" },
  ];

export function ReceptionSearchContextMenu({
  isOpen,
  position,
  onClose,
  onSelect,
  disabledActions,
}: ReceptionSearchContextMenuProps) {
  const items: MyContextMenuItem[] = React.useMemo(
    () =>
      MENU_ITEMS.map((item) => {
        const isDisabled = item.disabled || disabledActions?.has(item.id);
        return {
          label: item.label,
          disabled: isDisabled,
          className: isDisabled ? "text-[var(--gray-400)]" : "",
          onClick: () => onSelect(item.id),
        };
      }),
    [onSelect, disabledActions]
  );

  return (
    <MyContextMenu
      isOpen={isOpen}
      onCloseAction={onClose}
      items={items}
      position={position}
      zIndex={1000}
    />
  );
}


