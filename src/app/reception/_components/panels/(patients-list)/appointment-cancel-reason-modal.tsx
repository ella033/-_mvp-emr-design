"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MyPopup from "@/components/yjg/my-pop-up";
import { MyButton } from "@/components/yjg/my-button";
import { useToastHelpers } from "@/components/ui/toast";
import type { Appointment } from "@/types/appointments/appointments";
import { formatDateTime } from "@/utils/date-formatter";

const MAX_REASON_LENGTH = 100;
const CUSTOM_REASON_VALUE = "custom";

const CANCEL_REASON_OPTIONS = [
  { value: "병원 사정", label: "병원 사정" },
  { value: "미방문", label: "미방문" },
  { value: "환자 요청", label: "환자 요청" },
  { value: "미리 내원", label: "미리 내원" },
  { value: "기타(직접 입력)", label: "기타(직접 입력)", isCustom: true },
];

interface AppointmentCancelReasonModalProps {
  isOpen: boolean;
  appointment?: Appointment | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

interface LocalSelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export default function AppointmentCancelReasonModal({
  isOpen,
  appointment: _appointment,
  onClose,
  onConfirm,
}: AppointmentCancelReasonModalProps) {
  const { error } = useToastHelpers();
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setSelectedReason("");
      setCustomReason("");
    }
  }, [isOpen]);

  const reasonOptions = useMemo(
    () =>
      CANCEL_REASON_OPTIONS.map((option) => ({
        value: option.isCustom ? CUSTOM_REASON_VALUE : option.value,
        label: option.label,
      })),
    []
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isCustomReason = selectedReason === CUSTOM_REASON_VALUE;
  const finalReason = isCustomReason
    ? customReason.trim()
    : selectedReason.trim();

  const handleConfirm = async () => {
    if (!finalReason) {
      error("취소 사유를 입력해주세요.");
      return;
    }

    await onConfirm(finalReason);
  };

  const selectedOption = reasonOptions.find(
    (option) => option.value === selectedReason
  );

  useEffect(() => {
    if (!isDropdownOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setIsDropdownOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDropdownOpen]);

  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onClose}
      width="360px"
      height={isCustomReason ? "248px" : "196px"}
      minWidth="360px"
      minHeight={isCustomReason ? "248px" : "196px"}
      closeOnOutsideClick={false}
      localStorageKey="appointment-cancel-reason-modal"
      hideHeader={true}
    >
      <div className="relative h-full">
        <div className="absolute bottom-0 right-0 w-[15px] h-[15px] bg-[var(--card-bg)] pointer-events-none" />
        <div className="flex flex-col px-5 pt-5 pb-3 h-full gap-4">
          <div className="text-[16px] font-medium text-[var(--gray-300)] whitespace-pre-line">
            해당 예약을 취소하시겠습니까?
          </div>
          <div className="text-[14px] text-[var(--gray-300)] whitespace-pre-line">{`[${formatDateTime(_appointment?.appointmentStartTime, "HH:mm")}] ${_appointment?.patient.name}`}</div>
          <div className="flex-1 flex flex-col gap-2">
            <div className="relative w-full">
              <button
                type="button"
                ref={triggerRef}
                className="w-full p-2 text-[12px] text-left outline-none border border-[var(--border-1)] rounded-[6px] relative"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
              >
                {selectedOption ? (
                  <span className="text-[#171719]">{selectedOption.label}</span>
                ) : (
                  <span className="text-[#989BA2]">
                    취소 사유를 선택해주세요
                  </span>
                )}
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#989BA2]">
                  ▾
                </span>
              </button>
              {isDropdownOpen && (
                <div
                  ref={dropdownRef}
                  className="fixed border shadow-lg z-99 rounded-sm my-scroll bg-[var(--card-bg)] border-[var(--card-border)] p-2 flex flex-col gap-1"
                  style={{
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                    maxHeight: "200px",
                  }}
                >
                  {reasonOptions.map((option: LocalSelectOption) => {
                    const isSelected = option.value === selectedReason;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={[
                          "w-full flex items-center text-left transition-colors px-3 py-2 text-[13px] h-8 text-[#171719]",
                          isSelected
                            ? "bg-[var(--main-color)] text-white"
                            : "hover:bg-[#F7F7F8] hover:text-[var(--text-tertiary)]",
                        ].join(" ")}
                        onClick={() => {
                          setSelectedReason(String(option.value));
                          setIsDropdownOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {isCustomReason && (
              <div className="flex flex-col w-full gap-1">
                <input
                  className="w-full p-2 text-[12px] outline-none border border-[var(--border-1)] rounded-[6px]"
                  placeholder="취소 사유를 입력하세요"
                  value={customReason}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, MAX_REASON_LENGTH);
                    setCustomReason(value);
                  }}
                />
                <div className="flex justify-end text-[10px] text-[var(--gray-400)]">
                  {customReason.length}/{MAX_REASON_LENGTH}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-row justify-end gap-2">
            <MyButton
              variant="outline"
              onClick={onClose}
              className="h-8 w-16 px-[20.5px] py-2"
            >
              닫기
            </MyButton>
            <MyButton
              onClick={handleConfirm}
              disabled={!finalReason}
              className="h-8 w-16 px-[20.5px] py-2 bg-[var(--main-color)] text-white hover:bg-[var(--main-color)]/90"
            >
              확인
            </MyButton>
          </div>
        </div>
      </div>
    </MyPopup>
  );
}
