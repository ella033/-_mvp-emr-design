import { SlotClosuresService } from "@/services/slot-closures-service";
import {
  createDetailQueryHook,
  createCrudMutationHooks,
} from "@/hooks/common/use-query-factory";
import { useQuery } from "@tanstack/react-query";

// 예약 마감 목록 조회 (queryString 파라미터가 필요하므로 별도 구현)
export function useSlotClosures(queryString: string) {
  return useQuery({
    queryKey: ["slot-closures", queryString],
    queryFn: async () => {
      return await SlotClosuresService.getSlotClosures(queryString);
    },
  });
}

// 예약 마감 상세 조회
export const useSlotClosureDetail = createDetailQueryHook(
  ["slot-closures"],
  (id: number) => SlotClosuresService.getSlotClosure(id)
);

// CRUD 뮤테이션 훅들
const crudHooks = createCrudMutationHooks(["slot-closures"], {
  create: SlotClosuresService.createSlotClosure,
  update: SlotClosuresService.updateSlotClosure,
  delete: SlotClosuresService.deleteSlotClosure,
});

export const useCreateSlotClosure = crudHooks.create;
export const useUpdateSlotClosure = crudHooks.update;
export const useDeleteSlotClosure = crudHooks.delete;
