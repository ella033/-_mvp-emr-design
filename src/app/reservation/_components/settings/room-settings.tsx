import React, { useState, useEffect } from "react";
import { useUsersStore } from "@/store/users-store";
import { useHospitalStore } from "@/store/hospital-store";
import { useAppointmentRoomsStore } from "@/store/appointment-rooms-store";
import { AppointmentRoomsService } from "@/services/appointment-rooms-service";
import { AppointmentTypesService } from "@/services/appointment-types-service";
import { AddReservationRooms } from "./popup/add-reservation-rooms";
import { AddReservationType } from "./popup/add-reservation-type";
import { MyPopupYesNo, MyPopupMsg } from "@/components/yjg/my-pop-up";
import MyPopup from "@/components/yjg/my-pop-up";
import type { AppointmentTypes } from "@/types/appointments/appointment-types";
import type { AppointmentRoomOperatingHours } from "@/types/appointments/appointment-room-operating-hours";
import { DayOfWeek } from "@/constants/common/common-enum";
import { DAY_OF_WEEK_MAP } from "@/constants/constants";

void DayOfWeek;

// 요일 배열을 텍스트로 변환하는 유틸리티 함수
const convertDayOfWeekToText = (
  operatingHours: AppointmentRoomOperatingHours[] | undefined
): string => {
  if (!operatingHours || !Array.isArray(operatingHours)) {
    return "";
  }

  const dayOfWeeks = [...new Set(operatingHours.map((oh) => oh.dayOfWeek))];
  return dayOfWeeks.map((day) => DAY_OF_WEEK_MAP[day as DayOfWeek]).join(",");
};

// 예약실 표시 함수
const getAppointmentRoomsText = (
  appointmentRooms: any[] | undefined
): string => {
  if (!appointmentRooms || appointmentRooms.length === 0) {
    return "지정된 예약실 없음";
  }

  console.log('[room-settings.tsx] appointmentRooms', appointmentRooms);
  if (appointmentRooms.length === 1) {
    return appointmentRooms[0]?.appointmentRoom?.displayName || "예약실";
  }

  return `${appointmentRooms[0]?.appointmentRoom?.displayName || "예약실"} 외 ${appointmentRooms.length - 1}`;
};

// Context Menu 컴포넌트
const ContextMenu: React.FC<{
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ isOpen, position, onClose, onEdit, onDelete }) => {
  useEffect(() => {
    const handleClickOutside = () => {
      onClose();
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[60px]"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full text-[color:var(--main-color)] px-4 py-2 text-left text-sm hover:bg-[var(--bg-1)] transition-colors"
        onClick={onEdit}
      >
        수정
      </button>
      <button
        className="w-full text-[color:var(--main-color)] px-4 py-2 text-left text-sm hover:bg-[var(--bg-1)] transition-colors"
        onClick={onDelete}
      >
        삭제
      </button>
    </div>
  );
};

// 예약 유형 카드 컴포넌트 (그리드 셀 min 230px, name 80px 고정+truncate, appointmentRoomsText 나머지+truncate)
const AppointmentTypeCard: React.FC<{
  type: any;
  onClick: (typeId: string) => void;
  onDelete: (typeId: string, typeName: string) => void;
}> = ({ type, onClick, onDelete }) => {
  return (
    <div className="bg-[var(--bg-main)] border border-[var(--border-1)] rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between w-full min-w-0">
      <div
        className="flex items-center gap-3 flex-1 min-w-0"
        onClick={() => onClick(type.id)}
      >
        <div
          className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
          style={{ backgroundColor: type.colorCode }}
          title={type.colorCode}
        ></div>
        <span
          className="font-medium truncate w-[80px] flex-shrink-0"
          title={type.name}
        >
          {type.name}
        </span>
        <span
          className="text-sm text-gray-500 truncate min-w-0 flex-1"
          title={getAppointmentRoomsText(type.appointmentTypeRooms)}
        >
          {getAppointmentRoomsText(type.appointmentTypeRooms)}
        </span>
      </div>
      <button
        className="text-gray-400 hover:text-red-500 transition-colors ml-1 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(type.id, type.name || type.displayName || "예약유형");
        }}
      >
        <img src="/icon/ic_line_close.svg" alt="삭제" className="w-5 h-5" />
      </button>
    </div>
  );
};

