"use client";

import React, { useEffect, useCallback, useMemo, useRef } from "react";
import { BoardPatient } from "@/components/reception/board-patient";
import { useReceptionBoardPatientAdapter } from "@/hooks/reception/board-patient/use-reception-board-patient-adapter";
import { useReceptionTabsStore } from "@/store/reception";
import { usePatientInfoUi } from "@/hooks/reception/use-patient-info-ui";
import { XIcon } from "lucide-react";
import { getGender } from "@/lib/patient-utils";
import type { Hospital } from "@/types/hospital-types";
import { MyPopupYesNo } from "@/components/yjg/my-pop-up";
import { REGISTRATION_ID_NEW } from "@/lib/registration-utils";
import { highlightElement } from "@/lib/ui/highlight-effect";

interface SummaryInfoProps {
  OnDateChange?: (date: Date) => void;
  selectedDate?: Date;
  hospital?: Hospital;
}

export default function SummaryInfo(_props: SummaryInfoProps) {
  const { openedReceptions, openedReceptionId } = useReceptionTabsStore();
  const { boardPatientProps } = useReceptionBoardPatientAdapter();
  const contentRef = useRef<HTMLDivElement>(null);

  // 환자 탭 전환/열기 시 상세보기 영역에 하이라이트 효과
  useEffect(() => {
    if (openedReceptionId) {
      highlightElement(contentRef.current, { iterationCount: 1 });
    }
  }, [openedReceptionId]);

  // 중복 제거: 같은 originalRegistrationId가 여러 개 있으면 첫 번째만 사용
  const uniqueOpenedReceptions = useMemo(() => {
    const seen = new Set<string>();
    return openedReceptions.filter((reception: any) => {
      const id = reception.originalRegistrationId || REGISTRATION_ID_NEW;
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }, [openedReceptions]);

  const showPatientTabs = useMemo(
    () => uniqueOpenedReceptions.length > 0,
    [uniqueOpenedReceptions.length]
  );

  const isFirstActiveTab = useMemo(() => {
    if (!openedReceptionId) return false;
    const activeIndex = uniqueOpenedReceptions.findIndex((reception: any) => {
      const id = reception.originalRegistrationId || REGISTRATION_ID_NEW;
      return id === openedReceptionId;
    });
    return activeIndex === 0;
  }, [openedReceptionId, uniqueOpenedReceptions]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* openedReceptions가 0개면 환자탭 영역을 임시로 숨김 */}
      {showPatientTabs && (
        <TopNavBar uniqueOpenedReceptions={uniqueOpenedReceptions} />
      )}
      <div
        ref={contentRef}
        className={[
          "flex-1 flex bg-[var(--card)] min-h-0 rounded-md",
          openedReceptionId
            ? "border-[1.5px] border-[var(--main-color-2-1)]"
            : "",
          showPatientTabs && openedReceptionId && isFirstActiveTab
            ? "rounded-tl-none"
            : "",
        ].join(" ")}
      >
        {/* /reception 라우트 전용 어댑터를 통해 store 의존성을 캡슐화한 공용 BoardPatient */}
        <BoardPatient {...boardPatientProps} />
      </div>
    </div>
  );
}

interface TopNavBarProps {
  uniqueOpenedReceptions: any[];
}

function TopNavBar({ uniqueOpenedReceptions }: TopNavBarProps) {
  const {
    removeOpenedReception,
    openedReceptionId,
    setOpenedReceptionId,
    hasReceptionChanges,
  } = useReceptionTabsStore();

  const {
    executeWithUnsavedChangesCheck,
    showUnsavedChangesConfirm,
    handleConfirmUnsavedChanges,
    handleCancelUnsavedChanges,
  } = usePatientInfoUi();

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

  const isFirstActiveTab = useMemo(() => {
    if (!openedReceptionId) return false;
    const activeIndex = uniqueOpenedReceptions.findIndex((reception: any) => {
      const id = reception.originalRegistrationId || REGISTRATION_ID_NEW;
      return id === openedReceptionId;
    });
    return activeIndex === 0;
  }, [openedReceptionId, uniqueOpenedReceptions]);

  // openedReceptionId가 변경될 때 해당 탭으로 스크롤
  useEffect(() => {
    if (openedReceptionId && tabRefs.current[openedReceptionId]) {
      tabRefs.current[openedReceptionId]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [openedReceptionId]);

  // 새로고침/페이지 이탈 시 변경사항 확인
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // 열린 reception 중에 변경사항이 있는 것이 있는지 확인
      const hasAnyChanges = uniqueOpenedReceptions.some((reception: any) =>
        hasReceptionChanges(reception.originalRegistrationId || REGISTRATION_ID_NEW)
      );

      if (hasAnyChanges) {
        event.preventDefault();
        return "수정중인 환자 정보가 있습니다. 닫으시겠습니까?";
      }

      return undefined;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [uniqueOpenedReceptions, hasReceptionChanges]);

  // removeOpenedReception을 안전하게 호출하는 함수
  const handleRemoveReception = useCallback(
    (patientId: string) => {
      const executeClose = () => {
        removeOpenedReception(patientId);
      };

      executeWithUnsavedChangesCheck("환자 탭을 닫", executeClose, patientId);
    },
    [removeOpenedReception, executeWithUnsavedChangesCheck]
  );

  // 환자 탭 클릭 처리 함수 (탭 이동은 확인 없이 바로 이동)
  const handlePatientTabClick = useCallback(
    (reception: any) => {
      const registrationId = reception.originalRegistrationId || REGISTRATION_ID_NEW;
      // 탭 이동은 확인 없이 바로 이동 (페이지 이동이 아니므로)
      setOpenedReceptionId(registrationId);
    },
    [setOpenedReceptionId]
  );


  return (
    <div
      className={[
        "flex justify-between items-center bg-[var(--bg-main)] gap-2 rounded-md relative",
        openedReceptionId
          ? "border-1 border-[var(--bg-1)] rounded-b-none border-b-0"
          : "border-[var(--border-1)]",
        openedReceptionId && isFirstActiveTab
          ? "border-l-[1.5px] border-l-[var(--main-color-2-1)] rounded-tl-lg"
          : "",
      ].join(" ")}
    >
      {/* 왼쪽 세로 라인 */}
      {openedReceptionId && isFirstActiveTab && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[1.5px] bg-[var(--main-color-2-1)] z-20 pointer-events-none" />
      )}
      <div className="flex flex-nowrap items-center w-full text-sm">
        <div
          className={[
            "flex overflow-x-auto overflow-y-visible flex-1 items-stretch my-scroll min-h-8 pr-3",
          ].join(" ")}
          ref={scrollContainerRef}
        >
          {uniqueOpenedReceptions.length > 0 ? (
            uniqueOpenedReceptions.map((reception: any, index: number) => {
              const registrationId =
                reception.originalRegistrationId || REGISTRATION_ID_NEW;
              const isActive = openedReceptionId === registrationId;
              const isFirst = index === 0;
              const isLast = index === uniqueOpenedReceptions.length - 1;

              const activeBaseClass =
                "bg-[var(--main-color-2-1)] text-[var(--bg-main)] rounded-b-none -mb-[1.5px] relative z-10";

              // 첫 탭이 active인 경우 왼쪽 inverted-round는 구현하지 않음(컨테이너 클리핑/디자인 기준)
              const activeLeftNotchClass = !isFirst
                ? "before:content-[''] before:absolute before:bottom-0 before:-left-3 before:w-3 before:h-3 before:bg-[var(--bg-main)] before:rounded-br-[12px] before:shadow-[6px_6px_0_6px_var(--main-color-2-1)] before:pointer-events-none"
                : "";

              // 마지막 탭이 아니면 오른쪽 inverted-round를 표시 (오른쪽에 다른 탭/여백이 있는 케이스)
              const activeRightNotchClass = !isLast
                ? "after:content-[''] after:absolute after:bottom-0 after:-right-3 after:w-3 after:h-3 after:bg-[var(--bg-main)] after:rounded-bl-[12px] after:shadow-[-6px_6px_0_6px_var(--main-color-2-1)] after:pointer-events-none"
                : "";

              return (
                <React.Fragment key={`${registrationId}-${index}`}>
                  <div
                    ref={(el) => {
                      if (el) {
                        tabRefs.current[registrationId] = el;
                      }
                    }}
                    className={[
                      "flex flex-shrink-0 items-center cursor-pointer text-sm whitespace-nowrap rounded-md h-8 px-1",
                      isActive
                        ? [activeBaseClass, activeLeftNotchClass, activeRightNotchClass]
                          .filter(Boolean)
                          .join(" ")
                        : "bg-[var(--bg-main)] text-[var(--gray-300)]",
                    ].join(" ")}
                  >
                    <div
                      className="flex items-center gap-1 h-full pl-2 pr-1 relative"
                      onClick={() => handlePatientTabClick(reception)}
                    >
                      {/* 수정 중 아이콘 */}
                      {hasReceptionChanges(registrationId) && (
                        <img
                          src="/icon/ic_edit_mode.svg"
                          alt="수정 중"
                          className="absolute top-1 -left-px translate-y-[-0.5px] w-1.5 h-1.5 z-10"
                        />
                      )}
                      <span className="font-medium">
                        {reception.patientBaseInfo?.name || "신규환자"}
                      </span>
                      <span className="text-xs opacity-75">
                        ({getGender(reception.patientBaseInfo?.gender || 0, "ko")}/{reception.patientBaseInfo?.age || 0}
                        )
                      </span>
                    </div>
                    <button
                      className="p-1 rounded-full cursor-pointer transition-colors hover:opacity-70"
                      style={{
                        backgroundColor: "transparent",
                        color: isActive ? "var(--bg-main)" : "var(--gray-300)",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveReception(registrationId);
                      }}
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 탭 사이 구분선 (파이프라인) */}
                  {index !== uniqueOpenedReceptions.length - 1 && (
                    <div
                      className="w-px h-5 bg-[var(--border-1)] self-center relative z-0"
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              );
            })
          ) : (
            <> </>
          )}
        </div>
      </div>

      {/* 수정 중인 환자 경고 팝업 */}
      <MyPopupYesNo
        isOpen={showUnsavedChangesConfirm}
        onCloseAction={handleCancelUnsavedChanges}
        onConfirmAction={handleConfirmUnsavedChanges}
        title="수정 중인 환자 정보"
        message={`작성중인 환자내역이 있습니다.\n닫으시겠습니까?`}
        confirmText="확인"
        cancelText="취소"
      />
    </div>
  );
}
