import { AppointmentTypesService } from "@/services/appointment-types-service";
import {
  createQueryHook,
  createDetailQueryHook,
  createCrudMutationHooks,
} from "@/hooks/common/use-query-factory";

// 기본 쿼리 훅들
export const useAppointmentTypes = createQueryHook(["appointment-types"], () =>
  AppointmentTypesService.getAppointmentTypes()
);

export const useAppointmentTypeDetail = createDetailQueryHook(
  ["appointment-types"],
  (id: number) => AppointmentTypesService.getAppointmentType(id)
);

// CRUD 뮤테이션 훅들
const crudHooks = createCrudMutationHooks(["appointment-types"], {
  create: AppointmentTypesService.createAppointmentType,
  update: AppointmentTypesService.updateAppointmentType,
  delete: AppointmentTypesService.deleteAppointmentType,
});

export const useCreateAppointmentType = crudHooks.create;
export const useUpdateAppointmentType = crudHooks.update;
export const useDeleteAppointmentType = crudHooks.delete;
