"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeLocalStorage } from "@/components/yjg/common/util/ui-util";
import { DIDLoginForm } from "./components/did-login-form";
import { HospitalSelect } from "@/app/auth/sign-in/components/hospital-select";
import { AccountUnlockRequest } from "@/app/auth/components/account-unlock-request";
import { VerifyAuthCode } from "@/app/auth/components/verify-auth-code";
import { PasswordResetForm } from "@/app/auth/components/password-reset-form";
import { PasswordExpiryNotice } from "@/app/auth/components/password-expiry-notice";
import { SignUpLeft } from "@/app/auth/sign-up/_components/sign-up-left";
import { useGetHospitals } from "@/hooks/auth/use-auth-hospital";
import { useLogin } from "@/hooks/auth/use-login";
import { DidService } from "@/services/did-service";
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
  | "did-control"
  | "expiry-notice"
  | "unlock-request"
  | "verify-code"
  | "reset-password";

type FlowType = "unlock" | "reset";

async function openDidWindow(roomName?: string): Promise<Window | null> {
  const url = roomName ? `/did?roomName=${roomName}` : "/did";

  // Window Management API로 두 번째 모니터 찾기
  try {
    if ("getScreenDetails" in window) {
      const screenDetails = await (window as any).getScreenDetails();
      const screens = screenDetails.screens as any[];
      // 현재 화면이 아닌 다른 화면 찾기 (label은 웹에서 비어있을 수 있어 제외)
      const currentScreen = screenDetails.currentScreen;
      const isSameScreen = (a: any, b: any) =>
        a?.left === b?.left &&
        a?.top === b?.top &&
        a?.width === b?.width &&
        a?.height === b?.height;

      const otherScreen =
        screens.find((s: any) => !isSameScreen(s, currentScreen)) ||
        screens[0];

      const didWindow = window.open(
        url,
        "did-display",
        `left=${otherScreen.left},top=${otherScreen.top},width=${otherScreen.width},height=${otherScreen.height},menubar=no,toolbar=no,location=no,status=no`
      );
      return didWindow;
    }
  } catch (e) {
    console.warn("[DID] Window Management API 실패, fallback 사용:", e);
  }

  // Fallback: 기존 방식
  const left = window.screenX + window.screen.width;
  const width = window.screen.availWidth;
  const height = window.screen.availHeight;
  const didWindow = window.open(
    url,
    "did-display",
    `left=${left},top=0,width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no`
  );
  if (didWindow) {
    setTimeout(() => {
      didWindow.moveTo(left, 0);
      didWindow.resizeTo(width, height);
    }, 300);
  }
  return didWindow;
}

