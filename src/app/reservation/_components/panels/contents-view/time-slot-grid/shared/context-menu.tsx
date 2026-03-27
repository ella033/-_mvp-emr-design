import React from 'react';
import { formatTime } from "@/lib/reservation-utils";

interface ContextMenuProps {
  contextMenu: {
    visible: boolean;
    x: number;
    y: number;
    hour: number;
    minute: number;
  } | null;
  currentDate: Date | null;
  isAvailable: boolean;
  isClosureTime: boolean;
  hasCopiedAppointment?: boolean;
  onClose: () => void;
  onCreateAppointment: () => void;
  onCreateSlotClosure: () => void;
  onCancelSlotClosure: () => void;
  onPasteAppointment?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  contextMenu,
  currentDate,
  isAvailable,
  isClosureTime,
  hasCopiedAppointment = false,
  onClose,
  onCreateAppointment,
  onCreateSlotClosure,
  onCancelSlotClosure,
  onPasteAppointment,
}) => {
  if (!contextMenu?.visible || !currentDate) return null;

  const { hour, minute } = contextMenu;
  const timeString = formatTime(hour, minute);

  return (
    <div
      className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
      style={{
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`,
        width: '120px',
        maxWidth: '120px',
        minWidth: '120px'
      }}
    >
      <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-200">
        {timeString}
      </div>

      {isAvailable ? (
        <>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-1)] transition-colors"
            onClick={onCreateAppointment}
          >
            예약 생성
          </button>
          {hasCopiedAppointment && onPasteAppointment && (
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-1)] transition-colors"
              onClick={onPasteAppointment}
            >
              예약 붙여넣기
            </button>
          )}
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-1)] transition-colors"
            onClick={onCreateSlotClosure}
          >
            예약 마감
          </button>
        </>
      ) : isClosureTime ? (
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-1)] transition-colors"
          onClick={onCancelSlotClosure}
        >
          예약 마감 취소
        </button>
      ) : (
        <div className="px-3 py-2 text-sm text-gray-400">
          예약 불가능한 시간입니다
        </div>
      )}
    </div>
  );
};