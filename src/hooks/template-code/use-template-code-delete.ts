import { useMutation } from "@tanstack/react-query";
import { TemplateCodeService } from "@/services/template-code-service";

export function useTemplateCodeDelete(options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) {
  return useMutation({
    mutationFn: async (id: number) => {
      return await TemplateCodeService.deleteTemplateCode(id);
    },
    ...options,
  });
}
