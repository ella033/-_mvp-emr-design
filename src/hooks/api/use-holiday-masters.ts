import { HolidayMastersService } from "@/services/holiday-masters-service";
import {
  createQueryHook,
  createDetailQueryHook,
  createCrudMutationHooks,
} from "@/hooks/common/use-query-factory";
import { useQuery } from "@tanstack/react-query";

// 기본 쿼리 훅들
export const useHolidayMasters = createQueryHook(["holiday-masters"], () =>
  HolidayMastersService.getHolidayMasters()
);

export const useHolidayMasterDetail = createDetailQueryHook(
  ["holiday-masters"],
  (id: number) => HolidayMastersService.getHolidayMaster(id)
);

// CRUD 뮤테이션 훅들
const crudHooks = createCrudMutationHooks(["holiday-masters"], {
  create: HolidayMastersService.createHolidayMaster,
  update: HolidayMastersService.updateHolidayMaster,
  delete: HolidayMastersService.deleteHolidayMaster,
});

export const useCreateHolidayMaster = crudHooks.create;
export const useUpdateHolidayMaster = crudHooks.update;
export const useDeleteHolidayMaster = crudHooks.delete;

// 특별한 쿼리 훅
export const useHolidayInstancesByYear = createQueryHook(
  ["holiday-masters", "instances"],
  () => {
    // 이 훅은 year 파라미터가 필요하므로 별도로 구현
    throw new Error("useHolidayInstancesByYear requires year parameter");
  }
);

// year 파라미터가 필요한 훅을 위한 별도 구현
export function useHolidayInstancesByYearWithParam(year: string | undefined) {
  return useQuery({
    queryKey: ["holiday-masters", "instances", year],
    queryFn: async () => {
      if (!year) throw new Error("Year is required");
      return await HolidayMastersService.findInstancesByYear(year);
    },
    enabled: !!year,
  });
}
