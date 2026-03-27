import { useCallback, useEffect, useState } from "react";
import {
  consentTemplatesApi,
  type ConsentTemplate,
  type CreateConsentTemplatePayload,
} from "../api/consent-templates.api";

const DEFAULT_ERROR_MESSAGE =
  "데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";

export function useConsentManagement() {
  const [templates, setTemplates] = useState<ConsentTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await consentTemplatesApi.getAll();
      setTemplates(res.data);
    } catch (err) {
      console.error(err);
      setError(DEFAULT_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runMutation = useCallback(async (task: () => Promise<void>) => {
    setIsMutating(true);
    setError(null);
    try {
      await task();
      return true;
    } catch (err) {
      console.error(err);
      setError("작업 처리 중 오류가 발생했습니다.");
      return false;
    } finally {
      setIsMutating(false);
    }
  }, []);

  const createTemplate = useCallback(
    async (payload: CreateConsentTemplatePayload) => {
      const ok = await runMutation(async () => {
        await consentTemplatesApi.create(payload);
        await load();
      });
      return ok;
    },
    [load, runMutation]
  );

  const toggleActive = useCallback(
    async (id: number, isActive: boolean) => {
      const ok = await runMutation(async () => {
        const updated = isActive
          ? await consentTemplatesApi.activate(id)
          : await consentTemplatesApi.deactivate(id);
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, isActive: updated.isActive } : t))
        );
      });
      return ok;
    },
    [runMutation]
  );

  return {
    templates,
    isLoading,
    isMutating,
    error,
    reload: load,
    createTemplate,
    toggleActive,
  };
}
