"use client";

/**
 * 검사 라벨 출력 Hook
 *
 * 검사 라벨 출력 다이얼로그의 상태 관리 및 출력 로직을 담당합니다.
 * 로컬 출력 및 API를 통한 원격 출력을 모두 지원합니다.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { getMockSpecimensByEncounter, getMockSpecimenMaster } from "@/mocks/examination-label";
import {
  printExaminationLabels,
  printExaminationLabelsViaApi,
  getTotalQuantity,
  PRINT_QUANTITY,
  LabelContentType,
} from "@/lib/label-printer";
import type { PatientInfo, Specimen, SpecimenPrintItem, PrintResult, LabelApiPrintOptions } from "@/lib/label-printer";

/**
 * 라벨 출력 모드
 */
export type LabelPrintMode = "local" | "api";

export interface UseExaminationLabelPrintOptions {
  /** 진료 ID */
  encounterId: string;
  /** 환자 정보(외부에서 주입) */
  patientOverride?: PatientInfo;
  /** 초기 선택 검체(외부에서 주입) */
  initialPrintItems?: SpecimenPrintItem[];
  /** 프린터 이름 (로컬 출력 시 사용) */
  printerName?: string;
  /** 출력 모드 (기본값: local) */
  printMode?: LabelPrintMode;
  /** API 출력 옵션 (printMode가 'api'일 때 사용) */
  apiOptions?: Omit<LabelApiPrintOptions, "copies">;
}

export interface UseExaminationLabelPrintReturn {
  /** 환자 정보 */
  patient: PatientInfo | null;
  /** 출력할 검체 목록 */
  printItems: SpecimenPrintItem[];
  /** 검체 마스터 목록 (추가용) */
  specimenMaster: Specimen[];
  /** 로딩 상태 */
  isLoading: boolean;
  /** 출력 중 상태 */
  isPrinting: boolean;
  /** 총 출력 매수 */
  totalQuantity: number;
  /** 출력 가능 여부 */
  canPrint: boolean;
  /** 로컬 출력 가능 여부 */
  canPrintLocal: boolean;
  /** API(에이전트) 출력 가능 여부 */
  canPrintApi: boolean;
  /** 현재 출력 모드 */
  printMode: LabelPrintMode;
  /** 수량 변경 */
  updateQuantity: (specimenCode: string, quantity: number) => void;
  /** 검체 추가 */
  addSpecimen: (specimen: Specimen) => void;
  /** 검체 제거 */
  removeSpecimen: (specimenCode: string) => void;
  /** 출력할 검체 목록 일괄 설정 (처방된 검사 목록 등) */
  setPrintItems: (items: SpecimenPrintItem[]) => void;
  /** 출력 실행 (현재 모드에 따라 로컬 또는 API 출력) */
  print: () => Promise<PrintResult>;
  /** 로컬 프린터로 출력 */
  printLocal: () => Promise<PrintResult>;
  /** API를 통한 원격 출력 (이미지 방식) */
  printViaApi: (options?: Partial<LabelApiPrintOptions>) => Promise<PrintResult>;
  /** 데이터 새로고침 (목업 데이터로 초기화) */
  refresh: () => void;
}

