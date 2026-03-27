import { ApiClient } from "@/lib/api/api-client";
import { usersApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import { getDepartmentAndPositionNames } from "@/lib/common-utils";
import type {
  CreateUserRequest,
  CreateUserResponse,
  DeleteUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  User,
  UserManager,
  HospitalUser,
} from "@/types/user-types";

export class UsersService {
  static async getUser(id: number): Promise<User> {
    const validatedId = validateId(id, "User ID");
    try {
      return await ApiClient.get<User>(usersApi.detail(validatedId));
    } catch (error: any) {
      throw new Error("사용자 조회 실패", error.status);
    }
  }
  static async getHospitalUsers(hospitalId: number): Promise<HospitalUser[]> {
    const validatedHospitalId = validateId(hospitalId, "Hospital ID");
    try {
      return await ApiClient.get<HospitalUser[]>(
        `/hospital-users?hospitalId=${validatedHospitalId}`
      );
    } catch (error: any) {
      throw new Error("병원 사용자 목록 조회 실패", error.status);
    }
  }
  static async getUsersByHospital(hospitalId: number): Promise<UserManager[]> {
    const validatedHospitalId = validateId(hospitalId, "Hospital ID");
    try {
      const users = await ApiClient.get<UserManager[]>(
        usersApi.list(validatedHospitalId)
      );

      // department-store의 정보를 활용해서 departmentName과 positionName 채우기
      const usersWithDepartmentInfo = users.map((user: UserManager) => {
        const { departmentName, positionName } = getDepartmentAndPositionNames(
          user.departmentId || 0,
          user.positionId || 0,
          validatedHospitalId
        );

        return {
          ...user,
          departmentName: departmentName || "부서 미지정",
          positionName: positionName || "직급 미지정",
        } as UserManager;
      });

      return usersWithDepartmentInfo;
    } catch (error: any) {
      throw new Error("병원별 사용자 목록 조회 실패", error.status);
    }
  }
  static async createUser(
    user: CreateUserRequest
  ): Promise<CreateUserResponse> {
    try {
      return await ApiClient.post<CreateUserResponse>(usersApi.create, user);
    } catch (error: any) {
      throw new Error(error.message, error.status);
    }
  }
  static async updateUser(
    id: number,
    user: UpdateUserRequest
  ): Promise<UpdateUserResponse> {
    const validatedId = validateId(id, "User ID");
    try {
      return await ApiClient.put<UpdateUserResponse>(
        usersApi.update(validatedId),
        user
      );
    } catch (error: any) {
      throw new Error("사용자 수정 실패", error.status);
    }
  }
  static async deleteUser(id: number): Promise<DeleteUserResponse> {
    const validatedId = validateId(id, "User ID");
    try {
      return await ApiClient.delete<DeleteUserResponse>(
        usersApi.delete(validatedId)
      );
    } catch (error: any) {
      throw new Error("사용자 삭제 실패", error.status);
    }
  }
}
