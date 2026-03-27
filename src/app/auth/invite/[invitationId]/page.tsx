"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVerifyInvitation } from "@/hooks/invitations/use-verify-invitation";
import { UserInvitationStatus } from "@/constants/user-enums";
import InviteExpired from "./components/InviteExpired";
import InviteCompleted from "./components/InviteCompleted";

export default function InvitePage() {
  const params = useParams<{ invitationId: string }>();
  const router = useRouter();
  const invitationId = params?.invitationId || null;

  const { data, isLoading, error } = useVerifyInvitation(invitationId);

  useEffect(() => {
    if (!data || isLoading) return;

    const { status, isRegistered } = data;

    // 유효한 초대인 경우 (초대중)
    if (status === UserInvitationStatus.초대중) {
      if (isRegistered) {
        router.push(`/auth/sign-in?invitationId=${invitationId}`);
      } else {
        router.push(`/auth/sign-up?invitationId=${invitationId}`);
      }
    } else {
      // `초대중` 상태가 아닐 경우 현재 페이지에서 상태에 따른 표시
      return;
    }
  }, [data, isLoading, invitationId, router]);

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-gray-600">초대 링크를 확인하는 중...</p>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          오류가 발생했습니다
        </h1>
        <p className="text-gray-600">
          초대 링크를 확인하는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  if (!data) {
    return <InviteExpired />;
  }

  const { status } = data;

  if (
    status === UserInvitationStatus.초대취소 ||
    status === UserInvitationStatus.초대만료
  ) {
    return <InviteExpired />;
  }

  if (status === UserInvitationStatus.초대완료) {
    return <InviteCompleted />;
  }

  // 유효한 초대인 경우 리다이렉트 중 로딩 표시
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <p className="text-gray-600">이동 중...</p>
    </div>
  );
}
