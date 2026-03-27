"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeLocalStorage } from "@/components/yjg/common/util/ui-util";
import { LoginForm } from "@/app/auth/sign-in/components/login-form";
import { HospitalSelect } from "@/app/auth/sign-in/components/hospital-select";

import { AccountUnlockRequest } from "@/app/auth/components/account-unlock-request";
import { VerifyAuthCode } from "@/app/auth/components/verify-auth-code";
import { PasswordResetForm } from "@/app/auth/components/password-reset-form";
import { PasswordExpiryNotice } from "@/app/auth/components/password-expiry-notice";
import { SignUpLeft } from "@/app/auth/sign-up/_components/sign-up-left";
import { useGetHospitals } from "@/hooks/auth/use-auth-hospital";
import { useLogin } from "@/hooks/auth/use-login";

import { useAvailablePrintersQuery } from "@/components/settings/printer/hooks/use-available-printers-query";
import { usePrintersStore } from "@/store/printers-store";
import {
  useRequestUnlockToken,
  useRequestPasswordResetToken,
  useVerifyUnlockToken,
  useResetPasswordWithToken,
} from "@/hooks/auth/use-unlock-account";
import { useUserStore } from "@/store/user-store";
import { useToastHelpers } from "@/components/ui/toast";
import { checkPasswordExpiry } from "@/app/auth/utils/password-expiry";
import type { AuthUserHospital } from "@/types/auth-types";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SignInStep =
  | "login"
  | "select-hospital"
  | "expiry-notice"
  | "unlock-request"
  | "verify-code"
  | "reset-password";

type FlowType = "unlock" | "reset";

