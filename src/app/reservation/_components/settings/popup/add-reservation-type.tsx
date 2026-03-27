import { useState, useEffect } from "react";
import { X } from "lucide-react";
import MultiSelect from "@/components/ui/multi-select";
import { AppointmentTypesService } from "@/services/appointment-types-service";
import { AppointmentRoomsService } from "@/services/appointment-rooms-service";
import type { AppointmentTypes, CreateAppointmentTypeRequest } from "@/types/appointments/appointment-types";
import type { AppointmentRooms } from "@/types/appointments/appointment-rooms";

export const AddReservationType: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  isEdit?: boolean;
  typeData?: AppointmentTypes;
  onSave: (data: AppointmentTypes) => void;
}> = ({ isOpen, onClose, isEdit = false, typeData, onSave }) => {
  const [formData, setFormData] = useState<Partial<AppointmentTypes>>({
    name: '',
    colorCode: '#E22400',
    description: '',
    isActive: true,
    appointmentTypeRooms: []
  });

  const [rooms, setRooms] = useState<AppointmentRooms[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);

  // 예약실 데이터 조회
  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const roomsData = await AppointmentRoomsService.getAppointmentRooms();
      setRooms(roomsData);
    } catch (error) {
      console.error('예약실 조회 실패:', error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  // 색상 옵션 - HEX 값으로 직접 설정
  const colorOptions = [
    // 첫 번째 줄 (Red, Orange, Yellow, Green, DarkGreen, Cyan, Blue, Purple, Magenta, Gray)
    { value: '#E22400', label: 'Red-1', color: '#E22400' },
    { value: '#FF6A00', label: 'Orange-1', color: '#FF6A00' },
    { value: '#F4A130', label: 'Yellow-1', color: '#F4A130' },
    { value: '#669D34', label: 'Green-1', color: '#669D34' },
    { value: '#0B6B50', label: 'DarkGreen-1', color: '#0B6B50' },
    { value: '#008CB4', label: 'Cyan-1', color: '#008CB4' },
    { value: '#0056D6', label: 'Blue-1', color: '#0056D6' },
    { value: '#371A94', label: 'Purple-1', color: '#371A94' },
    { value: '#B11BC2', label: 'Magenta-1', color: '#B11BC2' },
    { value: '#333333', label: 'Gray-1', color: '#333333' },

    // 두 번째 줄 (Red-2, Orange-2, Yellow-2, Green-2, DarkGreen-2, Cyan-2, Blue-2, Purple-2, Magenta-2, Gray-2)
    { value: '#FF8385', label: 'Red-2', color: '#FF8385' },
    { value: '#FEA57D', label: 'Orange-2', color: '#FEA57D' },
    { value: '#FED977', label: 'Yellow-2', color: '#FED977' },
    { value: '#B1DD8B', label: 'Green-2', color: '#B1DD8B' },
    { value: '#00AEA9', label: 'DarkGreen-2', color: '#00AEA9' },
    { value: '#52D6FC', label: 'Cyan-2', color: '#52D6FC' },
    { value: '#74A7FF', label: 'Blue-2', color: '#74A7FF' },
    { value: '#864FFD', label: 'Purple-2', color: '#864FFD' },
    { value: '#D357FE', label: 'Magenta-2', color: '#D357FE' },
    { value: '#858585', label: 'Gray-2', color: '#858585' },

    // 세 번째 줄 (Red-3, Orange-3, Yellow-3, Green-3, DarkGreen-3, Cyan-3, Blue-3, Purple-3, Magenta-3, Gray-3)
    // NEX-3450 [예약] 예약 유형 색상 선택지 수정 - 가시성이 떨어지는 문제로 삭제
    // { value: '#FFB5AF', label: 'Red-3', color: '#FFB5AF' },
    // { value: '#FFC5AB', label: 'Orange-3', color: '#FFC5AB' },
    // { value: '#FDE4A8', label: 'Yellow-3', color: '#FDE4A8' },
    // { value: '#CDE8B5', label: 'Green-3', color: '#CDE8B5' },
    // { value: '#9DE7DA', label: 'DarkGreen-3', color: '#9DE7DA' },
    // { value: '#93E3FC', label: 'Cyan-3', color: '#93E3FC' },
    // { value: '#A7C6FF', label: 'Blue-3', color: '#A7C6FF' },
    // { value: '#B18CFE', label: 'Purple-3', color: '#B18CFE' },
    // { value: '#E292FE', label: 'Magenta-3', color: '#E292FE' },
    // { value: '#C2C2C2', label: 'Gray-3', color: '#C2C2C2' }
  ];

  // colorCode(HEX) → CSS 변수로 변환 (다크모드 지원)
  const getColorPickerVar = (colorCode: string | undefined) => {
    const option = colorOptions.find(o => o.value === colorCode);
    return option ? `var(--color-picker-${option.label})` : colorCode;
  };

  useEffect(() => {
    if (isOpen) {
      // 예약실 데이터 조회
      fetchRooms();

      if (isEdit && typeData) {
        setFormData(typeData);
      } else {
        // 초기화
        setFormData({
          name: '',
          colorCode: '#E22400',
          description: '',
          isActive: true,
          appointmentTypeRooms: []
        });
      }
    } else {
      // 모달이 닫힐 때 isEdit 상태 초기화
      setFormData({
        name: '',
        colorCode: '#E22400',
        description: '',
        isActive: true,
        appointmentTypeRooms: []
      });
    }
  }, [isOpen, isEdit, typeData]);

  // 외부 클릭 시 색상 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isColorDropdownOpen) {
        setIsColorDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isColorDropdownOpen]);

  // formData.colorCode 변화 추적
  useEffect(() => {
  }, [formData.colorCode]);

  if (!isOpen) return null;

  const handleRoomChange = (selectedOptions: any) => {
    const selectedRoomIds = selectedOptions ? selectedOptions.map((option: any) => ({
      appointmentRoomId: parseInt(option.value),
      isActive: true
    })) : [];
    setFormData({
      ...formData,
      appointmentTypeRooms: selectedRoomIds
    });
  };

  // React Select 옵션 형식으로 변환
  const roomOptions = rooms.map(room => ({
    value: room.id.toString(),
    label: room.displayName,
    description: room.description
  }));

  // 선택된 옵션들
  const selectedRoomOptions = roomOptions.filter(option =>
    formData.appointmentTypeRooms?.some(ar => ar.appointmentRoomId.toString() === option.value)
  );

  const handleSave = async () => {
    // 유효성 검사
    if (!formData.name?.trim()) {
      alert('예약 유형명을 입력해주세요.');
      return;
    }

    try {
      if (isEdit && formData.id) {
        // 수정: 예약실 연결/해제만 처리
        const currentRoomIds = formData.appointmentTypeRooms?.map(r => r.appointmentRoomId) || [];
        const originalRoomIds = typeData?.appointmentTypeRooms?.map(r => r.appointmentRoomId) || [];

        // 새로 추가된 예약실 → connect
        const roomsToConnect = currentRoomIds.filter(id => !originalRoomIds.includes(id));
        // 제거된 예약실 → disconnect
        const roomsToDisconnect = originalRoomIds.filter(id => !currentRoomIds.includes(id));

        await Promise.all([
          ...roomsToConnect.map(roomId =>
            AppointmentTypesService.connectAppointmentTypeToRoom(formData.id!, roomId)
          ),
          ...roomsToDisconnect.map(roomId =>
            AppointmentTypesService.disconnectAppointmentTypeFromRoom(formData.id!, roomId)
          )
        ]);

        // 수정 후 전체 데이터를 다시 가져와서 전달
        const updatedType = await AppointmentTypesService.getAppointmentType(formData.id!);
        onSave(updatedType);
      } else {
        // 신규 생성
        const createData: CreateAppointmentTypeRequest = {
          name: formData.name,
          colorCode: formData.colorCode || '#E22400',
          description: formData.description || '',
          isActive: formData.isActive ?? true,
          appointmentRooms: formData.appointmentTypeRooms || []
        };
        const createdType = await AppointmentTypesService.createAppointmentType(createData);
        // 생성 후 전체 데이터를 다시 가져와서 전달
        const newType = await AppointmentTypesService.getAppointmentType(createdType.id);
        onSave(newType);
      }
      onClose();
    } catch (error) {
      console.error('예약 유형 저장 실패:', error);
      alert('예약 유형 저장에 실패했습니다.');
    }
  };



  return (
    <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-main)] rounded-lg shadow-xl w-[450px]">
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b border-[var(--border-1)]">
          <h2 className="text-lg font-semibold text-[var(--gray-200)]">
            {isEdit ? '예약 유형 수정' : '예약 유형 추가'}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--gray-500)] hover:text-[var(--gray-400)]"
          >
            <X size={24} />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 space-y-6">
          {/* 이름과 색상 */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--gray-100)] mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full border border-[var(--border-1)] rounded px-3 py-2 text-sm text-[var(--gray-100)] ${isEdit ? 'bg-[var(--bg-2)] text-[var(--gray-500)] cursor-not-allowed' : ''}`}
                placeholder="예약 유형명을 입력하세요"
                disabled={isEdit}
              />
            </div>
            <div className="w-[80px]">
              <label className="block text-sm font-medium text-[var(--gray-100)] mb-1">색상</label>
              <div className="relative">
                {/* 색상 선택 버튼 - 텍스트 제거하고 색상만 표시 */}
                <button
                  type="button"
                  onClick={() => !isEdit && setIsColorDropdownOpen(!isColorDropdownOpen)}
                  className={`w-full flex items-center justify-between p-1.5 border border-[var(--border-1)] rounded-sm focus:outline-none focus:ring-2 focus:ring-[var(--main-color)] ${isEdit
                    ? 'bg-[var(--bg-2)] cursor-not-allowed'
                    : 'bg-[var(--bg-main)] hover:border-[var(--border-2)]'
                    }`}
                  disabled={isEdit}
                >
                  <div className="flex items-center space-x-3 pl-1">
                    <div
                      className="w-6 h-6 rounded-full border border-[var(--border-1)]"
                      style={{ backgroundColor: getColorPickerVar(formData.colorCode) }}
                    />
                  </div>
                  <svg
                    className={`w-4 h-4 ${isEdit ? 'text-[var(--gray-500)]' : 'text-[var(--gray-300)]'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* 색상 드롭다운 */}
                {isColorDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 bg-[var(--bg-main)] border border-[var(--border-1)] rounded-lg shadow-lg z-50 p-4 min-w-[350px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* 색상 팔레트 - 3줄로 표시 */}
                    <div className="space-y-4">
                      {/* 첫 번째 줄 */}
                      <div className="flex justify-center space-x-3">
                        {colorOptions.slice(0, 10).map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, colorCode: option.value }));
                              setIsColorDropdownOpen(false);
                            }}
                            className={`
                              w-6 h-6 rounded-full transition-all flex-shrink-0
                              ${formData.colorCode === option.value
                                ? 'scale-110 ring-2 ring-[var(--main-color)]/20'
                                : 'hover:scale-105'
                              }
                            `}
                            style={{ backgroundColor: `var(--color-picker-${option.label})` }}
                            title={option.label}
                          />
                        ))}
                      </div>

                      {/* 두 번째 줄 */}
                      <div className="flex justify-center space-x-3">
                        {colorOptions.slice(10, 20).map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, colorCode: option.value }));
                              setIsColorDropdownOpen(false);
                            }}
                            className={`
                              w-6 h-6 rounded-full transition-all flex-shrink-0
                              ${formData.colorCode === option.value
                                ? 'scale-110 ring-2 ring-[var(--main-color)]/20'
                                : 'hover:scale-105'
                              }
                            `}
                            style={{ backgroundColor: `var(--color-picker-${option.label})` }}
                            title={option.label}
                          />
                        ))}
                      </div>

                      {/* 세 번째 줄 */}
                      <div className="flex justify-center space-x-3">
                        {colorOptions.slice(20, 30).map(option => (
                          <button
                            key={option.value}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData(prev => ({ ...prev, colorCode: option.value }));
                              setIsColorDropdownOpen(false);
                            }}
                            className={`
                              w-6 h-6 rounded-full transition-all flex-shrink-0
                              ${formData.colorCode === option.value
                                ? 'scale-110 ring-2 ring-[var(--main-color)]/20'
                                : 'hover:scale-105'
                              }
                            `}
                            style={{ backgroundColor: `var(--color-picker-${option.label})` }}
                            title={option.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 예약실 지정 */}
          <div>
            <label className="block text-sm font-medium text-[var(--gray-100)] mb-2">
              예약실 지정
            </label>
            <MultiSelect
              value={selectedRoomOptions}
              onChange={handleRoomChange}
              options={roomOptions}
              placeholder="예약실을 선택하세요"
              noOptionsMessage={() => "등록된 예약실이 없습니다"}
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              showSelectAll={true}
              selectAllLabel="전체"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-4">
          <button
            onClick={onClose}
            className="px-4 py-1 text-[var(--gray-400)] border border-[var(--border-1)] rounded hover:bg-[var(--bg-1)]"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1 bg-[var(--violet-1)] text-[var(--main-color)] rounded hover:bg-[var(--violet-1-hover)]"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};