import { ApiClient } from "@/lib/api/api-client";
import { invitationsApi } from "@/lib/api/routes/invitations-api";
import type {
  VerifyInvitationResponseDto,
  GetInvitationResponseDto,
} from "@/types/invitations/invitations-types";

export class InvitationsService {
  static async verifyInvitation(
    invitationId: string
  ): Promise<VerifyInvitationResponseDto> {
    try {
      return await ApiClient.get<VerifyInvitationResponseDto>(
        invitationsApi.verifyInvitation(invitationId)
      );
    } catch (error: any) {
      throw new Error("초대 링크 검증에 실패했습니다.", error.status);
    }
  }

  static async getInvitation(
    invitationId: string
  ): Promise<GetInvitationResponseDto> {
    try {
      return await ApiClient.get<GetInvitationResponseDto>(
        invitationsApi.getInvitation(invitationId)
      );
    } catch (error: any) {
      throw new Error("초대 정보 조회에 실패했습니다.", error.status);
    }
  }
}

