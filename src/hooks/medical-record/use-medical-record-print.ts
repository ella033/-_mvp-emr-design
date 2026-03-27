"use client";

import { useMutation } from "@tanstack/react-query";
import { printMedicalRecordImageViaApi } from "@/lib/medical-record";
import type { MedicalRecordData } from "@/lib/medical-record";
import type { PrintResult } from "@/lib/label-printer";

export interface MedicalRecordPrintPayload {
  data: MedicalRecordData;
  copies?: number;
}

export interface UseMedicalRecordPrintReturn {
  isPrinting: boolean;
  print: (payload: MedicalRecordPrintPayload) => Promise<PrintResult>;
}

const DEFAULT_COPIES = 1;

export function useMedicalRecordPrint(): UseMedicalRecordPrintReturn {
  const mutation = useMutation({
    mutationFn: async (payload: MedicalRecordPrintPayload): Promise<PrintResult> => {
      const copies = payload.copies ?? DEFAULT_COPIES;

      return await printMedicalRecordImageViaApi(payload.data, {
        copies,
      });
    },
  });

  const print = async (payload: MedicalRecordPrintPayload) => {
    return await mutation.mutateAsync(payload);
  };

  return {
    isPrinting: mutation.isPending,
    print,
  };
}
