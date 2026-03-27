import { DepartmentService } from "./department-service";
import { DepartmentPositionService } from "@/services/department-position-service";
import { DepartmentWithPositionsType, DepartmentRequestType } from "@/types/department-types";
import { DepartmentPositionType, DepartmentPositionRequestType } from "@/types/department-position-types";

// 부서 및 직급 통합 서비스 (department-service & department-position-service)
// 부서와 직급은 한 세트이므로 하나의 서비스에서 통합관리하게 함 - 실제 관련 서비스를 쓸 때는 당 서비스를 사용하는 hooks 사용
export class DepartmentIntegratedService {
  /**
   * 특정 병원의 모든 부서와 직급을 통합하여 조회
   */
  static async getDepartmentsWithPositions(): Promise<DepartmentWithPositionsType[]> {
    try {
      // 1. 병원의 모든 부서 조회
      const departments = await DepartmentService.getDepartments();

      // 2. 각 부서의 직급들을 병렬로 조회
      const departmentsWithPositions = await Promise.all(
        departments.map(async (department) => {
          const positions = await DepartmentPositionService.getPositionsByDepartment(department.id.toString());
          return {
            department,
            positions
          };
        })
      );

      return departmentsWithPositions;
    } catch (error: any) {
      throw new Error("부서 및 직급 통합 조회 실패", error.status);
    }
  }

  /**
   * 부서 생성 (직급 없이)
   */
  static async createDepartment(department: DepartmentRequestType): Promise<DepartmentWithPositionsType> {
    try {
      const createdDepartment = await DepartmentService.createDepartment(department);
      return {
        department: createdDepartment,
        positions: []
      };
    } catch (error: any) {
      throw new Error("부서 생성 실패", error.status);
    }
  }

  /**
   * 부서 수정
   */
  static async updateDepartment(department: DepartmentWithPositionsType): Promise<DepartmentWithPositionsType> {
    try {
      const updateData = { name: department.department.name };
      const updatedDepartment = await DepartmentService.updateDepartment(department.department.id, updateData);
      return {
        department: updatedDepartment,
        positions: department.positions
      };
    } catch (error: any) {
      throw new Error("부서 수정 실패", error.status);
    }
  }

  /**
   * 부서 삭제 (연관된 직급들도 함께 삭제)
   */
  static async deleteDepartment(departmentId: string): Promise<void> {
    try {
      // 1. 먼저 해당 부서의 모든 직급 삭제
      const positions = await DepartmentPositionService.getPositionsByDepartment(departmentId);
      await Promise.all(
        positions.map(position =>
          DepartmentPositionService.deletePosition(position.id.toString())
        )
      );

      // 2. 부서 삭제
      await DepartmentService.deleteDepartment(departmentId);
    } catch (error: any) {
      throw new Error("부서 삭제 실패", error.status);
    }
  }

  /**
   * 직급 추가
   */
  static async addPosition(departmentId: string, position: DepartmentPositionRequestType): Promise<DepartmentPositionType> {
    try {
      return await DepartmentPositionService.createPosition({
        ...position,
        departmentId: parseInt(departmentId)
      });
    } catch (error: any) {
      throw new Error("직급 추가 실패", error.status);
    }
  }

  /**
   * 직급 수정
   */
  static async updatePosition(position: DepartmentPositionType): Promise<DepartmentPositionType> {
    try {
      const updateData = { name: position.name };
      return await DepartmentPositionService.updatePosition(position.id, updateData);
    } catch (error: any) {
      throw new Error("직급 수정 실패", error.status);
    }
  }

  /**
   * 직급 삭제
   */
  static async deletePosition(positionId: string): Promise<void> {
    try {
      await DepartmentPositionService.deletePosition(positionId);
    } catch (error: any) {
      throw new Error("직급 삭제 실패", error.status);
    }
  }
} 