import { EligibilityService } from "@/services/eligibility-service";
import { useMutation, useQuery } from "@tanstack/react-query";
import { components } from "@/generated/api/types";

export function useEligibility(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["eligibility", id],
    queryFn: () => EligibilityService.getEligibility(id),
    enabled: enabled && !!id,
  });
};

export function useCreateEligibility(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (data: any) => EligibilityService.createEligibility(data),
    ...options,
  });
};

export function useQualifications(data: {
  sujinjaJuminNo: string;
  sujinjaJuminNm: string;
  diagDt: Date;
  ykiho: string;
  msgType: string;
  idYN?: boolean | false;
}) {
  return useQuery({
    queryKey: ["qualifications", data],
    queryFn: () => EligibilityService.getQualifications({
      sujinjaJuminNo: data.sujinjaJuminNo,
      sujinjaJuminNm: data.sujinjaJuminNm,
      diagDt: data.diagDt,
      ykiho: data.ykiho,
      msgType: data.msgType,
      idYN: data.idYN,
    }),
  });
};

export function useUpdateEligibility(id: string, options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (data: any) => EligibilityService.updateEligibility(id, data),
    ...options,
  });
};

export function useDeleteEligibility(id: string, options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: (id: string) => EligibilityService.deleteEligibility(id),
    ...options,
  });
};