/**
 * Agent DUR Hook
 * DUR API를 쉽게 사용할 수 있는 React Hook
 */

import { useState, useCallback } from "react";
import {
  AgentDurService,
  type DurCheckRequest,
  type DurCancelRequest,
  type PregnancyCheckRequest,
  type AgeLimitCheckRequest,
} from "@/services/agent/agent-dur-service";

interface DurState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAgentDur() {
  const [durCheckState, setDurCheckState] = useState<DurState<any>>({
    data: null,
    loading: false,
    error: null,
  });

  const [pregnancyCheckState, setPregnancyCheckState] = useState<DurState<any>>(
    {
      data: null,
      loading: false,
      error: null,
    }
  );

  const [ageLimitCheckState, setAgeLimitCheckState] = useState<DurState<any>>({
    data: null,
    loading: false,
    error: null,
  });

  const [durCancelState, setDurCancelState] = useState<DurState<any>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * DUR 점검 실행
   */
  const checkDur = useCallback(
    async (hospitalCode: string, request: DurCheckRequest) => {
      setDurCheckState({ data: null, loading: true, error: null });
      try {
        const data = await AgentDurService.checkDur(hospitalCode, request);
        setDurCheckState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setDurCheckState({ data: null, loading: false, error: err });
        throw err;
      }
    },
    []
  );

  /**
   * DUR 점검 취소 실행
   */
  const cancelDur = useCallback(
    async (hospitalCode: string, request: DurCancelRequest) => {
      setDurCancelState({ data: null, loading: true, error: null });
      try {
        const data = await AgentDurService.cancelDur(hospitalCode, request);
        setDurCancelState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setDurCancelState({ data: null, loading: false, error: err });
        throw err;
      }
    },
    [],
  );

  /**
   * 임부금기 점검 실행
   */
  const checkPregnancy = useCallback(
    async (hospitalCode: string, request: PregnancyCheckRequest) => {
      setPregnancyCheckState({ data: null, loading: true, error: null });
      try {
        const data = await AgentDurService.checkPregnancy(
          hospitalCode,
          request
        );
        setPregnancyCheckState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setPregnancyCheckState({ data: null, loading: false, error: err });
        throw err;
      }
    },
    []
  );

  /**
   * 연령제한 점검 실행
   */
  const checkAgeLimit = useCallback(
    async (hospitalCode: string, request: AgeLimitCheckRequest) => {
      setAgeLimitCheckState({ data: null, loading: true, error: null });
      try {
        const data = await AgentDurService.checkAgeLimit(hospitalCode, request);
        setAgeLimitCheckState({ data, loading: false, error: null });
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setAgeLimitCheckState({ data: null, loading: false, error: err });
        throw err;
      }
    },
    []
  );

  return {
    // DUR 점검
    durCheck: {
      ...durCheckState,
      execute: checkDur,
    },
    // DUR 점검 취소
    durCancel: {
      ...durCancelState,
      execute: cancelDur,
    },
    // 임부금기 점검
    pregnancyCheck: {
      ...pregnancyCheckState,
      execute: checkPregnancy,
    },
    // 연령제한 점검
    ageLimitCheck: {
      ...ageLimitCheckState,
      execute: checkAgeLimit,
    },
  };
}
