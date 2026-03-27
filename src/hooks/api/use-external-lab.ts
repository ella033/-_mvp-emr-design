import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLabService } from "@/services/external-lab-service";
import type { ExternalLab } from "@/app/master-data/_components/(tabs)/(medical-examine)/(external-lab-examination)/external-lab-data-type";
import { createMutationHook } from "@/hooks/common/use-query-factory";

// 수탁기관 목록 조회 (통합)
export function useExternalLabs() {
  const {
    data: labs,
    isLoading,
    ...rest
  } = useQuery({
    queryKey: ["external-lab", "labs"],
    queryFn: async () => {
      return await ExternalLabService.getLabs();
    },
  });

  // 정렬 로직: 시스템 제공이 위, 사용자 등록이 아래, 각 그룹 내에서 사용 중인 것이 위로
  const sortedLabs = useMemo(() => {
    if (!labs || labs.length === 0) return [];

    const sorted: ExternalLab[] = [];

    // 시스템 제공 목록 (isEnabled: true 먼저)
    const enabledSystemLabs = labs.filter(
      (lab) => lab.isSystemProvided && lab.isEnabled
    );
    const disabledSystemLabs = labs.filter(
      (lab) => lab.isSystemProvided && !lab.isEnabled
    );
    sorted.push(...enabledSystemLabs, ...disabledSystemLabs);

    // 사용자 등록 목록 (isEnabled: true 먼저)
    const enabledHospitalLabs = labs.filter(
      (lab) => !lab.isSystemProvided && lab.isEnabled
    );
    const disabledHospitalLabs = labs.filter(
      (lab) => !lab.isSystemProvided && !lab.isEnabled
    );
    sorted.push(...enabledHospitalLabs, ...disabledHospitalLabs);

    return sorted;
  }, [labs]);

  return {
    data: sortedLabs,
    isLoading,
    ...rest,
  };
}

// 수탁기관 사용여부 업데이트 뮤테이션
export const useUpdateLabMapping = createMutationHook(
  async (data: { externalLabId: string; isEnabled: boolean }) => {
    return await ExternalLabService.updateLabMapping(data);
  },
  {
    invalidateQueries: [["external-lab", "labs"], ["medical-examine-all-labs"]],
  }
);

// 수탁기관 등록 뮤테이션
export const useCreateLab = createMutationHook(
  async (data: { code: string; name: string }) => {
    return await ExternalLabService.createLab(data);
  },
  {
    invalidateQueries: [["external-lab", "labs"], ["medical-examine-all-labs"]],
  }
);

// 질가산등급 등록 뮤테이션
export const useCreateLabGrade = createMutationHook(
  async ({
    id,
    data,
  }: {
    id: string;
    data: {
      qualityGrade: number;
      isPathologyCertified: boolean;
      isNuclearMedicineCertified: boolean;
      applyDate: string;
    };
  }) => {
    return await ExternalLabService.createLabGrade(id, data);
  },
  {
    invalidateQueries: [["external-lab", "labs"]],
  }
);

// 수탁기관 삭제 뮤테이션
export const useDeleteLab = createMutationHook(
  async (id: string) => {
    return await ExternalLabService.deleteLab(id);
  },
  {
    invalidateQueries: [["external-lab", "labs"], ["medical-examine-all-labs"]],
  }
);

// 질가산등급 삭제 뮤테이션
export const useDeleteLabGrade = createMutationHook(
  async ({ id, gradeId }: { id: string; gradeId: string }) => {
    return await ExternalLabService.deleteLabGrade(id, gradeId);
  },
  {
    invalidateQueries: [["external-lab", "labs"]],
  }
);

// 질가산등급 수정 뮤테이션
export const useUpdateLabGrade = createMutationHook(
  async ({
    id,
    gradeId,
    data,
  }: {
    id: string;
    gradeId: string;
    data: {
      qualityGrade: number;
      isPathologyCertified: boolean;
      isNuclearMedicineCertified: boolean;
    };
  }) => {
    return await ExternalLabService.updateLabGrade(id, gradeId, data);
  },
  {
    invalidateQueries: [["external-lab", "labs"]],
  }
);

// 수탁기관 정보 수정 뮤테이션
export const useUpdateLab = createMutationHook(
  async ({
    id,
    data,
  }: {
    id: string;
    data: {
      name: string;
      code: string;
    };
  }) => {
    return await ExternalLabService.updateLab(id, data);
  },
  {
    invalidateQueries: [["external-lab", "labs"], ["medical-examine-all-labs"]],
  }
);
