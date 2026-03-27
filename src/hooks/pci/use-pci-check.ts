import { useMutation } from "@tanstack/react-query";
import { PciApiService } from "@/services/pci-api-service";
import type {
  PciResultInfoBody,
  PciResultInfoResponse,
  PciResultGosiBody,
  PciResultGosiResponse,
} from "@/types/pci/pci-types";

/** 관련상병/항목 조회 (msgtyp S/O) */
export function usePciResultInfo(options?: {
  onSuccess?: (data: PciResultInfoResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (body: PciResultInfoBody) => PciApiService.getResultInfo(body),
    ...options,
  });
}

/** 고시정보 조회 (msgtyp G) */
export function usePciResultGosi(options?: {
  onSuccess?: (data: PciResultGosiResponse) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (body: PciResultGosiBody) => PciApiService.getResultGosi(body),
    ...options,
  });
}
