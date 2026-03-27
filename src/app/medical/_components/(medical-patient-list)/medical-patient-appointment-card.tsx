"use client";

import type { Appointment } from "@/types/appointments/appointments";
import { PatientBasicInfoBadge } from "../widgets/medical-patient-badge";
import MyDivideLine from "@/components/yjg/my-divide-line";
import clsx from "clsx";
import { DdocDocIcon } from "@/components/custom-icons";
import { MyTooltip } from "@/components/yjg/my-tooltip";
import type { PatientListPosition } from "./medical-patient-list";
import { stripHtmlTags } from "@/utils/template-code-utils";
import { useState } from "react";
import { MyContextMenu } from "@/components/yjg/my-context-menu";
import { formatDateByPattern } from "@/lib/date-utils";

function AppointmentExternalPlatform({ externalPlatform }: { externalPlatform: string }) {
  if (externalPlatform && externalPlatform.toLowerCase() === "ddocdoc") {
    return (
      <>
        <MyDivideLine orientation="vertical" size="sm" color="bg-[var(--border-2)]" className="h-[10px]" />
        <DdocDocIcon className="w-[16px] h-[16px]" />
      </>
    );
  }
  return null;
}

function AppointmentTime({ time }: { time: Date }) {
  return (
    <span className="text-[12px] text-[var(--gray-400)] whitespace-nowrap shrink-0">
      {formatDateByPattern(time, "HH:mm")}
    </span>
  );
}

/** 2행 왼쪽: 노란 + 아이콘 | 구분선 | 예약 유형명 */
function AppointmentType({ typeName }: { typeName: string | undefined | null }) {
  if (typeName === undefined || typeName === null || typeName.trim() === "") return null;
  return (
    <>
      <MyDivideLine orientation="vertical" size="sm" color="bg-[var(--border-2)]" className="h-[10px]" />
      <span className="text-[12px] text-[var(--gray-400)] whitespace-nowrap shrink-0">
        {typeName}
      </span>
    </>
  );
}

/** 2행 오른쪽: 구분선 | 메모 (medical-patient-card의 RegistrationMemo와 동일 패턴: tooltip + side) */
function AppointmentMemo({
  memo,
  listPosition,
}: {
  memo: string | undefined | null;
  listPosition: PatientListPosition;
}) {
  if (memo === undefined || memo === null) return null;
  const memoView = stripHtmlTags(memo);
  if (memoView.trim().length === 0) return null;
  const tooltipSide = listPosition === "left" ? "right" : "left";
  const tooltipContent = (
    <div
      className="text-[12px] max-w-[300px] whitespace-pre-wrap break-words"
      dangerouslySetInnerHTML={{ __html: memo }}
    />
  );
  return (
    <>
      <MyDivideLine orientation="vertical" size="sm" color="bg-[var(--border-2)]" className="h-[10px]" />
      <MyTooltip content={tooltipContent} side={tooltipSide}>
        <div className="text-[12px] text-[var(--gray-400)] min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {memoView}
        </div>
      </MyTooltip>
    </>
  );
}

export default function MedicalPatientAppointmentCard({
  appointment,
  onClickAction,
  isSelected = false,
  listPosition,
  onClinicalMemoClickAction,
}: {
  appointment: Appointment;
  onClickAction: () => void;
  isSelected?: boolean;
  listPosition: PatientListPosition;
  /** 우클릭 메뉴: 임상메모 */
  onClinicalMemoClickAction?: () => void;
}) {
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const contextMenuItems = [
    ...(onClinicalMemoClickAction && !isSelected
      ? [
        {
          label: "임상메모",
          onClick: () => {
            setContextMenuOpen(false);
            onClinicalMemoClickAction();
          },
        },
      ]
      : []),
  ];

  return (
    <div
      className={clsx(
        "flex flex-col bg-[var(--bg-2)] justify-between p-[8px] gap-[4px] cursor-pointer",
        isSelected
          ? "border-y border-[var(--main-color-2-1)] bg-[var(--gray-white)]"
          : "border-b border-[var(--border-2)]"
      )}
      onClick={onClickAction}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (contextMenuItems.length > 0) {
          setContextMenuPosition({ x: e.clientX, y: e.clientY });
          setContextMenuOpen(true);
        }
      }}
    >
      <div className="flex gap-[4px] items-center flex-nowrap overflow-hidden text-ellipsis">
        <PatientBasicInfoBadge patient={appointment.patient} isNewPatient={appointment.isNewPatient} />
        <AppointmentExternalPlatform externalPlatform={appointment.externalPlatform?.platformCode ?? ""} />
      </div>
      <div className="flex gap-[4px] items-center flex-nowrap overflow-hidden text-ellipsis">
        <AppointmentTime time={appointment.appointmentStartTime} />
        <AppointmentType typeName={appointment.appointmentType?.name} />
        <AppointmentMemo memo={appointment.memo} listPosition={listPosition} />
      </div>

      <MyContextMenu
        isOpen={contextMenuOpen}
        onCloseAction={() => setContextMenuOpen(false)}
        items={contextMenuItems}
        position={contextMenuPosition}
      />
    </div>
  );
}