function TabletSignInContent() {
  const [step, setStep] = useState<SignInStep>("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [hospitals, setHospitals] = useState<AuthUserHospital[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUserStore();
  const setPrinters = usePrintersStore((state) => state.setPrinters);
  const printersQuery = useAvailablePrintersQuery({ enabled: false });
  const { success, error: toastError } = useToastHelpers();

  // States for flows
  const [passwordExpiryMessage, setPasswordExpiryMessage] = useState("");
  const [flowType, setFlowType] = useState<FlowType>("unlock");
  const [emailForUnlock, setEmailForUnlock] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [resetError, setResetError] = useState("");
  const [showPasswordWarning, setShowPasswordWarning] = useState(false);
  const [passwordWarningDays, setPasswordWarningDays] = useState(0);

  // Token Expiry Logic
  const expired = searchParams.get("expired") === "true";
  const [expiredEmail, setExpiredEmail] = useState("");

  useEffect(() => {
    if (expired) {
      const userStr = safeLocalStorage.getItem("user_tablet");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const emailToCheck = user.email || user.loginId;
          if (emailToCheck) {
            setExpiredEmail(emailToCheck);
          }
        } catch (e) {
          console.error("Failed to parse stored user", e);
        }
      }
    } else {
      // expired가 false일 때는 expiredEmail 초기화
      setExpiredEmail("");
    }
  }, [expired]);

  // Hooks
  const { mutate: requestUnlockToken, isPending: isRequestingUnlock } =
    useRequestUnlockToken({
      onSuccess: () => setStep("verify-code"),
      onError: (e) => {
        if (step === "verify-code") {
          setVerifyError(e.message || "인증 코드 재발송 실패");
        } else {
          toastError("인증 코드 발송 실패", e.message);
        }
      },
    });

  const { mutate: requestPasswordResetToken, isPending: isRequestingReset } =
    useRequestPasswordResetToken({
      onSuccess: () => setStep("verify-code"),
      onError: (e) => {
        if (step === "verify-code") {
          setVerifyError(e.message || "인증 코드 재발송 실패");
        } else {
          toastError("인증 코드 발송 실패", e.message);
        }
      },
    });

  const { mutate: verifyToken, isPending: isVerifying } = useVerifyUnlockToken({
    onSuccess: (data) => {
      if (data.isValid) {
        setStep("reset-password");
      } else {
        let message = "유효하지 않은 인증 코드입니다.";
        if (data.code === "MISMATCH") {
          message = "인증 코드가 일치하지 않습니다.";
        } else if (data.code === "EXPIRED") {
          message = "인증 코드가 만료되었습니다. 인증 코드를 다시 받아주세요.";
        } else if (data.code === "NOT_FOUND") {
          message = "인증 요청 정보를 찾을 수 없습니다. 다시 시도해주세요.";
        }
        setVerifyError(message);
      }
    },
    onError: (e) => setVerifyError(e.message || "인증 실패"),
  });

  const { mutate: resetPassword, isPending: isResetting } =
    useResetPasswordWithToken({
      onSuccess: () => {
        success("비밀번호 변경 완료", "비밀번호가 변경되었습니다. 다시 로그인해주세요.");
        setStep("login");
      },
      onError: (e) => setResetError(e.message),
    });

  // 병원 목록 조회
  const { mutate: getHospitals, isPending: isLoadingHospitals } =
    useGetHospitals({
      onSuccess: (data) => {
        setHospitals(data);
        setStep("select-hospital");
      },
      onError: (error) => {
        const message = error.message || "소속 병원 조회에 실패했습니다.";
        if (message.startsWith("비밀번호를 변경한 지 3개월이 경과되었습니다")) {
          setPasswordExpiryMessage(
            "비밀번호 변경 주기(3개월)가 만료되었습니다.\n계속 사용하려면 비밀번호를 변경해야 합니다."
          );
          setLoginData((prev) => {
            setEmailForUnlock(prev.email);
            return prev;
          });
          setFlowType("reset");
          setStep("expiry-notice");
        } else if (message.startsWith("비밀번호 5회 오류로 계정이 잠겼습니다")) {
          setLoginData((prev) => {
            setEmailForUnlock(prev.email);
            return prev;
          });
          setFlowType("unlock");
          setStep("unlock-request");
        } else {
          toastError("병원 목록 조회 실패", message);
        }
      },
    });

  // 로그인
  const { mutate: login } = useLogin({
    onSuccess: (data) => {
      setUser(data.user);
      safeLocalStorage.setItem("user_tablet", JSON.stringify(data.user));

      // 로그인 성공 시 1회: 전역 프린터 목록 세팅/업데이트
      void printersQuery
        .refetch()
        .then((result) => {
          if (result.data) {
            setPrinters(result.data);
          }
        })
        .catch((e) => {
          console.error("[TabletSignIn] Failed to fetch printers on login success", e);
        });

      // 비밀번호 만료 임박 체크 (3개월 주기, 2주 전부터 알림)
      const { warningNeeded, daysRemaining } = checkPasswordExpiry(data.user.passwordChangedAt);
      if (warningNeeded) {
        setPasswordWarningDays(daysRemaining);
        setShowPasswordWarning(true);
        return;
      }

      // 태블릿 로그인 성공 시 동의서 환자 목록 페이지로 이동
      console.log("[TabletSignIn] 로그인 성공, /tablet/consent-form/patient-list로 리다이렉트");
      router.replace("/tablet/consent-form/patient-list");
    },
    onError: (error) => {
      const message = error.message || "로그인에 실패했습니다.";
      if (message.startsWith("비밀번호를 변경한 지 3개월이 경과되었습니다")) {
        setPasswordExpiryMessage(
          "비밀번호 변경 주기(3개월)가 만료되었습니다.\n계속 사용하려면 비밀번호를 변경해야 합니다."
        );
        setLoginData((prev) => {
          setEmailForUnlock(prev.email);
          return prev;
        });
        setFlowType("reset");
        setStep("expiry-notice");
      } else if (message.startsWith("비밀번호 5회 오류로 계정이 잠겼습니다")) {
        setLoginData((prev) => {
          setEmailForUnlock(prev.email);
          return prev;
        });
        setFlowType("unlock");
        setStep("unlock-request");
      } else {
        toastError("로그인 실패", message);
      }
    },
  });

  // ID/PW 검증 후 소속 병원 목록 조회
  const handleLoginSuccess = (email: string, password: string) => {
    setLoginData({ email, password });
    const invitationId = searchParams.get("invitationId");
    getHospitals({
      loginId: email,
      password,
      ...(invitationId && { invitationId }),
    });
  };

  // 접속할 병원 선택 시 로그인 진행
  const handleHospitalSelect = (hospitalId: number) => {
    login({
      loginId: loginData.email,
      password: loginData.password,
      hospitalId,
    });
  };

  // Component Handlers
  const handleSendCode = (loginId: string) => {
    setEmailForUnlock(loginId);
    setVerifyError("");
    if (flowType === "unlock") {
      requestUnlockToken({ loginId });
    } else {
      requestPasswordResetToken({ loginId });
    }
  };

  const handleVerifyCode = (code: string) => {
    setVerifiedToken(code);
    verifyToken({ loginId: emailForUnlock, token: code });
  };

  const handleResetPassword = (newPassword: string) => {
    setResetError("");
    resetPassword({
      loginId: emailForUnlock,
      token: verifiedToken,
      newPassword,
    });
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Body */}
      <div className="flex flex-1 items-start self-stretch py-8 pl-8">
        {/* 왼쪽 섹션 */}
        <SignUpLeft />

        {/* 오른쪽 섹션 */}
        <div className="flex flex-col flex-1 gap-10 justify-center items-center self-stretch px-3">
          {step === "login" && (
            <LoginForm
              onLoginSuccessAction={handleLoginSuccess}
              isLoading={isLoadingHospitals}
              alertMessage={
                expired && expiredEmail
                  ? "프로그램을 계속 사용하시려면 다시 로그인해주세요."
                  : undefined
              }
              initialEmail={expiredEmail}
              isEmailDisabled={expired && !!expiredEmail}
              hideSignUp
            />
          )}
          {step === "select-hospital" && (
            <HospitalSelect
              hospitals={hospitals}
              onHospitalSelectAction={handleHospitalSelect}
              hideCreateHospital
            />
          )}

          {/* New Flow Components */}
          {step === "expiry-notice" && (
            <PasswordExpiryNotice
              message={passwordExpiryMessage}
              onChangePassword={() => setStep("unlock-request")}
            />
          )}
          {step === "unlock-request" && (
            <AccountUnlockRequest
              defaultLoginId={emailForUnlock}
              onSendCode={handleSendCode}
              isLoading={isRequestingUnlock || isRequestingReset}
              title={flowType === "reset" ? "비밀번호 재설정" : "계정 잠금 해제"}
              alertMessage={
                flowType === "unlock"
                  ? "로그인 5회 실패로 보안을 위해 계정이 잠겼습니다."
                  : undefined
              }
            />
          )}
          {step === "verify-code" && (
            <VerifyAuthCode
              loginId={emailForUnlock}
              onVerify={handleVerifyCode}
              onResend={() => handleSendCode(emailForUnlock)}
              isVerifying={isVerifying}
              title={flowType === "reset" ? "비밀번호 재설정" : "계정 잠금 해제"}
              errorMessage={verifyError}
            />
          )}
          {step === "reset-password" && (
            <PasswordResetForm
              onSubmit={handleResetPassword}
              isSubmitting={isResetting}
              alertMessage={
                flowType === "unlock"
                  ? "잠금이 해제되었습니다, 새 비밀번호를 설정하세요."
                  : "본인 인증이 완료되었습니다, 새 비밀번호를 설정하세요."
              }
              serverError={resetError}
            />
          )}
        </div>
      </div>
      <AlertDialog open={showPasswordWarning}>
        <AlertDialogContent className="max-w-[400px]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              비밀번호 변경 시기가 다가오고 있습니다.
            </AlertDialogTitle>
            <AlertDialogDescription>
              안전한 계정 관리를 위해 3개월마다 비밀번호를 변경 해야 합니다.
              <br />
              비밀번호 변경 기한이 {passwordWarningDays}일 남았습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push("/tablet/consent-form/patient-list")}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/auth/change-password")}>
              변경
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TabletSignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen bg-white" />}>
      <TabletSignInContent />
    </Suspense>
  );
}
