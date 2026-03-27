import { useMutation } from "@tanstack/react-query";
import { TemplateCodeService } from "@/services/template-code-service";
import type { UpdateTemplateCodeRequest } from "@/types/template-code-types";

export function useTemplateCodeUpdate(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}) {
  return useMutation({
    mutationFn: (data: { id: number } & UpdateTemplateCodeRequest) =>
      TemplateCodeService.updateTemplateCode(data.id, data),
    ...options,
  });
}

