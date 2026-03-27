import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Calendar from "react-calendar";
import { CalendarIcon } from "lucide-react";

import "@/styles/react-calendar.css";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

function ymdFromUtcIsoAsKst(value: string | Date | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function utcIsoFromKstYmdStart(ymd: string): string {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  if (!y || !m || !d) return "";
  const utcMs = Date.UTC(y, m - 1, d, 0, 0, 0, 0) - KST_OFFSET_MS; // KST 00:00:00.000
  return new Date(utcMs).toISOString();
}

function utcIsoFromKstYmdEnd(ymd: string): string {
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  if (!y || !m || !d) return "";
  const utcMs = Date.UTC(y, m - 1, d, 23, 59, 59, 999) - KST_OFFSET_MS; // KST 23:59:59.999
  return new Date(utcMs).toISOString();
}

function dateObjectFromYmd(ymd: string): Date | null {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function clampRange(fromYmd: string, toYmd: string): { from: string; to: string } {
  if (!fromYmd && !toYmd) return { from: "", to: "" };
  if (!fromYmd) return { from: toYmd, to: toYmd };
  if (!toYmd) return { from: fromYmd, to: fromYmd };
  return fromYmd <= toYmd ? { from: fromYmd, to: toYmd } : { from: toYmd, to: fromYmd };
}

function isValidYmd(ymd: string): boolean {
  // YYYY-MM-DD 기본 검증 + 실제 날짜인지 확인
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const [y, m, d] = ymd.split("-").map((v) => Number(v));
  if (!y || !m || !d) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export interface KstDateRangeCalendarInputValue {
  startUtcIso: string | null;
  endUtcIso: string | null;
}

export function KstDateRangeCalendarInput(props: {
  disabled?: boolean;
  startUtcIso?: string | Date | null;
  endUtcIso?: string | Date | null;
  onChange?: (next: KstDateRangeCalendarInputValue) => void;
  className?: string;
  inputClassName?: string;
}) {
  const { disabled, startUtcIso, endUtcIso, onChange, className, inputClassName } = props;

  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [calendarPos, setCalendarPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // controlled source (props) -> KST YYYY-MM-DD
  const startYmd = useMemo(() => ymdFromUtcIsoAsKst(startUtcIso as any), [startUtcIso]);
  const endYmd = useMemo(() => ymdFromUtcIsoAsKst(endUtcIso as any), [endUtcIso]);

  // drafts for typing (so we don't "snap back" on each keystroke)
  const [startDraft, setStartDraft] = useState(startYmd);
  const [endDraft, setEndDraft] = useState(endYmd);
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (isEditingRef.current) return;
    setStartDraft(startYmd);
    setEndDraft(endYmd);
  }, [startYmd, endYmd]);

  const updateCalendarPosition = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCalendarPos({ top: rect.bottom + 8, left: rect.left });
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateCalendarPosition();
    window.addEventListener("scroll", updateCalendarPosition, true);
    window.addEventListener("resize", updateCalendarPosition);
    return () => {
      window.removeEventListener("scroll", updateCalendarPosition, true);
      window.removeEventListener("resize", updateCalendarPosition);
    };
  }, [isOpen, updateCalendarPosition]);

  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const calendarEl = popoverRef.current;
      const triggerEl = triggerRef.current;
      if (calendarEl?.contains(e.target as Node)) return;
      if (triggerEl?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  const calendarValue = useMemo(() => {
    const s = dateObjectFromYmd(startYmd);
    const e = dateObjectFromYmd(endYmd);
    if (s && e) return [s, e] as [Date, Date];
    if (s) return s;
    return null;
  }, [startYmd, endYmd]);

  const commitYmdRange = (fromYmd: string, toYmd: string) => {
    const { from, to } = clampRange(fromYmd, toYmd);
    if (!from && !to) {
      onChange?.({ startUtcIso: null, endUtcIso: null });
      return;
    }
    if (!from || !to) return;

    onChange?.({
      startUtcIso: utcIsoFromKstYmdStart(from),
      endUtcIso: utcIsoFromKstYmdEnd(to),
    });
  };

  const commitDrafts = () => {
    const from = startDraft.trim();
    const to = endDraft.trim();

    // 둘 다 비우면 null 처리
    if (!from && !to) {
      commitYmdRange("", "");
      return;
    }

    // 하나만 있으면 같은 날짜로 자동 세팅
    const nextFrom = from || to;
    const nextTo = to || from || to;

    if (!isValidYmd(nextFrom) || !isValidYmd(nextTo)) {
      // 유효하지 않으면 props 기반 값으로 복구
      setStartDraft(startYmd);
      setEndDraft(endYmd);
      return;
    }

    commitYmdRange(nextFrom, nextTo);
  };

  const baseInputClass =
    "border border-gray-300 rounded px-2 py-1 text-sm w-[115px] pr-8 bg-white";
  const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <div className={`relative flex items-center gap-2 ${className ?? ""}`} ref={triggerRef}>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder="YYYY-MM-DD"
          value={startDraft}
          disabled={disabled}
          onFocus={() => {
            isEditingRef.current = true;
          }}
          onChange={(e) => {
            setStartDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              (e.target as HTMLInputElement).blur();
            }
          }}
          onBlur={() => {
            isEditingRef.current = false;
            commitDrafts();
          }}
          className={`${baseInputClass} ${disabledClass} ${inputClassName ?? ""}`}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((v) => !v)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${disabledClass}`}
          aria-label="날짜 범위 선택"
        >
          <CalendarIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <span className="text-sm text-gray-500">~</span>

      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder="YYYY-MM-DD"
          value={endDraft}
          disabled={disabled}
          onFocus={() => {
            isEditingRef.current = true;
          }}
          onChange={(e) => {
            setEndDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              (e.target as HTMLInputElement).blur();
            }
          }}
          onBlur={() => {
            isEditingRef.current = false;
            commitDrafts();
          }}
          className={`${baseInputClass} ${disabledClass} ${inputClassName ?? ""}`}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((v) => !v)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${disabledClass}`}
          aria-label="날짜 범위 선택"
        >
          <CalendarIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {isOpen && !disabled && createPortal(
        <div
          ref={popoverRef}
          className="bg-white border border-gray-200 rounded shadow-lg p-2"
          style={{
            position: "fixed",
            top: calendarPos.top,
            left: calendarPos.left,
            zIndex: 9999,
          }}
        >
          <Calendar
            locale="ko-KR"
            selectRange
            value={calendarValue as any}
            calendarType="gregory"
            formatDay={(locale, date) => date.getDate().toString()}
            onChange={(value: any) => {
              // 단일 선택: 같은 날짜로 자동 세팅
              if (value instanceof Date) {
                const ymd = new Intl.DateTimeFormat("en-CA", {
                  timeZone: "Asia/Seoul",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(value);
                setStartDraft(ymd);
                setEndDraft(ymd);
                commitYmdRange(ymd, ymd);
                setIsOpen(false);
                return;
              }

              // 범위 선택: [start, end]
              if (Array.isArray(value) && value[0] instanceof Date) {
                const from = new Intl.DateTimeFormat("en-CA", {
                  timeZone: "Asia/Seoul",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                }).format(value[0]);
                const to =
                  value[1] instanceof Date
                    ? new Intl.DateTimeFormat("en-CA", {
                      timeZone: "Asia/Seoul",
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    }).format(value[1])
                    : from;

                setStartDraft(from);
                setEndDraft(to);
                commitYmdRange(from, to);
                if (value[1] instanceof Date) setIsOpen(false);
              }
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
}


