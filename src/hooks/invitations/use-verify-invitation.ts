import { useQuery } from "@tanstack/react-query";
import { InvitationsService } from "@/services/invitations-service";
import type { VerifyInvitationResponseDto } from "@/types/invitations/invitations-types";

export function useVerifyInvitation(invitationId: string | null) {
  return useQuery({
    queryKey: ["invitations", "verify", invitationId],
    queryFn: async (): Promise<VerifyInvitationResponseDto> => {
      if (!invitationId) {
        throw new Error("초대장 ID가 필요합니다.");
      }
      return await InvitationsService.verifyInvitation(invitationId);
    },
    enabled: !!invitationId,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
