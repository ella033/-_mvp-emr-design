import { useQuery } from "@tanstack/react-query";
import { InvitationsService } from "@/services/invitations-service";
import type { GetInvitationResponseDto } from "@/types/invitations/invitations-types";

export function useGetInvitation(invitationId: string | null) {
  return useQuery({
    queryKey: ["invitations", "get", invitationId],
    queryFn: async (): Promise<GetInvitationResponseDto> => {
      if (!invitationId) {
        throw new Error("초대장 ID가 필요합니다.");
      }
      return await InvitationsService.getInvitation(invitationId);
    },
    enabled: !!invitationId,
    staleTime: 5 * 60 * 1000, // 5분
  });
}

