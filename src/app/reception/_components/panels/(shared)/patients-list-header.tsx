"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Settings } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '@/styles/react-calendar.css';
import ReceptionSearchBar from "@/app/reception/_components/reception-search-bar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useReceptionTabsStore, useSelectedDate } from "@/store/reception";
import { ReceptionService } from "@/services/reception-service";
import { useClear } from "@/contexts/ClearContext";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import {
  REGISTRATION_ID_NEW,
  isNewRegistrationId,
} from "@/lib/registration-utils";
import { useHospitalStore } from "@/store/hospital-store";
import { createReceptionDateTime } from "@/lib/date-utils";
import { 주간야간휴일구분, 초재진 } from '@/constants/common/common-enum';

const RegisterPatientButton = () => {
  const hospital = useHospitalStore((state) => state.hospital);
  const { replaceReceptionTab, addOpenedReception } =
    useReceptionTabsStore();

  const { clearAll } = useClear();
  // Date Store에서 selectedDate 구독
  const selectedDate = useSelectedDate();

  const [showOverwriteConfirm, setShowOverwriteConfirm] = React.useState(false);

  const handleOverwriteConfirm = async () => {
    await clearAll();
    const initialReception = ReceptionService.createInitialReception();
    initialReception.receptionDateTime = createReceptionDateTime(selectedDate);
    initialReception.receptionInfo.receptionType = hospital?.isAttachedClinic === true ? 초재진.재진 : 초재진.초진;
    initialReception.receptionInfo.timeCategory = hospital?.isAttachedClinic === true ? 주간야간휴일구분.주간 : 주간야간휴일구분.주간;
    replaceReceptionTab(REGISTRATION_ID_NEW, initialReception);
    setShowOverwriteConfirm(false);
  };

  const handleOverwriteCancel = () => {
    setShowOverwriteConfirm(false);
  };

  const handleNewPatientClick = async () => {
    // 신규 환자 추가 시 초기 reception 생성
    const { openedReceptions } = useReceptionTabsStore.getState();
    const existingNewReception = openedReceptions.find((r) =>
      isNewRegistrationId(r.originalRegistrationId)
    );

    if (existingNewReception) {
      setShowOverwriteConfirm(true);
    } else {
      // clear 함수 먼저 실행하여 이전 데이터 초기화
      await clearAll();
      const initialReception = ReceptionService.createInitialReception();
      initialReception.receptionDateTime =
        createReceptionDateTime(selectedDate);
      initialReception.receptionInfo.receptionType = hospital?.isAttachedClinic === true ? 초재진.재진 : 초재진.초진;
      initialReception.receptionInfo.timeCategory = hospital?.isAttachedClinic === true ? 주간야간휴일구분.주간 : 주간야간휴일구분.주간;

      // addOpenedReception은 setAsActive=true로 자동으로 openedReceptionId를 설정함
      addOpenedReception(initialReception, true);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        data-testid="reception-new-patient-button"
        className="h-7 rounded-sm border-[var(--second-color)] text-[var(--second-color)] cursor-pointer flex items-center gap-1 p-2 hover:bg-[var(--violet-1)]/10"
        onClick={handleNewPatientClick}
      >
        <div
          className="size-4"
          style={{
            maskImage: "url(/icon/ic_line_user-plus.svg)",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            backgroundColor: "var(--second-color)",
            WebkitMaskImage: "url(/icon/ic_line_user-plus.svg)",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
          }}
        />
        <span>신규환자</span>
      </Button>

      <MyPopupYesNo
        isOpen={showOverwriteConfirm}
        onCloseAction={handleOverwriteCancel}
        onConfirmAction={handleOverwriteConfirm}
        title=""
        message="작성중인 환자내역이 있습니다. 덮어쓰시겠습니까?"
      />
    </>
  );
};

interface LayoutSettingsActions {
  onResetLayout?: () => void;
  onTogglePaymentMerge?: () => void;
  getIsPaymentMerged?: () => boolean;
}

// ===== Layout Settings Menu =====

interface LayoutSettingsMenuProps {
  layoutSettings: LayoutSettingsActions;
}

const LayoutSettingsMenu: React.FC<LayoutSettingsMenuProps> = ({ layoutSettings }) => {
  const [paymentMerged, setPaymentMerged] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (open && layoutSettings.getIsPaymentMerged) {
      setPaymentMerged(layoutSettings.getIsPaymentMerged());
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center w-7 h-7 rounded-sm hover:bg-[var(--bg-base1)] transition-colors cursor-pointer"
          aria-label="환경설정"
        >
          <Settings className="w-4 h-4 text-[var(--gray-200)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem
          onClick={() => layoutSettings.onTogglePaymentMerge?.()}
          className="cursor-pointer text-sm"
        >
          {paymentMerged ? "수납리스트 분리" : "수납리스트 병합"}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled
          className="text-sm opacity-50"
        >
          진료대기리스트 추가
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => layoutSettings.onResetLayout?.()}
          className="cursor-pointer text-sm"
        >
          레이아웃 초기화
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface PatientsListHeaderProps {
  selectedDate?: Date;
  onRequestDateChange?: (date: Date) => void;
  layoutSettings?: LayoutSettingsActions;
}

const PatientsListHeader: React.FC<PatientsListHeaderProps> = ({
  selectedDate,
  onRequestDateChange,
  layoutSettings,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const fallbackDateRef = useRef<Date>(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const displayDate = useMemo(() => {
    if (selectedDate) {
      fallbackDateRef.current = selectedDate;
      return selectedDate;
    }
    return fallbackDateRef.current;
  }, [selectedDate]);

  // 외부 클릭 시 캘린더 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1);
    const day = String(date.getDate());
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];

    return `${year}년 ${month}월 ${day}일 (${weekday})`;
  };

  // 날짜 선택 핸들러
  const handleDateSelect = (date: Date) => {
    onRequestDateChange?.(date);
    setIsCalendarOpen(false);
  };

  // 캘린더 토글
  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  // 캘린더 포탈 위치 계산
  const [calendarPos, setCalendarPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const updateCalendarPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCalendarPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, []);

  useEffect(() => {
    if (!isCalendarOpen) return;
    updateCalendarPosition();
    window.addEventListener("scroll", updateCalendarPosition, true);
    window.addEventListener("resize", updateCalendarPosition);
    return () => {
      window.removeEventListener("scroll", updateCalendarPosition, true);
      window.removeEventListener("resize", updateCalendarPosition);
    };
  }, [isCalendarOpen, updateCalendarPosition]);

  // React Calendar 컴포넌트 (createPortal로 body에 렌더링)
  const renderCalendar = () => {
    return createPortal(
      <div
        ref={calendarRef}
        className="bg-[var(--bg-main)] border border-[var(--border-1)] rounded-md shadow-lg"
        style={{
          position: "fixed",
          top: calendarPos.top,
          left: calendarPos.left,
          zIndex: 9999,
        }}
      >
        <div className="relative w-80">
          <Calendar
            onChange={(value: any) => {
              if (value instanceof Date) {
                handleDateSelect(value);
              }
            }}
            value={displayDate}
            locale="ko-KR"
            calendarType="gregory"
            formatDay={(_locale: any, date: Date) => date.getDate().toString()}
            showNeighboringMonth={false}
            next2Label={null}
            prev2Label={null}
            className="react-calendar w-full"
          />
          {/* 오늘 버튼 */}
          <div className="p-3 border-t border-[var(--border-1)]">
            <button
              onClick={() => handleDateSelect(new Date())}
              className="w-full py-2 text-sm text-[var(--gray-200)] border border-[var(--border-1)] hover:bg-[var(--bg-hover)] rounded transition-colors font-medium"
            >
              오늘
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="flex items-center justify-between px-2 py-2 bg-[var(--bg-base)] h-9">
      {/* 좌측: 캘린더, 검색바, 신규환자 버튼 */}
      <div className="flex items-center gap-2">
        {/* 날짜 선택 버튼 */}
        <div className="w-[13rem]">
          <button
            ref={buttonRef}
            onClick={toggleCalendar}
            data-testid="reception-date-button"
            className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-base)] hover:bg-[var(--bg-base1)]  rounded-md transition-colors text-sm"
          >
            <CalendarIcon className="w-4 h-4 text-[var(--gray-200)]" />
            <span className="text-[14px] text-[var(--text-primary)]  font-bold">
              {formatDate(displayDate)}
            </span>
          </button>

          {/* 캘린더 드롭다운 (createPortal로 body에 렌더링) */}
          {isCalendarOpen && renderCalendar()}
        </div>

        {/* 검색바 */}
        <ReceptionSearchBar />

        {/* 신규환자 버튼 */}
        <RegisterPatientButton />
      </div>

      {/* 우측: 즐겨찾기 + 환경설정 */}
      <div className="flex items-center gap-2">
        {/* 차후 즐겨찾기 버튼들이 여기에 추가될 예정 */}

        {/* 환경설정 아이콘 - 숨김 처리됨 */}
        {/* {layoutSettings && (
          <LayoutSettingsMenu layoutSettings={layoutSettings} />
        )} */}
      </div>
    </div>
  );
};

export default PatientsListHeader;
