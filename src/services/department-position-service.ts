import { ApiClient } from "@/lib/api/api-client";
import { departmentPositionApi } from "@/lib/api/api-routes";
import type { DepartmentPositionType, DepartmentPositionRequestType, DepartmentPositionUpdateRequestType } from "@/types/department-position-types";

export class DepartmentPositionService {
  static async getPositionsByDepartment(departmentId: string): Promise<DepartmentPositionType[]> {
    try {
      return await ApiClient.get<DepartmentPositionType[]>(departmentPositionApi.listByDepartment(departmentId));
    } catch (error: any) {
      throw new Error("직급 목록 조회 실패", error.status);
    }
  }



  static async createPosition(position: DepartmentPositionRequestType): Promise<DepartmentPositionType> {
    try {
      return await ApiClient.post<DepartmentPositionType>(departmentPositionApi.create, position);
    } catch (error: any) {
      throw new Error("직급 생성 실패", error.status);
    }
  }

  static async updatePosition(id: number, position: DepartmentPositionUpdateRequestType): Promise<DepartmentPositionType> {
    try {
      return await ApiClient.put<DepartmentPositionType>(departmentPositionApi.update(id.toString()), position);
    } catch (error: any) {
      throw new Error("직급 수정 실패", error.status);
    }
  }

  static async deletePosition(id: string): Promise<void> {
    try {
      await ApiClient.delete<void>(departmentPositionApi.delete(id.toString()));
    } catch (error: any) {
      throw new Error("직급 삭제 실패", error.status);
    }
  }
} 