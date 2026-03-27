import { useQueryClient } from "@tanstack/react-query";

// 쿼리 키 상수
export const QUERY_KEYS = {
  APPOINTMENTS: ["appointments"],
  HOSPITALS: ["hospitals"],
  PATIENTS: ["patients"],
  SETTINGS: ["settings"],
  APPOINTMENT_ROOMS: ["appointment-rooms"],
  APPOINTMENT_TYPES: ["appointment-types"],
  HOLIDAY_MASTERS: ["holiday-masters"],
  SLOT_CLOSURES: ["slot-closures"],
  DISEASE_LIBRARIES: ["disease-libraries"],
} as const;

// 쿼리 무효화 헬퍼
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAppointments: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS }),
    invalidateHospitals: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HOSPITALS }),
    invalidatePatients: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PATIENTS }),
    invalidateSettings: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SETTINGS }),
    invalidateAppointmentRooms: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENT_ROOMS }),
    invalidateAppointmentTypes: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENT_TYPES }),
    invalidateHolidayMasters: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HOLIDAY_MASTERS }),
    invalidateSlotClosures: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SLOT_CLOSURES }),
    invalidateDiseaseLibraries: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DISEASE_LIBRARIES }),
  };
}

// 에러 처리 헬퍼
export function createErrorHandler(operation: string) {
  return (error: any) => {
    console.error(`${operation} failed:`, error);
    throw new Error(`${operation} 실패`, { cause: error });
  };
}

// 로딩 상태 헬퍼
export function useLoadingStates() {
  return {
    isLoading: false,
    isError: false,
    isSuccess: false,
  };
}
