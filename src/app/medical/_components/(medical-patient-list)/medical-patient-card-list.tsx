"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import MedicalPatientCard from "./medical-patient-card";
import MedicalPatientAppointmentCard from "./medical-patient-appointment-card";
import type { PatientListPosition } from "./medical-patient-list";
import { useReceptionStore } from "@/store/common/reception-store";
import { RegistrationsService } from "@/services/registrations-service";
import type { Registration } from "@/types/registration-types";
import type { Patient } from "@/types/patient-types";
import type { Encounter } from "@/types/chart/encounter-types";
import { 접수상태 } from "@/constants/common/common-enum";
import { useUpdateRegistration } from "@/hooks/registration/use-update-registration";
import { useUserStore } from "@/store/user-store";
import { useEncounterStore } from "@/store/encounter-store";
import { MyButton } from "@/components/yjg/my-button";
import MyPopup from "@/components/yjg/my-pop-up";
import { useToastHelpers } from "@/components/ui/toast";
import { createEncounter, getEncounter, getLatestEncounter } from "@/lib/encounter-util";
import { useQueryClient } from "@tanstack/react-query";
import type { Appointment } from "@/types/appointments/appointments";
import { MyTabs } from "@/components/yjg/my-tabs";
import { useUpdatePatient } from "@/hooks/patient/use-update-patient";
import MedicalPatientListClinicMemo from "./medical-patient-list-clinic-memo";

export type PatientListTabType = {
  key: number;
  name: string;
  statusArr: number[];
};

