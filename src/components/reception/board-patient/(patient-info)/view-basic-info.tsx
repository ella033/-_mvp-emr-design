import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useBasicInfo } from "@/hooks/reception/use-basic-info";
import { useQualificationCheck } from "@/hooks/reception/use-qualification-check";
import QualificationCheckModals from "@/components/qualification-check/qualification-check-modals";
import { getAgeOrMonth, getGender, formatPhoneNumber } from "@/lib/patient-utils";
import { formatRrnNumber } from "@/lib/common-utils";
import { convertUTCtoKST, formatDate } from "@/lib/date-utils";
import MyPopup from "@/components/yjg/my-pop-up";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import BasicInfo from "./basic-info2";
import { usePatientReception } from "@/hooks/reception/use-patient-reception";
import { useUpdatePatient } from "@/hooks/patient/use-update-patient";
import { useToastHelpers } from "@/components/ui/toast";
import { useIdentityCertificate } from "@/hooks/reception/use-identity-certificate";
import { IdentityCertificateModal } from "@/components/reception/identity-certificate-modal";
import { useBoardPatientRuntime } from "../board-patient-runtime-context";
import {
  SystemDangerIcon,
  SystemSuccessIcon,
  CheckDefaultIcon,
  MasterDataIcon,
} from "@/components/custom-icons";
import {
  ConsentPrivacyType,
  본인확인여부,
  본인확인여부Label,
} from "@/constants/common/common-enum";
import { ConsentRequestModal } from "@/components/consent/consent-request-modal";
import { VALIDATE_MSG } from "@/constants/validate-constants";
import { usePatientGroupsStore } from "@/store/patient-groups-store";
import type { components } from "@/generated/api/types";
import type { Reception } from "@/types/common/reception-types";

interface ViewBasicInfoProps {
  /** 외부에서 주입할 reception 객체 (우선 사용) */
  reception?: Reception | null;
  /** 외부에서 주입할 reception ID */
  receptionId?: string | null;
  onNhicResponseApply?: (
    responseModel: components["schemas"]["EligibilityCheckResponseDto"]
  ) => void;
  isDisabled?: boolean;
  /** Reception 업데이트 콜백 (외부 receptionId가 있을 때 사용) */
  onUpdateReception?: (updates: Partial<Reception>) => void;
}

