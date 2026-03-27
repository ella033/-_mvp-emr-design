/**
 * 환자 라벨 출력 Hook
 *
 * 환자 라벨 출력 다이얼로그의 상태 관리 및 출력 로직을 담당합니다.
 * (로컬: 라벨 프린터 / 운영: API 출력)
 */

"use client";

import { useMemo, useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { PRINT_QUANTITY, getCurrentPrintDateTime } from "@/lib/label-printer";
import { printPatientLabelImageViaApi, printPatientLabelLocal } from "@/lib/label-printer";
import type { Gender, LabelData, PrintResult } from "@/lib/label-printer";

export type PatientLabelPrintMode = "local" | "api";

export interface UsePatientLabelPrintOptions {
  patient: {
    chartNumber: string;
    patientName: string;
    age: number;
    gender: Gender;
    birthDate: string; // YYYY-MM-DD
  };
  agentId?: string;
  printerName?: string;
  printMode?: PatientLabelPrintMode;
}

export interface UsePatientLabelPrintReturn {
  quantity: number;
  canPrint: boolean;
  isPrinting: boolean;
  increase: () => void;
  decrease: () => void;
  setQuantity: (value: number) => void;
  print: () => Promise<PrintResult>;
  /** 로컬(이 PC) 프린터로 출력 */
  printLocal: () => Promise<PrintResult>;
  /** 에이전트(API)를 통해 출력 */
  printViaApi: () => Promise<PrintResult>;
  labelData: LabelData;
}

export function usePatientLabelPrint({
  patient,
  agentId,
  printerName = "Printer1",
  printMode,
}: UsePatientLabelPrintOptions): UsePatientLabelPrintReturn {
  const [quantity, setQuantityState] = useState<number>(PRINT_QUANTITY.DEFAULT);

  const createLabelData = useCallback((): LabelData => {
    return {
      chartNumber: patient.chartNumber,
      patientName: patient.patientName,
      age: patient.age,
      gender: patient.gender,
      birthDate: patient.birthDate,
      printDateTime: getCurrentPrintDateTime(),
    };
  }, [patient]);

  const labelData = useMemo<LabelData>(() => createLabelData(), [createLabelData]);

  const canPrint = useMemo(() => {
    return Boolean(patient.chartNumber) && Boolean(patient.patientName) && quantity > 0;
  }, [patient.chartNumber, patient.patientName, quantity]);

  const resolvedPrintMode: PatientLabelPrintMode = useMemo(() => {
    if (printMode) return printMode;
    return agentId ? "api" : "local";
  }, [agentId, printMode]);

  const mutation = useMutation({
    mutationFn: async (payload: { copies: number; mode?: PatientLabelPrintMode }) => {
      const data = createLabelData();
      const mode = payload.mode ?? resolvedPrintMode;

      if (mode === "local") {
        return await printPatientLabelLocal(printerName, data, payload.copies);
      }

      return await printPatientLabelImageViaApi(data, {
        agentId,
        copies: payload.copies,
      });
    },
  });

  const setQuantity = useCallback((value: number) => {
    const clamped = clampQuantity(value);
    setQuantityState(clamped);
  }, []);

  const increase = useCallback(() => {
    setQuantityState((prev) => clampQuantity(prev + 1));
  }, []);

  const decrease = useCallback(() => {
    setQuantityState((prev) => clampQuantity(prev - 1));
  }, []);

  const print = useCallback(async (): Promise<PrintResult> => {
    if (!canPrint) {
      return { success: false, message: "출력할 수 없습니다. 환자 정보와 출력 매수를 확인해주세요." };
    }

    return await mutation.mutateAsync({
      copies: quantity,
    });
  }, [canPrint, mutation, quantity]);

  const printLocal = useCallback(async (): Promise<PrintResult> => {
    if (!canPrint) {
      return { success: false, message: "출력할 수 없습니다. 환자 정보와 출력 매수를 확인해주세요." };
    }
    return await mutation.mutateAsync({ copies: quantity, mode: "local" });
  }, [canPrint, mutation, quantity]);

  const printViaApi = useCallback(async (): Promise<PrintResult> => {
    if (!canPrint) {
      return { success: false, message: "출력할 수 없습니다. 환자 정보와 출력 매수를 확인해주세요." };
    }
    return await mutation.mutateAsync({ copies: quantity, mode: "api" });
  }, [canPrint, mutation, quantity]);

  return {
    quantity,
    canPrint,
    isPrinting: mutation.isPending,
    increase,
    decrease,
    setQuantity,
    print,
    printLocal,
    printViaApi,
    labelData,
  };
}

function clampQuantity(value: number): number {
  return Math.max(PRINT_QUANTITY.MIN, Math.min(PRINT_QUANTITY.MAX, value));
}


