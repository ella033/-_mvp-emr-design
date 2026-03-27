import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DepartmentIntegratedService } from "@/services/department-integrated-service";
import { DepartmentRequestType, DepartmentWithPositionsType } from "@/types/department-types";
import { DepartmentPositionRequestType, DepartmentPositionType } from "@/types/department-position-types";

// 부서 통합 관리 hooks
export function useDepartmentIntegrated() {
  const queryClient = useQueryClient();

  // 부서 목록 조회 (with positions)
  const useDepartmentsWithPositions = () => {
    return useQuery({
      queryKey: ["departments-with-positions"],
      queryFn: () => DepartmentIntegratedService.getDepartmentsWithPositions(),
      // 기존 데이터가 있으면 즉시 반환하고 백그라운드에서 업데이트
      staleTime: 0, // 항상 최신 데이터로 간주
      refetchOnMount: true, // 컴포넌트 마운트 시 재조회
      refetchOnWindowFocus: false // 윈도우 포커스 시 재조회 안함
    });
  };

  // 부서 생성
  const createDepartment = useMutation({
    mutationFn: (department: DepartmentRequestType) =>
      DepartmentIntegratedService.createDepartment(department),
    onSuccess: (data, variables) => {
      // 부서 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["departments-with-positions"] });
    }
  });

  // 부서 수정
  const updateDepartment = useMutation({
    mutationFn: (department: DepartmentWithPositionsType) =>
      DepartmentIntegratedService.updateDepartment(department),
    onSuccess: (data, variables) => {
      // 부서 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["departments-with-positions"] });
    }
  });

  // 부서 삭제
  const deleteDepartment = useMutation({
    mutationFn: (departmentId: string) =>
      DepartmentIntegratedService.deleteDepartment(departmentId),
    onSuccess: (data, variables) => {
      // 부서 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["departments-with-positions"] });
    }
  });

  // 직급 추가
  const addPosition = useMutation({
    mutationFn: ({ departmentId, position }: { departmentId: string; position: DepartmentPositionRequestType }) =>
      DepartmentIntegratedService.addPosition(departmentId, position),
    onSuccess: (data, variables) => {
      // 부서 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["departments-with-positions"] });
    }
  });

  // 직급 수정
  const updatePosition = useMutation({
    mutationFn: (position: DepartmentPositionType) =>
      DepartmentIntegratedService.updatePosition(position),
    onSuccess: (data, variables) => {
      // 부서 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["departments-with-positions"] });
    }
  });

  // 직급 삭제
  const deletePosition = useMutation({
    mutationFn: (positionId: string) =>
      DepartmentIntegratedService.deletePosition(positionId),
    onSuccess: (data, variables) => {
      // 부서 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["departments-with-positions"] });
    }
  });

  return {
    // Query hooks
    useDepartmentsWithPositions,
    // Mutation hooks
    createDepartment,
    updateDepartment,
    deleteDepartment,
    addPosition,
    updatePosition,
    deletePosition
  };
} 