import React, { useState, useEffect, useRef, useCallback } from "react";
import { getGender } from "@/lib/patient-utils";
import {
  AppointmentStatus,
  AppointmentStatusLabel,
} from "@/constants/common/common-enum";
import { useToastHelpers } from "@/components/ui/toast";
import DraggableWrapper, { Position } from "./draggable-wrapper";
import { MyPopupYesNo, MyPopupMsg } from "@/components/yjg/my-pop-up";
import MyPopup from "@/components/yjg/my-pop-up";
import NhicForm from "@/components/nhic-form/nhic-form";
import "@/styles/figma-colors.css";
import { useHandleAppointment } from "@/hooks/appointment/actions/use-handle-appointment";
import { usePatientReception } from "@/hooks/reception/use-patient-reception";
import { useAppointmentStore } from "@/store/appointment-store";
import { convertToYYYYMMDD } from "@/lib/date-utils";
import type { Appointment } from "@/types/appointments/appointments";
import { AppointmentStatusNoshow, DdocDocIcon } from "@/components/custom-icons";
import { formatTime, renderExternalPlatformIcon } from "@/lib/reservation-utils";
import { NewPatientBadge } from "@/app/medical/_components/widgets/medical-patient-badge";
import { stripHtmlTags } from "@/utils/template-code-utils";
import AppointmentCancelReasonModal from "@/app/reception/_components/panels/(patients-list)/appointment-cancel-reason-modal";
import { DdocDocService } from "@/services/ddocdoc-service";
import { Skeleton } from "@/components/ui/skeleton";

