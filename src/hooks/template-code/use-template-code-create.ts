import { useMutation } from "@tanstack/react-query";
import { TemplateCodeService } from "@/services/template-code-service";
import type { CreateTemplateCodeRequest } from "@/types/template-code-types";

export function useTemplateCodeCreate(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (data: CreateTemplateCodeRequest) => {
      return await TemplateCodeService.createTemplateCode(data);
    },
    ...options,
  });
}

