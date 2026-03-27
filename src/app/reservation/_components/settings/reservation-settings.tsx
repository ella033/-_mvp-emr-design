import React, { useState } from "react";
import { useHospitalStore } from "@/store/hospital-store";
import { useUsersStore } from "@/store/users-store";
import { useAppointmentRoomsStore } from "@/store/appointment-rooms-store";
import { useToastHelpers } from "@/components/ui/toast";
import { HospitalsService } from "@/services/hospitals-service";
import { AppointmentRoomsService } from "@/services/appointment-rooms-service";
import { AppointmentTypesService } from "@/services/appointment-types-service";
import { RoomSettings } from "./room-settings";
import { ViewSettings } from "./view-settings";
import { IntegrationSettings } from "./integration-settings";
import MyPopup, { MyPopupYesNo } from "@/components/yjg/my-pop-up";

// 메뉴 타입
type MenuType = "room" | "view" | "integration";

// 메인 모달 컴포넌트
export const ReservationSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: () => void;
}> = ({ isOpen, onClose, onSettingsSaved }) => {
  // 모든 훅을 최상단에서 호출
  const { getUsersByHospital } = useUsersStore();
  const { hospital, setHospital } = useHospitalStore();
  const { appointmentRooms, setAppointmentRooms } = useAppointmentRoomsStore();
  const toastHelpers = useToastHelpers();

  const [selectedMenu, setSelectedMenu] = useState<MenuType>("room");
  const [hasChanges, setHasChanges] = useState(false);
  const [showMenuChangeConfirm, setShowMenuChangeConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [pendingMenu, setPendingMenu] = useState<MenuType | null>(null);

  // 공통 데이터 조회 함수들
  const fetchHospitalData = async () => {
    if (hospital?.id) {
      try {
        const updatedHospital = await HospitalsService.getHospital(hospital.id);
        setHospital(updatedHospital);
      } catch (error) {
        console.error("Failed to fetch hospital data:", error);
      }
    }
  };

  const fetchAppointmentRooms = async () => {
    if (!hospital?.id) return;
    try {
      const roomsData = await AppointmentRoomsService.getAppointmentRooms();
      setAppointmentRooms(roomsData);
    } catch (error) {
      console.error("Error fetching reservation rooms:", error);
    }
  };

  const fetchAppointmentTypes = async () => {
    try {
      const typesData = await AppointmentTypesService.getAppointmentTypes();
      return typesData;
    } catch (error) {
      console.error("Error fetching appointment types:", error);
      return [];
    }
  };

  // 저장 버튼 핸들러
  const handleSave = async () => {
    // 변경사항이 없으면 토스트 메시지 표시 후 리턴
    if (!hasChanges) {
      toastHelpers.info("변경내역이 없습니다.");
      return;
    }

    try {
      // 각 메뉴별 저장 로직은 해당 컴포넌트에서 처리
      await fetchHospitalData();
      setHasChanges(false);

      // 설정 저장 후 콜백 실행
      if (onSettingsSaved) {
        onSettingsSaved();
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toastHelpers.error("설정 저장에 실패했습니다.");
    }
  };

  // 취소 버튼 핸들러
  const handleCancel = async () => {
    try {
      await fetchHospitalData();
      setHasChanges(false);
      console.log("설정이 초기화되었습니다.");
    } catch (error) {
      console.error("설정 초기화 중 오류 발생:", error);
    }
  };

  // 메뉴 변경 핸들러
  const handleMenuChange = (newMenu: MenuType) => {
    if (hasChanges) {
      setPendingMenu(newMenu);
      setShowMenuChangeConfirm(true);
    } else {
      setSelectedMenu(newMenu);
    }
  };

  // 메뉴 변경 확인 핸들러
  const handleMenuChangeConfirm = () => {
    if (pendingMenu) {
      setHasChanges(false);
      setSelectedMenu(pendingMenu);
      setPendingMenu(null);
    }
    setShowMenuChangeConfirm(false);
  };

  // 메뉴 변경 취소 핸들러
  const handleMenuChangeCancel = () => {
    setPendingMenu(null);
    setShowMenuChangeConfirm(false);
  };

  // 팝업 닫기 핸들러 (설정 저장 후 페이지 새로고침)
  const handleClose = () => {
    if (hasChanges) {
      setShowCloseConfirm(true);
    } else {
      // 설정이 닫힐 때 이벤트 발생
      window.dispatchEvent(new CustomEvent("reservationSettingsClosed"));
      onClose();
    }
  };

  // 팝업 닫기 확인 핸들러
  const handleCloseConfirm = () => {
    setHasChanges(false);
    setShowCloseConfirm(false);
    // 설정이 닫힐 때 이벤트 발생
    window.dispatchEvent(new CustomEvent("reservationSettingsClosed"));
    onClose();
  };

  // 팝업 닫기 취소 핸들러
  const handleCloseCancel = () => {
    setShowCloseConfirm(false);
  };

  // 모달이 열려있지 않으면 렌더링하지 않음
  if (!isOpen) return null;

  // 공통 props
  const commonProps = {
    hospital,
    setHospital,
    users: hospital?.id ? getUsersByHospital(hospital.id.toString()) : [],
    appointmentRooms,
    setAppointmentRooms,
    hasChanges,
    setHasChanges,
    toastHelpers,
    onSave: handleSave,
    onCancel: handleCancel,
    fetchHospitalData,
    fetchAppointmentRooms,
    fetchAppointmentTypes,
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case "room":
        return <RoomSettings {...commonProps} />;
      case "view":
        return <ViewSettings {...commonProps} />;
      case "integration":
        return <IntegrationSettings {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <>
      <MyPopup
        isOpen={isOpen}
        onCloseAction={handleClose}
        title="예약설정"
        width="950px"
        height="800px"
        minWidth="150px"
        closeOnOutsideClick={false}
        localStorageKey="reservation-settings-popup"
      >
        <div className="flex h-full w-full">
          {/* 좌측 메뉴 */}
          <div className="w-36 border-r border-gray-200">
            <nav className="p-2">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleMenuChange(item.key as MenuType)}
                  className={`w-full text-left p-3 rounded text-sm mb-1 flex items-center space-x-2 ${selectedMenu === item.key
                    ? "bg-[var(--violet-1)] text-[var(--gray-300)] font-bold"
                    : "text-gray-600 hover:bg-gray-100 font-medium"
                    }`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* 우측 콘텐츠 */}
          <div className="flex-1 p-4 overflow-auto">{renderContent()}</div>
        </div>
      </MyPopup>

      {/* 메뉴 변경 확인 팝업 */}
      <MyPopupYesNo
        isOpen={showMenuChangeConfirm}
        onCloseAction={handleMenuChangeCancel}
        onConfirmAction={handleMenuChangeConfirm}
        title="메뉴 변경 확인"
        message={`${getMenuLabel(selectedMenu)}에 저장되지 않은 변경사항이 있습니다.\n저장하지 않고 ${pendingMenu ? getMenuLabel(pendingMenu) : ""}(으)로 이동하시겠습니까?`}
        confirmText="이동"
        cancelText="취소"
      />

      {/* 팝업 닫기 확인 팝업 */}
      <MyPopupYesNo
        isOpen={showCloseConfirm}
        onCloseAction={handleCloseCancel}
        onConfirmAction={handleCloseConfirm}
        title="설정 닫기 확인"
        message={`${getMenuLabel(selectedMenu)}에 저장되지 않은 변경사항이 있습니다.\n저장하지 않고 닫으시겠습니까?`}
        confirmText="닫기"
        cancelText="취소"
      />
    </>
  );
};

// 메뉴 항목
const menuItems = [
  { key: "room", label: "예약실 설정" },
  { key: "view", label: "보기 설정" },
  { key: "integration", label: "연동 설정" },
];

// 메뉴 라벨명칭 매핑 함수
const getMenuLabel = (menuKey: string) => {
  switch (menuKey) {
    case "room":
      return "예약실 설정";
    case "view":
      return "보기 설정";
    case "integration":
      return "연동 설정";
    default:
      return "";
  }
};