// 예약실 카드 컴포넌트
const AppointmentRoomCard: React.FC<{
  room: any;
  onClick: (roomId: number) => void;
  onEdit: (roomId: number) => void;
  onDelete: (roomId: number, roomName: string) => void;
  isLoading?: boolean;
}> = ({ room, onClick, onEdit, onDelete, isLoading = false }) => {
  const { getUsersByHospital } = useUsersStore();
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });

  const users = getUsersByHospital(room.hospitalId?.toString() || "");
  const user = users.find((u: any) => u.id === room.userId);
  const userName = user ? user.name : "담당의 미지정";

  const dayOfWeekText = convertDayOfWeekToText(room.weeklySchedule?.current?.days ?? []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleMoreInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      isOpen: true,
      position: { x: rect.left, y: rect.bottom + 5 },
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  };

  // 더블클릭 핸들러 추가
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(room.id);
  };

  return (
    <div
      className={`bg-[var(--bg-1)] rounded-sm p-3 transition-colors relative ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
        }`}
      onDoubleClick={handleDoubleClick} // 더블클릭 이벤트 추가
    >
      <div className="w-full">
        {/* 메인 카드 헤더 */}
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="font-bold text-[var(--gray-200)]">
            {room.displayName || room.name}
          </h4>
          <button
            onClick={handleMoreInfoClick}
            className="text-[var(--gray-300)] hover:text-[var(--gray-200)] transition-colors p-1 cursor-pointer"
          >
            <img src="/moreInfo.svg" alt="더보기" className="w-3 h-3" />
          </button>
        </div>

        {/* 내부 카드 */}
        <div className="bg-[var(--bg-main)] rounded-sm p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--gray-400)]">{userName}</span>

            <div className="flex items-center space-x-4 text-sm text-[var(--gray-400)]">
              <div className="flex items-center space-x-1">
                <img
                  src="/icon/ic_line_calendar.svg"
                  alt="요일"
                  className="w-3.5 h-3.5"
                />
                <span>{dayOfWeekText}</span>
              </div>

              <div className="flex items-center space-x-1">
                <img
                  src="/icon/ic_line_clock-2.svg"
                  alt="시간"
                  className="w-3.5 h-3.5"
                />
                <span>{room.timeSlotDuration || 15}분</span>
              </div>

              <div className="flex items-center space-x-1">
                <img
                  src="/icon/ic_line_users.svg"
                  alt="정원"
                  className="w-3.5 h-3.5"
                />
                <span>{room.maxAppointmentsPerSlot || 1}명</span>
              </div>

              <div className="flex items-center space-x-1">
                <img
                  src="/icon/ic_line_hourglass.svg"
                  alt="설정"
                  className="w-3.5 h-3.5"
                />
                <span className="text-xs">
                  {room.operationStartDate
                    ? new Date(room.operationStartDate)
                      .toISOString()
                      .split("T")[0]
                    : "2024-01-01"}{" "}
                  ~
                  {room.operationEndDate &&
                    new Date(room.operationEndDate)
                      .toISOString()
                      .split("T")[0] === "9999-12-31"
                    ? " 종료일 없음"
                    : room.operationEndDate
                      ? ` ${new Date(room.operationEndDate).toISOString().split("T")[0]}`
                      : " 9999-12-31"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={handleContextMenuClose}
        onEdit={() => {
          onEdit(room.id);
          handleContextMenuClose();
        }}
        onDelete={() => {
          onDelete(room.id, room.name || room.displayName || "예약실");
          handleContextMenuClose();
        }}
      />
    </div>
  );
};

