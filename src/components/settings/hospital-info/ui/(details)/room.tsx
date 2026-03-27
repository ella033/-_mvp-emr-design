"use client";

import React, { useEffect, useState } from "react";
import { useFacilityStore } from "@/store/facility-store";
import { useUpdateFacility } from "@/hooks/facility/use-update-facility";
import { useDeleteFacility } from "@/hooks/facility/use-delete-facility";
import { useCreateFacility } from "@/hooks/facility/use-create-facility";
import { FacilityService } from "@/services/facility-service";
import { 공간코드, 공간코드라벨 } from "@/constants/common/common-enum";
import type { Facility } from "@/types/facility-types";

interface RoomProps {
  hospitalId: string;
}

export default function Room({ hospitalId }: RoomProps) {
  // Room 타입 정의
  interface RoomData {
    id: number;
    facilityId?: number;
    facilityName?: string;
    facilityCode?: number; // 공간코드 enum 값
    bgColor?: string;
    isNew?: boolean; // 새로 추가된 room인지 구분
  }

  // 편집 상태 관리
  const [editingFacility, setEditingFacility] = useState<number | null>(null);
  const [editingFacilityName, setEditingFacilityName] = useState<number | null>(
    null
  );
  const [editMode, setEditMode] = useState<{ [key: number]: boolean }>({});

  // Room 데이터 관리
  const [roomList, setRoomList] = useState<RoomData[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<{
    [key: number]: any;
  }>({});
  const [roomNames, setRoomNames] = useState<{ [key: number]: string }>({});

  // Store 사용
  const {
    facilities,
    setFacilities,
    addFacility,
    updateFacility: updateFacilityInStore,
    removeFacility,
  } = useFacilityStore();

  // const { data: facilities } = useFacilities(
  //   `hospitalId=${hospitalId}`,
  //   !!hospitalId
  // );
  const createFacilityMutation = useCreateFacility();
  const updateFacilityMutation = useUpdateFacility();
  const deleteFacilityMutation = useDeleteFacility();

  // 서버 데이터를 store에 저장
  const fetchIntegratedData = async () => {
    try {
      const integratedData = await FacilityService.getFacilities(
        `hospitalId=${hospitalId}`
      );

      // hospitalId로 필터링 (필요한 경우)
      const filteredData = integratedData.filter(
        (facility) =>
          facility.hospitalId === Number(hospitalId) || !facility.hospitalId
      );

      setFacilities(filteredData);
    } catch (error: any) {
      console.error("Failed to fetch integrated data:", error);
      console.error("Error details:", {
        message: error?.message,
        status: error?.status,
        hospitalId: hospitalId,
      });
    }
  };

  useEffect(() => {
    if (hospitalId) {
      fetchIntegratedData();
    }
  }, [hospitalId, setFacilities]);

  // facility 정보를 기반으로 room 생성
  useEffect(() => {
    const facilitiesData = facilities || [];
    if (facilitiesData.length > 0) {
      const roomsFromFacilities: RoomData[] = [];
      let roomId = 1;

      facilitiesData.forEach((facility) => {
        const newRoom = {
          id: roomId++,
          facilityId: facility.id,
          facilityName: facility.name,
          facilityCode: facility.facilityCode,
          isNew: false,
          bgColor: `var(--setting-facility-${facility.facilityCode})`,
        };
        roomsFromFacilities.push(newRoom);

        // 기존 room의 정보를 state에 설정
        const roomType = {
          id: facility.facilityCode,
          name: 공간코드라벨[facility.facilityCode as 공간코드] || "기타",
          code: facility.facilityCode,
          bgColor: `var(--setting-facility-${facility.facilityCode})`,
        };

        setSelectedRoomTypes((prev) => ({
          ...prev,
          [newRoom.id]: roomType,
        }));

        setRoomNames((prev) => ({
          ...prev,
          [newRoom.id]: facility.name,
        }));
      });
      setRoomList(roomsFromFacilities);
    }
  }, [facilities, hospitalId]);

  const handleAddRoom = () => {
    const newRoomId = Date.now();
    const newRoom: RoomData = {
      id: newRoomId,
      isNew: true,
    };
    setRoomList([...roomList, newRoom]);
    setEditingFacility(newRoomId);

    // roomTypes가 없으면 가져오기
    if (!roomTypes.length) {
      fetchRoomTypes();
    }
  };

  // 공간 유형 가져오기 (공간코드 enum 기반)
  const fetchRoomTypes = async () => {
    try {
      const roomTypes = Object.values(공간코드)
        .filter((value) => typeof value === "number")
        .map((code) => {
          const bgColor = `var(--setting-facility-${code})`;
          return {
            id: code,
            name: 공간코드라벨[code as 공간코드],
            code: code,
            bgColor: bgColor,
          };
        });
      setRoomTypes(roomTypes);
    } catch (error) {
      console.error("공간 유형 조회 실패:", error);
    }
  };

  // 공간 유형 편집 시작
  const handleStartEditFacility = (roomId: number) => {
    const room = roomList.find((r) => r.id === roomId);
    const selectedRoomType = selectedRoomTypes[roomId];
    const roomName = roomNames[roomId];
    const hasCompleteInfo =
      selectedRoomType && (roomName || room?.facilityName);

    // 완료되지 않았거나 수정 모드일 때만 편집 가능
    if (!hasCompleteInfo || editMode[roomId]) {
      setEditingFacility(roomId);
      if (!roomTypes.length) {
        fetchRoomTypes();
      }
    }
  };

  // 공간 유형 선택 완료
  const handleFacilityComplete = (roomId: number, facilityCode: string) => {
    const selectedType = roomTypes.find(
      (type) => type.id === parseInt(facilityCode)
    );
    if (selectedType) {
      setSelectedRoomTypes((prev) => ({
        ...prev,
        [roomId]: selectedType,
      }));
    }
    setEditingFacility(null);
  };

  // 공간 유형 편집 취소
  const handleFacilityCancel = () => {
    setEditingFacility(null);
  };

  // 공간명 편집 시작
  const handleStartEditFacilityName = (roomId: number) => {
    const room = roomList.find((r) => r.id === roomId);
    const selectedRoomType = selectedRoomTypes[roomId];
    const roomName = roomNames[roomId];
    const hasCompleteInfo =
      selectedRoomType && (roomName || room?.facilityName);

    // 공간 유형이 있고, 완료되지 않았거나 수정 모드일 때만 편집 가능
    if (selectedRoomType && (!hasCompleteInfo || editMode[roomId])) {
      setEditingFacilityName(roomId);
    }
  };

  // 공간명 입력 완료 (facility 생성/수정)
  const handleFacilityNameComplete = async (roomId: number, name: string) => {
    const room = roomList.find((r) => r.id === roomId);
    const selectedFacility = selectedRoomTypes[roomId];

    if (!selectedFacility) return;

    try {
      if (room && room.facilityId) {
        // 기존 facility 수정
        const response = await updateFacilityMutation.mutateAsync({
          id: room.facilityId,
          facility: {
            name: name,
            facilityCode: selectedFacility.code,
            hospitalId: parseInt(hospitalId),
          },
        });

        // store에서 facility 업데이트
        updateFacilityInStore(room.facilityId, response);
      } else {
        // 새로운 facility 생성
        const facility = {
          hospitalId: parseInt(hospitalId),
          name: name,
          facilityCode: selectedFacility.code,
        };

        const newFacility = await createFacilityMutation.mutateAsync(facility);

        // store에 새 facility 추가
        const completeFacility: Facility = {
          id: newFacility.id,
          hospitalId: facility.hospitalId,
          name: facility.name,
          facilityCode: facility.facilityCode,
        };
        addFacility(completeFacility);

        // room 정보 업데이트
        setRoomList((prev) =>
          prev.map((r) =>
            r.id === roomId
              ? {
                ...r,
                facilityId: newFacility.id,
                facilityName: name,
                facilityCode: selectedFacility.code,
                isNew: false,
              }
              : r
          )
        );
      }

      setRoomNames((prev) => ({
        ...prev,
        [roomId]: name,
      }));
      setEditingFacilityName(null);
    } catch (error) {
      console.error("Facility 생성/수정 실패:", error);
    }
  };

  // 공간명 입력 취소
  const handleFacilityNameCancel = () => {
    setEditingFacilityName(null);
  };

  // 공간 수정 모드 토글
  const handleEditRoom = (roomId: number) => {
    setEditMode((prev) => ({
      ...prev,
      [roomId]: !prev[roomId],
    }));
  };

  // facility 삭제
  const handleDeleteRoom = async (roomId: number) => {
    const room = roomList.find((r) => r.id === roomId);

    if (room?.facilityId) {
      try {
        await deleteFacilityMutation.mutateAsync({ id: room.facilityId });

        removeFacility(room.facilityId);
        setRoomList((prev) => prev.filter((r) => r.id !== roomId));

        // 편집 모드 정리
        setEditMode((prev) => {
          const newEditMode = { ...prev };
          delete newEditMode[roomId];
          return newEditMode;
        });
      } catch (error) {
        console.error("Facility 삭제 실패:", error);
      }
    }
  };

  // 새로운 공간 추가
  const newRoomCard = () => {
    return (
      <div
        className={`border-2 border-gray-200 rounded-md p-4 h-25 flex items-center justify-center cursor-pointer hover: bg-[var(--setting-background)]`}
        onClick={handleAddRoom}
      >
        <div className={`flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <img
              src="/settings/add_icon.svg"
              alt="addRoom"
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-[var(--setting-text-color)]">
              새 공간을 추가하세요
            </span>
          </div>
        </div>
      </div>
    );
  };

  // 공간 설정 영역
  const settingRoomCard = (roomId: number) => {
    const room = roomList.find((r) => r.id === roomId);
    const selectedRoomType = selectedRoomTypes[roomId];
    const roomName = roomNames[roomId];
    const isEditingFacility = editingFacility === roomId;
    const isEditingFacilityName = editingFacilityName === roomId;
    const isEditMode = editMode[roomId];

    // 기존 room인지 새 room인지 구분
    const isExistingRoom = room && !room.isNew;
    const hasCompleteInfo =
      selectedRoomType && (roomName || room?.facilityName);

    return (
      <div className="border-2 border-gray-200 rounded-md p-3 h-25 flex items-center justify-center relative group">
        {/* 수정/삭제 아이콘 - 완전한 정보가 있을 때만 표시, 수정 모드일 때는 상시 표시 */}
        {hasCompleteInfo && (
          <div
            className={`border-2 border-gray-200 rounded-md absolute top-2 right-2 flex ${isEditMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              } transition-opacity duration-200`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditRoom(roomId);
              }}
              className={`p-1 rounded-l ${isEditMode ? "bg-neutral-100" : "hover:bg-gray-100"
                }`}
              title="수정"
            >
              <img src="/settings/edit.svg" alt="Edit" className="w-5 h-3" />
            </button>
            <div className="w-px bg-gray-200"></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteRoom(roomId);
              }}
              className="p-1 hover:bg-gray-100 rounded-r"
              title="삭제"
            >
              <img
                src="/settings/delete.svg"
                alt="Delete"
                className="w-5 h-5"
              />
            </button>
          </div>
        )}

        <div className="flex flex-col items-start gap-2 w-full h-full">
          {/* Facility 선택 */}
          <div className="flex items-center gap-1 w-full h-1/2">
            <img
              src="/settings/dehaze.svg"
              alt="Facility"
              className="w-5 h-5"
            />
            {isEditingFacility ? (
              // 편집 모드: facility 선택 dropdown
              <select
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-600"
                value={selectedRoomType ? selectedRoomType.id : ""}
                onChange={(e) => {
                  handleFacilityComplete(roomId, e.target.value);
                }}
                onBlur={() => {
                  if (selectedRoomType) {
                    handleFacilityComplete(
                      roomId,
                      selectedRoomType.id.toString()
                    );
                  } else {
                    handleFacilityCancel();
                  }
                }}
                autoFocus
              >
                <option value="">공간 유형을 선택하세요</option>
                {roomTypes.map((roomType) => (
                  <option key={roomType.id} value={roomType.id}>
                    {roomType.name}
                  </option>
                ))}
              </select>
            ) : (
              // 일반 모드: 저장된 공간 보여줌
              <div
                className={`flex-1 px-2 py-1 rounded-sm ${!hasCompleteInfo && isEditMode
                    ? "cursor-pointer hover:bg-[var(--setting-hover-background)]"
                    : ""
                  } ${isEditMode && hasCompleteInfo ? "cursor-not-allowed" : ""
                  }`}
                onClick={() => {
                  // 수정 모드이고 완성된 정보가 있으면 facility 수정 불가
                  if (isEditMode && hasCompleteInfo) {
                    return;
                  }
                  // 그 외의 경우는 편집 가능
                  if (isEditMode || !hasCompleteInfo) {
                    handleStartEditFacility(roomId);
                  }
                }}
              >
                {selectedRoomType ? (
                  <span
                    className={`px-2 py-1 text-sm font-medium text-neutral-800 border border-gray-300 rounded-md`}
                    style={{ backgroundColor: selectedRoomType.bgColor }}
                  >
                    {selectedRoomType.name}
                  </span>
                ) : isExistingRoom && room?.facilityName ? (
                  <span
                    className={`px-2 py-1 text-sm font-medium text-neutral-800 border border-gray-300 rounded-md`}
                    style={{ backgroundColor: room.bgColor }}
                  >
                    {공간코드라벨[room.facilityCode as 공간코드] || "기타"}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-neutral-400">
                    공간 유형을 선택하세요
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Facility Name 입력 */}
          <div className="flex items-center gap-1 w-full h-1/2">
            <img
              src="/settings/door-back.svg"
              alt="FacilityName"
              className="w-5 h-5"
            />

            {isEditingFacilityName ? (
              // 편집 모드: input 표시
              <input
                type="text"
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring2 focus:text-[var(--setting-text-color)]"
                placeholder="공간명을 작성하세요"
                defaultValue={roomName || room?.facilityName || ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleFacilityNameComplete(roomId, e.currentTarget.value);
                  } else if (e.key === "Escape") {
                    handleFacilityNameCancel();
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    handleFacilityNameComplete(roomId, e.target.value);
                  } else {
                    handleFacilityNameCancel();
                  }
                }}
                autoFocus
              />
            ) : (
              // 일반 모드: 입력된 이름 또는 클릭 가능한 텍스트 표시
              <div
                className={`flex-1 px-2 py-1 rounded-sm ${!selectedRoomType || isEditMode
                    ? "cursor-pointer hover:bg-[var(--setting-hover-background)]"
                    : ""
                  } ${!selectedRoomType ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() =>
                  selectedRoomType &&
                  (isEditMode || !hasCompleteInfo) &&
                  handleStartEditFacilityName(roomId)
                }
              >
                {roomName ? (
                  <span className="text-sm font-medium text-[var(--setting-text-color)]">
                    {roomName}
                  </span>
                ) : isExistingRoom && room?.facilityName ? (
                  <span className="text-sm font-medium text-[var(--setting-text-color)]">
                    {room.facilityName}
                  </span>
                ) : (
                  <span
                    className={`text-sm font-medium ${!selectedRoomType ? "text-neutral-300" : "text-neutral-400"
                      }`}
                  >
                    {!selectedRoomType
                      ? "공간 유형을 먼저 선택하세요"
                      : "공간명을 작성하세요"}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h3 className="text-lg mb-2 font-semibold">구성 정보</h3>
        <p className="text-neutral-400 mb-6">
          병원 내 각 공간을 등록하세요. 예약 및 진료 시 해당 정보가 사용됩니다.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 기존 공간들 */}
        {roomList.map((room) => (
          <div key={room.id}>{settingRoomCard(room.id)}</div>
        ))}
        {/* 새 공간 추가 버튼 - 맨 마지막에 위치 */}
        <div>{newRoomCard()}</div>
      </div>
    </div>
  );
}