export default function ViewBasicInfo({
  reception: externalReception,
  receptionId: externalReceptionId,
  onNhicResponseApply: _onNhicResponseApply,
  isDisabled: _isDisabled = false,
  onUpdateReception,
}: ViewBasicInfoProps) {
  const {
    currentPatientInfo,
    birth,
    getMedicalAidStatus,
    handleQualificationRequest,
    handleNhicModalApply,
    handleNhicModalClose,
    tempEligibilityData,
    loading: qualificationLoading,
  } = useBasicInfo({
    reception: externalReception,
    receptionId: externalReceptionId,
    onUpdateReception,
  });

  const { setPatientBaseInfo } = usePatientReception();
  const updatePatientMutation = useUpdatePatient();
  const patientGroups = usePatientGroupsStore((s) => s.patientGroups);
  const { success: showSuccess, error: showError } = useToastHelpers();
  const activeReceptionId = externalReceptionId || "";
  const { dirty } = useBoardPatientRuntime();

  // patientBaseInfo 업데이트 래퍼 (자격조회 훅에서 사용)
  const updatePatientBaseInfo = useCallback(
    (data: any) => {
      if (currentPatientInfo && onUpdateReception) {
        onUpdateReception({
          patientBaseInfo: {
            ...currentPatientInfo,
            ...data,
          } as any,
        });
      }
    },
    [currentPatientInfo, onUpdateReception]
  );

  // 자격조회 오케스트레이션 훅
  const qualificationCheck = useQualificationCheck({
    currentPatientInfo,
    getMedicalAidStatus,
    handleQualificationRequest,
    handleNhicModalApply,
    handleNhicModalClose,
    tempEligibilityData,
    loading: qualificationLoading,
    updatePatientBaseInfo,
    updatePatientMutation,
    onNhicResponseApply: _onNhicResponseApply,
  });

  const medicalAidStatus = getMedicalAidStatus();

  const patientName = currentPatientInfo?.name || "-";
  const ageText = birth ? getAgeOrMonth(birth, "ko") : "-";
  const genderText = getGender(currentPatientInfo?.gender, "ko") || "-";
  const patientNo =
    currentPatientInfo?.patientNo && currentPatientInfo.patientNo !== 0
      ? String(currentPatientInfo.patientNo)
      : "-";

  const rrnDisplay = currentPatientInfo?.rrn
    ? formatRrnNumber(currentPatientInfo.rrn)
    : "-";
  const phoneDisplay = currentPatientInfo?.phone1
    ? formatPhoneNumber(currentPatientInfo.phone1)
    : "-";
  const addressDisplay = useMemo(() => {
    const address = currentPatientInfo?.address || "";
    const address2 = currentPatientInfo?.address2 || "";
    const combined = [address, address2].filter(Boolean).join(" ").trim();
    return combined || "-";
  }, [currentPatientInfo?.address, currentPatientInfo?.address2]);

  const patientGroupLabel = useMemo(() => {
    const gid = currentPatientInfo?.groupId;
    if (gid == null) return "-";
    const group = patientGroups.find((g) => g.id === gid);
    return group?.name ?? "-";
  }, [currentPatientInfo?.groupId, patientGroups]);

  const privacyConsentLabel = (() => {
    switch (currentPatientInfo?.isPrivacy) {
      case ConsentPrivacyType.동의:
        return "동의";
      case ConsentPrivacyType.거부:
        return "거부";
      case ConsentPrivacyType.미동의:
      default:
        return "미동의";
    }
  })();
  const messageConsentLabel =
    currentPatientInfo?.recvMsg === 1 ? "동의" : "거부";

  const lastVisitText = currentPatientInfo?.lastVisit
    ? formatDate(currentPatientInfo.lastVisit, "-")
    : "-";

  const notPaidAmount = 0;
  const [isDetailExpanded, setIsDetailExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const identityCertificate = useIdentityCertificate({
    patientId: currentPatientInfo?.patientId,
    onSuccess: (data) => {
      if (onUpdateReception && currentPatientInfo) {
        onUpdateReception({
          patientBaseInfo: {
            ...currentPatientInfo,
            ...data,
          } as any,
        });
      }
    },
  });
  const wasChangedOnOpenRef = useRef<boolean | null>(null);

  const patientTypeText =
    (currentPatientInfo as any)?.patientType !== null &&
      (currentPatientInfo as any)?.patientType !== undefined &&
      String((currentPatientInfo as any)?.patientType).trim() !== ""
      ? String((currentPatientInfo as any)?.patientType)
      : "-";

  // TODO: 예약일 (오늘 이후 예약 중 가장 빠른 일자) 연동 필요
  const nextReservationText = currentPatientInfo?.nextAppointmentDateTime
    ? convertUTCtoKST(
      currentPatientInfo.nextAppointmentDateTime,
      "YY-MM-DD HH:mm"
    ) || "-"
    : "-";

  const identityVerifiedAtForModal = useMemo(() => {
    if (!currentPatientInfo?.identityVerifiedAt) return null;
    return formatDate(currentPatientInfo.identityVerifiedAt, "-");
  }, [currentPatientInfo?.identityVerifiedAt]);

  const patientIdentityOptional = Boolean(
    (currentPatientInfo as { identityOptional?: boolean })?.identityOptional
  );

  const Pipe = ({ className = "" }: { className?: string }) => (
    <span className={`text-[var(--border-2)] ${className}`}>|</span>
  );

  const TitleSection = () => {
    return (
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex flex-wrap items-center gap-2 text-sm text-[var(--gray-200)]">
          <span className="rounded-sm bg-[var(--bg-main)] px-1.5 py-0.5 text-[11px] font-bold text-[var(--gray-200)] border border-[var(--border-2)]">
            {patientNo}
          </span>

          <span className="text-base font-semibold text-[var(--gray-200)]">
            {patientName} ({genderText}/{ageText})
          </span>

          <Pipe />

          <span className="text-[14px] text-[var(--gray-200)]">{rrnDisplay}</span>

          <span className="text-[var(--gray-200)]">
            {medicalAidStatus?.type === "success" ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={medicalAidStatus.buttonProps.idYN === 본인확인여부.미완료
                      ? "text-[13px] cursor-pointer underline underline-offset-2 inline-flex items-center gap-1"
                      : "text-[13px] cursor-default underline underline-offset-2 inline-flex items-center gap-1"}
                    style={medicalAidStatus.buttonProps.style}
                    type="button"
                    onClick={
                      medicalAidStatus.buttonProps.idYN === 본인확인여부.미완료
                        ? identityCertificate.handleOpen
                        : undefined
                    }
                  >
                    {medicalAidStatus.buttonProps.idYN === 본인확인여부.미완료 && (
                      <SystemDangerIcon className="w-3 h-3" />
                    )}
                    {medicalAidStatus.buttonProps.idYN === 본인확인여부.완료 && (
                      <SystemSuccessIcon className="w-3 h-3" />
                    )}
                    {본인확인여부Label[medicalAidStatus.buttonProps.idYN]}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  className="bg-white border border-gray-300 shadow-lg p-2 rounded-md [&>svg]:hidden"
                  side="bottom"
                >
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                    <span className="text-[var(--gray-300)] font-medium">
                      최근확인일
                    </span>
                    <span className="text-[var(--gray-100)]">
                      {currentPatientInfo?.identityVerifiedAt
                        ? formatDate(currentPatientInfo.identityVerifiedAt, "-")
                        : "-"}
                    </span>
                    <span className="text-[var(--gray-300)] font-medium">
                      만료일
                    </span>
                    <span className="text-[var(--gray-100)]">
                      {(() => {
                        const verifiedAt = currentPatientInfo?.identityVerifiedAt;
                        if (!verifiedAt) return "-";
                        const verifiedDate = new Date(verifiedAt);
                        const expiryDate = new Date(verifiedDate);
                        expiryDate.setMonth(expiryDate.getMonth() + 6);
                        return formatDate(expiryDate, "-");
                      })()}
                    </span>
                  </div>
                </TooltipContent>
              </Tooltip>
            ) : (
              <></>
            )}
          </span>

          <span className="text-[var(--gray-200)]">
            {medicalAidStatus?.type === "failure" ? (
              <button
                type="button"
                className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                onClick={qualificationCheck.triggerQualificationCheck}
              >
                <SystemDangerIcon className="w-3 h-3" />
                <span className="text-[13px] text-[var(--negative)] underline underline-offset-2 decoration-current">
                  수진자조회 실패
                </span>
              </button>
            ) : medicalAidStatus ? (
              <span className="flex items-center gap-1">
                <SystemSuccessIcon className="w-3 h-3" />
                <span className="text-[13px] text-[var(--positive)] underline underline-offset-2 decoration-current">
                  수진자조회 성공
                </span>
              </span>
            ) : (
              <>              </>
            )}
          </span>

          <Pipe />

          <span className="inline-flex items-center gap-1 whitespace-nowrap text-[var(--gray-200)]">
            미수/환불 {notPaidAmount.toLocaleString()}원
          </span>

        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
              type="button"
            >
              <img src="/moreInfo.svg" alt="더보기" className="w-3 h-3" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-24 rounded-sm border border-[var(--border-1)] bg-white p-1 shadow-md">
                <button
                  className="w-full rounded-sm px-2 py-1 text-left text-xs text-[var(--gray-100)] hover:bg-[var(--bg-1)]"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleOpenEditPopup();
                  }}
                  type="button"
                >
                  수정
                </button>
                <button
                  className="w-full rounded-sm px-2 py-1 text-left text-xs text-[var(--gray-100)] hover:bg-[var(--bg-1)]"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsConsentModalOpen(true);
                  }}
                  type="button"
                >
                  동의서 전송
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DetailSection = () => {
    return (
      <div className="relative flex flex-col gap-1 rounded-md bg-[var(--bg-1)] p-[8px] text-[13px] text-[var(--gray-200)]">
        <button
          type="button"
          className="absolute right-1 top-1 text-[var(--gray-200)] hover:opacity-80"
          onClick={() => setIsDetailExpanded((prev) => !prev)}
          aria-label={isDetailExpanded ? "세부 접기" : "세부 펼치기"}
        >
          {isDetailExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {/* 간략/세부 공통 1행 */}
        <div className="flex flex-wrap items-center gap-2 pr-6">
          <span>{phoneDisplay}</span>
          <Pipe />
          <span className="inline-flex items-center gap-1">
            <MasterDataIcon className="w-4 h-4" />
            {patientGroupLabel}
          </span>
          <Pipe />
          <span className="text-[var(--gray-300)]">최근내원 {lastVisitText}</span>
          <Pipe />
          <span className="text-[var(--negative)]">
            예약 {nextReservationText}
          </span>
        </div>

        {isDetailExpanded && (
          <>
            {/* 2행: 주소 */}
            <div className="text-[var(--gray-200)]">{addressDisplay}</div>

            {/* 3행: 환자유형 / 동의 */}
            <div className="flex flex-wrap items-center gap-2">
              <span>{patientTypeText}</span>
              <Pipe />
              <span className="inline-flex items-center gap-1">
                개인정보수집:
                {privacyConsentLabel === "동의" && (
                  <>
                    <CheckDefaultIcon className="w-4 h-4" />
                    동의
                  </>
                )}
                {privacyConsentLabel === "거부" && (
                  <>
                    <SystemDangerIcon className="w-4 h-4" />
                    <span className="text-[var(--negative)]">거부</span>
                  </>
                )}
                {privacyConsentLabel === "미동의" && (
                  <button
                    type="button"
                    className="underline underline-offset-2 cursor-pointer"
                    style={{ color: "var(--negative)" }}
                    onClick={() => setIsConsentModalOpen(true)}
                  >
                    미동의
                  </button>
                )}
              </span>
              <Pipe />
              <span className="inline-flex items-center gap-1">
                메시지 수집:
                {messageConsentLabel === "동의" && (
                  <CheckDefaultIcon className="w-4 h-4" />
                )}
                {messageConsentLabel}
              </span>
            </div>
          </>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isMenuOpen]);

  useEffect(() => {
    // 팝업이 닫히면 다음 오픈을 위해 스냅샷을 초기화
    if (!isEditPopupOpen) {
      wasChangedOnOpenRef.current = null;
      return;
    }

    // IMPORTANT: "팝업 오픈 전 dirty 스냅샷"은 오픈 시점 1회만 캡처해야 한다.
    // /medical의 로컬 dirtyController는 dirty 변화에 따라 객체 identity가 바뀔 수 있어
    // effect가 재실행될 수 있으므로, 이미 캡처한 스냅샷은 절대 덮어쓰지 않는다.
    if (wasChangedOnOpenRef.current === null) {
      wasChangedOnOpenRef.current = activeReceptionId
        ? dirty.hasChanges(activeReceptionId)
        : null;
    }

  }, [isEditPopupOpen, activeReceptionId, dirty]);

  const handleOpenEditPopup = useCallback(() => {
    setIsEditPopupOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!currentPatientInfo) return;

    const baseReception = externalReception;
    if (!baseReception) {
      showError("환자 정보가 없습니다.");
      return;
    }

    // 환자 필수 입력 항목 검증 (환자명, 주민등록번호)
    const patientBaseInfo = {
      ...baseReception.patientBaseInfo,
      ...currentPatientInfo,
    };
    if (patientBaseInfo.name?.trim() === "") {
      showError(VALIDATE_MSG.RECEPTION.NAME_REQUIRED);
      return;
    }
    if (patientBaseInfo.rrn?.trim() === "") {
      showError(VALIDATE_MSG.RECEPTION.RRN_REQUIRED);
      return;
    }

    const patientId =
      currentPatientInfo?.patientId ??
      baseReception.patientBaseInfo?.patientId ??
      "0";
    if (
      !patientId ||
      patientId === "0" ||
      patientId === "new" ||
      String(patientId).trim() === ""
    ) {
      showError("환자 ID가 없습니다.");
      return;
    }

    const patientIdNumber = Number(patientId);
    if (!Number.isInteger(patientIdNumber) || patientIdNumber <= 0) {
      showError(`유효하지 않은 환자 ID입니다: ${patientId}`);
      return;
    }

    const mergedReception = {
      ...baseReception,
      patientBaseInfo: {
        ...baseReception.patientBaseInfo,
        ...currentPatientInfo,
      },
    };

    if (onUpdateReception) {
      onUpdateReception({
        patientBaseInfo: {
          ...mergedReception.patientBaseInfo,
        } as any,
      });
    }

    try {
      setIsSaving(true);
      const updatePatient = setPatientBaseInfo(mergedReception as Reception);
      await updatePatientMutation.mutateAsync({
        patientId: patientIdNumber,
        updatePatient,
      });

      // 저장 성공 후에만 dirty 상태를 "팝업 오픈 전 상태"로 복원한다.
      // - 오픈 전 false였다면: 이번 저장으로 발생한 dirty를 해제 + baseline을 최신 스냅샷으로 올린다.
      // - 오픈 전 true였다면: 기존에 이미 unsaved가 있었으므로 true를 유지한다.
      if (activeReceptionId && wasChangedOnOpenRef.current !== null) {
        if (wasChangedOnOpenRef.current) {
          if (!dirty.hasChanges(activeReceptionId)) {
            dirty.markChanged(activeReceptionId);
          }
        } else {
          dirty.markUnchanged(activeReceptionId, mergedReception);
        }
      }

      showSuccess("환자 정보가 저장되었습니다.");
      setIsEditPopupOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "환자 정보 저장에 실패했습니다.";
      showError(message);
    } finally {
      setIsSaving(false);
    }
  }, [
    currentPatientInfo,
    externalReception,
    onUpdateReception,
    externalReceptionId,
    dirty,
    setPatientBaseInfo,
    updatePatientMutation,
    showError,
    showSuccess,
    activeReceptionId,
  ]);

  return (
    <div
      className="flex flex-col w-full gap-2 rounded-sm bg-[var(--bg-main)] p-2 text-[var(--gray-200)]"
    >
      <TitleSection />
      <DetailSection />
      <MyPopup
        isOpen={isEditPopupOpen}
        onCloseAction={() => setIsEditPopupOpen(false)}
        title="기본 정보 수정"
        closeOnOutsideClick={false}
        fitContent={false}
        width="720px"
        height="380px"
        localStorageKey="view-basic-info-edit-popup"
      >
        <div className="flex flex-col gap-2">
          <BasicInfo
            reception={externalReception}
            receptionId={externalReceptionId}
            onUpdateReception={onUpdateReception}
          />
          <div className="flex justify-end gap-2 border-t border-[var(--border-1)] pt-2">
            <button
              className="rounded-sm border border-[var(--border-1)] px-5 py-1.5 text-sm text-[var(--gray-200)] hover:bg-[var(--bg-1)]"
              onClick={() => setIsEditPopupOpen(false)}
              type="button"
              disabled={isSaving}
            >
              취소
            </button>
            <button
              className="rounded-sm bg-[var(--main-color)] px-5 py-1.5 text-sm text-[var(--bg-main)] hover:opacity-90 disabled:opacity-60"
              onClick={handleSave}
              type="button"
              disabled={isSaving}
            >
              저장
            </button>
          </div>
        </div>
      </MyPopup>
      {/* 본인확인 모달 (공통 훅/컴포넌트) */}
      {currentPatientInfo && (
        <IdentityCertificateModal
          isOpen={identityCertificate.isOpen}
          onClose={identityCertificate.close}
          onConfirm={identityCertificate.handleConfirm}
          onCheck={identityCertificate.handleCheck}
          recentCheckDate={identityVerifiedAtForModal ?? undefined}
          identityOptional={patientIdentityOptional}
        />
      )}
      {/* 자격조회 관련 모달 (NHIC, 본인확인, 로딩 오버레이) */}
      <QualificationCheckModals
        qualificationCheck={qualificationCheck}
        tempEligibilityData={tempEligibilityData}
        loading={qualificationLoading}
      />
      {/* 동의서 전송 모달 */}
      {currentPatientInfo?.patientId && (
        <ConsentRequestModal
          isOpen={isConsentModalOpen}
          onClose={() => setIsConsentModalOpen(false)}
          patientId={Number(currentPatientInfo.patientId)}
          patientName={currentPatientInfo.name}
        />
      )}
    </div>
  );
}

