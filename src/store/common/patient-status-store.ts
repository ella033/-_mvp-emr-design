import type { PatientStatus } from "@/types/common/patient-status-type";
import { ChronicTypes } from "@/constants/common/common-enum";
import { ChronicDisease } from "@/types/chart/chronic-disease";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

// 환자 상태 정보 전역 상태 관리

type PatientStatusState = {
  // 기본 상태
  patientStatuses: PatientStatus[];
  selectedPatientStatusId: number | null;
  isLoading: boolean;
  error: string | null;

  // 액션들
  setPatientStatuses: (patientStatuses: PatientStatus[]) => void;
  addPatientStatus: (patientStatus: PatientStatus) => void;
  updatePatientStatus: (
    id: number,
    patientStatus: Partial<PatientStatus>
  ) => void;
  removePatientStatus: (id: number) => void;
  setSelectedPatientStatusId: (id: number | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed 변수들 (실제로 필요한 것들만)
  getSelectedPatientStatus: () => PatientStatus | null;
  getPatientStatusById: (id: number) => PatientStatus | null;

  // 복잡한 통계 계산
  getPatientCount: () => number;
  getAverageAge: () => number;
  getChronicDiseaseStats: () => {
    hypertension: number;
    diabetes: number;
    dyslipidemia: number;
    total: number;
  };

  // 만성질환 상태 업데이트 헬퍼 함수
  updatePatientChronicDisease: (
    patientId: number,
    chronicType: ChronicTypes,
    hasDisease: boolean
  ) => void;
};

// chronicFlags에서 computed 필드들을 계산하는 헬퍼 함수
const setChronicFlagsComputedFields = (chronicFlags: ChronicDisease) => {
  return {
    isHypertension: chronicFlags.hypertension || false,
    isDiabetes: chronicFlags.diabetes || false,
    isHighCholesterol: chronicFlags.highCholesterol || false,
  };
};

export const usePatientStatusStore = create<PatientStatusState>()(
  devtools(
    (set, get) => ({
      // 기본 상태
      patientStatuses: [],
      selectedPatientStatusId: null,
      isLoading: false,
      error: null,

      // 액션들
      setPatientStatuses: (patientStatuses) =>
        set(() => ({ patientStatuses }), false, "setPatientStatuses"),

      addPatientStatus: (patientStatus) =>
        set(
          (state) => {
            // chronicFlags가 있는 경우 computed 필드들도 자동 계산
            let finalPatientStatus = patientStatus;
            if (patientStatus.chronicFlags) {
              const computedFields = setChronicFlagsComputedFields(
                patientStatus.chronicFlags
              );
              finalPatientStatus = { ...patientStatus, ...computedFields };
            }

            return {
              patientStatuses: [...state.patientStatuses, finalPatientStatus],
            };
          },
          false,
          "addPatientStatus"
        ),

      updatePatientStatus: (id, patientStatus) =>
        set(
          (state) => ({
            patientStatuses: state.patientStatuses.map((ps) => {
              if (ps.patient.id === id) {
                const updatedPatientStatus = { ...ps, ...patientStatus };

                if (patientStatus.chronicFlags) {
                  const computedFields = setChronicFlagsComputedFields(
                    patientStatus.chronicFlags
                  );
                  return { ...updatedPatientStatus, ...computedFields };
                }

                return updatedPatientStatus;
              }
              return ps;
            }),
          }),
          false,
          "updatePatientStatus"
        ),

      removePatientStatus: (id) =>
        set(
          (state) => ({
            patientStatuses: state.patientStatuses.filter(
              (ps) => ps.patient.id !== id
            ),
          }),
          false,
          "removePatientStatus"
        ),

      setSelectedPatientStatusId: (id) =>
        set(
          () => ({ selectedPatientStatusId: id }),
          false,
          "setSelectedPatientStatusId"
        ),

      setLoading: (loading) =>
        set(() => ({ isLoading: loading }), false, "setLoading"),

      setError: (error) => set(() => ({ error }), false, "setError"),

      getSelectedPatientStatus: () => {
        const { patientStatuses, selectedPatientStatusId } = get();
        if (!selectedPatientStatusId) return null;
        return (
          patientStatuses.find(
            (ps) => ps.patient.id === selectedPatientStatusId
          ) || null
        );
      },

      getPatientStatusById: (id) => {
        const { patientStatuses } = get();
        return patientStatuses.find((ps) => ps.patient.id === id) || null;
      },

      getPatientCount: () => {
        const { patientStatuses } = get();
        return patientStatuses.length;
      },

      // 만성질환 상태 업데이트 헬퍼 함수
      updatePatientChronicDisease: (
        patientId: number,
        chronicType: ChronicDisease
      ) => {
        const { patientStatuses } = get();
        const updatedStatuses = patientStatuses.map((ps) => {
          if (ps.patient.id === patientId) {
            const newChronicFlags = { ...ps.chronicFlags };
            const computedFields =
              setChronicFlagsComputedFields(newChronicFlags);

            return {
              ...ps,
              chronicFlags: newChronicFlags,
              ...computedFields,
            };
          }
          return ps;
        });
        set(
          { patientStatuses: updatedStatuses },
          false,
          "updatePatientChronicDisease"
        );
      },
    }),
    {
      name: "patient-status-store",
    }
  )
);
