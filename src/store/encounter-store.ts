import { create } from "zustand";
import { syncWithBroadcast } from "@/lib/broadcast-sync";
import { postGridCommand } from "@/lib/grid-command-channel";
import type { DiseaseBase } from "@/types/chart/disease-types";
import type { OrderBase } from "@/types/chart/order-types";
import type { Bundle } from "@/types/master-data/bundle/bundle-type";
import type { Encounter } from "@/types/chart/encounter-types";
import type { SpecificDetail } from "@/types/chart/specific-detail-code-type";
import type { PciCheckResult } from "@/types/pci/pci-types";
import type { SelfCheckDetail, SelfCheckResultData } from "@/types/chart-check/chart-check-types";

type EncounterState = {
  selectedEncounter: Encounter | null;
  setSelectedEncounter: (encounter: Encounter | null) => void;
  updateSelectedEncounter: (updates: Partial<Encounter>) => void;
  encounters: Encounter[] | null;
  setEncounters: (encounters: Encounter[] | null) => void;
  /** 리스트에서 encounter 제거 (삭제 성공 시 호출, 최신 state 기준으로 제거) */
  removeEncounter: (encounterId: string) => void;
  updateEncounters: (encounter: Encounter) => void;
  draftEncounterSummary: string;
  setDraftEncounterSummary: (encounterSummary: string) => void;
  draftClinicalMemo: string;
  setDraftClinicalMemo: (clinicalMemo: string) => void;
  draftSymptom: string;
  setDraftSymptom: (symptom: string) => void;
  /** 명세서 단위 특정내역 (특정내역 팝업·번들 추가 시 동일 값 유지, code 기준 upsert) */
  draftStatementSpecificDetail: SpecificDetail[];
  setDraftStatementSpecificDetail: (details: SpecificDetail[]) => void;
  /** code 기준으로 머지 (같은 code면 덮어쓰기) */
  mergeDraftStatementSpecificDetail: (details: SpecificDetail[]) => void;
  newSymptom: string | null;
  setNewSymptom: (symptom: string | null) => void;
  newDiseases: DiseaseBase[] | null;
  setNewDiseases: (diseases: DiseaseBase[] | null) => void;
  newOrders: OrderBase[] | null;
  setNewOrders: (orders: OrderBase[] | null) => void;
  newBundle: Bundle | null;
  setNewBundle: (bundle: Bundle | null) => void;
  isEncounterDataChanged: boolean;
  setIsEncounterDataChanged: (isEncounterDataChanged: boolean) => void;
  // 저장 함수 참조 (patient-status-list에서 저장 호출 가능하도록)
  saveEncounterFn: (() => Promise<void>) | null;
  setSaveEncounterFn: (fn: (() => Promise<void>) | null) => void;
  // PCI 실시간점검 결과
  pciCheckResults: PciCheckResult[];
  setPciCheckResults: (results: PciCheckResult[]) => void;
  removePciCheckResult: (msgid: string) => void;
  clearPciCheckResults: () => void;
  // 자체점검 결과
  chartCheckResults: SelfCheckDetail[];
  setChartCheckResults: (results: SelfCheckDetail[]) => void;
  removeChartCheckResult: (idx: number) => void;
  clearChartCheckResults: () => void;
};

