import { ApiClient } from "@/lib/api/api-client";
import { departmentApi } from "@/lib/api/api-routes";
import type { DepartmentType, DepartmentRequestType, DepartmentUpdateRequestType } from "@/types/department-types";

export class DepartmentService {
  static async getDepartments(): Promise<DepartmentType[]> {
    try {
      return await ApiClient.get<DepartmentType[]>(departmentApi.list());
    } catch (error: any) {
      throw new Error("부서 목록 조회 실패", error.status);
    }
  }

  static async createDepartment(department: DepartmentRequestType): Promise<DepartmentType> {
    try {
      return await ApiClient.post<DepartmentType>(departmentApi.create, department);
    } catch (error: any) {
      throw new Error("부서 생성 실패", error.status);
    }
  }

  static async updateDepartment(id: number, department: DepartmentUpdateRequestType): Promise<DepartmentType> {
    try {
      return await ApiClient.put<DepartmentType>(departmentApi.update(id.toString()), department);
    } catch (error: any) {
      throw new Error("부서 수정 실패", error.status);
    }
  }

  static async deleteDepartment(id: string): Promise<void> {
    try {
      await ApiClient.delete<void>(departmentApi.delete(id.toString()));
    } catch (error: any) {
      throw new Error("부서 삭제 실패", error.status);
    }
  }
}