export function useExaminationLabelPrint({
  encounterId,
  patientOverride,
  initialPrintItems,
  printerName = "Printer1",
  printMode: initialPrintMode = "local",
  apiOptions,
}: UseExaminationLabelPrintOptions): UseExaminationLabelPrintReturn {
  // 상태 관리
  const [patient, setPatient] = useState<PatientInfo | null>(patientOverride ?? null);
  const [printItems, setPrintItems] = useState<SpecimenPrintItem[]>([]);
  const [specimenMaster, setSpecimenMaster] = useState<Specimen[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [currentPrinterName] = useState(printerName);
  const [printMode] = useState<LabelPrintMode>(initialPrintMode);

  // 데이터 로드
  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      // Mock 데이터 사용 (API 개발 후 실제 API 호출로 교체)
      const { patient: patientData, specimens } = getMockSpecimensByEncounter(encounterId);
      const master = getMockSpecimenMaster();

      setPatient(patientOverride ?? patientData);
      setPrintItems(initialPrintItems ?? specimens);
      setSpecimenMaster(master);
    } finally {
      setIsLoading(false);
    }
  }, [encounterId, initialPrintItems, patientOverride]);

  // 초기 데이터 로드
  useEffect(function initializeData() {
    loadData();
  }, [loadData]);

  // 수량 변경
  const updateQuantity = useCallback((specimenCode: string, quantity: number) => {
    const clampedQuantity = Math.max(
      PRINT_QUANTITY.MIN,
      Math.min(PRINT_QUANTITY.MAX, quantity)
    );

    setPrintItems((prev) =>
      prev.map((item) =>
        item.specimenCode === specimenCode
          ? { ...item, quantity: clampedQuantity }
          : item
      )
    );
  }, []);

  // 검체 추가
  const addSpecimen = useCallback((specimen: Specimen) => {
    setPrintItems((prev) => {
      // 이미 추가된 검체인지 확인
      const exists = prev.some((item) => item.specimenCode === specimen.specimenCode);
      if (exists) {
        return prev;
      }

      return [
        ...prev,
        {
          ...specimen,
          quantity: PRINT_QUANTITY.DEFAULT,
        },
      ];
    });
  }, []);

  // 검체 제거
  const removeSpecimen = useCallback((specimenCode: string) => {
    setPrintItems((prev) => prev.filter((item) => item.specimenCode !== specimenCode));
  }, []);

  // 출력 목록 일괄 설정 (처방된 검사 목록 등)
  const setPrintItemsFromParent = useCallback((items: SpecimenPrintItem[]) => {
    setPrintItems(Array.isArray(items) ? items : []);
  }, []);

  // 총 출력 매수
  const totalQuantity = useMemo(() => getTotalQuantity(printItems), [printItems]);

  // 출력 가능 여부 (로컬 모드)
  const canPrintLocal = printItems.length > 0 && totalQuantity > 0;

  // 출력 가능 여부 (API 모드)
  const canPrintApi = printItems.length > 0 && totalQuantity > 0;

  // 출력 가능 여부 (현재 모드에 따라)
  const canPrint = useMemo(
    () => (printMode === "local" ? canPrintLocal : canPrintApi),
    [printMode, canPrintLocal, canPrintApi]
  );

  // 로컬 출력 실행
  const printLocal = useCallback(async (): Promise<PrintResult> => {
    if (!patient) {
      return { success: false, message: "환자 정보가 없습니다." };
    }

    if (!currentPrinterName) {
      return { success: false, message: "프린터가 선택되지 않았습니다." };
    }

    if (printItems.length === 0) {
      return { success: false, message: "출력할 검체가 없습니다." };
    }

    setIsPrinting(true);
    try {
      const result = await printExaminationLabels(currentPrinterName, patient, printItems);
      return result;
    } finally {
      setIsPrinting(false);
    }
  }, [patient, currentPrinterName, printItems]);

  const printViaApiMutation = useMutation({
    mutationFn: async (overrideOptions?: Partial<LabelApiPrintOptions>) => {
      if (!patient) {
        return { success: false, message: "환자 정보가 없습니다." } satisfies PrintResult;
      }

      if (printItems.length === 0) {
        return { success: false, message: "출력할 검체가 없습니다." } satisfies PrintResult;
      }

      const mergedOptions: LabelApiPrintOptions = {
        agentId: overrideOptions?.agentId ?? apiOptions?.agentId,
        contentType:
          overrideOptions?.contentType ??
          apiOptions?.contentType ??
          LabelContentType.IMAGE_PNG,
        // copies는 실제 라벨 매수(specimen.quantity)로 처리되며, 여기서는 사용하지 않음
        copies: overrideOptions?.copies,
        printerId: overrideOptions?.printerId ?? apiOptions?.printerId,
      };

      return await printExaminationLabelsViaApi(patient, printItems, mergedOptions);
    },
  });

  // API를 통한 원격 출력
  const printViaApi = useCallback(
    async (overrideOptions?: Partial<LabelApiPrintOptions>): Promise<PrintResult> => {
      setIsPrinting(true);
      try {
        return await printViaApiMutation.mutateAsync(overrideOptions);
      } finally {
        setIsPrinting(false);
      }
    },
    [printViaApiMutation]
  );

  // 통합 출력 함수 (현재 모드에 따라 실행)
  const print = useCallback(async (): Promise<PrintResult> => {
    if (printMode === "api") {
      return printViaApi();
    }
    return printLocal();
  }, [printMode, printLocal, printViaApi]);

  return {
    patient,
    printItems,
    specimenMaster,
    isLoading,
    isPrinting,
    totalQuantity,
    canPrint,
    canPrintLocal,
    canPrintApi,
    printMode,
    updateQuantity,
    addSpecimen,
    removeSpecimen,
    setPrintItems: setPrintItemsFromParent,
    print,
    printLocal,
    printViaApi,
    refresh: loadData,
  };
}
