import { useQuery } from "@tanstack/react-query";
import { TemplateCodeService } from "@/services/template-code-service";

export const useTemplateCodes = () => {
  return useQuery({
    queryKey: ["template-codes"],
    queryFn: () => TemplateCodeService.getTemplateCodes(),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

export const useTemplateCodeByCode = (code: string) => {
  return useQuery({
    queryKey: ["template-codes", code],
    queryFn: () => TemplateCodeService.getTemplateCodeByCode(code),
    enabled: !!code,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
