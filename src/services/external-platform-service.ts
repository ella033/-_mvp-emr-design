import { ApiClient } from "@/lib/api/api-client";
import { externalPlatformApi } from "@/lib/api/routes/external-platform-api";
import type { components } from "@/generated/api/types";

export type ExternalPlatformResponseDto = components["schemas"]["ExternalPlatformResponseDto"];
export type CreateExternalPlatformDto = components["schemas"]["CreateExternalPlatformDto"];
export type UpdateExternalPlatformDto = components["schemas"]["UpdateExternalPlatformDto"];

export class ExternalPlatformService {
  static async findAll(params?: {
    platformCode?: string;
    isActive?: boolean;
  }): Promise<ExternalPlatformResponseDto[]> {
    const searchParams: Record<string, string> = {};
    if (params?.platformCode != null) searchParams.platformCode = params.platformCode;
    if (params?.isActive != null) searchParams.isActive = String(params.isActive);
    const query = Object.keys(searchParams).length > 0 ? searchParams : undefined;
    return await ApiClient.get<ExternalPlatformResponseDto[]>(externalPlatformApi.list, query);
  }

  static async findOne(platformCode: string): Promise<ExternalPlatformResponseDto> {
    return await ApiClient.get<ExternalPlatformResponseDto>(externalPlatformApi.one(platformCode));
  }

  static async create(data: CreateExternalPlatformDto): Promise<ExternalPlatformResponseDto> {
    return await ApiClient.post<ExternalPlatformResponseDto>(externalPlatformApi.create, data);
  }

  static async update(
    platformCode: string,
    data: UpdateExternalPlatformDto
  ): Promise<ExternalPlatformResponseDto> {
    return await ApiClient.put<ExternalPlatformResponseDto>(
      externalPlatformApi.update(platformCode),
      data
    );
  }

  static async remove(platformCode: string): Promise<void> {
    await ApiClient.delete(externalPlatformApi.remove(platformCode));
  }
}
