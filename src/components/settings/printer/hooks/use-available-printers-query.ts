import { useQuery } from "@tanstack/react-query";
import type { PrinterRecord } from "@/types/printer-types";
import { printerApi } from "../api/printer.api";

const AVAILABLE_PRINTERS_QUERY_KEY = [
  "printers",
  "available",
  { availableOnly: true, includeAgents: true },
] as const;

export function useAvailablePrintersQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: AVAILABLE_PRINTERS_QUERY_KEY,
    queryFn: async (): Promise<PrinterRecord[]> => {
      return await printerApi.getPrinters({
        availableOnly: true,
        includeAgents: true,
      });
    },
    enabled: options?.enabled ?? true,
  });
}

