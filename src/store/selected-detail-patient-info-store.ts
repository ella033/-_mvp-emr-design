import { create } from "zustand";
import type { Registration } from "@/types/registration-types";
import type { InsuranceInfo } from "@/types/common/rc-insurance-type";
import type { PatientBase } from "@/types/patient-types";
import type { MedicalAidBase } from "@/types/medical-aid-types";
export type SelectedDetailPatientInfoType = PatientBase & {
  patientId: number | null;
  family: FamilyPatientInfoType[];
  vital: VitalPatientInfoType[];
  insuranceInfo?: Partial<InsuranceInfo>;
  roomPanel?: string;
  receptionDoctorId?: number | null;
};

export type FamilyPatientInfoType = {
  id: number | null;
  patientFamilyId: number;
  name: string;
  birthDate: string;
  relation: number;
  rrn: string;
  phone1: string;
  phone2: string;
};

export type VitalPatientInfoType = {
  id: string | null;
  measurementDateTime: string;
  itemId: number;
  value: string;
  memo: string;
};

export const INITIAL_SELECTED_DETAIL_PATIENT_INFO: SelectedDetailPatientInfoType =
  {
    patientId: null,
    name: "",
    rrn: "",
    gender: 0,
    phone1: "",
    phone2: "",
    zipcode: "",
    address1: "",
    address2: "",
    idNumber: null,
    idType: null,
    chronicDisease: {
      hypertension: false,
      diabetes: false,
      highCholesterol: false,
    },
    isActive: true,
    hospitalId: null,
    memo: "",
    receptionMemo: "",
    roomPanel: "",
    receptionDoctorId: 0,
    family: [],
    vital: [],
    insuranceInfo: undefined,
    isTemporary: false,
    groupId: null,
  };

type SelectedDetailPatientInfoState = {
  selectedDetailPatientInfo: SelectedDetailPatientInfoType;
  setSelectedDetailPatientInfo: (
    selectedDetailPatientInfo: SelectedDetailPatientInfoType
  ) => void;
  openedRegistrations: Registration[];
  addOpenedRegistration: (patients: Registration) => void;
  removeOpenedRegistration: (id: string) => void;
  openedRegistrationId: string | null;
  setOpenedRegistrationId: (id: string | null) => void;
  isFamilyLoading: boolean;
  setIsFamilyLoading: (isFamilyLoading: boolean) => void;
  isVitalLoading: boolean;
  setIsVitalLoading: (isVitalLoading: boolean) => void;
  // 새로 전체 registrations를 기반으로 openedRegistrations를 덮어씁니다.
  refreshOpenedRegistrations: (registrations: Registration[]) => void;
};

export const useSelectedDetailPatientInfoStore =
  create<SelectedDetailPatientInfoState>((set) => ({
    selectedDetailPatientInfo: INITIAL_SELECTED_DETAIL_PATIENT_INFO,
    setSelectedDetailPatientInfo: (selectedDetailPatientInfo) =>
      set(() => ({ selectedDetailPatientInfo })),
    openedRegistrations: [],
    addOpenedRegistration: (patient) =>
      set((state) => {
        const alreadyExists = state.openedRegistrations.some(
          (p) => p.id === patient.id
        );
        return {
          openedRegistrations: alreadyExists
            ? state.openedRegistrations
            : [...state.openedRegistrations, patient],
          openedRegistrationId: patient.id,
        };
      }),
    removeOpenedRegistration: (id) =>
      set((state) => ({
        openedRegistrations: state.openedRegistrations.filter(
          (p) => p.id !== id
        ),
        openedRegistrationId:
          state.openedRegistrationId === id ? null : state.openedRegistrationId,
      })),
    openedRegistrationId: null,
    setOpenedRegistrationId: (id) =>
      set(() => ({
        openedRegistrationId: id,
      })),
    isFamilyLoading: false,
    setIsFamilyLoading: (isFamilyLoading) => set(() => ({ isFamilyLoading })),
    isVitalLoading: false,
    setIsVitalLoading: (isVitalLoading) => set(() => ({ isVitalLoading })),
    refreshOpenedRegistrations: (registrations) =>
      set((state) => ({
        openedRegistrations: state.openedRegistrations.map(
          (opened) => registrations.find((r) => r.id === opened.id) ?? opened
        ),
      })),
  }));
