import { AppointmentRoomsService } from "@/services/appointment-rooms-service";
import { HospitalsService } from "@/services/hospitals-service";
import {
  createQueryHook,
  createDetailQueryHook,
  createCrudMutationHooks,
  createMutationHook,
} from "@/hooks/common/use-query-factory";
import { useQuery } from "@tanstack/react-query";

// 기본 쿼리 훅들
export const useAppointmentRooms = createQueryHook(["appointment-rooms"], () =>
  AppointmentRoomsService.getAppointmentRooms()
);

export const useAppointmentRoomDetail = createDetailQueryHook(
  ["appointment-rooms"],
  (id: number) => AppointmentRoomsService.getAppointmentRoom(id)
);

// CRUD 뮤테이션 훅들
const crudHooks = createCrudMutationHooks(["appointment-rooms"], {
  create: AppointmentRoomsService.createAppointmentRoom,
  update: AppointmentRoomsService.updateAppointmentRoom,
  delete: AppointmentRoomsService.deleteAppointmentRoom,
});

export const useCreateAppointmentRoom = crudHooks.create;
export const useUpdateAppointmentRoom = crudHooks.update;
export const useDeleteAppointmentRoom = crudHooks.delete;

// 특별한 뮤테이션 훅들
export const useSyncOperatingHours = createMutationHook(
  async ({ id, data }: { id: number; data: any }) => {
    return await HospitalsService.syncOperatingHours(id, data);
  },
  {
    invalidateQueries: [["appointment-rooms"], ["appointment-rooms", "detail"]],
  }
);

// 휴무일 관련 뮤테이션 훅들
export const useCreateHoliday = createMutationHook(
  async ({ id, data }: { id: number; data: any }) => {
    return await AppointmentRoomsService.createHoliday(id, data);
  },
  {
    invalidateQueries: [["appointment-rooms"], ["appointment-rooms", "detail"]],
  }
);

export const useUpdateHoliday = createMutationHook(
  async ({ id, holidayId, data }: { id: number; holidayId: number; data: any }) => {
    return await AppointmentRoomsService.updateHoliday(id, holidayId, data);
  },
  {
    invalidateQueries: [["appointment-rooms"], ["appointment-rooms", "detail"]],
  }
);

export const useDeleteHoliday = createMutationHook(
  async ({ id, holidayId }: { id: number; holidayId: number }) => {
    return await AppointmentRoomsService.deleteHoliday(id, holidayId);
  },
  {
    invalidateQueries: [["appointment-rooms"], ["appointment-rooms", "detail"]],
  }
);

export const useSyncOpertingHoursMultiple = createMutationHook(
  async (data: any) => {
    return await AppointmentRoomsService.syncOpertingHoursMultiple(data);
  },
  {
    invalidateQueries: [["appointment-rooms"], ["appointment-rooms", "detail"]],
  }
);

// 예약 가능 시간 조회 (복잡한 파라미터가 필요하므로 별도 구현)
export function useAvailableSlots(
  id: number | undefined,
  date: string | undefined,
  doctorId?: number
) {
  return useQuery({
    queryKey: ["appointment-room", "available-slots", id, date, doctorId],
    queryFn: async () => {
      if (!id || !date) throw new Error("Appointment Room ID and date are required");
      return await AppointmentRoomsService.findAvailableSlots(id, date, doctorId);
    },
    enabled: !!id && !!date && typeof id === "number" && id > 0,
  });
}