interface RoomSettingsProps {
  hospital: any;
  setHospital: (hospital: any) => void;
  hasChanges: boolean;
  setHasChanges: (hasChanges: boolean) => void;
  toastHelpers: any;
  onSave: () => void;
  onCancel: () => void;
  fetchHospitalData: () => Promise<void>;
  users: any[];
  appointmentRooms: any[];
  setAppointmentRooms: (rooms: any[]) => void;
  fetchAppointmentRooms: () => Promise<void>;
  fetchAppointmentTypes: () => Promise<any[]>;
}

export const RoomSettings: React.FC<RoomSettingsProps> = ({
  hospital,
  setHospital,
  hasChanges,
  setHasChanges,
  toastHelpers,
  onSave,
  onCancel,
  fetchHospitalData,
  users,
  appointmentRooms,
  setAppointmentRooms,
  fetchAppointmentRooms,
  fetchAppointmentTypes,
}) => {
  const [reservationTypes, setReservationTypes] = useState<AppointmentTypes[]>(
    []
  );
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [isAddRoomModalOpen, setIsAddRoomModalOpen] = useState(false);
  const [isAddTypeModalOpen, setIsAddTypeModalOpen] = useState(false);
  const [addRoomModalType, setAddRoomModalType] = useState<"add" | "edit">(
    "add"
  );
  const [addTypeModalType, setAddTypeModalType] = useState<"add" | "edit">(
    "add"
  );
  const [selectedRoomData, setSelectedRoomData] = useState<any>(null);
  const [selectedTypeData, setSelectedTypeData] = useState<any>(null);
  const [isLoadingRoomDetail, setIsLoadingRoomDetail] = useState(false);
  const [isLoadingTypeDetail, setIsLoadingTypeDetail] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // 삭제 확인 팝업 상태
  const [deleteRoomPopup, setDeleteRoomPopup] = useState<{
    isOpen: boolean;
    roomId: number | null;
    roomName: string;
  }>({ isOpen: false, roomId: null, roomName: "" });

  const [deleteTypePopup, setDeleteTypePopup] = useState<{
    isOpen: boolean;
    typeId: string | null;
    typeName: string;
  }>({ isOpen: false, typeId: null, typeName: "" });

  // 진료시간 미설정 알림 팝업 상태
  const [showOperatingHoursWarning, setShowOperatingHoursWarning] =
    useState(false);

  // 삭제 실패 경고 팝업 상태
  const [deleteWarningPopup, setDeleteWarningPopup] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: "" });

  // 예약실 데이터 가져오기
  const fetchReservationRooms = async () => {
    if (!hospital?.id) return;

    setIsLoadingRooms(true);
    try {
      const roomsData = await AppointmentRoomsService.getAppointmentRooms();
      setAppointmentRooms(roomsData);
    } catch (error) {
      console.error("Error fetching reservation rooms:", error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // 예약유형 데이터 가져오기
  const fetchReservationTypes = async () => {
    setIsLoadingTypes(true);
    try {
      const typesData = await AppointmentTypesService.getAppointmentTypes();
      const processedTypesData = typesData.map((type) => ({
        ...type,
        appointmentRooms: type.appointmentTypeRooms || [],
      }));

      setReservationTypes(processedTypesData);
    } catch (error) {
      console.error("Error fetching appointment types:", error);
    } finally {
      setIsLoadingTypes(false);
    }
  };

  useEffect(() => {
    if (hospital?.id) {
      fetchReservationRooms();
      fetchReservationTypes();
    }
  }, [hospital?.id]);

  const handleAddRoom = () => {
    // operatingHours가 null이면 알림 팝업 표시하고 return
    if (!hospital?.operatingHours || hospital.operatingHours === null || hospital.operatingHours.length === 0) {
      setShowOperatingHoursWarning(true);
      return;
    }

    setAddRoomModalType("add");
    setIsAddRoomModalOpen(true);
  };

  const handleAddReservationType = () => {
    setIsAddTypeModalOpen(true);
  };

  const handleSaveRoom = async (data: any) => {
    try {
      await fetchReservationRooms();
      console.log("예약실 저장 후 목록 갱신 완료");
    } catch (error) {
      console.error("예약실 목록 갱신 실패:", error);
    } finally {
      setIsAddRoomModalOpen(false);
    }
  };

  const handleSaveType = async (data: any) => {
    try {
      await fetchReservationTypes();
      console.log("예약 유형 저장 후 목록 갱신 완료");
    } catch (error) {
      console.error("예약 유형 목록 갱신 실패:", error);
    } finally {
      setIsAddTypeModalOpen(false);
    }
  };

  // 예약 유형 카드 클릭 핸들러
  const handleTypeCardClick = async (typeId: string) => {
    setAddTypeModalType("edit");
    setIsLoadingTypeDetail(true);
    try {
      const typeDetail = await AppointmentTypesService.getAppointmentType(
        parseInt(typeId)
      );
      setSelectedTypeData(typeDetail);
      setIsAddTypeModalOpen(true);
    } catch (error) {
      alert("예약 유형 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingTypeDetail(false);
    }
  };

  // 예약실 카드 클릭 핸들러
  const handleRoomCardClick = async (roomId: number) => {
    setAddRoomModalType("edit");
    setIsLoadingRoomDetail(true);
    try {
      const roomDetail =
        await AppointmentRoomsService.getAppointmentRoom(roomId);

      // operatingHours에서 workingDays와 workingTimes 추출
      const workingDays: number[] = [];
      const workingTimes: {
        [key: number]: { fromTime: string; toTime: string };
      } = {};

      if (
        roomDetail.operatingHours &&
        Array.isArray(roomDetail.operatingHours)
      ) {
        roomDetail.operatingHours.forEach((oh: any) => {
          workingDays.push(oh.dayOfWeek);
          workingTimes[oh.dayOfWeek] = {
            fromTime: oh.startTime,
            toTime: oh.endTime,
          };
        });
      }

      const roomFormData = {
        id: roomDetail.id,
        hospitalId: roomDetail.hospitalId || hospital?.id || 0,
        facilityId: roomDetail.facilityId,
        userId: roomDetail.userId,
        name: roomDetail.name,
        displayName: roomDetail.displayName,
        colorCode: roomDetail.colorCode,
        defaultDurationMinutes: roomDetail.defaultDurationMinutes,
        sortOrder: roomDetail.sortOrder,
        isVirtual: roomDetail.isVirtual,
        isActive: roomDetail.isActive,
        description: roomDetail.description,
        timeSlotDuration: roomDetail.timeSlotDuration,
        maxAppointmentsPerSlot: roomDetail.maxAppointmentsPerSlot,
        bufferTimeMinutes: roomDetail.bufferTimeMinutes,
        allowOverlap: roomDetail.allowOverlap,
        startDate: roomDetail.operationStartDate
          ? typeof roomDetail.operationStartDate === "string"
            ? roomDetail.operationStartDate
            : new Date(roomDetail.operationStartDate)
              .toISOString()
              .split("T")[0]
          : "2024-01-01",
        endDate: roomDetail.operationEndDate
          ? typeof roomDetail.operationEndDate === "string"
            ? roomDetail.operationEndDate
            : new Date(roomDetail.operationEndDate).toISOString().split("T")[0]
          : "9999-12-31",
        workingDays: workingDays,
        workingTimes: workingTimes,
        lunchTimes: {}, // TODO: breakTimes에서 추출
        externalPlatforms: (() => {
          const list = roomDetail.externalPlatforms;
          if (!Array.isArray(list)) return { ddocdoc: false, naver: false };
          const codes = list.map(
            (p: { platformCode?: string }) => p?.platformCode
          ).filter(Boolean);
          return {
            ddocdoc: codes.includes("ddocdoc"),
            naver: codes.includes("naver"),
          };
        })(),
      };
      setSelectedRoomData(roomFormData);
      setIsAddRoomModalOpen(true);
    } catch (error) {
      alert("예약실 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingRoomDetail(false);
    }
  };

  // 예약실 편집 핸들러
  const handleEditRoom = async (roomId: number) => {
    await handleRoomCardClick(roomId);
  };

  // 예약실 삭제 핸들러
  const handleDeleteRoom = (roomId: number, roomName: string) => {
    setDeleteRoomPopup({
      isOpen: true,
      roomId,
      roomName,
    });
  };

  // 예약실 삭제 확인
  const confirmDeleteRoom = async (roomId: number | null) => {
    if (!roomId) return;

    try {
      await AppointmentRoomsService.deleteAppointmentRoom(roomId);
      await fetchReservationRooms();
      toastHelpers.success("예약실이 삭제되었습니다.");
    } catch (error: any) {
      console.error("예약실 삭제 실패:", error);
      if (error?.status === 400 && error?.data?.message) {
        setDeleteWarningPopup({ isOpen: true, message: error.data.message });
      } else {
        setDeleteWarningPopup({ isOpen: true, message: error?.data?.message || "예약실 삭제에 실패했습니다." });
      }
    } finally {
      setDeleteRoomPopup({ isOpen: false, roomId: null, roomName: "" });
    }
  };

  // 예약유형 삭제 핸들러
  const handleDeleteAppointmentType = (typeId: string, typeName: string) => {
    setDeleteTypePopup({
      isOpen: true,
      typeId,
      typeName,
    });
  };

  // 예약유형 삭제 확인
  const confirmDeleteType = async (typeId: string | null) => {
    if (!typeId) return;

    try {
      await AppointmentTypesService.deleteAppointmentType(parseInt(typeId));
      await fetchReservationTypes();
      toastHelpers.success("예약유형이 삭제되었습니다.");
    } catch (error: any) {
      console.error("예약유형 삭제 실패:", error);
      if (error?.status === 400 && error?.data?.message) {
        setDeleteWarningPopup({ isOpen: true, message: error.data.message });
      } else {
        setDeleteWarningPopup({ isOpen: true, message: error?.data?.message || "예약유형 삭제에 실패했습니다." });
      }
    } finally {
      setDeleteTypePopup({ isOpen: false, typeId: null, typeName: "" });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 메뉴 헤더 */}
      <div className="flex justify-between items-center mb-4 pb-2">
        <h2 className="text-lg py-1 font-bold text-[color:var(--main-color)]">
          예약실 설정
        </h2>
      </div>

      {/* 예약실 설정 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-md font-bold text-[color:var(--gray-200)]">예약실</div>
        <button
          onClick={handleAddRoom}
          className="px-4 py-2 bg-[var(--violet-1)] text-sm font-medium text-[color:var(--gray-200)] rounded hover:bg-[var(--violet-1-hover)] transition-colors"
        >
          + 예약실 추가
        </button>
      </div>

      <div className="flex-1 mb-4">
        <div className="space-y-2 overflow-y-auto">
          {isLoadingRooms ? (
            <div className="text-center py-4 text-gray-500">
              예약실 정보를 불러오는 중...
            </div>
          ) : appointmentRooms.length > 0 ? (
            appointmentRooms.map((room) => (
              <AppointmentRoomCard
                key={room.id}
                room={room}
                onClick={handleRoomCardClick}
                onEdit={handleEditRoom}
                onDelete={handleDeleteRoom}
                isLoading={isLoadingRoomDetail}
              />
            ))
          ) : (
            <div className="text-center py-4 text-gray-500">
              등록된 예약실이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 예약유형 설정 */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-[var(--gray-300)]">예약유형</h3>
          <button
            className="text-sm font-medium bg-[var(--violet-1)] text-[color:var(--main-color)] px-3 py-2 rounded hover:bg-[var(--violet-1-hover)]"
            onClick={handleAddReservationType}
          >
            + 예약유형 추가
          </button>
        </div>

        <div className="space-y-2">
          {isLoadingTypes ? (
            <div className="text-center py-4 text-gray-500">
              예약유형 정보를 불러오는 중...
            </div>
          ) : reservationTypes && reservationTypes.length > 0 ? (
            <div className="@container w-full">
              <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(230px,1fr))] @[916px]:[grid-template-columns:repeat(4,minmax(0,1fr))]">
                {reservationTypes.map((type) => (
                  <AppointmentTypeCard
                    key={type.id}
                    type={type}
                    onClick={handleTypeCardClick}
                    onDelete={handleDeleteAppointmentType}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              등록된 예약유형이 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 예약실 추가/수정 모달 */}
      <MyPopup
        isOpen={isAddRoomModalOpen}
        onCloseAction={() => {
          setIsAddRoomModalOpen(false);
          setSelectedRoomData(null);
        }}
        title={addRoomModalType === "edit" ? "예약실 정보" : "예약실 추가"}
        fitContent={true}
        width="700px"
        height="600px"
        alwaysCenter={true}
        closeOnOutsideClick={false}
        localStorageKey="reservation-room-settings-popup"
      >
        <AddReservationRooms
          isOpen={isAddRoomModalOpen}
          onClose={() => {
            setIsAddRoomModalOpen(false);
            setSelectedRoomData(null);
          }}
          isEdit={addRoomModalType === "edit"}
          roomData={selectedRoomData}
          doctors={users}
          operatingHours={hospital?.operatingHours}
          onSave={handleSaveRoom}
        />
      </MyPopup>
      <AddReservationType
        isOpen={isAddTypeModalOpen}
        onClose={() => {
          setIsAddTypeModalOpen(false);
          setSelectedTypeData(null);
          setAddTypeModalType("add");
        }}
        isEdit={addTypeModalType === "edit"}
        typeData={selectedTypeData}
        onSave={handleSaveType}
      />

      {/* 예약실 삭제 확인 팝업 */}
      <MyPopupYesNo
        isOpen={deleteRoomPopup.isOpen}
        onCloseAction={() =>
          setDeleteRoomPopup({ isOpen: false, roomId: null, roomName: "" })
        }
        onConfirmAction={confirmDeleteRoom}
        title="예약실 삭제"
        message={`"${deleteRoomPopup.roomName}" 예약실을 삭제하시겠습니까?\n\n삭제된 예약실은 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        confirmParam={deleteRoomPopup.roomId}
      />

      {/* 예약유형 삭제 확인 팝업 */}
      <MyPopupYesNo
        isOpen={deleteTypePopup.isOpen}
        onCloseAction={() =>
          setDeleteTypePopup({ isOpen: false, typeId: null, typeName: "" })
        }
        onConfirmAction={confirmDeleteType}
        title="예약유형 삭제"
        message={`"${deleteTypePopup.typeName}" 예약유형을 삭제하시겠습니까?\n\n삭제된 예약유형은 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        confirmParam={deleteTypePopup.typeId}
      />

      {/* 진료시간 미설정 알림 팝업 */}
      <MyPopupMsg
        isOpen={showOperatingHoursWarning}
        onCloseAction={() => setShowOperatingHoursWarning(false)}
        title="알림"
        msgType="warning"
        message="진료일 설정 탭의 진료시간부터 설정해주세요."
        confirmText="확인"
        onConfirmAction={() => setShowOperatingHoursWarning(false)}
      />

      {/* 예약실 삭제 실패 경고 팝업 */}
      <MyPopupMsg
        isOpen={deleteWarningPopup.isOpen}
        onCloseAction={() => setDeleteWarningPopup({ isOpen: false, message: "" })}
        title="삭제 불가"
        msgType="warning"
        message={deleteWarningPopup.message}
        confirmText="확인"
        onConfirmAction={() => setDeleteWarningPopup({ isOpen: false, message: "" })}
      />
    </div>
  );
};
