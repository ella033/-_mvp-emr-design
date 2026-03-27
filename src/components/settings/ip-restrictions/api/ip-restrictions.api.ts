import { IpRestrictionsService } from "@/services/ip-restrictions-service";
import type { ExemptUser, IpWhitelistEntry } from "@/types/ip-restrictions";

export const ipRestrictionsApi = {
  getWhitelists: () => IpRestrictionsService.getWhitelists(),
  addWhitelist: (data: { ipAddress: string; memo?: string }) => IpRestrictionsService.addWhitelist(data),
  deleteWhitelists: (ids: number[]) => IpRestrictionsService.deleteWhitelists(ids),
  getExemptUsers: () => IpRestrictionsService.getExemptUsers(),
  updateExemptUsers: (data: { userIds: number[] }) => IpRestrictionsService.updateExemptUsers(data),
  getPublicIp: () => IpRestrictionsService.getPublicIp(),
};
