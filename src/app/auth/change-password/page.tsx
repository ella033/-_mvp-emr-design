"use client";

import React, { useState, useEffect } from "react";
import { SignUpLeft } from "../sign-up/_components/sign-up-left";
import { useRouter } from "next/navigation";
import { MyAccountService } from "@/services/my-account-service";
import { Button } from "@/components/ui/button";
import { InputPassword } from "@/components/ui/input-password";
import { Label } from "@/components/ui/label";
import { useToastHelpers } from "@/components/ui/toast";
import { safeLocalStorage, safeJsonParse } from "@/components/yjg/common/util/ui-util";
import { validatePasswordComplexity } from "@/lib/validation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { success, error } = useToastHelpers();

  useEffect(() => {
    const storedUser = safeJsonParse(safeLocalStorage.getItem("user"), null);
    if (!storedUser) {
      router.replace("/auth/sign-in");
    }
  }, [router]);

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");



  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      error("모든 필드를 입력해주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      error("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 8 || !validatePasswordComplexity(newPassword)) {
      error("비밀번호는 영대문자, 영소문자, 숫자, 특수문자 중 3가지 이상 조합으로 8자리 이상이어야 합니다.");
      return;
    }

    try {
      await MyAccountService.updatePassword({ oldPassword, newPassword });
      success("비밀번호가 변경되었습니다.");
      // 변경 후 처리: 예를 들어 메인으로 이동하거나 로그아웃 처리 등
      router.push("/");
    } catch (e) {
      error("비밀번호 변경에 실패했습니다. 기존 비밀번호를 확인해주세요.");
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Body */}
      <div className="flex flex-1 items-start self-stretch py-8 pl-8">
        {/* 왼쪽 섹션 */}
        <SignUpLeft />

        {/* 오른쪽 섹션 */}
        <div className="flex flex-1 w-full h-full flex-col items-center justify-center min-h-screen text-gray-900">
          <div className="flex flex-col w-[360px] gap-8">
            <div className="space-y-2 text-center sm:text-left">
              <h1 className="text-2xl font-bold tracking-tight">비밀번호 변경</h1>
              <p className="text-[14px] text-muted-foreground">
                비밀번호를 변경해주세요. 기존에 사용한 비밀번호를 재사용할 수 없습니다.
              </p>
            </div>

            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="old-password">
                  기존 비밀번호 <span className="text-destructive">*</span>
                </Label>
                <InputPassword
                  id="old-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="기존 비밀번호를 입력해주세요."
                  className="px-[8px]"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-password">
                  새 비밀번호 <span className="text-destructive">*</span>
                </Label>
                <InputPassword
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="새 비밀번호를 입력해주세요."
                  className="px-[8px]"
                />
                <p className="text-[#70737C] font-normal text-[12px] leading-[15px] tracking-[-0.12px] break-keep">
                  영문대/소문자, 숫자, 특수문자 조합 8자리 이상으로 설정해주세요.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm-password">
                  새 비밀번호 확인 <span className="text-destructive">*</span>
                </Label>
                <InputPassword
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="새 비밀번호를 입력해주세요."
                  className="px-[8px]"
                />
                <p className="text-[#70737C] font-normal text-[12px] leading-[15px] tracking-[-0.12px] break-keep">
                  영문대/소문자, 숫자, 특수문자 조합 8자리 이상으로 설정해주세요.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2">

              <button
                className="w-full cursor-pointer flex py-2 px-3 justify-center items-center gap-1 self-stretch rounded-[4px] bg-[#180F38] hover:bg-[#180F38]/70 overflow-hidden text-white text-center text-ellipsis text-[13px] font-medium leading-[125%] tracking-[-0.13px] h-[32px]"
                onClick={handleChangePassword}
              >
                확인
              </button>

              <button
                onClick={() => router.back()}
                className="w-full cursor-pointer flex py-2 px-3 justify-center items-center gap-1 self-stretch rounded-[4px] border border-[#171719] bg-white overflow-hidden text-[#171719] text-center text-ellipsis text-[13px] font-medium leading-[125%] tracking-[-0.13px] h-[32px]"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