interface AppointmentCardProps {
  appointment: {
    id: string;
    originalData?: any;
    start: Date;
    end: Date;
    color?: string;
    title?: string;
    memo?: string;
    patientId?: number;
  };
  viewType?: "daily" | "weekly" | "monthly";
  // onClick?: (appointment: any) => void;
  onDoubleClick?: (appointment: any) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
  className?: string;
  style?: React.CSSProperties;
  useCustomLayout?: boolean; // 커스텀 레이아웃 사용 여부
  isDraggable?: boolean; // 드래그 가능 여부
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  viewType = "daily",
  // onClick,
  onDoubleClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
  className = "",
  style = {},
  useCustomLayout = false,
  isDraggable = false,
}) => {
  const { originalData, start, color = "#3b82f6" } = appointment;
  const patientId = originalData?.patientId;
  const {
    handleAppointmentToRegistration,
    showQualificationComparePopup,
    qualificationCompareData,
    handleQualificationCompareApplyPromise,
    handleQualificationCompareCancelPromise,
  } = usePatientReception();
  // 컨텍스트 메뉴 상태
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  } | null>(null);

  // 드롭 확인 팝업 상태
  const [dropConfirmPopup, setDropConfirmPopup] = useState<{
    isOpen: boolean;
    dropInfo: {
      date: string;
      startTime: string;
      endTime: string;
      timeInterval: string;
      viewType: string;
      appointmentRoomId: string;
      appointmentRoomName: string;
      doctorId: string | null;
      doctorName: string;
    } | null;
  }>({
    isOpen: false,
    dropInfo: null,
  });

  // 기접수내역 없음 경고 팝업 상태
  const [showNoReceptionHistoryWarning, setShowNoReceptionHistoryWarning] =
    useState(false);

  // 예약 취소 사유 모달 상태
  const [showCancelReasonModal, setShowCancelReasonModal] = useState(false);

  // 사전문진 모달 상태
  const [healthCheckModal, setHealthCheckModal] = useState<{
    isOpen: boolean;
    url: string;
  }>({ isOpen: false, url: "" });
  const [isHealthCheckIframeLoaded, setIsHealthCheckIframeLoaded] = useState(false);

  const toastHelpers = useToastHelpers();
  const { setCopiedAppointment } = useAppointmentStore();

  // 예약 처리 훅 사용
  const {
    handleUpdateAppointment,
    handleCancelAppointment,
    handleMarkAsVisited,
    forceConfirmState,
    validateAppointmentUpdate,
  } = useHandleAppointment(undefined, {
    onSuccess: () => {
      window.dispatchEvent(new CustomEvent("appointmentCreated"));
    },
  });

  // contextMenu 열기
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // contextMenu가 열릴 때 hover card 숨기기
    if (onMouseLeave) {
      onMouseLeave();
    }
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // contextMenu 닫기
  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // 예약 상태 업데이트
  const updateAppointmentStatus = async (
    appointmentId: string,
    newStatus: AppointmentStatus
  ) => {
    try {
      await handleUpdateAppointment(Number(appointmentId), {
        status: newStatus,
      });

      toastHelpers.success(
        `예약이 ${AppointmentStatusLabel[newStatus]}되었습니다.`
      );
      window.dispatchEvent(new CustomEvent("appointmentCreated"));
      closeContextMenu();
    } catch (error) {
      console.error("예약 상태 업데이트 실패:", error);
      toastHelpers.error("예약 상태 업데이트에 실패했습니다.");
    }
  };

  // 사전문진 모달 열기
  const handleOpenHealthCheck = async () => {
    closeContextMenu();
    setIsHealthCheckIframeLoaded(false);
    setHealthCheckModal({ isOpen: true, url: "" });
    try {
      const url = await DdocDocService.getHealthCheckUrl(appointment.id);
      setHealthCheckModal({ isOpen: true, url });
    } catch (error) {
      console.error("사전문진 URL 조회 실패:", error);
      toastHelpers.error("사전문진 URL 조회에 실패했습니다.");
      setHealthCheckModal({ isOpen: false, url: "" });
    }
  };

  // 예약 취소 사유 모달 열기 (컨텍스트 메뉴에서 예약취소 클릭 시)
  const handleOpenCancelReasonModal = () => {
    closeContextMenu();
    setShowCancelReasonModal(true);
  };

  // 예약 취소 사유 확인 처리 (토스트는 useHandleAppointment에서 표시)
  const handleConfirmCancelWithReason = async (reason: string) => {
    const appointmentId = appointment.id;
    try {
      await handleCancelAppointment(Number(appointmentId), reason);
      setShowCancelReasonModal(false);
      window.dispatchEvent(new CustomEvent("appointmentCreated"));
    } catch (error) {
      console.error("예약 취소 실패:", error);
      toastHelpers.error("예약 취소에 실패했습니다.");
    }
  };

  // 예약 생성 (빈 슬롯)
  const handleCreateAppointment = () => {
    // timeSlotGrid의 handleCreateAppointment와 동일한 동작
    // 부모 컴포넌트에 이벤트 전달
    if (onContextMenu) {
      const customEvent = new CustomEvent("createAppointment", {
        detail: { appointmentRoom: originalData?.appointmentRoom },
      });
      window.dispatchEvent(customEvent);
    }
    // contents-panel 새로고침
    window.dispatchEvent(new CustomEvent("appointmentCreated"));
    closeContextMenu();
  };

  // 예약 마감
  const handleCreateSlotClosure = () => {
    // timeSlotGrid의 handleCreateSlotClosure와 동일한 동작
    if (onContextMenu) {
      const customEvent = new CustomEvent("createSlotClosure", {
        detail: { appointmentRoom: originalData?.appointmentRoom },
      });
      window.dispatchEvent(customEvent);
    }
    // contents-panel 새로고침
    window.dispatchEvent(new CustomEvent("appointmentCreated"));
    closeContextMenu();
  };

  // 예약 복사
  const handleCopyAppointment = () => {
    if (!originalData) {
      toastHelpers.error("복사할 예약 정보가 없습니다.");
      closeContextMenu();
      return;
    }

    // 복사할 예약 데이터 저장
    setCopiedAppointment({
      ...originalData,
      viewType, // 현재 view type도 함께 저장
    });
    toastHelpers.success("예약이 복사되었습니다.");
    closeContextMenu();
  };

  // 예약 -> 접수 전환
  const handleCheckIn = async () => {
    closeContextMenu();

    if (!originalData) {
      return;
    }

    // 통합 함수 사용
    await handleAppointmentToRegistration(originalData as Appointment, {
      receptionTime: new Date(),
      handleMarkAsVisited: async (appointmentId: number) => {
        await handleMarkAsVisited(appointmentId);
      },
      onNoReceptionHistory: () => {
        setShowNoReceptionHistoryWarning(true);
      },
      onRefresh: () => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("refreshPatientsData", {
              detail: { type: "all" }, // 예약과 접수 모두 새로고침
            })
          );
        }
      },
      onError: (error: Error) => {
        toastHelpers.error(error.message || "예약을 접수로 전환하는데 실패했습니다.");
      },
    });
  };

  // 환자 정보 추출 (originalData가 없으면 기본값 사용)
  const patientName =
    originalData?.patientName ||
    originalData?.patient?.name ||
    appointment.title ||
    "환자명 없음";
  const gender = originalData?.patient?.gender || originalData?.gender || "";
  const age = originalData?.patient?.age || originalData?.age || "";
  const memo =
    originalData?.memo || originalData?.description || appointment.memo || "";
  // const status = originalData?.status;
  const type = originalData?.appointmentType?.name || "";
  const externalPlatform = originalData?.externalPlatform?.platformCode || "";

  // 나이 계산 (생년월일이 있는 경우)
  let ageText = "";
  if (originalData?.patient?.birthDate) {
    let birthDate: Date;

    // YYYYMMDD 형식 (8자리) 처리
    if (
      typeof originalData.patient.birthDate === "string" &&
      originalData.patient.birthDate.length === 8
    ) {
      const year = parseInt(originalData.patient.birthDate.slice(0, 4));
      const month = parseInt(originalData.patient.birthDate.slice(4, 6)) - 1; // 월은 0부터 시작
      const day = parseInt(originalData.patient.birthDate.slice(6, 8));
      birthDate = new Date(year, month, day);
    } else {
      // ISO 형식 또는 다른 형식
      birthDate = new Date(originalData.patient.birthDate.toString());
    }

    if (!isNaN(birthDate.getTime())) {
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        calculatedAge--;
      }
      ageText = `${calculatedAge}`;
    }
  } else if (age) {
    ageText = `${age}`;
  }

  // daily-view 렌더링 (베이스)
  const displayText = patientId
    ? `${patientName} (${getGender(gender, "ko")}/${ageText})`.trim()
    : `${patientName}(간이)`.trim();

  // 상태별 스타일 통합 생성
  const getStatusStyles = () => {
    const status = originalData?.status || AppointmentStatus.PENDING;

    const baseStyles = {
      borderLeftColor: color,
      borderLeftWidth: "4px",
      borderLeftStyle: "solid" as const,
    };

    switch (status) {
      case AppointmentStatus.NOSHOW:
        return {
          ...baseStyles,
          backgroundColor: "var(--bg-3)",
          borderTopColor: "var(--bg-3)",
          borderTopWidth: "1px",
          borderTopStyle: "solid" as const,
          borderRightColor: "var(--bg-3)",
          borderRightWidth: "1px",
          borderRightStyle: "solid" as const,
          borderBottomColor: "var(--bg-3)",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid" as const,
        };
      case AppointmentStatus.CANCELED:
        return {
          ...baseStyles,
          backgroundColor: "var(--bg-3)",
          borderTopColor: "var(--bg-3)",
          borderTopWidth: "1px",
          borderTopStyle: "solid" as const,
          borderRightColor: "var(--bg-3)",
          borderRightWidth: "1px",
          borderRightStyle: "solid" as const,
          borderBottomColor: "var(--bg-3)",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid" as const,
        };
      case AppointmentStatus.CONFIRMED:
        return {
          ...baseStyles,
          backgroundColor: `${color}E6`,
          borderTopColor: `${color}E6`,
          borderTopWidth: "1px",
          borderTopStyle: "solid" as const,
          borderRightColor: `${color}E6`,
          borderRightWidth: "1px",
          borderRightStyle: "solid" as const,
          borderBottomColor: `${color}E6`,
          borderBottomWidth: "1px",
          borderBottomStyle: "solid" as const,
        };
      case AppointmentStatus.VISITED:
        return {
          ...baseStyles,
          backgroundColor: `${color}80`,
          borderTopColor: `${color}80`,
          borderTopWidth: "1px",
          borderTopStyle: "solid" as const,
          borderRightColor: `${color}80`,
          borderRightWidth: "1px",
          borderRightStyle: "solid" as const,
          borderBottomColor: `${color}80`,
          borderBottomWidth: "1px",
          borderBottomStyle: "solid" as const,
        };
      case AppointmentStatus.PENDING:
        return {
          ...baseStyles,
          backgroundColor: "white",
          borderTopColor: color,
          borderTopWidth: "1px",
          borderTopStyle: "dashed" as const,
          borderRightColor: color,
          borderRightWidth: "1px",
          borderRightStyle: "dashed" as const,
          borderBottomColor: color,
          borderBottomWidth: "1px",
          borderBottomStyle: "dashed" as const,
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: "white",
          borderTopColor: "white",
          borderTopWidth: "1px",
          borderTopStyle: "solid" as const,
          borderRightColor: "white",
          borderRightWidth: "1px",
          borderRightStyle: "solid" as const,
          borderBottomColor: "white",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid" as const,
        };
    }
  };

  // 상태별 텍스트 색상 생성
  const getTextColor = () => {
    const status = originalData?.status || AppointmentStatus.PENDING;

    switch (status) {
      case AppointmentStatus.NOSHOW:
        return "text-[var(--gray-400)]";
      case AppointmentStatus.CANCELED:
        return "text-[var(--gray-600)]";
      case AppointmentStatus.CONFIRMED:
        return "text-[var(--bg-main)]";
      case AppointmentStatus.VISITED:
      case AppointmentStatus.PENDING:
        return "text-[var(--gray-300)]";
      default:
        return "text-[var(--gray-300)]";
    }
  };

  // 상태별 메모 색상 생성
  const getMemoColor = () => {
    const status = originalData?.status || AppointmentStatus.PENDING;

    switch (status) {
      case AppointmentStatus.CANCELED:
        return "text-[var(--gray-600)]";
      case AppointmentStatus.CONFIRMED:
        return "text-[var(--bg-main)]";
      case AppointmentStatus.PENDING:
      case AppointmentStatus.VISITED:
        return "text-[var(--gray-300)]";
      default:
        return "text-[var(--gray-400)]";
    }
  };

  const statusStyles = getStatusStyles();
  const textColor = getTextColor();
  const memoColor = getMemoColor();

  // 상태별 표시 스타일 (NOSHOW 라벨, line-through 등)
  const getStatusDisplayStyle = () => {
    const status = originalData?.status || AppointmentStatus.PENDING;

    switch (status) {
      case AppointmentStatus.NOSHOW:
        return {
          showLabel: true,
          textStyle: "text-red-600",
        };
      case AppointmentStatus.CANCELED:
        return {
          showLabel: false,
          textStyle: "line-through",
        };
      default:
        return {
          showLabel: false,
          textStyle: "",
        };
    }
  };

  const statusDisplayStyle = getStatusDisplayStyle();

  // 텍스트 컨테이너 및 카드 컨테이너 너비 측정을 위한 ref
  const textContainerRef = useRef<HTMLDivElement>(null);
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const [textWidth, setTextWidth] = useState<number>(0);
  const [isCompactLayout, setIsCompactLayout] = useState<boolean>(false);
  const [showMemo, setShowMemo] = useState<boolean>(true);
  const [showRoomName, setShowRoomName] = useState<boolean>(true);

  // 텍스트 컨테이너 너비 측정 - 실제 텍스트 요소들의 너비 합산 (카드 너비로 제한)
  useEffect(() => {
    if (textContainerRef.current && cardContainerRef.current) {
      const container = textContainerRef.current;
      const cardContainer = cardContainerRef.current;
      let totalWidth = 0;

      // 모든 텍스트 요소들의 너비를 합산
      const textElements = container.querySelectorAll("span");
      textElements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        totalWidth += rect.width;
      });

      // noshow 이미지가 있는 경우 너비 추가
      const noshowImg = container.querySelector("img");
      if (noshowImg) {
        const imgRect = noshowImg.getBoundingClientRect();
        totalWidth += imgRect.width;
      }

      // 카드 너비 측정 (padding 고려)
      const cardRect = cardContainer.getBoundingClientRect();
      const cardWidth = cardRect.width;
      const paddingLeft = 8; // pl-2 = 0.5rem = 8px
      const maxLineWidth = cardWidth - paddingLeft - 4; // 여유 공간 4px

      // 텍스트 너비를 카드 너비로 제한
      const calculatedWidth = Math.min(totalWidth + 15, maxLineWidth);
      setTextWidth(calculatedWidth);
    }
  }, [displayText, type, memo, originalData?.status]);

  // 카드 높이 체크하여 컴팩트 레이아웃 및 표시 요소 결정
  useEffect(() => {
    if (viewType !== "weekly") return;

    const checkHeight = () => {
      if (cardContainerRef.current) {
        const cardHeight = cardContainerRef.current.offsetHeight;

        // 40px 이하: 컴팩트 레이아웃 (한 줄로 모든 정보 표시)
        if (cardHeight <= 40) {
          setIsCompactLayout(true);
          setShowMemo(true);
          setShowRoomName(true);
        }
        // 40px 초과 60px 이하: displayText + type + memo만 표시
        else if (cardHeight <= 60) {
          setIsCompactLayout(false);
          setShowMemo(true);
          setShowRoomName(false);
        }
        // 60px 초과: 모든 요소 표시
        else {
          setIsCompactLayout(false);
          setShowMemo(true);
          setShowRoomName(true);
        }
      }
    };

    // 초기 체크
    checkHeight();

    // ResizeObserver를 사용하여 크기 변경 감지
    const resizeObserver = new ResizeObserver(checkHeight);
    if (cardContainerRef.current) {
      resizeObserver.observe(cardContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [viewType, style?.height]);

  // 예약 상태에 따른 컨텍스트 메뉴 렌더링
  const renderContextMenu = () => {
    if (!contextMenu?.visible) return null;

    const currentStatus = originalData?.status || AppointmentStatus.PENDING;
    const appointmentId = appointment.id;

    // 빈 슬롯인 경우 (EMPTY)
    if (!originalData) {
      return (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            width: "80px",
            maxWidth: "80px",
            minWidth: "80px",
          }}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
            onClick={handleCreateAppointment}
          >
            예약생성
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
            onClick={handleCreateSlotClosure}
          >
            예약마감
          </button>
        </div>
      );
    }

    // 예약이 있는 경우 상태별 메뉴
    switch (currentStatus) {
      case AppointmentStatus.PENDING:
        return (
          <div
            className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              width: "80px",
              maxWidth: "80px",
              minWidth: "80px",
            }}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={() =>
                updateAppointmentStatus(
                  appointmentId,
                  AppointmentStatus.CONFIRMED
                )
              }
            >
              예약확정
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={handleOpenCancelReasonModal}
            >
              예약취소
            </button>
          </div>
        );

      case AppointmentStatus.VISITED:
        return (
          <div
            className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              width: "80px",
              maxWidth: "80px",
              minWidth: "80px",
            }}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={() =>
                updateAppointmentStatus(
                  appointmentId,
                  AppointmentStatus.CONFIRMED
                )
              }
            >
              접수철회
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={handleCopyAppointment}
            >
              예약복사
            </button>
          </div>
        );

      case AppointmentStatus.NOSHOW:
        return (
          <div
            className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              width: "80px",
              maxWidth: "80px",
              minWidth: "80px",
            }}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={() =>
                updateAppointmentStatus(
                  appointmentId,
                  AppointmentStatus.VISITED
                )
              }
            >
              노쇼철회
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={handleCopyAppointment}
            >
              예약복사
            </button>
          </div>
        );

      case AppointmentStatus.CANCELED:
        return (
          <div
            className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              width: "80px",
              maxWidth: "80px",
              minWidth: "80px",
            }}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={() =>
                updateAppointmentStatus(
                  appointmentId,
                  AppointmentStatus.CONFIRMED
                )
              }
            >
              취소철회
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={handleCopyAppointment}
            >
              예약복사
            </button>
          </div>
        );

      case AppointmentStatus.CONFIRMED:
        return (
          <div
            className="fixed bg-white border border-gray-300 rounded-lg shadow-lg py-2 z-50"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              width: "80px",
              maxWidth: "80px",
              minWidth: "80px",
            }}
          >                        <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={handleDoubleClick}
          >
              예약수정
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={handleOpenCancelReasonModal}
            >
              예약취소
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={handleCopyAppointment}
            >
              예약복사
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={handleCheckIn}
            >
              접수
            </button>
            <button
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
              onClick={() =>
                updateAppointmentStatus(appointmentId, AppointmentStatus.NOSHOW)
              }
            >
              노쇼
            </button>
            {externalPlatform === "ddocdoc" && (
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--violet-1)] transition-colors"
                onClick={handleOpenHealthCheck}
              >
                사전문진
              </button>
            )}
          </div >
        );

      default:
        return null;
    }
  };

  // 외부 클릭 시 컨텍스트 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
    };

    if (contextMenu?.visible) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("contextmenu", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("contextmenu", handleClickOutside);
    };
  }, [contextMenu]);

  const handleDoubleClick = () => {
    if (onDoubleClick) {
      // 예약 ID를 포함하여 전달
      onDoubleClick({
        ...appointment,
        appointmentId: appointment.id,
      });
    }
  };

  // 드래그 이벤트 핸들러
  const handleDragStart = useCallback((data: any) => {
    console.log("드래그 시작:", data);
  }, []);

  const handleDragMove = useCallback(() => {
    // 드래그 중 처리 (필요시)
  }, []);

  const handleDragEnd = useCallback(
    async (data: any, position: Position) => {
      console.log("드래그 종료:", { position, data });

      // 드롭 대상 찾기 (data-drop-target 속성이 있는 요소)
      const elements = document.elementsFromPoint(
        position.clientX,
        position.clientY
      );
      const dropTarget = elements.find((el) =>
        el.hasAttribute("data-drop-target")
      );

      if (dropTarget) {
        // 먼저 예약 수정 가능 여부 검증
        const validation = await validateAppointmentUpdate(
          Number(appointment.id)
        );

        if (!validation.isValid) {
          toastHelpers.error(validation.error || "예약을 수정할 수 없습니다.");
          return;
        }

        const dateString = dropTarget.getAttribute("data-date");
        const startTime = dropTarget.getAttribute("data-start-time");
        const endTime = dropTarget.getAttribute("data-end-time");
        const timeInterval = dropTarget.getAttribute("data-time-interval");
        const viewType = dropTarget.getAttribute("data-view-type");
        const appointmentRoomId = dropTarget.getAttribute(
          "data-appointment-room-id"
        );
        const appointmentRoomName = dropTarget.getAttribute(
          "data-appointment-room-name"
        );
        const doctorId = dropTarget.getAttribute("data-doctor-id") || null;
        const doctorName = dropTarget.getAttribute("data-doctor-name");

        // 원본 데이터와 비교
        const originalStartTime =
          data.appointment.originalData?.appointmentStartTime;
        const originalAppointmentRoomId =
          data.appointment.originalData?.appointmentRoomId;
        const originalAppointmentRoomName =
          data.appointment.originalData?.appointmentRoom?.displayName;
        const originalDoctorId =
          data.appointment.originalData?.doctorId || null;
        const originalDoctorName =
          data.appointment.originalData?.doctor?.name;

        if (originalStartTime) {
          const originalDate = new Date(originalStartTime);
          const originalTime = formatTime(
            originalDate.getHours(),
            originalDate.getMinutes()
          );
          const originalDateString = convertToYYYYMMDD(
            originalDate.toISOString().split("T")[0]
          );
          const dateStringFormatted = convertToYYYYMMDD(dateString);

          // 시간과 날짜가 다르면 드롭 진행
          if (
            startTime !== originalTime ||
            dateStringFormatted !== originalDateString
          ) {
            // 드롭 진행
          } else {
            // 시간과 날짜가 같을 때
            const isSameRoom =
              appointmentRoomId === originalAppointmentRoomId?.toString();

            // Daily 뷰가 아니거나, Daily 뷰에서 진료실도 같으면 드롭 취소
            if (viewType !== "daily" || isSameRoom) {
              return;
            }
          }
        }

        // 검증 통과 후 드롭 확인 팝업 열기
        setDropConfirmPopup({
          isOpen: true,
          dropInfo: {
            date: dateString || "",
            startTime: startTime || "",
            endTime: endTime || "",
            timeInterval: timeInterval || "",
            viewType: viewType || "daily",
            appointmentRoomId: viewType === "daily" ? appointmentRoomId || "" : originalAppointmentRoomId || "",
            appointmentRoomName: viewType === "daily" ? appointmentRoomName || "" : originalAppointmentRoomName || "",
            doctorId: viewType === "daily" ? doctorId || null : originalDoctorId || null,
            doctorName: viewType === "daily" ? doctorName || "" : originalDoctorName || "",
          },
        });
      } else {
        console.log("드롭 대상을 찾을 수 없습니다.");
      }
    },
    [appointment.id, validateAppointmentUpdate, toastHelpers]
  );

  // 드롭 확인 팝업 - 확인 버튼 클릭
  const handleConfirmDrop = useCallback(async () => {
    if (!dropConfirmPopup.dropInfo) return;

    const {
      date,
      startTime,
      timeInterval,
      viewType,
      appointmentRoomId,
      doctorId,
    } = dropConfirmPopup.dropInfo;

    // 날짜와 시간을 합쳐서 Date 객체로 변환
    const startDateTime = new Date(`${date}T${startTime}:00`);

    // viewType에 따라 durationMinutes 결정
    let durationMinutes: number;
    if (viewType === "weekly") {
      // weekly 뷰: 기존 예약의 appointmentRoom.timeSlotDuration 사용
      durationMinutes =
        appointment.originalData?.appointmentRoom?.timeSlotDuration ||
        appointment.originalData?.timeSlotDuration ||
        60; // 기본 60분
    } else {
      // daily 뷰: 선택한 슬롯의 timeInterval 사용
      durationMinutes = parseInt(timeInterval) || 30; // 기본 30분
    }

    // endTime을 startTime + durationTime으로 계산
    const endDateTime = new Date(
      startDateTime.getTime() + durationMinutes * 60 * 1000
    );
    // patientId 확인 및 설정
    const patientId = appointment.originalData?.patient.id;

    if (!patientId) {
      toastHelpers.error("환자 정보를 찾을 수 없습니다.");
      return;
    }

    // 예약 업데이트 데이터 구성
    const updateData = {
      hospitalId: appointment.originalData.hospitalId,
      patientId: Number(patientId),
      appointmentTypeId: appointment.originalData.appointmentTypeId ? Number(appointment.originalData.appointmentTypeId) : null,
      status: appointment.originalData.status,
      memo: appointment.originalData.memo,
      platform: 1,
      isSimplePatient: appointment.originalData.isSimplePatient,
      excludeAutoMessage: appointment.originalData.excludeAutoMessage,
      receptionistId: appointment.originalData.receptionistId,
      ...(appointment.originalData.isSimplePatient &&
        appointment.originalData.temporaryPatient
        ? {
          temporaryPatient: {
            name: appointment.originalData.temporaryPatient?.name,
            phone1: appointment.originalData.temporaryPatient?.phone,
            birthDate: convertToYYYYMMDD(
              appointment.originalData.temporaryPatient?.birthDate
            ),
          },
        }
        : {}),
      appointmentStartTime: startDateTime,
      appointmentEndTime: endDateTime,
      appointmentRoomId: Number(appointmentRoomId),
      doctorId: doctorId ? Number(doctorId) : null,
    };

    try {
      const validation = await validateAppointmentUpdate(
        Number(appointment.id)
      );
      if (!validation.isValid) {
        toastHelpers.error(validation.error || "예약을 수정할 수 없습니다.");
        return;
      }
      setDropConfirmPopup({ isOpen: false, dropInfo: null });
      await handleUpdateAppointment(Number(appointment.id), updateData);
    } catch (error: any) {
      // 사용자가 취소한 경우 또는 에러 발생
      setDropConfirmPopup({ isOpen: false, dropInfo: null });
    }
  }, [
    dropConfirmPopup.dropInfo,
    appointment.id,
    appointment.originalData,
    handleUpdateAppointment,
    toastHelpers,
  ]);

  // 드롭 확인 팝업 - 취소 버튼 클릭
  const handleCancelDrop = useCallback(() => {
    setDropConfirmPopup({ isOpen: false, dropInfo: null });
  }, []);

  // 포지셔닝 클래스 결정 (useCustomLayout에 따라)
  const positionClass = useCustomLayout ? "" : "left-2 right-2";

  // 팝업 렌더링 (모든 viewType에 공통으로 적용)
  const popupsElement = (
    <>
      {/* 컨텍스트 메뉴 */}
      {renderContextMenu()}

      {/* 드롭 확인 팝업 */}
      <MyPopupYesNo
        isOpen={dropConfirmPopup.isOpen}
        onCloseAction={handleCancelDrop}
        onConfirmAction={handleConfirmDrop}
        title="예약 수정"
        message={`${dropConfirmPopup.dropInfo?.appointmentRoomName} ${dropConfirmPopup.dropInfo?.startTime}으로 예약을 수정하시겠습니까?`}
        confirmText="확인"
        cancelText="취소"
      />

      {/* Force 확인 팝업 (훅에서 자동 관리) */}
      <MyPopupYesNo
        isOpen={forceConfirmState.isOpen}
        onCloseAction={forceConfirmState.onCancel}
        onConfirmAction={forceConfirmState.onConfirm}
        title="예약 수정 확인"
        message={forceConfirmState.message}
        confirmText="예약수정"
        cancelText="취소"
      />

      {/* 기접수내역 없음 경고 팝업 */}
      <MyPopupMsg
        isOpen={showNoReceptionHistoryWarning}
        onCloseAction={() => setShowNoReceptionHistoryWarning(false)}
        title="예약접수"
        msgType="warning"
        message="기접수내역이 없어 접수전환을 할 수 없습니다."
      />

      {/* 자격조회 비교 모드 팝업 */}
      <MyPopup
        isOpen={showQualificationComparePopup && !!qualificationCompareData}
        onCloseAction={handleQualificationCompareCancelPromise}
        title="자격조회 비교"
        width="800px"
        height="600px"
        closeOnOutsideClick={false}
      >
        <NhicForm
          isOpen={showQualificationComparePopup}
          onClose={handleQualificationCompareCancelPromise}
          onApply={handleQualificationCompareApplyPromise}
          onCancel={handleQualificationCompareCancelPromise}
          isCompareMode={true}
          parsedData={qualificationCompareData?.parsedData}
          rawData={null}
        />
      </MyPopup>

      {/* 예약 취소 사유 모달 */}
      <AppointmentCancelReasonModal
        isOpen={showCancelReasonModal}
        appointment={originalData ?? null}
        onClose={() => setShowCancelReasonModal(false)}
        onConfirm={handleConfirmCancelWithReason}
      />

      {/* 사전문진 모달 */}
      <MyPopup
        isOpen={healthCheckModal.isOpen}
        onCloseAction={() => setHealthCheckModal({ isOpen: false, url: "" })}
        title="사전문진"
        width="800px"
        height="600px"
        closeOnOutsideClick={false}
      >
        {(!healthCheckModal.url || !isHealthCheckIframeLoaded) && (
          <div className="absolute inset-0 p-5 flex flex-col gap-4 bg-[var(--card-bg)]">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-64 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-5 w-24 ml-4" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="flex-1 h-60 rounded-md" />
              <Skeleton className="flex-1 h-60 rounded-md" />
            </div>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        )}
        {healthCheckModal.url && (
          <iframe
            src={healthCheckModal.url}
            className={`w-full h-full border-0 ${isHealthCheckIframeLoaded ? "" : "invisible"}`}
            title="사전문진"
            onLoad={() => setIsHealthCheckIframeLoaded(true)}
          />
        )}
      </MyPopup>
    </>
  );

  // monthly-view 렌더링 (특별 케이스 - 한 줄 표시)
  if (viewType === "monthly") {
    const startTime = `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}`;

    const cardContent = (
      <div
        className="text-xs p-0.5 rounded hover:opacity-80 transition-opacity shadow-sm border border-gray-300 mb-1 relative cursor-pointer"
        style={statusStyles}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-testid="reservation-card"
        data-appointment-id={appointment.id}
      >
        <div className="flex items-center space-x-0.5 truncate">
          {/* NOSHOW 아이콘 */}
          {statusDisplayStyle.showLabel && (
            <AppointmentStatusNoshow className="w-3 h-3 mr-1" />
          )}

          {appointment.originalData?.isNewPatient && <NewPatientBadge isNewPatient={appointment.originalData.isNewPatient} />}

          {/* 예약시간 */}
          <span className={`font-medium flex-shrink-0 ${textColor}`}>
            {startTime}
          </span>

          {/* 환자 이름 */}
          <span className={`truncate ${textColor}`}>{patientName}</span>

          {/* appointmentType 뱃지 */}
          {type && (
            <span
              className="inline-flex items-center px-1 py-0.5 rounded text-xs font-light flex-shrink-0 text-[var(--bg-main)]"
              style={{ backgroundColor: color }}
            >
              {type.substring(0, 1)}
            </span>
          )}
        </div>

        {/* CANCELED 상태일 때 취소선 오버레이 */}
        {statusDisplayStyle.textStyle === "line-through" && (
          <div
            className="absolute top-1/2 left-1 right-1 pointer-events-none"
            style={{
              transform: "translateY(-50%)",
              height: "1px",
              backgroundColor: "var(--gray-600)",
            }}
          />
        )}
      </div>
    );

    return (
      <>
        {isDraggable ? (
          <DraggableWrapper
            id={appointment.id}
            data={{ appointment, originalData }}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            showOverlay={true}
            dragOverlay={cardContent}
          >
            {cardContent}
          </DraggableWrapper>
        ) : (
          cardContent
        )}

        {popupsElement}
      </>
    );
  }

  // daily-view 렌더링 (베이스)
  if (viewType === "daily") {
    const cardContent = (
      <div
        ref={cardContainerRef}
        className={`hover:bg-gray-50 text-gray-900 rounded-md transition-colors shadow-sm border border-gray-300 h-full w-full cursor-pointer`}
        style={statusStyles}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-testid="reservation-card"
        data-appointment-id={appointment.id}
      >
        <div className="pl-2 h-full flex flex-col justify-center relative">
          <div
            ref={textContainerRef}
            className="flex items-center font-medium text-sm truncate leading-tight gap-0.5"
          >
            {statusDisplayStyle.showLabel && (
              <AppointmentStatusNoshow className="w-3 h-3 mr-1" />
            )}
            {appointment.originalData?.isNewPatient && <NewPatientBadge isNewPatient={appointment.originalData.isNewPatient} />}
            <span className={`${textColor} text-[12px]`}>{displayText}</span>
            {(() => {
              if ((externalPlatform || "") === "ddocdoc") {
                return <DdocDocIcon className="w-4 h-4" aria-label=" externalPlatform" />;
              }
              const iconSrc = renderExternalPlatformIcon(externalPlatform || "");
              return iconSrc ? <img src={iconSrc} alt="externalPlatform" className="w-4 h-4" /> : null;
            })()}
            {type && (
              <span
                className="inline-flex items-center px-1 py-0.5 rounded text-sm font-medium text-[var(--bg-main)]"
                style={{ backgroundColor: color }}
              >
                {type.substring(0, 1)}
              </span>
            )}
            {stripHtmlTags(memo || "") && (
              <span
                className={`inline-flex items-center px-1 py-0.5 rounded font-light ${memoColor}`}
              >
                {stripHtmlTags(memo || "")}
              </span>
            )}
          </div>

          {/* CANCELED 상태일 때 취소선 오버레이 - 텍스트 영역까지만 */}
          {statusDisplayStyle.textStyle === "line-through" && textWidth > 0 && (
            <div
              className="absolute top-1/2 left-0 pointer-events-none"
              style={{
                transform: "translateY(-50%)",
                width: `${textWidth}px`,
                height: "1px",
                backgroundColor: "var(--gray-600)",
              }}
            />
          )}
        </div>
      </div>
    );

    return (
      <>
        {isDraggable ? (
          <DraggableWrapper
            id={appointment.id}
            data={{ appointment, originalData }}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            showOverlay={true}
            dragOverlay={cardContent}
            className={`absolute ${positionClass} z-30 ${className}`}
            style={style}
          >
            {cardContent}
          </DraggableWrapper>
        ) : (
          <div
            className={`absolute ${positionClass} z-30 ${className}`}
            style={style}
          >
            {cardContent}
          </div>
        )}

        {popupsElement}
      </>
    );
  }

  // weekly-view 렌더링
  if (viewType === "weekly") {
    const appointmentRoomName =
      originalData?.appointmentRoom?.name ||
      originalData?.appointmentRoomName ||
      "";

    const cardContent = (
      <div
        ref={cardContainerRef}
        className={`hover:bg-gray-50 text-gray-900 rounded-md transition-colors shadow-sm border border-gray-300 h-full w-full cursor-pointer`}
        style={statusStyles}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-testid="reservation-card"
        data-appointment-id={appointment.id}
      >
        <div className="pl-2 pt-0.5 h-full flex flex-col justify-start relative">
          {isCompactLayout ? (
            /* 컴팩트 레이아웃: 한 줄로 모든 정보 표시 */
            <div
              ref={textContainerRef}
              className="flex items-center font-medium truncate text-sm leading-tight gap-0.5"
            >
              {statusDisplayStyle.showLabel && (
                <img
                  src={`/noshow.svg`}
                  alt="noshow"
                  className="w-3 h-3 mr-1"
                />
              )}
              {appointment.originalData?.isNewPatient && <NewPatientBadge isNewPatient={appointment.originalData.isNewPatient} />}
              <span className={`${textColor} text-[12px]`}>{displayText}</span>
              {type && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded font-medium text-[var(--bg-main)]"
                  style={{ backgroundColor: color }}
                >
                  {type.substring(0, 1)}
                </span>
              )}
              {(() => {
                if ((externalPlatform || "") === "ddocdoc") {
                  return <DdocDocIcon className="w-4 h-4" aria-label="externalPlatform" />;
                }
                const iconSrc = renderExternalPlatformIcon(externalPlatform || "");
                return iconSrc ? <img src={iconSrc} alt="externalPlatform" className="w-4 h-4" /> : null;
              })()}
              {memo && (
                <span
                  className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded font-light ${memoColor} truncate`}
                >
                  {stripHtmlTags(memo || "")}
                </span>
              )}
              {appointmentRoomName && (
                <span
                  className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded font-light text-[var(--gray-400)] truncate`}
                >
                  {appointmentRoomName}
                </span>
              )}
            </div>
          ) : (
            /* 일반 레이아웃: 우선순위에 따라 표시 */
            <>
              {/* 첫 번째 줄: displayText + type (최우선) */}
              <div
                ref={textContainerRef}
                className="flex items-center font-medium truncate text-sm leading-tight gap-0.5"
              >
                {statusDisplayStyle.showLabel && (
                  <AppointmentStatusNoshow className="w-3 h-3 mr-1" />
                )}
                {appointment.originalData?.isNewPatient && <NewPatientBadge isNewPatient={appointment.originalData.isNewPatient} />}
                <span className={`${textColor} text-[12px]`}>{displayText}</span>
                {type && (
                  <span
                    className="inline-flex items-center px-1.5 py-0.5 rounded font-medium text-[var(--bg-main)]"
                    style={{ backgroundColor: color }}
                  >
                    {type.substring(0, 1)}
                  </span>
                )}
                {(() => {
                  if ((externalPlatform || "") === "ddocdoc") {
                    return <DdocDocIcon className="w-4 h-4" aria-label="externalPlatform" />;
                  }
                  const iconSrc = renderExternalPlatformIcon(externalPlatform || "");
                  return iconSrc ? <img src={iconSrc} alt="externalPlatform" className="w-4 h-4" /> : null;
                })()}
              </div>

              {/* 두 번째 줄: memo (두 번째 우선순위) */}
              {memo && showMemo && (
                <div className="flex items-center">
                  <span
                    className={`text-xs rounded font-light ${memoColor} truncate`}
                  >
                    {stripHtmlTags(memo || "")}
                  </span>
                </div>
              )}

              {/* 세 번째 줄: appointmentRoomName (공간이 있을 때만 표시) */}
              {appointmentRoomName && showRoomName && (
                <div className="flex items-center">
                  <span
                    className={`text-xs rounded font-light text-[var(--gray-400)] truncate`}
                  >
                    {appointmentRoomName}
                  </span>
                </div>
              )}
            </>
          )}

          {/* CANCELED 상태일 때 취소선 오버레이 - 텍스트 영역까지만 */}
          {statusDisplayStyle.textStyle === "line-through" && textWidth > 0 && (
            <div
              className="absolute top-1/2 left-0 pointer-events-none"
              style={{
                transform: "translateY(-50%)",
                width: `${textWidth}px`,
                height: "1px",
                backgroundColor: "var(--gray-600)",
              }}
            />
          )}
        </div>
      </div>
    );

    return (
      <>
        {isDraggable ? (
          <DraggableWrapper
            id={appointment.id}
            data={{ appointment, originalData }}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            showOverlay={true}
            dragOverlay={cardContent}
            className={`absolute ${positionClass} z-30 ${className}`}
            style={style}
          >
            {cardContent}
          </DraggableWrapper>
        ) : (
          <div
            className={`absolute ${positionClass} z-30 ${className}`}
            style={style}
          >
            {cardContent}
          </div>
        )}

        {popupsElement}
      </>
    );
  }

  // daily-view 렌더링 (기본값)
  const defaultCardContent = (
    <div
      ref={cardContainerRef}
      className={`hover:bg-gray-50 text-gray-900 rounded-md transition-colors shadow-sm border border-gray-300 h-full w-full cursor-pointer`}
      style={statusStyles}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-appointment-id={appointment.id}
    >
      <div className="pl-2 h-full flex flex-col justify-center relative">
        <div
          ref={textContainerRef}
          className="flex items-center font-medium truncate text-md leading-tight"
        >
          {statusDisplayStyle.showLabel && (
            <img src={`/noshow.svg`} alt="noshow" className="w-4 h-4 mr-1" />
          )}
          {appointment.originalData?.isNewPatient && <NewPatientBadge isNewPatient={appointment.originalData.isNewPatient} />}
          <span className={`${textColor} text-xs`}>{displayText}</span>
          {type && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-sm font-medium ml-1 text-[var(--bg-main)]">
              {type.substring(0, 1)}
            </span>
          )}
          {memo && (
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-md ml-1 ${memoColor}`}
            >
              {stripHtmlTags(memo || "")}
            </span>
          )}
        </div>

        {/* CANCELED 상태일 때 취소선 오버레이 - 텍스트 영역까지만 */}
        {statusDisplayStyle.textStyle === "line-through" && textWidth > 0 && (
          <div
            className="absolute top-1/2 left-0 pointer-events-none"
            style={{
              transform: "translateY(-50%)",
              width: `${textWidth}px`,
              height: "1px",
              backgroundColor: "var(--gray-600)",
            }}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      {isDraggable ? (
        <DraggableWrapper
          id={appointment.id}
          data={{ appointment, originalData }}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          showOverlay={true}
          dragOverlay={defaultCardContent}
          className={`absolute ${positionClass} z-30 ${className}`}
          style={style}
        >
          {defaultCardContent}
        </DraggableWrapper>
      ) : (
        <div
          className={`absolute ${positionClass} z-30 ${className}`}
          style={style}
        >
          {defaultCardContent}
        </div>
      )}

      {popupsElement}
    </>
  );
};