export const useEncounterStore = create<EncounterState>(
  syncWithBroadcast("encounter-store", (set) => ({
  selectedEncounter: null,
  setSelectedEncounter: (encounter: Encounter | null) =>
    set(() => ({
      selectedEncounter: encounter,
      // selectedEncounter 변경 시 draftSymptom도 초기화
      draftSymptom: encounter?.symptom ?? "",
      draftStatementSpecificDetail: encounter?.specificDetail ?? [],
      pciCheckResults: encounter?.pciCheckResultData ?? [],
      chartCheckResults: (encounter?.chartCheckResultData as SelfCheckResultData)?.점검상세s ?? [],
    })),
  updateSelectedEncounter: (updates: Partial<Encounter>) =>
    set((state) => ({
      selectedEncounter: state.selectedEncounter
        ? { ...state.selectedEncounter, ...updates }
        : null,
    })),
  encounters: null,
  setEncounters: (encounters: Encounter[] | null) => set(() => ({ encounters: encounters })),
  removeEncounter: (encounterId: string) =>
    set((state) => {
      const nextEncounters = state.encounters?.filter((e) => e.id !== encounterId) || null;
      const clearSelection = state.selectedEncounter?.id === encounterId;
      return {
        encounters: nextEncounters,
        ...(clearSelection && { selectedEncounter: null }),
      };
    }),
  updateEncounters: (encounter: Encounter) =>
    set((state) => ({
      encounters: state.encounters?.map((e) => (e.id === encounter.id ? encounter : e)),
    })),
  draftEncounterSummary: "",
  setDraftEncounterSummary: (encounterSummary) =>
    set(() => ({ draftEncounterSummary: encounterSummary })),
  draftClinicalMemo: "",
  setDraftClinicalMemo: (clinicalMemo) => set(() => ({ draftClinicalMemo: clinicalMemo })),
  draftSymptom: "",
  setDraftSymptom: (symptom) =>
    set((state) => {
      // 초기값(selectedEncounter.symptom)과 비교하여 변경 여부 확인
      const initialSymptom = state.selectedEncounter?.symptom ?? "";
      const isSymptomChanged = symptom !== initialSymptom;

      return {
        draftSymptom: symptom,
        // 증상이 변경되었으면 isEncounterDataChanged를 true로 설정
        // 이미 true이면 유지 (다른 곳에서 변경되었을 수 있음)
        isEncounterDataChanged: state.isEncounterDataChanged || isSymptomChanged,
      };
    }),
  draftStatementSpecificDetail: [],
  setDraftStatementSpecificDetail: (details) =>
    set(() => ({
      draftStatementSpecificDetail: details,
      isEncounterDataChanged: true,
    })),
  mergeDraftStatementSpecificDetail: (details) =>
    set((state) => {
      if (!details?.length) return state;
      const byCode = new Map(state.draftStatementSpecificDetail.map((d) => [d.code, d]));
      details.forEach((d) => byCode.set(d.code, d));
      return {
        draftStatementSpecificDetail: Array.from(byCode.values()),
        isEncounterDataChanged: true,
      };
    }),
  newSymptom: null,
  setNewSymptom: (symptom) => set(() => ({ newSymptom: symptom })),
  newDiseases: null,
  setNewDiseases: (diseases) => {
    const mapped = diseases?.map((disease) => {
      const { diseaseId, ...rest } = disease as any;
      return {
        ...rest,
        id: undefined,
        ...(diseaseId !== undefined && { diseaseLibraryId: diseaseId }),
      } as DiseaseBase;
    });
    set(() => ({ newDiseases: mapped }));
    // 크로스 윈도우 전달
    if (mapped) {
      postGridCommand({ type: "add-diseases", diseases: mapped });
    }
  },
  newOrders: null,
  setNewOrders: (orders) => {
    const mapped = orders?.map((order) => ({ ...order, id: undefined }));
    set(() => ({ newOrders: mapped }));
    // 크로스 윈도우 전달
    if (mapped) {
      postGridCommand({ type: "add-orders", orders: mapped });
    }
  },
  newBundle: null,
  setNewBundle: (bundle) => {
    set(() => ({ newBundle: bundle }));
    // 크로스 윈도우 전달
    if (bundle) {
      postGridCommand({ type: "add-bundle", bundle });
    }
  },
  isEncounterDataChanged: false,
  setIsEncounterDataChanged: (isEncounterDataChanged: boolean) =>
    set(() => ({ isEncounterDataChanged: isEncounterDataChanged })),
  saveEncounterFn: null,
  setSaveEncounterFn: (fn: (() => Promise<void>) | null) => set(() => ({ saveEncounterFn: fn })),
  // PCI 실시간점검 결과
  pciCheckResults: [],
  setPciCheckResults: (results) => set(() => ({ pciCheckResults: results })),
  removePciCheckResult: (msgid) =>
    set((state) => ({
      pciCheckResults: state.pciCheckResults.filter((r) => r.msgid !== msgid),
    })),
  clearPciCheckResults: () => set(() => ({ pciCheckResults: [] })),
  // 자체점검 결과
  chartCheckResults: [],
  setChartCheckResults: (results) => set(() => ({ chartCheckResults: results })),
  removeChartCheckResult: (idx) =>
    set((state) => ({
      chartCheckResults: state.chartCheckResults.filter((_, i) => i !== idx),
    })),
  clearChartCheckResults: () => set(() => ({ chartCheckResults: [] })),
}), {
  pick: [
    "selectedEncounter", "encounters",
    "draftEncounterSummary", "draftClinicalMemo",
    "draftSymptom", "draftStatementSpecificDetail",
    "isEncounterDataChanged", "pciCheckResults", "chartCheckResults",
    "newSymptom",
  ],
}));
