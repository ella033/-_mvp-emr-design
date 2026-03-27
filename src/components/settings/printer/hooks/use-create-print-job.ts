import { useMutation } from "@tanstack/react-query";
import { printerApi } from "../api/printer.api";
import type { OutputTypeCode } from "@/types/printer-types";

type CreatePrintJobParams = {
  printerId: string;
  payload: {
    outputTypeCode: OutputTypeCode;
    contentType: string;
    fileName?: string;
    contentBase64?: string;
    contentUrl?: string;
    copies?: number;
    options?: Record<string, unknown>;
    targetAgentId?: string;
  };
};

export function useCreatePrintJob() {
  return useMutation({
    mutationFn: async ({ printerId, payload }: CreatePrintJobParams) => {
      return await printerApi.createPrintJob(printerId, payload);
    },
  });
}

