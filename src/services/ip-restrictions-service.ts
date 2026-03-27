import { ApiClient } from "@/lib/api/api-client";
import { ipRestrictionsApi } from "@/lib/api/api-routes";
import { validateId } from "@/lib/validation";
import type {
  CreateWhitelistPayload,
  ExemptUser,
  IpWhitelistEntry,
  UpdateExemptUsersPayload,
} from "@/types/ip-restrictions";

export class IpRestrictionsService {
  static async getWhitelists(): Promise<IpWhitelistEntry[]> {
    try {
      return await ApiClient.get<IpWhitelistEntry[]>(ipRestrictionsApi.whitelists);
    } catch (_) {
      throw new Error("Failed to load IP whitelist");
    }
  }

  static async addWhitelist(payload: CreateWhitelistPayload): Promise<void> {
    try {
      await ApiClient.post(ipRestrictionsApi.whitelists, payload);
    } catch (_) {
      throw new Error("Failed to add IP whitelist");
    }
  }

  static async deleteWhitelists(ids: number[]): Promise<void> {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("No whitelist IDs provided");
    }

    const validatedIds = ids.map((id) => Number(validateId(id, "whitelistId")));

    try {
      await ApiClient.delete(ipRestrictionsApi.whitelists, { ids: validatedIds });
    } catch (_) {
      throw new Error("Failed to delete IP whitelist");
    }
  }

  static async getExemptUsers(): Promise<ExemptUser[]> {
    try {
      return await ApiClient.get<ExemptUser[]>(ipRestrictionsApi.exemptUsers);
    } catch (_) {
      throw new Error("Failed to load exempt users");
    }
  }

  static async updateExemptUsers(payload: UpdateExemptUsersPayload): Promise<void> {
    try {
      await ApiClient.put(ipRestrictionsApi.exemptUsers, payload);
    } catch (_) {
      throw new Error("Failed to update exempt users");
    }
  }

  static async getPublicIp(): Promise<string> {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      if (!response.ok) {
        throw new Error("Public IP request failed");
      }
      const data = (await response.json()) as { ip?: string };
      if (!data?.ip) {
        throw new Error("Public IP not found");
      }
      return data.ip;
    } catch (_) {
      throw new Error("Failed to fetch public IP");
    }
  }
}