function DIDSignInContent() {
  const [step, setStep] = useState<SignInStep>("login");
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [hospitals, setHospitals] = useState<AuthUserHospital[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUserStore();
  const { success, error: toastError } = useToastHelpers();
  const didWindowRef = useRef<Window | null>(null);
  const [isDidOpen, setIsDidOpen] = useState(false);

  // States for flows
  const [passwordExpiryMessage, setPasswordExpiryMessage] = useState("");
  const [flowType, setFlowType] = useState<FlowType>("unlock");
  const [emailForUnlock, setEmailForUnlock] = useState("");
  const [verifiedToken, setVerifiedToken] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [resetError, setResetError] = useState("");
  const [showPasswordWarning, setShowPasswordWarning] = useState(false);
  const [passwordWarningDays, setPasswordWarningDays] = useState(0);

  // 진료실 선택
  const [showRoomSelect, setShowRoomSelect] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);


  // Token Expiry Logic
  const expired = searchParams.get("expired") === "true";
  const [expiredEmail, setExpiredEmail] = useState("");

  useEffect(() => {
    if (expired) {
      const userStr = safeLocalStorage.getItem("user_did");
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
      setExpiredEmail("");
    }
  }, [expired]);


  // DID 창이 외부에서 닫혔는지 감지
  useEffect(() => {
    if (!isDidOpen || !didWindowRef.current) return;
    const interval = setInterval(() => {
      if (didWindowRef.current?.closed) {
        didWindowRef.current = null;
        setIsDidOpen(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isDidOpen]);

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
      safeLocalStorage.setItem("user_did", JSON.stringify(data.user));

      const { warningNeeded, daysRemaining } = checkPasswordExpiry(data.user.passwordChangedAt);
      if (warningNeeded) {
        setPasswordWarningDays(daysRemaining);
        setShowPasswordWarning(true);
        return;
      }

      // DID 로그인 성공 시 진료실 선택 팝업 표시
      DidService.getQueues().then((rooms) => {
        const roomNames = rooms.map((r) => r.roomPanel);
        setAvailableRooms(roomNames);
        setSelectedRooms(roomNames);
        setShowRoomSelect(true);
      }).catch(() => {
        // 진료실 조회 실패 시 전체 보기로 바로 열기
        openDidWindow().then((win) => {
          if (win) {
            didWindowRef.current = win;
            setIsDidOpen(true);
          }
          setStep("did-control");
        });
      });
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
    getHospitals({
      loginId: email,
      password,
    });
  };

  // 접속할 병원 선택 시 로그인 진행
  const handleHospitalSelect = (hospitalId: number) => {
    login({
      loginId: loginData.email,
      password: loginData.password,
      hospitalId,
      clientType: "did",
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
    <div className="flex min-h-screen w-full bg-white">
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 items-start self-stretch px-8 py-8">
        <SignUpLeft />

        <div className="flex flex-col flex-1 gap-10 justify-center items-center self-stretch px-3">
          {step === "login" && (
            <>
              <DIDLoginForm
                onLoginSuccessAction={handleLoginSuccess}
                isLoading={isLoadingHospitals}
                alertMessage={
                  expired && expiredEmail
                    ? "프로그램을 계속 사용하시려면 다시 로그인해주세요."
                    : undefined
                }
                initialEmail={expiredEmail}
                isEmailDisabled={expired && !!expiredEmail}
              />
            </>
          )}
          {step === "select-hospital" && (
            <div className="w-full max-w-md">
              <HospitalSelect
                hospitals={hospitals}
                onHospitalSelectAction={handleHospitalSelect}
                hideCreateHospital
              />
            </div>
          )}

          {step === "did-control" && (
            <div className="w-full max-w-md">
              <h1 className="text-2xl font-bold text-[var(--gray-100)] mb-2">DID 화면 관리</h1>
              <p className="text-base text-[var(--gray-500)] mb-6">
                {isDidOpen
                  ? "환자 대기 화면이 DID 모니터에서 실행 중입니다."
                  : "DID 화면이 꺼져 있습니다. 아래 버튼으로 다시 켤 수 있습니다."}
              </p>

              <div className="flex flex-col gap-3">
                {isDidOpen ? (
                  <button
                    onClick={() => {
                      if (didWindowRef.current && !didWindowRef.current.closed) {
                        didWindowRef.current.close();
                      }
                      didWindowRef.current = null;
                      setIsDidOpen(false);
                    }}
                    className="w-full py-3 text-base font-medium rounded-md text-white bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    DID 화면 끄기
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      DidService.getQueues().then((rooms) => {
                        const roomNames = rooms.map((r) => r.roomPanel);
                        setAvailableRooms(roomNames);
                        setSelectedRooms(roomNames);
                        setShowRoomSelect(true);
                      }).catch(async () => {
                        const win = await openDidWindow();
                        if (win) {
                          didWindowRef.current = win;
                          setIsDidOpen(true);
                        }
                      });
                    }}
                    className="w-full py-3 text-base font-medium rounded-md text-white bg-[var(--main-color)] hover:bg-[var(--main-color-hover)] transition-colors cursor-pointer"
                  >
                    DID 화면 켜기
                  </button>
                )}
              </div>

              {/* 전체화면 버튼 */}
              {isDidOpen && (
                <button
                  onClick={() => {
                    if (didWindowRef.current && !didWindowRef.current.closed) {
                      didWindowRef.current.postMessage({ type: "request-focus" }, "*");
                      didWindowRef.current.postMessage({ type: "request-fullscreen" }, "*");
                      didWindowRef.current.focus();
                    }
                  }}
                  className="w-full mt-3 py-3 text-base font-medium rounded-md text-[var(--main-color)] border border-[var(--main-color)] hover:bg-[var(--main-color)] hover:text-white transition-colors cursor-pointer"
                >
                  DID 전체화면
                </button>
              )}

              {/* DID 상태 표시 */}
              <div className="mt-4 p-3 rounded-md bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isDidOpen ? "bg-green-500" : "bg-gray-400"}`} />
                  <span className="text-sm text-gray-600">
                    {isDidOpen ? "DID 화면 실행 중" : "DID 화면 꺼짐"}
                  </span>
                </div>
              </div>

              {/* 브라우저 설정 안내 */}
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  DID 화면 사용을 위한 브라우저 설정
                </p>
                <ul className="text-xs text-gray-500 space-y-2">
                  <li>
                    <span className="font-medium text-gray-600">1. 팝업 허용:</span>{" "}
                    주소창 좌측 자물쇠 아이콘 &gt; 사이트 설정 &gt; 팝업 &gt; 허용
                  </li>
                  <li>
                    <span className="font-medium text-gray-600">2. 소리 허용 (호출 음성 안내):</span>{" "}
                    브라우저 설정 &gt; 사이트 권한 &gt; 소리(자동 재생) &gt; 현재 사이트 URL을 허용 목록에 추가
                  </li>
                  <li>
                    <span className="font-medium text-gray-600">2-1. 보조 경로:</span>{" "}
                    소리 항목이 안 보이면 사이트 설정 &gt; 추가 콘텐츠 &gt; 소리에서 허용
                    <br />
                    (Chrome/Edge 등 브라우저 버전에 따라 메뉴 위치가 다를 수 있습니다.)
                  </li>
                  <li>
                    <span className="font-medium text-gray-600">3. 창 관리 허용:</span>{" "}
                    로그인 시 &quot;화면 배치 권한&quot; 팝업이 뜨면 허용 (DID 모니터에 자동 배치)
                  </li>
                </ul>
              </div>

              {/* 병원 선택으로 돌아가기 */}
              <button
                onClick={() => setStep("select-hospital")}
                className="w-full mt-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                병원 다시 선택
              </button>
            </div>
          )}

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
      <AlertDialog
        open={showPasswordWarning}
        onOpenChange={(open) => {
          setShowPasswordWarning(open);
        }}
      >
        <AlertDialogContent className="max-w-[400px] [&_[data-slot='dialog-close']]:cursor-pointer">
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
            <AlertDialogCancel onClick={async () => {
              setShowPasswordWarning(false);
              DidService.getQueues().then((rooms) => {
                const roomNames = rooms.map((r) => r.roomPanel);
                setAvailableRooms(roomNames);
                setSelectedRooms(roomNames);
                setShowRoomSelect(true);
              }).catch(async () => {
                const win = await openDidWindow();
                if (win) {
                  didWindowRef.current = win;
                  setIsDidOpen(true);
                }
                setStep("did-control");
              });
            }}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/auth/change-password")}>
              변경
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 진료실 선택 팝업 */}
      <AlertDialog
        open={showRoomSelect}
        onOpenChange={(open) => {
          setShowRoomSelect(open);
          if (!open) {
            setStep("did-control");
          }
        }}
      >
        <AlertDialogContent className="max-w-[420px] [&_button.absolute.top-4.right-4]:cursor-pointer">
          <AlertDialogHeader>
            <AlertDialogTitle>DID 표시 진료실 선택</AlertDialogTitle>
            <AlertDialogDescription>
              DID 화면에 표시할 진료실을 선택해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2 my-2 max-h-[300px] overflow-y-auto">
            {availableRooms.map((room) => (
              <label
                key={room}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedRooms.includes(room)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRooms((prev) => [...prev, room]);
                    } else {
                      setSelectedRooms((prev) => prev.filter((r) => r !== room));
                    }
                  }}
                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">{room}</span>
              </label>
            ))}
          </div>

          <button
            onClick={() => {
              if (selectedRooms.length === availableRooms.length) {
                setSelectedRooms([]);
              } else {
                setSelectedRooms([...availableRooms]);
              }
            }}
            className="w-full py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {selectedRooms.length === availableRooms.length ? "전체 해제" : "전체 선택"}
          </button>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowRoomSelect(false);
              setStep("did-control");
            }}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={selectedRooms.length === 0}
              onClick={async () => {
                const roomParam =
                  selectedRooms.length === availableRooms.length
                    ? undefined
                    : selectedRooms.join(",");
                const win = await openDidWindow(roomParam);
                if (win) {
                  didWindowRef.current = win;
                  setIsDidOpen(true);
                }
                setShowRoomSelect(false);
                setStep("did-control");
              }}
            >
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

export default function DIDSignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen w-full bg-white" />}>
      <DIDSignInContent />
    </Suspense>
  );
}
