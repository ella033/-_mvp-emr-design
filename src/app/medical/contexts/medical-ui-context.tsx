"use client";

import type { 청구 } from "@/constants/common/common-enum";
import type { MyTreeGridRowType } from "@/components/yjg/my-tree-grid/my-tree-grid-type";
import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface EncounterHistoryFilterState {
  searchWord: string;
  isFavorite: boolean;
  초재진구분: string | null;
  청구여부: 청구 | null;
  보험구분: string | null;
  isExam: string | number | null;
  isInjection: string | number | null;
  isMedication: string | number | null;
  isRadiology: string | number | null;
  isPhysicalTreatment: string | number | null;
}

export interface DiagnosisPrescriptionGridSnapshot {
  diagnosisGridData: MyTreeGridRowType[];
  prescriptionGridData: MyTreeGridRowType[];
}

interface MedicalUiContextValue {
  isPatientStatusOpen: boolean;
  setIsPatientStatusOpen: (open: boolean) => void;

  encounterHistoryFilters: EncounterHistoryFilterState;
  setEncounterHistoryFilters: (
    patch: Partial<EncounterHistoryFilterState>
  ) => void;
  resetEncounterHistoryFilters: (options?: {
    expandEncounterId?: string;
  }) => void;

  /** 저장 후 필터 리셋 시 encounter-history에서 열어둘 encounter id (사용 후 null로 초기화) */
  expandEncounterIdAfterFiltersReset: string | null;
  setExpandEncounterIdAfterFiltersReset: (id: string | null) => void;

  /** 현재 진단/처방 그리드 스냅샷 (getTreeData 기준, 묶음 추가 시 사용) */
  diagnosisPrescriptionGridSnapshotRef: React.MutableRefObject<
    (() => DiagnosisPrescriptionGridSnapshot | null) | null
  >;

  /** rc-dock 탭 포커스 (tabId를 받아 해당 탭을 활성화) */
  focusTabRef: React.MutableRefObject<((tabId: string) => void) | null>;
}

const defaultEncounterHistoryFilters: EncounterHistoryFilterState = {
  searchWord: "",
  isFavorite: false,
  초재진구분: null,
  청구여부: null,
  보험구분: null,
  isExam: null,
  isInjection: null,
  isMedication: null,
  isRadiology: null,
  isPhysicalTreatment: null,
};

const MedicalUiContext = createContext<MedicalUiContextValue | undefined>(
  undefined
);

export function MedicalUiProvider({ children }: { children: ReactNode }) {
  const [isPatientStatusOpen, setIsPatientStatusOpenState] = useState(false);
  const [encounterHistoryFilters, setEncounterHistoryFiltersState] =
    useState<EncounterHistoryFilterState>(defaultEncounterHistoryFilters);
  const [expandEncounterIdAfterFiltersReset, setExpandEncounterIdAfterFiltersReset] =
    useState<string | null>(null);
  const diagnosisPrescriptionGridSnapshotRef = useRef<
    (() => DiagnosisPrescriptionGridSnapshot | null) | null
  >(null);
  const focusTabRef = useRef<((tabId: string) => void) | null>(null);

  const setIsPatientStatusOpen = useCallback((open: boolean) => {
    setIsPatientStatusOpenState(open);
  }, []);

  const setEncounterHistoryFilters = useCallback(
    (patch: Partial<EncounterHistoryFilterState>) => {
      setEncounterHistoryFiltersState((prev) => ({
        ...prev,
        ...patch,
      }));
    },
    []
  );

  const resetEncounterHistoryFilters = useCallback(
    (options?: { expandEncounterId?: string }) => {
      setEncounterHistoryFiltersState(defaultEncounterHistoryFilters);
      if (options?.expandEncounterId) {
        setExpandEncounterIdAfterFiltersReset(options.expandEncounterId);
      }
    },
    []
  );

  const value: MedicalUiContextValue = {
    isPatientStatusOpen,
    setIsPatientStatusOpen,
    encounterHistoryFilters,
    setEncounterHistoryFilters,
    resetEncounterHistoryFilters,
    expandEncounterIdAfterFiltersReset,
    setExpandEncounterIdAfterFiltersReset,
    diagnosisPrescriptionGridSnapshotRef,
    focusTabRef,
  };

  return (
    <MedicalUiContext.Provider value={value}>
      {children}
    </MedicalUiContext.Provider>
  );
}

export function useMedicalUi(): MedicalUiContextValue {
  const ctx = useContext(MedicalUiContext);
  if (!ctx) {
    throw new Error("useMedicalUi must be used within MedicalUiProvider");
  }
  return ctx;
}