export default function MedicalPatientCardList({
  registrations,
  onUpdateRegistrationAction,
  selectedTab,
  selectedDate: _selectedDate,
  appointments,
  setIsPatientStatusOpenAction,
  isPinned,
  listPosition,
}: {
  registrations: Registration[];
  onUpdateRegistrationAction: (id: string, updates: Partial<Registration>) => void;
  selectedTab: PatientListTabType;
  selectedDate: Date;
  appointments?: Appointment[];
  setIsPatientStatusOpenAction: (isPatientStatusOpen: boolean) => void;
  isPinned: boolean;
  listPosition: PatientListPosition;
}) {
  const {
    currentRegistration,
    setCurrentRegistration,
    setCurrentRegistrationExternal,
    updateRegistration: updateRegistrationInStore,
  } = useReceptionStore();
  const { mutate: updateRegistrationApi } = useUpdateRegistration();
  const { user } = useUserStore();
  const {
    setSelectedEncounter,
    isEncounterDataChanged,
    saveEncounterFn,
    setIsEncounterDataChanged,
    setDraftEncounterSummary,
    setDraftClinicalMemo,
  } = useEncounterStore();
  const { success, warning, error } = useToastHelpers();
  const queryClient = useQueryClient();
  const [isUnsavedChangesPopupOpen, setIsUnsavedChangesPopupOpen] =
    useState(false);
  const [pendingRegistration, setPendingRegistration] =
    useState<Registration | null>(null);
  /** true: 호출 버튼으로 열기(진료중 전환), false: 카드 클릭으로 열기(상태 유지) */
  const [pendingProceedFromCallButton, setPendingProceedFromCallButton] =
    useState(false);
  /** true: 미저장 체크 후 차트 생성+열기 플로우 */
  const [pendingCreateChart, setPendingCreateChart] = useState(false);

  /** 진료기록 없을 때 '차트 생성하시겠습니까?' 확인 팝업 */
  const [isCreateChartConfirmOpen, setIsCreateChartConfirmOpen] = useState(false);
  const [pendingRegistrationForCreateChart, setPendingRegistrationForCreateChart] =
    useState<Registration | null>(null);
  const [isCreatingChart, setIsCreatingChart] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  /** 임상메모 팝업 (우클릭 메뉴에서 열림) */
  const [clinicalMemoPopupPatient, setClinicalMemoPopupPatient] =
    useState<Patient | null>(null);

  const { mutateAsync: updatePatientApi } = useUpdatePatient();

  /** 수납 탭(key 3)일 때만 사용: 수납대기 | 수납완료 서브탭 */
  const [paymentSubTab, setPaymentSubTab] = useState<"대기" | "완료">("대기");

  const getInProgressRegistrations = useCallback(
    (excludeRegistrationId?: string): Registration[] => {
      if (!registrations || !user?.id) return [];
      return registrations.filter(
        (reg) =>
          reg.updateId === user.id &&
          reg.status === 접수상태.진료중 &&
          (excludeRegistrationId ? reg.id !== excludeRegistrationId : true)
      );
    },
    [registrations, user?.id]
  );

  const updateRegistrationsToWaiting = useCallback(
    async (
      registrationsToUpdate: Registration[]
    ): Promise<Registration[]> => {
      if (registrationsToUpdate.length === 0) return [];

      const updatePromises = registrationsToUpdate.map(
        (reg) =>
          new Promise<Registration>((resolve, reject) => {
            updateRegistrationApi(
              {
                id: reg.id,
                data: {
                  status: 접수상태.대기,
                },
              },
              {
                onSuccess: (response: Registration) => {
                  onUpdateRegistrationAction(response.id, {
                    status: response.status,
                  });
                  resolve(response);
                },
                onError: (error: Error) => {
                  reject(error);
                },
              }
            );
          })
      );

      try {
        return await Promise.all(updatePromises);
      } catch (error) {
        console.error("[PatientStatusList] 진료중 환자 상태 변경 실패:", error);
        throw error;
      }
    },
    [updateRegistrationApi, onUpdateRegistrationAction]
  );

  useEffect(() => {
    const handleBeforeUnload = () => {
      const inProgressRegistrations = getInProgressRegistrations();
      inProgressRegistrations.forEach((reg) => {
        updateRegistrationApi({
          id: reg.id,
          data: {
            status: 접수상태.대기,
          },
        });
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [getInProgressRegistrations, updateRegistrationApi]);

  const openClickedRegistrationWithoutStatusChange = async (registration: Registration, encounter: Encounter | null, isAppointment: boolean = false) => {
    if (encounter) {
      if (isAppointment) {
        setCurrentRegistrationExternal(registration);
      } else {
        setCurrentRegistration(registration);
      }
      setDraftEncounterSummary(registration.patient?.symptom ?? "");
      setDraftClinicalMemo(registration.patient?.clinicalMemo ?? "");
      setSelectedEncounter(encounter);
      if (!isPinned) {
        setIsPatientStatusOpenAction(false);
      }
    } else {
      warning("진료 이력이 없습니다.");
    }
  };

  const openClickedRegistrationWithStatusChange = async (registration: Registration, encounter: Encounter) => {
    if (!user) {
      error("사용자 정보를 찾을 수 없습니다.");
      return;
    }
    updateRegistrationApi(
      {
        id: registration.id,
        data: {
          status: 접수상태.진료중,
        },
      },
      {
        onSuccess: (response: Registration) => {
          onUpdateRegistrationAction(response.id, {
            status: response.status,
          });
          setCurrentRegistration({
            ...response,
            isNewPatient: response.isNewPatient ?? registration.isNewPatient,
          });
          setDraftEncounterSummary(response.patient?.symptom ?? "");
          setDraftClinicalMemo(response.patient?.clinicalMemo ?? "");
          setSelectedEncounter(encounter);
          if (!isPinned) {
            setIsPatientStatusOpenAction(false);
          }
        },
      }
    );
  };

  const checkUnsavedChanges = (
    registration: Registration,
    fromCallButton: boolean
  ) => {
    if (currentRegistration?.id !== registration.id && isEncounterDataChanged) {
      setPendingRegistration(registration);
      setPendingProceedFromCallButton(fromCallButton);
      setIsUnsavedChangesPopupOpen(true);
      return true;
    }
    return false;
  };

  const handleCloseUnsavedChangesPopup = useCallback(() => {
    setIsUnsavedChangesPopupOpen(false);
    setPendingRegistration(null);
    setPendingProceedFromCallButton(false);
    setPendingCreateChart(false);
  }, []);

  const proceedToPatient = useCallback(
    async (registration: Registration) => {
      const inProgressRegistrations = getInProgressRegistrations(registration.id);
      const encounter = await getEncounter(registration, user, queryClient);

      if (inProgressRegistrations.length > 0) {
        try {
          await updateRegistrationsToWaiting(inProgressRegistrations);
          openClickedRegistrationWithStatusChange(registration, encounter);
        } catch (error) {
          openClickedRegistrationWithStatusChange(registration, encounter);
        }
      } else {
        openClickedRegistrationWithStatusChange(registration, encounter);
      }
    },
    [
      getInProgressRegistrations,
      user,
      queryClient,
      updateRegistrationsToWaiting,
      openClickedRegistrationWithStatusChange,
    ]
  );

  /** 차트 생성 후 바로 해당 차트를 열기 */
  const createAndOpenChart = async (registration: Registration) => {
    try {
      const createResponse = await createEncounter(registration, user, queryClient);
      if (createResponse) {
        // store의 registration.encounters를 즉시 갱신하여 isEncounterExist가 바로 반영되도록 함
        updateRegistrationInStore(registration.id, {
          encounters: [
            {
              id: createResponse.id,
              encounterDateTime: new Date().toISOString(),
              calcResultData: null,
            },
          ],
        });
        // 생성된 차트의 전체 Encounter 정보를 가져와서 열기
        const fullEncounter = await getLatestEncounter(registration.patientId, registration);
        openClickedRegistrationWithoutStatusChange(registration, fullEncounter);
      }
      success(`${registration.patient?.name}님의 차트가 생성되었습니다.`);
    } catch (err) {
      error("차트 생성에 실패했습니다.");
    }
  };

  const proceedWithPendingRegistration = useCallback(async () => {
    if (!pendingRegistration) return;
    if (pendingCreateChart) {
      // 차트 생성 + 열기 플로우
      setPendingCreateChart(false);
      await createAndOpenChart(pendingRegistration);
    } else if (pendingProceedFromCallButton) {
      await proceedToPatient(pendingRegistration);
    } else {
      const encounter = await getEncounter(
        pendingRegistration,
        user,
        queryClient
      );
      openClickedRegistrationWithoutStatusChange(
        pendingRegistration,
        encounter
      );
    }
    setPendingRegistration(null);
    setPendingProceedFromCallButton(false);
  }, [
    pendingRegistration,
    pendingProceedFromCallButton,
    pendingCreateChart,
    user,
    queryClient,
    proceedToPatient,
    openClickedRegistrationWithoutStatusChange,
    createAndOpenChart,
  ]);

  const handleSaveAndProceed = async () => {
    if (!saveEncounterFn || !pendingRegistration) return;

    setIsSaving(true);
    try {
      await saveEncounterFn();
      success("저장되었습니다.");
      handleCloseUnsavedChangesPopup();
      await proceedWithPendingRegistration();
    } catch (err) {
      error("저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardAndProceed = async () => {
    if (!pendingRegistration) return;

    setIsEncounterDataChanged(false);
    handleCloseUnsavedChangesPopup();
    await proceedWithPendingRegistration();
  };

  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];
    return registrations
      .filter((registration) =>
        selectedTab.statusArr.includes(registration.status)
      );

  }, [registrations, selectedTab.statusArr]);

  /** 수납 탭일 때 서브탭별 접수 목록 (수납대기 / 수납완료) */
  const paymentFilteredRegistrations = useMemo(() => {
    if (selectedTab.key !== 3) return [];
    const targetStatus =
      paymentSubTab === "대기" ? 접수상태.수납대기 : 접수상태.수납완료;
    return filteredRegistrations.filter((reg) => reg.status === targetStatus);
  }, [selectedTab.key, paymentSubTab, filteredRegistrations]);

  /** 수납 탭일 때 대기/완료 인원 수 (medical-patient-list 탭 스타일용) */
  const paymentCounts = useMemo(() => {
    if (selectedTab.key !== 3 || !filteredRegistrations.length) {
      return { 대기: 0, 완료: 0 };
    }
    const 대기 = filteredRegistrations.filter(
      (reg) => reg.status === 접수상태.수납대기
    ).length;
    const 완료 = filteredRegistrations.filter(
      (reg) => reg.status === 접수상태.수납완료
    ).length;
    return { 대기, 완료 };
  }, [selectedTab.key, filteredRegistrations]);

  const handleCreateChartConfirm = async () => {
    if (!pendingRegistrationForCreateChart || !user) {
      if (!user) error("사용자 정보를 찾을 수 없습니다.");
      setIsCreateChartConfirmOpen(false);
      setPendingRegistrationForCreateChart(null);
      return;
    }
    setIsCreatingChart(true);
    try {
      const encounter = await getEncounter(
        pendingRegistrationForCreateChart,
        user,
        queryClient
      );
      openClickedRegistrationWithoutStatusChange(
        pendingRegistrationForCreateChart,
        encounter
      );
    } catch (err) {
      error("차트 생성에 실패했습니다.");
    } finally {
      setIsCreatingChart(false);
      setIsCreateChartConfirmOpen(false);
      setPendingRegistrationForCreateChart(null);
    }
  };

  const handleCreateChartCancel = () => {
    setIsCreateChartConfirmOpen(false);
    setPendingRegistrationForCreateChart(null);
  };

  /** 우클릭 메뉴: 보류 (대기 → 보류) */
  const handleHold = useCallback(
    (registration: Registration) => {
      updateRegistrationApi(
        { id: registration.id, data: { status: 접수상태.보류 } },
        {
          onSuccess: (response: Registration) => {
            onUpdateRegistrationAction(response.id, { status: response.status });
          },
          onError: () => {
            error("보류 처리에 실패했습니다.");
          },
        }
      );
    },
    [updateRegistrationApi, onUpdateRegistrationAction, error]
  );

  /** 우클릭 메뉴: 진료대기 (보류 → 대기) */
  const handleReturnToWaiting = useCallback(
    (registration: Registration) => {
      updateRegistrationApi(
        { id: registration.id, data: { status: 접수상태.대기 } },
        {
          onSuccess: (response: Registration) => {
            onUpdateRegistrationAction(response.id, { status: response.status });
          },
          onError: () => {
            error("진료대기 복귀에 실패했습니다.");
          },
        }
      );
    },
    [updateRegistrationApi, onUpdateRegistrationAction, error]
  );

  /** 우클릭 메뉴: 임상메모 팝업 열기 */
  const handleClinicalMemoOpen = useCallback((registration: Registration) => {
    const p = registration.patient ?? null;
    if (p) setClinicalMemoPopupPatient(p);
  }, []);

  const handleClinicalMemoSave = useCallback(
    async (patient: Patient, clinicalMemo: string) => {
      try {
        await updatePatientApi({
          patientId: patient.id,
          updatePatient: { clinicalMemo },
        });
        const updatedPatient = { ...patient, clinicalMemo };
        registrations
          .filter(
            (reg) =>
              reg.patientId === patient.id || reg.patient?.id === patient.id
          )
          .forEach((reg) => {
            onUpdateRegistrationAction(reg.id, { patient: updatedPatient });
            updateRegistrationInStore(reg.id, { patient: updatedPatient });
          });
        success("임상메모가 저장되었습니다.");
        setClinicalMemoPopupPatient(null);
      } catch {
        error("임상메모 저장에 실패했습니다.");
      }
    },
    [
      updatePatientApi,
      registrations,
      onUpdateRegistrationAction,
      updateRegistrationInStore,
      success,
      error,
    ]
  );

  const handleCardClick = async (registration: Registration) => {
    if (checkUnsavedChanges(registration, false)) return;
    const encounter = await getLatestEncounter(registration.patientId, registration);
    if (encounter) {
      openClickedRegistrationWithoutStatusChange(registration, encounter);
    } else {
      setPendingRegistrationForCreateChart(registration);
      setIsCreateChartConfirmOpen(true);
    }
  };

  const handleCallClick = async (registration: Registration) => {
    if (checkUnsavedChanges(registration, true)) return;
    proceedToPatient(registration);
  };

  const handleAppointmentClick = async (appointment: Appointment) => {
    const patientId = appointment.patient?.id;
    if (patientId == null) {
      error("환자 정보를 찾을 수 없습니다.");
      return;
    }
    const encounter = await getLatestEncounter(patientId);
    if (!encounter) {
      warning("진료 이력이 없습니다.");
      return;
    }
    const registration = await RegistrationsService.getRegistration(
      String(encounter.registrationId)
    );
    if (!registration) {
      warning("진료 이력이 없습니다.");
      return;
    }
    if (checkUnsavedChanges(registration, false)) return;
    openClickedRegistrationWithoutStatusChange(registration, encounter, true);
  };

  /** 우클릭 메뉴: 차트생성 (미저장 변경사항 체크 포함) */
  const handleCreateChart = async (registration: Registration) => {
    // 현재 차트에 미저장 변경사항이 있으면 다이얼로그 표시
    if (currentRegistration?.id !== registration.id && isEncounterDataChanged) {
      setPendingRegistration(registration);
      setPendingProceedFromCallButton(false);
      setPendingCreateChart(true);
      setIsUnsavedChangesPopupOpen(true);
      return;
    }
    // 미저장 없으면 바로 차트 생성+열기
    await createAndOpenChart(registration);
  };

  if (selectedTab.key === 3) {
    const tabLabelClass = "text-[12px] text-[var(--gray-100)] font-[500]";
    const tabCountClass = "text-[12px] text-[var(--second-color)] font-[700]";
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <MyTabs<"대기" | "완료">
          tabs={[
            {
              key: "대기",
              label: (
                <div className="flex items-center justify-center gap-[4px]">
                  <span className={tabLabelClass}>대기</span>
                  <span className={tabCountClass}>{paymentCounts.대기}</span>
                </div>
              ),
            },
            {
              key: "완료",
              label: (
                <div className="flex items-center justify-center gap-[4px]">
                  <span className={tabLabelClass}>완료</span>
                  <span className={tabCountClass}>{paymentCounts.완료}</span>
                </div>
              ),
            },
          ]}
          activeTab={paymentSubTab}
          onTabChange={setPaymentSubTab}
          variant="underline"
          size="sm"
          className="shrink-0"
          fullWidth={true}
        />
        <div className="flex flex-col flex-1 my-scroll min-h-0">
          {paymentFilteredRegistrations.map((registration) => (
            <MedicalPatientCard
              key={registration.id}
              registration={registration}
              onCardClick={() => handleCardClick(registration)}
              onCallClick={() => handleCallClick(registration)}
              isSelected={currentRegistration?.id === registration.id}
              listPosition={listPosition}
              onHoldClick={() => handleHold(registration)}
              onReturnToWaitingClick={() => handleReturnToWaiting(registration)}
              onClinicalMemoClick={() => handleClinicalMemoOpen(registration)}
            />
          ))}
          {paymentFilteredRegistrations.length === 0 && (
            <div className="flex items-center justify-center h-32 text-[var(--gray-40)]">
              환자 내역이 없습니다.
            </div>
          )}
        </div>
        <SharedPopups
          isUnsavedChangesPopupOpen={isUnsavedChangesPopupOpen}
          onCloseUnsavedChangesPopup={handleCloseUnsavedChangesPopup}
          handleDiscardAndProceed={handleDiscardAndProceed}
          handleSaveAndProceed={handleSaveAndProceed}
          isSaving={isSaving}
          isCreateChartConfirmOpen={isCreateChartConfirmOpen}
          onConfirmCreateChart={handleCreateChartConfirm}
          onCancelCreateChart={handleCreateChartCancel}
          isCreatingChart={isCreatingChart}
          clinicalMemoPopupPatient={clinicalMemoPopupPatient}
          onCloseClinicalMemo={() => setClinicalMemoPopupPatient(null)}
          onSaveClinicalMemo={handleClinicalMemoSave}
        />
      </div>
    );
  }

  if (selectedTab.key === 4) {
    return (
      <div className="flex flex-col flex-1 my-scroll">
        {appointments?.map((appointment) => (
          <MedicalPatientAppointmentCard
            key={appointment.id}
            appointment={appointment}
            onClickAction={() => handleAppointmentClick(appointment)}
            isSelected={currentRegistration?.patientId === appointment.patient?.id}
            listPosition={listPosition}
            onClinicalMemoClickAction={
              appointment.patient
                ? () => setClinicalMemoPopupPatient(appointment.patient!)
                : undefined
            }
          />
        ))}
        {(!appointments || appointments.length === 0) && (
          <div className="flex items-center justify-center h-32 text-[var(--gray-40)]">
            예약 내역이 없습니다.
          </div>
        )}
        <SharedPopups
          isUnsavedChangesPopupOpen={isUnsavedChangesPopupOpen}
          onCloseUnsavedChangesPopup={handleCloseUnsavedChangesPopup}
          handleDiscardAndProceed={handleDiscardAndProceed}
          handleSaveAndProceed={handleSaveAndProceed}
          isSaving={isSaving}
          isCreateChartConfirmOpen={isCreateChartConfirmOpen}
          onConfirmCreateChart={handleCreateChartConfirm}
          onCancelCreateChart={handleCreateChartCancel}
          isCreatingChart={isCreatingChart}
          clinicalMemoPopupPatient={clinicalMemoPopupPatient}
          onCloseClinicalMemo={() => setClinicalMemoPopupPatient(null)}
          onSaveClinicalMemo={handleClinicalMemoSave}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 my-scroll">
      {filteredRegistrations.map((registration) => (
        <MedicalPatientCard
          key={registration.id}
          registration={registration}
          onCardClick={() => handleCardClick(registration)}
          onCallClick={() => handleCallClick(registration)}
          isSelected={currentRegistration?.id === registration.id}
          listPosition={listPosition}
          onHoldClick={() => handleHold(registration)}
          onReturnToWaitingClick={() => handleReturnToWaiting(registration)}
          onCreateChartClick={() => handleCreateChart(registration)}
          onClinicalMemoClick={() => handleClinicalMemoOpen(registration)}
        />
      ))}
      {filteredRegistrations.length === 0 && (
        <div className="flex items-center justify-center h-32 text-[var(--gray-40)]">
          환자 내역이 없습니다.
        </div>
      )}
      <SharedPopups
        isUnsavedChangesPopupOpen={isUnsavedChangesPopupOpen}
        onCloseUnsavedChangesPopup={handleCloseUnsavedChangesPopup}
        handleDiscardAndProceed={handleDiscardAndProceed}
        handleSaveAndProceed={handleSaveAndProceed}
        isSaving={isSaving}
        isCreateChartConfirmOpen={isCreateChartConfirmOpen}
        onConfirmCreateChart={handleCreateChartConfirm}
        onCancelCreateChart={handleCreateChartCancel}
        isCreatingChart={isCreatingChart}
        clinicalMemoPopupPatient={clinicalMemoPopupPatient}
        onCloseClinicalMemo={() => setClinicalMemoPopupPatient(null)}
        onSaveClinicalMemo={handleClinicalMemoSave}
      />
    </div>
  );
}



function SharedPopups({
  isUnsavedChangesPopupOpen,
  onCloseUnsavedChangesPopup,
  handleDiscardAndProceed,
  handleSaveAndProceed,
  isSaving,
  isCreateChartConfirmOpen,
  onConfirmCreateChart,
  onCancelCreateChart,
  isCreatingChart,
  clinicalMemoPopupPatient,
  onCloseClinicalMemo,
  onSaveClinicalMemo,
}: {
  isUnsavedChangesPopupOpen: boolean;
  onCloseUnsavedChangesPopup: () => void;
  handleDiscardAndProceed: () => void;
  handleSaveAndProceed: () => void;
  isSaving: boolean;
  isCreateChartConfirmOpen: boolean;
  onConfirmCreateChart: () => void;
  onCancelCreateChart: () => void;
  isCreatingChart: boolean;
  clinicalMemoPopupPatient: Patient | null;
  onCloseClinicalMemo: () => void;
  onSaveClinicalMemo: (patient: Patient, clinicalMemo: string) => Promise<void>;
}) {
  return (
    <>
      <UnsavedChangesPopup
        isUnsavedChangesPopupOpen={isUnsavedChangesPopupOpen}
        onCloseAction={onCloseUnsavedChangesPopup}
        handleDiscardAndProceed={handleDiscardAndProceed}
        handleSaveAndProceed={handleSaveAndProceed}
        isSaving={isSaving}
      />
      <CreateChartConfirmPopup
        isOpen={isCreateChartConfirmOpen}
        onConfirm={onConfirmCreateChart}
        onCancel={onCancelCreateChart}
        isCreating={isCreatingChart}
      />
      <MedicalPatientListClinicMemo
        patient={clinicalMemoPopupPatient}
        onClose={onCloseClinicalMemo}
        onSave={onSaveClinicalMemo}
      />
    </>
  );
}

function UnsavedChangesPopup({
  isUnsavedChangesPopupOpen,
  onCloseAction,
  handleDiscardAndProceed,
  handleSaveAndProceed,
  isSaving,
}: {
  isUnsavedChangesPopupOpen: boolean;
  onCloseAction: () => void;
  handleDiscardAndProceed: () => void;
  handleSaveAndProceed: () => void;
  isSaving: boolean;
}) {
  return (
    <MyPopup
      isOpen={isUnsavedChangesPopupOpen}
      onCloseAction={onCloseAction}
      hideHeader={true}
      fitContent={true}
    >
      <div className="flex flex-col gap-[20px] min-w-[300px]">
        <div className="flex-1 flex flex-col gap-1 px-2 py-1">
          <div className="text-base text-[var(--text-primary)]">
            진단 및 처방 데이터가 변경되었습니다. 저장하시겠습니까?
          </div>
        </div>
        <div className="flex justify-end gap-[10px]">
          <MyButton variant="outline" onClick={onCloseAction}>
            취소
          </MyButton>
          <MyButton
            variant="outline"
            onClick={handleDiscardAndProceed}
            disabled={isSaving}
          >
            저장 안 함
          </MyButton>
          <MyButton onClick={handleSaveAndProceed} disabled={isSaving}>
            {isSaving ? "저장 중..." : "저장"}
          </MyButton>
        </div>
      </div>
    </MyPopup>
  );
}

function CreateChartConfirmPopup({
  isOpen,
  onConfirm,
  onCancel,
  isCreating,
}: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isCreating?: boolean;
}) {
  return (
    <MyPopup
      isOpen={isOpen}
      onCloseAction={onCancel}
      hideHeader={true}
      fitContent={true}
    >
      <div className="flex flex-col gap-[20px] min-w-[300px]">
        <div className="flex-1 flex flex-col gap-1 px-2 py-1">
          <div className="text-base text-[var(--text-primary)]">
            진료기록이 없습니다. 차트를 생성하시겠습니까?
          </div>
        </div>
        <div className="flex justify-end gap-[10px]">
          <MyButton variant="outline" onClick={onCancel} disabled={isCreating}>
            취소
          </MyButton>
          <MyButton onClick={onConfirm} disabled={isCreating}>
            {isCreating ? "생성 중..." : "확인"}
          </MyButton>
        </div>
      </div>
    </MyPopup>
  );
}
